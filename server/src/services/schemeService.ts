import db from '../config/database.js';
import type {
    Scheme,
    SchemeRow,
    SearchQuery,
    PaginatedResponse,
    SchemeWithScore
} from '../types/index.js';

// ============================================
// Helper Functions
// ============================================

function rowToScheme(row: SchemeRow): Scheme {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        details: row.details || '',
        benefits: row.benefits || '',
        eligibility: row.eligibility || '',
        application: row.application || '',
        documents: row.documents || '',
        level: row.level as 'Central' | 'State',
        category: row.category || '',
        tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        state: row.state || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ============================================
// CRUD Operations
// ============================================

export function getAllSchemes(page = 1, limit = 20): PaginatedResponse<Scheme> {
    const offset = (page - 1) * limit;

    const countResult = db.prepare('SELECT COUNT(*) as total FROM schemes').get() as { total: number };
    const total = countResult.total;

    const rows = db.prepare(`
    SELECT * FROM schemes 
    ORDER BY name ASC 
    LIMIT ? OFFSET ?
  `).all(limit, offset) as SchemeRow[];

    return {
        data: rows.map(rowToScheme),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export function getSchemeById(id: number): Scheme | null {
    const row = db.prepare('SELECT * FROM schemes WHERE id = ?').get(id) as SchemeRow | undefined;
    return row ? rowToScheme(row) : null;
}

export function getSchemeBySlug(slug: string): Scheme | null {
    const row = db.prepare('SELECT * FROM schemes WHERE slug = ?').get(slug) as SchemeRow | undefined;
    return row ? rowToScheme(row) : null;
}

export function searchSchemes(query: SearchQuery): PaginatedResponse<Scheme> {
    const {
        query: searchText,
        category,
        state,
        level,
        tags,
        page = 1,
        limit = 20
    } = query;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Full-text search
    if (searchText && searchText.trim()) {
        conditions.push(`
      id IN (
        SELECT rowid FROM schemes_fts 
        WHERE schemes_fts MATCH ?
      )
    `);
        // Escape special FTS characters and create search query
        const ftsQuery = searchText
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2)
            .map(w => `"${w}"*`)
            .join(' OR ');
        params.push(ftsQuery || `"${searchText}"`);
    }

    // Category filter
    if (category && category !== 'all') {
        conditions.push('category LIKE ?');
        params.push(`%${category}%`);
    }

    // State filter
    if (state && state !== 'all') {
        conditions.push('(state = ? OR level = ?)');
        params.push(state, 'Central');
    }

    // Level filter
    if (level && level !== 'all') {
        conditions.push('level = ?');
        params.push(level);
    }

    // Tags filter
    if (tags && tags.length > 0) {
        const tagConditions = tags.map(() => 'tags LIKE ?');
        conditions.push(`(${tagConditions.join(' OR ')})`);
        tags.forEach(tag => params.push(`%${tag}%`));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM schemes ${whereClause}`;
    const countResult = db.prepare(countSql).get(...params) as { total: number };
    const total = countResult.total;

    // Data query
    const dataSql = `
    SELECT * FROM schemes 
    ${whereClause}
    ORDER BY name ASC 
    LIMIT ? OFFSET ?
  `;
    const rows = db.prepare(dataSql).all(...params, limit, offset) as SchemeRow[];

    return {
        data: rows.map(rowToScheme),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// ============================================
// Smart Search (Keyword-based with scoring)
// ============================================

export function smartSearch(
    keywords: string[],
    filters: Partial<SearchQuery> = {},
    page = 1,
    limit = 20
): PaginatedResponse<SchemeWithScore> {
    const offset = (page - 1) * limit;

    if (keywords.length === 0) {
        const result = getAllSchemes(page, limit);
        return {
            data: result.data.map(s => ({ ...s, relevanceScore: 0 })),
            pagination: result.pagination,
        };
    }

    // Build keyword matching query with scoring
    const keywordParams = keywords.map(() => '?').join(', ');
    const keywordConditions = keywords.map(() =>
        `(LOWER(name) LIKE ? OR LOWER(details) LIKE ? OR LOWER(benefits) LIKE ? OR LOWER(eligibility) LIKE ? OR LOWER(tags) LIKE ?)`
    ).join(' OR ');

    const filterConditions: string[] = [];
    const filterParams: (string | number)[] = [];

    if (filters.category && filters.category !== 'all') {
        filterConditions.push('category LIKE ?');
        filterParams.push(`%${filters.category}%`);
    }

    if (filters.state && filters.state !== 'all') {
        filterConditions.push('(state = ? OR level = ?)');
        filterParams.push(filters.state, 'Central');
    }

    if (filters.level && filters.level !== 'all') {
        filterConditions.push('level = ?');
        filterParams.push(filters.level);
    }

    const filterClause = filterConditions.length > 0
        ? `AND ${filterConditions.join(' AND ')}`
        : '';

    // Prepare keyword params (each keyword needs 5 params for 5 fields)
    const allKeywordParams: string[] = [];
    keywords.forEach(kw => {
        const pattern = `%${kw.toLowerCase()}%`;
        allKeywordParams.push(pattern, pattern, pattern, pattern, pattern);
    });

    const sql = `
    SELECT *,
    (
      ${keywords.map((_, i) => `
        CASE WHEN LOWER(name) LIKE ? THEN 10 ELSE 0 END +
        CASE WHEN LOWER(tags) LIKE ? THEN 8 ELSE 0 END +
        CASE WHEN LOWER(benefits) LIKE ? THEN 5 ELSE 0 END +
        CASE WHEN LOWER(eligibility) LIKE ? THEN 5 ELSE 0 END +
        CASE WHEN LOWER(details) LIKE ? THEN 3 ELSE 0 END
      `).join(' + ')}
    ) as score
    FROM schemes
    WHERE (${keywordConditions}) ${filterClause}
    ORDER BY score DESC, name ASC
    LIMIT ? OFFSET ?
  `;

    // Build score params (same pattern as keyword params)
    const scoreParams = [...allKeywordParams];
    const allParams = [...scoreParams, ...allKeywordParams, ...filterParams, limit, offset];

    const rows = db.prepare(sql).all(...allParams) as (SchemeRow & { score: number })[];

    // Count total matching
    const countSql = `
    SELECT COUNT(*) as total FROM schemes
    WHERE (${keywordConditions}) ${filterClause}
  `;
    const countParams = [...allKeywordParams, ...filterParams];
    const countResult = db.prepare(countSql).get(...countParams) as { total: number };

    return {
        data: rows.map(row => ({
            ...rowToScheme(row),
            relevanceScore: row.score,
        })),
        pagination: {
            page,
            limit,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit),
        },
    };
}

// ============================================
// Get Unique Values for Filters
// ============================================

export function getCategories(): string[] {
    const rows = db.prepare(`
    SELECT DISTINCT category FROM schemes 
    WHERE category IS NOT NULL AND category != ''
    ORDER BY category
  `).all() as { category: string }[];

    return rows.map(r => r.category);
}

export function getStates(): string[] {
    const rows = db.prepare(`
    SELECT DISTINCT state FROM schemes 
    WHERE state IS NOT NULL AND state != ''
    ORDER BY state
  `).all() as { state: string }[];

    return rows.map(r => r.state);
}

export function getTags(): string[] {
    const rows = db.prepare('SELECT tags FROM schemes WHERE tags IS NOT NULL').all() as { tags: string }[];

    const tagSet = new Set<string>();
    rows.forEach(row => {
        row.tags.split(',').forEach(tag => {
            const trimmed = tag.trim();
            if (trimmed) tagSet.add(trimmed);
        });
    });

    return Array.from(tagSet).sort();
}

export function getSchemeStats() {
    const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN level = 'Central' THEN 1 ELSE 0 END) as central,
      SUM(CASE WHEN level = 'State' THEN 1 ELSE 0 END) as state,
      COUNT(DISTINCT category) as categories
    FROM schemes
  `).get() as { total: number; central: number; state: number; categories: number };

    return stats;
}

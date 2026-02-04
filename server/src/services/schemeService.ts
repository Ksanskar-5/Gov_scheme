import pool from '../config/database.js';
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

export async function getAllSchemes(page = 1, limit = 20): Promise<PaginatedResponse<Scheme>> {
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) as total FROM public.schemes');
    const total = parseInt(countResult.rows[0].total);

    const result = await pool.query(
        `SELECT * FROM public.schemes ORDER BY name ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    return {
        data: result.rows.map(r => rowToScheme(r as SchemeRow)),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getSchemeById(id: number): Promise<Scheme | null> {
    const result = await pool.query('SELECT * FROM public.schemes WHERE id = $1', [id]);
    return result.rows[0] ? rowToScheme(result.rows[0] as SchemeRow) : null;
}

export async function getSchemeBySlug(slug: string): Promise<Scheme | null> {
    const result = await pool.query('SELECT * FROM public.schemes WHERE slug = $1', [slug]);
    return result.rows[0] ? rowToScheme(result.rows[0] as SchemeRow) : null;
}

export async function searchSchemes(query: SearchQuery): Promise<PaginatedResponse<Scheme>> {
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
    let paramIndex = 1;

    // Full-text search using tsvector
    if (searchText && searchText.trim()) {
        const searchTerms = searchText
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2)
            .join(' | ');

        if (searchTerms) {
            conditions.push(`search_vector @@ to_tsquery('english', $${paramIndex})`);
            params.push(searchTerms);
            paramIndex++;
        }
    }

    // Category filter
    if (category && category !== 'all') {
        conditions.push(`category ILIKE $${paramIndex}`);
        params.push(`%${category}%`);
        paramIndex++;
    }

    // State filter
    if (state && state !== 'all') {
        conditions.push(`(state = $${paramIndex} OR level = $${paramIndex + 1})`);
        params.push(state, 'Central');
        paramIndex += 2;
    }

    // Level filter
    if (level && level !== 'all') {
        conditions.push(`level = $${paramIndex}`);
        params.push(level);
        paramIndex++;
    }

    // Tags filter
    if (tags && tags.length > 0) {
        const tagConditions = tags.map(() => {
            const cond = `tags ILIKE $${paramIndex}`;
            paramIndex++;
            return cond;
        });
        conditions.push(`(${tagConditions.join(' OR ')})`);
        tags.forEach(tag => params.push(`%${tag}%`));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM public.schemes ${whereClause}`,
        params
    );
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataParams = [...params, limit, offset];
    const result = await pool.query(
        `SELECT * FROM public.schemes ${whereClause} ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        dataParams
    );

    return {
        data: result.rows.map(r => rowToScheme(r as SchemeRow)),
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

export async function smartSearch(
    keywords: string[],
    filters: Partial<SearchQuery> = {},
    page = 1,
    limit = 20
): Promise<PaginatedResponse<SchemeWithScore>> {
    const offset = (page - 1) * limit;

    if (keywords.length === 0) {
        const result = await getAllSchemes(page, limit);
        return {
            data: result.data.map(s => ({ ...s, relevanceScore: 0 })),
            pagination: result.pagination,
        };
    }

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Build keyword ILIKE conditions
    const keywordConditions: string[] = [];
    keywords.forEach(kw => {
        const pattern = `%${kw.toLowerCase()}%`;
        keywordConditions.push(`(
            LOWER(name) LIKE $${paramIndex} OR 
            LOWER(details) LIKE $${paramIndex} OR 
            LOWER(benefits) LIKE $${paramIndex} OR 
            LOWER(eligibility) LIKE $${paramIndex} OR 
            LOWER(tags) LIKE $${paramIndex}
        )`);
        params.push(pattern);
        paramIndex++;
    });
    conditions.push(`(${keywordConditions.join(' OR ')})`);

    // Add filters
    if (filters.category && filters.category !== 'all') {
        conditions.push(`category ILIKE $${paramIndex}`);
        params.push(`%${filters.category}%`);
        paramIndex++;
    }

    if (filters.state && filters.state !== 'all') {
        conditions.push(`(state = $${paramIndex} OR level = $${paramIndex + 1})`);
        params.push(filters.state, 'Central');
        paramIndex += 2;
    }

    if (filters.level && filters.level !== 'all') {
        conditions.push(`level = $${paramIndex}`);
        params.push(filters.level);
        paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Build scoring expression
    const scoreExprParts: string[] = [];
    let scoreParamIndex = paramIndex;
    keywords.forEach(kw => {
        const pattern = `%${kw.toLowerCase()}%`;
        scoreExprParts.push(`
            CASE WHEN LOWER(name) LIKE $${scoreParamIndex} THEN 10 ELSE 0 END +
            CASE WHEN LOWER(tags) LIKE $${scoreParamIndex} THEN 8 ELSE 0 END +
            CASE WHEN LOWER(benefits) LIKE $${scoreParamIndex} THEN 5 ELSE 0 END +
            CASE WHEN LOWER(eligibility) LIKE $${scoreParamIndex} THEN 5 ELSE 0 END +
            CASE WHEN LOWER(details) LIKE $${scoreParamIndex} THEN 3 ELSE 0 END
        `);
        params.push(pattern);
        scoreParamIndex++;
    });
    const scoreExpr = scoreExprParts.join(' + ');

    // Add pagination params
    params.push(limit, offset);

    const sql = `
        SELECT *, (${scoreExpr}) as score
        FROM public.schemes
        ${whereClause}
        ORDER BY score DESC, name ASC
        LIMIT $${scoreParamIndex} OFFSET $${scoreParamIndex + 1}
    `;

    const result = await pool.query(sql, params);

    // Count query
    const countParams = params.slice(0, paramIndex - 1);
    const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM public.schemes ${whereClause}`,
        countParams
    );

    return {
        data: result.rows.map(row => ({
            ...rowToScheme(row as SchemeRow),
            relevanceScore: parseInt(row.score) || 0,
        })),
        pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total),
            totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        },
    };
}

// ============================================
// Get Unique Values for Filters
// ============================================

export async function getCategories(): Promise<string[]> {
    const result = await pool.query(`
        SELECT DISTINCT category FROM public.schemes 
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category
    `);
    return result.rows.map(r => r.category);
}

export async function getStates(): Promise<string[]> {
    const result = await pool.query(`
        SELECT DISTINCT state FROM public.schemes 
        WHERE state IS NOT NULL AND state != ''
        ORDER BY state
    `);
    return result.rows.map(r => r.state);
}

export async function getTags(): Promise<string[]> {
    const result = await pool.query('SELECT tags FROM public.schemes WHERE tags IS NOT NULL');

    const tagSet = new Set<string>();
    result.rows.forEach(row => {
        if (row.tags) {
            row.tags.split(',').forEach((tag: string) => {
                const trimmed = tag.trim();
                if (trimmed) tagSet.add(trimmed);
            });
        }
    });

    return Array.from(tagSet).sort();
}

export async function getSchemeStats(): Promise<{
    total: number;
    central: number;
    state: number;
    categories: number;
}> {
    const result = await pool.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN level = 'Central' THEN 1 ELSE 0 END) as central,
            SUM(CASE WHEN level = 'State' THEN 1 ELSE 0 END) as state,
            COUNT(DISTINCT category) as categories
        FROM public.schemes
    `);

    const row = result.rows[0];
    return {
        total: parseInt(row.total) || 0,
        central: parseInt(row.central) || 0,
        state: parseInt(row.state) || 0,
        categories: parseInt(row.categories) || 0,
    };
}

import pool from '../config/database.js';
import { generateEmbedding } from './embeddingService.js';
import { checkEligibility } from './eligibilityEngine.js';
import type { Scheme, UserProfile, SchemeWithScore } from '../types/index.js';

// ============================================
// Vector Search Service - Semantic Search
// ============================================

interface VectorSearchFilters {
    state?: string;
    category?: string;
    level?: 'Central' | 'State';
}

interface VectorSearchResult extends Scheme {
    similarity: number;
    eligibilityScore?: number;
    eligibilityStatus?: string;
}

// ============================================
// Semantic Search using Vector Similarity
// ============================================

export async function semanticSearch(
    query: string,
    filters: VectorSearchFilters = {},
    limit = 10,
    threshold = 0.4
): Promise<VectorSearchResult[]> {
    try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);
        if (!queryEmbedding) {
            console.warn('⚠️ Could not generate query embedding, falling back');
            return [];
        }

        // Call Supabase vector search function
        const result = await pool.query(
            `SELECT * FROM search_schemes_by_vector($1, $2, $3, $4, $5, $6)`,
            [
                `[${queryEmbedding.join(',')}]`,
                threshold,
                limit,
                filters.state || null,
                filters.category || null,
                filters.level || null,
            ]
        );

        // Map results to Scheme type
        return result.rows.map(row => ({
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
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            state: row.state || undefined,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
            similarity: row.similarity,
        }));
    } catch (error) {
        console.error('❌ Semantic search error:', error);
        return [];
    }
}

// ============================================
// Semantic Search with Eligibility Scoring
// ============================================

export async function semanticSearchWithEligibility(
    query: string,
    userProfile: Partial<UserProfile>,
    filters: VectorSearchFilters = {},
    limit = 10
): Promise<VectorSearchResult[]> {
    // Get semantic search results
    const results = await semanticSearch(query, filters, limit * 2, 0.35);

    if (results.length === 0) {
        return [];
    }

    // Add eligibility scoring
    const scoredResults = results.map(scheme => {
        const eligibility = checkEligibility(userProfile, scheme);

        // Combined score: 60% similarity + 40% eligibility
        const combinedScore = (scheme.similarity * 0.6) +
            ((eligibility.confidence / 100) * 0.4);

        return {
            ...scheme,
            eligibilityScore: eligibility.confidence,
            eligibilityStatus: eligibility.status,
            combinedScore,
        };
    });

    // Sort by combined score and return top results
    return scoredResults
        .sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0))
        .slice(0, limit)
        .map(({ combinedScore, ...scheme }) => scheme);
}

// ============================================
// Hybrid Search (Vector + Keyword Fallback)
// ============================================

export async function hybridSearch(
    query: string,
    userProfile: Partial<UserProfile>,
    filters: VectorSearchFilters = {},
    limit = 10
): Promise<VectorSearchResult[]> {
    // Try semantic search first
    const semanticResults = await semanticSearchWithEligibility(
        query,
        userProfile,
        filters,
        limit
    );

    // If we got good results, return them
    if (semanticResults.length >= 3) {
        console.log(`🎯 Semantic search found ${semanticResults.length} results`);
        return semanticResults;
    }

    // Fallback: Use keyword search if semantic search fails
    console.log('⚠️ Semantic search insufficient, using keyword fallback');

    const keywords = query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2);

    if (keywords.length === 0) {
        return semanticResults;
    }

    // Build keyword ILIKE query
    const keywordConditions = keywords.map((_, i) =>
        `(LOWER(name) LIKE $${i + 1} OR LOWER(details) LIKE $${i + 1} OR LOWER(tags) LIKE $${i + 1})`
    ).join(' OR ');

    const params = keywords.map(k => `%${k}%`);

    try {
        const result = await pool.query(
            `SELECT * FROM public.schemes 
             WHERE ${keywordConditions}
             ORDER BY name
             LIMIT $${keywords.length + 1}`,
            [...params, limit]
        );

        const keywordResults: VectorSearchResult[] = result.rows.map(row => ({
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
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            state: row.state || undefined,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
            similarity: 0.5, // Default similarity for keyword matches
        }));

        // Merge and deduplicate
        const allResults = [...semanticResults];
        const existingIds = new Set(allResults.map(s => s.id));

        for (const result of keywordResults) {
            if (!existingIds.has(result.id)) {
                allResults.push(result);
            }
        }

        return allResults.slice(0, limit);
    } catch (error) {
        console.error('❌ Keyword fallback error:', error);
        return semanticResults;
    }
}

// ============================================
// Build Search Query from Conversation Context
// ============================================

export function buildSearchQuery(
    userMessage: string,
    userProfile: Partial<UserProfile>,
    conversationContext?: string
): string {
    const parts: string[] = [];

    // Add user's explicit query
    parts.push(userMessage);

    // Add profile-based context
    if (userProfile.profession) {
        parts.push(userProfile.profession);
    }
    if (userProfile.state) {
        parts.push(`${userProfile.state} state`);
    }
    if (userProfile.isFarmer) {
        parts.push('farmer agriculture');
    }
    if (userProfile.isStudent) {
        parts.push('student education scholarship');
    }
    if (userProfile.isBusinessOwner) {
        parts.push('business entrepreneur MSME');
    }
    if (userProfile.incomeRange === 'below_1lakh' || userProfile.isBPL) {
        parts.push('BPL low income welfare subsidy');
    }
    if (userProfile.gender === 'female') {
        parts.push('women empowerment');
    }
    if (userProfile.age && userProfile.age >= 60) {
        parts.push('senior citizen pension elderly');
    }

    // Add conversation context if available
    if (conversationContext) {
        parts.push(conversationContext);
    }

    return parts.join(' ').trim();
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/database.js';
import type { Scheme } from '../types/index.js';

// ============================================
// Embedding Service - Generate & Store Vectors
// ============================================

let genAI: GoogleGenerativeAI | null = null;

function getGenAIClient(): GoogleGenerativeAI | null {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'your_gemini_api_key_here') {
            genAI = new GoogleGenerativeAI(apiKey);
        }
    }
    return genAI;
}

// Supabase pgvector index limit is 2000 dimensions
const EMBEDDING_DIMENSION = 2000;

export async function generateEmbedding(text: string): Promise<number[] | null> {
    const client = getGenAIClient();
    if (!client) {
        console.error('❌ Gemini API key not configured');
        return null;
    }

    try {
        // Use gemini-embedding-001 (outputs 3072 dims, we truncate to 2000)
        // Truncation works well due to Matryoshka Representation Learning (MRL)
        const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await model.embedContent(text);

        // Truncate to 2000 dimensions for Supabase compatibility
        const fullEmbedding = result.embedding.values;
        const truncated = fullEmbedding.slice(0, EMBEDDING_DIMENSION);

        return truncated;
    } catch (error: any) {
        console.error('❌ Error generating embedding:', error?.message || error);
        return null;
    }
}

// ============================================
// Create Searchable Text from Scheme
// ============================================

function createSchemeText(scheme: Scheme): string {
    // Handle tags - could be array, string, or null
    let tagsText = '';
    if (scheme.tags) {
        if (Array.isArray(scheme.tags)) {
            tagsText = scheme.tags.join(' ');
        } else if (typeof scheme.tags === 'string') {
            // PostgreSQL array format: {"tag1","tag2"} or just comma-separated
            tagsText = scheme.tags.replace(/[{}"]/g, '').replace(/,/g, ' ');
        }
    }

    // Combine relevant fields for embedding
    const parts = [
        scheme.name,
        scheme.details || '',
        scheme.benefits || '',
        scheme.eligibility || '',
        scheme.category || '',
        tagsText,
    ];

    // Clean and combine
    return parts
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit text length
}

// ============================================
// Generate and Store Embedding for a Scheme
// ============================================

export async function embedScheme(schemeId: number): Promise<boolean> {
    try {
        // Fetch scheme
        const result = await pool.query(
            'SELECT * FROM public.schemes WHERE id = $1',
            [schemeId]
        );

        if (result.rows.length === 0) {
            console.error(`❌ Scheme ${schemeId} not found`);
            return false;
        }

        const scheme = result.rows[0] as Scheme;
        const text = createSchemeText(scheme);

        // Generate embedding
        const embedding = await generateEmbedding(text);
        if (!embedding) {
            return false;
        }

        // Store embedding
        await pool.query(
            'UPDATE public.schemes SET embedding = $1 WHERE id = $2',
            [`[${embedding.join(',')}]`, schemeId]
        );

        console.log(`✅ Embedded scheme: ${scheme.name}`);
        return true;
    } catch (error) {
        console.error(`❌ Error embedding scheme ${schemeId}:`, error);
        return false;
    }
}

// ============================================
// Embed All Schemes Without Embeddings
// ============================================

export async function embedAllSchemes(
    batchSize = 10,
    delayMs = 1000
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    try {
        // Get schemes without embeddings
        const result = await pool.query(
            'SELECT id, name FROM public.schemes WHERE embedding IS NULL ORDER BY id'
        );

        const schemes = result.rows;
        console.log(`📊 Found ${schemes.length} schemes without embeddings`);

        // Process in batches
        for (let i = 0; i < schemes.length; i += batchSize) {
            const batch = schemes.slice(i, i + batchSize);

            console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(schemes.length / batchSize)}`);

            for (const scheme of batch) {
                const embedded = await embedScheme(scheme.id);
                if (embedded) {
                    success++;
                } else {
                    failed++;
                }
            }

            // Delay between batches to avoid rate limiting
            if (i + batchSize < schemes.length) {
                console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        console.log(`\n✅ Embedding complete: ${success} success, ${failed} failed`);
        return { success, failed };
    } catch (error) {
        console.error('❌ Error in embedAllSchemes:', error);
        return { success, failed };
    }
}

// ============================================
// Get Embedding Statistics
// ============================================

export async function getEmbeddingStats(): Promise<{
    total: number;
    withEmbeddings: number;
    withoutEmbeddings: number;
}> {
    const result = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(embedding) as with_embeddings,
            COUNT(*) - COUNT(embedding) as without_embeddings
        FROM public.schemes
    `);

    const row = result.rows[0];
    return {
        total: parseInt(row.total),
        withEmbeddings: parseInt(row.with_embeddings),
        withoutEmbeddings: parseInt(row.without_embeddings),
    };
}

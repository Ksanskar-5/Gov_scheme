/**
 * Generate embeddings for all schemes
 * Run: npx tsx scripts/generateAllEmbeddings.ts
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pg from 'pg';

const { Pool } = pg;
const EMBEDDING_DIMENSION = 2000;
const BATCH_SIZE = 5;
const DELAY_MS = 1500;

async function generateAllEmbeddings() {
    console.log('🚀 Starting embedding generation...\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not set');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Get schemes without embeddings
    const result = await pool.query(`
        SELECT id, name, details, benefits, eligibility, category, tags 
        FROM public.schemes 
        WHERE embedding IS NULL 
        ORDER BY id 
        LIMIT 100
    `);

    console.log(`📊 Found ${result.rows.length} schemes without embeddings\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < result.rows.length; i++) {
        const scheme = result.rows[i];

        try {
            // Create text for embedding
            const text = [
                scheme.name,
                scheme.details || '',
                scheme.benefits || '',
                scheme.eligibility || '',
                scheme.category || '',
                scheme.tags || ''
            ].join(' ').replace(/\s+/g, ' ').trim().substring(0, 5000);

            // Generate embedding
            const embResult = await model.embedContent(text);
            const truncated = embResult.embedding.values.slice(0, EMBEDDING_DIMENSION);

            // Store in DB
            await pool.query(
                'UPDATE public.schemes SET embedding = $1 WHERE id = $2',
                [`[${truncated.join(',')}]`, scheme.id]
            );

            success++;
            console.log(`✅ [${i + 1}/${result.rows.length}] ${scheme.name.substring(0, 50)}...`);

        } catch (e: any) {
            failed++;
            console.log(`❌ [${i + 1}] Failed: ${scheme.name.substring(0, 30)}... - ${e.message}`);
        }

        // Rate limiting
        if ((i + 1) % BATCH_SIZE === 0) {
            console.log(`   ⏳ Waiting ${DELAY_MS}ms...`);
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    console.log(`\n✅ Complete: ${success} success, ${failed} failed`);

    // Check stats
    const stats = await pool.query(`
        SELECT COUNT(*) as total, 
               COUNT(embedding) as with_embeddings
        FROM public.schemes
    `);
    console.log(`📊 Total: ${stats.rows[0].total}, With embeddings: ${stats.rows[0].with_embeddings}`);

    await pool.end();
}

generateAllEmbeddings().catch(console.error);

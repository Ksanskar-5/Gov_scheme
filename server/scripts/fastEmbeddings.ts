/**
 * FAST embedding generation - processes all schemes in parallel batches
 * Run: npx tsx scripts/fastEmbeddings.ts
 * 
 * Estimated time: ~15 minutes for 3400 schemes
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pg from 'pg';

const { Pool } = pg;
const EMBEDDING_DIMENSION = 2000;
const PARALLEL_REQUESTS = 10;  // Process 10 at a time
const DELAY_BETWEEN_BATCHES = 500;  // 500ms between batches

async function fastEmbeddings() {
    console.log('🚀 FAST Embedding Generation\n');

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

    // Get ALL schemes without embeddings
    const result = await pool.query(`
        SELECT id, name, details, benefits, eligibility, category, tags 
        FROM public.schemes 
        WHERE embedding IS NULL 
        ORDER BY id
    `);

    const total = result.rows.length;
    console.log(`📊 Found ${total} schemes without embeddings`);
    console.log(`⚡ Processing ${PARALLEL_REQUESTS} in parallel\n`);

    let success = 0;
    let failed = 0;
    const startTime = Date.now();

    // Process in parallel batches
    for (let i = 0; i < total; i += PARALLEL_REQUESTS) {
        const batch = result.rows.slice(i, i + PARALLEL_REQUESTS);
        const batchNum = Math.floor(i / PARALLEL_REQUESTS) + 1;
        const totalBatches = Math.ceil(total / PARALLEL_REQUESTS);

        // Process batch in parallel
        const promises = batch.map(async (scheme) => {
            try {
                const text = [
                    scheme.name,
                    scheme.details || '',
                    scheme.benefits || '',
                    scheme.eligibility || '',
                    scheme.category || '',
                    scheme.tags || ''
                ].join(' ').replace(/\s+/g, ' ').trim().substring(0, 5000);

                const embResult = await model.embedContent(text);
                const truncated = embResult.embedding.values.slice(0, EMBEDDING_DIMENSION);

                await pool.query(
                    'UPDATE public.schemes SET embedding = $1 WHERE id = $2',
                    [`[${truncated.join(',')}]`, scheme.id]
                );

                return { success: true, name: scheme.name };
            } catch (e: any) {
                return { success: false, name: scheme.name, error: e.message };
            }
        });

        const results = await Promise.all(promises);

        const batchSuccess = results.filter(r => r.success).length;
        const batchFailed = results.filter(r => !r.success).length;
        success += batchSuccess;
        failed += batchFailed;

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const remaining = total - (i + batch.length);
        const rate = success / parseFloat(elapsed);
        const eta = remaining / rate;

        console.log(`📦 Batch ${batchNum}/${totalBatches}: ✅${batchSuccess} ❌${batchFailed} | Total: ${success}/${total} | ETA: ${eta.toFixed(0)}s`);

        // Show failed ones
        results.filter(r => !r.success).forEach(r => {
            console.log(`   ❌ ${r.name?.substring(0, 40)}: ${r.error}`);
        });

        // Small delay between batches
        if (i + PARALLEL_REQUESTS < total) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Complete in ${totalTime}s: ${success} success, ${failed} failed`);

    // Final stats
    const stats = await pool.query(`
        SELECT COUNT(*) as total, COUNT(embedding) as with_embeddings
        FROM public.schemes
    `);
    console.log(`📊 Final: ${stats.rows[0].with_embeddings}/${stats.rows[0].total} schemes have embeddings`);

    await pool.end();
}

fastEmbeddings().catch(console.error);

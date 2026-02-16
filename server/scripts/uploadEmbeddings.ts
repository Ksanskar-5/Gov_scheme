/**
 * Upload embeddings from JSON to Supabase
 * Run: npx tsx scripts/uploadEmbeddings.ts
 */

import 'dotenv/config';
import pg from 'pg';
import * as fs from 'fs';

const { Pool } = pg;
const INPUT_FILE = './embeddings.json';
const BATCH_SIZE = 50;

async function uploadEmbeddings() {
    console.log('📤 Uploading embeddings to Supabase\n');

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ File not found: ${INPUT_FILE}`);
        console.log('Run generateEmbeddingsLocal.ts first!');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const embeddings: Array<{ id: number; embedding: number[] }> =
        JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

    console.log(`📊 Loaded ${embeddings.length} embeddings from ${INPUT_FILE}\n`);

    let success = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
        const batch = embeddings.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
            try {
                await pool.query(
                    'UPDATE public.schemes SET embedding = $1 WHERE id = $2',
                    [`[${item.embedding.join(',')}]`, item.id]
                );
                success++;
            } catch (e: any) {
                console.log(`❌ Failed ID ${item.id}: ${e.message}`);
                failed++;
            }
        }

        const progress = Math.min(i + BATCH_SIZE, embeddings.length);
        console.log(`📦 ${progress}/${embeddings.length} uploaded`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Complete in ${totalTime}s: ${success} success, ${failed} failed`);

    // Verify
    const stats = await pool.query(`
        SELECT COUNT(*) as total, COUNT(embedding) as with_embeddings
        FROM public.schemes
    `);
    console.log(`📊 Supabase: ${stats.rows[0].with_embeddings}/${stats.rows[0].total} have embeddings`);

    await pool.end();
}

uploadEmbeddings().catch(console.error);

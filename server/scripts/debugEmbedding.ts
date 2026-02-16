/**
 * Full debug script for embedding generation
 * Run: npx tsx scripts/debugEmbedding.ts
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pg from 'pg';

const { Pool } = pg;

async function debugEmbedding() {
    console.log('🔧 Debugging Embedding Pipeline...\n');

    // Step 1: Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`1️⃣ API Key: ${apiKey ? '✅ SET (' + apiKey.substring(0, 10) + '...)' : '❌ NOT SET'}`);

    if (!apiKey) {
        console.error('STOP: API key not configured');
        process.exit(1);
    }

    // Step 2: Check database connection
    console.log(`\n2️⃣ Database URL: ${process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET'}`);

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const result = await pool.query('SELECT id, name FROM public.schemes LIMIT 1');
        if (result.rows.length > 0) {
            console.log(`   ✅ DB connected. Sample scheme: ${result.rows[0].name.substring(0, 50)}...`);
        } else {
            console.log('   ❌ No schemes found in database');
            process.exit(1);
        }
    } catch (e: any) {
        console.log(`   ❌ DB error: ${e.message}`);
        process.exit(1);
    }

    // Step 3: Check embedding column exists
    try {
        const colCheck = await pool.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'schemes' AND column_name = 'embedding'
        `);
        if (colCheck.rows.length > 0) {
            console.log(`\n3️⃣ Embedding column: ✅ EXISTS (type: ${colCheck.rows[0].udt_name})`);
        } else {
            console.log(`\n3️⃣ Embedding column: ❌ DOES NOT EXIST`);
            console.log('   Run the SQL migration first!');
            process.exit(1);
        }
    } catch (e: any) {
        console.log(`\n3️⃣ Column check error: ${e.message}`);
    }

    // Step 4: Generate embedding
    console.log(`\n4️⃣ Generating embedding...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    const testText = "PM-KISAN is a scheme for farmers";

    try {
        const result = await model.embedContent(testText);
        const fullEmbedding = result.embedding.values;
        console.log(`   ✅ Generated ${fullEmbedding.length} dimensions`);

        // Truncate to 2000
        const truncated = fullEmbedding.slice(0, 2000);
        console.log(`   ✅ Truncated to ${truncated.length} dimensions`);

        // Step 5: Try to insert into DB
        console.log(`\n5️⃣ Testing DB insert...`);
        const vectorStr = `[${truncated.join(',')}]`;

        await pool.query(
            'UPDATE public.schemes SET embedding = $1 WHERE id = 1',
            [vectorStr]
        );
        console.log(`   ✅ Successfully stored embedding for scheme ID 1!`);

        // Verify
        const verify = await pool.query('SELECT id, embedding IS NOT NULL as has_embedding FROM public.schemes WHERE id = 1');
        console.log(`   ✅ Verified: has_embedding = ${verify.rows[0]?.has_embedding}`);

    } catch (e: any) {
        console.log(`   ❌ Error: ${e.message}`);
        console.log(`   Full error:`, e);
    }

    await pool.end();
    console.log('\n✅ Debug complete');
}

debugEmbedding();

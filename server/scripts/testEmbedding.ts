/**
 * Debug script to test Gemini embedding generation
 * Run: npx tsx scripts/testEmbedding.ts
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testEmbedding() {
    console.log('🔧 Testing Gemini Embedding API...\n');

    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not set in .env');
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const testText = "PM-KISAN is a central government scheme providing income support to farmers";

    // Test the correct embedding model
    console.log(`\n📊 Testing model: gemini-embedding-001`);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await model.embedContent(testText);

        if (result.embedding && result.embedding.values) {
            console.log(`✅ Success! Embedding dimension: ${result.embedding.values.length}`);
            console.log(`   First 5 values: [${result.embedding.values.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
        } else {
            console.log('❌ No embedding returned');
            console.log('   Result:', JSON.stringify(result).substring(0, 200));
        }
    } catch (error: any) {
        console.log(`❌ Error: ${error?.message || error}`);
    }

    console.log('\n✅ Test complete');
}

testEmbedding();

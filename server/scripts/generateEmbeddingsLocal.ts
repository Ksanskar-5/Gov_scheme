/**
 * Generate embeddings locally to a JSON file
 * Run: npx tsx scripts/generateEmbeddingsLocal.ts
 * 
 * Output: ./embeddings.json
 * Then upload to Supabase when ready
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

const EMBEDDING_DIMENSION = 2000;
const PARALLEL_REQUESTS = 10;
const DELAY_BETWEEN_BATCHES = 500;
const OUTPUT_FILE = './embeddings.json';

// Your scheme data - load from CSV/JSON
interface SchemeData {
    id: number;
    name: string;
    details?: string;
    benefits?: string;
    eligibility?: string;
    category?: string;
    tags?: string;
}

async function generateLocal() {
    console.log('🚀 Local Embedding Generation\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not set');
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Load your scheme data from a JSON file
    // Replace this with your actual data source
    const dataFile = './schemes_data.json';

    if (!fs.existsSync(dataFile)) {
        console.log(`\n📁 Please create ${dataFile} with your scheme data in this format:`);
        console.log(`[
  { "id": 1, "name": "Scheme Name", "details": "...", "benefits": "...", "eligibility": "..." },
  ...
]`);

        // Create a sample file
        const sample: SchemeData[] = [
            { id: 1, name: "PM-KISAN", details: "Income support for farmers", benefits: "Rs 6000 per year", eligibility: "Small farmers", category: "Agriculture" },
            { id: 2, name: "Ayushman Bharat", details: "Health insurance", benefits: "Rs 5 lakh coverage", eligibility: "BPL families", category: "Health" },
        ];
        fs.writeFileSync(dataFile, JSON.stringify(sample, null, 2));
        console.log(`\n✅ Created sample file: ${dataFile}`);
        console.log('Edit it with your data and run again!\n');
        return;
    }

    const schemes: SchemeData[] = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    console.log(`📊 Loaded ${schemes.length} schemes from ${dataFile}\n`);

    const results: Array<{ id: number; embedding: number[] }> = [];
    let success = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < schemes.length; i += PARALLEL_REQUESTS) {
        const batch = schemes.slice(i, i + PARALLEL_REQUESTS);
        const batchNum = Math.floor(i / PARALLEL_REQUESTS) + 1;
        const totalBatches = Math.ceil(schemes.length / PARALLEL_REQUESTS);

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

                return { success: true, id: scheme.id, embedding: truncated };
            } catch (e: any) {
                return { success: false, id: scheme.id, error: e.message };
            }
        });

        const batchResults = await Promise.all(promises);

        for (const r of batchResults) {
            if (r.success && r.embedding) {
                results.push({ id: r.id, embedding: r.embedding });
                success++;
            } else {
                failed++;
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`📦 Batch ${batchNum}/${totalBatches}: ${success} done | ${elapsed}s elapsed`);

        if (i + PARALLEL_REQUESTS < schemes.length) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
        }
    }

    // Save to JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Complete in ${totalTime}s: ${success} success, ${failed} failed`);
    console.log(`📁 Saved to: ${OUTPUT_FILE}`);
    console.log(`\n📤 To upload to Supabase, run: npx tsx scripts/uploadEmbeddings.ts`);
}

generateLocal().catch(console.error);

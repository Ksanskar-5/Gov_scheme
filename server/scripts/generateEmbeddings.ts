/**
 * Embedding Generation Script
 * 
 * Run this to generate embeddings for all schemes in the database.
 * Usage: npx ts-node scripts/generateEmbeddings.ts
 */

import 'dotenv/config';
import { embedAllSchemes, getEmbeddingStats } from '../src/services/embeddingService.js';

async function main() {
    console.log('🚀 Starting embedding generation...\n');

    // Check current stats
    const beforeStats = await getEmbeddingStats();
    console.log('📊 Before:');
    console.log(`   Total schemes: ${beforeStats.total}`);
    console.log(`   With embeddings: ${beforeStats.withEmbeddings}`);
    console.log(`   Without embeddings: ${beforeStats.withoutEmbeddings}\n`);

    if (beforeStats.withoutEmbeddings === 0) {
        console.log('✅ All schemes already have embeddings!');
        process.exit(0);
    }

    // Generate embeddings
    const result = await embedAllSchemes(5, 2000); // Batch of 5, 2s delay

    // Check final stats
    const afterStats = await getEmbeddingStats();
    console.log('\n📊 After:');
    console.log(`   Total schemes: ${afterStats.total}`);
    console.log(`   With embeddings: ${afterStats.withEmbeddings}`);
    console.log(`   Without embeddings: ${afterStats.withoutEmbeddings}`);

    console.log(`\n✅ Complete! Success: ${result.success}, Failed: ${result.failed}`);
    process.exit(0);
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});

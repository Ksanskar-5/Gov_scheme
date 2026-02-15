import { embedAllSchemes, getEmbeddingStats } from '../services/embeddingService.js';

/**
 * Generate embeddings for all schemes in the database
 * Uses Gemini embedding-001 model with batching and rate limiting
 */

async function generateEmbeddings() {
    console.log('🚀 Starting embedding generation for all schemes...\n');

    // Check initial stats
    const initialStats = await getEmbeddingStats();
    console.log(`📊 Initial state:`);
    console.log(`   Total schemes: ${initialStats.total}`);
    console.log(`   With embeddings: ${initialStats.withEmbeddings}`);
    console.log(`   Without embeddings: ${initialStats.withoutEmbeddings}\n`);

    if (initialStats.withoutEmbeddings === 0) {
        console.log('✅ All schemes already have embeddings!');
        process.exit(0);
    }

    // Run embedding generation with smaller batches and longer delays for rate limiting
    // Gemini has rate limits, so we process 5 at a time with 2s delay
    const result = await embedAllSchemes(5, 2000);

    // Final stats
    const finalStats = await getEmbeddingStats();
    console.log(`\n📊 Final state:`);
    console.log(`   Total schemes: ${finalStats.total}`);
    console.log(`   With embeddings: ${finalStats.withEmbeddings}`);
    console.log(`   Without embeddings: ${finalStats.withoutEmbeddings}`);

    console.log(`\n🎉 Embedding generation complete!`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Failed: ${result.failed}`);

    process.exit(0);
}

generateEmbeddings().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

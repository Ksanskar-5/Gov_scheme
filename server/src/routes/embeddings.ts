import { Router } from 'express';
import {
    embedScheme,
    embedAllSchemes,
    getEmbeddingStats
} from '../services/embeddingService.js';
import {
    semanticSearch,
    hybridSearch
} from '../services/vectorSearchService.js';

const router = Router();

// ============================================
// Embedding Management Routes
// ============================================

/**
 * GET /api/embeddings/stats
 * Get embedding statistics
 */
router.get('/stats', async (_req, res) => {
    try {
        const stats = await getEmbeddingStats();
        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error getting embedding stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get embedding statistics',
        });
    }
});

/**
 * POST /api/embeddings/generate
 * Generate embeddings for all schemes without embeddings
 */
router.post('/generate', async (req, res) => {
    try {
        const batchSize = req.body.batchSize || 5;
        const delayMs = req.body.delayMs || 2000;

        // Run in background
        res.json({
            success: true,
            message: 'Embedding generation started. Check /stats for progress.',
        });

        // Execute after response
        embedAllSchemes(batchSize, delayMs).then(result => {
            console.log(`Embedding generation complete: ${result.success} success, ${result.failed} failed`);
        });
    } catch (error) {
        console.error('Error starting embedding generation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start embedding generation',
        });
    }
});

/**
 * POST /api/embeddings/scheme/:id
 * Generate embedding for a single scheme
 */
router.post('/scheme/:id', async (req, res) => {
    try {
        const schemeId = parseInt(req.params.id);
        if (isNaN(schemeId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid scheme ID',
            });
        }

        const success = await embedScheme(schemeId);
        res.json({
            success,
            message: success
                ? 'Embedding generated successfully'
                : 'Failed to generate embedding',
        });
    } catch (error) {
        console.error('Error embedding scheme:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate embedding',
        });
    }
});

// ============================================
// Vector Search Routes
// ============================================

/**
 * POST /api/embeddings/search
 * Semantic search using vector similarity
 */
router.post('/search', async (req, res) => {
    try {
        const { query, state, category, level, limit = 10 } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
            });
        }

        const results = await semanticSearch(
            query,
            { state, category, level },
            limit
        );

        res.json({
            success: true,
            data: {
                schemes: results,
                total: results.length,
                searchType: 'semantic',
            },
        });
    } catch (error) {
        console.error('Error in semantic search:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform semantic search',
        });
    }
});

/**
 * POST /api/embeddings/hybrid-search
 * Hybrid search (semantic + keyword fallback)
 */
router.post('/hybrid-search', async (req, res) => {
    try {
        const { query, userProfile = {}, state, category, level, limit = 10 } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
            });
        }

        const results = await hybridSearch(
            query,
            userProfile,
            { state, category, level },
            limit
        );

        res.json({
            success: true,
            data: {
                schemes: results,
                total: results.length,
                searchType: 'hybrid',
            },
        });
    } catch (error) {
        console.error('Error in hybrid search:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform hybrid search',
        });
    }
});

export default router;

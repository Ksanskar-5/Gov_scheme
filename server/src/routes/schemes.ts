import { Router } from 'express';
import { z } from 'zod';
import {
    getAllSchemes,
    getSchemeById,
    getSchemeBySlug,
    searchSchemes,
    getCategories,
    getStates,
    getTags,
    getSchemeStats,
} from '../services/schemeService.js';
import { checkEligibility } from '../services/eligibilityEngine.js';
import type { ApiResponse, SearchQuery, UserProfile } from '../types/index.js';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const searchQuerySchema = z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    state: z.string().optional(),
    level: z.enum(['Central', 'State', 'all']).optional(),
    tags: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(v => v ? Math.min(parseInt(v), 50) : 20),
});

const eligibilityCheckSchema = z.object({
    age: z.number().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    state: z.string().optional(),
    incomeRange: z.string().optional(),
    profession: z.string().optional(),
    category: z.enum(['general', 'obc', 'sc', 'st', 'ews']).optional(),
    isDisabled: z.boolean().optional(),
    isMinority: z.boolean().optional(),
    isBPL: z.boolean().optional(),
    isStudent: z.boolean().optional(),
    isFarmer: z.boolean().optional(),
    isBusinessOwner: z.boolean().optional(),
    isWorker: z.boolean().optional(),
    isWidow: z.boolean().optional(),
    isSeniorCitizen: z.boolean().optional(),
    educationLevel: z.string().optional(),
    employmentStatus: z.string().optional(),
});

// ============================================
// Routes (Async)
// ============================================

/**
 * GET /api/schemes
 * Get all schemes with pagination
 */
router.get('/', async (req, res) => {
    try {
        const { page, limit } = searchQuerySchema.parse(req.query);
        const result = await getAllSchemes(page, limit);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error('Error fetching schemes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch schemes',
        } as ApiResponse<null>);
    }
});

/**
 * GET /api/schemes/stats
 * Get scheme statistics
 */
router.get('/stats', async (_req, res) => {
    try {
        const stats = await getSchemeStats();
        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
        });
    }
});

/**
 * GET /api/schemes/filters
 * Get available filter options
 */
router.get('/filters', async (_req, res) => {
    try {
        const [categories, states, tags] = await Promise.all([
            getCategories(),
            getStates(),
            getTags(),
        ]);

        res.json({
            success: true,
            data: {
                categories,
                states,
                tags,
                levels: ['Central', 'State'],
            },
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch filters',
        });
    }
});

/**
 * GET /api/schemes/search
 * Search schemes with filters
 */
router.get('/search', async (req, res) => {
    try {
        const validated = searchQuerySchema.parse(req.query);

        const query: SearchQuery = {
            query: validated.q,
            category: validated.category,
            state: validated.state,
            level: validated.level,
            tags: validated.tags ? validated.tags.split(',').map(t => t.trim()) : undefined,
            page: validated.page,
            limit: validated.limit,
        };

        const result = await searchSchemes(query);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        console.error('Error searching schemes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search schemes',
        });
    }
});

/**
 * GET /api/schemes/:idOrSlug
 * Get scheme by ID or slug
 */
router.get('/:idOrSlug', async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        // Try as ID first
        let scheme = null;
        if (/^\d+$/.test(idOrSlug)) {
            scheme = await getSchemeById(parseInt(idOrSlug));
        }

        // Try as slug
        if (!scheme) {
            scheme = await getSchemeBySlug(idOrSlug);
        }

        if (!scheme) {
            return res.status(404).json({
                success: false,
                error: 'Scheme not found',
            });
        }

        res.json({
            success: true,
            data: scheme,
        });
    } catch (error) {
        console.error('Error fetching scheme:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch scheme',
        });
    }
});

/**
 * POST /api/schemes/:id/check-eligibility
 * Check eligibility for a specific scheme
 */
router.post('/:id/check-eligibility', async (req, res) => {
    try {
        const schemeId = parseInt(req.params.id);
        const scheme = await getSchemeById(schemeId);

        if (!scheme) {
            return res.status(404).json({
                success: false,
                error: 'Scheme not found',
            });
        }

        const userProfile = eligibilityCheckSchema.parse(req.body) as Partial<UserProfile>;
        const result = checkEligibility(userProfile, scheme);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile data',
                details: error.errors,
            });
        }

        console.error('Error checking eligibility:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check eligibility',
        });
    }
});

export default router;

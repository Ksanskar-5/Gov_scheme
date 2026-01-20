import { Router } from 'express';
import { z } from 'zod';
import {
    orchestrateSmartSearch,
    getPersonalizedRecommendations,
    searchByCategory,
    searchByLifeEvent
} from '../services/searchOrchestrator.js';
import type { UserProfile } from '../types/index.js';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const smartSearchSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20),
    userProfile: z.object({
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
    }).optional(),
});

const recommendationsSchema = z.object({
    limit: z.number().optional().default(10),
    userProfile: z.object({
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
    }).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * POST /api/search/smart
 * AI-powered natural language search
 */
router.post('/smart', async (req, res) => {
    try {
        const validated = smartSearchSchema.parse(req.body);

        const result = await orchestrateSmartSearch(
            {
                query: validated.query,
                userProfile: validated.userProfile as Partial<UserProfile>,
            },
            validated.page,
            validated.limit
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
            });
        }

        console.error('Error in smart search:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform search',
        });
    }
});

/**
 * POST /api/search/recommendations
 * Get personalized scheme recommendations
 */
router.post('/recommendations', async (req, res) => {
    try {
        const validated = recommendationsSchema.parse(req.body);

        if (!validated.userProfile || Object.keys(validated.userProfile).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'User profile is required for recommendations',
            });
        }

        const recommendations = await getPersonalizedRecommendations(
            validated.userProfile as Partial<UserProfile>,
            validated.limit
        );

        res.json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
            });
        }

        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recommendations',
        });
    }
});

/**
 * GET /api/search/category/:category
 * Search schemes by category
 */
router.get('/category/:category', (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        // Parse user profile from query params if provided
        let userProfile: Partial<UserProfile> | undefined;
        if (req.query.state) {
            userProfile = { state: req.query.state as string };
        }

        const result = searchByCategory(category, userProfile, page, limit);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error searching by category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search by category',
        });
    }
});

/**
 * GET /api/search/life-event/:event
 * Search schemes by life event
 */
router.get('/life-event/:event', async (req, res) => {
    try {
        const { event } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        // Parse user profile from query params
        let userProfile: Partial<UserProfile> | undefined;
        if (req.query.state) {
            userProfile = { state: req.query.state as string };
        }

        const result = await searchByLifeEvent(event, userProfile, page, limit);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error searching by life event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search by life event',
        });
    }
});

/**
 * GET /api/search/life-events
 * Get list of supported life events
 */
router.get('/life-events', (_req, res) => {
    const lifeEvents = [
        { id: 'death_in_family', label: 'Death in Family', icon: '🕯️' },
        { id: 'marriage', label: 'Marriage', icon: '💒' },
        { id: 'childbirth', label: 'Childbirth', icon: '👶' },
        { id: 'education_start', label: 'Starting Education', icon: '🎓' },
        { id: 'job_loss', label: 'Job Loss', icon: '💼' },
        { id: 'starting_business', label: 'Starting a Business', icon: '🏪' },
        { id: 'retirement', label: 'Retirement', icon: '🧓' },
        { id: 'disability', label: 'Disability', icon: '♿' },
        { id: 'natural_disaster', label: 'Natural Disaster', icon: '🌊' },
        { id: 'crop_loss', label: 'Crop Loss', icon: '🌾' },
    ];

    res.json({
        success: true,
        data: lifeEvents,
    });
});

export default router;

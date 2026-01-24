import { Router } from 'express';
import { z } from 'zod';
import {
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    saveSchemeForUser,
    updateSchemeStatus,
    removeSchemeForUser,
    getUserSavedSchemes,
} from '../services/userService.js';
import { getSchemeById } from '../services/schemeService.js';
import { getPersonalizedRecommendations } from '../services/searchOrchestrator.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const userProfileSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    age: z.number().min(0).max(120).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    state: z.string().optional(),
    district: z.string().optional(),
    incomeRange: z.enum([
        'below_1lakh',
        '1lakh_2.5lakh',
        '2.5lakh_5lakh',
        '5lakh_10lakh',
        'above_10lakh',
    ]).optional(),
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
    familySize: z.number().min(1).max(20).optional(),
    educationLevel: z.enum([
        'below_10th',
        '10th_pass',
        '12th_pass',
        'graduate',
        'post_graduate',
        'professional',
    ]).optional(),
    employmentStatus: z.enum([
        'unemployed',
        'self_employed',
        'private_sector',
        'government',
        'student',
        'retired',
    ]).optional(),
});

const schemeStatusSchema = z.object({
    status: z.enum(['saved', 'applied', 'completed', 'rejected']),
    notes: z.string().optional(),
});

// ============================================
// Profile Routes
// ============================================

/**
 * POST /api/users/profile
 * Create a new user profile (requires authentication)
 */
router.post('/profile', authMiddleware, (req: AuthRequest, res) => {
    try {
        const validated = userProfileSchema.parse(req.body);
        const authUserId = req.user?.userId;
        const profile = createUserProfile(validated, authUserId);

        res.status(201).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile data',
                details: error.errors,
            });
        }

        console.error('Error creating profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create profile',
        });
    }
});

/**
 * GET /api/users/:id/profile
 * Get user profile by ID
 */
router.get('/:id/profile', (req, res) => {
    try {
        const { id } = req.params;
        const profile = getUserProfile(id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found',
            });
        }

        res.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
        });
    }
});

/**
 * PUT /api/users/:id/profile
 * Update user profile
 */
router.put('/:id/profile', (req, res) => {
    try {
        const { id } = req.params;
        const validated = userProfileSchema.parse(req.body);

        const profile = updateUserProfile(id, validated);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found',
            });
        }

        res.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile data',
                details: error.errors,
            });
        }

        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
        });
    }
});

/**
 * DELETE /api/users/:id/profile
 * Delete user profile
 */
router.delete('/:id/profile', (req, res) => {
    try {
        const { id } = req.params;
        const deleted = deleteUserProfile(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found',
            });
        }

        res.json({
            success: true,
            message: 'Profile deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete profile',
        });
    }
});

// ============================================
// Saved Schemes Routes
// ============================================

/**
 * GET /api/users/:id/schemes
 * Get user's saved schemes
 */
router.get('/:id/schemes', (req, res) => {
    try {
        const { id } = req.params;
        const savedSchemes = getUserSavedSchemes(id);

        // Fetch full scheme details
        const schemesWithDetails = savedSchemes.map(saved => {
            const scheme = getSchemeById(saved.schemeId);
            return {
                ...saved,
                scheme,
            };
        }).filter(s => s.scheme !== null);

        res.json({
            success: true,
            data: schemesWithDetails,
        });
    } catch (error) {
        console.error('Error fetching saved schemes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch saved schemes',
        });
    }
});

/**
 * POST /api/users/:id/schemes/:schemeId
 * Save a scheme for user
 */
router.post('/:id/schemes/:schemeId', (req, res) => {
    try {
        const { id, schemeId } = req.params;

        // Verify scheme exists
        const scheme = getSchemeById(parseInt(schemeId));
        if (!scheme) {
            return res.status(404).json({
                success: false,
                error: 'Scheme not found',
            });
        }

        const saved = saveSchemeForUser(id, parseInt(schemeId));

        if (!saved) {
            return res.status(500).json({
                success: false,
                error: 'Failed to save scheme',
            });
        }

        res.status(201).json({
            success: true,
            message: 'Scheme saved successfully',
        });
    } catch (error) {
        console.error('Error saving scheme:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save scheme',
        });
    }
});

/**
 * PUT /api/users/:id/schemes/:schemeId
 * Update saved scheme status
 */
router.put('/:id/schemes/:schemeId', (req, res) => {
    try {
        const { id, schemeId } = req.params;
        const validated = schemeStatusSchema.parse(req.body);

        const updated = updateSchemeStatus(
            id,
            parseInt(schemeId),
            validated.status,
            validated.notes
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Saved scheme not found',
            });
        }

        res.json({
            success: true,
            message: 'Scheme status updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status data',
                details: error.errors,
            });
        }

        console.error('Error updating scheme status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update scheme status',
        });
    }
});

/**
 * DELETE /api/users/:id/schemes/:schemeId
 * Remove saved scheme
 */
router.delete('/:id/schemes/:schemeId', (req, res) => {
    try {
        const { id, schemeId } = req.params;
        const removed = removeSchemeForUser(id, parseInt(schemeId));

        if (!removed) {
            return res.status(404).json({
                success: false,
                error: 'Saved scheme not found',
            });
        }

        res.json({
            success: true,
            message: 'Scheme removed from saved list',
        });
    } catch (error) {
        console.error('Error removing saved scheme:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove saved scheme',
        });
    }
});

/**
 * GET /api/users/:id/recommendations
 * Get personalized scheme recommendations
 */
router.get('/:id/recommendations', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

        const profile = getUserProfile(id);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found',
            });
        }

        const recommendations = await getPersonalizedRecommendations(profile, limit);

        res.json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recommendations',
        });
    }
});

export default router;

/**
 * Authentication Routes
 * Handles user registration, login, and profile access
 */

import { Router } from 'express';
import { z } from 'zod';
import {
    registerUser,
    loginUser,
    getAuthUserById,
    getProfileByAuthUserId,
    updatePassword,
} from '../services/authService.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { getUserProfile } from '../services/userService.js';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// ============================================
// Routes
// ============================================

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const validated = registerSchema.parse(req.body);

        const result = await registerUser(validated.email, validated.password);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }

        res.status(201).json({
            success: true,
            data: {
                user: result.user,
                token: result.token,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }

        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
        });
    }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const validated = loginSchema.parse(req.body);

        const result = await loginUser(validated.email, validated.password);

        if (!result.success) {
            return res.status(401).json({
                success: false,
                error: result.error,
            });
        }

        // Get user's profile ID
        const profileId = getProfileByAuthUserId(result.user!.id);
        const profile = profileId ? getUserProfile(profileId) : null;

        res.json({
            success: true,
            data: {
                user: result.user,
                token: result.token,
                profileId,
                profile,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }

        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
        });
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
    try {
        const user = getAuthUserById(req.user!.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const profileId = getProfileByAuthUserId(user.id);
        const profile = profileId ? getUserProfile(profileId) : null;

        res.json({
            success: true,
            data: {
                user,
                profileId,
                profile,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user',
        });
    }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const validated = changePasswordSchema.parse(req.body);

        const result = await updatePassword(
            req.user!.userId,
            validated.currentPassword,
            validated.newPassword
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }

        res.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }

        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password',
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify if token is valid
 */
router.post('/verify', authMiddleware, (req: AuthRequest, res) => {
    res.json({
        success: true,
        data: {
            valid: true,
            user: req.user,
        },
    });
});

export default router;

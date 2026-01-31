/**
 * Authentication Routes
 * POST /api/auth/register - Create new account
 * POST /api/auth/login - Login with email/password
 * GET /api/auth/me - Get current user from token
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
    createUser,
    loginUser,
    getUserById,
    verifyToken,
    type User,
} from '../services/authService.js';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ============================================
// Middleware: Auth Check
// ============================================

export interface AuthRequest extends Request {
    user?: User;
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    const user = await getUserById(decoded.userId);

    if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }

    req.user = user;
    next();
}

// ============================================
// Routes
// ============================================

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors,
            });
            return;
        }

        const { email, password, name } = validation.data;
        const result = await createUser(email, password, name);

        res.status(201).json({
            message: 'Account created successfully',
            user: result.user,
            token: result.token,
        });
    } catch (error: any) {
        console.error('Registration error:', error);

        if (error.message === 'Email already registered') {
            res.status(409).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: 'Failed to create account' });
    }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: validation.error.errors,
            });
            return;
        }

        const { email, password } = validation.data;
        const result = await loginUser(email, password);

        res.json({
            message: 'Login successful',
            user: result.user,
            token: result.token,
        });
    } catch (error: any) {
        console.error('Login error:', error);

        if (error.message === 'Invalid email or password') {
            res.status(401).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * GET /api/auth/me
 * Get current user from token
 */
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
    res.json({ user: req.user });
});

export default router;

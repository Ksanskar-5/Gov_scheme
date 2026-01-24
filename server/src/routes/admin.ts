/**
 * Admin Routes
 * Protected routes for admin operations on schemes and users
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { getAllUsers, setUserRole, deactivateUser, activateUser } from '../services/authService.js';
import db from '../config/database.js';
import { rebuildFtsIndex } from '../config/database.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// Validation Schemas
// ============================================

const schemeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().optional(),
    details: z.string().optional(),
    benefits: z.string().optional(),
    eligibility: z.string().optional(),
    application: z.string().optional(),
    documents: z.string().optional(),
    level: z.enum(['Central', 'State']),
    category: z.string().optional(),
    tags: z.string().optional(),
    state: z.string().optional(),
});

// ============================================
// Scheme CRUD Operations
// ============================================

/**
 * POST /api/admin/schemes
 * Create a new scheme
 */
router.post('/schemes', (req: AuthRequest, res) => {
    try {
        const validated = schemeSchema.parse(req.body);

        // Generate slug if not provided
        const slug = validated.slug || validated.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);

        const now = new Date().toISOString();

        const result = db.prepare(`
            INSERT INTO schemes (name, slug, details, benefits, eligibility, application, documents, level, category, tags, state, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            validated.name,
            slug,
            validated.details || '',
            validated.benefits || '',
            validated.eligibility || '',
            validated.application || '',
            validated.documents || '',
            validated.level,
            validated.category || '',
            validated.tags || '',
            validated.state || null,
            now,
            now
        );

        // Rebuild FTS index
        rebuildFtsIndex();

        res.status(201).json({
            success: true,
            data: {
                id: result.lastInsertRowid,
                ...validated,
                slug,
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

        console.error('Create scheme error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create scheme',
        });
    }
});

/**
 * PUT /api/admin/schemes/:id
 * Update an existing scheme
 */
router.put('/schemes/:id', (req: AuthRequest, res) => {
    try {
        const schemeId = parseInt(req.params.id);
        const validated = schemeSchema.partial().parse(req.body);

        // Check if scheme exists
        const existing = db.prepare('SELECT id FROM schemes WHERE id = ?').get(schemeId);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Scheme not found',
            });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (validated.name !== undefined) {
            updates.push('name = ?');
            values.push(validated.name);
        }
        if (validated.details !== undefined) {
            updates.push('details = ?');
            values.push(validated.details);
        }
        if (validated.benefits !== undefined) {
            updates.push('benefits = ?');
            values.push(validated.benefits);
        }
        if (validated.eligibility !== undefined) {
            updates.push('eligibility = ?');
            values.push(validated.eligibility);
        }
        if (validated.application !== undefined) {
            updates.push('application = ?');
            values.push(validated.application);
        }
        if (validated.documents !== undefined) {
            updates.push('documents = ?');
            values.push(validated.documents);
        }
        if (validated.level !== undefined) {
            updates.push('level = ?');
            values.push(validated.level);
        }
        if (validated.category !== undefined) {
            updates.push('category = ?');
            values.push(validated.category);
        }
        if (validated.tags !== undefined) {
            updates.push('tags = ?');
            values.push(validated.tags);
        }
        if (validated.state !== undefined) {
            updates.push('state = ?');
            values.push(validated.state);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update',
            });
        }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(schemeId);

        db.prepare(`UPDATE schemes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        // Rebuild FTS index
        rebuildFtsIndex();

        res.json({
            success: true,
            message: 'Scheme updated successfully',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }

        console.error('Update scheme error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update scheme',
        });
    }
});

/**
 * DELETE /api/admin/schemes/:id
 * Delete a scheme
 */
router.delete('/schemes/:id', (req: AuthRequest, res) => {
    try {
        const schemeId = parseInt(req.params.id);

        const result = db.prepare('DELETE FROM schemes WHERE id = ?').run(schemeId);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Scheme not found',
            });
        }

        // Rebuild FTS index
        rebuildFtsIndex();

        res.json({
            success: true,
            message: 'Scheme deleted successfully',
        });
    } catch (error) {
        console.error('Delete scheme error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete scheme',
        });
    }
});

// ============================================
// User Management
// ============================================

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', (_req: AuthRequest, res) => {
    try {
        const users = getAllUsers();
        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get users',
        });
    }
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', (req: AuthRequest, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be "user" or "admin"',
            });
        }

        const updated = setUserRole(userId, role);

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            message: 'User role updated',
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update role',
        });
    }
});

/**
 * PUT /api/admin/users/:id/deactivate
 * Deactivate a user
 */
router.put('/users/:id/deactivate', (req: AuthRequest, res) => {
    try {
        const userId = req.params.id;

        // Prevent self-deactivation
        if (userId === req.user!.userId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot deactivate your own account',
            });
        }

        const updated = deactivateUser(userId);

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            message: 'User deactivated',
        });
    } catch (error) {
        console.error('Deactivate error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate user',
        });
    }
});

/**
 * PUT /api/admin/users/:id/activate
 * Activate a user
 */
router.put('/users/:id/activate', (req: AuthRequest, res) => {
    try {
        const userId = req.params.id;
        const updated = activateUser(userId);

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            message: 'User activated',
        });
    } catch (error) {
        console.error('Activate error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to activate user',
        });
    }
});

// ============================================
// Analytics
// ============================================

/**
 * GET /api/admin/analytics
 * Get platform analytics
 */
router.get('/analytics', (_req: AuthRequest, res) => {
    try {
        // Scheme stats
        const schemeStats = db.prepare(`
            SELECT 
                COUNT(*) as totalSchemes,
                SUM(CASE WHEN level = 'Central' THEN 1 ELSE 0 END) as centralSchemes,
                SUM(CASE WHEN level = 'State' THEN 1 ELSE 0 END) as stateSchemes,
                COUNT(DISTINCT category) as categories
            FROM schemes
        `).get() as { totalSchemes: number; centralSchemes: number; stateSchemes: number; categories: number };

        // User stats
        const userStats = db.prepare(`
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers
            FROM auth_users
        `).get() as { totalUsers: number; admins: number; activeUsers: number };

        // Saved schemes stats
        const savedStats = db.prepare(`
            SELECT 
                COUNT(*) as totalSaved,
                COUNT(DISTINCT user_id) as usersWithSaved,
                SUM(CASE WHEN status = 'saved' THEN 1 ELSE 0 END) as saved,
                SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM user_schemes
        `).get() as { totalSaved: number; usersWithSaved: number; saved: number; applied: number; completed: number };

        // Top categories
        const topCategories = db.prepare(`
            SELECT category, COUNT(*) as count
            FROM schemes
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY count DESC
            LIMIT 10
        `).all() as { category: string; count: number }[];

        res.json({
            success: true,
            data: {
                schemes: schemeStats,
                users: userStats,
                savedSchemes: savedStats,
                topCategories,
            },
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get analytics',
        });
    }
});

export default router;

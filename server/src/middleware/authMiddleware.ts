/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/authService.js';

// Extend Express Request to include user
export interface AuthRequest extends Request {
    user?: TokenPayload;
}

/**
 * Middleware to verify JWT token
 * Requires valid token in Authorization header
 */
export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'Authorization header is required',
        });
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            error: 'Invalid authorization format. Use: Bearer <token>',
        });
    }

    const token = parts[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }

    req.user = decoded;
    next();
}

/**
 * Middleware to check if user is admin
 * Must be used after authMiddleware
 */
export function adminMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
    }

    next();
}

/**
 * Optional auth middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuthMiddleware(
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            const token = parts[1];
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = decoded;
            }
        }
    }

    next();
}

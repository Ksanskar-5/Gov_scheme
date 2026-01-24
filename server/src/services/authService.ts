/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

// ============================================
// Types
// ============================================

export interface AuthUser {
    id: string;
    email: string;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AuthUserRow {
    id: string;
    email: string;
    password_hash: string;
    role: string;
    is_active: number;
    created_at: string;
    updated_at: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
    role: 'user' | 'admin';
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    token?: string;
    error?: string;
}

// ============================================
// Constants
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'bharat-scheme-guide-default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

// ============================================
// Helper Functions
// ============================================

function rowToAuthUser(row: AuthUserRow): AuthUser {
    return {
        id: row.id,
        email: row.email,
        role: row.role as 'user' | 'admin',
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function generateToken(user: AuthUser): string {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

// ============================================
// Registration
// ============================================

export async function registerUser(
    email: string,
    password: string,
    role: 'user' | 'admin' = 'user'
): Promise<AuthResult> {
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        // Validate password strength
        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Check if user already exists
        const existing = db.prepare('SELECT id FROM auth_users WHERE email = ?').get(email.toLowerCase());
        if (existing) {
            return { success: false, error: 'User with this email already exists' };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const userId = uuidv4();
        const now = new Date().toISOString();

        // Insert user
        db.prepare(`
            INSERT INTO auth_users (id, email, password_hash, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?)
        `).run(userId, email.toLowerCase(), passwordHash, role, now, now);

        // Create associated profile
        db.prepare(`
            INSERT INTO user_profiles (id, auth_user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(uuidv4(), userId, now, now);

        const user: AuthUser = {
            id: userId,
            email: email.toLowerCase(),
            role,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };

        const token = generateToken(user);

        return { success: true, user, token };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Registration failed' };
    }
}

// ============================================
// Login
// ============================================

export async function loginUser(email: string, password: string): Promise<AuthResult> {
    try {
        // Find user
        const row = db.prepare('SELECT * FROM auth_users WHERE email = ?')
            .get(email.toLowerCase()) as AuthUserRow | undefined;

        if (!row) {
            return { success: false, error: 'Invalid email or password' };
        }

        // Check if active
        if (!row.is_active) {
            return { success: false, error: 'Account is deactivated' };
        }

        // Verify password
        const isValid = await bcrypt.compare(password, row.password_hash);
        if (!isValid) {
            return { success: false, error: 'Invalid email or password' };
        }

        const user = rowToAuthUser(row);
        const token = generateToken(user);

        return { success: true, user, token };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
    }
}

// ============================================
// Token Verification
// ============================================

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch {
        return null;
    }
}

// ============================================
// Get User by ID
// ============================================

export function getAuthUserById(id: string): AuthUser | null {
    const row = db.prepare('SELECT * FROM auth_users WHERE id = ?')
        .get(id) as AuthUserRow | undefined;
    return row ? rowToAuthUser(row) : null;
}

// ============================================
// Get User Profile by Auth User ID
// ============================================

export function getProfileByAuthUserId(authUserId: string): string | null {
    // Return the most recently updated profile (the one with actual data)
    const row = db.prepare('SELECT id FROM user_profiles WHERE auth_user_id = ? ORDER BY updated_at DESC LIMIT 1')
        .get(authUserId) as { id: string } | undefined;
    return row ? row.id : null;
}

// ============================================
// Update Password
// ============================================

export async function updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<AuthResult> {
    try {
        const row = db.prepare('SELECT * FROM auth_users WHERE id = ?')
            .get(userId) as AuthUserRow | undefined;

        if (!row) {
            return { success: false, error: 'User not found' };
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, row.password_hash);
        if (!isValid) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Validate new password
        if (newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters' };
        }

        // Hash new password
        const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const now = new Date().toISOString();

        db.prepare('UPDATE auth_users SET password_hash = ?, updated_at = ? WHERE id = ?')
            .run(newHash, now, userId);

        return { success: true };
    } catch (error) {
        console.error('Password update error:', error);
        return { success: false, error: 'Failed to update password' };
    }
}

// ============================================
// Admin Functions
// ============================================

export function getAllUsers(): AuthUser[] {
    const rows = db.prepare('SELECT * FROM auth_users ORDER BY created_at DESC')
        .all() as AuthUserRow[];
    return rows.map(rowToAuthUser);
}

export function setUserRole(userId: string, role: 'user' | 'admin'): boolean {
    const result = db.prepare('UPDATE auth_users SET role = ?, updated_at = datetime("now") WHERE id = ?')
        .run(role, userId);
    return result.changes > 0;
}

export function deactivateUser(userId: string): boolean {
    const result = db.prepare('UPDATE auth_users SET is_active = 0, updated_at = datetime("now") WHERE id = ?')
        .run(userId);
    return result.changes > 0;
}

export function activateUser(userId: string): boolean {
    const result = db.prepare('UPDATE auth_users SET is_active = 1, updated_at = datetime("now") WHERE id = ?')
        .run(userId);
    return result.changes > 0;
}

/**
 * Authentication Service
 * Handles password hashing and JWT token management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'janscheme-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
    id: string;
    email: string;
    name: string | null;
    created_at: Date;
}

interface UserRow {
    id: string;
    email: string;
    password_hash: string;
    name: string | null;
    created_at: Date;
}

export interface AuthResult {
    user: User;
    token: string;
}

// ============================================
// Password Utilities
// ============================================

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ============================================
// JWT Utilities
// ============================================

export function generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded;
    } catch {
        return null;
    }
}

// ============================================
// User Operations
// ============================================

export async function createUser(email: string, password: string, name?: string): Promise<AuthResult> {
    const passwordHash = await hashPassword(password);

    const query = `
        INSERT INTO public.users (email, password_hash, name)
        VALUES ($1, $2, $3)
        RETURNING id, email, name, created_at
    `;

    try {
        const result = await pool.query(query, [email.toLowerCase(), passwordHash, name || null]);
        const user: User = result.rows[0] as User;
        const token = generateToken(user.id);

        return { user, token };
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique violation
            throw new Error('Email already registered');
        }
        throw error;
    }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
    const query = `
        SELECT id, email, password_hash, name, created_at
        FROM public.users
        WHERE email = $1
    `;

    const result = await pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
    }

    const row = result.rows[0];
    const isValid = await verifyPassword(password, row.password_hash);

    if (!isValid) {
        throw new Error('Invalid email or password');
    }

    const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        created_at: row.created_at,
    };

    const token = generateToken(user.id);

    return { user, token };
}

export async function getUserById(id: string): Promise<User | null> {
    const query = `
        SELECT id, email, name, created_at
        FROM public.users
        WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const query = `
        SELECT id, email, name, created_at
        FROM public.users
        WHERE email = $1
    `;

    const result = await pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as User;
}

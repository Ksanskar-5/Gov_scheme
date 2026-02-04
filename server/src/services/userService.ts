/**
 * User Service (PostgreSQL Version)
 * Handles all user profile operations and saved schemes
 */

import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import type {
    UserProfile,
    UserProfileRow
} from '../types/index.js';

// ============================================
// Helper Functions
// ============================================

function rowToProfile(row: UserProfileRow): UserProfile {
    return {
        id: row.id,
        name: row.name || undefined,
        age: row.age || undefined,
        gender: (row.gender as 'male' | 'female' | 'other') || undefined,
        state: row.state || undefined,
        district: row.district || undefined,
        incomeRange: row.income_range as UserProfile['incomeRange'] || undefined,
        profession: row.profession || undefined,
        category: row.category as UserProfile['category'] || undefined,
        isDisabled: Boolean(row.is_disabled),
        isMinority: Boolean(row.is_minority),
        isBPL: Boolean(row.is_bpl),
        isStudent: Boolean(row.is_student),
        isFarmer: Boolean(row.is_farmer),
        isBusinessOwner: Boolean(row.is_business_owner),
        isWorker: Boolean(row.is_worker),
        isWidow: Boolean(row.is_widow),
        isSeniorCitizen: Boolean(row.is_senior_citizen),
        familySize: row.family_size || undefined,
        educationLevel: row.education_level as UserProfile['educationLevel'] || undefined,
        employmentStatus: row.employment_status as UserProfile['employmentStatus'] || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ============================================
// CRUD Operations
// ============================================

export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const id = profile.id || uuidv4();
    const now = new Date().toISOString();

    await pool.query(`
        INSERT INTO public.user_profiles (
            id, name, age, gender, state, district, income_range, profession,
            category, is_disabled, is_minority, is_bpl, is_student, is_farmer,
            is_business_owner, is_worker, is_widow, is_senior_citizen,
            family_size, education_level, employment_status, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21, $22, $23
        )
    `, [
        id,
        profile.name || null,
        profile.age || null,
        profile.gender || null,
        profile.state || null,
        profile.district || null,
        profile.incomeRange || null,
        profile.profession || null,
        profile.category || null,
        profile.isDisabled ? true : false,
        profile.isMinority ? true : false,
        profile.isBPL ? true : false,
        profile.isStudent ? true : false,
        profile.isFarmer ? true : false,
        profile.isBusinessOwner ? true : false,
        profile.isWorker ? true : false,
        profile.isWidow ? true : false,
        profile.isSeniorCitizen ? true : false,
        profile.familySize || null,
        profile.educationLevel || null,
        profile.employmentStatus || null,
        now,
        now
    ]);

    const result = await getUserProfile(id);
    return result!;
}

export async function getUserProfile(id: string): Promise<UserProfile | null> {
    const result = await pool.query(
        'SELECT * FROM public.user_profiles WHERE id = $1',
        [id]
    );
    return result.rows[0] ? rowToProfile(result.rows[0] as UserProfileRow) : null;
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const existing = await getUserProfile(id);
    if (!existing) return null;

    const now = new Date().toISOString();

    await pool.query(`
        UPDATE public.user_profiles SET
            name = COALESCE($1, name),
            age = COALESCE($2, age),
            gender = COALESCE($3, gender),
            state = COALESCE($4, state),
            district = COALESCE($5, district),
            income_range = COALESCE($6, income_range),
            profession = COALESCE($7, profession),
            category = COALESCE($8, category),
            is_disabled = $9,
            is_minority = $10,
            is_bpl = $11,
            is_student = $12,
            is_farmer = $13,
            is_business_owner = $14,
            is_worker = $15,
            is_widow = $16,
            is_senior_citizen = $17,
            family_size = COALESCE($18, family_size),
            education_level = COALESCE($19, education_level),
            employment_status = COALESCE($20, employment_status),
            updated_at = $21
        WHERE id = $22
    `, [
        updates.name,
        updates.age,
        updates.gender,
        updates.state,
        updates.district,
        updates.incomeRange,
        updates.profession,
        updates.category,
        updates.isDisabled !== undefined ? updates.isDisabled : existing.isDisabled,
        updates.isMinority !== undefined ? updates.isMinority : existing.isMinority,
        updates.isBPL !== undefined ? updates.isBPL : existing.isBPL,
        updates.isStudent !== undefined ? updates.isStudent : existing.isStudent,
        updates.isFarmer !== undefined ? updates.isFarmer : existing.isFarmer,
        updates.isBusinessOwner !== undefined ? updates.isBusinessOwner : existing.isBusinessOwner,
        updates.isWorker !== undefined ? updates.isWorker : existing.isWorker,
        updates.isWidow !== undefined ? updates.isWidow : existing.isWidow,
        updates.isSeniorCitizen !== undefined ? updates.isSeniorCitizen : existing.isSeniorCitizen,
        updates.familySize,
        updates.educationLevel,
        updates.employmentStatus,
        now,
        id
    ]);

    return getUserProfile(id);
}

export async function deleteUserProfile(id: string): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM public.user_profiles WHERE id = $1',
        [id]
    );
    return (result.rowCount ?? 0) > 0;
}

// ============================================
// User Saved Schemes
// ============================================

export async function saveSchemeForUser(userId: string, schemeId: number): Promise<boolean> {
    try {
        await pool.query(`
            INSERT INTO public.user_schemes (user_id, scheme_id, status)
            VALUES ($1, $2, 'saved')
            ON CONFLICT(user_id, scheme_id) DO UPDATE SET updated_at = NOW()
        `, [userId, schemeId]);
        return true;
    } catch (error) {
        console.error('Error saving scheme:', error);
        return false;
    }
}

export async function updateSchemeStatus(
    userId: string,
    schemeId: number,
    status: 'saved' | 'applied' | 'completed' | 'rejected',
    notes?: string
): Promise<boolean> {
    const result = await pool.query(`
        UPDATE public.user_schemes 
        SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
        WHERE user_id = $3 AND scheme_id = $4
    `, [status, notes, userId, schemeId]);

    return (result.rowCount ?? 0) > 0;
}

export async function removeSchemeForUser(userId: string, schemeId: number): Promise<boolean> {
    const result = await pool.query(
        'DELETE FROM public.user_schemes WHERE user_id = $1 AND scheme_id = $2',
        [userId, schemeId]
    );
    return (result.rowCount ?? 0) > 0;
}

export async function getUserSavedSchemes(userId: string): Promise<Array<{
    schemeId: number;
    status: string;
    notes: string | null;
    savedAt: string;
}>> {
    const result = await pool.query(`
        SELECT scheme_id, status, notes, created_at
        FROM public.user_schemes
        WHERE user_id = $1
        ORDER BY created_at DESC
    `, [userId]);

    return result.rows.map(row => ({
        schemeId: row.scheme_id,
        status: row.status,
        notes: row.notes,
        savedAt: row.created_at,
    }));
}

export async function isSchemesSaved(userId: string, schemeId: number): Promise<boolean> {
    const result = await pool.query(
        'SELECT 1 FROM public.user_schemes WHERE user_id = $1 AND scheme_id = $2',
        [userId, schemeId]
    );
    return result.rows.length > 0;
}

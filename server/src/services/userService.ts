import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import type {
    UserProfile,
    UserProfileRow
} from '../types/index.js';

// ============================================
// User Profile Service
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

export function createUserProfile(profile: Partial<UserProfile>): UserProfile {
    const id = profile.id || uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
    INSERT INTO user_profiles (
      id, name, age, gender, state, district, income_range, profession,
      category, is_disabled, is_minority, is_bpl, is_student, is_farmer,
      is_business_owner, is_worker, is_widow, is_senior_citizen,
      family_size, education_level, employment_status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

    stmt.run(
        id,
        profile.name || null,
        profile.age || null,
        profile.gender || null,
        profile.state || null,
        profile.district || null,
        profile.incomeRange || null,
        profile.profession || null,
        profile.category || null,
        profile.isDisabled ? 1 : 0,
        profile.isMinority ? 1 : 0,
        profile.isBPL ? 1 : 0,
        profile.isStudent ? 1 : 0,
        profile.isFarmer ? 1 : 0,
        profile.isBusinessOwner ? 1 : 0,
        profile.isWorker ? 1 : 0,
        profile.isWidow ? 1 : 0,
        profile.isSeniorCitizen ? 1 : 0,
        profile.familySize || null,
        profile.educationLevel || null,
        profile.employmentStatus || null,
        now,
        now
    );

    return getUserProfile(id)!;
}

export function getUserProfile(id: string): UserProfile | null {
    const row = db.prepare('SELECT * FROM user_profiles WHERE id = ?')
        .get(id) as UserProfileRow | undefined;

    return row ? rowToProfile(row) : null;
}

export function updateUserProfile(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const existing = getUserProfile(id);
    if (!existing) return null;

    const now = new Date().toISOString();

    const stmt = db.prepare(`
    UPDATE user_profiles SET
      name = COALESCE(?, name),
      age = COALESCE(?, age),
      gender = COALESCE(?, gender),
      state = COALESCE(?, state),
      district = COALESCE(?, district),
      income_range = COALESCE(?, income_range),
      profession = COALESCE(?, profession),
      category = COALESCE(?, category),
      is_disabled = ?,
      is_minority = ?,
      is_bpl = ?,
      is_student = ?,
      is_farmer = ?,
      is_business_owner = ?,
      is_worker = ?,
      is_widow = ?,
      is_senior_citizen = ?,
      family_size = COALESCE(?, family_size),
      education_level = COALESCE(?, education_level),
      employment_status = COALESCE(?, employment_status),
      updated_at = ?
    WHERE id = ?
  `);

    stmt.run(
        updates.name,
        updates.age,
        updates.gender,
        updates.state,
        updates.district,
        updates.incomeRange,
        updates.profession,
        updates.category,
        updates.isDisabled !== undefined ? (updates.isDisabled ? 1 : 0) : existing.isDisabled ? 1 : 0,
        updates.isMinority !== undefined ? (updates.isMinority ? 1 : 0) : existing.isMinority ? 1 : 0,
        updates.isBPL !== undefined ? (updates.isBPL ? 1 : 0) : existing.isBPL ? 1 : 0,
        updates.isStudent !== undefined ? (updates.isStudent ? 1 : 0) : existing.isStudent ? 1 : 0,
        updates.isFarmer !== undefined ? (updates.isFarmer ? 1 : 0) : existing.isFarmer ? 1 : 0,
        updates.isBusinessOwner !== undefined ? (updates.isBusinessOwner ? 1 : 0) : existing.isBusinessOwner ? 1 : 0,
        updates.isWorker !== undefined ? (updates.isWorker ? 1 : 0) : existing.isWorker ? 1 : 0,
        updates.isWidow !== undefined ? (updates.isWidow ? 1 : 0) : existing.isWidow ? 1 : 0,
        updates.isSeniorCitizen !== undefined ? (updates.isSeniorCitizen ? 1 : 0) : existing.isSeniorCitizen ? 1 : 0,
        updates.familySize,
        updates.educationLevel,
        updates.employmentStatus,
        now,
        id
    );

    return getUserProfile(id);
}

export function deleteUserProfile(id: string): boolean {
    const result = db.prepare('DELETE FROM user_profiles WHERE id = ?').run(id);
    return result.changes > 0;
}

// ============================================
// User Saved Schemes
// ============================================

export function saveSchemeForUser(userId: string, schemeId: number): boolean {
    try {
        db.prepare(`
      INSERT INTO user_schemes (user_id, scheme_id, status)
      VALUES (?, ?, 'saved')
      ON CONFLICT(user_id, scheme_id) DO UPDATE SET updated_at = datetime('now')
    `).run(userId, schemeId);
        return true;
    } catch (error) {
        console.error('Error saving scheme:', error);
        return false;
    }
}

export function updateSchemeStatus(
    userId: string,
    schemeId: number,
    status: 'saved' | 'applied' | 'completed' | 'rejected',
    notes?: string
): boolean {
    const result = db.prepare(`
    UPDATE user_schemes 
    SET status = ?, notes = COALESCE(?, notes), updated_at = datetime('now')
    WHERE user_id = ? AND scheme_id = ?
  `).run(status, notes, userId, schemeId);

    return result.changes > 0;
}

export function removeSchemeForUser(userId: string, schemeId: number): boolean {
    const result = db.prepare(
        'DELETE FROM user_schemes WHERE user_id = ? AND scheme_id = ?'
    ).run(userId, schemeId);

    return result.changes > 0;
}

export function getUserSavedSchemes(userId: string): Array<{
    schemeId: number;
    status: string;
    notes: string | null;
    savedAt: string;
}> {
    const rows = db.prepare(`
    SELECT scheme_id, status, notes, created_at
    FROM user_schemes
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Array<{
        scheme_id: number;
        status: string;
        notes: string | null;
        created_at: string;
    }>;

    return rows.map(row => ({
        schemeId: row.scheme_id,
        status: row.status,
        notes: row.notes,
        savedAt: row.created_at,
    }));
}

export function isSchemesSaved(userId: string, schemeId: number): boolean {
    const row = db.prepare(
        'SELECT 1 FROM user_schemes WHERE user_id = ? AND scheme_id = ?'
    ).get(userId, schemeId);

    return !!row;
}

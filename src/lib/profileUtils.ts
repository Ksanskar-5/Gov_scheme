import type { UserProfile } from '@/lib/api';

/**
 * Fields used to calculate profile completeness.
 * Both Dashboard and Profile must use this same list.
 */
export const PROFILE_COMPLETENESS_FIELDS = [
    'name',
    'age',
    'gender',
    'state',
    'district',
    'incomeRange',
    'profession',
    'category',
    'educationLevel',
    'employmentStatus',
    'familySize',
] as const;

/**
 * Calculate profile completeness percentage based on filled fields.
 * @param profile - UserProfile object or partial form data
 * @returns Percentage (0-100) of profile completeness
 */
export function calculateProfileCompleteness(
    profile: Partial<UserProfile> | null | undefined
): number {
    if (!profile) return 0;

    const filledCount = PROFILE_COMPLETENESS_FIELDS.filter((field) => {
        const value = profile[field as keyof typeof profile];
        return value !== undefined && value !== null && value !== '';
    }).length;

    return Math.round((filledCount / PROFILE_COMPLETENESS_FIELDS.length) * 100);
}

/**
 * Calculate profile completeness from form data object.
 * @param formData - Form data object with string values (uses form field names)
 * @returns Percentage (0-100) of profile completeness
 */
export function calculateFormCompleteness(formData: Record<string, unknown>): number {
    // Form field names that map to profile fields
    // The form uses 'fullName' instead of 'name'
    const formFields = [
        'fullName',    // maps to 'name'
        'age',
        'gender',
        'state',
        'district',
        'incomeRange',
        'profession',
        'category',
        'educationLevel',
        'employmentStatus',
        'familySize',
    ];

    const filledCount = formFields.filter((field) => {
        const value = formData[field];
        return value !== undefined && value !== null && value !== '';
    }).length;

    return Math.round((filledCount / formFields.length) * 100);
}

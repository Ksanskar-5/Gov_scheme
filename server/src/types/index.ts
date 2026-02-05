// ============================================
// Core Types for Government Scheme Platform
// ============================================

// Scheme Types
export interface Scheme {
    id: number;
    name: string;
    slug: string;
    details: string;
    benefits: string;
    eligibility: string;
    application: string;
    documents: string;
    level: 'Central' | 'State';
    category: string;
    tags: string[];
    state?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SchemeWithScore extends Scheme {
    relevanceScore: number;
    eligibilityStatus?: EligibilityStatus;
    matchReasons?: string[];
}

// User Profile Types
export interface UserProfile {
    id: string;
    name?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    state?: string;
    district?: string;
    incomeRange?: IncomeRange;
    profession?: string;
    category?: SocialCategory;
    isDisabled?: boolean;
    isMinority?: boolean;
    isBPL?: boolean;
    isStudent?: boolean;
    isFarmer?: boolean;
    isBusinessOwner?: boolean;
    isWorker?: boolean;
    isWidow?: boolean;
    isSeniorCitizen?: boolean;
    familySize?: number;
    educationLevel?: EducationLevel;
    employmentStatus?: EmploymentStatus;
    createdAt: string;
    updatedAt: string;
}

export type IncomeRange =
    | 'below_1lakh'
    | '1lakh_2.5lakh'
    | '2.5lakh_5lakh'
    | '5lakh_10lakh'
    | 'above_10lakh';

export type SocialCategory =
    | 'general'
    | 'obc'
    | 'sc'
    | 'st'
    | 'ews';

export type EducationLevel =
    | 'below_10th'
    | '10th_pass'
    | '12th_pass'
    | 'graduate'
    | 'post_graduate'
    | 'professional';

export type EmploymentStatus =
    | 'unemployed'
    | 'self_employed'
    | 'private_sector'
    | 'government'
    | 'student'
    | 'retired';

// Eligibility Types
export type EligibilityStatus =
    | 'eligible'
    | 'possibly_eligible'
    | 'not_eligible'
    | 'unknown';

export interface EligibilityResult {
    schemeId: number;
    status: EligibilityStatus;
    matchedCriteria: string[];
    unmatchedCriteria: string[];
    confidence: number;
    reasons: string[];
}

// Search Types
export interface SearchQuery {
    query?: string;
    category?: string;
    state?: string;
    level?: 'Central' | 'State' | 'all';
    tags?: string[];
    page?: number;
    limit?: number;
}

export interface SmartSearchQuery {
    query: string;
    userProfile?: Partial<UserProfile>;
}

export interface ParsedIntent {
    intent: string;
    profession?: string;
    eventType?: string;
    category?: string;
    benefitType?: string;
    state?: string;
    keywords: string[];
    entities: Record<string, string>;
}

export interface SearchResult {
    schemes: SchemeWithScore[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    parsedIntent?: ParsedIntent;
}

// Chat Types
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface ChatContext {
    currentSchemeId?: number;
    currentPage?: string;
    userProfile?: Partial<UserProfile>;
    conversationHistory: ChatMessage[];
}

export interface ChatRequest {
    message: string;
    context: ChatContext;
}

export interface ChatResponse {
    reply: string;
    suggestedSchemes?: SchemeWithScore[];
    suggestedActions?: string[];
    missingProfileFields?: string[];
    applicationSteps?: {
        step: number;
        title: string;
        description: string;
        link?: string;
    }[];
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Database Row Types (for SQLite)
export interface SchemeRow {
    id: number;
    name: string;
    slug: string;
    details: string;
    benefits: string;
    eligibility: string;
    application: string;
    documents: string;
    level: string;
    category: string;
    tags: string;
    state: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserProfileRow {
    id: string;
    name: string | null;
    age: number | null;
    gender: string | null;
    state: string | null;
    district: string | null;
    income_range: string | null;
    profession: string | null;
    category: string | null;
    is_disabled: number;
    is_minority: number;
    is_bpl: number;
    is_student: number;
    is_farmer: number;
    is_business_owner: number;
    is_worker: number;
    is_widow: number;
    is_senior_citizen: number;
    family_size: number | null;
    education_level: string | null;
    employment_status: string | null;
    created_at: string;
    updated_at: string;
}

// Constants
export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Jammu & Kashmir',
    'Ladakh', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli',
    'Daman & Diu', 'Lakshadweep'
];

export const SCHEME_CATEGORIES = [
    'Agriculture,Rural & Environment',
    'Banking,Financial Services and Insurance',
    'Business & Entrepreneurship',
    'Education & Learning',
    'Health & Wellness',
    'Housing & Shelter',
    'Public Safety,Law & Justice',
    'Science,IT & Communications',
    'Skills & Employment',
    'Social welfare & Empowerment',
    'Sports & Culture',
    'Transport & Infrastructure',
    'Travel & Tourism',
    'Utility & Sanitation',
    'Women and Child'
];

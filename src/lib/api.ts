// ============================================
// API Service for JanScheme Frontend
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============================================
// Types (matching backend types)
// ============================================

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

export type EligibilityStatus =
    | 'eligible'
    | 'possibly_eligible'
    | 'not_eligible'
    | 'unknown';

export interface UserProfile {
    id?: string;
    name?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    state?: string;
    district?: string;
    incomeRange?: string;
    profession?: string;
    category?: 'general' | 'obc' | 'sc' | 'st' | 'ews';
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
    educationLevel?: string;
    employmentStatus?: string;
}

export interface EligibilityResult {
    schemeId: number;
    status: EligibilityStatus;
    matchedCriteria: string[];
    unmatchedCriteria: string[];
    confidence: number;
    reasons: string[];
}

export interface SearchResult {
    schemes: SchemeWithScore[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    parsedIntent?: {
        intent: string;
        keywords: string[];
        entities: Record<string, string>;
    };
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatResponse {
    reply: string;
    suggestedSchemes?: SchemeWithScore[];
    suggestedActions?: string[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// API Request Helper
// ============================================

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `HTTP error ${response.status}`,
            };
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

// ============================================
// Scheme APIs
// ============================================

export async function getSchemes(
    page = 1,
    limit = 20
): Promise<ApiResponse<Scheme[]>> {
    return apiRequest<Scheme[]>(`/schemes?page=${page}&limit=${limit}`);
}

export async function getSchemeBySlug(slug: string): Promise<ApiResponse<Scheme>> {
    return apiRequest<Scheme>(`/schemes/${slug}`);
}

export async function getSchemeById(id: number): Promise<ApiResponse<Scheme>> {
    return apiRequest<Scheme>(`/schemes/${id}`);
}

export async function searchSchemes(params: {
    query?: string;
    category?: string;
    state?: string;
    level?: 'Central' | 'State' | 'all';
    tags?: string[];
    page?: number;
    limit?: number;
}): Promise<ApiResponse<Scheme[]>> {
    const queryParams = new URLSearchParams();

    if (params.query) queryParams.set('q', params.query);
    if (params.category) queryParams.set('category', params.category);
    if (params.state) queryParams.set('state', params.state);
    if (params.level) queryParams.set('level', params.level);
    if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    return apiRequest<Scheme[]>(`/schemes/search?${queryParams.toString()}`);
}

export async function getSchemeFilters(): Promise<ApiResponse<{
    categories: string[];
    states: string[];
    tags: string[];
    levels: string[];
}>> {
    return apiRequest(`/schemes/filters`);
}

export async function getSchemeStats(): Promise<ApiResponse<{
    total: number;
    central: number;
    state: number;
    categories: number;
}>> {
    return apiRequest(`/schemes/stats`);
}

export async function checkSchemeEligibility(
    schemeId: number,
    userProfile: Partial<UserProfile>
): Promise<ApiResponse<EligibilityResult>> {
    return apiRequest<EligibilityResult>(`/schemes/${schemeId}/check-eligibility`, {
        method: 'POST',
        body: JSON.stringify(userProfile),
    });
}

// ============================================
// Smart Search APIs
// ============================================

export async function smartSearch(
    query: string,
    userProfile?: Partial<UserProfile>,
    page = 1,
    limit = 20
): Promise<ApiResponse<SearchResult>> {
    return apiRequest<SearchResult>('/search/smart', {
        method: 'POST',
        body: JSON.stringify({
            query,
            userProfile,
            page,
            limit,
        }),
    });
}

export async function getRecommendations(
    userProfile: Partial<UserProfile>,
    limit = 10
): Promise<ApiResponse<SchemeWithScore[]>> {
    return apiRequest<SchemeWithScore[]>('/search/recommendations', {
        method: 'POST',
        body: JSON.stringify({
            userProfile,
            limit,
        }),
    });
}

export async function searchByCategory(
    category: string,
    state?: string,
    page = 1,
    limit = 20
): Promise<ApiResponse<SearchResult>> {
    const queryParams = new URLSearchParams();
    if (state) queryParams.set('state', state);
    queryParams.set('page', page.toString());
    queryParams.set('limit', limit.toString());

    return apiRequest<SearchResult>(
        `/search/category/${encodeURIComponent(category)}?${queryParams.toString()}`
    );
}

export async function searchByLifeEvent(
    event: string,
    state?: string,
    page = 1,
    limit = 20
): Promise<ApiResponse<SearchResult>> {
    const queryParams = new URLSearchParams();
    if (state) queryParams.set('state', state);
    queryParams.set('page', page.toString());
    queryParams.set('limit', limit.toString());

    return apiRequest<SearchResult>(
        `/search/life-event/${encodeURIComponent(event)}?${queryParams.toString()}`
    );
}

export async function getLifeEvents(): Promise<ApiResponse<Array<{
    id: string;
    label: string;
    icon: string;
}>>> {
    return apiRequest('/search/life-events');
}

// ============================================
// User Profile APIs
// ============================================

export async function createUserProfile(
    profile: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
    return apiRequest<UserProfile>('/users/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
    });
}

export async function getUserProfile(id: string): Promise<ApiResponse<UserProfile>> {
    return apiRequest<UserProfile>(`/users/${id}/profile`);
}

export async function updateUserProfile(
    id: string,
    profile: Partial<UserProfile>
): Promise<ApiResponse<UserProfile>> {
    return apiRequest<UserProfile>(`/users/${id}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profile),
    });
}

// ============================================
// Saved Schemes APIs
// ============================================

export async function getSavedSchemes(userId: string): Promise<ApiResponse<Array<{
    schemeId: number;
    status: string;
    notes: string | null;
    savedAt: string;
    scheme: Scheme;
}>>> {
    return apiRequest(`/users/${userId}/schemes`);
}

export async function saveScheme(userId: string, schemeId: number): Promise<ApiResponse<void>> {
    return apiRequest(`/users/${userId}/schemes/${schemeId}`, {
        method: 'POST',
    });
}

export async function updateSavedSchemeStatus(
    userId: string,
    schemeId: number,
    status: 'saved' | 'applied' | 'completed' | 'rejected',
    notes?: string
): Promise<ApiResponse<void>> {
    return apiRequest(`/users/${userId}/schemes/${schemeId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
    });
}

export async function removeSavedScheme(userId: string, schemeId: number): Promise<ApiResponse<void>> {
    return apiRequest(`/users/${userId}/schemes/${schemeId}`, {
        method: 'DELETE',
    });
}

export async function getPersonalizedRecommendations(
    userId: string,
    limit = 10
): Promise<ApiResponse<SchemeWithScore[]>> {
    return apiRequest<SchemeWithScore[]>(`/users/${userId}/recommendations?limit=${limit}`);
}

// ============================================
// Chat APIs
// ============================================

export async function sendChatMessage(
    message: string,
    context: {
        currentSchemeId?: number;
        currentPage?: string;
        userProfile?: Partial<UserProfile>;
        conversationHistory?: ChatMessage[];
    }
): Promise<ApiResponse<ChatResponse>> {
    return apiRequest<ChatResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify({
            message,
            context,
        }),
    });
}

export async function getChatStatus(): Promise<ApiResponse<{
    aiAvailable: boolean;
    mode: 'ai' | 'fallback';
}>> {
    return apiRequest('/chat/status');
}

export async function getChatSuggestions(
    schemeId?: number,
    page?: string
): Promise<ApiResponse<string[]>> {
    const queryParams = new URLSearchParams();
    if (schemeId) queryParams.set('schemeId', schemeId.toString());
    if (page) queryParams.set('page', page);

    return apiRequest<string[]>(`/chat/suggestions?${queryParams.toString()}`);
}

// ============================================
// Health Check
// ============================================

export async function checkApiHealth(): Promise<ApiResponse<{
    message: string;
    timestamp: string;
    version: string;
}>> {
    return apiRequest('/health');
}

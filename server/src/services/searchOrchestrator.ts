import { smartSearch, searchSchemes } from './schemeService.js';
import { parseQueryLocal, extractSearchKeywords, getSuggestedCategories } from './queryParser.js';
import { checkBatchEligibility, scoreSchemesByEligibility } from './eligibilityEngine.js';
import type {
    SmartSearchQuery,
    SearchResult,
    UserProfile,
    SchemeWithScore,
    ParsedIntent
} from '../types/index.js';

// ============================================
// Search Orchestrator
// ============================================
// Combines query parsing, vector search, and eligibility engine

export async function orchestrateSmartSearch(
    request: SmartSearchQuery,
    page = 1,
    limit = 20
): Promise<SearchResult> {
    const { query, userProfile } = request;

    // Step 1: Parse the query to extract intent and keywords
    const parsedIntent = parseQueryLocal(query);
    const keywords = extractSearchKeywords(query);
    const suggestedCategories = getSuggestedCategories(query);

    console.log('🔍 Search Query:', query);
    console.log('📋 Parsed Intent:', parsedIntent);
    console.log('🔑 Keywords:', keywords);

    // Step 2: Perform keyword-based search with scoring
    const filters: { category?: string; state?: string; level?: 'Central' | 'State' | 'all' } = {};

    // Add category filter if strongly identified
    if (suggestedCategories.length > 0) {
        filters.category = suggestedCategories[0];
    }

    // Add state filter from parsed intent or user profile
    if (parsedIntent.state) {
        filters.state = parsedIntent.state;
    } else if (userProfile?.state) {
        filters.state = userProfile.state;
    }

    // Step 3: Execute smart search
    const searchResult = smartSearch(keywords, filters, page, limit);

    // Step 4: If user profile is available, enhance with eligibility scoring
    let enhancedSchemes: SchemeWithScore[] = searchResult.data;

    if (userProfile && Object.keys(userProfile).length > 0) {
        // Get eligibility results for all schemes
        const eligibilityResults = checkBatchEligibility(userProfile, searchResult.data);

        // Enhance schemes with eligibility info
        enhancedSchemes = searchResult.data.map(scheme => {
            const eligibility = eligibilityResults.get(scheme.id);
            return {
                ...scheme,
                eligibilityStatus: eligibility?.status,
                matchReasons: eligibility?.matchedCriteria || [],
                // Adjust relevance score based on eligibility
                relevanceScore: scheme.relevanceScore + (
                    eligibility?.status === 'eligible' ? 50 :
                        eligibility?.status === 'possibly_eligible' ? 25 :
                            eligibility?.status === 'unknown' ? 10 : 0
                ),
            };
        });

        // Re-sort by combined score
        enhancedSchemes.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return {
        schemes: enhancedSchemes,
        total: searchResult.pagination.total,
        page: searchResult.pagination.page,
        limit: searchResult.pagination.limit,
        totalPages: searchResult.pagination.totalPages,
        parsedIntent,
    };
}

// ============================================
// Get Personalized Recommendations
// ============================================

export async function getPersonalizedRecommendations(
    userProfile: Partial<UserProfile>,
    limit = 10
): Promise<SchemeWithScore[]> {
    // Build search keywords from user profile
    const profileKeywords: string[] = [];

    // Profession-based keywords
    if (userProfile.isFarmer || userProfile.profession?.toLowerCase().includes('farmer')) {
        profileKeywords.push('farmer', 'agriculture', 'kisan', 'crop', 'farming');
    }

    if (userProfile.isStudent || userProfile.employmentStatus === 'student') {
        profileKeywords.push('student', 'education', 'scholarship', 'study', 'college');
    }

    if (userProfile.isWorker || userProfile.profession?.toLowerCase().includes('worker')) {
        profileKeywords.push('worker', 'labour', 'construction', 'unorganized');
    }

    if (userProfile.isBusinessOwner) {
        profileKeywords.push('business', 'msme', 'entrepreneur', 'loan', 'startup');
    }

    // Special status keywords
    if (userProfile.isWidow) {
        profileKeywords.push('widow', 'pension', 'assistance', 'mahila');
    }

    if (userProfile.isSeniorCitizen || (userProfile.age && userProfile.age >= 60)) {
        profileKeywords.push('senior', 'elderly', 'pension', 'old age', 'vridha');
    }

    if (userProfile.isDisabled) {
        profileKeywords.push('disabled', 'disability', 'divyang', 'pwd', 'handicapped');
    }

    if (userProfile.isBPL) {
        profileKeywords.push('bpl', 'poverty', 'poor', 'welfare', 'subsidy');
    }

    // Category-based keywords (SC/ST/OBC/EWS)
    if (userProfile.category === 'sc' || userProfile.category === 'st') {
        profileKeywords.push('sc', 'st', 'scheduled', 'tribal', 'caste');
    }

    if (userProfile.category === 'obc') {
        profileKeywords.push('obc', 'backward', 'class', 'reservation');
    }

    if (userProfile.category === 'ews') {
        profileKeywords.push('ews', 'economically weaker', 'general category');
    }

    // Gender-based keywords
    if (userProfile.gender === 'female') {
        profileKeywords.push('women', 'female', 'mahila', 'girl', 'lady');
    }

    // Minority status
    if (userProfile.isMinority) {
        profileKeywords.push('minority', 'muslim', 'christian', 'sikh', 'buddhist', 'jain', 'parsi');
    }

    // Income-based keywords
    if (userProfile.incomeRange === 'below_1lakh' || userProfile.incomeRange === '1lakh_2.5lakh') {
        profileKeywords.push('low income', 'poor', 'subsidy', 'free', 'assistance');
    }

    // Age group keywords
    if (userProfile.age) {
        if (userProfile.age >= 18 && userProfile.age <= 35) {
            profileKeywords.push('youth', 'young', 'skill', 'employment');
        } else if (userProfile.age < 18) {
            profileKeywords.push('child', 'minor', 'education', 'school');
        }
    }

    // Education level keywords
    if (userProfile.educationLevel) {
        if (userProfile.educationLevel === 'graduate' || userProfile.educationLevel === 'post_graduate') {
            profileKeywords.push('graduate', 'higher education', 'research');
        }
        if (userProfile.educationLevel === 'below_10th' || userProfile.educationLevel === '10th_pass') {
            profileKeywords.push('basic education', 'literacy', 'skill training');
        }
    }

    // Default keywords if profile is minimal
    if (profileKeywords.length === 0) {
        profileKeywords.push('welfare', 'assistance', 'benefit', 'scheme');
    }

    // Deduplicate keywords
    const uniqueKeywords = [...new Set(profileKeywords)];

    // Search with profile-based keywords
    const searchResult = smartSearch(
        uniqueKeywords,
        { state: userProfile.state },
        1,
        limit * 3 // Get more to filter properly
    );

    // Score by eligibility
    const scoredSchemes = scoreSchemesByEligibility(userProfile, searchResult.data);

    // Filter to only include eligible or possibly eligible schemes
    const filteredSchemes = scoredSchemes.filter(
        ({ eligibility }) => eligibility.status === 'eligible' || eligibility.status === 'possibly_eligible'
    );

    // Return top schemes
    return filteredSchemes
        .slice(0, limit)
        .map(({ scheme, eligibility }) => ({
            ...scheme,
            eligibilityStatus: eligibility.status,
            matchReasons: eligibility.matchedCriteria,
            relevanceScore: (scheme as SchemeWithScore).relevanceScore || 0,
        }));
}

// ============================================
// Category-based Search
// ============================================

export function searchByCategory(
    category: string,
    userProfile?: Partial<UserProfile>,
    page = 1,
    limit = 20
): SearchResult {
    const result = searchSchemes({
        category,
        state: userProfile?.state,
        page,
        limit,
    });

    let schemes: SchemeWithScore[] = result.data.map(s => ({
        ...s,
        relevanceScore: 0,
    }));

    // Apply eligibility if profile available
    if (userProfile && Object.keys(userProfile).length > 0) {
        const eligibilityResults = checkBatchEligibility(userProfile, result.data);

        schemes = schemes.map(scheme => {
            const eligibility = eligibilityResults.get(scheme.id);
            return {
                ...scheme,
                eligibilityStatus: eligibility?.status,
                matchReasons: eligibility?.matchedCriteria || [],
            };
        });
    }

    return {
        schemes,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
    };
}

// ============================================
// Life Event Based Search
// ============================================

const LIFE_EVENT_KEYWORDS: Record<string, string[]> = {
    'death_in_family': ['death', 'deceased', 'relief', 'funeral', 'compensation', 'ex-gratia'],
    'marriage': ['marriage', 'wedding', 'vivah', 'shadi', 'incentive'],
    'childbirth': ['maternity', 'pregnancy', 'child', 'newborn', 'delivery', 'maternal'],
    'education_start': ['admission', 'school', 'college', 'education', 'scholarship', 'fee'],
    'job_loss': ['unemployment', 'job loss', 'laid off', 'employment', 'assistance'],
    'starting_business': ['startup', 'new business', 'entrepreneur', 'loan', 'msme'],
    'retirement': ['pension', 'retired', 'retirement', 'senior', 'elderly'],
    'disability': ['disability', 'disabled', 'accident', 'handicapped', 'divyang'],
    'natural_disaster': ['flood', 'drought', 'disaster', 'relief', 'compensation'],
    'crop_loss': ['crop failure', 'crop loss', 'farmer', 'agriculture', 'compensation'],
};

export async function searchByLifeEvent(
    event: string,
    userProfile?: Partial<UserProfile>,
    page = 1,
    limit = 20
): Promise<SearchResult> {
    const keywords = LIFE_EVENT_KEYWORDS[event] || [event];

    const searchResult = smartSearch(
        keywords,
        { state: userProfile?.state },
        page,
        limit
    );

    let schemes: SchemeWithScore[] = searchResult.data;

    if (userProfile && Object.keys(userProfile).length > 0) {
        const eligibilityResults = checkBatchEligibility(userProfile, searchResult.data);

        schemes = schemes.map(scheme => {
            const eligibility = eligibilityResults.get(scheme.id);
            return {
                ...scheme,
                eligibilityStatus: eligibility?.status,
                matchReasons: eligibility?.matchedCriteria || [],
                relevanceScore: scheme.relevanceScore + (
                    eligibility?.status === 'eligible' ? 50 :
                        eligibility?.status === 'possibly_eligible' ? 25 : 0
                ),
            };
        });

        schemes.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return {
        schemes,
        total: searchResult.pagination.total,
        page: searchResult.pagination.page,
        limit: searchResult.pagination.limit,
        totalPages: searchResult.pagination.totalPages,
        parsedIntent: {
            intent: event,
            keywords,
            entities: {},
        },
    };
}

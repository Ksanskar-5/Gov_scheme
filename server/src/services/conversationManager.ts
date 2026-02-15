import type { UserProfile, Scheme } from '../types/index.js';

// ============================================
// Conversation Manager - Multi-turn State
// ============================================

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ConversationState {
    sessionId: string;
    userId?: string;
    messages: Message[];
    collectedProfile: Partial<UserProfile>;
    missingFields: string[];
    searchContext: {
        intent: string;
        keywords: string[];
        query: string;
        filters: Record<string, string>;
    };
    phase: 'greeting' | 'gathering' | 'searching' | 'presenting' | 'refining';
    lastSchemes: Scheme[];
    createdAt: Date;
    updatedAt: Date;
}

// Important fields for scheme matching
const CRITICAL_FIELDS: (keyof UserProfile)[] = ['state', 'profession', 'age'];
const HELPFUL_FIELDS: (keyof UserProfile)[] = ['gender', 'incomeRange', 'category'];

// ============================================
// Initialize Conversation
// ============================================

export function initConversation(
    sessionId: string,
    existingProfile?: Partial<UserProfile>,
    userId?: string
): ConversationState {
    const profile = existingProfile || {};

    // Determine missing fields
    const missingCritical = CRITICAL_FIELDS.filter(f => !profile[f]);
    const missingHelpful = HELPFUL_FIELDS.filter(f => !profile[f]);

    return {
        sessionId,
        userId,
        messages: [],
        collectedProfile: profile,
        missingFields: [...missingCritical, ...missingHelpful],
        searchContext: {
            intent: '',
            keywords: [],
            query: '',
            filters: {},
        },
        phase: Object.keys(profile).length > 2 ? 'searching' : 'greeting',
        lastSchemes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

// ============================================
// Add Message to Conversation
// ============================================

export function addMessage(
    state: ConversationState,
    role: 'user' | 'assistant',
    content: string
): ConversationState {
    return {
        ...state,
        messages: [
            ...state.messages,
            { role, content, timestamp: new Date() }
        ],
        updatedAt: new Date(),
    };
}

// ============================================
// Extract Profile Info from Message
// ============================================

export function extractProfileFromMessage(
    message: string,
    currentProfile: Partial<UserProfile>
): Partial<UserProfile> {
    const updates: Partial<UserProfile> = {};
    const msg = message.toLowerCase();

    // Extract age
    const ageMatch = msg.match(/(\d{1,2})\s*(years?|yrs?|yo)?\s*(old)?/);
    if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        if (age >= 10 && age <= 100) {
            updates.age = age;
        }
    }

    // Extract state
    const states = [
        'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
        'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand',
        'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur',
        'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab',
        'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura',
        'uttar pradesh', 'uttarakhand', 'west bengal', 'delhi'
    ];
    for (const state of states) {
        if (msg.includes(state)) {
            updates.state = state.split(' ').map(w =>
                w.charAt(0).toUpperCase() + w.slice(1)
            ).join(' ');
            break;
        }
    }

    // Extract profession
    const professions: Record<string, string> = {
        'farmer': 'Farmer',
        'student': 'Student',
        'teacher': 'Teacher',
        'doctor': 'Doctor',
        'engineer': 'Engineer',
        'business': 'Business Owner',
        'entrepreneur': 'Entrepreneur',
        'unemployed': 'Unemployed',
        'retired': 'Retired',
        'homemaker': 'Homemaker',
        'worker': 'Worker',
        'labour': 'Labourer',
        'artisan': 'Artisan',
    };
    for (const [key, value] of Object.entries(professions)) {
        if (msg.includes(key)) {
            updates.profession = value;
            if (key === 'farmer') updates.isFarmer = true;
            if (key === 'student') updates.isStudent = true;
            if (key === 'business' || key === 'entrepreneur') updates.isBusinessOwner = true;
            break;
        }
    }

    // Extract gender
    if (msg.includes('female') || msg.includes('woman') || msg.includes('girl')) {
        updates.gender = 'female';
    } else if (msg.includes('male') || msg.includes('man') || msg.includes('boy')) {
        updates.gender = 'male';
    }

    // Extract income
    if (msg.includes('bpl') || msg.includes('below poverty')) {
        updates.isBPL = true;
        updates.incomeRange = 'below_1lakh';
    } else if (msg.match(/(\d+)\s*lakh/)) {
        const match = msg.match(/(\d+)\s*lakh/);
        if (match) {
            const lakhs = parseInt(match[1]);
            if (lakhs < 1) updates.incomeRange = 'below_1lakh';
            else if (lakhs < 2.5) updates.incomeRange = '1lakh_2.5lakh';
            else if (lakhs < 5) updates.incomeRange = '2.5lakh_5lakh';
            else if (lakhs < 10) updates.incomeRange = '5lakh_10lakh';
            else updates.incomeRange = 'above_10lakh';
        }
    }

    // Extract category
    const categories: Record<string, string> = {
        'general': 'general',
        'obc': 'obc',
        'sc': 'sc',
        'st': 'st',
        'ews': 'ews',
    };
    for (const [key, value] of Object.entries(categories)) {
        if (msg.includes(key)) {
            updates.category = value as 'general' | 'obc' | 'sc' | 'st' | 'ews';
            break;
        }
    }

    return { ...currentProfile, ...updates };
}

// ============================================
// Get Next Question for Missing Info
// ============================================

export function getNextQuestion(state: ConversationState): string | null {
    const profile = state.collectedProfile;

    // Check critical fields first
    if (!profile.state) {
        return "Which state are you from? This helps me find both central and state-specific schemes for you.";
    }
    if (!profile.profession && !profile.isFarmer && !profile.isStudent && !profile.isBusinessOwner) {
        return "What's your occupation? For example: farmer, student, business owner, worker, etc.";
    }
    if (!profile.age) {
        return "Could you tell me your age? Some schemes have age-specific eligibility criteria.";
    }

    // Optional: Ask about income if discussing welfare schemes
    if (!profile.incomeRange && state.searchContext.intent.includes('welfare')) {
        return "What's your approximate annual family income? This helps me find subsidy and welfare schemes.";
    }

    return null;
}

// ============================================
// Detect Search Intent from Message
// ============================================

export function detectIntent(message: string): {
    intent: string;
    keywords: string[];
} {
    const msg = message.toLowerCase();
    let intent = 'general';
    const keywords: string[] = [];

    const intents: Record<string, string[]> = {
        'education': ['education', 'scholarship', 'student', 'study', 'school', 'college', 'fee'],
        'agriculture': ['farmer', 'farm', 'agriculture', 'crop', 'kisan', 'irrigation'],
        'business': ['business', 'loan', 'msme', 'startup', 'entrepreneur'],
        'health': ['health', 'medical', 'hospital', 'treatment', 'insurance'],
        'housing': ['house', 'home', 'housing', 'awas', 'shelter'],
        'employment': ['job', 'employment', 'skill', 'training', 'unemployed'],
        'women': ['women', 'woman', 'mahila', 'widow', 'girl'],
        'senior': ['pension', 'elderly', 'senior', 'old age', 'retired'],
        'welfare': ['welfare', 'subsidy', 'benefit', 'poor', 'bpl', 'ration'],
    };

    for (const [intentName, intentKeywords] of Object.entries(intents)) {
        for (const kw of intentKeywords) {
            if (msg.includes(kw)) {
                intent = intentName;
                keywords.push(kw);
            }
        }
    }

    // Extract other meaningful words
    const words = msg.split(/\s+/).filter(w => w.length > 3);
    const stopWords = new Set(['what', 'which', 'where', 'when', 'that', 'this', 'with', 'from', 'have', 'find', 'help', 'want', 'need', 'please', 'about', 'schemes', 'scheme']);

    for (const word of words) {
        if (!stopWords.has(word) && !keywords.includes(word)) {
            keywords.push(word);
        }
    }

    return { intent, keywords: keywords.slice(0, 10) };
}

// ============================================
// Update Conversation State
// ============================================

export function processUserMessage(
    state: ConversationState,
    message: string
): ConversationState {
    // Add user message
    let newState = addMessage(state, 'user', message);

    // Extract profile info
    const updatedProfile = extractProfileFromMessage(message, newState.collectedProfile);
    const profileChanged = JSON.stringify(updatedProfile) !== JSON.stringify(newState.collectedProfile);

    // Detect intent
    const { intent, keywords } = detectIntent(message);

    // Update missing fields
    const missingCritical = CRITICAL_FIELDS.filter(f => !updatedProfile[f]);
    const missingHelpful = HELPFUL_FIELDS.filter(f => !updatedProfile[f]);

    // Determine phase
    let phase = newState.phase;
    if (missingCritical.length >= 2 && newState.phase === 'greeting') {
        phase = 'gathering';
    } else if (missingCritical.length === 0 || keywords.length >= 2) {
        phase = 'searching';
    }

    return {
        ...newState,
        collectedProfile: updatedProfile,
        missingFields: [...missingCritical, ...missingHelpful],
        searchContext: {
            intent,
            keywords,
            query: buildSearchQueryFromContext(updatedProfile, intent, keywords),
            filters: {
                ...(updatedProfile.state ? { state: updatedProfile.state } : {}),
            },
        },
        phase,
        updatedAt: new Date(),
    };
}

// ============================================
// Build Search Query from Context
// ============================================

function buildSearchQueryFromContext(
    profile: Partial<UserProfile>,
    intent: string,
    keywords: string[]
): string {
    const parts: string[] = [...keywords];

    // Add profile context
    if (profile.profession) parts.push(profile.profession);
    if (profile.isFarmer) parts.push('farmer agriculture');
    if (profile.isStudent) parts.push('student education');
    if (profile.isBusinessOwner) parts.push('business MSME');
    if (profile.isBPL) parts.push('BPL welfare subsidy');
    if (profile.gender === 'female') parts.push('women');
    if (profile.age && profile.age >= 60) parts.push('senior pension');

    // Add intent-based terms
    if (intent !== 'general') {
        parts.push(intent);
    }

    return [...new Set(parts)].join(' ');
}

// ============================================
// Should Ask More Questions?
// ============================================

export function shouldAskQuestion(state: ConversationState): boolean {
    // Don't ask if user has clear intent with keywords
    if (state.searchContext.keywords.length >= 3) {
        return false;
    }

    // Ask if missing critical fields and in gathering phase
    if (state.phase === 'gathering' && state.missingFields.length > 0) {
        const criticalMissing = CRITICAL_FIELDS.filter(f => !state.collectedProfile[f]);
        return criticalMissing.length > 0;
    }

    return false;
}

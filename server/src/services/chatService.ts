import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
    ChatRequest,
    ChatResponse,
    Scheme,
    UserProfile,
    SchemeWithScore,
    EligibilityResult
} from '../types/index.js';
import { getSchemeById, getAllSchemes } from './schemeService.js';
import { checkEligibility, scoreSchemesByEligibility } from './eligibilityEngine.js';
import { smartSearch } from './schemeService.js';
import { extractSearchKeywords } from './queryParser.js';

// ============================================
// Chatbot Service - Enhanced with Profile Intelligence
// ============================================

let genAI: GoogleGenerativeAI | null = null;
let isInitialized = false;

function getGeminiClient(): GoogleGenerativeAI | null {
    if (!isInitialized) {
        isInitialized = true;
        const apiKey = process.env.GEMINI_API_KEY;
        console.log(`🔑 API Key from env: ${apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : 'NOT SET'}`);
        if (apiKey && apiKey !== 'your_gemini_api_key_here') {
            genAI = new GoogleGenerativeAI(apiKey);
            console.log('✅ Gemini AI initialized with API key');
        } else {
            console.warn('⚠️ No valid Gemini API key found, using fallback responses');
        }
    }
    return genAI;
}

// ============================================
// Profile Analysis & Missing Fields Detection
// ============================================

const CRITICAL_PROFILE_FIELDS = ['age', 'state', 'profession', 'gender', 'incomeRange'] as const;
const OPTIONAL_PROFILE_FIELDS = ['category', 'educationLevel', 'employmentStatus', 'familySize'] as const;

interface ProfileAnalysis {
    completeness: number;
    missingCriticalFields: string[];
    missingOptionalFields: string[];
    detectedIntent: string[];
}

function analyzeProfile(profile: Partial<UserProfile> | undefined): ProfileAnalysis {
    const missingCritical: string[] = [];
    const missingOptional: string[] = [];
    const detectedIntent: string[] = [];

    if (!profile) {
        return {
            completeness: 0,
            missingCriticalFields: [...CRITICAL_PROFILE_FIELDS],
            missingOptionalFields: [...OPTIONAL_PROFILE_FIELDS],
            detectedIntent: []
        };
    }

    // Check critical fields
    for (const field of CRITICAL_PROFILE_FIELDS) {
        if (!profile[field]) {
            missingCritical.push(field);
        }
    }

    // Check optional fields
    for (const field of OPTIONAL_PROFILE_FIELDS) {
        if (!profile[field]) {
            missingOptional.push(field);
        }
    }

    // Detect user intent based on profile
    if (profile.isFarmer || profile.profession?.toLowerCase().includes('farmer')) {
        detectedIntent.push('agriculture', 'farmer');
    }
    if (profile.isStudent || profile.employmentStatus === 'student') {
        detectedIntent.push('education', 'scholarship');
    }
    if (profile.isBusinessOwner) {
        detectedIntent.push('business', 'msme');
    }
    if (profile.gender === 'female') {
        detectedIntent.push('women');
    }
    if (profile.age && profile.age >= 60) {
        detectedIntent.push('senior', 'pension');
    }
    if (profile.isBPL || profile.incomeRange === 'below_1lakh') {
        detectedIntent.push('welfare', 'subsidy');
    }

    const totalFields = CRITICAL_PROFILE_FIELDS.length + OPTIONAL_PROFILE_FIELDS.length;
    const filledFields = totalFields - missingCritical.length - missingOptional.length;
    const completeness = Math.round((filledFields / totalFields) * 100);

    return {
        completeness,
        missingCriticalFields: missingCritical,
        missingOptionalFields: missingOptional,
        detectedIntent
    };
}

// ============================================
// Personalized Scheme Recommendations
// ============================================

interface SchemeWithEligibility extends Scheme {
    eligibility_status: string;
    eligibility_score: number;
    relevanceScore: number;
    matchedCriteria: string[];
    unmatchedCriteria: string[];
}

async function getPersonalizedRecommendations(
    profile: Partial<UserProfile> | undefined,
    query?: string,
    limit: number = 5
): Promise<SchemeWithEligibility[]> {
    let schemes: Scheme[] = [];

    // Step 1: Get relevant schemes
    if (query) {
        const keywords = extractSearchKeywords(query);
        if (keywords.length > 0) {
            const searchResult = await smartSearch(keywords, {}, 1, 20);
            schemes = searchResult.data;
        }
    }

    // If no query or no results, use profile to find schemes
    if (schemes.length === 0 && profile) {
        const analysis = analyzeProfile(profile);
        if (analysis.detectedIntent.length > 0) {
            const searchResult = await smartSearch(analysis.detectedIntent, {}, 1, 20);
            schemes = searchResult.data;
        }
    }

    // Fallback: get popular schemes
    if (schemes.length === 0) {
        const allSchemesResult = await getAllSchemes(1, 20);
        schemes = allSchemesResult.data;
    }

    // Step 2: Score schemes by eligibility
    if (!profile || Object.keys(profile).length === 0) {
        // No profile - return schemes without eligibility scoring
        return schemes.slice(0, limit).map(s => ({
            ...s,
            eligibility_status: 'unknown',
            eligibility_score: 50,
            relevanceScore: 50,
            matchedCriteria: [],
            unmatchedCriteria: []
        }));
    }

    // Run eligibility engine
    const scored = scoreSchemesByEligibility(profile, schemes);

    // Filter and map
    return scored
        .filter(item => item.eligibility.status !== 'not_eligible')
        .slice(0, limit)
        .map(item => ({
            ...item.scheme,
            eligibility_status: item.eligibility.status,
            eligibility_score: item.score,
            relevanceScore: item.score,
            matchedCriteria: item.eligibility.matchedCriteria,
            unmatchedCriteria: item.eligibility.unmatchedCriteria
        }));
}

// ============================================
// Application Guidance Generator
// ============================================

interface ApplicationStep {
    step: number;
    title: string;
    description: string;
    link?: string;
}

function generateApplicationGuidance(scheme: Scheme): ApplicationStep[] {
    const steps: ApplicationStep[] = [];

    // Step 1: Check eligibility
    steps.push({
        step: 1,
        title: 'Verify Eligibility',
        description: scheme.eligibility?.substring(0, 200) || 'Check the scheme requirements on the official portal.'
    });

    // Step 2: Gather documents
    if (scheme.documents) {
        steps.push({
            step: 2,
            title: 'Prepare Documents',
            description: `Required: ${scheme.documents.substring(0, 200)}...`
        });
    }

    // Step 3: Application process
    if (scheme.application) {
        steps.push({
            step: 3,
            title: 'Submit Application',
            description: scheme.application.substring(0, 200)
        });
    }

    // Step 4: Official link - check for any URL in application text
    const urlMatch = scheme.application?.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        steps.push({
            step: 4,
            title: 'Visit Official Portal',
            description: 'Complete your application on the official website.',
            link: urlMatch[0]
        });
    }

    return steps;
}

// ============================================
// Smart Prompt Builder
// ============================================

function buildSmartPrompt(
    message: string,
    profile: Partial<UserProfile> | undefined,
    profileAnalysis: ProfileAnalysis,
    recommendedSchemes: SchemeWithEligibility[],
    currentScheme?: Scheme
): string {
    let prompt = `You are JanScheme Assistant, a helpful AI for Indian government welfare schemes.

STRICT RULES:
1. ONLY answer from the DATABASE CONTEXT provided below
2. Never make up schemes or benefits
3. Be concise (under 150 words)
4. Use bullet points for lists
5. If asking for user info, be conversational and friendly

`;

    // Add profile context
    if (profile && Object.keys(profile).length > 0) {
        prompt += `USER PROFILE:
${profile.age ? `- Age: ${profile.age}` : ''}
${profile.gender ? `- Gender: ${profile.gender}` : ''}
${profile.state ? `- State: ${profile.state}` : ''}
${profile.profession ? `- Profession: ${profile.profession}` : ''}
${profile.incomeRange ? `- Income: ${profile.incomeRange}` : ''}
${profile.category ? `- Category: ${profile.category}` : ''}

`;
    }

    // Add missing fields instruction if applicable
    if (profileAnalysis.missingCriticalFields.length >= 3) {
        prompt += `IMPORTANT: The user has not provided much profile info. 
To give better recommendations, POLITELY ASK for ONE of these: ${profileAnalysis.missingCriticalFields.slice(0, 2).join(' or ')}.
Frame it conversationally, not like a form.

`;
    }

    // Add recommended schemes as context
    if (recommendedSchemes.length > 0) {
        prompt += `RECOMMENDED SCHEMES (based on user profile and query):
`;
        recommendedSchemes.forEach((scheme, i) => {
            prompt += `
${i + 1}. ${scheme.name} (${scheme.eligibility_status})
   - Benefits: ${scheme.benefits?.substring(0, 150)}...
   - Eligibility: ${scheme.eligibility?.substring(0, 150)}...
`;
        });
        prompt += `\n`;
    }

    // Add current scheme if viewing
    if (currentScheme) {
        prompt += `CURRENTLY VIEWING SCHEME:
Name: ${currentScheme.name}
Details: ${currentScheme.details?.substring(0, 300)}
Benefits: ${currentScheme.benefits}
Eligibility: ${currentScheme.eligibility}
Documents: ${currentScheme.documents}
Application: ${currentScheme.application}

`;
    }

    return prompt;
}

// ============================================
// Main Chat Handler - Enhanced
// ============================================

export async function handleChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, context } = request;
    const userProfile = context.userProfile;

    // Analyze profile
    const profileAnalysis = analyzeProfile(userProfile);
    console.log(`📊 Profile completeness: ${profileAnalysis.completeness}%, missing: ${profileAnalysis.missingCriticalFields.join(', ')}`);

    // Get current scheme if viewing
    let currentScheme: Scheme | undefined;
    if (context.currentSchemeId) {
        const scheme = await getSchemeById(context.currentSchemeId);
        if (scheme) currentScheme = scheme;
    }

    // Get personalized recommendations
    const recommendedSchemes = await getPersonalizedRecommendations(userProfile, message, 5);
    console.log(`🎯 Found ${recommendedSchemes.length} personalized recommendations`);

    let reply: string;
    let applicationSteps: ApplicationStep[] | undefined;

    // Check if user is asking about application process
    const isApplicationQuery = /how to apply|apply for|application|steps|process|form/i.test(message);
    if (isApplicationQuery && (currentScheme || recommendedSchemes.length > 0)) {
        const targetScheme = currentScheme || recommendedSchemes[0];
        applicationSteps = generateApplicationGuidance(targetScheme);
    }

    // Generate response
    try {
        const client = getGeminiClient();
        if (client) {
            const smartPrompt = buildSmartPrompt(
                message,
                userProfile,
                profileAnalysis,
                recommendedSchemes,
                currentScheme
            );

            const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: smartPrompt }] },
                    { role: 'model', parts: [{ text: 'I understand. I will help users find relevant government schemes based on their profile and the database context provided.' }] },
                ],
            });

            const result = await chat.sendMessage(message);
            reply = result.response.text();

        } else {
            reply = generateFallbackResponse(message, userProfile, profileAnalysis, recommendedSchemes);
        }
    } catch (error) {
        console.error('Chat error:', error);
        reply = generateFallbackResponse(message, userProfile, profileAnalysis, recommendedSchemes);
    }

    // Generate smart suggested actions
    const suggestedActions = generateSuggestedActions(profileAnalysis, currentScheme, recommendedSchemes);

    return {
        reply,
        suggestedSchemes: recommendedSchemes,
        suggestedActions,
        missingProfileFields: profileAnalysis.missingCriticalFields.length > 0
            ? profileAnalysis.missingCriticalFields
            : undefined,
        applicationSteps,
    };
}

// ============================================
// Fallback Response Generator
// ============================================

function generateFallbackResponse(
    message: string,
    profile: Partial<UserProfile> | undefined,
    analysis: ProfileAnalysis,
    recommendations: SchemeWithEligibility[]
): string {
    const msg = message.toLowerCase();

    // Greeting
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        if (analysis.completeness < 30) {
            return `Hello! 👋 I'm JanScheme Assistant, here to help you discover government schemes you may be eligible for.

To give you the best recommendations, could you tell me:
- What is your age?
- Which state do you live in?
- What is your profession?

Just type naturally, like "I'm a 25 year old farmer from Maharashtra"!`;
        }
        return `Hello! 👋 Based on your profile, I've found ${recommendations.length} schemes that might interest you. Would you like me to explain any of them?`;
    }

    // If recommendations exist, summarize them
    if (recommendations.length > 0) {
        let response = `Based on your query, here are the most relevant schemes:\n\n`;
        recommendations.slice(0, 3).forEach((scheme, i) => {
            response += `**${i + 1}. ${scheme.name}**\n`;
            response += `${scheme.benefits?.substring(0, 100)}...\n\n`;
        });
        response += `Would you like details about any of these schemes?`;
        return response;
    }

    // Ask for more info
    if (analysis.missingCriticalFields.length >= 3) {
        return `I'd love to help you find the right schemes! Could you tell me a bit about yourself?

For example:
- Your age
- Which state you're from
- Your profession (student, farmer, business, etc.)

This helps me find schemes you're actually eligible for.`;
    }

    return `I understand you're looking for "${message}". Let me search for relevant schemes in our database. You can also browse all schemes using the navigation above.`;
}

// ============================================
// Smart Suggested Actions
// ============================================

function generateSuggestedActions(
    analysis: ProfileAnalysis,
    currentScheme?: Scheme,
    recommendations?: SchemeWithEligibility[]
): string[] {
    const actions: string[] = [];

    if (currentScheme) {
        actions.push('How to apply for this?');
        actions.push('What documents do I need?');
        actions.push('Check my eligibility');
    } else if (recommendations && recommendations.length > 0) {
        actions.push(`Tell me about ${recommendations[0].name}`);
        actions.push('Show more schemes');
        actions.push('How to apply?');
    } else {
        actions.push('Find schemes for me');
        actions.push('Education schemes');
        actions.push('Farmer schemes');
    }

    if (analysis.completeness < 50) {
        actions.push('Update my profile');
    }

    return actions.slice(0, 4);
}

// ============================================
// Check if AI is Available
// ============================================

export function isAIAvailable(): boolean {
    return getGeminiClient() !== null;
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
    ChatRequest,
    ChatResponse,
    Scheme,
    UserProfile,
    SchemeWithScore,
    EligibilityResult
} from '../types/index.js';
import { getSchemeById } from './schemeService.js';
import { extractProfileFromMessage, detectIntent } from './conversationManager.js';
import { hybridSearch, buildSearchQuery } from './vectorSearchService.js';

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

// ============================================
// LLM-Powered Search Query Generator
// ============================================

async function generateSearchQuery(
    message: string,
    profile: Partial<UserProfile> | undefined
): Promise<string> {
    try {
        const client = getGeminiClient();
        if (!client) {
            // Fallback to rule-based query builder
            return buildSearchQuery(message, profile || {});
        }

        // Build profile summary for the LLM
        const profileParts: string[] = [];
        if (profile?.age) profileParts.push(`Age: ${profile.age}`);
        if (profile?.gender) profileParts.push(`Gender: ${profile.gender}`);
        if (profile?.state) profileParts.push(`State: ${profile.state}`);
        if (profile?.profession) profileParts.push(`Profession: ${profile.profession}`);
        if (profile?.incomeRange) profileParts.push(`Income: ${profile.incomeRange.replace(/_/g, ' ')}`);
        if (profile?.category) profileParts.push(`Category: ${profile.category.toUpperCase()}`);
        if (profile?.isFarmer) profileParts.push(`Farmer: Yes`);
        if (profile?.isStudent) profileParts.push(`Student: Yes`);
        if (profile?.isBusinessOwner) profileParts.push(`Business Owner: Yes`);
        if (profile?.isBPL) profileParts.push(`BPL: Yes`);
        if (profile?.educationLevel) profileParts.push(`Education: ${profile.educationLevel}`);
        if (profile?.employmentStatus) profileParts.push(`Employment: ${profile.employmentStatus}`);

        const profileText = profileParts.length > 0
            ? `User Profile:\n${profileParts.join('\n')}`
            : 'No user profile available.';

        const prompt = `You are a search query optimizer for an Indian government welfare schemes database.

Given a user's message and their profile, generate a SHORT, FOCUSED search query (max 30 words) that will find the most relevant government schemes.

The search query should:
- Combine the user's explicit intent with relevant profile attributes
- Include relevant Indian government scheme keywords (e.g., Yojana, subsidy, pension, scholarship)
- Focus on eligibility-matching terms (age, state, profession, income level, category)
- Be optimized for semantic similarity search against scheme descriptions

${profileText}

User's Message: "${message}"

Respond with ONLY the optimized search query, nothing else. No quotes, no explanation.`;

        const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const searchQuery = result.response.text().trim();

        console.log(`🧠 LLM generated search query: "${searchQuery}"`);
        return searchQuery;

    } catch (error) {
        console.error('⚠️ LLM query generation failed, using fallback:', error);
        return buildSearchQuery(message, profile || {});
    }
}

// ============================================
// Personalized Recommendations (Vector Search)
// ============================================

async function getPersonalizedRecommendations(
    profile: Partial<UserProfile> | undefined,
    query?: string,
    limit: number = 5
): Promise<SchemeWithEligibility[]> {
    try {
        // Step 1: Generate an optimized search query using LLM
        const searchQuery = await generateSearchQuery(
            query || 'find government schemes for me',
            profile
        );
        console.log(`🔍 Searching with query: "${searchQuery}"`);

        // Step 2: Run hybrid vector search (semantic + keyword fallback + eligibility scoring)
        const filters: { state?: string; category?: string } = {};
        if (profile?.state) filters.state = profile.state;

        const results = await hybridSearch(
            searchQuery,
            profile || {},
            filters,
            limit * 2 // Fetch extra to allow filtering
        );

        console.log(`🎯 Vector search returned ${results.length} results`);

        // Step 3: Map to SchemeWithEligibility format
        if (results.length === 0) {
            return [];
        }

        return results.slice(0, limit).map(scheme => ({
            ...scheme,
            eligibility_status: scheme.eligibilityStatus || 'unknown',
            eligibility_score: scheme.eligibilityScore || 50,
            relevanceScore: Math.round((scheme.similarity || 0.5) * 100),
            matchedCriteria: [],
            unmatchedCriteria: []
        }));

    } catch (error) {
        console.error('❌ Vector search recommendation failed:', error);
        return [];
    }
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
    currentScheme?: Scheme,
    isProfileMessage?: boolean
): string {
    let prompt = `You are JanScheme Assistant, a friendly AI advisor for Indian government welfare schemes.

CONVERSATION FLOW (follow in order):
1. When user shares their details -> FIRST confirm their profile briefly, THEN recommend 2-3 schemes
2. If user asks about a specific scheme -> provide detailed info
3. If user asks how to apply -> give step-by-step guidance
4. If user asks about documents -> list required documents

RULES:
- ONLY recommend from DATABASE CONTEXT below
- Be warm and conversational
- Keep responses under 200 words
- Use bullet points for lists

`;

    // Check if user just provided profile info
    const hasProfile = profile && Object.keys(profile).filter(k => (profile as any)[k]).length > 0;

    if (hasProfile) {
        // Build profile summary
        const profileItems: string[] = [];
        if (profile?.age) profileItems.push(`Age: ${profile.age}`);
        if (profile?.gender) profileItems.push(`Gender: ${profile.gender}`);
        if (profile?.state) profileItems.push(`State: ${profile.state}`);
        if (profile?.profession) profileItems.push(`Profession: ${profile.profession}`);
        if (profile?.incomeRange) profileItems.push(`Income: ${profile.incomeRange.replace(/_/g, ' ')}`);
        if (profile?.category) profileItems.push(`Category: ${profile.category.toUpperCase()}`);
        if (profile?.isFarmer) profileItems.push(`Farmer: Yes`);
        if (profile?.isStudent) profileItems.push(`Student: Yes`);
        if (profile?.isBPL) profileItems.push(`BPL: Yes`);

        prompt += `USER PROFILE (confirm this to user):\n${profileItems.map(p => `- ${p}`).join('\n')}\n\n`;

        // If this is a profile-sharing message, instruct to confirm and recommend
        if (isProfileMessage) {
            prompt += `IMPORTANT: User just shared their details. Your response MUST:
1. FIRST confirm their profile briefly (e.g., "Got it! You are a [profession] from [state]...")
2. THEN recommend ${Math.min(3, recommendedSchemes.length)} schemes from below that match their profile
3. For each scheme: mention name and why it matches them

`;
        }
    } else {
        prompt += `USER PROFILE: Not provided yet\n\nIMPORTANT: Greet the user and ask for their basic details (age, state, profession) to find relevant schemes.\n\n`;
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

    // Extract profile info from user's message and merge with existing profile
    const mergedProfile = extractProfileFromMessage(message, context.userProfile || {});

    // Detect if this is a profile-sharing message
    const msgLower = message.toLowerCase();
    const isProfileMessage = msgLower.includes('i am') ||
        msgLower.includes('my age') ||
        msgLower.includes('years old') ||
        msgLower.includes('from') ||
        msgLower.includes('farmer') ||
        msgLower.includes('student') ||
        msgLower.includes('i work');

    // Analyze the merged profile
    const profileAnalysis = analyzeProfile(mergedProfile);
    console.log(`📊 Profile completeness: ${profileAnalysis.completeness}%`);
    console.log(`📝 Is profile message: ${isProfileMessage}`);

    // Get current scheme if viewing
    let currentScheme: Scheme | undefined;
    if (context.currentSchemeId) {
        const scheme = await getSchemeById(context.currentSchemeId);
        if (scheme) currentScheme = scheme;
    }

    // Get personalized recommendations based on merged profile
    const recommendedSchemes = await getPersonalizedRecommendations(mergedProfile, message, 5);
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
                mergedProfile,
                profileAnalysis,
                recommendedSchemes,
                currentScheme,
                isProfileMessage
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
            reply = generateFallbackResponse(message, mergedProfile, profileAnalysis, recommendedSchemes);
        }
    } catch (error) {
        console.error('Chat error:', error);
        reply = generateFallbackResponse(message, mergedProfile, profileAnalysis, recommendedSchemes);
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

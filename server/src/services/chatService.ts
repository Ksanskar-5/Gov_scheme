import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
    ChatRequest,
    ChatResponse,
    Scheme,
    UserProfile,
    SchemeWithScore
} from '../types/index.js';
import { getSchemeById } from './schemeService.js';
import { checkEligibility } from './eligibilityEngine.js';
import { smartSearch } from './schemeService.js';
import { extractSearchKeywords } from './queryParser.js';

// ============================================
// Chatbot Service
// ============================================
// Context-aware chatbot that helps users understand schemes

let genAI: GoogleGenerativeAI | null = null;
let isInitialized = false;

// Lazy initialization - gets called when first needed, after dotenv is loaded
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

// System prompt for the chatbot - OPTIMIZED for concise responses
const SYSTEM_PROMPT = `You are JanScheme Assistant, an AI advisor for Indian government welfare schemes.

RULES:
- Keep responses under 150 words
- Use bullet points for lists
- Be direct and helpful
- Never guarantee eligibility
- Suggest checking official sources for final verification

CAPABILITIES:
- Explain scheme eligibility, benefits, documents
- Guide application process
- Recommend relevant schemes based on user profile

RESPONSE FORMAT:
- Start with a brief answer
- Use **bold** for key terms
- End with a helpful follow-up question or action`;

// ============================================
// Generate Response with Gemini (with model fallback)
// ============================================

// List of models to try in order (fastest/cheapest first)
const GEMINI_MODELS = [
    // Latest 2.5 models (verified working)
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    // 2.0 models
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite-001',
];

// Track which model is currently being used
let currentModelIndex = 0;
let lastRateLimitTime: number | null = null;
const RATE_LIMIT_COOLDOWN = 60000; // 1 minute cooldown before trying the faster model again

async function generateWithGemini(
    userMessage: string,
    context: {
        scheme?: Scheme;
        userProfile?: Partial<UserProfile>;
        conversationHistory?: { role: string; content: string }[];
    }
): Promise<string> {
    const client = getGeminiClient();
    if (!client) {
        throw new Error('Gemini API not configured');
    }

    // Check if we should try the faster model again after cooldown
    if (lastRateLimitTime && Date.now() - lastRateLimitTime > RATE_LIMIT_COOLDOWN) {
        currentModelIndex = 0; // Reset to fastest model
        lastRateLimitTime = null;
        console.log('🔄 Cooldown expired, trying faster model again');
    }

    // Build context message
    let contextMessage = SYSTEM_PROMPT + '\n\n';

    if (context.scheme) {
        contextMessage += `Current Scheme Being Viewed:
Name: ${context.scheme.name}
Category: ${context.scheme.category}
Level: ${context.scheme.level}
Benefits: ${context.scheme.benefits?.substring(0, 500)}...
Eligibility: ${context.scheme.eligibility?.substring(0, 500)}...
Documents Required: ${context.scheme.documents?.substring(0, 300)}...
\n\n`;
    }

    if (context.userProfile) {
        const profile = context.userProfile;
        contextMessage += `User Profile:
${profile.age ? `Age: ${profile.age}` : ''}
${profile.state ? `State: ${profile.state}` : ''}
${profile.profession ? `Profession: ${profile.profession}` : ''}
${profile.category ? `Category: ${profile.category}` : ''}
${profile.incomeRange ? `Income Range: ${profile.incomeRange}` : ''}
\n\n`;
    }

    // Build conversation
    const history = context.conversationHistory || [];
    const formattedHistory = history.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    // Try models with fallback
    for (let i = currentModelIndex; i < GEMINI_MODELS.length; i++) {
        const modelName = GEMINI_MODELS[i];
        console.log(`🤖 Trying model: ${modelName}`);

        try {
            const model = client.getGenerativeModel({ model: modelName });

            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: contextMessage }] },
                    { role: 'model', parts: [{ text: 'I understand. I will help users with government schemes following these guidelines.' }] },
                    ...formattedHistory,
                ],
            });

            const result = await chat.sendMessage(userMessage);
            const response = result.response.text();

            console.log(`✅ Response from ${modelName}`);
            return response;

        } catch (error: any) {
            const errorMessage = error?.message || String(error);

            // Check if it's a rate limit error (429) or quota exceeded
            if (errorMessage.includes('429') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('rate limit') ||
                errorMessage.includes('Resource has been exhausted')) {

                console.warn(`⚠️ Rate limit hit on ${modelName}, trying next model...`);
                lastRateLimitTime = Date.now();
                currentModelIndex = i + 1;

                // Continue to next model
                continue;
            }

            // For other errors, log and continue to next model
            console.error(`❌ Error with ${modelName}:`, errorMessage);
            continue;
        }
    }

    // All models exhausted
    console.error('❌ All Gemini models exhausted, using fallback');
    throw new Error('All Gemini models rate limited');
}

// ============================================
// Fallback Response (No AI)
// ============================================

function generateFallbackResponse(
    userMessage: string,
    context: {
        scheme?: Scheme;
        userProfile?: Partial<UserProfile>;
    }
): string {
    const message = userMessage.toLowerCase();

    // If viewing a scheme, provide scheme-specific responses
    if (context.scheme) {
        const scheme = context.scheme;

        if (message.includes('eligibility') || message.includes('eligible') || message.includes('qualify')) {
            return `**Eligibility for ${scheme.name}:**\n\n${scheme.eligibility || 'Eligibility information not available. Please check the official website for details.'}\n\n*Note: Final eligibility is determined by the concerned authority.*`;
        }

        if (message.includes('document') || message.includes('paper') || message.includes('required')) {
            return `**Documents Required for ${scheme.name}:**\n\n${scheme.documents || 'Document list not available. Please check the official website for details.'}`;
        }

        if (message.includes('apply') || message.includes('application') || message.includes('how to')) {
            return `**How to Apply for ${scheme.name}:**\n\n${scheme.application || 'Application process not available. Please visit the official portal for detailed steps.'}`;
        }

        if (message.includes('benefit') || message.includes('amount') || message.includes('get')) {
            return `**Benefits under ${scheme.name}:**\n\n${scheme.benefits || 'Benefit details not available. Please check the official website.'}`;
        }

        // General scheme query
        return `**About ${scheme.name}:**\n\n${scheme.details?.substring(0, 500) || 'Details not available.'}\n\n**Benefits:** ${scheme.benefits?.substring(0, 300) || 'N/A'}\n\n*Would you like to know about eligibility, required documents, or how to apply?*`;
    }

    // General queries without scheme context
    if (message.includes('hello') || message.includes('hi ') || message.includes('hey')) {
        return `Hello! 👋 I'm JanScheme Assistant, here to help you find and understand government welfare schemes.\n\n**I can help you with:**\n- Finding schemes you may be eligible for\n- Understanding scheme benefits and eligibility\n- Knowing required documents\n- Learning how to apply\n\n*How can I assist you today?*`;
    }

    if (message.includes('help') || message.includes('what can you do')) {
        return `**I can help you with:**\n\n📋 **Find Schemes** - Tell me about yourself (age, profession, state) and I'll suggest relevant schemes\n\n📖 **Understand Schemes** - Ask about eligibility, benefits, or application process for any scheme\n\n📄 **Documents** - Know what documents you need for specific schemes\n\n🔍 **Search** - Use natural language like "education loans for students" or "pension for senior citizens"\n\n*Try asking: "What schemes are available for farmers in Maharashtra?"*`;
    }

    // Default response
    return `I understand you're asking about "${userMessage}".\n\n**Here's what I can help with:**\n- Search for relevant schemes using the search bar above\n- Click on any scheme to learn more\n- Ask me specific questions like:\n  - "What documents do I need?"\n  - "Am I eligible for this scheme?"\n  - "How do I apply?"\n\n*Would you like me to help you find schemes? Tell me about your situation (age, profession, state, etc.)*`;
}

// ============================================
// Main Chat Handler
// ============================================

export async function handleChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, context } = request;

    // Get current scheme if available
    let currentScheme: Scheme | undefined;
    if (context.currentSchemeId) {
        const scheme = await getSchemeById(context.currentSchemeId);
        if (scheme) currentScheme = scheme;
    }

    let reply: string;
    let suggestedSchemes: SchemeWithScore[] | undefined;

    // Try to detect if user is asking for scheme recommendations
    const isSearchQuery = /find|search|show|suggest|recommend|which|what schemes|looking for/i.test(message);

    if (isSearchQuery) {
        // Extract keywords and search
        const keywords = extractSearchKeywords(message);
        if (keywords.length > 0) {
            const searchResult = await smartSearch(keywords, {}, 1, 5);
            suggestedSchemes = searchResult.data;
        }
    }

    // Try Gemini first, fallback to local response
    try {
        if (getGeminiClient()) {
            reply = await generateWithGemini(message, {
                scheme: currentScheme,
                userProfile: context.userProfile,
                conversationHistory: context.conversationHistory,
            });
        } else {
            reply = generateFallbackResponse(message, {
                scheme: currentScheme,
                userProfile: context.userProfile,
            });
        }
    } catch (error) {
        console.error('Chat error:', error);
        reply = generateFallbackResponse(message, {
            scheme: currentScheme,
            userProfile: context.userProfile,
        });
    }

    // Generate suggested actions based on context
    const suggestedActions: string[] = [];

    if (currentScheme) {
        suggestedActions.push('Check Eligibility');
        suggestedActions.push('View Required Documents');
        suggestedActions.push('How to Apply');
    } else {
        suggestedActions.push('Find Schemes for Me');
        suggestedActions.push('Browse All Schemes');
        suggestedActions.push('Update My Profile');
    }

    return {
        reply,
        suggestedSchemes,
        suggestedActions,
    };
}

// ============================================
// Check if AI is Available
// ============================================

export function isAIAvailable(): boolean {
    return getGeminiClient() !== null;
}

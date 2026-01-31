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

// Initialize Gemini client if API key is available
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are JanScheme Assistant, a helpful AI advisor for Indian government welfare schemes.

Your role:
1. Help users understand government schemes in simple, clear language
2. Explain eligibility criteria and required documents
3. Guide users through the application process
4. Answer questions about specific schemes
5. Suggest relevant schemes based on user queries

Guidelines:
- Use simple, easy-to-understand language
- Be concise but informative
- If unsure, say so and suggest the user check official sources
- Never guarantee eligibility - clarify that final decisions are made by authorities
- Format responses clearly with bullet points when listing items
- Be empathetic and helpful

You have access to:
- Current scheme details (if viewing a scheme)
- User's profile information (if available)
- Conversation history

Respond in a friendly, professional manner.`;

// ============================================
// Generate Response with Gemini
// ============================================

async function generateWithGemini(
    userMessage: string,
    context: {
        scheme?: Scheme;
        userProfile?: Partial<UserProfile>;
        conversationHistory?: { role: string; content: string }[];
    }
): Promise<string> {
    if (!genAI) {
        throw new Error('Gemini API not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    try {
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: contextMessage }] },
                { role: 'model', parts: [{ text: 'I understand. I will help users with government schemes following these guidelines.' }] },
                ...formattedHistory,
            ],
        });

        const result = await chat.sendMessage(userMessage);
        return result.response.text();
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
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
        if (genAI) {
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
    return genAI !== null;
}

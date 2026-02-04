import { Router } from 'express';
import { z } from 'zod';
import { handleChatMessage, isAIAvailable } from '../services/chatService.js';
import type { ChatRequest } from '../types/index.js';

const router = Router();

// ============================================
// Validation Schema
// ============================================

const chatRequestSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    context: z.object({
        currentSchemeId: z.number().optional(),
        currentPage: z.string().optional(),
        userProfile: z.object({
            age: z.number().optional(),
            gender: z.enum(['male', 'female', 'other']).optional(),
            state: z.string().optional(),
            incomeRange: z.enum(['below_1lakh', '1lakh_2.5lakh', '2.5lakh_5lakh', '5lakh_10lakh', 'above_10lakh']).optional(),
            profession: z.string().optional(),
            category: z.enum(['general', 'obc', 'sc', 'st', 'ews']).optional(),
            isDisabled: z.boolean().optional(),
            isMinority: z.boolean().optional(),
            isBPL: z.boolean().optional(),
            isStudent: z.boolean().optional(),
            isFarmer: z.boolean().optional(),
            isBusinessOwner: z.boolean().optional(),
            isWorker: z.boolean().optional(),
            isWidow: z.boolean().optional(),
            isSeniorCitizen: z.boolean().optional(),
        }).optional(),
        conversationHistory: z.array(z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
            timestamp: z.string(),
        })).optional(),
    }).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * POST /api/chat
 * Handle chat messages
 */
router.post('/', async (req, res) => {
    try {
        const validated = chatRequestSchema.parse(req.body);

        const chatRequest: ChatRequest = {
            message: validated.message,
            context: {
                currentSchemeId: validated.context?.currentSchemeId,
                currentPage: validated.context?.currentPage,
                userProfile: validated.context?.userProfile,
                conversationHistory: (validated.context?.conversationHistory || []) as ChatRequest['context']['conversationHistory'],
            },
        };

        const response = await handleChatMessage(chatRequest);

        res.json({
            success: true,
            data: response,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
            });
        }

        console.error('Error handling chat:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat message',
        });
    }
});

/**
 * GET /api/chat/status
 * Check if AI is available
 */
router.get('/status', (_req, res) => {
    res.json({
        success: true,
        data: {
            aiAvailable: isAIAvailable(),
            mode: isAIAvailable() ? 'ai' : 'fallback',
        },
    });
});

/**
 * GET /api/chat/suggestions
 * Get quick chat suggestions based on context
 */
router.get('/suggestions', (req, res) => {
    const schemeId = req.query.schemeId;
    const page = req.query.page as string;

    const suggestions: string[] = [];

    if (schemeId) {
        // Scheme-specific suggestions
        suggestions.push(
            'Am I eligible for this scheme?',
            'What documents do I need?',
            'How do I apply?',
            'What are the benefits?',
            'What is the deadline?'
        );
    } else if (page === 'search') {
        suggestions.push(
            'Find schemes for farmers',
            'Education scholarships for students',
            'Housing schemes for poor families',
            'Business loans for entrepreneurs',
            'Pension schemes for senior citizens'
        );
    } else if (page === 'profile') {
        suggestions.push(
            'What schemes am I eligible for?',
            'Recommend schemes based on my profile',
            'How can I improve my eligibility?'
        );
    } else {
        // Default suggestions
        suggestions.push(
            'How does JanScheme work?',
            'What schemes are available?',
            'Help me find the right scheme',
            'What documents do I need?',
            'How do I apply for a scheme?'
        );
    }

    res.json({
        success: true,
        data: suggestions,
    });
});

export default router;

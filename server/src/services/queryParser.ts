import type { ParsedIntent } from '../types/index.js';

// ============================================
// Query Parser Service
// ============================================
// Parses natural language queries into structured intent
// Uses pattern matching + optional LLM enhancement

// Common intent patterns
const INTENT_PATTERNS: Array<{
    pattern: RegExp;
    intent: string;
    extractors: Record<string, RegExp>;
}> = [
        // Death/Loss related
        {
            pattern: /\b(death|died|passed away|lost|demise|deceased)\b/i,
            intent: 'death_relief',
            extractors: {
                relationship: /\b(father|mother|parent|spouse|husband|wife|son|daughter|family member)\b/i,
                profession: /\b(construction|worker|farmer|fisherman|labour|employee)\b/i,
            },
        },

        // Education related
        {
            pattern: /\b(education|study|student|school|college|university|scholarship|fee|tuition)\b/i,
            intent: 'education_support',
            extractors: {
                level: /\b(primary|secondary|higher|college|university|phd|degree|diploma)\b/i,
                field: /\b(engineering|medical|law|arts|science|commerce)\b/i,
            },
        },

        // Employment/Job related
        {
            pattern: /\b(job|employment|unemployed|work|career|training|skill)\b/i,
            intent: 'employment_support',
            extractors: {
                status: /\b(unemployed|seeking|looking|want|need)\b/i,
                type: /\b(training|skill|vocational|apprentice)\b/i,
            },
        },

        // Business/MSME related
        {
            pattern: /\b(business|startup|enterprise|msme|loan|entrepreneur|company|shop)\b/i,
            intent: 'business_support',
            extractors: {
                type: /\b(manufacturing|service|retail|trading|handicraft)\b/i,
                stage: /\b(start|new|existing|expand|grow)\b/i,
            },
        },

        // Agriculture/Farming related
        {
            pattern: /\b(farm|farmer|agriculture|crop|cultivation|irrigation|kisan)\b/i,
            intent: 'agriculture_support',
            extractors: {
                crop: /\b(rice|wheat|vegetable|fruit|cotton|sugarcane)\b/i,
                need: /\b(subsidy|loan|insurance|equipment|seed|fertilizer)\b/i,
            },
        },

        // Housing related
        {
            pattern: /\b(house|home|housing|shelter|accommodation|awas|roof)\b/i,
            intent: 'housing_support',
            extractors: {
                type: /\b(urban|rural|slum|construction|repair)\b/i,
                status: /\b(homeless|rented|own|pucca|kutcha)\b/i,
            },
        },

        // Health related
        {
            pattern: /\b(health|medical|hospital|treatment|disease|illness|doctor|medicine)\b/i,
            intent: 'health_support',
            extractors: {
                condition: /\b(cancer|heart|kidney|disability|chronic|surgery)\b/i,
                type: /\b(insurance|free|subsidy|reimbursement)\b/i,
            },
        },

        // Marriage related
        {
            pattern: /\b(marriage|wedding|vivah|shadi|bride|groom)\b/i,
            intent: 'marriage_support',
            extractors: {
                type: /\b(intercaste|inter-caste|inter caste|widow|remarriage)\b/i,
            },
        },

        // Women specific
        {
            pattern: /\b(women|woman|female|girl|widow|mahila|mother|maternity|pregnant)\b/i,
            intent: 'women_welfare',
            extractors: {
                status: /\b(widow|single|divorced|abandoned|pregnant|mother)\b/i,
                need: /\b(empowerment|safety|employment|education|health)\b/i,
            },
        },

        // Senior citizen related
        {
            pattern: /\b(senior|elderly|old age|pension|retired|60 years|65 years)\b/i,
            intent: 'senior_citizen_support',
            extractors: {
                type: /\b(pension|healthcare|care|home)\b/i,
            },
        },

        // Disability related
        {
            pattern: /\b(disabled|disability|handicapped|blind|deaf|divyang|pwd)\b/i,
            intent: 'disability_support',
            extractors: {
                type: /\b(physical|mental|visual|hearing)\b/i,
                need: /\b(pension|equipment|education|employment)\b/i,
            },
        },

        // SC/ST/OBC specific
        {
            pattern: /\b(sc|st|obc|dalit|tribal|scheduled caste|scheduled tribe|backward)\b/i,
            intent: 'social_welfare',
            extractors: {
                category: /\b(sc|st|obc|general|ews|minority)\b/i,
            },
        },

        // Financial assistance
        {
            pattern: /\b(money|financial|subsidy|grant|assistance|help|support|benefit)\b/i,
            intent: 'financial_assistance',
            extractors: {
                purpose: /\b(education|health|business|housing|marriage)\b/i,
            },
        },

        // Insurance related
        {
            pattern: /\b(insurance|coverage|premium|claim|life insurance|health insurance)\b/i,
            intent: 'insurance_support',
            extractors: {
                type: /\b(life|health|crop|accident)\b/i,
            },
        },
    ];

// Category mappings
const INTENT_TO_CATEGORY: Record<string, string[]> = {
    'death_relief': ['Social welfare & Empowerment'],
    'education_support': ['Education & Learning'],
    'employment_support': ['Skills & Employment'],
    'business_support': ['Business & Entrepreneurship', 'Banking,Financial Services and Insurance'],
    'agriculture_support': ['Agriculture,Rural & Environment'],
    'housing_support': ['Housing & Shelter'],
    'health_support': ['Health & Wellness'],
    'marriage_support': ['Social welfare & Empowerment', 'Women and Child'],
    'women_welfare': ['Women and Child', 'Social welfare & Empowerment'],
    'senior_citizen_support': ['Social welfare & Empowerment', 'Health & Wellness'],
    'disability_support': ['Social welfare & Empowerment', 'Health & Wellness'],
    'social_welfare': ['Social welfare & Empowerment'],
    'financial_assistance': ['Banking,Financial Services and Insurance', 'Social welfare & Empowerment'],
    'insurance_support': ['Banking,Financial Services and Insurance', 'Health & Wellness'],
};

// ============================================
// Local Query Parser (No AI Required)
// ============================================

export function parseQueryLocal(query: string): ParsedIntent {
    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);

    let primaryIntent = 'general_search';
    const entities: Record<string, string> = {};
    const keywords: string[] = [];

    // Find matching intent patterns
    for (const { pattern, intent, extractors } of INTENT_PATTERNS) {
        if (pattern.test(normalizedQuery)) {
            primaryIntent = intent;

            // Extract entities
            for (const [entityName, entityPattern] of Object.entries(extractors)) {
                const match = normalizedQuery.match(entityPattern);
                if (match) {
                    entities[entityName] = match[1];
                }
            }

            break; // Use first matching pattern
        }
    }

    // Extract keywords (significant words)
    const stopWords = new Set([
        'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
        'into', 'through', 'during', 'before', 'after', 'above', 'below',
        'between', 'under', 'again', 'further', 'then', 'once', 'here',
        'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
        'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
        'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
        'just', 'don', 'now', 'i', 'me', 'my', 'myself', 'we', 'our',
        'ours', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it',
        'its', 'they', 'their', 'what', 'which', 'who', 'whom', 'this',
        'that', 'these', 'those', 'am', 'and', 'but', 'if', 'or', 'because',
        'while', 'any', 'get', 'want', 'looking', 'find', 'help', 'please'
    ]);

    for (const word of words) {
        const cleaned = word.replace(/[^a-z0-9]/g, '');
        if (cleaned.length > 2 && !stopWords.has(cleaned)) {
            keywords.push(cleaned);
        }
    }

    // Add entity values as keywords
    Object.values(entities).forEach(value => {
        if (value && !keywords.includes(value)) {
            keywords.push(value);
        }
    });

    // Extract state if mentioned
    const statePatterns = [
        /\b(andhra pradesh|arunachal pradesh|assam|bihar|chhattisgarh|goa|gujarat)\b/i,
        /\b(haryana|himachal pradesh|jharkhand|karnataka|kerala|madhya pradesh)\b/i,
        /\b(maharashtra|manipur|meghalaya|mizoram|nagaland|odisha|punjab)\b/i,
        /\b(rajasthan|sikkim|tamil nadu|telangana|tripura|uttar pradesh)\b/i,
        /\b(uttarakhand|west bengal|delhi|puducherry|chandigarh)\b/i,
    ];

    let state: string | undefined;
    for (const pattern of statePatterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
            state = match[1];
            break;
        }
    }

    return {
        intent: primaryIntent,
        profession: entities.profession,
        eventType: entities.relationship ? 'death' : undefined,
        category: INTENT_TO_CATEGORY[primaryIntent]?.[0],
        benefitType: undefined,
        state,
        keywords,
        entities,
    };
}

// ============================================
// Enhanced Keywords Extraction
// ============================================

export function extractSearchKeywords(query: string): string[] {
    const parsed = parseQueryLocal(query);
    const keywords = [...parsed.keywords];

    // Add intent-based keywords
    const intentKeywords: Record<string, string[]> = {
        'death_relief': ['death', 'relief', 'compensation', 'ex-gratia', 'funeral', 'assistance'],
        'education_support': ['scholarship', 'education', 'student', 'fee', 'study'],
        'employment_support': ['employment', 'job', 'training', 'skill', 'unemployment'],
        'business_support': ['loan', 'msme', 'business', 'entrepreneur', 'startup', 'subsidy'],
        'agriculture_support': ['farmer', 'kisan', 'agriculture', 'crop', 'subsidy', 'farming'],
        'housing_support': ['housing', 'awas', 'home', 'shelter', 'construction'],
        'health_support': ['health', 'medical', 'hospital', 'treatment', 'insurance'],
        'marriage_support': ['marriage', 'wedding', 'incentive', 'assistance'],
        'women_welfare': ['women', 'mahila', 'empowerment', 'welfare', 'protection'],
        'senior_citizen_support': ['pension', 'elderly', 'senior', 'old age'],
        'disability_support': ['disability', 'disabled', 'divyang', 'pension', 'assistance'],
        'social_welfare': ['welfare', 'social', 'assistance', 'benefit'],
        'financial_assistance': ['financial', 'assistance', 'grant', 'subsidy', 'money'],
        'insurance_support': ['insurance', 'premium', 'coverage', 'claim'],
    };

    const intentSpecificKeywords = intentKeywords[parsed.intent] || [];
    for (const kw of intentSpecificKeywords) {
        if (!keywords.includes(kw)) {
            keywords.push(kw);
        }
    }

    return keywords;
}

// ============================================
// Get Suggested Categories
// ============================================

export function getSuggestedCategories(query: string): string[] {
    const parsed = parseQueryLocal(query);
    return INTENT_TO_CATEGORY[parsed.intent] || [];
}

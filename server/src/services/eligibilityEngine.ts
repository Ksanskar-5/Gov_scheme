import type {
    UserProfile,
    Scheme,
    EligibilityResult,
    EligibilityStatus
} from '../types/index.js';

// ============================================
// Eligibility Rule Engine
// ============================================
// This is a deterministic, rule-based engine
// No AI hallucinations - explicit checks only

interface EligibilityRule {
    field: keyof UserProfile;
    check: (profile: Partial<UserProfile>, scheme: Scheme) => {
        passed: boolean;
        reason: string;
    };
    keywords: string[]; // Keywords in eligibility text that trigger this rule
}

// Define eligibility rules based on common scheme criteria
const ELIGIBILITY_RULES: EligibilityRule[] = [
    // Age-based rules
    {
        field: 'age',
        keywords: ['18 years', '18-', 'above 18', 'minimum age', 'age limit', 'senior citizen', '60 years', 'elderly'],
        check: (profile, scheme) => {
            if (!profile.age) return { passed: true, reason: 'Age not specified' };

            const eligText = scheme.eligibility.toLowerCase();

            // Check for senior citizen schemes
            if (eligText.includes('senior citizen') || eligText.includes('60 years') || eligText.includes('elderly')) {
                if (profile.age >= 60) {
                    return { passed: true, reason: 'Age requirement met (60+ for senior citizen)' };
                }
                return { passed: false, reason: 'This scheme is for senior citizens (60+ years)' };
            }

            // Check for youth schemes
            if (eligText.includes('18-35') || eligText.includes('youth')) {
                if (profile.age >= 18 && profile.age <= 35) {
                    return { passed: true, reason: 'Age requirement met (18-35 years)' };
                }
                return { passed: false, reason: 'This scheme is for youth (18-35 years)' };
            }

            // Minimum age check
            if (eligText.includes('above 18') || eligText.includes('18 years or more')) {
                if (profile.age >= 18) {
                    return { passed: true, reason: 'Minimum age requirement met (18+)' };
                }
                return { passed: false, reason: 'Minimum age requirement is 18 years' };
            }

            return { passed: true, reason: 'Age criteria not explicitly defined' };
        },
    },

    // Income-based rules
    {
        field: 'incomeRange',
        keywords: ['income', 'bpl', 'below poverty', 'ews', 'economically weaker', 'annual income', 'family income'],
        check: (profile, scheme) => {
            if (!profile.incomeRange && !profile.isBPL) {
                return { passed: true, reason: 'Income not specified' };
            }

            const eligText = scheme.eligibility.toLowerCase();

            // BPL scheme check
            if (eligText.includes('bpl') || eligText.includes('below poverty line')) {
                if (profile.isBPL || profile.incomeRange === 'below_1lakh') {
                    return { passed: true, reason: 'BPL/low income criteria met' };
                }
                return { passed: false, reason: 'This scheme is for BPL families' };
            }

            // EWS check
            if (eligText.includes('ews') || eligText.includes('economically weaker')) {
                if (profile.incomeRange === 'below_1lakh' || profile.incomeRange === '1lakh_2.5lakh') {
                    return { passed: true, reason: 'EWS income criteria met' };
                }
                return { passed: false, reason: 'This scheme is for Economically Weaker Sections' };
            }

            return { passed: true, reason: 'Income criteria not explicitly restrictive' };
        },
    },

    // Category-based rules (SC/ST/OBC)
    {
        field: 'category',
        keywords: ['sc', 'st', 'obc', 'scheduled caste', 'scheduled tribe', 'backward class', 'general'],
        check: (profile, scheme) => {
            if (!profile.category) return { passed: true, reason: 'Social category not specified' };

            const eligText = scheme.eligibility.toLowerCase();
            const schemeCategory = scheme.category?.toLowerCase() || '';

            // Check if scheme is specifically for certain categories
            if (eligText.includes('scheduled tribe') || eligText.includes('st community')) {
                if (profile.category === 'st') {
                    return { passed: true, reason: 'ST category requirement met' };
                }
                return { passed: false, reason: 'This scheme is specifically for Scheduled Tribes' };
            }

            if (eligText.includes('scheduled caste') || schemeCategory.includes('sc/st')) {
                if (profile.category === 'sc' || profile.category === 'st') {
                    return { passed: true, reason: 'SC/ST category requirement met' };
                }
                return { passed: false, reason: 'This scheme is for Scheduled Castes/Tribes' };
            }

            if (eligText.includes('backward class') || eligText.includes('obc')) {
                if (profile.category === 'obc' || profile.category === 'sc' || profile.category === 'st') {
                    return { passed: true, reason: 'Backward class requirement met' };
                }
            }

            return { passed: true, reason: 'No specific category restriction' };
        },
    },

    // Gender-based rules
    {
        field: 'gender',
        keywords: ['women', 'female', 'girl', 'widow', 'mahila', 'lady', 'woman'],
        check: (profile, scheme) => {
            if (!profile.gender) return { passed: true, reason: 'Gender not specified' };

            const eligText = scheme.eligibility.toLowerCase();
            const schemeName = scheme.name.toLowerCase();
            const schemeCategory = scheme.category?.toLowerCase() || '';

            // Check if women-only scheme
            if (
                eligText.includes('women only') ||
                eligText.includes('for women') ||
                eligText.includes('female applicant') ||
                schemeName.includes('mahila') ||
                schemeCategory.includes('women')
            ) {
                if (profile.gender === 'female') {
                    return { passed: true, reason: 'Gender requirement met (women-only scheme)' };
                }
                return { passed: false, reason: 'This scheme is exclusively for women' };
            }

            // Widow-specific
            if (eligText.includes('widow')) {
                if (profile.isWidow) {
                    return { passed: true, reason: 'Widow eligibility met' };
                }
                return { passed: false, reason: 'This scheme is for widows' };
            }

            return { passed: true, reason: 'No specific gender restriction' };
        },
    },

    // Profession-based rules
    {
        field: 'profession',
        keywords: ['farmer', 'student', 'worker', 'entrepreneur', 'artisan', 'fisherman', 'construction', 'labour'],
        check: (profile, scheme) => {
            const eligText = scheme.eligibility.toLowerCase();
            const schemeTags = scheme.tags.join(' ').toLowerCase();
            const schemeCategory = scheme.category?.toLowerCase() || '';

            // Farmer schemes
            if (
                eligText.includes('farmer') ||
                schemeTags.includes('farmer') ||
                schemeCategory.includes('agriculture')
            ) {
                if (profile.isFarmer || profile.profession?.toLowerCase().includes('farmer')) {
                    return { passed: true, reason: 'Farmer eligibility confirmed' };
                }
                // Don't strictly fail - might be possibly eligible
            }

            // Student schemes
            if (eligText.includes('student') || schemeTags.includes('student')) {
                if (profile.isStudent || profile.employmentStatus === 'student') {
                    return { passed: true, reason: 'Student eligibility confirmed' };
                }
            }

            // Construction worker schemes
            if (
                eligText.includes('construction worker') ||
                eligText.includes('building worker') ||
                schemeTags.includes('construction')
            ) {
                if (profile.isWorker || profile.profession?.toLowerCase().includes('construction')) {
                    return { passed: true, reason: 'Construction worker eligibility confirmed' };
                }
            }

            // Business/Entrepreneur schemes
            if (
                eligText.includes('entrepreneur') ||
                eligText.includes('msme') ||
                schemeCategory.includes('business')
            ) {
                if (profile.isBusinessOwner) {
                    return { passed: true, reason: 'Business owner eligibility confirmed' };
                }
            }

            return { passed: true, reason: 'Profession criteria not strictly defined' };
        },
    },

    // State/Residence-based rules
    {
        field: 'state',
        keywords: ['resident', 'domicile', 'native', 'state of'],
        check: (profile, scheme) => {
            if (!profile.state) return { passed: true, reason: 'State not specified' };

            // If scheme is State level, check if user's state matches
            if (scheme.level === 'State' && scheme.state) {
                const schemeState = scheme.state.toLowerCase().trim();
                const userState = profile.state.toLowerCase().trim();

                if (schemeState === userState || schemeState.includes(userState) || userState.includes(schemeState)) {
                    return { passed: true, reason: `State eligibility met (${scheme.state})` };
                }
                return { passed: false, reason: `This scheme is for residents of ${scheme.state}` };
            }

            // Central schemes are available to all states
            if (scheme.level === 'Central') {
                return { passed: true, reason: 'Central scheme - available nationwide' };
            }

            return { passed: true, reason: 'State requirement not restrictive' };
        },
    },

    // Education-based rules
    {
        field: 'educationLevel',
        keywords: ['graduate', '10th', '12th', 'matriculation', 'degree', 'diploma', 'education'],
        check: (profile, scheme) => {
            if (!profile.educationLevel) return { passed: true, reason: 'Education level not specified' };

            const eligText = scheme.eligibility.toLowerCase();

            // Check minimum education requirements
            if (eligText.includes('graduate') || eligText.includes('degree holder')) {
                const graduateLevels = ['graduate', 'post_graduate', 'professional'];
                if (graduateLevels.includes(profile.educationLevel)) {
                    return { passed: true, reason: 'Education requirement met (Graduate+)' };
                }
                return { passed: false, reason: 'Minimum graduation required' };
            }

            if (eligText.includes('10th pass') || eligText.includes('matriculation')) {
                const eligible = ['10th_pass', '12th_pass', 'graduate', 'post_graduate', 'professional'];
                if (eligible.includes(profile.educationLevel)) {
                    return { passed: true, reason: 'Education requirement met (10th+)' };
                }
                return { passed: false, reason: 'Minimum 10th pass required' };
            }

            return { passed: true, reason: 'Education criteria not strictly defined' };
        },
    },

    // Disability-based rules
    {
        field: 'isDisabled',
        keywords: ['disabled', 'disability', 'handicapped', 'divyang', 'pwd'],
        check: (profile, scheme) => {
            const eligText = scheme.eligibility.toLowerCase();

            if (
                eligText.includes('disabled') ||
                eligText.includes('disability') ||
                eligText.includes('divyang') ||
                eligText.includes('pwd')
            ) {
                if (profile.isDisabled) {
                    return { passed: true, reason: 'Disability eligibility confirmed' };
                }
                return { passed: false, reason: 'This scheme is for persons with disabilities' };
            }

            return { passed: true, reason: 'No disability requirement' };
        },
    },
];

// ============================================
// Main Eligibility Check Function
// ============================================

export function checkEligibility(
    userProfile: Partial<UserProfile>,
    scheme: Scheme
): EligibilityResult {
    const matchedCriteria: string[] = [];
    const unmatchedCriteria: string[] = [];
    const reasons: string[] = [];
    let passedCount = 0;
    let failedCount = 0;
    let applicableRules = 0;

    const eligText = scheme.eligibility.toLowerCase();

    for (const rule of ELIGIBILITY_RULES) {
        // Check if this rule is applicable to this scheme
        const isApplicable = rule.keywords.some(keyword =>
            eligText.includes(keyword.toLowerCase())
        );

        if (!isApplicable) continue;

        applicableRules++;
        const result = rule.check(userProfile, scheme);

        if (result.passed) {
            passedCount++;
            matchedCriteria.push(result.reason);
        } else {
            failedCount++;
            unmatchedCriteria.push(result.reason);
        }

        reasons.push(result.reason);
    }

    // Determine overall status
    let status: EligibilityStatus;
    let confidence: number;

    if (applicableRules === 0) {
        // No rules matched - can't determine eligibility
        status = 'unknown';
        confidence = 0;
    } else if (failedCount === 0) {
        // All applicable rules passed
        status = 'eligible';
        confidence = Math.min(95, 60 + (passedCount * 10));
    } else if (failedCount <= 1 && passedCount >= 2) {
        // Minor mismatch but mostly eligible
        status = 'possibly_eligible';
        confidence = Math.max(30, 60 - (failedCount * 20));
    } else if (failedCount >= 2) {
        // Multiple criteria failed
        status = 'not_eligible';
        confidence = Math.min(90, failedCount * 30);
    } else {
        // Default to possibly eligible
        status = 'possibly_eligible';
        confidence = 50;
    }

    return {
        schemeId: scheme.id,
        status,
        matchedCriteria,
        unmatchedCriteria,
        confidence,
        reasons,
    };
}

// ============================================
// Batch Eligibility Check
// ============================================

export function checkBatchEligibility(
    userProfile: Partial<UserProfile>,
    schemes: Scheme[]
): Map<number, EligibilityResult> {
    const results = new Map<number, EligibilityResult>();

    for (const scheme of schemes) {
        results.set(scheme.id, checkEligibility(userProfile, scheme));
    }

    return results;
}

// ============================================
// Filter Schemes by Eligibility
// ============================================

export function filterByEligibility(
    userProfile: Partial<UserProfile>,
    schemes: Scheme[],
    minStatus: EligibilityStatus = 'possibly_eligible'
): Scheme[] {
    const statusPriority: Record<EligibilityStatus, number> = {
        'eligible': 4,
        'possibly_eligible': 3,
        'unknown': 2,
        'not_eligible': 1,
    };

    const minPriority = statusPriority[minStatus];

    return schemes.filter(scheme => {
        const result = checkEligibility(userProfile, scheme);
        return statusPriority[result.status] >= minPriority;
    });
}

// ============================================
// Score Schemes by Eligibility
// ============================================

export function scoreSchemesByEligibility(
    userProfile: Partial<UserProfile>,
    schemes: Scheme[]
): Array<{ scheme: Scheme; eligibility: EligibilityResult; score: number }> {
    const statusWeights: Record<EligibilityStatus, number> = {
        'eligible': 100,
        'possibly_eligible': 70,
        'unknown': 40,
        'not_eligible': 10,
    };

    return schemes.map(scheme => {
        const eligibility = checkEligibility(userProfile, scheme);
        const baseScore = statusWeights[eligibility.status];
        const confidenceBonus = (eligibility.confidence / 100) * 20;
        const matchBonus = eligibility.matchedCriteria.length * 5;

        return {
            scheme,
            eligibility,
            score: baseScore + confidenceBonus + matchBonus,
        };
    }).sort((a, b) => b.score - a.score);
}

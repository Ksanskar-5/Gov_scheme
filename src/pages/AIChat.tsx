import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Send, User, Sparkles, Loader2,
    ShieldCheck, Search, Bookmark, LayoutDashboard, CheckCircle2,
    GraduationCap, Tractor, Building2, Users, Heart, Info, Copy, Check,
    AlertCircle, ArrowRight, FileText, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import {
    sendChatMessage,
    getChatSuggestions,
    type ChatMessage,
    type UserProfile,
    type ChatResponse,
    type SchemeWithScore
} from "@/lib/api";

const quickCategories = [
    { icon: GraduationCap, label: "Education", sublabel: "Scholarships & Loans", query: "education scholarships and loans" },
    { icon: Tractor, label: "Agriculture", sublabel: "Farmer Support", query: "schemes for farmers" },
    { icon: Building2, label: "Business", sublabel: "MSME & Startups", query: "business loans and MSME schemes" },
    { icon: Users, label: "Social Welfare", sublabel: "Women & Family", query: "schemes for women empowerment" },
    { icon: Heart, label: "Healthcare", sublabel: "Insurance & Aid", query: "health insurance schemes" },
];

const defaultSuggestions = [
    "What schemes am I eligible for?",
    "Education loans for college students",
    "Housing schemes for low income",
    "Health insurance options"
];

// Quick profile options for inline collection
const PROFILE_OPTIONS = {
    age: ["18-25", "26-35", "36-45", "46-60", "60+"],
    state: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Other"],
    profession: ["Student", "Farmer", "Business Owner", "Employee", "Self-Employed", "Unemployed"],
    gender: ["Male", "Female", "Other"],
    incomeRange: ["Below ₹1 Lakh", "₹1-2.5 Lakh", "₹2.5-5 Lakh", "₹5-10 Lakh", "Above ₹10 Lakh"]
};

const FIELD_LABELS: Record<string, string> = {
    age: "your age group",
    state: "your state",
    profession: "your profession",
    gender: "your gender",
    incomeRange: "your annual income"
};

export default function AIChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
    const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [recommendedSchemes, setRecommendedSchemes] = useState<SchemeWithScore[]>([]);
    const [applicationSteps, setApplicationSteps] = useState<ChatResponse['applicationSteps']>([]);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [askingForField, setAskingForField] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, recommendedSchemes]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("userProfile");
        if (stored) {
            setUserProfile(JSON.parse(stored));
        }
    }, []);

    // Save profile to localStorage whenever it changes
    useEffect(() => {
        if (Object.keys(userProfile).length > 0) {
            localStorage.setItem("userProfile", JSON.stringify(userProfile));
        }
    }, [userProfile]);

    const loadSuggestions = async () => {
        try {
            const result = await getChatSuggestions(undefined, "chat");
            if (result.success && result.data) {
                setSuggestions(result.data);
            }
        } catch {
            // Use defaults
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleProfileUpdate = (field: string, value: string) => {
        // Convert display values to profile values
        let profileValue: string | number = value;

        if (field === 'age') {
            // Convert age range to a number
            const ageMap: Record<string, number> = {
                "18-25": 22, "26-35": 30, "36-45": 40, "46-60": 50, "60+": 65
            };
            profileValue = ageMap[value] || 30;
        } else if (field === 'incomeRange') {
            const incomeMap: Record<string, string> = {
                "Below ₹1 Lakh": "below_1lakh",
                "₹1-2.5 Lakh": "1lakh_2.5lakh",
                "₹2.5-5 Lakh": "2.5lakh_5lakh",
                "₹5-10 Lakh": "5lakh_10lakh",
                "Above ₹10 Lakh": "above_10lakh"
            };
            profileValue = incomeMap[value] || value;
        } else if (field === 'gender') {
            profileValue = value.toLowerCase();
        } else if (field === 'profession') {
            profileValue = value.toLowerCase().replace(' ', '_');
        }

        const updatedProfile = { ...userProfile, [field]: profileValue };
        setUserProfile(updatedProfile);
        setAskingForField(null);

        // Send a message confirming the selection
        const confirmMessage: ChatMessage = {
            role: "user",
            content: `My ${field} is ${value}`,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, confirmMessage]);

        // Continue the conversation with updated profile
        handleContinueWithProfile(updatedProfile);
    };

    const handleContinueWithProfile = async (profile: Partial<UserProfile>) => {
        setIsTyping(true);
        try {
            const result = await sendChatMessage("Based on my profile, what schemes am I eligible for?", {
                currentPage: "chat",
                userProfile: profile,
                conversationHistory: messages.slice(-10),
            });

            if (result.success && result.data) {
                const aiMessage: ChatMessage = {
                    role: "assistant",
                    content: result.data.reply,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMessage]);

                if (result.data.suggestedSchemes?.length) {
                    setRecommendedSchemes(result.data.suggestedSchemes);
                }
                if (result.data.suggestedActions?.length) {
                    setSuggestions(result.data.suggestedActions);
                }
                if (result.data.missingProfileFields?.length) {
                    setMissingFields(result.data.missingProfileFields);
                    // Ask for the first missing field
                    if (result.data.missingProfileFields.length > 0) {
                        setAskingForField(result.data.missingProfileFields[0]);
                    }
                }
            }
        } catch {
            // Handle error
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = async (messageOverride?: string) => {
        const messageToSend = messageOverride || inputValue.trim();
        if (!messageToSend || isTyping) return;

        if (!hasStartedChat) {
            setHasStartedChat(true);
            const welcomeMessage: ChatMessage = {
                role: "assistant",
                content: "Welcome! I'm here to help you discover government schemes from our verified database. How can I assist you today?",
                timestamp: new Date().toISOString()
            };
            setMessages([welcomeMessage]);
            loadSuggestions();
        }

        const userMessage: ChatMessage = {
            role: "user",
            content: messageToSend,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);
        setRecommendedSchemes([]);
        setApplicationSteps([]);

        try {
            const result = await sendChatMessage(messageToSend, {
                currentPage: "chat",
                userProfile: userProfile,
                conversationHistory: messages.slice(-10),
            });

            if (result.success && result.data) {
                const aiMessage: ChatMessage = {
                    role: "assistant",
                    content: result.data.reply,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMessage]);

                // Handle new response fields
                if (result.data.suggestedSchemes?.length) {
                    setRecommendedSchemes(result.data.suggestedSchemes);
                }
                if (result.data.suggestedActions?.length) {
                    setSuggestions(result.data.suggestedActions);
                }
                if (result.data.applicationSteps?.length) {
                    setApplicationSteps(result.data.applicationSteps);
                }
                if (result.data.missingProfileFields?.length) {
                    setMissingFields(result.data.missingProfileFields);
                    // If we need profile info and don't have much, ask for it
                    if (result.data.missingProfileFields.length >= 3 && Object.keys(userProfile).length < 2) {
                        setAskingForField(result.data.missingProfileFields[0]);
                    }
                }
            } else {
                throw new Error("Failed");
            }
        } catch {
            const errorMessage: ChatMessage = {
                role: "assistant",
                content: "I apologize, but I'm having trouble connecting to the database. Please try again in a moment.",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getEligibilityBadge = (status: string | undefined) => {
        switch (status) {
            case 'eligible':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-success/10 text-success font-medium">Eligible</span>;
            case 'possibly_eligible':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-warning/10 text-warning font-medium">Possibly Eligible</span>;
            default:
                return <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground text-xs">Check Eligibility</span>;
        }
    };

    return (
        <Layout>
            {/* Government Identity Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

            <div className="min-h-[calc(100vh-200px)] flex flex-col">
                {/* Hero Section */}
                <section
                    className={`relative transition-all duration-500 overflow-hidden ${hasStartedChat ? 'py-6 md:py-8' : 'py-10 md:py-16'}`}
                    style={{ background: 'var(--gradient-hero)' }}
                >
                    {/* Subtle pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    />

                    <div className="container-gov relative z-10">
                        <div className="text-center max-w-3xl mx-auto">

                            {/* Official Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-primary-foreground text-sm mb-5 border border-white/20">
                                <ShieldCheck className="h-4 w-4 text-green-400" />
                                <span className="font-medium">Official Government Schemes Database</span>
                            </div>

                            <h1 className={`font-bold text-primary-foreground leading-tight mb-3 transition-all duration-500 ${hasStartedChat ? 'text-lg md:text-xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
                                }`}>
                                {hasStartedChat ? (
                                    "Government Scheme Finder"
                                ) : (
                                    <>
                                        Discover Government Schemes{" "}
                                        <span className="block sm:inline">You're <span className="text-gradient">Eligible</span> For</span>
                                    </>
                                )}
                            </h1>

                            {!hasStartedChat && (
                                <p className="text-base md:text-lg text-primary-foreground/85 mb-8 max-w-xl mx-auto">
                                    Access information on 3,400+ central and state government schemes.
                                    Simply describe your needs in your own words.
                                </p>
                            )}

                            {/* Search Input */}
                            <div className="max-w-2xl mx-auto">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-primary/50 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                                    <div className="relative flex items-center">
                                        <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none" />
                                        <Input
                                            ref={inputRef}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Describe what you're looking for... (e.g., 'scholarship for engineering student')"
                                            className="w-full py-6 pl-14 pr-14 text-base rounded-full bg-white border-0 shadow-xl focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted-foreground/70"
                                            disabled={isTyping}
                                        />
                                        <Button
                                            size="icon"
                                            onClick={() => handleSend()}
                                            disabled={!inputValue.trim() || isTyping}
                                            className="absolute right-2 h-11 w-11 rounded-full bg-accent hover:bg-accent/90 shadow-lg transition-all hover:scale-105 active:scale-95"
                                        >
                                            {isTyping ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* AI Powered indicator */}
                                <p className="mt-3 text-xs text-primary-foreground/60 flex items-center justify-center gap-1.5">
                                    <Sparkles className="h-3 w-3" />
                                    Powered by AI • Verified Government Data
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content Section */}
                <section className="flex-1 bg-background py-8">
                    <div className="container-gov">
                        <div className="max-w-3xl mx-auto">

                            {/* Chat Messages */}
                            {hasStartedChat && (
                                <div className="space-y-5 mb-8">
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                            style={{
                                                animation: 'fadeSlideIn 0.3s ease-out forwards',
                                                animationDelay: `${index * 0.05}s`
                                            }}
                                        >
                                            {message.role === "assistant" && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md ring-2 ring-white">
                                                        <ShieldCheck className="h-5 w-5 text-white" />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">Official</span>
                                                </div>
                                            )}

                                            <div className={`max-w-[75%] ${message.role === "assistant" ? "" : ""}`}>
                                                <div
                                                    className={`rounded-2xl px-5 py-4 ${message.role === "user"
                                                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-md"
                                                        : "bg-card border border-border rounded-bl-sm shadow-sm"
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                        {message.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                                            part.startsWith('**') && part.endsWith('**')
                                                                ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                                                                : part
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Message footer */}
                                                <div className={`flex items-center gap-3 mt-1.5 px-1 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatTime(message.timestamp)}
                                                    </span>
                                                    {message.role === "assistant" && (
                                                        <button
                                                            onClick={() => copyToClipboard(message.content, index)}
                                                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                                                            title="Copy response"
                                                        >
                                                            {copiedIndex === index ? (
                                                                <Check className="h-3 w-3 text-success" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {message.role === "user" && (
                                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm">
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Inline Profile Collection */}
                                    {askingForField && PROFILE_OPTIONS[askingForField as keyof typeof PROFILE_OPTIONS] && (
                                        <div className="flex gap-3 justify-start" style={{ animation: 'fadeSlideIn 0.3s ease-out forwards' }}>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md ring-2 ring-white">
                                                    <AlertCircle className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="max-w-[85%]">
                                                <div className="bg-accent/5 border border-accent/20 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                                                    <p className="text-sm font-medium text-foreground mb-3">
                                                        To find the best schemes for you, please select {FIELD_LABELS[askingForField] || askingForField}:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PROFILE_OPTIONS[askingForField as keyof typeof PROFILE_OPTIONS].map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => handleProfileUpdate(askingForField, option)}
                                                                className="px-3 py-1.5 rounded-full bg-white hover:bg-accent hover:text-white text-sm font-medium border border-border hover:border-accent transition-all"
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommended Schemes Cards */}
                                    {recommendedSchemes.length > 0 && (
                                        <div className="mt-6" style={{ animation: 'fadeSlideIn 0.3s ease-out forwards' }}>
                                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-accent" />
                                                Recommended Schemes for You
                                            </h3>
                                            <div className="space-y-3">
                                                {recommendedSchemes.slice(0, 3).map((scheme, index) => (
                                                    <div
                                                        key={scheme.id || index}
                                                        className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-primary/30"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-semibold text-foreground text-sm truncate">{scheme.name}</h4>
                                                                    {getEligibilityBadge((scheme as any).eligibility_status)}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                                    {scheme.benefits?.substring(0, 120)}...
                                                                </p>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <FileText className="h-3 w-3" />
                                                                        {scheme.level}
                                                                    </span>
                                                                    <span>{scheme.category?.split(',')[0]}</span>
                                                                </div>
                                                            </div>
                                                            <Link
                                                                to={`/scheme/${scheme.slug || scheme.id}`}
                                                                className="shrink-0 p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {recommendedSchemes.length > 3 && (
                                                <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                                                    <Link to="/search">
                                                        View All {recommendedSchemes.length} Recommendations
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Application Steps */}
                                    {applicationSteps && applicationSteps.length > 0 && (
                                        <div className="mt-6 bg-muted/50 rounded-xl p-4" style={{ animation: 'fadeSlideIn 0.3s ease-out forwards' }}>
                                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-success" />
                                                Application Steps
                                            </h3>
                                            <div className="space-y-3">
                                                {applicationSteps.map((step) => (
                                                    <div key={step.step} className="flex gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                                                            {step.step}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-foreground">{step.title}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                                                            {step.link && (
                                                                <a
                                                                    href={step.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    Visit Portal
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Typing indicator */}
                                    {isTyping && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md ring-2 ring-white">
                                                    <ShieldCheck className="h-5 w-5 text-white" />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">Official</span>
                                            </div>
                                            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-1">
                                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">Finding personalized schemes...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            )}

                            {/* Quick Actions when chatting */}
                            {hasStartedChat && (
                                <div className="flex flex-wrap gap-2 justify-center mb-8 pb-8 border-b border-border">
                                    {suggestions.slice(0, 4).map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => handleSend(suggestion)}
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {/* Pre-chat content */}
                            {!hasStartedChat && (
                                <>
                                    {/* Suggested Queries */}
                                    <div className="mb-10">
                                        <p className="text-center text-sm text-muted-foreground mb-4 font-medium">Popular Searches</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {suggestions.map((question, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSend(question)}
                                                    className="px-4 py-2.5 rounded-full bg-white hover:bg-secondary text-sm text-foreground transition-all hover:shadow-md border border-border hover:border-primary/30 font-medium"
                                                >
                                                    {question}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Category Cards */}
                                    <div className="mb-12">
                                        <h2 className="text-center text-lg font-semibold text-foreground mb-2">
                                            Browse by Category
                                        </h2>
                                        <p className="text-center text-sm text-muted-foreground mb-6">
                                            Select a category to explore relevant schemes
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                            {quickCategories.map((cat, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSend(cat.query)}
                                                    className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-border hover:border-primary/40 hover:shadow-lg transition-all group relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="relative w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all">
                                                        <cat.icon className="h-7 w-7 text-primary" />
                                                    </div>
                                                    <div className="relative text-center">
                                                        <span className="text-sm font-semibold text-foreground block">{cat.label}</span>
                                                        <span className="text-xs text-muted-foreground">{cat.sublabel}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Trust Indicators */}
                                    <div className="bg-muted/50 rounded-2xl p-6 mb-8">
                                        <div className="flex flex-wrap justify-center gap-8 text-sm">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                                    <ShieldCheck className="h-5 w-5 text-success" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-foreground block">Verified Data</span>
                                                    <span className="text-xs text-muted-foreground">Official sources only</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-foreground block">3,400+ Schemes</span>
                                                    <span className="text-xs text-muted-foreground">Central & State</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                                    <Sparkles className="h-5 w-5 text-accent" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-foreground block">AI-Powered</span>
                                                    <span className="text-xs text-muted-foreground">Smart matching</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Banner */}
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-info/5 border border-info/20">
                                        <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="text-foreground font-medium mb-1">How to use this service</p>
                                            <p className="text-muted-foreground">
                                                Describe your situation in simple terms (e.g., "I'm a farmer in Maharashtra looking for crop insurance").
                                                Our AI will find relevant schemes and explain eligibility criteria.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}

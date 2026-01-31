import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChevronDown, ChevronUp, HelpCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    {
        category: "General",
        question: "What is JanScheme?",
        answer: "JanScheme is an AI-powered platform designed to help Indian citizens discover and understand government welfare schemes they're eligible for. Our intelligent chatbot provides personalized scheme recommendations based on your profile and needs."
    },
    {
        category: "General",
        question: "Is JanScheme a government website?",
        answer: "No, JanScheme is not an official government website. We are an independent platform that aggregates information about government schemes from official sources to help citizens find relevant benefits. Always verify information on official government portals before applying."
    },
    {
        category: "General",
        question: "Is JanScheme free to use?",
        answer: "Yes, JanScheme is completely free to use. Our mission is to make government scheme information accessible to all Indian citizens without any cost."
    },
    {
        category: "Eligibility",
        question: "How do I know if I'm eligible for a scheme?",
        answer: "Each scheme page displays detailed eligibility criteria. You can also use our AI chatbot to get personalized recommendations based on your profile information like age, income, occupation, and location."
    },
    {
        category: "Eligibility",
        question: "Can I apply for multiple schemes?",
        answer: "Yes, you can apply for multiple schemes as long as you meet the eligibility criteria for each. Some schemes may have restrictions on combining benefits, which will be mentioned in the scheme details."
    },
    {
        category: "Application",
        question: "How do I apply for a government scheme?",
        answer: "JanScheme provides information about schemes and links to official application portals. The actual application process is handled by the respective government departments. We guide you on the required documents and steps."
    },
    {
        category: "Application",
        question: "What documents are typically required?",
        answer: "Common documents include Aadhaar card, income certificate, caste certificate, residence proof, bank account details, and passport-sized photographs. Specific requirements vary by scheme and are listed on each scheme's detail page."
    },
    {
        category: "Application",
        question: "Can I track my application status?",
        answer: "Application tracking is done through the official government portals. JanScheme helps you save schemes you're interested in and provides links to where you can track your applications."
    },
    {
        category: "Account",
        question: "Do I need to create an account?",
        answer: "Creating an account is optional but recommended. With an account, you can save schemes, get personalized recommendations, and track your scheme applications more easily."
    },
    {
        category: "Account",
        question: "Is my personal information safe?",
        answer: "Yes, we take data privacy seriously. Your personal information is encrypted and stored securely. We never share your data with third parties without your consent. Read our Privacy Policy for more details."
    },
    {
        category: "Technical",
        question: "The website is not loading properly. What should I do?",
        answer: "Try clearing your browser cache and cookies, or try using a different browser. If the problem persists, please contact our support team through the Help Center."
    },
    {
        category: "Technical",
        question: "Is there a mobile app available?",
        answer: "Currently, JanScheme is available as a web application that works on all devices including mobile phones. We're working on dedicated mobile apps for Android and iOS."
    }
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export default function FAQ() {
    const [openItems, setOpenItems] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filteredFAQs = useMemo(() => {
        return faqData.filter(item => {
            const matchesSearch = searchQuery === "" ||
                item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === null || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    const toggleItem = (index: number) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(index)) {
            newOpenItems.delete(index);
        } else {
            newOpenItems.add(index);
        }
        setOpenItems(newOpenItems);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main id="main-content" className="container-gov py-8 md:py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Find answers to common questions about JanScheme and government welfare schemes.
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-xl mx-auto mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search questions..."
                            className="pl-10 py-6 text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === null
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            }`}
                    >
                        All
                    </button>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === category
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="max-w-3xl mx-auto space-y-3">
                    {filteredFAQs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No questions found matching your search.</p>
                        </div>
                    ) : (
                        filteredFAQs.map((item, index) => {
                            const originalIndex = faqData.indexOf(item);
                            return (
                                <div
                                    key={originalIndex}
                                    className="border border-border rounded-lg overflow-hidden bg-card"
                                >
                                    <button
                                        onClick={() => toggleItem(originalIndex)}
                                        className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-secondary/50 transition-colors"
                                        aria-expanded={openItems.has(originalIndex)}
                                    >
                                        <span className="font-medium text-foreground pr-4">{item.question}</span>
                                        {openItems.has(originalIndex) ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                                        )}
                                    </button>
                                    {openItems.has(originalIndex) && (
                                        <div className="px-4 md:px-5 pb-4 md:pb-5 text-muted-foreground animate-fade-in">
                                            <p className="leading-relaxed">{item.answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Contact CTA */}
                <div className="text-center mt-12 p-8 bg-secondary/50 rounded-2xl max-w-2xl mx-auto">
                    <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
                    <p className="text-muted-foreground mb-4">
                        Can't find what you're looking for? Visit our Help Center or contact us directly.
                    </p>
                    <a
                        href="/help"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        Visit Help Center
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    );
}

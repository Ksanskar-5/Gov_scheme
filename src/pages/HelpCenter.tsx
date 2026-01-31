import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
    MessageCircle,
    Mail,
    Phone,
    FileText,
    BookOpen,
    Search,
    ExternalLink,
    Clock,
    MapPin
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const helpCategories = [
    {
        icon: BookOpen,
        title: "Getting Started",
        description: "Learn how to use JanScheme to find government schemes",
        links: [
            { text: "How to search for schemes", href: "/faq" },
            { text: "Creating your profile", href: "/profile" },
            { text: "Understanding eligibility", href: "/faq" }
        ]
    },
    {
        icon: FileText,
        title: "Application Process",
        description: "Step-by-step guides for applying to schemes",
        links: [
            { text: "Required documents guide", href: "/faq" },
            { text: "How to apply online", href: "/faq" },
            { text: "Tracking your application", href: "/faq" }
        ]
    },
    {
        icon: MessageCircle,
        title: "AI Assistant",
        description: "Get help using our intelligent chatbot",
        links: [
            { text: "How the chatbot works", href: "/faq" },
            { text: "Getting personalized recommendations", href: "/dashboard" },
            { text: "Chatbot tips & tricks", href: "/faq" }
        ]
    }
];

const contactMethods = [
    {
        icon: Mail,
        title: "Email Support",
        description: "Get help via email",
        contact: "support@janscheme.in",
        note: "Response within 24-48 hours"
    },
    {
        icon: Phone,
        title: "Phone Support",
        description: "Talk to our team",
        contact: "1800-XXX-XXXX",
        note: "Mon-Sat, 9 AM - 6 PM IST"
    }
];

const popularArticles = [
    "How to check if I'm eligible for PM-KISAN?",
    "What documents are needed for Ayushman Bharat?",
    "How to apply for education scholarships?",
    "Understanding BPL card benefits",
    "State vs Central schemes - What's the difference?"
];

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/faq?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main id="main-content">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
                    <div className="container-gov text-center">
                        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                            How can we help you?
                        </h1>
                        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                            Find answers, guides, and support for navigating government welfare schemes.
                        </p>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="max-w-xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search for help articles..."
                                    className="pl-12 py-6 text-base bg-card shadow-lg border-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>
                    </div>
                </section>

                {/* Help Categories */}
                <section className="container-gov py-12">
                    <h2 className="text-2xl font-bold text-center mb-8">Browse by Topic</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {helpCategories.map((category, index) => (
                            <div
                                key={index}
                                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow"
                            >
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <category.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                                <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                                <ul className="space-y-2">
                                    {category.links.map((link, linkIndex) => (
                                        <li key={linkIndex}>
                                            <Link
                                                to={link.href}
                                                className="text-sm text-primary hover:underline flex items-center gap-1"
                                            >
                                                {link.text}
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Popular Articles */}
                <section className="bg-secondary/30 py-12">
                    <div className="container-gov">
                        <h2 className="text-2xl font-bold text-center mb-8">Popular Questions</h2>
                        <div className="max-w-2xl mx-auto">
                            <ul className="space-y-3">
                                {popularArticles.map((article, index) => (
                                    <li key={index}>
                                        <Link
                                            to="/faq"
                                            className="flex items-center gap-3 p-4 rounded-lg bg-card hover:bg-card/80 transition-colors border border-border"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="text-sm font-medium text-primary">{index + 1}</span>
                                            </div>
                                            <span className="text-foreground">{article}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="text-center mt-6">
                                <Link
                                    to="/faq"
                                    className="text-primary font-medium hover:underline"
                                >
                                    View all FAQs →
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="container-gov py-12">
                    <h2 className="text-2xl font-bold text-center mb-8">Contact Us</h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {contactMethods.map((method, index) => (
                            <div
                                key={index}
                                className="p-6 rounded-xl border border-border bg-card text-center"
                            >
                                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                                    <method.icon className="w-7 h-7 text-accent" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">{method.title}</h3>
                                <p className="text-muted-foreground text-sm mb-3">{method.description}</p>
                                <p className="font-medium text-primary text-lg">{method.contact}</p>
                                <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {method.note}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Office Address */}
                    <div className="max-w-xl mx-auto mt-8 p-6 rounded-xl border border-border bg-card">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <MapPin className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Office Address</h3>
                                <p className="text-muted-foreground text-sm">
                                    JanScheme Technologies Pvt. Ltd.<br />
                                    123 Digital India Complex<br />
                                    New Delhi - 110001, India
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Links */}
                <section className="bg-primary/5 py-12">
                    <div className="container-gov text-center">
                        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/faq" className="text-primary hover:underline">FAQ</Link>
                            <span className="text-muted-foreground">•</span>
                            <Link to="/about" className="text-primary hover:underline">About Us</Link>
                            <span className="text-muted-foreground">•</span>
                            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                            <span className="text-muted-foreground">•</span>
                            <Link to="/terms" className="text-primary hover:underline">Terms of Use</Link>
                            <span className="text-muted-foreground">•</span>
                            <Link to="/disclaimer" className="text-primary hover:underline">Disclaimer</Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

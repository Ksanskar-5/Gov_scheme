import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
    Users,
    Target,
    Heart,
    Shield,
    Globe,
    Award,
    Lightbulb,
    CheckCircle
} from "lucide-react";

const values = [
    {
        icon: Heart,
        title: "Citizen First",
        description: "Every feature we build is designed with the common citizen in mind, ensuring accessibility for all."
    },
    {
        icon: Shield,
        title: "Trust & Transparency",
        description: "We provide accurate, verified information sourced directly from official government portals."
    },
    {
        icon: Globe,
        title: "Inclusive Access",
        description: "Breaking language and digital barriers to make scheme information accessible to every Indian."
    },
    {
        icon: Lightbulb,
        title: "Innovation",
        description: "Using AI and modern technology to simplify the complex world of government welfare schemes."
    }
];

const milestones = [
    { number: "3000+", label: "Government Schemes" },
    { number: "50L+", label: "Citizens Helped" },
    { number: "28", label: "States Covered" },
    { number: "10+", label: "Languages" }
];

const team = [
    {
        name: "Founded by Citizens",
        role: "For Citizens",
        description: "JanScheme was founded by a team of passionate technologists and social workers who believed that every Indian deserves easy access to government welfare benefits."
    }
];

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main id="main-content">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
                    <div className="container-gov">
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
                                <span className="text-4xl font-bold text-primary">जन</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                                Empowering Every Indian with
                                <span className="text-primary"> Government Benefits</span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                JanScheme is India's most comprehensive AI-powered platform for discovering
                                government welfare schemes. We're on a mission to ensure no eligible citizen
                                misses out on their entitled benefits.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-12 border-b border-border">
                    <div className="container-gov">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {milestones.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                                        {stat.number}
                                    </div>
                                    <div className="text-muted-foreground text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission */}
                <section className="container-gov py-16">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                                <Target className="w-4 h-4" />
                                Our Mission
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                Bridging the Gap Between Government Schemes and Citizens
                            </h2>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                India has hundreds of welfare schemes designed to help citizens in areas like
                                education, healthcare, agriculture, and housing. However, most people remain
                                unaware of schemes they're eligible for due to information gaps and complex
                                bureaucratic processes.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                JanScheme uses artificial intelligence to match citizens with relevant schemes
                                based on their profile, explains complex eligibility criteria in simple language,
                                and guides them through the application process.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8">
                            <h3 className="font-semibold text-lg mb-4">What We Offer</h3>
                            <ul className="space-y-4">
                                {[
                                    "Comprehensive database of Central and State schemes",
                                    "AI-powered scheme recommendations",
                                    "Simplified eligibility explanations",
                                    "Step-by-step application guidance",
                                    "Multi-language support",
                                    "Regular updates on new schemes"
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                                        <span className="text-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="bg-secondary/30 py-16">
                    <div className="container-gov">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Values</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                The principles that guide everything we do at JanScheme.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map((value, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <value.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold mb-2">{value.title}</h3>
                                    <p className="text-muted-foreground text-sm">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Vision */}
                <section className="container-gov py-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            <Award className="w-4 h-4" />
                            Our Vision
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-6">
                            A Future Where Every Eligible Citizen Benefits
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                            We envision an India where no citizen misses out on government benefits due to
                            lack of awareness or complex procedures. Through technology and dedication,
                            we're working towards making government welfare truly accessible to all 1.4 billion Indians.
                        </p>
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                            <p className="text-lg font-medium text-foreground italic">
                                "Jan Seva, Jan Kalyan" - Service to People, Welfare of People
                            </p>
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="bg-primary/5 py-16">
                    <div className="container-gov">
                        <div className="max-w-2xl mx-auto text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Built by the Community</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                JanScheme is built and maintained by a dedicated team of developers, designers,
                                and welfare experts who volunteer their time and skills to serve their fellow
                                citizens. We work closely with government officials and NGOs to ensure our
                                information is accurate and up-to-date.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="container-gov py-16">
                    <div className="max-w-2xl mx-auto text-center">
                        <h2 className="text-2xl font-bold mb-4">Ready to Find Your Benefits?</h2>
                        <p className="text-muted-foreground mb-6">
                            Start exploring government schemes tailored to your needs.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="/search"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                            >
                                Browse Schemes
                            </a>
                            <a
                                href="/profile"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-card font-medium hover:bg-secondary transition-colors"
                            >
                                Create Profile
                            </a>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

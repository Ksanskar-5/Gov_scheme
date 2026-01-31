import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FileText, Calendar } from "lucide-react";

export default function TermsOfUse() {
    const lastUpdated = "January 31, 2026";

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main id="main-content" className="container-gov py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Terms of Use</h1>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4" />
                            Last Updated: {lastUpdated}
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <section>
                            <p className="text-muted-foreground">
                                Welcome to JanScheme. By accessing or using our website and services, you agree to be bound by these Terms of Use.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground">
                                By using JanScheme, you accept these Terms, our Privacy Policy, and any additional terms. If you do not agree, please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Services</h2>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li>Information aggregation about government welfare schemes</li>
                                <li>AI-powered chatbot for personalized recommendations</li>
                                <li>Search and filtering tools to discover relevant schemes</li>
                                <li>User profiles for personalized experience</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                            <p className="text-muted-foreground">
                                You agree to provide accurate information, maintain account security, and accept responsibility for all activities under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">4. Prohibited Activities</h2>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li>Using the service for unlawful purposes</li>
                                <li>Scraping or copying content without permission</li>
                                <li>Attempting unauthorized access to systems</li>
                                <li>Transmitting malware or harmful code</li>
                                <li>Impersonating any person or entity</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">5. Intellectual Property</h2>
                            <p className="text-muted-foreground">
                                JanScheme name, logo, and original content are protected by intellectual property laws. Government scheme information is sourced from official public sources.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">6. AI Chatbot Disclaimer</h2>
                            <p className="text-muted-foreground">
                                Our AI chatbot provides guidance based on information you provide. Responses should be verified with official sources.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
                            <p className="text-muted-foreground">
                                JanScheme shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">8. Governing Law</h2>
                            <p className="text-muted-foreground">
                                These Terms shall be governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in New Delhi, India.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">9. Contact Us</h2>
                            <div className="bg-secondary/50 rounded-lg p-4 text-muted-foreground">
                                <p><strong>Email:</strong> legal@janscheme.in</p>
                                <p><strong>Address:</strong> JanScheme Technologies Pvt. Ltd., 123 Digital India Complex, New Delhi - 110001</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

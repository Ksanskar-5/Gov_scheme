import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Calendar } from "lucide-react";

export default function PrivacyPolicy() {
    const lastUpdated = "January 31, 2026";

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main id="main-content" className="container-gov py-8 md:py-12">
                {/* Header */}
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Privacy Policy
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4" />
                            Last Updated: {lastUpdated}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-lg max-w-none">
                        <section className="mb-8">
                            <p className="text-muted-foreground leading-relaxed">
                                JanScheme ("we," "our," or "us") is committed to protecting your privacy.
                                This Privacy Policy explains how we collect, use, disclose, and safeguard
                                your information when you visit our website and use our services.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>

                            <h3 className="text-lg font-medium text-foreground mb-2">Personal Information</h3>
                            <p className="text-muted-foreground mb-4">
                                When you create a profile or use our services, we may collect:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                                <li>Name and contact information (email, phone number)</li>
                                <li>Demographic information (age, gender, location, state, district)</li>
                                <li>Socioeconomic information (income range, profession, category)</li>
                                <li>Special category data (disability status, minority status, BPL status)</li>
                                <li>Family information (family size, dependents)</li>
                                <li>Education and employment details</li>
                            </ul>

                            <h3 className="text-lg font-medium text-foreground mb-2">Automatically Collected Information</h3>
                            <p className="text-muted-foreground mb-4">
                                When you access our website, we automatically collect:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li>Device information (browser type, operating system)</li>
                                <li>IP address and approximate location</li>
                                <li>Pages visited and time spent on pages</li>
                                <li>Referring website addresses</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
                            <p className="text-muted-foreground mb-4">We use your information to:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li>Provide personalized scheme recommendations based on your eligibility</li>
                                <li>Improve our AI chatbot to better assist you</li>
                                <li>Send notifications about relevant new schemes (with your consent)</li>
                                <li>Analyze usage patterns to improve our services</li>
                                <li>Respond to your inquiries and support requests</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">3. Information Sharing</h2>
                            <p className="text-muted-foreground mb-4">
                                We do not sell, trade, or rent your personal information to third parties.
                                We may share your information only in the following circumstances:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li><strong>With your consent:</strong> When you explicitly agree to share information</li>
                                <li><strong>Service providers:</strong> With trusted partners who help us operate our services (under strict confidentiality agreements)</li>
                                <li><strong>Legal requirements:</strong> When required by law or to protect our rights and safety</li>
                                <li><strong>Anonymized data:</strong> Aggregated, non-identifying information may be shared for research purposes</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">4. Data Security</h2>
                            <p className="text-muted-foreground mb-4">
                                We implement appropriate technical and organizational security measures to
                                protect your personal information, including:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li>Encryption of data in transit and at rest</li>
                                <li>Regular security assessments and audits</li>
                                <li>Access controls and authentication mechanisms</li>
                                <li>Employee training on data protection</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">5. Data Retention</h2>
                            <p className="text-muted-foreground">
                                We retain your personal information only as long as necessary to provide
                                our services and fulfill the purposes outlined in this policy. You can
                                request deletion of your account and associated data at any time by
                                contacting us.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">6. Your Rights</h2>
                            <p className="text-muted-foreground mb-4">You have the right to:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                                <li><strong>Portability:</strong> Request transfer of your data in a machine-readable format</li>
                                <li><strong>Withdrawal of consent:</strong> Withdraw consent for data processing at any time</li>
                                <li><strong>Object:</strong> Object to processing of your personal data</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">7. Cookies</h2>
                            <p className="text-muted-foreground">
                                We use cookies and similar technologies to enhance your experience,
                                analyze usage, and deliver personalized content. You can control cookie
                                preferences through your browser settings. Essential cookies required
                                for the website to function cannot be disabled.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
                            <p className="text-muted-foreground">
                                Our services are not intended for children under 13 years of age. We do
                                not knowingly collect personal information from children under 13. If
                                you are a parent or guardian and believe your child has provided us with
                                personal information, please contact us immediately.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">9. Changes to This Policy</h2>
                            <p className="text-muted-foreground">
                                We may update this Privacy Policy from time to time. We will notify you
                                of any changes by posting the new Privacy Policy on this page and updating
                                the "Last Updated" date. We encourage you to review this policy periodically.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact Us</h2>
                            <p className="text-muted-foreground mb-4">
                                If you have any questions about this Privacy Policy or our data practices,
                                please contact us:
                            </p>
                            <div className="bg-secondary/50 rounded-lg p-4 text-muted-foreground">
                                <p><strong>Email:</strong> privacy@janscheme.in</p>
                                <p><strong>Address:</strong> JanScheme Technologies Pvt. Ltd., 123 Digital India Complex, New Delhi - 110001, India</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

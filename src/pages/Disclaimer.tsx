import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AlertTriangle, Calendar } from "lucide-react";

export default function Disclaimer() {
    const lastUpdated = "January 31, 2026";

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main id="main-content" className="container-gov py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Disclaimer</h1>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="w-4 h-4" />
                            Last Updated: {lastUpdated}
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-8">
                        <div className="flex gap-4">
                            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                            <div>
                                <h2 className="font-semibold text-foreground mb-2">Important Notice</h2>
                                <p className="text-muted-foreground">
                                    JanScheme is NOT an official government website. We are an independent platform that aggregates publicly available information about government welfare schemes to help citizens. Always verify information on official government portals.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">1. No Government Affiliation</h2>
                            <p className="text-muted-foreground">
                                JanScheme is a private initiative and is not affiliated with, endorsed by, or connected to any government department or ministry. We do not represent any government entity and cannot guarantee scheme eligibility or benefits.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">2. Information Accuracy</h2>
                            <p className="text-muted-foreground mb-4">
                                While we strive to provide accurate and up-to-date information:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li>Government schemes may change without prior notice</li>
                                <li>Eligibility criteria may vary and are subject to official verification</li>
                                <li>Information on our platform may not reflect the most recent updates</li>
                                <li>We recommend verifying all details on official government websites</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">3. No Guarantee of Benefits</h2>
                            <p className="text-muted-foreground">
                                Using JanScheme does not guarantee approval or receipt of any government scheme benefits. Final decisions on scheme eligibility rest solely with the respective government authorities.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">4. AI Recommendations</h2>
                            <p className="text-muted-foreground">
                                Our AI chatbot provides recommendations based on information you provide. These are suggestions only and may not cover all relevant schemes or accurately assess your eligibility. AI responses should not be considered as professional or legal advice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">5. Third-Party Links</h2>
                            <p className="text-muted-foreground">
                                We provide links to official government websites for your convenience. We are not responsible for the content, accuracy, or availability of these external websites.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">6. No Liability</h2>
                            <p className="text-muted-foreground">
                                JanScheme shall not be held liable for any loss, damage, or inconvenience arising from the use of information on our platform, including missed scheme deadlines, incorrect eligibility assessments, or application rejections.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">7. User Responsibility</h2>
                            <p className="text-muted-foreground mb-4">
                                Users are responsible for:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li>Verifying all scheme information with official sources</li>
                                <li>Ensuring they meet eligibility criteria before applying</li>
                                <li>Submitting accurate information in their applications</li>
                                <li>Meeting all deadlines and requirements set by government authorities</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">8. Official Resources</h2>
                            <p className="text-muted-foreground mb-4">For verified information, please visit:</p>
                            <div className="bg-secondary/50 rounded-lg p-4">
                                <ul className="space-y-2 text-muted-foreground">
                                    <li><strong>India.gov.in</strong> - National Portal of India</li>
                                    <li><strong>MyScheme.gov.in</strong> - Government Scheme Portal</li>
                                    <li><strong>DigiLocker.gov.in</strong> - Digital Document Platform</li>
                                    <li>Respective State Government Portals</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-4">9. Contact</h2>
                            <p className="text-muted-foreground">
                                For questions about this disclaimer, contact us at <strong>legal@janscheme.in</strong>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

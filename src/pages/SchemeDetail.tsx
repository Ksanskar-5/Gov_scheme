import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  FileText,
  Bookmark,
  MessageCircle,
  Share2,
  ChevronRight,
  Tag,
  Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SchemeDetailSkeleton } from "@/components/ui/skeleton-card";
import {
  getSchemeBySlug,
  checkSchemeEligibility,
  saveScheme,
  removeSavedScheme,
  getSavedSchemes,
  type Scheme,
  type EligibilityResult,
  type EligibilityStatus,
  type UserProfile
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SchemeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load scheme data
  useEffect(() => {
    async function loadScheme() {
      if (!id) return;

      setIsLoading(true);
      const result = await getSchemeBySlug(id);

      if (result.success && result.data) {
        setScheme(result.data);

        // Check if this scheme is saved by the user
        if (user?.id) {
          try {
            const savedResult = await getSavedSchemes(user.id);
            if (savedResult.success && savedResult.data) {
              const isSavedScheme = savedResult.data.some(s => s.schemeId === result.data!.id);
              setIsSaved(isSavedScheme);
            }
          } catch (error) {
            console.error("Error checking saved status:", error);
          }
        }
      } else {
        setScheme(null);
      }
      setIsLoading(false);
    }

    loadScheme();
  }, [id, user?.id]);

  // Check eligibility
  const handleCheckEligibility = async () => {
    if (!scheme) return;

    // Get user profile from localStorage or use demo profile
    const storedProfile = localStorage.getItem("userProfile");
    const userProfile: Partial<UserProfile> = storedProfile
      ? JSON.parse(storedProfile)
      : {
        age: 35,
        state: "Maharashtra",
        category: "general",
        isWorker: true,
      };

    setIsCheckingEligibility(true);
    const result = await checkSchemeEligibility(scheme.id, userProfile);

    if (result.success && result.data) {
      setEligibility(result.data);
    }
    setIsCheckingEligibility(false);
  };

  const handleSaveScheme = async () => {
    if (!user?.id) {
      toast.error("Please login to save schemes");
      return;
    }
    if (!scheme) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        // Remove from saved
        const response = await removeSavedScheme(user.id, scheme.id);
        if (response.success) {
          setIsSaved(false);
          toast.success("Scheme removed from saved list");
        } else {
          toast.error("Failed to remove scheme");
        }
      } else {
        // Save scheme
        const response = await saveScheme(user.id, scheme.id);
        if (response.success) {
          setIsSaved(true);
          toast.success("Scheme saved successfully");
        } else {
          toast.error("Failed to save scheme");
        }
      }
    } catch (error) {
      console.error("Error saving scheme:", error);
      toast.error("Failed to save scheme");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: scheme?.name,
        text: `Check out this government scheme: ${scheme?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-gov section-padding">
          <SchemeDetailSkeleton />
        </div>
      </Layout>
    );
  }

  if (!scheme) {
    return (
      <Layout>
        <div className="container-gov section-padding text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Scheme not found</h1>
          <p className="text-muted-foreground mb-6">The scheme you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/search">Browse all schemes</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getEligibilityConfig = (status?: EligibilityStatus) => {
    switch (status) {
      case "eligible":
        return {
          icon: CheckCircle2,
          label: "Likely Eligible",
          bgClass: "bg-success/10",
          textClass: "text-success",
          borderClass: "border-success/20"
        };
      case "possibly_eligible":
        return {
          icon: AlertCircle,
          label: "Possibly Eligible",
          bgClass: "bg-warning/10",
          textClass: "text-warning",
          borderClass: "border-warning/20"
        };
      case "not_eligible":
        return {
          icon: XCircle,
          label: "Not Eligible",
          bgClass: "bg-destructive/10",
          textClass: "text-destructive",
          borderClass: "border-destructive/20"
        };
      default:
        return {
          icon: HelpCircle,
          label: "Check Eligibility",
          bgClass: "bg-muted",
          textClass: "text-muted-foreground",
          borderClass: "border-border"
        };
    }
  };

  const eligibilityConfig = getEligibilityConfig(eligibility?.status);
  const EligibilityIcon = eligibilityConfig.icon;

  // Parse eligibility criteria from text
  const parseEligibilityCriteria = (text: string): string[] => {
    if (!text) return [];
    // Split by common delimiters
    const lines = text.split(/\n|;|\d+\.\s+/).filter(line => line.trim().length > 10);
    return lines.slice(0, 6).map(line => line.trim().replace(/^[-•*]\s*/, ''));
  };

  // Parse documents from text
  const parseDocuments = (text: string): string[] => {
    if (!text) return [];
    const lines = text.split(/\n|;|\d+\.\s+/).filter(line => line.trim().length > 5);
    return lines.slice(0, 10).map(line => line.trim().replace(/^[-•*]\s*/, ''));
  };

  // Parse application steps
  const parseApplicationSteps = (text: string): Array<{ step: number; title: string; description: string }> => {
    if (!text) return [];
    const lines = text.split(/\n/).filter(line => line.trim().length > 10);
    return lines.slice(0, 8).map((line, index) => {
      const cleaned = line.trim().replace(/^(?:Step\s*)?(\d+)[.:)\-]\s*/i, '');
      return {
        step: index + 1,
        title: `Step ${index + 1}`,
        description: cleaned
      };
    });
  };

  // Extract benefit amount
  const extractBenefitAmount = (): string | null => {
    if (!scheme.benefits) return null;
    const match = scheme.benefits.match(/₹[\s]*[\d,]+(?:[\s]*(?:lakh|crore|per\s+(?:month|year|annum)|\/-))?/i);
    return match ? match[0] : null;
  };

  const benefitAmount = extractBenefitAmount();
  const eligibilityCriteria = parseEligibilityCriteria(scheme.eligibility);
  const documents = parseDocuments(scheme.documents);
  const applicationSteps = parseApplicationSteps(scheme.application);

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/search" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to schemes
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate">{scheme.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={scheme.level === "Central" ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent border-accent/20"}>
                  {scheme.level}
                </Badge>
                {scheme.category && (
                  <Badge variant="outline">{scheme.category.split(",")[0]}</Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {scheme.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {scheme.category?.split(",")[0] || "General"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {scheme.level === "Central" ? "All India" : scheme.state || "State Scheme"}
                </span>
              </div>
            </div>

            {/* Eligibility Check Card */}
            <Card className={`${eligibilityConfig.bgClass} border ${eligibilityConfig.borderClass}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${eligibilityConfig.bgClass} flex items-center justify-center shrink-0`}>
                    <EligibilityIcon className={`h-6 w-6 ${eligibilityConfig.textClass}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${eligibilityConfig.textClass} mb-2`}>
                      {eligibilityConfig.label}
                    </h3>

                    {eligibility ? (
                      <>
                        {eligibility.matchedCriteria.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Matched criteria:</p>
                            <ul className="space-y-1">
                              {eligibility.matchedCriteria.map((criterion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-success">
                                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                  <span>{criterion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {eligibility.unmatchedCriteria.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">May not match:</p>
                            <ul className="space-y-1">
                              {eligibility.unmatchedCriteria.map((criterion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-destructive">
                                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                  <span>{criterion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-3">
                          Confidence: {eligibility.confidence}% • Final eligibility determined by authorities
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-3">
                          Check if you're eligible for this scheme based on your profile.
                        </p>
                        <Button
                          onClick={handleCheckEligibility}
                          disabled={isCheckingEligibility}
                          size="sm"
                        >
                          {isCheckingEligibility && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Check My Eligibility
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Criteria */}
            {eligibilityCriteria.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Eligibility Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {eligibilityCriteria.map((criterion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About this Scheme</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {scheme.details || "No detailed description available for this scheme."}
                </p>
              </CardContent>
            </Card>

            {/* Documents Required */}
            {documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Checkbox id={`doc-${index}`} />
                        <label
                          htmlFor={`doc-${index}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {doc}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Check the documents you already have. This helps track your application readiness.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Application Steps */}
            {applicationSteps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Apply</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applicationSteps.map((step, index) => (
                      <div key={step.step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {step.step}
                          </div>
                          {index < applicationSteps.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Benefits Card */}
            <Card className="border-success/20">
              <CardHeader className="bg-success/5">
                <CardTitle className="text-lg text-success">Benefits</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {benefitAmount && (
                  <div className="text-center p-4 rounded-lg bg-success/5 mb-4">
                    <p className="text-2xl font-bold text-success">{benefitAmount}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {scheme.benefits || "Benefit details not available."}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" variant="outline" onClick={handleSaveScheme} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                )}
                {isSaving ? "Saving..." : isSaved ? "Saved" : "Save Scheme"}
              </Button>

              <Button variant="ghost" className="w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Ask AI Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Have questions?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask our AI assistant about eligibility, documents, or application process.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Ask AI about this scheme
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {scheme.tags && scheme.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Related topics:</p>
                <div className="flex flex-wrap gap-2">
                  {scheme.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

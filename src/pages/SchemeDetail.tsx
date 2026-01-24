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
  Loader2,
  Users,
  IndianRupee,
  Clock,
  Shield,
  Star,
  Gift,
  ArrowUpRight
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
  type Scheme,
  type EligibilityResult,
  type EligibilityStatus,
  type UserProfile
} from "@/lib/api";
import { toast } from "sonner";

export default function SchemeDetail() {
  const { id } = useParams<{ id: string }>();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load scheme data
  useEffect(() => {
    async function loadScheme() {
      if (!id) return;

      setIsLoading(true);
      const result = await getSchemeBySlug(id);

      if (result.success && result.data) {
        setScheme(result.data);
      } else {
        setScheme(null);
      }
      setIsLoading(false);
    }

    loadScheme();
  }, [id]);

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

  const handleSaveScheme = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Scheme removed from saved list" : "Scheme saved successfully");
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
          label: "You're Eligible!",
          description: "Based on your profile, you meet the eligibility criteria.",
          bgClass: "bg-gradient-to-br from-success/10 to-success/5",
          textClass: "text-success",
          borderClass: "border-success/30"
        };
      case "possibly_eligible":
        return {
          icon: AlertCircle,
          label: "Possibly Eligible",
          description: "You may qualify, but some criteria need verification.",
          bgClass: "bg-gradient-to-br from-warning/10 to-warning/5",
          textClass: "text-warning",
          borderClass: "border-warning/30"
        };
      case "not_eligible":
        return {
          icon: XCircle,
          label: "Not Eligible",
          description: "Based on your profile, you don't meet the current criteria.",
          bgClass: "bg-gradient-to-br from-destructive/10 to-destructive/5",
          textClass: "text-destructive",
          borderClass: "border-destructive/30"
        };
      default:
        return {
          icon: HelpCircle,
          label: "Check Your Eligibility",
          description: "Find out if you qualify for this scheme.",
          bgClass: "bg-gradient-to-br from-primary/10 to-primary/5",
          textClass: "text-primary",
          borderClass: "border-primary/30"
        };
    }
  };

  const eligibilityConfig = getEligibilityConfig(eligibility?.status);
  const EligibilityIcon = eligibilityConfig.icon;

  // Parse eligibility criteria with highlighting
  const parseEligibilityCriteria = (text: string): { text: string; highlight: string | null }[] => {
    if (!text) return [];
    const lines = text.split(/\n|;|(?:\d+\.)\s+/).filter(line => line.trim().length > 10);

    return lines.slice(0, 8).map(line => {
      const cleaned = line.trim().replace(/^[-•*]\s*/, '');

      // Detect key criteria for highlighting
      let highlight: string | null = null;
      if (/income|bpl|below poverty/i.test(cleaned)) highlight = "income";
      else if (/age|year|senior|youth/i.test(cleaned)) highlight = "age";
      else if (/farmer|agriculture|kisan/i.test(cleaned)) highlight = "farmer";
      else if (/woman|female|widow|mahila/i.test(cleaned)) highlight = "women";
      else if (/sc|st|obc|backward|scheduled/i.test(cleaned)) highlight = "category";
      else if (/state|resident|domicile/i.test(cleaned)) highlight = "location";
      else if (/student|education|scholarship/i.test(cleaned)) highlight = "education";

      return { text: cleaned, highlight };
    });
  };

  // Parse benefits with structured formatting
  const parseBenefits = (text: string): { title: string; description: string; amount?: string }[] => {
    if (!text) return [];

    const benefits: { title: string; description: string; amount?: string }[] = [];
    const lines = text.split(/\n/).filter(line => line.trim().length > 5);

    lines.forEach((line, index) => {
      const cleaned = line.trim().replace(/^[-•*\d.)\s]+/, '');
      if (cleaned.length < 10) return;

      // Extract amount if present
      const amountMatch = cleaned.match(/₹[\s]*[\d,]+(?:[\s]*(?:lakh|crore|per\s+(?:month|year|annum)|\/-)?)?/i);

      benefits.push({
        title: `Benefit ${index + 1}`,
        description: cleaned,
        amount: amountMatch ? amountMatch[0] : undefined
      });
    });

    return benefits.slice(0, 6);
  };

  // Parse documents from text
  const parseDocuments = (text: string): string[] => {
    if (!text) return [];
    const lines = text.split(/\n|;|\d+\.\s+/).filter(line => line.trim().length > 5);
    return lines.slice(0, 10).map(line => line.trim().replace(/^[-•*]\s*/, ''));
  };

  // Parse application steps
  const parseApplicationSteps = (text: string): Array<{ step: number; description: string }> => {
    if (!text) return [];
    const lines = text.split(/\n/).filter(line => line.trim().length > 10);
    return lines.slice(0, 8).map((line, index) => {
      const cleaned = line.trim().replace(/^(?:Step\s*)?(\d+)[.:)\-]\s*/i, '');
      return {
        step: index + 1,
        description: cleaned
      };
    });
  };

  // Extract benefit amount
  const extractBenefitAmount = (): string | null => {
    if (!scheme.benefits) return null;
    const match = scheme.benefits.match(/₹[\s]*[\d,]+(?:[\s]*(?:lakh|crore|per\s+(?:month|year|annum)|\/-)?)?/i);
    return match ? match[0] : null;
  };

  // Get highlight badge color
  const getHighlightBadge = (highlight: string | null) => {
    switch (highlight) {
      case "income": return { bg: "bg-emerald-100", text: "text-emerald-700", icon: IndianRupee };
      case "age": return { bg: "bg-blue-100", text: "text-blue-700", icon: Users };
      case "farmer": return { bg: "bg-green-100", text: "text-green-700", icon: Tag };
      case "women": return { bg: "bg-pink-100", text: "text-pink-700", icon: Users };
      case "category": return { bg: "bg-purple-100", text: "text-purple-700", icon: Shield };
      case "location": return { bg: "bg-orange-100", text: "text-orange-700", icon: MapPin };
      case "education": return { bg: "bg-indigo-100", text: "text-indigo-700", icon: FileText };
      default: return null;
    }
  };

  const benefitAmount = extractBenefitAmount();
  const eligibilityCriteria = parseEligibilityCriteria(scheme.eligibility);
  const benefits = parseBenefits(scheme.benefits);
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
            <div className="bg-gradient-to-br from-card to-secondary/30 rounded-2xl p-6 border">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge
                  className={`${scheme.level === "Central"
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-accent/20 text-accent border-accent/30"} text-xs font-medium`}
                >
                  {scheme.level === "Central" ? "🇮🇳 Central Govt" : `📍 ${scheme.state || "State"}`}
                </Badge>
                {scheme.category && (
                  <Badge variant="outline" className="text-xs">
                    {scheme.category.split(",")[0]}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
                {scheme.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full">
                  <Tag className="h-3.5 w-3.5" />
                  {scheme.category?.split(",")[0] || "General"}
                </span>
                <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-full">
                  <MapPin className="h-3.5 w-3.5" />
                  {scheme.level === "Central" ? "All India" : scheme.state || "State Scheme"}
                </span>
                {benefitAmount && (
                  <span className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-full font-medium">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {benefitAmount}
                  </span>
                )}
              </div>
            </div>

            {/* Eligibility Check Card */}
            <Card className={`${eligibilityConfig.bgClass} border-2 ${eligibilityConfig.borderClass} overflow-hidden`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center shrink-0 shadow-sm`}>
                    <EligibilityIcon className={`h-7 w-7 ${eligibilityConfig.textClass}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${eligibilityConfig.textClass} mb-1`}>
                      {eligibilityConfig.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {eligibilityConfig.description}
                    </p>

                    {eligibility ? (
                      <div className="space-y-4">
                        {eligibility.matchedCriteria.length > 0 && (
                          <div className="bg-white/50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-success mb-3 uppercase tracking-wide">
                              ✓ Criteria You Meet
                            </p>
                            <ul className="space-y-2">
                              {eligibility.matchedCriteria.map((criterion, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle2 className="h-3 w-3 text-success" />
                                  </div>
                                  <span className="text-foreground">{criterion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {eligibility.unmatchedCriteria.length > 0 && (
                          <div className="bg-white/50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-destructive mb-3 uppercase tracking-wide">
                              ✗ May Not Match
                            </p>
                            <ul className="space-y-2">
                              {eligibility.unmatchedCriteria.map((criterion, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm">
                                  <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <XCircle className="h-3 w-3 text-destructive" />
                                  </div>
                                  <span className="text-muted-foreground">{criterion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            Match Confidence: <span className="font-semibold text-foreground">{eligibility.confidence}%</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Final eligibility determined by authorities
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleCheckEligibility}
                        disabled={isCheckingEligibility}
                        className="shadow-md"
                      >
                        {isCheckingEligibility && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Check My Eligibility
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Criteria */}
            {eligibilityCriteria.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-secondary/30 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {eligibilityCriteria.map((criterion, index) => {
                      const badge = getHighlightBadge(criterion.highlight);
                      const BadgeIcon = badge?.icon || CheckCircle2;

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 hover:bg-secondary/20 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${badge ? badge.bg : 'bg-secondary'}`}>
                            <BadgeIcon className={`h-4 w-4 ${badge ? badge.text : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{criterion.text}</p>
                            {badge && (
                              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} font-medium`}>
                                {criterion.highlight?.charAt(0).toUpperCase()}{criterion.highlight?.slice(1)} Related
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            #{index + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits Section - Enhanced */}
            {benefits.length > 0 && (
              <Card className="overflow-hidden border-success/20">
                <CardHeader className="bg-gradient-to-r from-success/10 to-success/5 border-b border-success/20">
                  <CardTitle className="text-lg flex items-center gap-2 text-success">
                    <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                      <Gift className="h-4 w-4 text-success" />
                    </div>
                    Key Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 hover:bg-success/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center shrink-0">
                          <Star className="h-5 w-5 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{benefit.description}</p>
                          {benefit.amount && (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-success/10 text-success px-3 py-1 rounded-full text-sm font-semibold">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {benefit.amount}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overview */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  About this Scheme
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {scheme.details || "No detailed description available for this scheme."}
                </p>
              </CardContent>
            </Card>

            {/* Documents Required */}
            {documents.length > 0 && (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    Documents Required
                    <Badge variant="outline" className="ml-auto text-xs">
                      {documents.length} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <Checkbox id={`doc-${index}`} className="data-[state=checked]:bg-success data-[state=checked]:border-success" />
                        <label
                          htmlFor={`doc-${index}`}
                          className="text-sm cursor-pointer flex-1 group-hover:text-foreground transition-colors"
                        >
                          {doc}
                        </label>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Check the documents you already have to track your readiness
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Application Steps */}
            {applicationSteps.length > 0 && (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    How to Apply
                    <Badge variant="outline" className="ml-auto text-xs">
                      {applicationSteps.length} steps
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative">
                    {applicationSteps.map((step, index) => (
                      <div key={step.step} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                            {step.step}
                          </div>
                          {index < applicationSteps.length - 1 && (
                            <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className="text-sm text-foreground leading-relaxed">{step.description}</p>
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
            {/* Quick Summary */}
            <Card className="border-2 border-primary/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Quick Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {benefitAmount && (
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Benefit Amount</p>
                    <p className="text-2xl font-bold text-success">{benefitAmount}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Level</p>
                    <p className="font-semibold text-sm">{scheme.level}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <p className="font-semibold text-sm">{scheme.category?.split(",")[0] || "General"}</p>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link to={`/search?q=${encodeURIComponent(scheme.name)}`}>
                    Find Similar Schemes
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" variant="outline" onClick={handleSaveScheme}>
                <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current text-primary" : ""}`} />
                {isSaved ? "Saved" : "Save Scheme"}
              </Button>

              <Button variant="ghost" className="w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Ask AI Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-7 w-7 text-primary" />
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
                <p className="text-sm font-medium text-foreground mb-3">Related topics</p>
                <div className="flex flex-wrap gap-2">
                  {scheme.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors border border-border/50"
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

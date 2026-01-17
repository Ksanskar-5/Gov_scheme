import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Building, 
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
  ChevronRight
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { mockSchemes } from "@/data/mockSchemes";
import { SchemeDetailSkeleton } from "@/components/ui/skeleton-card";

export default function SchemeDetail() {
  const { id } = useParams<{ id: string }>();
  const scheme = mockSchemes.find((s) => s.id === id);

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

  const getEligibilityConfig = () => {
    switch (scheme.eligibility.status) {
      case "eligible":
        return {
          icon: CheckCircle2,
          label: "Likely Eligible",
          bgClass: "bg-success/10",
          textClass: "text-success",
          borderClass: "border-success/20"
        };
      case "possibly-eligible":
        return {
          icon: AlertCircle,
          label: "Possibly Eligible",
          bgClass: "bg-warning/10",
          textClass: "text-warning",
          borderClass: "border-warning/20"
        };
      case "not-eligible":
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
          label: "Login to Check",
          bgClass: "bg-muted",
          textClass: "text-muted-foreground",
          borderClass: "border-border"
        };
    }
  };

  const eligibility = getEligibilityConfig();
  const EligibilityIcon = eligibility.icon;

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
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {scheme.benefitType}
                </Badge>
                <Badge variant="outline">{scheme.level}</Badge>
                <Badge variant="outline">{scheme.category}</Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {scheme.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {scheme.ministry}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {scheme.level === "Central" ? "All India" : scheme.state}
                </span>
                {scheme.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Deadline: {scheme.deadline}
                  </span>
                )}
              </div>
            </div>

            {/* Eligibility Snapshot */}
            <Card className={`${eligibility.bgClass} border ${eligibility.borderClass}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${eligibility.bgClass} flex items-center justify-center shrink-0`}>
                    <EligibilityIcon className={`h-6 w-6 ${eligibility.textClass}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${eligibility.textClass} mb-2`}>
                      {eligibility.label}
                    </h3>
                    {scheme.eligibility.reasons && scheme.eligibility.reasons.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {scheme.eligibility.reasons[0]}
                      </p>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Eligibility criteria:</p>
                      <ul className="space-y-1">
                        {scheme.eligibility.criteria.map((criterion, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span>{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About this Scheme</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {scheme.fullDescription}
                </p>
              </CardContent>
            </Card>

            {/* Documents Required */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheme.documentsRequired.map((doc, index) => (
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

            {/* Application Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Apply</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheme.applicationSteps.map((step, index) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {step.step}
                        </div>
                        {index < scheme.applicationSteps.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{step.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {step.mode}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Benefits Card */}
            <Card className="border-success/20">
              <CardHeader className="bg-success/5">
                <CardTitle className="text-lg text-success">Benefits</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {scheme.benefitAmount && (
                  <div className="text-center p-4 rounded-lg bg-success/5 mb-4">
                    <p className="text-2xl font-bold text-success">{scheme.benefitAmount}</p>
                    <p className="text-sm text-muted-foreground">{scheme.benefitType}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {scheme.shortDescription}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {scheme.applicationUrl && (
                <Button asChild className="w-full bg-accent hover:bg-accent/90">
                  <a href={scheme.applicationUrl} target="_blank" rel="noopener noreferrer">
                    Apply Now
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                <Bookmark className="h-4 w-4 mr-2" />
                Save Scheme
              </Button>
              
              <Button variant="ghost" className="w-full">
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
          </div>
        </div>
      </div>
    </Layout>
  );
}

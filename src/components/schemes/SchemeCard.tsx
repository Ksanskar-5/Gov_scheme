import { Link } from "react-router-dom";
import { ArrowRight, Building, MapPin, CheckCircle2, AlertCircle, XCircle, HelpCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Scheme, SchemeWithScore, EligibilityStatus } from "@/lib/api";

interface SchemeCardProps {
  scheme: Scheme | SchemeWithScore;
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  // Check if this is a SchemeWithScore
  const schemeWithScore = scheme as SchemeWithScore;
  const eligibilityStatus = schemeWithScore.eligibilityStatus;

  const getEligibilityBadge = () => {
    switch (eligibilityStatus) {
      case "eligible":
        return (
          <span className="badge-eligible">
            <CheckCircle2 className="h-3 w-3" />
            Likely Eligible
          </span>
        );
      case "possibly_eligible":
        return (
          <span className="badge-possibly-eligible">
            <AlertCircle className="h-3 w-3" />
            Check Eligibility
          </span>
        );
      case "not_eligible":
        return (
          <span className="badge-not-eligible">
            <XCircle className="h-3 w-3" />
            Not Eligible
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <HelpCircle className="h-3 w-3" />
            Login to Check
          </span>
        );
    }
  };

  const getLevelColor = () => {
    return scheme.level === "Central"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-accent/10 text-accent border-accent/20";
  };

  // Extract benefit amount from benefits text (look for ₹ symbol)
  const extractBenefitAmount = (benefits: string): string | null => {
    if (!benefits) return null;
    const match = benefits.match(/₹[\s]*[\d,]+(?:[\s]*(?:lakh|crore|per\s+(?:month|year|annum)|\/-))?/i);
    return match ? match[0] : null;
  };

  const benefitAmount = extractBenefitAmount(scheme.benefits);

  // Get short description (first sentence or first 150 chars)
  const getShortDescription = () => {
    if (!scheme.details) return scheme.benefits?.substring(0, 150) || "";
    const firstSentence = scheme.details.split(/[.!?]/)[0];
    if (firstSentence.length < 200) return firstSentence;
    return scheme.details.substring(0, 150) + "...";
  };

  // Get category display
  const getCategoryDisplay = () => {
    if (!scheme.category) return "General";
    // Handle multiple categories separated by comma
    const firstCategory = scheme.category.split(",")[0].trim();
    return firstCategory.length > 30 ? firstCategory.substring(0, 27) + "..." : firstCategory;
  };

  return (
    <Card className="card-hover h-full flex flex-col bg-card border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className={getLevelColor()}>
                {scheme.level}
              </Badge>
              {eligibilityStatus && getEligibilityBadge()}
            </div>
            <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
              {scheme.name}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {getShortDescription()}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4 shrink-0" />
            <span className="truncate">{getCategoryDisplay()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{scheme.level === "Central" ? "All India" : scheme.state || "State Scheme"}</span>
          </div>
        </div>

        {benefitAmount && (
          <div className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20">
            <p className="text-xs text-muted-foreground">Benefit</p>
            <p className="font-semibold text-success">{benefitAmount}</p>
          </div>
        )}

        {/* Show tags */}
        {scheme.tags && scheme.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {scheme.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {scheme.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{scheme.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full group">
          <Link to={`/scheme/${scheme.slug}`}>
            View Details
            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

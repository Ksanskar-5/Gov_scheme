import { Link } from "react-router-dom";
import { ArrowRight, Building, MapPin, CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Scheme } from "@/data/mockSchemes";

interface SchemeCardProps {
  scheme: Scheme;
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  const getEligibilityBadge = () => {
    switch (scheme.eligibility.status) {
      case "eligible":
        return (
          <span className="badge-eligible">
            <CheckCircle2 className="h-3 w-3" />
            Likely Eligible
          </span>
        );
      case "possibly-eligible":
        return (
          <span className="badge-possibly-eligible">
            <AlertCircle className="h-3 w-3" />
            Check Eligibility
          </span>
        );
      case "not-eligible":
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

  const getBenefitTypeColor = () => {
    switch (scheme.benefitType) {
      case "Grant":
        return "bg-success/10 text-success border-success/20";
      case "Subsidy":
        return "bg-info/10 text-info border-info/20";
      case "Loan":
        return "bg-warning/10 text-warning border-warning/20";
      case "Training":
        return "bg-accent/10 text-accent border-accent/20";
      case "Insurance":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="card-hover h-full flex flex-col bg-card border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className={getBenefitTypeColor()}>
                {scheme.benefitType}
              </Badge>
              {getEligibilityBadge()}
            </div>
            <h3 className="font-semibold text-foreground text-lg leading-tight">
              {scheme.name}
            </h3>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {scheme.shortDescription}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4 shrink-0" />
            <span className="truncate">{scheme.ministry}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{scheme.level === "Central" ? "All India" : scheme.state}</span>
          </div>
        </div>

        {scheme.benefitAmount && (
          <div className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20">
            <p className="text-xs text-muted-foreground">Benefit</p>
            <p className="font-semibold text-success">{scheme.benefitAmount}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full group">
          <Link to={`/scheme/${scheme.id}`}>
            View Details
            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SchemeCard } from "@/components/schemes/SchemeCard";
import { SchemeFilters } from "@/components/schemes/SchemeFilters";
import { SchemeCardSkeleton } from "@/components/ui/skeleton-card";
import { mockSchemes } from "@/data/mockSchemes";
import { FileSearch, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function SearchSchemes() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All Categories";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState("All India");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedBenefitType, setSelectedBenefitType] = useState("All Types");
  const [isLoading, setIsLoading] = useState(false);

  const hasActiveFilters = 
    searchQuery !== "" || 
    selectedCategory !== "All Categories" || 
    selectedState !== "All India" || 
    selectedLevel !== "all" || 
    selectedBenefitType !== "All Types";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
    setSelectedState("All India");
    setSelectedLevel("all");
    setSelectedBenefitType("All Types");
  };

  const filteredSchemes = useMemo(() => {
    return mockSchemes.filter((scheme) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          scheme.name.toLowerCase().includes(query) ||
          scheme.shortDescription.toLowerCase().includes(query) ||
          scheme.fullDescription.toLowerCase().includes(query) ||
          scheme.tags.some(tag => tag.toLowerCase().includes(query)) ||
          scheme.category.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== "All Categories" && scheme.category !== selectedCategory) {
        return false;
      }

      // Level filter
      if (selectedLevel !== "all" && scheme.level !== selectedLevel) {
        return false;
      }

      // Benefit type filter
      if (selectedBenefitType !== "All Types" && scheme.benefitType !== selectedBenefitType) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedState, selectedLevel, selectedBenefitType]);

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Browse Government Schemes
          </h1>
          <p className="text-muted-foreground">
            Explore 1000+ central and state government schemes. Login for personalized recommendations.
          </p>
        </div>

        {/* Filters */}
        <SchemeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          selectedBenefitType={selectedBenefitType}
          onBenefitTypeChange={setSelectedBenefitType}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Login Prompt */}
        <div className="mt-6 p-4 rounded-lg bg-info/5 border border-info/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <LogIn className="h-5 w-5 text-info mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Want personalized results?</p>
              <p className="text-sm text-muted-foreground">Login to see schemes ranked by your eligibility</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Login</Link>
          </Button>
        </div>

        {/* Results Count */}
        <div className="mt-6 mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredSchemes.length}</span> schemes
            {hasActiveFilters && " matching your filters"}
          </p>
        </div>

        {/* Scheme Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SchemeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No schemes found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Try adjusting your filters or search with different keywords. You can also try our AI chatbot for help.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SchemeCard } from "@/components/schemes/SchemeCard";
import { SchemeCardSkeleton } from "@/components/ui/skeleton-card";
import { FileSearch, LogIn, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import {
  searchSchemes,
  smartSearch,
  getSchemeFilters,
  getSchemeStats,
  type Scheme,
  type SchemeWithScore
} from "@/lib/api";

export default function SearchSchemes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [schemes, setSchemes] = useState<(Scheme | SchemeWithScore)[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [useSmartSearch, setUseSmartSearch] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<string | null>(null);

  // Filter options from API
  const [categories, setCategories] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total: number; central: number; state: number } | null>(null);

  // Load filter options
  useEffect(() => {
    async function loadFilters() {
      const [filtersRes, statsRes] = await Promise.all([
        getSchemeFilters(),
        getSchemeStats()
      ]);

      if (filtersRes.success && filtersRes.data) {
        setCategories(filtersRes.data.categories);
        setStates(filtersRes.data.states);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    }

    loadFilters();
  }, []);

  // Search schemes
  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setParsedIntent(null);

    try {
      // Use smart search if query looks like natural language
      const isNaturalLanguage = searchQuery.split(" ").length > 3 ||
        /my|for|who|what|how|help|died|death|lost|need/i.test(searchQuery);

      if (searchQuery && isNaturalLanguage && useSmartSearch) {
        const result = await smartSearch(searchQuery, undefined, page, 20);
        if (result.success && result.data) {
          setSchemes(result.data.schemes);
          setTotalPages(result.data.totalPages);
          setTotalSchemes(result.data.total);
          if (result.data.parsedIntent) {
            setParsedIntent(result.data.parsedIntent.intent.replace(/_/g, " "));
          }
        }
      } else {
        // Regular search with filters
        const result = await searchSchemes({
          query: searchQuery || undefined,
          category: selectedCategory || undefined,
          state: selectedState || undefined,
          level: selectedLevel === "all" ? undefined : selectedLevel as "Central" | "State",
          page,
          limit: 20,
        });

        if (result.success && result.data) {
          setSchemes(result.data);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotalSchemes(result.pagination?.total || result.data.length);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedState, selectedLevel, page, useSmartSearch]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, setSearchParams]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "" ||
    selectedState !== "" ||
    selectedLevel !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedState("");
    setSelectedLevel("all");
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    performSearch();
  };

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Browse Government Schemes
          </h1>
          <p className="text-muted-foreground">
            Explore {stats?.total?.toLocaleString() || "3,400"}+ central and state government schemes.
            {" "}
            <span className="text-primary">{stats?.central} Central</span> |
            {" "}
            <span className="text-accent">{stats?.state} State</span> schemes available.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="search"
                placeholder="Search schemes... Try 'education loans for students' or 'farmer subsidies'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-20"
              />
            </div>
            <Button type="submit" className="shrink-0">
              Search
            </Button>
          </div>

          {/* Smart Search Toggle */}
          <div className="mt-2 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={useSmartSearch}
                onChange={(e) => setUseSmartSearch(e.target.checked)}
                className="rounded border-border"
              />
              <Sparkles className="h-4 w-4 text-accent" />
              AI-powered natural language search
            </label>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedState} onValueChange={(v) => { setSelectedState(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={(v) => { setSelectedLevel(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Central">Central</SelectItem>
              <SelectItem value="State">State</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Parsed Intent Display */}
        {parsedIntent && (
          <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-accent flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Understanding your query as: <strong className="capitalize">{parsedIntent}</strong>
            </p>
          </div>
        )}

        {/* Login Prompt */}
        <div className="mb-6 p-4 rounded-lg bg-info/5 border border-info/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <LogIn className="h-5 w-5 text-info mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Want personalized results?</p>
              <p className="text-sm text-muted-foreground">Login to see schemes ranked by your eligibility</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/profile">Complete Profile</Link>
          </Button>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{schemes.length}</span> of{" "}
            <span className="font-medium text-foreground">{totalSchemes.toLocaleString()}</span> schemes
            {hasActiveFilters && " matching your filters"}
          </p>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
        </div>

        {/* Scheme Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SchemeCardSkeleton key={i} />
            ))}
          </div>
        ) : schemes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((scheme) => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
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

import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, states, benefitTypes } from "@/data/mockSchemes";

interface SchemeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedState: string;
  onStateChange: (value: string) => void;
  selectedLevel: string;
  onLevelChange: (value: string) => void;
  selectedBenefitType: string;
  onBenefitTypeChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function SchemeFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedState,
  onStateChange,
  selectedLevel,
  onLevelChange,
  selectedBenefitType,
  onBenefitTypeChange,
  onClearFilters,
  hasActiveFilters
}: SchemeFiltersProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search in simple words like 'farmer loan' or 'education for daughter'..."
          className="pl-11 pr-4 h-12 text-base bg-secondary border-0"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search government schemes"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter by:</span>
        </div>

        <Select value={selectedState} onValueChange={onStateChange}>
          <SelectTrigger className="w-[140px] sm:w-[160px]" aria-label="Filter by state">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLevel} onValueChange={onLevelChange}>
          <SelectTrigger className="w-[130px]" aria-label="Filter by scheme level">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Central">Central</SelectItem>
            <SelectItem value="State">State</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[140px] sm:w-[160px]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBenefitType} onValueChange={onBenefitTypeChange}>
          <SelectTrigger className="w-[130px]" aria-label="Filter by benefit type">
            <SelectValue placeholder="Benefit Type" />
          </SelectTrigger>
          <SelectContent>
            {benefitTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Example queries */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Try:</span>
        {["farmer subsidies", "women entrepreneur", "education loan", "health insurance"].map((query) => (
          <button
            key={query}
            onClick={() => onSearchChange(query)}
            className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MapPin,
  Code,
  Briefcase,
  Star,
  GitFork,
  Clock,
  Building,
  ChevronDown,
  SlidersHorizontal,
  X,
  RotateCcw,
  AlertCircle,
  Shield,
} from "lucide-react";

export interface SearchFilters {
  location: string | null;
  language: string | null;
  experienceLevel: string | null;
  minRepos: number;
  minStars: number;
  activityDays: number | null;
  hireable: boolean | null;
  yearsOfExperience: [number, number];
  companyType: string | null;
  employmentType: string | null;
  requiredSkills: string[];
}

export const DEFAULT_FILTERS: SearchFilters = {
  location: null,
  language: null,
  experienceLevel: null,
  minRepos: 0,
  minStars: 0,
  activityDays: null,
  hireable: null,
  yearsOfExperience: [0, 20],
  companyType: null,
  employmentType: null,
  requiredSkills: [],
};

const LOCATIONS = [
  { value: "copenhagen", label: "Copenhagen" },
  { value: "london", label: "London" },
  { value: "berlin", label: "Berlin" },
  { value: "amsterdam", label: "Amsterdam" },
  { value: "new york", label: "New York" },
  { value: "san francisco", label: "San Francisco" },
  { value: "stockholm", label: "Stockholm" },
  { value: "oslo", label: "Oslo" },
  { value: "helsinki", label: "Helsinki" },
  { value: "paris", label: "Paris" },
  { value: "munich", label: "Munich" },
  { value: "zurich", label: "Zurich" },
  { value: "remote", label: "Remote" },
];

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (0-2 yrs)" },
  { value: "mid", label: "Mid (3-5 yrs)" },
  { value: "senior", label: "Senior (5-10 yrs)" },
  { value: "lead", label: "Lead/Staff (10+ yrs)" },
];

const ACTIVITY_OPTIONS = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last year" },
];

const COMPANY_TYPES = [
  { value: "startup", label: "Startup" },
  { value: "scaleup", label: "Scale-up" },
  { value: "enterprise", label: "Enterprise" },
  { value: "faang", label: "FAANG/Big Tech" },
  { value: "agency", label: "Agency" },
  { value: "freelance", label: "Freelance" },
];

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "part-time", label: "Part-time" },
];

export interface AvailableFilters {
  locations: string[];
  languages: string[];
  companies: string[];
  maxRepos: number;
  maxStars: number;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  resultCount?: number;
  mode?: "desktop" | "mobile" | "both";
  availableFilters?: AvailableFilters;
}

interface OpenSections {
  location: boolean;
  language: boolean;
  experience: boolean;
  github: boolean;
  company: boolean;
}

interface FilterContentProps {
  filters: SearchFilters;
  openSections: OpenSections;
  setOpenSections: React.Dispatch<React.SetStateAction<OpenSections>>;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  availableFilters?: AvailableFilters;
}

const FilterContent = ({
  filters,
  openSections,
  setOpenSections,
  updateFilter,
  resetFilters,
  activeFilterCount,
  availableFilters,
}: FilterContentProps) => (
  <div className="space-y-4">
    {/* Hard Requirements Section */}
    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-red-500" />
        <h4 className="font-semibold text-sm text-red-400">Hard Requirements</h4>
        <AlertCircle className="w-3 h-3 text-red-400/70" />
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Candidates must match ALL hard requirements to appear in results
      </p>
      
      {/* Employment Type */}
      <div className="mb-3">
        <Label className="text-xs text-muted-foreground mb-2 block">
          Employment Type
        </Label>
        <div className="flex flex-wrap gap-2">
          {EMPLOYMENT_TYPES.map((type) => (
            <Badge
              key={type.value}
              variant={filters.employmentType === type.value ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                filters.employmentType === type.value
                  ? "bg-red-500 hover:bg-red-600"
                  : "hover:bg-red-500/10"
              }`}
              onClick={() =>
                updateFilter(
                  "employmentType",
                  filters.employmentType === type.value ? null : type.value
                )
              }
            >
              {type.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Min Years Experience */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">
            Minimum Years Experience
          </Label>
          <span className="text-xs font-medium text-red-400">
            {filters.yearsOfExperience[0]}+ years
          </span>
        </div>
        <Slider
          value={[filters.yearsOfExperience[0]]}
          onValueChange={([value]) =>
            updateFilter("yearsOfExperience", [value, filters.yearsOfExperience[1]])
          }
          min={0}
          max={15}
          step={1}
          className="w-full"
        />
      </div>
    </div>

    {/* Active filters summary */}
    {activeFilterCount > 0 && (
      <div className="flex items-center justify-between pb-3 border-b">
        <span className="text-sm text-muted-foreground">
          {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 px-2 text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset all
        </Button>
      </div>
    )}

    {/* Location Filter */}
    <Collapsible
      open={openSections.location}
      onOpenChange={(open) =>
        setOpenSections({ ...openSections, location: open })
      }
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Location
          {filters.location && (
            <Badge variant="secondary" className="text-xs">
              1
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            openSections.location ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4">
        {(() => {
          const locs = availableFilters && availableFilters.locations.length > 0
            ? availableFilters.locations
            : LOCATIONS.map((l) => l.label);
          return (
            <div className="flex flex-wrap gap-2">
              {locs.slice(0, 12).map((loc) => (
                <Badge
                  key={loc}
                  variant={filters.location === loc.toLowerCase() ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() =>
                    updateFilter(
                      "location",
                      filters.location === loc.toLowerCase() ? null : loc.toLowerCase()
                    )
                  }
                >
                  {loc}
                </Badge>
              ))}
              {locs.length > 12 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{locs.length - 12} more
                </Badge>
              )}
            </div>
          );
        })()}
      </CollapsibleContent>
    </Collapsible>

    {/* Language Filter */}
    <Collapsible
      open={openSections.language}
      onOpenChange={(open) =>
        setOpenSections({ ...openSections, language: open })
      }
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          Programming Language
          {filters.language && (
            <Badge variant="secondary" className="text-xs">
              1
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            openSections.language ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4">
        {(() => {
          const langs = availableFilters && availableFilters.languages.length > 0
            ? availableFilters.languages
            : LANGUAGES.map((l) => l.label);
          return (
            <div className="flex flex-wrap gap-2">
              {langs.slice(0, 12).map((lang) => (
                <Badge
                  key={lang}
                  variant={filters.language === lang.toLowerCase() ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() =>
                    updateFilter(
                      "language",
                      filters.language === lang.toLowerCase() ? null : lang.toLowerCase()
                    )
                  }
                >
                  {lang}
                </Badge>
              ))}
              {langs.length > 12 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{langs.length - 12} more
                </Badge>
              )}
            </div>
          );
        })()}
      </CollapsibleContent>
    </Collapsible>

    {/* Experience Level Filter */}
    <Collapsible
      open={openSections.experience}
      onOpenChange={(open) =>
        setOpenSections({ ...openSections, experience: open })
      }
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Experience Level
          {filters.experienceLevel && (
            <Badge variant="secondary" className="text-xs">
              1
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            openSections.experience ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4">
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <div
              key={level.value}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                filters.experienceLevel === level.value
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted"
              }`}
              onClick={() =>
                updateFilter(
                  "experienceLevel",
                  filters.experienceLevel === level.value ? null : level.value
                )
              }
            >
              <span className="text-sm">{level.label}</span>
              {filters.experienceLevel === level.value && (
                <X className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Years slider */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground">
              Years of Experience
            </Label>
            <span className="text-xs font-medium">
              {filters.yearsOfExperience[0]} - {filters.yearsOfExperience[1]}+ yrs
            </span>
          </div>
          <Slider
            value={filters.yearsOfExperience}
            onValueChange={(value) =>
              updateFilter("yearsOfExperience", value as [number, number])
            }
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>

    {/* GitHub Filters */}
    <Collapsible
      open={openSections.github}
      onOpenChange={(open) =>
        setOpenSections({ ...openSections, github: open })
      }
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-muted-foreground" />
          GitHub Activity
          {(filters.minRepos > 0 ||
            filters.minStars > 0 ||
            filters.activityDays ||
            filters.hireable) && (
            <Badge variant="secondary" className="text-xs">
              {[
                filters.minRepos > 0,
                filters.minStars > 0,
                filters.activityDays,
                filters.hireable,
              ].filter(Boolean).length}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            openSections.github ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4 space-y-4">
        {/* Min Repos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              Min Repositories
            </Label>
            <span className="text-xs font-medium">{filters.minRepos}+</span>
          </div>
          <Slider
            value={[filters.minRepos]}
            onValueChange={([value]) => updateFilter("minRepos", value)}
            min={0}
            max={50}
            step={5}
            className="w-full"
          />
        </div>

        {/* Min Stars */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="w-3 h-3" />
              Min Total Stars
            </Label>
            <span className="text-xs font-medium">{filters.minStars}+</span>
          </div>
          <Slider
            value={[filters.minStars]}
            onValueChange={([value]) => updateFilter("minStars", value)}
            min={0}
            max={500}
            step={10}
            className="w-full"
          />
        </div>

        {/* Activity */}
        <div>
          <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <Clock className="w-3 h-3" />
            Last Active
          </Label>
          <Select
            value={filters.activityDays?.toString() || "any"}
            onValueChange={(value) =>
              updateFilter("activityDays", value === "any" ? null : parseInt(value))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any time</SelectItem>
              {ACTIVITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hireable */}
        <div className="flex items-center justify-between">
          <Label className="text-sm">Open to work only</Label>
          <Switch
            checked={filters.hireable || false}
            onCheckedChange={(checked) =>
              updateFilter("hireable", checked || null)
            }
          />
        </div>
      </CollapsibleContent>
    </Collapsible>

    {/* Company Type Filter */}
    <Collapsible
      open={openSections.company}
      onOpenChange={(open) =>
        setOpenSections({ ...openSections, company: open })
      }
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-muted-foreground" />
          Company Type
          {filters.companyType && (
            <Badge variant="secondary" className="text-xs">
              1
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            openSections.company ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4">
        <div className="flex flex-wrap gap-2">
          {COMPANY_TYPES.map((type) => (
            <Badge
              key={type.value}
              variant={filters.companyType === type.value ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() =>
                updateFilter(
                  "companyType",
                  filters.companyType === type.value ? null : type.value
                )
              }
            >
              {type.label}
            </Badge>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
);

export function SearchFiltersPanel({
  filters,
  onFiltersChange,
  resultCount,
  mode = "both",
  availableFilters,
}: SearchFiltersProps) {
  const [openSections, setOpenSections] = useState<OpenSections>({
    location: true,
    language: true,
    experience: true,
    github: false,
    company: false,
  });

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "yearsOfExperience") {
      return value[0] !== 0 || value[1] !== 20;
    }
    if (key === "minRepos" || key === "minStars") {
      return value > 0;
    }
    return value !== null && value !== false;
  }).length;

  return (
    <>
      {/* Desktop Filter Panel */}
      {(mode === "desktop" || mode === "both") && (
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </h3>
              {resultCount !== undefined && (
                <Badge variant="outline">{resultCount} results</Badge>
              )}
            </div>
            <FilterContent
              filters={filters}
              openSections={openSections}
              setOpenSections={setOpenSections}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              activeFilterCount={activeFilterCount}
              availableFilters={availableFilters}
            />
          </div>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      {(mode === "mobile" || mode === "both") && (
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {resultCount !== undefined && (
                    <Badge variant="outline" className="ml-auto">
                      {resultCount} results
                    </Badge>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent
                  filters={filters}
                  openSections={openSections}
                  setOpenSections={setOpenSections}
                  updateFilter={updateFilter}
                  resetFilters={resetFilters}
                  activeFilterCount={activeFilterCount}
                  availableFilters={availableFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
}

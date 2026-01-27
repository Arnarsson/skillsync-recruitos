"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
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
  GitFork,
  ChevronDown,
  SlidersHorizontal,
  X,
  RotateCcw,
  Shield,
  Sparkles,
  Save,
  Trash2,
  Star,
  Wrench,
  Users,
  AlertTriangle,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type RequirementLevel = "must_have" | "nice_to_have";

export interface HardRequirement {
  id: string;
  type: "language" | "framework" | "skill" | "location" | "min_experience" | "min_contributions" | "min_repos" | "min_stars";
  value: string;
  level: RequirementLevel;
}

export interface HardRequirementFilters {
  requirements: HardRequirement[];
  minYearsExperience: number;
  minGitHubContributions: number;
  minRepos: number;
  minStars: number;
  locationRequired: string | null;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: HardRequirementFilters;
  createdAt: string;
}

export const DEFAULT_HARD_FILTERS: HardRequirementFilters = {
  requirements: [],
  minYearsExperience: 0,
  minGitHubContributions: 0,
  minRepos: 0,
  minStars: 0,
  locationRequired: null,
};

// ──────────────────────────────────────────────
// Predefined options
// ──────────────────────────────────────────────

const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#",
  "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
  "Elixir", "Haskell", "Clojure", "Dart", "R", "Lua",
];

const FRAMEWORKS = [
  "React", "Next.js", "Vue", "Angular", "Svelte", "Node.js",
  "Express", "Django", "Flask", "FastAPI", "Spring Boot",
  "Rails", "Laravel", ".NET", "TensorFlow", "PyTorch",
  "Kubernetes", "Docker", "AWS", "GCP", "Azure", "Terraform",
  "GraphQL", "PostgreSQL", "MongoDB", "Redis", "Kafka",
];

const SKILLS = [
  "Machine Learning", "DevOps", "System Design", "Microservices",
  "CI/CD", "API Design", "Security", "Performance Optimization",
  "Mobile Development", "Data Engineering", "Blockchain",
  "Computer Vision", "NLP", "Cloud Architecture", "Testing",
  "Agile", "Technical Leadership",
];

const LOCATIONS = [
  "Copenhagen", "London", "Berlin", "Amsterdam", "New York",
  "San Francisco", "Stockholm", "Oslo", "Helsinki", "Paris",
  "Munich", "Zurich", "Singapore", "Toronto", "Sydney",
  "Remote",
];

// ──────────────────────────────────────────────
// Preset storage
// ──────────────────────────────────────────────

function loadPresets(): FilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("recruitos_filter_presets");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePresetsToStorage(presets: FilterPreset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("recruitos_filter_presets", JSON.stringify(presets));
}

// ──────────────────────────────────────────────
// Developer interface for filtering
// ──────────────────────────────────────────────

export interface FilterableDeveloper {
  username: string;
  name: string;
  skills: string[];
  location: string;
  repos: number;
  stars: number;
  followers: number;
  score: number;
  [key: string]: unknown;
}

/**
 * Client-side filtering function.
 * Returns { passed, filtered } arrays.
 */
export function applyHardFilters(
  developers: FilterableDeveloper[],
  filters: HardRequirementFilters
): { passed: FilterableDeveloper[]; filtered: FilterableDeveloper[]; matchCounts: Record<string, number> } {
  const matchCounts: Record<string, number> = {};

  const mustHaveReqs = filters.requirements.filter((r) => r.level === "must_have");
  const niceToHaveReqs = filters.requirements.filter((r) => r.level === "nice_to_have");

  // Count matches per requirement
  for (const req of filters.requirements) {
    matchCounts[req.id] = developers.filter((dev) => matchesRequirement(dev, req)).length;
  }

  const passed: FilterableDeveloper[] = [];
  const filtered: FilterableDeveloper[] = [];

  for (const dev of developers) {
    let pass = true;

    // Must-have requirements: ALL must match
    for (const req of mustHaveReqs) {
      if (!matchesRequirement(dev, req)) {
        pass = false;
        break;
      }
    }

    // Numeric filters
    if (filters.minRepos > 0 && dev.repos < filters.minRepos) pass = false;
    if (filters.minStars > 0 && dev.stars < filters.minStars) pass = false;

    // Location filter
    if (filters.locationRequired) {
      const loc = dev.location?.toLowerCase() || "";
      if (!loc.includes(filters.locationRequired.toLowerCase())) pass = false;
    }

    if (pass) {
      passed.push(dev);
    } else {
      filtered.push(dev);
    }
  }

  return { passed, filtered, matchCounts };
}

function matchesRequirement(dev: FilterableDeveloper, req: HardRequirement): boolean {
  const skillsLower = dev.skills.map((s) => s.toLowerCase());
  const val = req.value.toLowerCase();

  switch (req.type) {
    case "language":
    case "framework":
    case "skill":
      return skillsLower.some((s) => s.includes(val) || val.includes(s));
    case "location":
      return (dev.location || "").toLowerCase().includes(val);
    case "min_repos":
      return dev.repos >= parseInt(req.value, 10);
    case "min_stars":
      return dev.stars >= parseInt(req.value, 10);
    default:
      return true;
  }
}

// ──────────────────────────────────────────────
// Requirement Chip
// ──────────────────────────────────────────────

function RequirementChip({
  req,
  matchCount,
  totalCount,
  onRemove,
  onToggleLevel,
}: {
  req: HardRequirement;
  matchCount?: number;
  totalCount?: number;
  onRemove: () => void;
  onToggleLevel: () => void;
}) {
  const isMustHave = req.level === "must_have";

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        transition-all cursor-default group
        ${isMustHave
          ? "bg-red-500/15 text-red-400 border border-red-500/30"
          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
        }
      `}
    >
      {isMustHave ? (
        <Shield className="w-3 h-3 shrink-0" />
      ) : (
        <Sparkles className="w-3 h-3 shrink-0" />
      )}
      <span className="capitalize">{req.value}</span>

      {matchCount !== undefined && totalCount !== undefined && totalCount > 0 && (
        <span className="text-[10px] opacity-60">
          ({matchCount}/{totalCount})
        </span>
      )}

      {/* Toggle level */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLevel(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
        title={isMustHave ? "Change to Nice to have" : "Change to Must have"}
      >
        {isMustHave ? (
          <Sparkles className="w-3 h-3 text-amber-400" />
        ) : (
          <Shield className="w-3 h-3 text-red-400" />
        )}
      </button>

      {/* Remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Filter Section
// ──────────────────────────────────────────────

function FilterSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  badgeCount,
  children,
}: {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  badgeCount?: number;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 text-sm font-medium hover:text-foreground transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
          {badgeCount !== undefined && badgeCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {badgeCount}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ──────────────────────────────────────────────
// Chip Picker
// ──────────────────────────────────────────────

function ChipPicker({
  items,
  selectedItems,
  type,
  onAdd,
}: {
  items: string[];
  selectedItems: HardRequirement[];
  type: HardRequirement["type"];
  onAdd: (value: string, type: HardRequirement["type"], level: RequirementLevel) => void;
}) {
  const [search, setSearch] = useState("");
  const selectedValues = selectedItems.filter((r) => r.type === type).map((r) => r.value.toLowerCase());

  const filtered = search
    ? items.filter((item) =>
        item.toLowerCase().includes(search.toLowerCase()) &&
        !selectedValues.includes(item.toLowerCase())
      )
    : items.filter((item) => !selectedValues.includes(item.toLowerCase()));

  return (
    <div className="space-y-2">
      <Input
        placeholder={`Search...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {filtered.slice(0, 15).map((item) => (
          <button
            key={item}
            onClick={() => onAdd(item, type, "must_have")}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs
              bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary
              border border-transparent hover:border-primary/30 transition-all"
          >
            {item}
          </button>
        ))}
        {filtered.length > 15 && (
          <span className="text-[10px] text-muted-foreground py-0.5 px-2">
            +{filtered.length - 15} more
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
        <Shield className="w-3 h-3 text-red-400" />
        <span>Click to add as Must have. Toggle level on chips.</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Filter Panel Content
// ──────────────────────────────────────────────

interface FilterPanelContentProps {
  filters: HardRequirementFilters;
  onFiltersChange: (filters: HardRequirementFilters) => void;
  totalCandidates: number;
  matchedCandidates: number;
  matchCounts: Record<string, number>;
}

function FilterPanelContent({
  filters,
  onFiltersChange,
  totalCandidates,
  matchedCandidates,
  matchCounts,
}: FilterPanelContentProps) {
  const [presets, setPresets] = useState<FilterPreset[]>(loadPresets);
  const [presetName, setPresetName] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  const [openSections, setOpenSections] = useState({
    languages: true,
    frameworks: true,
    skills: false,
    location: false,
    github: false,
    presets: false,
  });

  const addRequirement = useCallback(
    (value: string, type: HardRequirement["type"], level: RequirementLevel) => {
      const id = `${type}-${value.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      const updated = {
        ...filters,
        requirements: [
          ...filters.requirements,
          { id, type, value, level },
        ],
      };
      onFiltersChange(updated);
    },
    [filters, onFiltersChange]
  );

  const removeRequirement = useCallback(
    (id: string) => {
      onFiltersChange({
        ...filters,
        requirements: filters.requirements.filter((r) => r.id !== id),
      });
    },
    [filters, onFiltersChange]
  );

  const toggleLevel = useCallback(
    (id: string) => {
      onFiltersChange({
        ...filters,
        requirements: filters.requirements.map((r) =>
          r.id === id
            ? { ...r, level: r.level === "must_have" ? "nice_to_have" : "must_have" }
            : r
        ),
      });
    },
    [filters, onFiltersChange]
  );

  const resetFilters = () => onFiltersChange(DEFAULT_HARD_FILTERS);

  const mustHaveCount = filters.requirements.filter((r) => r.level === "must_have").length;
  const niceToHaveCount = filters.requirements.filter((r) => r.level === "nice_to_have").length;
  const totalActive = mustHaveCount + niceToHaveCount + 
    (filters.minRepos > 0 ? 1 : 0) + 
    (filters.minStars > 0 ? 1 : 0) + 
    (filters.locationRequired ? 1 : 0);
  const filteredOut = totalCandidates - matchedCandidates;

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresetsToStorage(updated);
    setPresetName("");
  };

  const loadPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePresetsToStorage(updated);
  };

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      {totalActive > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium">{matchedCandidates}</span>
              <span className="text-muted-foreground">of {totalCandidates} match</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>

          {filteredOut > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {filteredOut} candidate{filteredOut !== 1 ? "s" : ""} filtered out
            </div>
          )}

          {/* Active requirement chips */}
          <div className="flex flex-wrap gap-1.5">
            {filters.requirements.map((req) => (
              <RequirementChip
                key={req.id}
                req={req}
                matchCount={matchCounts[req.id]}
                totalCount={totalCandidates}
                onRemove={() => removeRequirement(req.id)}
                onToggleLevel={() => toggleLevel(req.id)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-red-400" />
              Must have ({mustHaveCount})
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Nice to have ({niceToHaveCount})
            </div>
          </div>
        </div>
      )}

      {/* Programming Languages */}
      <FilterSection
        title="Languages"
        icon={Code}
        isOpen={openSections.languages}
        onToggle={() => setOpenSections((s) => ({ ...s, languages: !s.languages }))}
        badgeCount={filters.requirements.filter((r) => r.type === "language").length}
      >
        <ChipPicker
          items={LANGUAGES}
          selectedItems={filters.requirements}
          type="language"
          onAdd={addRequirement}
        />
      </FilterSection>

      {/* Frameworks & Tools */}
      <FilterSection
        title="Frameworks & Tools"
        icon={Wrench}
        isOpen={openSections.frameworks}
        onToggle={() => setOpenSections((s) => ({ ...s, frameworks: !s.frameworks }))}
        badgeCount={filters.requirements.filter((r) => r.type === "framework").length}
      >
        <ChipPicker
          items={FRAMEWORKS}
          selectedItems={filters.requirements}
          type="framework"
          onAdd={addRequirement}
        />
      </FilterSection>

      {/* Skills */}
      <FilterSection
        title="Skills"
        icon={Briefcase}
        isOpen={openSections.skills}
        onToggle={() => setOpenSections((s) => ({ ...s, skills: !s.skills }))}
        badgeCount={filters.requirements.filter((r) => r.type === "skill").length}
      >
        <ChipPicker
          items={SKILLS}
          selectedItems={filters.requirements}
          type="skill"
          onAdd={addRequirement}
        />
      </FilterSection>

      {/* Location */}
      <FilterSection
        title="Location"
        icon={MapPin}
        isOpen={openSections.location}
        onToggle={() => setOpenSections((s) => ({ ...s, location: !s.location }))}
        badgeCount={filters.locationRequired ? 1 : 0}
      >
        <div className="flex flex-wrap gap-1.5">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  locationRequired:
                    filters.locationRequired === loc.toLowerCase() ? null : loc.toLowerCase(),
                })
              }
              className={`
                inline-flex items-center px-2 py-0.5 rounded-md text-xs transition-all
                ${filters.locationRequired === loc.toLowerCase()
                  ? "bg-red-500/15 text-red-400 border border-red-500/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/30"
                }
              `}
            >
              {loc}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* GitHub Activity */}
      <FilterSection
        title="GitHub Metrics"
        icon={GitFork}
        isOpen={openSections.github}
        onToggle={() => setOpenSections((s) => ({ ...s, github: !s.github }))}
        badgeCount={(filters.minRepos > 0 ? 1 : 0) + (filters.minStars > 0 ? 1 : 0)}
      >
        <div className="space-y-4">
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
              onValueChange={([v]) => onFiltersChange({ ...filters, minRepos: v })}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

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
              onValueChange={([v]) => onFiltersChange({ ...filters, minStars: v })}
              min={0}
              max={1000}
              step={10}
              className="w-full"
            />
          </div>
        </div>
      </FilterSection>

      {/* Filter Presets */}
      <FilterSection
        title="Saved Presets"
        icon={Save}
        isOpen={openSections.presets}
        onToggle={() => setOpenSections((s) => ({ ...s, presets: !s.presets }))}
        badgeCount={presets.length}
      >
        <div className="space-y-3">
          {/* Save current */}
          {totalActive > 0 && (
            <div className="flex gap-2">
              <Input
                placeholder="Preset name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && savePreset()}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={savePreset}
                disabled={!presetName.trim()}
              >
                <Save className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Preset list */}
          {presets.length > 0 ? (
            <div className="space-y-1.5">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <button
                    onClick={() => loadPreset(preset)}
                    className="flex-1 text-left text-xs font-medium"
                  >
                    {preset.name}
                    <span className="text-[10px] text-muted-foreground ml-2">
                      ({preset.filters.requirements.length} reqs)
                    </span>
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No saved presets yet. Add filters and save them here.
            </p>
          )}
        </div>
      </FilterSection>
    </div>
  );
}

// ──────────────────────────────────────────────
// Exported Panel Component
// ──────────────────────────────────────────────

interface HardRequirementFiltersPanelProps {
  filters: HardRequirementFilters;
  onFiltersChange: (filters: HardRequirementFilters) => void;
  totalCandidates: number;
  matchedCandidates: number;
  matchCounts: Record<string, number>;
  mode?: "desktop" | "mobile" | "both";
}

export function HardRequirementFiltersPanel({
  filters,
  onFiltersChange,
  totalCandidates,
  matchedCandidates,
  matchCounts,
  mode = "both",
}: HardRequirementFiltersPanelProps) {
  const activeCount =
    filters.requirements.length +
    (filters.minRepos > 0 ? 1 : 0) +
    (filters.minStars > 0 ? 1 : 0) +
    (filters.locationRequired ? 1 : 0);

  return (
    <>
      {/* Desktop sidebar */}
      {(mode === "desktop" || mode === "both") && (
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 bg-card border rounded-lg p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-red-400" />
                Hard Requirements
              </h3>
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {activeCount} active
                </Badge>
              )}
            </div>
            <FilterPanelContent
              filters={filters}
              onFiltersChange={onFiltersChange}
              totalCandidates={totalCandidates}
              matchedCandidates={matchedCandidates}
              matchCounts={matchCounts}
            />
          </div>
        </div>
      )}

      {/* Mobile sheet */}
      {(mode === "mobile" || mode === "both") && (
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                Requirements
                {activeCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[380px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400" />
                  Hard Requirements
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanelContent
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  totalCandidates={totalCandidates}
                  matchedCandidates={matchedCandidates}
                  matchCounts={matchCounts}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
}

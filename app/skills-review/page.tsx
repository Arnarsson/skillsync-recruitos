"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  X,
  Plus,
  ArrowRight,
  RotateCcw,
  Target,
  Star,
  Sparkles,
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  Lightbulb,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SkillTier = "must-have" | "nice-to-have" | "bonus";

interface Skill {
  id: string;
  name: string;
  tier: SkillTier;
  isCustom?: boolean;
}

interface SkillsConfig {
  skills: { name: string; tier: SkillTier; weight: number; order: number }[];
  customSkills: string[];
}

interface JobContext {
  requiredSkills?: string[];
  preferredSkills?: string[];
  location?: string;
}

interface SkillInsight {
  count: number;
  isLimiting: boolean;
  potentialGain?: number;
}

interface SkillSuggestion {
  skill: string;
  currentTier: SkillTier;
  suggestedTier: SkillTier;
  impact: string;
}

interface PreviewResponse {
  totalCandidates: number;
  perSkill: Record<string, SkillInsight>;
  suggestions: SkillSuggestion[];
  cached: boolean;
}

const TIER_CONFIG: Record<
  SkillTier,
  { weight: number; label: string; icon: React.ReactNode; color: string }
> = {
  "must-have": {
    weight: 1.0,
    label: "Must-have",
    icon: <Target className="w-4 h-4" />,
    color: "text-red-400",
  },
  "nice-to-have": {
    weight: 0.6,
    label: "Nice-to-have",
    icon: <Star className="w-4 h-4" />,
    color: "text-yellow-400",
  },
  bonus: {
    weight: 0.3,
    label: "Bonus",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-green-400",
  },
};

// Helper function to load skills from localStorage
function loadSkillsFromStorage(): { skills: Skill[]; location?: string; hasError: boolean; noContext: boolean } {
  if (typeof window === "undefined") {
    return { skills: [], hasError: false, noContext: false };
  }

  const storedJobContext = localStorage.getItem("apex_job_context");
  if (storedJobContext) {
    try {
      const jobContext: JobContext = JSON.parse(storedJobContext);
      const requiredSkills = jobContext.requiredSkills || [];
      const preferredSkills = jobContext.preferredSkills || [];

      const initialSkills: Skill[] = [];

      // First 4 required → must-have (capped to avoid over-filtering)
      requiredSkills.slice(0, 4).forEach((name, i) => {
        initialSkills.push({
          id: `skill-${i}-${name}`,
          name,
          tier: "must-have",
          isCustom: false,
        });
      });

      // Remaining required → nice-to-have (demoted to expand pool)
      requiredSkills.slice(4).forEach((name, i) => {
        initialSkills.push({
          id: `skill-demoted-${i}-${name}`,
          name,
          tier: "nice-to-have",
          isCustom: false,
        });
      });

      // Preferred → nice-to-have
      preferredSkills.forEach((name, i) => {
        initialSkills.push({
          id: `skill-preferred-${i}-${name}`,
          name,
          tier: "nice-to-have",
          isCustom: false,
        });
      });

      return { skills: initialSkills, location: jobContext.location, hasError: false, noContext: false };
    } catch (e) {
      console.error("Failed to parse job context:", e);
      return { skills: [], hasError: true, noContext: false };
    }
  }
  return { skills: [], hasError: false, noContext: true };
}

// Skill row component with insight
function SkillRow({
  skill,
  insight,
  isLoading,
  onTierChange,
  onRemove,
}: {
  skill: Skill;
  insight?: SkillInsight;
  isLoading: boolean;
  onTierChange: (id: string, tier: SkillTier) => void;
  onRemove: (id: string) => void;
}) {
  const isLimiting = insight?.isLimiting;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 sm:gap-3 p-3 border rounded-lg bg-card hover:border-primary/30 transition-colors">
        {/* Skill name */}
        <span className="flex-1 font-medium text-sm sm:text-base truncate">
          {skill.name}
        </span>

        {skill.isCustom && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
            Custom
          </Badge>
        )}

        {/* Tier dropdown */}
        <Select
          value={skill.tier}
          onValueChange={(value) => onTierChange(skill.id, value as SkillTier)}
        >
          <SelectTrigger className={cn("w-[130px] sm:w-[140px]", TIER_CONFIG[skill.tier].color)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="must-have">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                <span>Must-have</span>
              </div>
            </SelectItem>
            <SelectItem value="nice-to-have">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Nice-to-have</span>
              </div>
            </SelectItem>
            <SelectItem value="bonus">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span>Bonus</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Candidate count badge */}
        <div className="w-[100px] sm:w-[120px] text-right">
          {isLoading ? (
            <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading...
            </span>
          ) : insight ? (
            <span
              className={cn(
                "text-xs flex items-center justify-end gap-1",
                isLimiting ? "text-yellow-500" : "text-muted-foreground"
              )}
            >
              {isLimiting ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3 text-green-500" />
              )}
              {insight.count.toLocaleString()} candidates
            </span>
          ) : null}
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(skill.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Suggestion */}
      {isLimiting && skill.tier === "must-have" && (
        <button
          className="flex items-center gap-1.5 text-xs text-primary ml-4 hover:underline"
          onClick={() => onTierChange(skill.id, "nice-to-have")}
        >
          <Lightbulb className="w-3 h-3" />
          Move to nice-to-have → stops penalizing candidates without it
        </button>
      )}
    </div>
  );
}

export default function SkillsReviewPage() {
  const router = useRouter();
  const toastShownRef = useRef(false);

  // Lazy initialization from localStorage
  const [skills, setSkills] = useState<Skill[]>(() => {
    const { skills: initialSkills } = loadSkillsFromStorage();
    return initialSkills;
  });
  const [originalSkills] = useState<Skill[]>(() => {
    const { skills: initialSkills } = loadSkillsFromStorage();
    return initialSkills;
  });
  const [location] = useState<string | undefined>(() => {
    const { location: loc } = loadSkillsFromStorage();
    return loc;
  });
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Preview state
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Show toast messages after mount (client-side only)
  useEffect(() => {
    if (toastShownRef.current) return;
    toastShownRef.current = true;

    const { hasError, noContext } = loadSkillsFromStorage();
    if (hasError) {
      toast.error("Failed to load skills from job context");
    } else if (noContext) {
      toast.error("No job context found", {
        description: "Please complete the intake step first",
      });
    }
  }, []);

  // Fetch preview data
  const fetchPreview = useCallback(async (force = false) => {
    if (skills.length === 0) return;

    // Don't refetch if we fetched recently (unless forced)
    const now = Date.now();
    if (!force && now - lastFetchTime < 5000) return;

    setIsLoadingPreview(true);
    try {
      const response = await fetch("/api/skills/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: skills.map((s) => ({ name: s.name, tier: s.tier })),
          location,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch preview");
      }

      const data: PreviewResponse = await response.json();
      setPreview(data);
      setLastFetchTime(now);
    } catch (error) {
      console.error("Preview fetch error:", error);
      toast.error("Failed to load candidate counts");
    } finally {
      setIsLoadingPreview(false);
    }
  }, [skills, location, lastFetchTime]);

  // Initial fetch on mount
  useEffect(() => {
    if (skills.length > 0 && !preview) {
      fetchPreview(true);
    }
  }, [skills.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Counts by tier
  const tierCounts = useMemo(() => ({
    "must-have": skills.filter((s) => s.tier === "must-have").length,
    "nice-to-have": skills.filter((s) => s.tier === "nice-to-have").length,
    bonus: skills.filter((s) => s.tier === "bonus").length,
  }), [skills]);

  const handleTierChange = useCallback((id: string, newTier: SkillTier) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, tier: newTier } : s))
    );
    // Clear preview to indicate data is stale
    setPreview(null);
  }, []);

  const handleRemoveSkill = useCallback((id: string) => {
    setSkills((prev) => {
      const skill = prev.find((s) => s.id === id);
      if (skill?.isCustom) {
        setCustomSkills((cs) => cs.filter((name) => name !== skill.name));
      }
      return prev.filter((s) => s.id !== id);
    });
    setPreview(null);
    toast.success("Skill removed");
  }, []);

  const handleAddSkill = useCallback(() => {
    const skillName = newSkillInput.trim();
    if (!skillName) return;

    // Check for duplicates
    if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      toast.error("Skill already exists");
      return;
    }

    const newSkill: Skill = {
      id: `custom-${Date.now()}-${skillName}`,
      name: skillName,
      tier: "nice-to-have", // Default to nice-to-have
      isCustom: true,
    };

    setSkills((prev) => [...prev, newSkill]);
    setCustomSkills((prev) => [...prev, skillName]);
    setNewSkillInput("");
    setPreview(null);
    toast.success("Skill added");
  }, [newSkillInput, skills]);

  const handleReset = useCallback(() => {
    setSkills(originalSkills);
    setCustomSkills([]);
    setNewSkillInput("");
    setPreview(null);
    toast.success("Reset to AI suggestions");
  }, [originalSkills]);

  const handleContinue = useCallback(() => {
    // Build skills config
    const skillsConfig: SkillsConfig = {
      skills: skills.map((s, i) => ({
        name: s.name,
        tier: s.tier,
        weight: TIER_CONFIG[s.tier].weight,
        order: i,
      })),
      customSkills,
    };

    localStorage.setItem("apex_skills_config", JSON.stringify(skillsConfig));
    toast.success("Skills saved");
    router.push("/pipeline");
  }, [skills, customSkills, router]);

  const hasChanges =
    JSON.stringify(skills) !== JSON.stringify(originalSkills) ||
    customSkills.length > 0;

  // Limiting skills warning
  const limitingSkillsCount = preview
    ? Object.values(preview.perSkill).filter((s) => s.isLimiting).length
    : 0;

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary text-xs">
              Step 2 of 4
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">Skills Review</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              AI extracted these skills. Adjust to expand your candidate pool.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              size="sm"
            >
              <RotateCcw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchPreview(true)}
              disabled={isLoadingPreview || skills.length === 0}
              size="sm"
            >
              <RefreshCw className={cn("w-4 h-4 sm:mr-2", isLoadingPreview && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Warning banner for limiting skills */}
        {preview && limitingSkillsCount > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-500">
                {limitingSkillsCount} skill{limitingSkillsCount !== 1 ? "s have" : " has"} very few candidates
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Niche skills as must-haves will penalize otherwise great candidates.
                Consider moving them to nice-to-have.
              </p>
            </div>
          </div>
        )}

        {/* Skills list */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Skills ({skills.length})</span>
              {preview?.cached && (
                <span className="text-xs font-normal text-muted-foreground">
                  Cached results
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {skills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No skills found.</p>
                <p className="text-sm">Add skills below or go back to intake.</p>
              </div>
            ) : (
              skills.map((skill) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  insight={preview?.perSkill[skill.name]}
                  isLoading={isLoadingPreview && !preview}
                  onTierChange={handleTierChange}
                  onRemove={handleRemoveSkill}
                />
              ))
            )}

            {/* Add skill input */}
            <div className="flex gap-2 pt-3 border-t">
              <Input
                placeholder="Add a skill..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSkillInput.trim()) {
                    handleAddSkill();
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleAddSkill}
                disabled={!newSkillInput.trim()}
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Must-have</p>
                  <p className="text-lg font-semibold text-red-400">
                    {tierCounts["must-have"]}
                  </p>
                </div>
                <div className="h-10 w-px bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Nice-to-have</p>
                  <p className="text-lg font-semibold text-yellow-400">
                    {tierCounts["nice-to-have"]}
                  </p>
                </div>
                <div className="h-10 w-px bg-border hidden sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Bonus</p>
                  <p className="text-lg font-semibold text-green-400">
                    {tierCounts["bonus"]}
                  </p>
                </div>
              </div>

              {/* Pool size indicator */}
              {preview && (
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-semibold">{preview.totalCandidates.toLocaleString()}</span>
                    <span className="text-muted-foreground"> in search pool</span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Continue button */}
        <div className="flex justify-end">
          <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto">
            <span>Continue to Pipeline</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

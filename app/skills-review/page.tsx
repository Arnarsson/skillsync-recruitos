"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Loader2,
  RefreshCw,
  Lightbulb,
  Users,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhaseIndicator } from "@/components/PhaseIndicator";
import { HardRequirementsFilter } from "@/components/HardRequirementsFilter";
import type { HardRequirementsConfig } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type SkillTier = "must-have" | "nice-to-have" | "bonus";

interface Skill {
  id: string;
  name: string;
  tier: SkillTier;
  isCustom?: boolean;
  confidence?: 'high' | 'medium' | 'low'; // AI extraction confidence
  source?: string; // Where the skill was extracted from
}

interface SkillsConfig {
  skills: { name: string; tier: SkillTier; weight: number; order: number }[];
  customSkills: string[];
  hardRequirements?: HardRequirementsConfig;
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
  fallback?: boolean;
}

interface PreviewResponse {
  totalCandidates: number;
  estimateMin?: number;
  estimateMax?: number;
  perSkill: Record<string, SkillInsight>;
  suggestions: { skill: string; currentTier: SkillTier; suggestedTier: SkillTier; impact: string }[];
  cached: boolean;
  estimateMode?: "strict" | "broad";
  confidence?: "high" | "medium" | "low";
  note?: string;
}

const TIER_CONFIG: Record<SkillTier, { weight: number; label: string; icon: React.ReactNode; tone: string; chip: string }> = {
  "must-have": {
    weight: 1.0,
    label: "Must-have",
    icon: <Target className="w-4 h-4" />,
    tone: "text-rose-400",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
  "nice-to-have": {
    weight: 0.6,
    label: "Nice-to-have",
    icon: <Star className="w-4 h-4" />,
    tone: "text-amber-300",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  bonus: {
    weight: 0.3,
    label: "Bonus",
    icon: <Sparkles className="w-4 h-4" />,
    tone: "text-emerald-300",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
};

const TIER_ORDER: SkillTier[] = ["must-have", "nice-to-have", "bonus"];
const TIER_GUIDANCE: Record<SkillTier, string> = {
  "must-have": "Only add skills that are true deal-breakers.",
  "nice-to-have": "Strong signals that help ranking, but not blockers.",
  bonus: "Optional plus points. Keep this list short.",
};

// Helper function to determine confidence based on skill context
function inferConfidence(name: string, index: number, isRequired: boolean): 'high' | 'medium' | 'low' {
  // Common skill keywords that are usually high confidence
  const highConfidencePatterns = [
    /^(react|vue|angular|node|python|java|typescript|javascript|go|rust|c\+\+|c#|ruby|php|swift|kotlin)$/i,
    /^(aws|gcp|azure|docker|kubernetes|terraform)$/i,
    /^(postgresql|mysql|mongodb|redis|elasticsearch)$/i,
    /^(graphql|rest|api)$/i,
  ];

  // Check if skill matches high confidence patterns
  const isHighConfidence = highConfidencePatterns.some(pattern => pattern.test(name));

  if (isHighConfidence) return 'high';
  if (isRequired && index < 3) return 'high'; // First 3 required skills are usually explicit
  if (isRequired) return 'medium'; // Other required skills
  return 'low'; // Preferred skills are often inferred
}

// Helper function to load skills from localStorage
function loadSkillsFromStorage(): { skills: Skill[]; location?: string; hasError: boolean; noContext: boolean } {
  if (typeof window === "undefined") {
    return { skills: [], hasError: false, noContext: false };
  }

  // Check for saved draft first (for back button support)
  const storedDraft = localStorage.getItem("apex_skills_draft");
  if (storedDraft) {
    try {
      const draft = JSON.parse(storedDraft);
      if (draft.skills && draft.skills.length > 0) {
        const skills: Skill[] = draft.skills.map((s: { name: string; tier: SkillTier }, i: number) => ({
          id: `draft-${i}-${s.name}`,
          name: s.name,
          tier: s.tier,
          isCustom: draft.customSkills?.includes(s.name) || false,
        }));
        // Get location from job context
        const storedJobContext = localStorage.getItem("apex_job_context");
        let location;
        if (storedJobContext) {
          try {
            location = JSON.parse(storedJobContext).location;
          } catch {}
        }
        return { skills, location, hasError: false, noContext: false };
      }
    } catch {}
  }

  const storedJobContext = localStorage.getItem("apex_job_context");
  if (storedJobContext) {
    try {
      const jobContext: JobContext = JSON.parse(storedJobContext);
      const requiredSkills = jobContext.requiredSkills || [];
      const preferredSkills = jobContext.preferredSkills || [];

      const initialSkills: Skill[] = [];

      // First 4 required → must-have
      requiredSkills.slice(0, 4).forEach((name, i) => {
        initialSkills.push({
          id: `skill-${i}-${name}`,
          name,
          tier: "must-have",
          isCustom: false,
          confidence: inferConfidence(name, i, true),
          source: "Job description",
        });
      });

      // Remaining required → nice-to-have
      requiredSkills.slice(4).forEach((name, i) => {
        initialSkills.push({
          id: `skill-demoted-${i}-${name}`,
          name,
          tier: "nice-to-have",
          isCustom: false,
          confidence: inferConfidence(name, i + 4, true),
          source: "Job description",
        });
      });

      // Preferred → nice-to-have
      preferredSkills.forEach((name, i) => {
        initialSkills.push({
          id: `skill-preferred-${i}-${name}`,
          name,
          tier: "nice-to-have",
          isCustom: false,
          confidence: inferConfidence(name, i, false),
          source: "Inferred from context",
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

// Confidence indicator component
function ConfidenceDot({ confidence, source }: { confidence?: 'high' | 'medium' | 'low'; source?: string }) {
  if (!confidence) return null;

  const config = {
    high: { color: 'bg-green-500', label: 'High confidence' },
    medium: { color: 'bg-amber-500', label: 'Medium confidence' },
    low: { color: 'bg-amber-500', label: 'Low confidence (may be inferred)' },
  };

  const { color, label } = config[confidence];

  return (
    <div className="relative group/conf">
      <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/conf:block z-20">
        <div className="bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-lg border whitespace-nowrap">
          <div className="font-medium">{label}</div>
          {source && <div className="text-muted-foreground">{source}</div>}
        </div>
      </div>
    </div>
  );
}

// Skill chip component
function SkillChip({
  skill,
  insight,
  isLoading,
  onMove,
  onRemove,
  onDragStart,
  onDragEnd,
  canMoveLeft,
  canMoveRight,
}: {
  skill: Skill;
  insight?: SkillInsight;
  isLoading: boolean;
  onMove: (direction: "left" | "right") => void;
  onRemove: () => void;
  onDragStart: (skillId: string) => void;
  onDragEnd: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  const isLimiting = insight?.isLimiting && skill.tier === "must-have";

  return (
    <div className={cn(
      "group flex items-center gap-1 p-2 rounded-lg border bg-card transition-all",
      isLimiting && "border-amber-500/50 bg-amber-500/5"
    )}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/skill-id", skill.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(skill.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="text-muted-foreground/70 px-1 cursor-grab active:cursor-grabbing" title="Drag to another column">
        <GripVertical className="w-3 h-3" />
      </div>
      {/* Move left */}
      <button
        onClick={() => onMove("left")}
        disabled={!canMoveLeft}
        className={cn(
          "p-1 rounded hover:bg-muted transition-colors",
          !canMoveLeft && "opacity-30 cursor-not-allowed"
        )}
        title="Move to higher priority"
      >
        <ChevronLeft className="w-3 h-3" />
      </button>

      {/* Skill content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <ConfidenceDot confidence={skill.confidence} source={skill.source} />
          <span className="font-medium text-sm truncate">{skill.name}</span>
          {skill.isCustom && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              Custom
            </Badge>
          )}
        </div>
        {/* Candidate count — no per-chip warning; zero state is handled by page-level banner */}
        <div className="flex items-center gap-1 mt-0.5">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : insight ? (
            <span className="text-xs text-muted-foreground">
              {insight.count > 0
                ? insight.fallback
                  ? `~${insight.count.toLocaleString()} est.`
                  : `${insight.count.toLocaleString()} candidates`
                : insight.fallback
                  ? "~30k+ est."
                  : "no matches"}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Move right */}
      <button
        onClick={() => onMove("right")}
        disabled={!canMoveRight}
        className={cn(
          "p-1 rounded hover:bg-muted transition-colors",
          !canMoveRight && "opacity-30 cursor-not-allowed"
        )}
        title="Move to lower priority"
      >
        <ChevronRight className="w-3 h-3" />
      </button>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="Remove skill"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Column component for each tier
function TierColumn({
  tier,
  skills,
  preview,
  isLoading,
  onMoveSkill,
  onDropSkill,
  onRemoveSkill,
  onAddSkill,
  onDragStartSkill,
  onDragEndSkill,
  draggedSkillId,
}: {
  tier: SkillTier;
  skills: Skill[];
  preview: PreviewResponse | null;
  isLoading: boolean;
  onMoveSkill: (skillId: string, direction: "left" | "right") => void;
  onDropSkill: (skillId: string, targetTier: SkillTier) => void;
  onRemoveSkill: (skillId: string) => void;
  onAddSkill: (tier: SkillTier, name: string) => void;
  onDragStartSkill: (skillId: string) => void;
  onDragEndSkill: () => void;
  draggedSkillId: string | null;
}) {
  const config = TIER_CONFIG[tier];
  const [newSkill, setNewSkill] = useState("");
  const tierIndex = TIER_ORDER.indexOf(tier);

  const handleAdd = () => {
    if (newSkill.trim()) {
      onAddSkill(tier, newSkill.trim());
      setNewSkill("");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={config.tone}>{config.icon}</span>
        <h3 className="font-semibold text-sm sm:text-base text-foreground">
          {config.label}
        </h3>
        <Badge variant="outline" className={cn("ml-auto text-xs", config.chip)}>
          {skills.length}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {TIER_GUIDANCE[tier]}
      </p>

      {/* Skills list */}
      <div
        className={cn(
          "flex-1 space-y-2 min-h-[100px] rounded-md transition-colors",
          draggedSkillId && "border border-dashed border-primary/40 bg-primary/5 p-1"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const skillId = e.dataTransfer.getData("text/skill-id");
          if (skillId) onDropSkill(skillId, tier);
        }}
      >
        {skills.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No skills
          </div>
        ) : (
          skills.map((skill) => (
            <SkillChip
              key={skill.id}
              skill={skill}
              insight={preview?.perSkill[skill.name]}
              isLoading={isLoading && !preview}
              onMove={(dir) => onMoveSkill(skill.id, dir)}
              onRemove={() => onRemoveSkill(skill.id)}
              onDragStart={(skillId) => {
                onDragStartSkill(skillId);
              }}
              onDragEnd={onDragEndSkill}
              canMoveLeft={tierIndex > 0}
              canMoveRight={tierIndex < TIER_ORDER.length - 1}
            />
          ))
        )}
      </div>

      {/* Add skill input */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
        <Input
          placeholder="Add skill..."
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8 text-sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          disabled={!newSkill.trim()}
          className="h-8 px-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SkillsReviewPage() {
  const router = useRouter();
  const toastShownRef = useRef(false);
  const { t } = useLanguage();

  const [skills, setSkills] = useState<Skill[]>(() => loadSkillsFromStorage().skills);
  const [originalSkills] = useState<Skill[]>(() => loadSkillsFromStorage().skills);
  const [location] = useState<string | undefined>(() => loadSkillsFromStorage().location);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [draggedSkillId, setDraggedSkillId] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [totalCandidatesWithoutFilters, setTotalCandidatesWithoutFilters] = useState<number | undefined>();

  // Hard requirements state
  const [hardRequirements, setHardRequirements] = useState<HardRequirementsConfig>(() => {
    // Try to load from localStorage
    const stored = typeof window !== "undefined" ? localStorage.getItem("apex_skills_draft") : null;
    if (stored) {
      try {
        const draft = JSON.parse(stored);
        if (draft.hardRequirements) return draft.hardRequirements;
      } catch {}
    }
    return { requirements: [], enabled: false };
  });

  // Show toast messages after mount
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

    const now = Date.now();
    if (!force && now - lastFetchTime < 5000) return;

    setIsLoadingPreview(true);
    try {
      // Fetch with filters
      const response = await fetch("/api/skills/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: skills.map((s) => ({ name: s.name, tier: s.tier })),
          location,
          hardRequirements,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch preview");

      const data: PreviewResponse = await response.json();
      setPreview(data);
      setLastFetchTime(now);

      // Fetch without hard requirements to get baseline count
      if (hardRequirements.enabled && hardRequirements.requirements.length > 0) {
        const baselineResponse = await fetch("/api/skills/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skills: skills.map((s) => ({ name: s.name, tier: s.tier })),
            location,
            hardRequirements: { requirements: [], enabled: false },
          }),
        });
        if (baselineResponse.ok) {
          const baselineData: PreviewResponse = await baselineResponse.json();
          setTotalCandidatesWithoutFilters(baselineData.totalCandidates);
        }
      } else {
        setTotalCandidatesWithoutFilters(data.totalCandidates);
      }
    } catch (error) {
      console.error("Preview fetch error:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [skills, location, hardRequirements, lastFetchTime]);

  // Fetch preview whenever skills/filters change and preview is invalidated
  useEffect(() => {
    if (skills.length > 0 && !preview) {
      fetchPreview(true);
    }
  }, [skills, hardRequirements, preview, fetchPreview]);

  // Auto-save skills to localStorage when they change (for back button support)
  useEffect(() => {
    if (skills.length > 0) {
      const draft = {
        skills: skills.map((s, i) => ({
          name: s.name,
          tier: s.tier,
          weight: TIER_CONFIG[s.tier].weight,
          order: i,
        })),
        customSkills,
        hardRequirements,
      };
      localStorage.setItem("apex_skills_draft", JSON.stringify(draft));
    }
  }, [skills, customSkills, hardRequirements]);

  // Skills by tier
  const skillsByTier = useMemo(() => ({
    "must-have": skills.filter((s) => s.tier === "must-have"),
    "nice-to-have": skills.filter((s) => s.tier === "nice-to-have"),
    bonus: skills.filter((s) => s.tier === "bonus"),
  }), [skills]);

  const handleMoveSkill = useCallback((skillId: string, direction: "left" | "right") => {
    setSkills((prev) => {
      const skill = prev.find((s) => s.id === skillId);
      if (!skill) return prev;

      const currentIndex = TIER_ORDER.indexOf(skill.tier);
      const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= TIER_ORDER.length) return prev;

      const newTier = TIER_ORDER[newIndex];
      return prev.map((s) => (s.id === skillId ? { ...s, tier: newTier } : s));
    });
    setPreview(null);
  }, []);

  const handleRemoveSkill = useCallback((skillId: string) => {
    setSkills((prev) => {
      const skill = prev.find((s) => s.id === skillId);
      if (skill?.isCustom) {
        setCustomSkills((cs) => cs.filter((name) => name !== skill.name));
      }
      return prev.filter((s) => s.id !== skillId);
    });
    setPreview(null);
  }, []);

  const handleDropSkill = useCallback((skillId: string, targetTier: SkillTier) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, tier: targetTier } : s))
    );
    setDraggedSkillId(null);
    setPreview(null);
  }, []);

  const handleAddSkill = useCallback((tier: SkillTier, name: string) => {
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already exists");
      return;
    }

    const newSkill: Skill = {
      id: `custom-${Date.now()}-${name}`,
      name,
      tier,
      isCustom: true,
    };

    setSkills((prev) => [...prev, newSkill]);
    setCustomSkills((prev) => [...prev, name]);
    setPreview(null);
    toast.success("Skill added");
  }, [skills]);

  const handleReset = useCallback(() => {
    setSkills(originalSkills);
    setCustomSkills([]);
    setPreview(null);
    // Clear draft so reset persists on back navigation
    localStorage.removeItem("apex_skills_draft");
    toast.success("Reset to AI suggestions");
  }, [originalSkills]);

  const handleQuickDemoteLimiting = useCallback(() => {
    if (!preview) return;
    const limitingMustHave = skills.find(
      (skill) => skill.tier === "must-have" && preview.perSkill[skill.name]?.isLimiting
    );
    if (!limitingMustHave) return;

    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === limitingMustHave.id ? { ...skill, tier: "nice-to-have" } : skill
      )
    );
    setPreview(null);
    toast.success(`Moved ${limitingMustHave.name} to nice-to-have`);
  }, [preview, skills]);

  const handleContinue = useCallback(() => {
    const skillsConfig: SkillsConfig = {
      skills: skills.map((s, i) => ({
        name: s.name,
        tier: s.tier,
        weight: TIER_CONFIG[s.tier].weight,
        order: i,
      })),
      customSkills,
      hardRequirements,
    };

    localStorage.setItem("apex_skills_config", JSON.stringify(skillsConfig));
    // Force pipeline to refresh candidates against the updated criteria.
    localStorage.setItem("apex_pending_auto_search", "true");
    localStorage.removeItem("apex_job_context_hash");
    localStorage.removeItem("apex_candidates");
    // Clear draft as we've officially saved
    localStorage.removeItem("apex_skills_draft");
    toast.success("Skills saved");
    router.push("/pipeline");
  }, [skills, customSkills, hardRequirements, router]);

  // Switch ALL must-have skills to nice-to-have (broad match fallback)
  const handleSwitchToBroadMatch = useCallback(() => {
    setSkills((prev) =>
      prev.map((s) => (s.tier === "must-have" ? { ...s, tier: "nice-to-have" } : s))
    );
    setPreview(null);
    toast.success("Switched to Broad Match — all must-haves moved to nice-to-have");
  }, []);

  const hasChanges = JSON.stringify(skills) !== JSON.stringify(originalSkills) || customSkills.length > 0;
  const limitingCount = preview ? Object.entries(preview.perSkill).filter(([name, s]) =>
    s.isLimiting && skills.find(sk => sk.name === name)?.tier === "must-have"
  ).length : 0;

  // True when every must-have skill returned 0 candidates from the API
  const allMustHavesZero = useMemo(() => {
    if (!preview || isLoadingPreview) return false;
    const mustHaveSkills = skills.filter((s) => s.tier === "must-have");
    if (mustHaveSkills.length === 0) return false;
    return mustHaveSkills.every((s) => (preview.perSkill[s.name]?.count ?? 1) === 0);
  }, [preview, skills, isLoadingPreview]);
  const candidateEstimateLabel = preview
    ? preview.confidence === "low" &&
      typeof preview.estimateMin === "number" &&
      typeof preview.estimateMax === "number"
      ? `${preview.estimateMin.toLocaleString()}-${preview.estimateMax.toLocaleString()}`
      : preview.totalCandidates.toLocaleString()
    : "—";

  // Empty state
  if (skills.length === 0) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 pb-24 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto text-center py-16">
          <Target className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">No Skills Found</h1>
          <p className="text-muted-foreground mb-6">
            Complete the job intake step first to extract skills from your job description.
          </p>
          <Button onClick={() => router.push("/intake")} size="lg">
            Go to Job Intake
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-32 px-3 sm:px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Phase Indicator */}
        <PhaseIndicator currentPhase={2} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('skillsReview.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('skillsReview.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges} size="sm">
              <RotateCcw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button variant="outline" onClick={() => fetchPreview(true)} disabled={isLoadingPreview} size="sm">
              <RefreshCw className={cn("w-4 h-4 sm:mr-2", isLoadingPreview && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Candidate Pool Indicator */}
        <Card className="mb-6 border-border">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">Estimated Reachable Candidates</span>
                  <span className="text-lg font-semibold text-foreground">
                    {isLoadingPreview ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : preview ? (
                      candidateEstimateLabel
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                {preview && (
                  <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (preview.totalCandidates / 5000) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {preview?.note || "Estimate based on your current skill tiers and filters."}
            </p>
            {limitingCount > 0 && (
              <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-500/10 text-amber-500 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{limitingCount} must-have skill{limitingCount !== 1 && "s"} limiting your pool. Consider demoting.</span>
              </div>
            )}
            {preview && preview.totalCandidates === 0 && (
              <div className="mt-3 p-3 rounded-lg border border-destructive/40 bg-destructive/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-medium text-destructive">0 strict matches</p>
                    <p className="text-muted-foreground mt-1">
                      Your current must-have set is too restrictive for this search scope.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleQuickDemoteLimiting}
                      disabled={!skills.some((s) => s.tier === "must-have" && preview.perSkill[s.name]?.isLimiting)}
                    >
                      Demote Limiting Skill
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => fetchPreview(true)} disabled={isLoadingPreview}>
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Decision Guide */}
        <Card className="mb-6 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              What To Do Now
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {limitingCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Move 1-2 borderline skills from <span className="text-rose-400 font-medium">Must-have</span> to{" "}
                <span className="text-amber-300 font-medium">Nice-to-have</span>, then press{" "}
                <span className="text-foreground font-medium">Refresh</span> to widen the candidate pool.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your tiers look balanced. Add any missing role-specific skills, then continue to candidate ranking.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Hard Requirements Filter */}
        <div className="mb-6">
          <HardRequirementsFilter
            initialRequirements={hardRequirements}
            candidateCount={preview?.totalCandidates}
            totalCandidates={totalCandidatesWithoutFilters}
            isLoadingCount={isLoadingPreview}
            onChange={(config) => {
              setHardRequirements(config);
              setPreview(null); // Clear preview to force refresh
            }}
          />
        </div>

        {/* Zero-match banner: shown when ALL must-have skills return 0 candidates */}
        {allMustHavesZero && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-600 text-sm">Your must-have skills are too specific — no GitHub matches found.</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Switch to Broad Match to move all must-haves to nice-to-have and surface relevant candidates.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 flex-shrink-0"
              onClick={handleSwitchToBroadMatch}
            >
              Switch to Broad Match
            </Button>
          </div>
        )}

        {/* Three-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {TIER_ORDER.map((tier) => (
            <TierColumn
              key={tier}
              tier={tier}
              skills={skillsByTier[tier]}
              preview={preview}
              isLoading={isLoadingPreview}
              onMoveSkill={handleMoveSkill}
              onDropSkill={handleDropSkill}
              onRemoveSkill={handleRemoveSkill}
              onAddSkill={handleAddSkill}
              onDragStartSkill={(skillId) => setDraggedSkillId(skillId)}
              onDragEndSkill={() => setDraggedSkillId(null)}
              draggedSkillId={draggedSkillId}
            />
          ))}
        </div>

        {/* Mobile hint */}
        <p className="text-center text-xs text-muted-foreground mb-4 md:hidden">
          Use arrows to move skills between columns
        </p>
      </div>

      {/* Fixed Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/96 backdrop-blur border-t border-border z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-2 text-sm border-border bg-card">
              <Target className="w-4 h-4 mr-2 text-rose-400" />
              <span className="text-foreground">{skillsByTier["must-have"].length}</span>
              <span className="text-muted-foreground ml-1.5">{t('skillsReview.mustHave')}</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-2 text-sm border-border bg-card">
              <Star className="w-4 h-4 mr-2 text-amber-300" />
              <span className="text-foreground">{skillsByTier["nice-to-have"].length}</span>
              <span className="text-muted-foreground ml-1.5">{t('skillsReview.niceToHave')}</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-2 text-sm border-border bg-card">
              <Sparkles className="w-4 h-4 mr-2 text-emerald-300" />
              <span className="text-foreground">{skillsByTier["bonus"].length}</span>
              <span className="text-muted-foreground ml-1.5">{t('skillsReview.bonus')}</span>
            </Badge>
            {preview && (
              <Badge variant="outline" className="px-3 py-2 text-sm border-primary/30 bg-primary/10">
                <Users className="w-4 h-4 mr-2 text-primary" />
                <span className="text-foreground">{candidateEstimateLabel}</span>
                <span className="text-muted-foreground ml-1.5">{t('skillsReview.candidates')}</span>
              </Badge>
            )}
            {preview && (
              <Badge
                variant="outline"
                className={`px-3 py-2 text-sm ${
                  preview.confidence === "low"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {preview.estimateMode === "strict" ? "Strict Match Mode" : "Broad Match Mode"}
              </Badge>
            )}
          </div>
          <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto">
            {t('skillsReview.continueButton')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

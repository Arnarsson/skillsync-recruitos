"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  ChevronLeft,
  ChevronRight,
  Trash2,
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
}

interface PreviewResponse {
  totalCandidates: number;
  perSkill: Record<string, SkillInsight>;
  suggestions: { skill: string; currentTier: SkillTier; suggestedTier: SkillTier; impact: string }[];
  cached: boolean;
}

const TIER_CONFIG: Record<SkillTier, { weight: number; label: string; shortLabel: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  "must-have": {
    weight: 1.0,
    label: "Must-have",
    shortLabel: "Must",
    icon: <Target className="w-4 h-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  "nice-to-have": {
    weight: 0.6,
    label: "Nice-to-have",
    shortLabel: "Nice",
    icon: <Star className="w-4 h-4" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  bonus: {
    weight: 0.3,
    label: "Bonus",
    shortLabel: "Bonus",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
};

const TIER_ORDER: SkillTier[] = ["must-have", "nice-to-have", "bonus"];

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

      requiredSkills.slice(0, 4).forEach((name, i) => {
        initialSkills.push({ id: `skill-${i}-${name}`, name, tier: "must-have", isCustom: false });
      });

      requiredSkills.slice(4).forEach((name, i) => {
        initialSkills.push({ id: `skill-demoted-${i}-${name}`, name, tier: "nice-to-have", isCustom: false });
      });

      preferredSkills.forEach((name, i) => {
        initialSkills.push({ id: `skill-preferred-${i}-${name}`, name, tier: "nice-to-have", isCustom: false });
      });

      return { skills: initialSkills, location: jobContext.location, hasError: false, noContext: false };
    } catch {
      return { skills: [], hasError: true, noContext: false };
    }
  }
  return { skills: [], hasError: false, noContext: true };
}

// Mobile-optimized skill card
function MobileSkillCard({
  skill,
  insight,
  isLoading,
  onMove,
  onRemove,
  tierIndex,
}: {
  skill: Skill;
  insight?: SkillInsight;
  isLoading: boolean;
  onMove: (direction: "left" | "right") => void;
  onRemove: () => void;
  tierIndex: number;
}) {
  const isLimiting = insight?.isLimiting && skill.tier === "must-have";
  const canMoveLeft = tierIndex > 0;
  const canMoveRight = tierIndex < TIER_ORDER.length - 1;

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-xl border-2 bg-card transition-all",
      isLimiting ? "border-yellow-500/50 bg-yellow-500/5" : "border-border"
    )}>
      {/* Move left button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMove("left")}
        disabled={!canMoveLeft}
        className={cn(
          "h-10 w-10 rounded-full flex-shrink-0",
          canMoveLeft ? "bg-muted hover:bg-primary/20" : "opacity-30"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* Skill info */}
      <div className="flex-1 min-w-0 px-1">
        <div className="font-medium truncate">{skill.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : insight ? (
            <>
              {isLimiting && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
              <span className={cn("text-xs", isLimiting ? "text-yellow-500" : "text-muted-foreground")}>
                {insight.count.toLocaleString()} matches
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {skill.isCustom && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1">Custom</Badge>
          )}
        </div>
      </div>

      {/* Move right button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMove("right")}
        disabled={!canMoveRight}
        className={cn(
          "h-10 w-10 rounded-full flex-shrink-0",
          canMoveRight ? "bg-muted hover:bg-primary/20" : "opacity-30"
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Desktop skill chip (compact)
function DesktopSkillChip({
  skill,
  insight,
  isLoading,
  onMove,
  onRemove,
  canMoveLeft,
  canMoveRight,
}: {
  skill: Skill;
  insight?: SkillInsight;
  isLoading: boolean;
  onMove: (direction: "left" | "right") => void;
  onRemove: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  const isLimiting = insight?.isLimiting && skill.tier === "must-have";

  return (
    <div className={cn(
      "group flex items-center gap-1.5 p-2 rounded-lg border bg-card transition-all",
      isLimiting && "border-yellow-500/50 bg-yellow-500/5"
    )}>
      <button
        onClick={() => onMove("left")}
        disabled={!canMoveLeft}
        className={cn("p-1 rounded hover:bg-muted", !canMoveLeft && "opacity-30 cursor-not-allowed")}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{skill.name}</span>
          {skill.isCustom && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Custom</Badge>}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : insight ? (
            <>
              {isLimiting && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
              <span className={cn("text-xs", isLimiting ? "text-yellow-500" : "text-muted-foreground")}>
                {insight.count.toLocaleString()}
              </span>
            </>
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </div>

      <button
        onClick={() => onMove("right")}
        disabled={!canMoveRight}
        className={cn("p-1 rounded hover:bg-muted", !canMoveRight && "opacity-30 cursor-not-allowed")}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Desktop column
function DesktopTierColumn({
  tier,
  skills,
  preview,
  isLoading,
  onMoveSkill,
  onRemoveSkill,
  onAddSkill,
}: {
  tier: SkillTier;
  skills: Skill[];
  preview: PreviewResponse | null;
  isLoading: boolean;
  onMoveSkill: (skillId: string, direction: "left" | "right") => void;
  onRemoveSkill: (skillId: string) => void;
  onAddSkill: (tier: SkillTier, name: string) => void;
}) {
  const config = TIER_CONFIG[tier];
  const [newSkill, setNewSkill] = useState("");
  const tierIndex = TIER_ORDER.indexOf(tier);

  return (
    <div className={cn("rounded-xl border p-4 flex flex-col", config.bgColor, config.borderColor)}>
      <div className="flex items-center gap-2 mb-3">
        <span className={config.color}>{config.icon}</span>
        <h3 className={cn("font-semibold", config.color)}>{config.label}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">{skills.length}</Badge>
      </div>

      <div className="flex-1 space-y-2 min-h-[120px]">
        {skills.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">No skills</div>
        ) : (
          skills.map((skill) => (
            <DesktopSkillChip
              key={skill.id}
              skill={skill}
              insight={preview?.perSkill[skill.name]}
              isLoading={isLoading && !preview}
              onMove={(dir) => onMoveSkill(skill.id, dir)}
              onRemove={() => onRemoveSkill(skill.id)}
              canMoveLeft={tierIndex > 0}
              canMoveRight={tierIndex < TIER_ORDER.length - 1}
            />
          ))
        )}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
        <Input
          placeholder="Add skill..."
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newSkill.trim()) {
              onAddSkill(tier, newSkill.trim());
              setNewSkill("");
            }
          }}
          className="h-8 text-sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (newSkill.trim()) {
              onAddSkill(tier, newSkill.trim());
              setNewSkill("");
            }
          }}
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

  const [skills, setSkills] = useState<Skill[]>(() => loadSkillsFromStorage().skills);
  const [originalSkills] = useState<Skill[]>(() => loadSkillsFromStorage().skills);
  const [location] = useState<string | undefined>(() => loadSkillsFromStorage().location);
  const [customSkills, setCustomSkills] = useState<string[]>([]);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Mobile: active tab
  const [activeTab, setActiveTab] = useState<SkillTier>("must-have");
  const [newSkillInput, setNewSkillInput] = useState("");

  useEffect(() => {
    if (toastShownRef.current) return;
    toastShownRef.current = true;
    const { hasError, noContext } = loadSkillsFromStorage();
    if (hasError) toast.error("Failed to load skills");
    else if (noContext) toast.error("No job context", { description: "Complete intake first" });
  }, []);

  const fetchPreview = useCallback(async (force = false) => {
    if (skills.length === 0) return;
    const now = Date.now();
    if (!force && now - lastFetchTime < 5000) return;

    setIsLoadingPreview(true);
    try {
      const response = await fetch("/api/skills/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: skills.map((s) => ({ name: s.name, tier: s.tier })), location }),
      });
      if (!response.ok) throw new Error("Failed");
      const data: PreviewResponse = await response.json();
      setPreview(data);
      setLastFetchTime(now);
    } catch {
      // Silent fail
    } finally {
      setIsLoadingPreview(false);
    }
  }, [skills, location, lastFetchTime]);

  useEffect(() => {
    if (skills.length > 0 && !preview) fetchPreview(true);
  }, [skills.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
      return prev.map((s) => (s.id === skillId ? { ...s, tier: TIER_ORDER[newIndex] } : s));
    });
    setPreview(null);
  }, []);

  const handleRemoveSkill = useCallback((skillId: string) => {
    setSkills((prev) => {
      const skill = prev.find((s) => s.id === skillId);
      if (skill?.isCustom) setCustomSkills((cs) => cs.filter((name) => name !== skill.name));
      return prev.filter((s) => s.id !== skillId);
    });
    setPreview(null);
  }, []);

  const handleAddSkill = useCallback((tier: SkillTier, name: string) => {
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already exists");
      return;
    }
    setSkills((prev) => [...prev, { id: `custom-${Date.now()}-${name}`, name, tier, isCustom: true }]);
    setCustomSkills((prev) => [...prev, name]);
    setPreview(null);
    toast.success("Added");
  }, [skills]);

  const handleReset = useCallback(() => {
    setSkills(originalSkills);
    setCustomSkills([]);
    setPreview(null);
    toast.success("Reset");
  }, [originalSkills]);

  const handleContinue = useCallback(() => {
    localStorage.setItem("apex_skills_config", JSON.stringify({
      skills: skills.map((s, i) => ({ name: s.name, tier: s.tier, weight: TIER_CONFIG[s.tier].weight, order: i })),
      customSkills,
    }));
    router.push("/pipeline");
  }, [skills, customSkills, router]);

  const hasChanges = JSON.stringify(skills) !== JSON.stringify(originalSkills) || customSkills.length > 0;
  const limitingCount = preview ? Object.entries(preview.perSkill).filter(([name, s]) =>
    s.isLimiting && skills.find(sk => sk.name === name)?.tier === "must-have"
  ).length : 0;

  // Empty state
  if (skills.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-24 px-4">
        <div className="max-w-md mx-auto text-center py-16">
          <Target className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">No Skills Found</h1>
          <p className="text-muted-foreground mb-6">Complete intake first to extract skills.</p>
          <Button onClick={() => router.push("/intake")} size="lg">
            Go to Intake <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const activeTabIndex = TIER_ORDER.indexOf(activeTab);
  const activeSkills = skillsByTier[activeTab];

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-40 sm:pb-32 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <Badge className="mb-1 bg-primary/20 text-primary text-xs">Step 2</Badge>
            <h1 className="text-xl sm:text-2xl font-bold">Skills Review</h1>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges} size="sm" className="h-8 w-8 p-0 sm:w-auto sm:px-3">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => fetchPreview(true)} disabled={isLoadingPreview} size="sm" className="h-8 w-8 p-0 sm:w-auto sm:px-3">
              <RefreshCw className={cn("w-4 h-4", isLoadingPreview && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Pool indicator - compact */}
        <Card className="mb-4">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Pool</span>
              </div>
              <span className="text-lg font-bold">
                {isLoadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : preview?.totalCandidates.toLocaleString() ?? "—"}
              </span>
            </div>
            {preview && (
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (preview.totalCandidates / 5000) * 100)}%` }} />
              </div>
            )}
            {limitingCount > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-yellow-500 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>{limitingCount} skill{limitingCount !== 1 && "s"} limiting pool</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MOBILE: Tabbed interface */}
        <div className="md:hidden">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
            {TIER_ORDER.map((tier) => {
              const config = TIER_CONFIG[tier];
              const count = skillsByTier[tier].length;
              const isActive = activeTab === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTab(tier)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-sm font-medium transition-all",
                    isActive ? cn("bg-background shadow-sm", config.color) : "text-muted-foreground"
                  )}
                >
                  {config.icon}
                  <span>{config.shortLabel}</span>
                  <Badge variant={isActive ? "default" : "secondary"} className="ml-1 h-5 min-w-[20px] text-xs">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          <div className={cn("rounded-xl border-2 p-3 mb-4", TIER_CONFIG[activeTab].bgColor, TIER_CONFIG[activeTab].borderColor)}>
            <div className="space-y-2 min-h-[200px]">
              {activeSkills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No {TIER_CONFIG[activeTab].label.toLowerCase()} skills</p>
                </div>
              ) : (
                activeSkills.map((skill) => (
                  <MobileSkillCard
                    key={skill.id}
                    skill={skill}
                    insight={preview?.perSkill[skill.name]}
                    isLoading={isLoadingPreview && !preview}
                    onMove={(dir) => handleMoveSkill(skill.id, dir)}
                    onRemove={() => handleRemoveSkill(skill.id)}
                    tierIndex={activeTabIndex}
                  />
                ))
              )}
            </div>

            {/* Add skill */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
              <Input
                placeholder={`Add ${TIER_CONFIG[activeTab].shortLabel.toLowerCase()} skill...`}
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSkillInput.trim()) {
                    handleAddSkill(activeTab, newSkillInput.trim());
                    setNewSkillInput("");
                  }
                }}
                className="h-10"
              />
              <Button
                onClick={() => {
                  if (newSkillInput.trim()) {
                    handleAddSkill(activeTab, newSkillInput.trim());
                    setNewSkillInput("");
                  }
                }}
                disabled={!newSkillInput.trim()}
                className="h-10 px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation hint */}
          <p className="text-center text-xs text-muted-foreground">
            ← Higher priority | Lower priority →
          </p>
        </div>

        {/* DESKTOP: Three columns */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {TIER_ORDER.map((tier) => (
            <DesktopTierColumn
              key={tier}
              tier={tier}
              skills={skillsByTier[tier]}
              preview={preview}
              isLoading={isLoadingPreview}
              onMoveSkill={handleMoveSkill}
              onRemoveSkill={handleRemoveSkill}
              onAddSkill={handleAddSkill}
            />
          ))}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur-md border-t z-50">
        <div className="max-w-6xl mx-auto">
          {/* Mobile: simple counts */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:hidden text-xs">
            <div className="flex gap-3">
              <span><span className="font-semibold text-red-400">{skillsByTier["must-have"].length}</span> must</span>
              <span><span className="font-semibold text-yellow-400">{skillsByTier["nice-to-have"].length}</span> nice</span>
              <span><span className="font-semibold text-green-400">{skillsByTier["bonus"].length}</span> bonus</span>
            </div>
            {preview && <span className="text-muted-foreground">{preview.totalCandidates.toLocaleString()} candidates</span>}
          </div>

          {/* Desktop: detailed stats */}
          <div className="hidden sm:flex items-center justify-between gap-4 mb-0">
            <div className="flex items-center gap-6 text-sm">
              <span><span className="font-semibold text-red-400">{skillsByTier["must-have"].length}</span> must-have</span>
              <span><span className="font-semibold text-yellow-400">{skillsByTier["nice-to-have"].length}</span> nice-to-have</span>
              <span><span className="font-semibold text-green-400">{skillsByTier["bonus"].length}</span> bonus</span>
              {preview && <span className="text-muted-foreground">{preview.totalCandidates.toLocaleString()} candidates</span>}
            </div>
          </div>

          <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto sm:ml-auto sm:flex mt-2 sm:mt-0">
            Continue to Pipeline <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
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
  Lightbulb,
  Users,
  GripVertical,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

interface PreviewResponse {
  totalCandidates: number;
  perSkill: Record<string, SkillInsight>;
  suggestions: Array<{
    skill: string;
    currentTier: SkillTier;
    suggestedTier: SkillTier;
    impact: string;
  }>;
  cached: boolean;
}

const TIER_CONFIG: Record<
  SkillTier,
  {
    weight: number;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }
> = {
  "must-have": {
    weight: 1.0,
    label: "Must-Have",
    shortLabel: "Required",
    icon: <Target className="w-4 h-4" />,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    description: "Candidates without this will be ranked lower",
  },
  "nice-to-have": {
    weight: 0.6,
    label: "Nice-to-Have",
    shortLabel: "Preferred",
    icon: <Star className="w-4 h-4" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    description: "Bonus points if they have it",
  },
  bonus: {
    weight: 0.3,
    label: "Bonus",
    shortLabel: "Extra",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    description: "Nice surprise, won't affect ranking much",
  },
};

const TIERS: SkillTier[] = ["must-have", "nice-to-have", "bonus"];

// Helper function to load skills from localStorage
function loadSkillsFromStorage(): {
  skills: Skill[];
  location?: string;
  hasError: boolean;
  noContext: boolean;
} {
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

      // First 4 required → must-have
      requiredSkills.slice(0, 4).forEach((name, i) => {
        initialSkills.push({
          id: `skill-${i}-${name}`,
          name,
          tier: "must-have",
          isCustom: false,
        });
      });

      // Remaining required → nice-to-have
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

      return {
        skills: initialSkills,
        location: jobContext.location,
        hasError: false,
        noContext: false,
      };
    } catch {
      return { skills: [], hasError: true, noContext: false };
    }
  }
  return { skills: [], hasError: false, noContext: true };
}

// Skill Card Component
function SkillCard({
  skill,
  insight,
  isLoading,
  onRemove,
  isDragging,
}: {
  skill: Skill;
  insight?: SkillInsight;
  isLoading: boolean;
  onRemove: (id: string) => void;
  isDragging?: boolean;
}) {
  const isLimiting = insight?.isLimiting;
  const popularity = insight ? Math.min(100, Math.round((insight.count / 5000) * 100)) : null;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 p-3 rounded-lg border bg-card transition-all",
        isDragging && "shadow-lg ring-2 ring-primary/50",
        isLimiting && skill.tier === "must-have" && "border-yellow-500/50"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground cursor-grab" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{skill.name}</span>
          {skill.isCustom && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              Custom
            </Badge>
          )}
        </div>

        {/* Popularity bar */}
        {popularity !== null && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  popularity >= 50
                    ? "bg-green-500"
                    : popularity >= 20
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
                style={{ width: `${popularity}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8">
              {popularity}%
            </span>
          </div>
        )}
      </div>

      {/* Candidate count */}
      <div className="text-right">
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        ) : insight ? (
          <span
            className={cn(
              "text-xs",
              isLimiting ? "text-yellow-500" : "text-muted-foreground"
            )}
          >
            {insight.count.toLocaleString()}
          </span>
        ) : null}
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(skill.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
      >
        <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

// Pool Meter Component
function PoolMeter({
  total,
  previous,
  isLoading,
}: {
  total: number;
  previous: number;
  isLoading: boolean;
}) {
  const change = total - previous;
  const percentage = Math.min(100, Math.round((total / 10000) * 100));

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-medium">Candidate Pool</span>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-center gap-2">
            <motion.span
              key={total}
              initial={{ scale: 1.2, color: "var(--primary)" }}
              animate={{ scale: 1, color: "inherit" }}
              className="text-2xl font-bold"
            >
              {total.toLocaleString()}
            </motion.span>
            <span className="text-muted-foreground">engineers</span>
            {change !== 0 && previous > 0 && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={change}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "flex items-center text-sm font-medium",
                    change > 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {change > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {change > 0 ? "+" : ""}
                  {change.toLocaleString()}
                </motion.span>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {percentage}% of total developer pool
      </p>
    </div>
  );
}

export default function SkillsReviewPage() {
  const router = useRouter();
  const toastShownRef = useRef(false);

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
  const [addingToTier, setAddingToTier] = useState<SkillTier | null>(null);

  // Preview state
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Show toast on mount
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

  // Fetch preview
  const fetchPreview = useCallback(
    async (force = false) => {
      if (skills.length === 0) return;

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

        if (!response.ok) throw new Error("Failed to fetch preview");

        const data: PreviewResponse = await response.json();
        if (preview) {
          setPreviousTotal(preview.totalCandidates);
        }
        setPreview(data);
      } catch {
        toast.error("Failed to load candidate counts");
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [skills, location, preview]
  );

  // Initial fetch
  useEffect(() => {
    if (skills.length > 0 && !preview) {
      fetchPreview(true);
    }
  }, [skills.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group skills by tier
  const skillsByTier = useMemo(() => {
    const grouped: Record<SkillTier, Skill[]> = {
      "must-have": [],
      "nice-to-have": [],
      bonus: [],
    };
    skills.forEach((skill) => {
      grouped[skill.tier].push(skill);
    });
    return grouped;
  }, [skills]);

  // Handle drag end
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;

      if (!destination) return;

      // Same position
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const sourceTier = source.droppableId as SkillTier;
      const destTier = destination.droppableId as SkillTier;

      setSkills((prev) => {
        const newSkills = [...prev];
        const skillIndex = newSkills.findIndex((s) => s.id === draggableId);

        if (skillIndex === -1) return prev;

        // Update the skill's tier
        newSkills[skillIndex] = {
          ...newSkills[skillIndex],
          tier: destTier,
        };

        return newSkills;
      });

      // Show feedback
      if (sourceTier !== destTier) {
        const skill = skills.find((s) => s.id === draggableId);
        toast.success(`Moved "${skill?.name}" to ${TIER_CONFIG[destTier].label}`);

        // Clear preview to trigger refresh
        setPreview(null);
        setTimeout(() => fetchPreview(true), 100);
      }
    },
    [skills, fetchPreview]
  );

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

  const handleAddSkill = useCallback(
    (tier: SkillTier) => {
      const skillName = newSkillInput.trim();
      if (!skillName) return;

      if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
        toast.error("Skill already exists");
        return;
      }

      const newSkill: Skill = {
        id: `custom-${Date.now()}-${skillName}`,
        name: skillName,
        tier,
        isCustom: true,
      };

      setSkills((prev) => [...prev, newSkill]);
      setCustomSkills((prev) => [...prev, skillName]);
      setNewSkillInput("");
      setAddingToTier(null);
      setPreview(null);
      toast.success(`Added "${skillName}" to ${TIER_CONFIG[tier].label}`);
    },
    [newSkillInput, skills]
  );

  const handleReset = useCallback(() => {
    setSkills(originalSkills);
    setCustomSkills([]);
    setNewSkillInput("");
    setPreview(null);
    toast.success("Reset to AI suggestions");
  }, [originalSkills]);

  const handleContinue = useCallback(() => {
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
    router.push("/search");
  }, [skills, customSkills, router]);

  const hasChanges =
    JSON.stringify(skills) !== JSON.stringify(originalSkills) ||
    customSkills.length > 0;

  // Get limiting skills for suggestions
  const limitingSkills = useMemo(() => {
    if (!preview) return [];
    return skills.filter(
      (s) => s.tier === "must-have" && preview.perSkill[s.name]?.isLimiting
    );
  }, [skills, preview]);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary text-xs">
              Step 2 of 3
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Drag skills to prioritize
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Drag skills between columns to adjust their importance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Pool Meter */}
        <div className="mb-6">
          <PoolMeter
            total={preview?.totalCandidates || 0}
            previous={previousTotal}
            isLoading={isLoadingPreview && !preview}
          />
        </div>

        {/* AI Suggestions */}
        {limitingSkills.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">
                  {limitingSkills.length} skill
                  {limitingSkills.length !== 1 ? "s are" : " is"} limiting your
                  pool
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try moving{" "}
                  <span className="font-medium text-foreground">
                    {limitingSkills.map((s) => s.name).join(", ")}
                  </span>{" "}
                  to Nice-to-Have to expand your candidate pool.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {TIERS.map((tier) => (
              <div
                key={tier}
                className={cn(
                  "rounded-xl border-2 p-4 transition-colors",
                  TIER_CONFIG[tier].bgColor,
                  TIER_CONFIG[tier].borderColor
                )}
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={TIER_CONFIG[tier].color}>
                    {TIER_CONFIG[tier].icon}
                  </span>
                  <h3 className={cn("font-semibold", TIER_CONFIG[tier].color)}>
                    {TIER_CONFIG[tier].label}
                  </h3>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {skillsByTier[tier].length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {TIER_CONFIG[tier].description}
                </p>

                {/* Droppable Area */}
                <Droppable droppableId={tier}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-2 min-h-[200px] p-2 rounded-lg transition-colors",
                        snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/30"
                      )}
                    >
                      {skillsByTier[tier].map((skill, index) => (
                        <Draggable
                          key={skill.id}
                          draggableId={skill.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <SkillCard
                                skill={skill}
                                insight={preview?.perSkill[skill.name]}
                                isLoading={isLoadingPreview && !preview}
                                onRemove={handleRemoveSkill}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Add skill input */}
                      {addingToTier === tier ? (
                        <div className="flex gap-2">
                          <Input
                            autoFocus
                            placeholder="Skill name..."
                            value={newSkillInput}
                            onChange={(e) => setNewSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSkill(tier);
                              if (e.key === "Escape") setAddingToTier(null);
                            }}
                            className="h-9 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddSkill(tier)}
                            disabled={!newSkillInput.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingToTier(tier)}
                          className="w-full p-2 border border-dashed rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add skill
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button onClick={handleContinue} size="lg" className="w-full sm:w-auto">
            <span>Continue to Search</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/adminContext";
import { getDemoCandidates, DEMO_JOB } from "@/lib/demoData";
import { deserializePipelineState, serializePipelineState } from "@/lib/pipelineUrlState";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Users,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  Briefcase,
  MapPin,
  Star,
  Trash2,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  BarChart3,
  X,
  FileText,
  Link as LinkIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  HelpCircle,
  Check,
  AlertTriangle,
  List,
  LayoutGrid,
  Code2,
  Network,
} from "lucide-react";
import OutreachModal from "@/components/OutreachModal";
import ScoreBadge from "@/components/ScoreBadge";
import { BehavioralBadges } from "@/components/BehavioralBadges";
import { CandidatePipelineItem } from "@/components/pipeline/CandidatePipelineItem";
import { PipelineSplitView } from "@/components/pipeline/PipelineSplitView";
import { PipelineLoadingScramble } from "@/components/ui/loading-scramble";
import { ShortlistPanel } from "@/components/pipeline/ShortlistPanel";
import { PipelineKanban, PipelineCandidate, PipelineStage } from "@/components/pipeline/PipelineKanban";
import { FunnelAnalyticsPanel } from "@/components/pipeline/FunnelAnalyticsPanel";
import { TechStackFilter } from "@/components/pipeline/TechStackFilter";
import { TechStackFilter as TechStackFilterType, filterByTechStack } from "@/lib/techStackMatching";
import ScoreLegend from "@/components/ScoreLegend";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { PhaseIndicator } from "@/components/PhaseIndicator";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useLanguage } from "@/lib/i18n";
import { candidateService } from "@/services/candidateService";
import type { Candidate as GlobalCandidate } from "@/types";

interface ScoreBreakdown {
  requiredMatched: string[];
  requiredMissing: string[];
  preferredMatched: string[];
  locationMatch: "exact" | "remote" | "none";
  baseScore: number;
  skillsScore: number;
  preferredScore: number;
  locationScore: number;
}

// Skills config from skills-review page
interface SkillsConfigItem {
  name: string;
  tier: "must-have" | "nice-to-have" | "bonus";
  weight: number;
  order: number;
}

interface HardRequirement {
  id: string;
  type: 'location' | 'experience' | 'language';
  value: string | number;
  enabled: boolean;
  isMustHave: boolean;
}

interface HardRequirementsConfig {
  requirements: HardRequirement[];
  enabled: boolean;
}

interface SkillsConfig {
  skills: SkillsConfigItem[];
  customSkills: string[];
  hardRequirements?: HardRequirementsConfig;
}

interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  skills?: string[];
  createdAt?: string;
  risks?: string[];
  keyEvidence?: string[];
  scoreBreakdown?: ScoreBreakdown & {
    requiredMatched?: string[];
    requiredMatchedInferred?: string[];
    requiredMissing?: string[];
    preferredMatched?: string[];
    locationMatch?: "exact" | "remote" | "none";
    baseScore?: number;
    skillsScore?: number;
    preferredScore?: number;
    locationScore?: number;
  };
  persona?: {
    archetype?: string;
    riskAssessment?: {
      attritionRisk?: string;
    };
  };
  // Demo profile fields
  buildprint?: any;
  topRepos?: any[];
  languages?: any[];
  hasReceipts?: boolean;
  yearsExperience?: number;
  shortlistSummary?: string;
  sourceUrl?: string;
  rawProfileText?: string;
}

function normalizeText(value?: string | null): string {
  return (value || "").toLowerCase().trim();
}

function hasSkillSignal(candidate: Candidate, skill: string): boolean {
  const needle = normalizeText(skill);
  if (!needle) return false;
  const skillPool = (candidate.skills || []).map((s) => normalizeText(s));
  const textPool = [
    candidate.currentRole,
    candidate.company,
    candidate.rawProfileText,
    ...(candidate.keyEvidence || []),
  ]
    .map((s) => normalizeText(s || ""))
    .join(" ");

  return (
    skillPool.some((s) => s.includes(needle) || needle.includes(s)) ||
    textPool.includes(needle)
  );
}

function rerankCandidatesForContext(
  input: Candidate[],
  jobContext: { requiredSkills?: string[]; preferredSkills?: string[]; location?: string } | null
): Candidate[] {
  if (!jobContext) return input;

  let mustHave: string[] = [];
  let niceToHave: string[] = [];

  try {
    const raw = localStorage.getItem("apex_skills_config");
    if (raw) {
      const parsed = JSON.parse(raw) as SkillsConfig;
      mustHave = parsed.skills
        .filter((s) => s.tier === "must-have")
        .map((s) => s.name);
      niceToHave = parsed.skills
        .filter((s) => s.tier === "nice-to-have" || s.tier === "bonus")
        .map((s) => s.name);
    }
  } catch {
    // ignore malformed local draft; fall back to job context
  }

  if (mustHave.length === 0) {
    mustHave = jobContext.requiredSkills || [];
  }
  if (niceToHave.length === 0) {
    niceToHave = jobContext.preferredSkills || [];
  }

  const locationNeedle = normalizeText(jobContext.location);

  const rescored = input.map((candidate) => {
    const requiredMatched = mustHave.filter((skill) => hasSkillSignal(candidate, skill));
    const requiredMissing = mustHave.filter((skill) => !requiredMatched.includes(skill));
    const preferredMatched = niceToHave.filter((skill) => hasSkillSignal(candidate, skill));

    const locationText = normalizeText(candidate.location);
    const locationMatch: "exact" | "remote" | "none" =
      locationNeedle && locationText && (locationText.includes(locationNeedle) || locationNeedle.includes(locationText))
        ? "exact"
        : locationText.includes("remote") || locationNeedle.includes("remote")
          ? "remote"
          : "none";

    const baseScore = 30;
    const mustScore = requiredMatched.length * 12 - requiredMissing.length * 8;
    const preferredScore = preferredMatched.length * 4;
    const locationScore = locationMatch === "exact" ? 10 : locationMatch === "remote" ? 4 : 0;
    const finalScore = Math.max(0, Math.min(99, baseScore + mustScore + preferredScore + locationScore));

    return {
      ...candidate,
      alignmentScore: finalScore,
      scoreBreakdown: {
        requiredMatched,
        requiredMissing,
        preferredMatched,
        locationMatch,
        baseScore,
        skillsScore: mustScore,
        preferredScore,
        locationScore,
      },
    };
  });

  // If there are must-haves, push candidates with 0 matches to the bottom.
  if (mustHave.length > 0) {
    rescored.sort((a, b) => {
      const aReq = a.scoreBreakdown?.requiredMatched?.length || 0;
      const bReq = b.scoreBreakdown?.requiredMatched?.length || 0;
      if (aReq === 0 && bReq > 0) return 1;
      if (bReq === 0 && aReq > 0) return -1;
      return b.alignmentScore - a.alignmentScore;
    });

    // In strict mode we should never surface obvious mismatches.
    // Keep only candidates that match at least one must-have signal.
    const qualified = rescored.filter(
      (candidate) => (candidate.scoreBreakdown?.requiredMatched?.length || 0) > 0
    );
    return qualified;
  } else {
    rescored.sort((a, b) => b.alignmentScore - a.alignmentScore);
  }

  return rescored;
}

export default function PipelinePage() {
  const { t } = useLanguage();
  const { isAdmin, isDemoMode } = useAdmin();
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminSuffix = ""; // No longer needed with context-based admin
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  // isInitializing prevents the empty-state flash while isDemoMode resolves after hydration
  const [isInitializing, setIsInitializing] = useState(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobContext, setJobContext] = useState<{
    title: string;
    company: string;
    requiredSkills?: string[];
    location?: string;
  } | null>(null);
  const urlStateInitialized = useRef(false);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Initialize state from URL params
  const initialUrlState = useMemo(() => {
    return deserializePipelineState(searchParams);
  }, [searchParams]);

  // Sorting & Filtering - initialized from URL state
  const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "name-asc" | "name-desc">(initialUrlState.sort);
  const [filterScore, setFilterScore] = useState<"high" | "medium" | "low" | null>(initialUrlState.filter);
  const [showFilters, setShowFilters] = useState(false);

  // Hard requirements filter - exclude candidates missing must-have skills
  const [enforceHardRequirements, setEnforceHardRequirements] = useState(false);
  const [mustHaveSkills, setMustHaveSkills] = useState<string[]>([]);
  const [hardRequirementsConfig, setHardRequirementsConfig] = useState<HardRequirementsConfig | undefined>(undefined);

  // Load must-have skills and hard requirements from skills config
  useEffect(() => {
    const skillsConfigStr = localStorage.getItem("apex_skills_config");
    if (skillsConfigStr) {
      try {
        const config: SkillsConfig = JSON.parse(skillsConfigStr);
        const mustHaves = config.skills
          .filter(s => s.tier === "must-have")
          .map(s => s.name.toLowerCase());
        setMustHaveSkills(mustHaves);
        setHardRequirementsConfig(config.hardRequirements || undefined);
        setEnforceHardRequirements(false); // Always default to broad match
      } catch {}
    }
  }, []);

  // Histogram filter state
  const [filterRange, setFilterRange] = useState<string | null>(initialUrlState.filterRange);

  // View mode state (list, split, or kanban)
  const [viewMode, setViewMode] = useState<"list" | "split" | "kanban">(initialUrlState.viewMode);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Multi-select for comparison - initialized from URL state
  const [selectedIds, setSelectedIds] = useState<string[]>(initialUrlState.selected);
  
  // Kanban stage tracking - maps candidateId to their pipeline stage
  const [candidateStages, setCandidateStages] = useState<Record<string, PipelineStage>>({});

  // Tech stack filter
  const [techStackFilter, setTechStackFilter] = useState<TechStackFilterType>({
    required: [],
    preferred: [],
    exclude: [],
  });
  const [showTechStackFilter, setShowTechStackFilter] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Scroll to candidate from URL state
  useEffect(() => {
    if (initialUrlState.scrollTo && candidates.length > 0 && !urlStateInitialized.current) {
      urlStateInitialized.current = true;
      const element = document.getElementById(`candidate-${initialUrlState.scrollTo}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [initialUrlState.scrollTo, candidates]);

  // Update URL when filter/sort state changes (shallow routing)
  useEffect(() => {
    if (!urlStateInitialized.current && candidates.length === 0) return;

    const params = serializePipelineState({
      sort: sortBy,
      filter: filterScore,
      filterRange,
      selected: selectedIds,
      viewMode,
    });

    const newUrl = params.toString() ? `/pipeline?${params.toString()}` : '/pipeline';
    router.replace(newUrl, { scroll: false });
  }, [sortBy, filterScore, filterRange, selectedIds, viewMode, router, candidates.length]);

  // Outreach modal state
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachCandidate, setOutreachCandidate] = useState<Candidate | null>(null);

  // Note: expandedExplanation state moved to CandidatePipelineItem component

  // Load job context and candidates on mount
  useEffect(() => {
    // Use a local flag to handle React Strict Mode properly
    // This ensures state updates only happen if the component is still mounted
    let isActive = true;

    const initializePipeline = async () => {
      setPipelineError(null);
      // DEMO MODE: Load real demo profiles with receipts
      if (isDemoMode) {
        console.log("[Pipeline] Demo mode - loading real demo profiles");
        const demoJobContext = {
          title: DEMO_JOB.title,
          company: DEMO_JOB.company,
          requiredSkills: DEMO_JOB.requiredSkills,
          preferredSkills: DEMO_JOB.preferredSkills,
          location: DEMO_JOB.location,
        };

        // Demo candidates already have calibrated buildprint scores — sort by score, don't rerank.
        const rawDemoCandidates = getDemoCandidates() as unknown as Candidate[];
        const sortedDemoCandidates = [...rawDemoCandidates].sort(
          (a, b) => (b.alignmentScore || 0) - (a.alignmentScore || 0)
        );
        if (isActive) {
          setCandidates(sortedDemoCandidates);
          setJobContext(demoJobContext);
        }
        return; // Skip normal initialization in demo mode
      }

      const stored = localStorage.getItem("apex_job_context");
      let parsedJobContext = null;
      if (stored) {
        try {
          parsedJobContext = JSON.parse(stored);
          if (isActive) setJobContext(parsedJobContext);
        } catch {
          // Ignore
        }
      }

      // Check if we just came from intake (fresh job context)
      const pendingAutoSearch = localStorage.getItem("apex_pending_auto_search");
      const freshFromIntake = pendingAutoSearch === "true";

      // Local fallback candidates (used for QA/demo/offline continuity)
      let localCandidates: Candidate[] = [];
      const storedCandidates = localStorage.getItem("apex_candidates");
      if (storedCandidates) {
        try {
          const parsed = JSON.parse(storedCandidates);
          if (Array.isArray(parsed)) {
            localCandidates = parsed as Candidate[];
          }
        } catch {
          // Ignore invalid local cache
        }
      }

      // Create a hash of job context to detect changes
      const jobContextHash = parsedJobContext
        ? JSON.stringify({
            title: parsedJobContext.title,
            skills: parsedJobContext.requiredSkills?.slice(0, 5),
            location: parsedJobContext.location,
          })
        : null;
      const storedJobHash = localStorage.getItem("apex_job_context_hash");

      // Check if job context changed - if so, clear old candidates
      const jobContextChanged = !!(jobContextHash && storedJobHash !== jobContextHash);

      let existingCandidates: Candidate[] = [];

      // Load existing candidates from API only in authenticated mode.
      if (status === "authenticated" && !jobContextChanged && !freshFromIntake) {
        try {
          const { candidates: apiCandidates } = await candidateService.fetchAll({ sourceType: 'GITHUB' });
          existingCandidates = (apiCandidates as unknown as Candidate[]) || [];
          if (existingCandidates.length === 0 && localCandidates.length > 0) {
            existingCandidates = localCandidates;
            console.log("[Pipeline] Using local fallback candidates:", existingCandidates.length);
          }
          existingCandidates = rerankCandidatesForContext(existingCandidates, parsedJobContext);
          if (isActive) setCandidates(existingCandidates);
          console.log("[Pipeline] Loaded", existingCandidates.length, "existing candidates from API");
        } catch {
          if (localCandidates.length > 0) {
            existingCandidates = localCandidates;
            existingCandidates = rerankCandidatesForContext(existingCandidates, parsedJobContext);
            if (isActive) setCandidates(existingCandidates);
            console.log("[Pipeline] API load failed, using local fallback candidates:", existingCandidates.length);
            if (isActive) {
              setPipelineError("Live pipeline data unavailable. Showing local fallback candidates.");
            }
          } else if (isActive) {
            setPipelineError("Failed to load candidates from API. Try refreshing.");
          }
        }
      } else if (status !== "authenticated" && !jobContextChanged && !freshFromIntake) {
        if (localCandidates.length > 0) {
          existingCandidates = localCandidates;
          existingCandidates = rerankCandidatesForContext(existingCandidates, parsedJobContext);
          if (isActive) setCandidates(existingCandidates);
        } else {
          // No local data and not authenticated — show demo candidates as fallback
          const demoCandidates = rerankCandidatesForContext(
            getDemoCandidates() as unknown as Candidate[],
            parsedJobContext || {
              title: DEMO_JOB.title,
              requiredSkills: DEMO_JOB.requiredSkills,
              preferredSkills: DEMO_JOB.preferredSkills,
              location: DEMO_JOB.location,
            }
          );
          existingCandidates = demoCandidates as unknown as Candidate[];
          if (isActive) setCandidates(existingCandidates);
        }
      } else if (jobContextChanged || freshFromIntake) {
        // Start fresh when job context changes
        if (isActive) setCandidates([]);
        console.log("[Pipeline] Starting fresh - jobContextChanged:", jobContextChanged, "freshFromIntake:", freshFromIntake);
      }

      // Determine if we should auto-search
      const hasRequiredSkills = parsedJobContext?.requiredSkills?.length > 0;
      const needsCandidates = existingCandidates.length === 0 || jobContextChanged || freshFromIntake;
      const shouldAutoSearch = hasRequiredSkills && needsCandidates;

      if (shouldAutoSearch && parsedJobContext?.requiredSkills) {
        // Clear the pending flag
        localStorage.removeItem("apex_pending_auto_search");

        // Store the new job context hash
        if (jobContextHash) {
          localStorage.setItem("apex_job_context_hash", jobContextHash);
        }

        // Use only top 2 skills for search - more specific queries return 0 results from GitHub
        const skills = parsedJobContext.requiredSkills.slice(0, 2);
        const query = skills.join(" ");
        console.log("[Pipeline] Auto-searching with query:", query);

        if (query) {
          if (isActive) {
            setSearchQuery(query);
            setLoading(true);
          }

          try {
            const response = await fetch(
              `/api/search?q=${encodeURIComponent(query)}&perPage=15`
            );
            const data = await response.json();
            console.log("[Pipeline] Search returned", data.users?.length || 0, "users");

            if (!isActive) return; // Component unmounted, don't update state

            if (data.users && data.users.length > 0) {
              // Get job context for scoring
              const jobReqs = parsedJobContext || {};

              const newCandidates = data.users.map((user: {
                username: string;
                name: string;
                avatar: string;
                bio: string;
                location: string;
                company: string;
                skills?: string[];
                score: number;
              }) => {
                const { score, breakdown } = calculateAlignmentScore(
                  { skills: user.skills || [], bio: user.bio || "", location: user.location || "" },
                  {
                    requiredSkills: jobReqs.requiredSkills,
                    preferredSkills: jobReqs.preferredSkills,
                    location: jobReqs.location,
                  }
                );

                return {
                  id: user.username,
                  githubUsername: user.username,
                  name: user.name || user.username,
                  currentRole: user.bio?.split(/[.\n]/)[0]?.trim() || "Developer",
                  company: user.company || "Independent",
                  location: user.location || "Remote",
                  alignmentScore: score,
                  scoreBreakdown: breakdown,
                  avatar: user.avatar,
                  skills: user.skills || [],
                  createdAt: new Date().toISOString(),
                };
              });

              // Sort by alignment score
              newCandidates.sort((a: Candidate, b: Candidate) => b.alignmentScore - a.alignmentScore);

              setCandidates(newCandidates);
              // Persist new candidates to API (best-effort)
              let savedCount = 0;
              for (const c of newCandidates) {
                try {
                  await candidateService.create({ ...(c as unknown as Partial<GlobalCandidate>), name: c.name, sourceType: 'GITHUB', githubUsername: (c as any).githubUsername } as any);
                  savedCount++;
                } catch (saveErr) {
                  console.warn("[Pipeline] Could not persist candidate", c.name, ":", saveErr instanceof Error ? saveErr.message : saveErr);
                }
              }
            }
          } catch (error) {
            console.error("[Pipeline] Auto-search error:", error);
            if (isActive) {
              setPipelineError("Auto-search failed. Try running a manual search below.");
            }
          } finally {
            if (isActive) setLoading(false);
          }
        }
      } else {
        // Clear flag even if no auto-search needed
        if (freshFromIntake) {
          localStorage.removeItem("apex_pending_auto_search");
        }
      }
    };

    initializePipeline().finally(() => {
      if (isActive) setIsInitializing(false);
    });

    // Cleanup function - set isActive to false when component unmounts
    return () => {
      isActive = false;
    };
  }, [isDemoMode, status]); // Re-run if demo mode or auth status changes

  // Calculate alignment score based on job requirements and skills config
  const calculateAlignmentScore = (
    user: { skills?: string[]; bio: string; location: string },
    jobRequirements: { requiredSkills?: string[]; preferredSkills?: string[]; location?: string }
  ): {
    score: number;
    breakdown: {
      requiredMatched: string[];
      requiredMatchedInferred: string[];
      requiredMissing: string[];
      preferredMatched: string[];
      locationMatch: "exact" | "remote" | "none";
      baseScore: number;
      skillsScore: number;
      preferredScore: number;
      locationScore: number;
    };
  } => {
    const baseScore = 40;
    let skillsScore = 0;
    let preferredScore = 0;
    let locationScore = 0;

    const userSkillsLower = (user.skills || []).map((s) => s.toLowerCase());
    const userBioLower = (user.bio || "").toLowerCase();

    // Helpers to check skill match source
    const userHasSkillViaTopics = (skillName: string): boolean => {
      const skillLower = skillName.toLowerCase();
      return userSkillsLower.some((s) => s.includes(skillLower) || skillLower.includes(s));
    };
    const userHasSkillViaBio = (skillName: string): boolean => {
      return userBioLower.includes(skillName.toLowerCase());
    };
    const userHasSkill = (skillName: string): boolean =>
      userHasSkillViaTopics(skillName) || userHasSkillViaBio(skillName);

    // Try to use skills config from skills-review page (has tier weights)
    const skillsConfigStr = typeof window !== "undefined"
      ? localStorage.getItem("apex_skills_config")
      : null;

    const requiredMatched: string[] = [];
    const requiredMatchedInferred: string[] = []; // Matched via bio text only, not GitHub topics
    const requiredMissing: string[] = [];
    const preferredMatched: string[] = [];

    if (skillsConfigStr) {
      // Use tiered scoring from skills config
      try {
        const skillsConfig: SkillsConfig = JSON.parse(skillsConfigStr);
        const mustHaves = skillsConfig.skills.filter(s => s.tier === "must-have");
        const niceToHaves = skillsConfig.skills.filter(s => s.tier === "nice-to-have");
        const bonuses = skillsConfig.skills.filter(s => s.tier === "bonus");

        // Weighted scoring:
        // must-have match: +8 points each (max ~32 for 4 skills)
        // must-have MISS: -5 points each (penalty)
        // nice-to-have match: +4 points each (max ~16 for 4 skills)
        // bonus match: +2 points each (max ~6 for 3 skills)

        mustHaves.forEach(skill => {
          if (userHasSkillViaTopics(skill.name)) {
            skillsScore += 8;
            requiredMatched.push(skill.name);
          } else if (userHasSkillViaBio(skill.name)) {
            skillsScore += 8;
            requiredMatched.push(skill.name);
            requiredMatchedInferred.push(skill.name); // Bio-only: unverified
          } else {
            skillsScore -= 5; // Penalty for missing must-have
            requiredMissing.push(skill.name);
          }
        });

        niceToHaves.forEach(skill => {
          if (userHasSkill(skill.name)) {
            preferredScore += 4;
            preferredMatched.push(skill.name);
          }
        });

        bonuses.forEach(skill => {
          if (userHasSkill(skill.name)) {
            preferredScore += 2;
            preferredMatched.push(skill.name);
          }
        });

      } catch (e) {
        console.error("Failed to parse skills config:", e);
        // Fall through to legacy scoring
      }
    } else {
      // Legacy scoring: use job requirements directly
      const requiredSkills = jobRequirements.requiredSkills || [];
      const preferredSkills = jobRequirements.preferredSkills || [];

      requiredSkills.forEach((skill) => {
        if (userHasSkillViaTopics(skill)) {
          requiredMatched.push(skill);
        } else if (userHasSkillViaBio(skill)) {
          requiredMatched.push(skill);
          requiredMatchedInferred.push(skill); // Bio-only: unverified
        } else {
          requiredMissing.push(skill);
        }
      });
      if (requiredSkills.length > 0) {
        skillsScore = Math.round((requiredMatched.length / requiredSkills.length) * 35);
      }

      preferredSkills.forEach((skill) => {
        if (userHasSkill(skill)) {
          preferredMatched.push(skill);
        }
      });
      if (preferredSkills.length > 0) {
        preferredScore = Math.round((preferredMatched.length / preferredSkills.length) * 15);
      }
    }

    // Location match
    let locationMatch: "exact" | "remote" | "none" = "none";
    if (jobRequirements.location && user.location) {
      const jobLocLower = jobRequirements.location.toLowerCase();
      const userLocLower = user.location.toLowerCase();
      if (userLocLower.includes(jobLocLower) || jobLocLower.includes(userLocLower)) {
        locationScore = 10;
        locationMatch = "exact";
      } else if (userLocLower.includes("remote") || jobLocLower.includes("remote")) {
        locationScore = 5;
        locationMatch = "remote";
      }
    }

    // No GitHub evidence available at search time — cap at 60. Score improves after enrichment.
    const totalScore = Math.min(60, Math.max(30, baseScore + skillsScore + preferredScore + locationScore));

    return {
      score: totalScore,
      breakdown: {
        requiredMatched,
        requiredMatchedInferred,
        requiredMissing,
        preferredMatched,
        locationMatch,
        baseScore,
        skillsScore,
        preferredScore,
        locationScore,
      },
    };
  };

  // Auto-search function (separate from manual search to handle initial load)
  const autoSearchCandidates = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setPipelineError(null);

    try {
      // Fetch more candidates to have better selection
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&perPage=15`
      );
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        // Get job context for scoring
        const storedContext = localStorage.getItem("apex_job_context");
        const jobReqs = storedContext ? JSON.parse(storedContext) : {};

        const newCandidates = data.users.map((user: {
          username: string;
          name: string;
          avatar: string;
          bio: string;
          location: string;
          company: string;
          skills?: string[];
          score: number;
        }) => {
          // Calculate alignment score based on job requirements
          const { score, breakdown } = calculateAlignmentScore(
            { skills: user.skills || [], bio: user.bio || "", location: user.location || "" },
            {
              requiredSkills: jobReqs.requiredSkills,
              preferredSkills: jobReqs.preferredSkills,
              location: jobReqs.location,
            }
          );

          return {
            id: user.username,
            githubUsername: user.username,
            name: user.name || user.username,
            currentRole: user.bio?.split(/[.\n]/)[0]?.trim() || "Developer",
            company: user.company || "Independent",
            location: user.location || "Remote",
            alignmentScore: score,
            scoreBreakdown: breakdown,
            avatar: user.avatar,
            skills: user.skills || [],
            createdAt: new Date().toISOString(),
          };
        });

        // Sort by alignment score
        newCandidates.sort((a: Candidate, b: Candidate) => b.alignmentScore - a.alignmentScore);

        setCandidates(newCandidates);
        // Persist to API (best-effort)
        for (const c of newCandidates) {
          try {
            await candidateService.create({ ...(c as unknown as Partial<GlobalCandidate>), name: c.name, sourceType: 'GITHUB', githubUsername: (c as any).githubUsername } as any);
          } catch (saveErr) {
            console.warn("[Pipeline] autoSearch: could not persist candidate", c.name, ":", saveErr instanceof Error ? saveErr.message : saveErr);
          }
        }
      }
    } catch (error) {
      console.error("Auto-search error:", error);
      setPipelineError("Auto-search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setPipelineError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&perPage=15`
      );
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        // Get job context for scoring
        const storedContext = localStorage.getItem("apex_job_context");
        const jobReqs = storedContext ? JSON.parse(storedContext) : {};

        const newCandidates = data.users.map((user: {
          username: string;
          name: string;
          avatar: string;
          bio: string;
          location: string;
          company: string;
          skills?: string[];
          score: number;
        }) => {
          // Calculate alignment score based on job requirements
          const { score, breakdown } = calculateAlignmentScore(
            { skills: user.skills || [], bio: user.bio || "", location: user.location || "" },
            {
              requiredSkills: jobReqs.requiredSkills,
              preferredSkills: jobReqs.preferredSkills,
              location: jobReqs.location,
            }
          );

          return {
            id: user.username,
            githubUsername: user.username,
            name: user.name || user.username,
            currentRole: user.bio?.split(/[.\n]/)[0]?.trim() || "Developer",
            company: user.company || "Independent",
            location: user.location || "Remote",
            alignmentScore: score,
            scoreBreakdown: breakdown,
            avatar: user.avatar,
            skills: user.skills || [],
            createdAt: new Date().toISOString(),
          };
        });

        // Persist new candidates to API (best-effort)
        for (const c of newCandidates) {
          try {
            await candidateService.create({ ...(c as unknown as Partial<GlobalCandidate>), name: c.name, sourceType: 'GITHUB', githubUsername: (c as any).githubUsername } as any);
          } catch (saveErr) {
            console.warn("[Pipeline] handleSearch: could not persist candidate", c.name, ":", saveErr instanceof Error ? saveErr.message : saveErr);
          }
        }

        setCandidates((prev) => {
          const merged = [...newCandidates, ...prev];
          const unique = merged.filter(
            (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
          );
          // Sort by alignment score
          unique.sort((a, b) => b.alignmentScore - a.alignmentScore);
          return unique;
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setPipelineError("Search failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    setPipelineError(null);

    try {
      const response = await fetch("/api/profile/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: `imported-${Date.now()}`,
          candidateName: "Imported Candidate",
          currentRole: "Unknown",
          company: "Unknown",
          location: "Unknown",
          skills: [],
          rawText: importText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCandidate: Candidate = {
          id: `imported-${Date.now()}`,
          name: data.name || "Imported Candidate",
          currentRole: data.currentRole || "Unknown",
          company: data.company || "Unknown",
          location: data.location || "Unknown",
          alignmentScore: data.alignmentScore || 70,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${Date.now()}`,
          skills: [],
          createdAt: new Date().toISOString(),
          keyEvidence: data.keyEvidence,
          risks: data.risks,
        };

        // Persist to API
        try {
          await candidateService.create({ ...(newCandidate as unknown as Partial<GlobalCandidate>), name: newCandidate.name, sourceType: 'MANUAL' });
        } catch {
          // Best-effort
        }

        setCandidates((prev) => [newCandidate, ...prev]);

        setShowImport(false);
        setImportText("");
      }
    } catch (error) {
      console.error("Import error:", error);
      setPipelineError("Import failed. Try again or use a different resume text.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    if (confirm(t("pipeline.candidate.deleteConfirm"))) {
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      // Delete from API (best-effort)
      try {
        await candidateService.delete(id);
      } catch {
        // Ignore API errors on delete
      }
    }
  }, [t]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      // No limit on selection - users can select as many candidates as needed
      return [...prev, id];
    });
  }, []);

  // Kanban stage change handler
  const handleStageChange = useCallback(async (candidateId: string, newStage: PipelineStage) => {
    setCandidateStages((prev) => ({
      ...prev,
      [candidateId]: newStage,
    }));
    // Persist stage change to API
    try {
      await candidateService.updateStage(candidateId, newStage);
    } catch {
      // Best-effort — stage is already updated optimistically in local state
    }
  }, []);

  // Load candidate stages from localStorage on mount (fallback for existing data)
  useEffect(() => {
    const stored = localStorage.getItem("apex_candidate_stages");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCandidateStages(parsed);
      } catch (err) {
        console.error("Failed to parse candidate stages:", err);
      }
    }
  }, []);

  // Sorting
  const sortedCandidates = useMemo(() => {
    const sorted = [...candidates];
    switch (sortBy) {
      case "score-desc":
        return sorted.sort((a, b) => b.alignmentScore - a.alignmentScore);
      case "score-asc":
        return sorted.sort((a, b) => a.alignmentScore - b.alignmentScore);
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }, [candidates, sortBy]);

  // Filtering
  const filteredCandidates = useMemo(() => {
    let filtered = sortedCandidates;

    // Apply hard requirements filter - exclude candidates missing must-have skills
    if (enforceHardRequirements && mustHaveSkills.length > 0) {
      filtered = filtered.filter((c) => {
        // Reuse the same signal matcher used by scoring to avoid UI contradictions.
        return mustHaveSkills.every((mustHave) => hasSkillSignal(c, mustHave));
      });
    }

    // Apply new hard requirements (location, experience, languages)
    if (hardRequirementsConfig?.enabled && hardRequirementsConfig.requirements.length > 0) {
      const enabledReqs = hardRequirementsConfig.requirements.filter(r => r.enabled && r.isMustHave);
      
      filtered = filtered.filter((candidate) => {
        return enabledReqs.every(req => {
          if (req.type === 'location') {
            const candidateLocation = candidate.location?.toLowerCase() || '';
            const requiredLocation = String(req.value).toLowerCase();

            // No location data on candidate — can't match
            if (!candidateLocation) return false;

            // Special cases
            if (requiredLocation === 'remote') return true; // Everyone can work remote
            if (requiredLocation === 'europe') {
              const europeanCountries = ['denmark', 'sweden', 'norway', 'finland', 'germany',
                                         'uk', 'united kingdom', 'france', 'spain', 'italy',
                                         'netherlands', 'poland', 'austria', 'switzerland',
                                         'belgium', 'portugal', 'czech', 'hungary', 'romania'];
              return europeanCountries.some(country => candidateLocation.includes(country));
            }

            // Alias map: canonical country name → common aliases & city names
            const locationAliases: Record<string, string[]> = {
              'denmark':         ['denmark', 'danmark', 'dk', 'copenhagen', 'københavn', 'aarhus', 'odense', 'aalborg', 'esbjerg'],
              'sweden':          ['sweden', 'sverige', 'se', 'stockholm', 'gothenburg', 'göteborg', 'malmö', 'malmo', 'uppsala'],
              'norway':          ['norway', 'norge', 'no', 'oslo', 'bergen', 'stavanger', 'trondheim'],
              'finland':         ['finland', 'suomi', 'fi', 'helsinki', 'tampere', 'turku', 'espoo'],
              'germany':         ['germany', 'deutschland', 'de', 'berlin', 'munich', 'münchen', 'hamburg', 'frankfurt', 'cologne', 'köln'],
              'netherlands':     ['netherlands', 'holland', 'nl', 'amsterdam', 'rotterdam', 'the hague', 'den haag', 'utrecht'],
              'united kingdom':  ['united kingdom', 'uk', 'gb', 'england', 'scotland', 'wales', 'london', 'manchester', 'birmingham', 'edinburgh'],
              'france':          ['france', 'fr', 'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux'],
              'spain':           ['spain', 'españa', 'es', 'madrid', 'barcelona', 'valencia', 'seville'],
              'portugal':        ['portugal', 'pt', 'lisbon', 'lisboa', 'porto'],
              'austria':         ['austria', 'österreich', 'at', 'vienna', 'wien', 'graz', 'salzburg'],
              'switzerland':     ['switzerland', 'schweiz', 'ch', 'zurich', 'zürich', 'geneva', 'genève', 'bern'],
              'poland':          ['poland', 'polska', 'pl', 'warsaw', 'warszawa', 'krakow', 'kraków', 'wrocław'],
              'italy':           ['italy', 'italia', 'it', 'rome', 'roma', 'milan', 'milano', 'naples', 'turin'],
              'usa':             ['usa', 'united states', 'us', 'america', 'new york', 'san francisco', 'los angeles', 'seattle', 'chicago', 'boston', 'austin'],
              'canada':          ['canada', 'ca', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa'],
              'australia':       ['australia', 'au', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide'],
            };

            // Look up aliases for the required location (fall back to the value itself)
            const aliases = locationAliases[requiredLocation] ?? [requiredLocation];
            return aliases.some(alias => candidateLocation.includes(alias));
          }
          
          if (req.type === 'experience') {
            // Note: yearsExperience not available in Candidate type
            // Skip experience filtering for now
            return true;
          }
          
          if (req.type === 'language') {
            const requiredLang = String(req.value).toLowerCase();
            const candidateBio = `${candidate.currentRole} ${candidate.company} ${candidate.location}`.toLowerCase();
            // Simple heuristic: check if language name appears in bio or location
            // In a real app, you'd have structured language data
            return candidateBio.includes(requiredLang);
          }
          
          return true;
        });
      });
    }

    // Apply histogram range filter
    if (filterRange) {
      filtered = filtered.filter((c) => {
        switch (filterRange) {
          case "90-100":
            return c.alignmentScore >= 90;
          case "80-89":
            return c.alignmentScore >= 80 && c.alignmentScore < 90;
          case "70-79":
            return c.alignmentScore >= 70 && c.alignmentScore < 80;
          case "60-69":
            return c.alignmentScore >= 60 && c.alignmentScore < 70;
          case "0-59":
            return c.alignmentScore < 60;
          default:
            return true;
        }
      });
    }

    // Apply preset score filter
    if (filterScore) {
      switch (filterScore) {
        case "high":
          filtered = filtered.filter((c) => c.alignmentScore >= 80);
          break;
        case "medium":
          filtered = filtered.filter(
            (c) => c.alignmentScore >= 50 && c.alignmentScore < 80
          );
          break;
        case "low":
          filtered = filtered.filter((c) => c.alignmentScore < 50);
          break;
      }
    }

    // Apply tech stack filter
    const hasTechFilter = techStackFilter.required.length > 0 || 
                          techStackFilter.preferred.length > 0 || 
                          techStackFilter.exclude.length > 0;
    if (hasTechFilter) {
      filtered = filterByTechStack(filtered, techStackFilter, techStackFilter.required.length > 0);
    }

    return filtered;
  }, [sortedCandidates, filterScore, filterRange, enforceHardRequirements, mustHaveSkills, techStackFilter, hardRequirementsConfig]);

  // Convert candidates to Kanban format
  const kanbanCandidates: PipelineCandidate[] = useMemo(() => {
    return filteredCandidates.map((c) => ({
      id: c.id,
      name: c.name,
      username: c.id,
      avatar: c.avatar,
      role: c.currentRole,
      score: c.alignmentScore,
      stage: candidateStages[c.id] || "sourced",
      addedAt: c.createdAt || new Date().toISOString(),
      lastActivity: c.createdAt,
    }));
  }, [filteredCandidates, candidateStages]);

  // Handle Kanban candidate click - open profile
  const handleKanbanCandidateClick = useCallback((candidate: PipelineCandidate) => {
    router.push(`/profile/${candidate.id}`);
  }, [router]);

  // Score distribution for chart
  const scoreDistribution = useMemo(() => {
    const dist = [
      { range: "90-100", count: 0, color: "#22c55e" },
      { range: "80-89", count: 0, color: "#84cc16" },
      { range: "70-79", count: 0, color: "#eab308" },
      { range: "60-69", count: 0, color: "#f97316" },
      { range: "0-59", count: 0, color: "#ef4444" },
    ];
    candidates.forEach((c) => {
      if (c.alignmentScore >= 90) dist[0].count++;
      else if (c.alignmentScore >= 80) dist[1].count++;
      else if (c.alignmentScore >= 70) dist[2].count++;
      else if (c.alignmentScore >= 60) dist[3].count++;
      else dist[4].count++;
    });
    return dist;
  }, [candidates]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/20";
    if (score >= 60) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const selectedCandidates = candidates.filter((c) => selectedIds.includes(c.id));
  const hiddenByMustHaveCount =
    enforceHardRequirements && mustHaveSkills.length > 0
      ? Math.max(0, candidates.length - filteredCandidates.length)
      : 0;

  // Top matches - first 5 candidates by score
  const topMatches = useMemo(() => {
    return [...filteredCandidates]
      .sort((a, b) => b.alignmentScore - a.alignmentScore)
      .slice(0, 5);
  }, [filteredCandidates]);

  // Collapsible chart state
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Phase Indicator */}
        <PhaseIndicator currentPhase={2} />

        {/* Compact Header with Job Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {jobContext?.title || t("pipeline.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {jobContext?.company || "Your Candidates"} •{" "}
                {loading || isInitializing
                  ? "Loading candidates…"
                  : filteredCandidates.length < candidates.length
                    ? `${filteredCandidates.length} of ${candidates.length} candidates (filtered)`
                    : `${filteredCandidates.length} candidate${filteredCandidates.length !== 1 ? "s" : ""}`}
              </p>
              {mustHaveSkills.length > 0 && (
                <Badge
                  variant="outline"
                  className={`mt-1 ${
                    enforceHardRequirements
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {enforceHardRequirements ? "Strict Match Mode" : "Broad Match Mode"}
                </Badge>
              )}
              {hiddenByMustHaveCount > 0 && (
                <p className="text-xs text-amber-400 mt-1">
                  {hiddenByMustHaveCount} candidates hidden (missing one or more must-have skills)
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={selectedIds.length > 0 ? `/graph?ids=${selectedIds.join(",")}` : "/graph"}
              onClick={() => {
                if (selectedIds.length > 0) {
                  localStorage.setItem("apex_graph_selected", JSON.stringify(selectedIds));
                } else {
                  localStorage.removeItem("apex_graph_selected");
                }
              }}
            >
              <Button variant="outline" size="sm">
                <Network className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Talent Graph</span>
              </Button>
            </Link>
            <Link href={`/intake${adminSuffix}`}>
              <Button variant="outline" size="sm">
                <Briefcase className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit Job</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* TOP MATCHES - Hero Section (Above the Fold) */}
        {!loading && topMatches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-lg font-semibold">Top Matches</h2>
                <Badge variant="secondary" className="text-xs">
                  Based on {jobContext?.requiredSkills?.length || 0} requirements
                </Badge>
              </div>
              {/* Compare selected from top matches */}
              {selectedIds.filter(id => topMatches.some(c => c.id === id)).length >= 2 && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/compare?ids=${selectedIds.join(",")}`)}
                  className="gap-1"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Compare {selectedIds.filter(id => topMatches.some(c => c.id === id)).length} Selected
                </Button>
              )}
            </div>

            {/* Top 5 Candidates - Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {topMatches.map((candidate, index) => {
                const isSelected = selectedIds.includes(candidate.id);
                return (
                <Card
                  key={candidate.id}
                  className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                    index === 0 ? "ring-2 ring-yellow-500/50 bg-yellow-500/5" : ""
                  } ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
                  onClick={() => toggleSelect(candidate.id)}
                >
                  {index === 0 && !isSelected && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-950 text-[10px] font-bold px-2 py-0.5 rounded-bl">
                      BEST MATCH
                    </div>
                  )}
                  {/* Selection indicator */}
                  <div className="absolute top-2 left-2">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground/40 hover:text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-4 pt-6">
                    {/* Avatar + Score */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center text-[10px] font-bold border-2 border-background">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{candidate.id}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${getScoreColor(candidate.alignmentScore)}`}>
                        {candidate.alignmentScore}%
                      </div>
                    </div>

                    {/* Role & Company */}
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {candidate.currentRole} {candidate.company !== "Independent" && `@ ${candidate.company}`}
                    </p>

                    {/* Key Skills - Why This Match */}
                    {candidate.scoreBreakdown?.requiredMatched && candidate.scoreBreakdown.requiredMatched.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.scoreBreakdown.requiredMatched.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                            <Check className="w-2.5 h-2.5 mr-0.5" />
                            {skill}
                          </Badge>
                        ))}
                        {candidate.scoreBreakdown.requiredMatched.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{candidate.scoreBreakdown.requiredMatched.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* One-Click Actions */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/profile/${candidate.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          View Profile
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          setOutreachCandidate(candidate);
                          setShowOutreach(true);
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Outreach
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>

            {/* Inline hint for comparison */}
            {selectedIds.filter(id => topMatches.some(c => c.id === id)).length === 1 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Click another candidate to compare
              </p>
            )}
          </div>
        )}

        {pipelineError && (
          <Card className="mb-4 border-destructive/50 bg-destructive/10">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-destructive">{pipelineError}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPipelineError(null);
                      if (searchQuery.trim()) {
                        void handleSearch();
                      }
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Bar - Always visible when candidates exist */}
        {!loading && candidates.length > 0 && (
          <div className="flex items-center gap-4 mb-6 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-6 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">{scoreDistribution[0].count + scoreDistribution[1].count}</span>
                <span className="text-xs text-muted-foreground">Strong (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium">{scoreDistribution[2].count + scoreDistribution[3].count}</span>
                <span className="text-xs text-muted-foreground">Moderate (60-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">{scoreDistribution[4].count}</span>
                <span className="text-xs text-muted-foreground">Weak (&lt;60)</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChart(!showChart)}
              className="text-xs gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              {showChart ? "Hide Chart" : "View Chart"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showChart ? "rotate-180" : ""}`} />
            </Button>
          </div>
        )}

        {/* Collapsible Chart Section */}
        <AnimatePresence>
          {showChart && candidates.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card className="border-dashed">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">
                      {filterRange
                        ? `Filtering: ${filterRange} range (${filteredCandidates.length} candidates)`
                        : "Click a bar to filter candidates by score range"
                      }
                    </p>
                    {filterRange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterRange(null)}
                        className="text-xs h-6 gap-1 px-2"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution}>
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-sm">
                                  <p className="font-medium">{data.range}</p>
                                  <p className="text-muted-foreground">{data.count} candidates</p>
                                  <p className="text-xs text-primary mt-1">Click to filter</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[4, 4, 0, 0]}
                          className="cursor-pointer"
                          onClick={(data) => {
                            if (data && data.range) {
                              setFilterRange(filterRange === data.range ? null : data.range);
                            }
                          }}
                        >
                          {scoreDistribution.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={filterRange === entry.range
                                ? entry.color
                                : (filterRange ? `${entry.color}40` : entry.color)
                              }
                              className="cursor-pointer transition-all duration-200 hover:opacity-80"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {filterRange && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Click the same bar again or use &quot;Clear filter&quot; to show all candidates
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Candidates Section Header */}
        {!loading && candidates.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">All Candidates</h2>
              <Badge variant="outline" className="text-xs">
                {filteredCandidates.length < candidates.length
                  ? `${filteredCandidates.length} of ${candidates.length}`
                  : filteredCandidates.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors ${
                    viewMode === "kanban"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add More
              </Button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("pipeline.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span className="ml-2">{t("pipeline.addCandidates")}</span>
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                {t("pipeline.filters")}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("pipeline.sort")}</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="text-sm bg-background border rounded px-2 py-1"
                      >
                        <option value="score-desc">{t("pipeline.sortOptions.scoreDesc")}</option>
                        <option value="score-asc">{t("pipeline.sortOptions.scoreAsc")}</option>
                        <option value="name-asc">{t("pipeline.sortOptions.nameAsc")}</option>
                        <option value="name-desc">{t("pipeline.sortOptions.nameDesc")}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("pipeline.scoreFilter")}</span>
                      <div className="flex gap-1">
                        {[
                          { value: null, label: t("pipeline.all") },
                          { value: "high", label: "80+" },
                          { value: "medium", label: "50-79" },
                          { value: "low", label: "<50" },
                        ].map((opt) => (
                          <Button
                            key={opt.label}
                            size="sm"
                            variant={filterScore === opt.value ? "default" : "outline"}
                            onClick={() => setFilterScore(opt.value as typeof filterScore)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {/* Hard Requirements Filter */}
                    {mustHaveSkills.length > 0 && (
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <Switch
                          id="hard-requirements"
                          checked={enforceHardRequirements}
                          onCheckedChange={setEnforceHardRequirements}
                        />
                        <Label htmlFor="hard-requirements" className="text-sm font-medium cursor-pointer">
                          <span className="text-red-400">Hard filter:</span>{" "}
                          <span className="text-muted-foreground">
                            Require all {mustHaveSkills.length} must-have skills
                          </span>
                        </Label>
                        {enforceHardRequirements && (
                          <Badge variant="destructive" className="text-xs">
                            {candidates.length - filteredCandidates.length} excluded
                          </Badge>
                        )}
                      </div>
                    )}
                    {/* Tech Stack Filter Toggle */}
                    <Button
                      variant={showTechStackFilter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTechStackFilter(!showTechStackFilter)}
                      className="gap-2"
                    >
                      <Code2 className="w-4 h-4" />
                      Tech Stack
                      {(techStackFilter.required.length + techStackFilter.preferred.length) > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {techStackFilter.required.length + techStackFilter.preferred.length}
                        </Badge>
                      )}
                    </Button>
                    {selectedIds.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Badge>{selectedIds.length} {t("common.selected")}</Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedIds.length >= 2) {
                              router.push(`/compare?ids=${selectedIds.join(",")}`);
                            } else {
                              setShowComparison(true);
                            }
                          }}
                        >
                          {t("common.compare")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                          {t("common.clear")}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Tech Stack Filter Panel (Collapsible) */}
        <AnimatePresence>
          {showTechStackFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <TechStackFilter
                    filter={techStackFilter}
                    onChange={setTechStackFilter}
                  />
                </div>
                <FunnelAnalyticsPanel candidateStages={candidateStages} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State with Text Scramble */}
        {(loading || isInitializing) && candidates.length === 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <PipelineLoadingScramble />
              {jobContext?.requiredSkills && (
                <div className="flex gap-1 ml-2">
                  {jobContext.requiredSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox skeleton */}
                    <div className="w-5 h-5 rounded bg-muted" />
                    {/* Avatar skeleton */}
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    {/* Info skeleton */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-32 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded" />
                      </div>
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="flex gap-2">
                        <div className="h-3 w-24 bg-muted rounded" />
                        <div className="h-3 w-32 bg-muted rounded" />
                      </div>
                    </div>
                    {/* Score skeleton */}
                    <div className="w-14 h-14 rounded-xl bg-muted" />
                    {/* Actions skeleton */}
                    <div className="flex gap-2">
                      <div className="h-8 w-24 bg-muted rounded" />
                      <div className="h-8 w-8 bg-muted rounded" />
                      <div className="h-8 w-8 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Candidates List with Split View or Kanban */}
        {!loading && !isInitializing && filteredCandidates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {enforceHardRequirements && mustHaveSkills.length > 0
                  ? "No candidates match current must-have skills"
                  : t("pipeline.empty.noResults.title")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {enforceHardRequirements && mustHaveSkills.length > 0
                  ? "Strict Match Mode is active. Demote one or more must-have skills to see broader results."
                  : t("pipeline.empty.noResults.description")}
              </p>
              <div className="flex gap-2 justify-center">
                {enforceHardRequirements && mustHaveSkills.length > 0 && (
                  <Button variant="outline" onClick={() => router.push("/skills-review")}>
                    Review Skills
                  </Button>
                )}
                <Button onClick={() => setShowImport(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  {t("pipeline.empty.noResults.importResume")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredCandidates.length > 0 ? (
          viewMode === "kanban" ? (
            <div className="overflow-x-auto pb-4">
              <PipelineKanban
                candidates={kanbanCandidates}
                onStageChange={handleStageChange}
                onCandidateClick={handleKanbanCandidateClick}
              />
            </div>
          ) : (
            <PipelineSplitView
              candidates={filteredCandidates}
              viewMode={viewMode === "split" ? "split" : "list"}
              onViewModeChange={(mode) => setViewMode(mode as "list" | "split" | "kanban")}
              selectedCandidateId={selectedCandidateId}
              onSelectCandidate={setSelectedCandidateId}
              onOutreach={(c) => {
                setOutreachCandidate(c);
                setShowOutreach(true);
              }}
              renderListItem={(candidate, isCompact) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <CandidatePipelineItem
                    candidate={candidate}
                    isSelected={selectedIds.includes(candidate.id)}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDelete}
                    onOutreach={(c) => {
                      setOutreachCandidate(c);
                      setShowOutreach(true);
                    }}
                    compact={isCompact}
                  />
                </motion.div>
              )}
            />
          )
        ) : null}

        {/* Import Modal */}
        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowImport(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{t("pipeline.importModal.title")}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("pipeline.importModal.description")}
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={t("pipeline.importModal.placeholder")}
                  className="w-full h-64 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowImport(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleImport} disabled={isImporting || !importText.trim()}>
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {t("pipeline.importModal.analyzeImport")}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Modal - Enhanced */}
        <AnimatePresence>
          {showComparison && selectedCandidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowComparison(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
                  <div>
                    <h2 className="text-xl font-bold">Compare Candidates</h2>
                    <p className="text-sm text-muted-foreground">Side-by-side comparison of {selectedCandidates.length} candidates</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowComparison(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Comparison Table */}
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground w-32">Criteria</th>
                        {selectedCandidates.map((c) => (
                          <th key={c.id} className="text-center py-3 px-2">
                            <div className="flex flex-col items-center gap-2">
                              <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full" />
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                <p className="text-xs text-muted-foreground">@{c.id}</p>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {/* Overall Score */}
                      <tr className="bg-muted/30">
                        <td className="py-3 px-2 text-sm font-medium">Match Score</td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-3 px-2 text-center">
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${getScoreBg(c.alignmentScore)}`}>
                              <span className={`text-2xl font-bold ${getScoreColor(c.alignmentScore)}`}>
                                {c.alignmentScore}
                              </span>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Role */}
                      <tr>
                        <td className="py-3 px-2 text-sm text-muted-foreground">Current Role</td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-3 px-2 text-center text-sm">{c.currentRole}</td>
                        ))}
                      </tr>

                      {/* Company */}
                      <tr>
                        <td className="py-3 px-2 text-sm text-muted-foreground">Company</td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-3 px-2 text-center text-sm">{c.company}</td>
                        ))}
                      </tr>

                      {/* Location */}
                      <tr>
                        <td className="py-3 px-2 text-sm text-muted-foreground">Location</td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-3 px-2 text-center text-sm">
                            <div className="flex items-center justify-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {c.location}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Matched Skills */}
                      <tr className="bg-green-500/5">
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Check className="w-4 h-4 text-green-500" />
                            Matched Skills
                          </div>
                        </td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-3 px-2 text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {c.scoreBreakdown?.requiredMatched?.length ? (
                                c.scoreBreakdown.requiredMatched.map((skill) => (
                                  <Badge key={skill} className="text-[10px] bg-green-500/20 text-green-600 border-green-500/30">
                                    {skill}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Missing Skills */}
                      <tr className="bg-red-500/5">
                        <td className="py-3 px-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Missing Skills
                          </div>
                        </td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-3 px-2 text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {c.scoreBreakdown?.requiredMissing?.length ? (
                                c.scoreBreakdown.requiredMissing.map((skill) => (
                                  <Badge key={skill} variant="outline" className="text-[10px] border-red-500/30 text-red-500">
                                    {skill}
                                  </Badge>
                                ))
                              ) : (
                                <Badge className="text-[10px] bg-green-500/20 text-green-600">All matched!</Badge>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* All Skills */}
                      <tr>
                        <td className="py-3 px-2 text-sm text-muted-foreground">Tech Stack</td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-3 px-2 text-center">
                            <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                              {c.skills?.slice(0, 8).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-[10px]">
                                  {skill}
                                </Badge>
                              ))}
                              {c.skills && (c.skills || []).length > 8 && (
                                <Badge variant="outline" className="text-[10px]">+{(c.skills || []).length - 8}</Badge>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Risks */}
                      {selectedCandidates.some(c => c.risks?.length) && (
                        <tr>
                          <td className="py-3 px-2 text-sm text-muted-foreground">Potential Risks</td>
                          {selectedCandidates.map((c) => (
                            <td key={c.id} className="py-3 px-2 text-center">
                              {c.risks?.length ? (
                                <ul className="text-xs text-left list-disc list-inside text-muted-foreground">
                                  {c.risks.slice(0, 3).map((risk, i) => (
                                    <li key={i}>{risk}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      )}

                      {/* Actions */}
                      <tr className="bg-muted/30">
                        <td className="py-4 px-2 text-sm font-medium">Actions</td>
                        {selectedCandidates.map((c) => (
                          <td key={c.id} className="py-4 px-2 text-center">
                            <div className="flex gap-2 justify-center">
                              <Link href={`/profile/${c.id}`}>
                                <Button size="sm" variant="outline" className="text-xs">
                                  View Profile
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  setShowComparison(false);
                                  setOutreachCandidate(c);
                                  setShowOutreach(true);
                                }}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Outreach
                              </Button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Tip: Add more candidates to compare by clicking the checkbox on candidate cards
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
                    Clear Selection
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outreach Modal */}
        {outreachCandidate && (
          <OutreachModal
            isOpen={showOutreach}
            onClose={() => {
              setShowOutreach(false);
              setOutreachCandidate(null);
            }}
            candidate={{
              name: outreachCandidate.name,
              currentRole: outreachCandidate.currentRole,
              company: outreachCandidate.company,
              avatar: outreachCandidate.avatar,
            }}
            jobContext={jobContext || undefined}
          />
        )}
      </div>

      {/* Shortlist Panel - Fixed bottom selection bar */}
      <ShortlistPanel
        selectedCandidates={selectedCandidates}
        totalCandidates={candidates.length}
        onCompare={() => {
          if (selectedIds.length >= 2) {
            router.push(`/compare?ids=${selectedIds.join(",")}`);
          } else {
            setShowComparison(true);
          }
        }}
        onClearSelection={() => setSelectedIds([])}
        onMoveToDeepDive={() => {
          // Save selected IDs to localStorage and navigate to analyse page (Stage 3)
          if (selectedCandidates.length > 0) {
            localStorage.setItem("apex_shortlist", JSON.stringify(selectedIds));
            router.push("/analyse");
          }
        }}
        onRemoveCandidate={(id) => setSelectedIds((prev) => prev.filter((i) => i !== id))}
      />
    </div>
  );
}

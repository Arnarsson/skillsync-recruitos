"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAdmin } from "@/lib/adminContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import OutreachModal from "@/components/OutreachModal";
import ScoreBadge from "@/components/ScoreBadge";
import { BehavioralBadges } from "@/components/BehavioralBadges";
import { CandidatePipelineItem } from "@/components/pipeline/CandidatePipelineItem";
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

interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  skills: string[];
  createdAt?: string;
  risks?: string[];
  keyEvidence?: string[];
  scoreBreakdown?: ScoreBreakdown;
  persona?: {
    archetype?: string;
    riskAssessment?: {
      attritionRisk?: string;
    };
  };
}

export default function PipelinePage() {
  const { t } = useLanguage();
  const { isAdmin } = useAdmin();
  const adminSuffix = ""; // No longer needed with context-based admin
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobContext, setJobContext] = useState<{
    title: string;
    company: string;
    requiredSkills?: string[];
    location?: string;
  } | null>(null);
  const [autoSearched, setAutoSearched] = useState(false);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "name-asc" | "name-desc">("score-desc");
  const [filterScore, setFilterScore] = useState<"high" | "medium" | "low" | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select for comparison
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Outreach modal state
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachCandidate, setOutreachCandidate] = useState<Candidate | null>(null);

  // Note: expandedExplanation state moved to CandidatePipelineItem component

  useEffect(() => {
    const stored = localStorage.getItem("apex_job_context");
    let parsedJobContext = null;
    if (stored) {
      try {
        parsedJobContext = JSON.parse(stored);
        setJobContext(parsedJobContext);
      } catch {
        // Ignore
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
    const jobContextChanged = jobContextHash && storedJobHash !== jobContextHash;

    const storedCandidates = localStorage.getItem("apex_candidates");
    let existingCandidates: Candidate[] = [];
    if (storedCandidates && !jobContextChanged) {
      try {
        existingCandidates = JSON.parse(storedCandidates);
        setCandidates(existingCandidates);
      } catch {
        // Ignore
      }
    } else if (jobContextChanged) {
      // Clear old candidates when job context changes
      localStorage.removeItem("apex_candidates");
      setCandidates([]);
    }

    // Auto-search for candidates based on job requirements
    const shouldAutoSearch =
      parsedJobContext?.requiredSkills?.length > 0 &&
      (existingCandidates.length === 0 || jobContextChanged) &&
      !autoSearched;

    if (shouldAutoSearch) {
      setAutoSearched(true);
      // Store the new job context hash
      if (jobContextHash) {
        localStorage.setItem("apex_job_context_hash", jobContextHash);
      }

      // Use only top 2 skills for search - more specific queries return 0 results from GitHub
      const skills = parsedJobContext.requiredSkills.slice(0, 2);
      // Don't include location in search query - it makes GitHub search too restrictive
      // Location is still used for scoring candidates
      const query = skills.join(" ");

      if (query) {
        setSearchQuery(query);
        // Auto-trigger search immediately
        setLoading(true);
        autoSearchCandidates(query);
      }
    }
  }, [autoSearched]);

  // Calculate alignment score based on job requirements
  const calculateAlignmentScore = (
    user: { skills: string[]; bio: string; location: string },
    jobRequirements: { requiredSkills?: string[]; preferredSkills?: string[]; location?: string }
  ): { score: number; breakdown: ScoreBreakdown } => {
    const baseScore = 50;
    let skillsScore = 0;
    let preferredScore = 0;
    let locationScore = 0;

    const requiredSkills = jobRequirements.requiredSkills || [];
    const preferredSkills = jobRequirements.preferredSkills || [];
    const userSkillsLower = user.skills.map((s) => s.toLowerCase());
    const userBioLower = (user.bio || "").toLowerCase();

    // Track matched and missing required skills
    const requiredMatched: string[] = [];
    const requiredMissing: string[] = [];
    requiredSkills.forEach((skill) => {
      const skillLower = skill.toLowerCase();
      if (
        userSkillsLower.some((s) => s.includes(skillLower) || skillLower.includes(s)) ||
        userBioLower.includes(skillLower)
      ) {
        requiredMatched.push(skill);
      } else {
        requiredMissing.push(skill);
      }
    });
    if (requiredSkills.length > 0) {
      skillsScore = Math.round((requiredMatched.length / requiredSkills.length) * 35);
    }

    // Track matched preferred skills
    const preferredMatched: string[] = [];
    preferredSkills.forEach((skill) => {
      const skillLower = skill.toLowerCase();
      if (
        userSkillsLower.some((s) => s.includes(skillLower) || skillLower.includes(s)) ||
        userBioLower.includes(skillLower)
      ) {
        preferredMatched.push(skill);
      }
    });
    if (preferredSkills.length > 0) {
      preferredScore = Math.round((preferredMatched.length / preferredSkills.length) * 15);
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

    const totalScore = Math.min(99, Math.max(30, baseScore + skillsScore + preferredScore + locationScore));

    return {
      score: totalScore,
      breakdown: {
        requiredMatched,
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
          skills: string[];
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
        localStorage.setItem("apex_candidates", JSON.stringify(newCandidates));
      }
    } catch (error) {
      console.error("Auto-search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

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
          skills: string[];
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

        setCandidates((prev) => {
          const merged = [...newCandidates, ...prev];
          const unique = merged.filter(
            (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
          );
          // Sort by alignment score
          unique.sort((a, b) => b.alignmentScore - a.alignmentScore);
          localStorage.setItem("apex_candidates", JSON.stringify(unique));
          return unique;
        });
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);

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

        setCandidates((prev) => {
          const updated = [newCandidate, ...prev];
          localStorage.setItem("apex_candidates", JSON.stringify(updated));
          return updated;
        });

        setShowImport(false);
        setImportText("");
      }
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = useCallback((id: string) => {
    if (confirm(t("pipeline.candidate.deleteConfirm"))) {
      setCandidates((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        localStorage.setItem("apex_candidates", JSON.stringify(updated));
        return updated;
      });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  }, [t]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
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
    if (!filterScore) return sortedCandidates;
    switch (filterScore) {
      case "high":
        return sortedCandidates.filter((c) => c.alignmentScore >= 80);
      case "medium":
        return sortedCandidates.filter(
          (c) => c.alignmentScore >= 50 && c.alignmentScore < 80
        );
      case "low":
        return sortedCandidates.filter((c) => c.alignmentScore < 50);
      default:
        return sortedCandidates;
    }
  }, [sortedCandidates, filterScore]);

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

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary">{t("pipeline.step")}</Badge>
            <h1 className="text-3xl font-bold">{t("pipeline.title")}</h1>
            {jobContext && (
              <>
                <p className="text-muted-foreground mt-1">
                  {jobContext.title} {t("pipeline.candidate.at")} {jobContext.company}
                </p>
                {jobContext.requiredSkills && jobContext.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-muted-foreground mr-1">{t("common.skills")}:</span>
                    {jobContext.requiredSkills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <FileText className="w-4 h-4 mr-2" />
              {t("pipeline.import")}
            </Button>
            <Link href={`/intake${adminSuffix}`}>
              <Button variant="outline" size="sm">
                <Briefcase className="w-4 h-4 mr-2" />
                {t("pipeline.editJob")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Score Distribution Chart */}
        {candidates.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    {t("pipeline.intelligence.title")}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("pipeline.intelligence.distribution").replace("{count}", candidates.length.toString())}</p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {t("pipeline.intelligence.topMatch")}: {candidates.filter((c) => c.alignmentScore >= 80).length}
                </Badge>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution}>
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <Card className="mb-6">
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
                    {selectedIds.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Badge>{selectedIds.length} {t("common.selected")}</Badge>
                        <Button size="sm" onClick={() => setShowComparison(true)}>
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

        {/* Skeleton Loader for Loading State */}
        {loading && candidates.length === 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">{t("pipeline.empty.loading.title")}</span>
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

        {/* Candidates List */}
        {!loading && filteredCandidates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t("pipeline.empty.noResults.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("pipeline.empty.noResults.description")}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowImport(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  {t("pipeline.empty.noResults.importResume")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredCandidates.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredCandidates.map((candidate) => (
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
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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

        {/* Comparison Modal */}
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
                className="bg-background rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{t("pipeline.compareModal.title")}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowComparison(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`grid gap-4 ${selectedCandidates.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {selectedCandidates.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-16 h-16 rounded-full mx-auto mb-2"
                          />
                          <h3 className="font-medium">{c.name}</h3>
                          <p className="text-sm text-muted-foreground">{c.currentRole}</p>
                        </div>
                        <div className={`text-center p-4 rounded-lg ${getScoreBg(c.alignmentScore)} mb-4`}>
                          <div className={`text-3xl font-bold ${getScoreColor(c.alignmentScore)}`}>
                            {c.alignmentScore}
                          </div>
                          <div className="text-xs text-muted-foreground">{t("pipeline.compareModal.alignmentScore")}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("common.location")}</span>
                            <span>{c.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("common.company")}</span>
                            <span>{c.company}</span>
                          </div>
                        </div>
                        {c.skills && c.skills.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1">
                            {c.skills.slice(0, 5).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Link href={`/profile/${c.id}/deep${adminSuffix}`} className="block mt-4">
                          <Button className="w-full" size="sm">
                            {t("pipeline.compareModal.viewDeepProfile")}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
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
    </div>
  );
}

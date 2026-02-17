"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Expandable,
  ExpandableTrigger,
  ExpandableContent,
} from "@/components/ui/expandable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalysisLoadingScramble } from "@/components/ui/loading-scramble";
import ScoreBadge from "@/components/ScoreBadge";
import { BuildprintStrip } from "@/components/pipeline/BuildprintStrip";
import { ScoreExplainer } from "@/components/ScoreExplainer";
import { BehavioralBadges } from "@/components/BehavioralBadges";
import {
  MapPin,
  ArrowRight,
  Trash2,
  MessageSquare,
  Check,
  AlertTriangle,
  CheckSquare,
  Square,
  Brain,
  Target,
  Lightbulb,
  ChevronDown,
  User,
  Github,
  Linkedin,
  ExternalLink,
  Info,
  Lock,
  Eye,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import {
  extractGitHubUsername,
  isUuidLike,
  resolveProfileSlug,
} from "@/lib/candidate-identity";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { JobReadinessScore } from "@/components/JobReadinessScore";
import type { ReadinessInput } from "@/services/jobReadiness/types";

/** Build ReadinessInput from candidate data (works for both DB and demo candidates) */
function buildReadinessInput(candidate: Candidate): ReadinessInput {
  const input: ReadinessInput = {
    candidateId: candidate.id,
    githubUsername: candidate.githubUsername || candidate.username,
    currentCompany: candidate.company || undefined,
    currentRole: candidate.currentRole || undefined,
    skills: candidate.skills,
    location: candidate.location || undefined,
  };

  // Map demo profile fields to GitHub profile format
  const c = candidate as any;
  if (c.followers != null || c.publicRepos != null) {
    input.githubProfile = {
      login: candidate.githubUsername || candidate.username || candidate.name,
      public_repos: c.publicRepos ?? 0,
      followers: c.followers ?? 0,
      following: c.following ?? 0,
      created_at: c.createdAt || '2020-01-01T00:00:00Z',
      bio: c.bio ?? null,
      company: candidate.company || null,
    };
  }

  // Map topRepos to engine format
  if (c.topRepos?.length) {
    input.githubRepos = c.topRepos.map((r: any) => ({
      name: r.name || r.fullName?.split('/')?.pop() || '',
      language: r.language || null,
      stargazers_count: r.stars ?? r.stargazers_count ?? 0,
      forks_count: r.forks ?? r.forks_count ?? 0,
      pushed_at: r.updatedAt || r.pushed_at || new Date().toISOString(),
      created_at: r.createdAt || r.created_at || '2023-01-01T00:00:00Z',
      topics: r.topics || [],
      fork: r.fork ?? false,
    }));
  }

  return input;
}

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

interface EvidenceItem {
  text: string;
  source?: string;
  sourceUrl?: string;
  confidence?: 'high' | 'moderate' | 'low';
}

interface DeepAnalysis {
  psychometricText?: string;
  archetype?: string;
  interviewTips?: string[];
  strengths?: Array<string | EvidenceItem>;
  concerns?: Array<string | EvidenceItem>;
  cultureFit?: string;
  managementStyle?: string;
  hasPublicActivity?: boolean;
  totalCommits?: number;
}

interface Candidate {
  id: string;
  githubUsername?: string;
  username?: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  shortlistSummary?: string;
  skills?: string[];
  createdAt?: string;
  risks?: string[];
  keyEvidence?: string[];
  scoreBreakdown?: ScoreBreakdown;
  source?: "github" | "linkedin" | "import";
  sourceUrl?: string;
  persona?: {
    archetype?: string;
    riskAssessment?: {
      attritionRisk?: string;
    };
  };
  // Demo profile fields
  buildprint?: any;
  topRepos?: any[];
  hasReceipts?: boolean;
}

interface CandidatePipelineItemProps {
  candidate: Candidate;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOutreach: (candidate: Candidate) => void;
  compact?: boolean;
}

export function CandidatePipelineItem({
  candidate,
  isSelected,
  onToggleSelect,
  onDelete,
  onOutreach,
  compact = false,
}: CandidatePipelineItemProps) {
  const { t, lang } = useLanguage();
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [hasLoadedAnalysis, setHasLoadedAnalysis] = useState(false);
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);
  const [githubAnalysis, setGithubAnalysis] = useState<any>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  const githubUsername = useMemo(() => {
    return extractGitHubUsername(candidate);
  }, [candidate]);

  const profileSlug = useMemo(() => resolveProfileSlug(candidate), [candidate]);
  const behavioralUsername = githubUsername || "";

  const normalizedScoreBreakdown = useMemo(() => {
    const breakdown = candidate.scoreBreakdown as
      | (ScoreBreakdown & {
          skills?: { percentage?: number };
          experience?: { percentage?: number };
          industry?: { percentage?: number };
          seniority?: { percentage?: number };
          location?: { percentage?: number };
        })
      | undefined;

    if (!breakdown) return null;

    const hasLegacy = typeof breakdown.baseScore === "number";
    if (hasLegacy) {
      return {
        base: breakdown.baseScore ?? 0,
        skills: breakdown.skillsScore ?? 0,
        preferred: breakdown.preferredScore ?? 0,
        location: breakdown.locationScore ?? 0,
      };
    }

    const skillsPct = breakdown.skills?.percentage ?? 0;
    const experiencePct = breakdown.experience?.percentage ?? 0;
    const industryPct = breakdown.industry?.percentage ?? 0;
    const seniorityPct = breakdown.seniority?.percentage ?? 0;
    const locationPct = breakdown.location?.percentage ?? 0;
    const preferredComposite = Math.round((experiencePct + industryPct + seniorityPct) / 3);

    return {
      base: Math.round((candidate.alignmentScore || 0) * 0.4),
      skills: skillsPct,
      preferred: preferredComposite,
      location: locationPct,
    };
  }, [candidate.scoreBreakdown, candidate.alignmentScore]);

  // Fetch deep analysis when card expands
  const handleExpandStart = useCallback(async () => {
    if (hasLoadedAnalysis || isLoadingAnalysis) return;

    setIsLoadingAnalysis(true);
    try {
      const lookupId = githubUsername || candidate.id;
      // Fetch both developer profile and GitHub deep analysis in parallel
      const [profileRes, githubRes] = await Promise.all([
        fetch(`/api/developers/${lookupId}?deep=true`),
        lookupId && !isUuidLike(lookupId)
          ? fetch(`/api/github/deep?username=${lookupId}`)
          : Promise.resolve(new Response(null, { status: 204 })),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setDeepAnalysis({
          psychometricText: data.persona?.psychometricProfile || data.bio,
          archetype: data.persona?.archetype || candidate.persona?.archetype,
          interviewTips: data.interviewGuide?.questions || [],
          strengths: data.keyEvidence || candidate.keyEvidence || [],
          concerns: data.risks || candidate.risks || [],
          cultureFit: data.persona?.cultureFit,
          managementStyle: data.persona?.managementStyle,
          hasPublicActivity: data.hasPublicActivity ?? true,
          totalCommits: data.totalCommits,
        });
      }

      if (githubRes.ok && githubRes.status !== 204) {
        const contentType = githubRes.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const githubData = await githubRes.json();
          setGithubAnalysis(githubData);
        } else {
          const raw = await githubRes.text();
          if (raw.trim()) {
            try {
              setGithubAnalysis(JSON.parse(raw));
            } catch {
              console.warn("GitHub deep analysis returned non-JSON payload");
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch deep analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
      setHasLoadedAnalysis(true);
    }
  }, [
    candidate.id,
    hasLoadedAnalysis,
    isLoadingAnalysis,
    candidate.persona?.archetype,
    candidate.keyEvidence,
    candidate.risks,
    githubUsername,
  ]);

  // In compact mode, render a simplified non-expandable version
  if (compact) {
    return (
      <div className="w-full bg-card border rounded-xl transition-all duration-300 border-border hover:border-primary/30">
        <div className="flex items-center gap-3 p-3">
          {/* Checkbox */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(candidate.id);
            }}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </Button>

          {/* Avatar */}
          <img
            src={candidate.avatar}
            alt={candidate.name}
            className="w-10 h-10 rounded-full flex-shrink-0"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{candidate.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {candidate.currentRole}
            </p>
          </div>

          {/* Score */}
          <div className="flex-shrink-0">
            <ScoreBadge score={candidate.alignmentScore} size="sm" showTooltip={false} />
          </div>
        </div>

        {/* Compact Skills Preview */}
        {candidate.skills && (candidate.skills || []).length > 0 && (
          <div className="px-3 pb-3 flex flex-wrap gap-1">
            {(candidate.skills || []).slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                {skill}
              </Badge>
            ))}
            {(candidate.skills || []).length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{(candidate.skills || []).length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
    <Expandable
      expandDirection="vertical"
      expandBehavior="push"
      onExpandStart={handleExpandStart}
      className="w-full"
    >
      {({ isExpanded }) => (
        <div className="w-full">
          <ExpandableTrigger className="w-full">
            <div
              className={`
                w-full bg-card border rounded-xl transition-all duration-300
                ${isExpanded ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30"}
              `}
            >
              {/* Always Visible Header */}
              <div className="flex items-center gap-4 p-4">
                {/* Checkbox - stop propagation to prevent expand */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(candidate.id);
                  }}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </Button>

                {/* Avatar */}
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-12 h-12 rounded-full flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{candidate.name}</h3>
                    {candidate.persona?.archetype && (
                      <Badge variant="outline" className="text-xs">
                        {candidate.persona.archetype.split(" ").slice(0, 2).join(" ")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {candidate.currentRole} at {candidate.company}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {candidate.location}
                    </span>
                    {/* Source Badge */}
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 text-[10px]">
                      {(candidate.source === "linkedin") ? (
                        <>
                          <Linkedin className="w-2.5 h-2.5" />
                          LinkedIn
                        </>
                      ) : (
                        <>
                          <Github className="w-2.5 h-2.5" />
                          GitHub
                        </>
                      )}
                    </span>
                  </div>
                  {/* Skill Badges on collapsed card */}
                  {candidate.skills && (candidate.skills || []).length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                      {(candidate.skills || []).slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {skill}
                        </Badge>
                      ))}
                      {(candidate.skills || []).length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{(candidate.skills || []).length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  {behavioralUsername ? (
                    <BehavioralBadges username={behavioralUsername} compact className="mt-2" />
                  ) : null}
                </div>

                {/* Score - Clickable for explainer */}
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowScoreExplainer(true);
                    }}
                    className="hover:scale-105 transition-transform cursor-pointer h-auto p-0"
                    title="Click to see score breakdown"
                  >
                    <ScoreBadge score={candidate.alignmentScore} size="md" showTooltip={false} />
                  </Button>
                </div>

                {/* Expand Indicator */}
                <div className="flex-shrink-0">
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              <ExpandableContent preset="blur-md" className="px-4 pb-4">
                {/* Data Source Transparency */}
                <DataSourceBanner
                  hasLinkedIn={candidate.source === "linkedin"}
                  className="pt-2 mb-3"
                  compact
                />

                {/* Job Readiness Score */}
                <JobReadinessScore
                  candidateId={candidate.id}
                  readinessInput={buildReadinessInput(candidate)}
                  compact
                  className="mb-2"
                />

                {/* GitHub Activity Highlights */}
                {githubAnalysis && (
                  <div className="pt-3 pb-3 border-t mb-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                      GitHub Activity
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-xs">
                      <div className="text-center">
                        <div className="text-base sm:text-sm font-semibold text-foreground">{githubAnalysis.buildprint?.impact?.value || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Impact</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-sm font-semibold text-foreground">{githubAnalysis.buildprint?.collaboration?.value || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Teamwork</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-sm font-semibold text-foreground">{githubAnalysis.buildprint?.consistency?.value || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Activity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-base sm:text-sm font-semibold text-foreground">{githubAnalysis.buildprint?.complexity?.value || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Depth</div>
                      </div>
                      <div className="text-center col-span-3 sm:col-span-1">
                        <div className="text-base sm:text-sm font-semibold text-foreground">{githubAnalysis.buildprint?.ownership?.value || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Leadership</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Tags */}
                <div className={`flex flex-wrap gap-2 mb-4 ${!githubAnalysis ? "pt-2 border-t" : ""}`}>
                  {candidate.skills?.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Match Score Factors */}
                {candidate.scoreBreakdown && normalizedScoreBreakdown && (
                  <div className="mb-6">
                    <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Why {candidate.alignmentScore}%?
                    </h4>
                    <div className="space-y-2">
                      {/* Base fit - expandable */}
                      <details className="group">
                        <summary className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors list-none">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="w-3 h-3 text-muted-foreground transition-transform group-open:rotate-180" />
                            <span className="text-muted-foreground">Profile baseline</span>
                          </div>
                          <span className="font-semibold">{normalizedScoreBreakdown.base}%</span>
                        </summary>
                        <div className="mt-2 px-3 py-2 text-xs text-muted-foreground bg-muted/10 rounded border border-muted/20">
                          <p className="leading-relaxed">
                            We analyze their GitHub profile (languages used, project types, activity patterns, experience level)
                            and compare it against your job requirements to establish a baseline compatibility score.
                            This score increases when they match specific required skills or location preferences.
                          </p>
                        </div>
                      </details>
                      {/* Skills match */}
                      {normalizedScoreBreakdown.skills > 0 && (
                        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-green-500/5 border border-green-500/10">
                          <span className="text-green-600">Has required skills</span>
                          <span className="font-semibold text-green-600">+{normalizedScoreBreakdown.skills}%</span>
                        </div>
                      )}
                      {/* Preferred bonus */}
                      {normalizedScoreBreakdown.preferred > 0 && (
                        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-blue-500/5 border border-blue-500/10">
                          <span className="text-blue-600">Nice-to-have skills</span>
                          <span className="font-semibold text-blue-600">+{normalizedScoreBreakdown.preferred}%</span>
                        </div>
                      )}
                      {/* Location */}
                      {normalizedScoreBreakdown.location > 0 ? (
                        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-yellow-500/5 border border-yellow-500/10">
                          <span className="text-yellow-600">Location match</span>
                          <span className="font-semibold text-yellow-600">+{normalizedScoreBreakdown.location}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/10 group relative">
                          <span className="text-muted-foreground/60">Different location (remote OK?)</span>
                          <span className="font-semibold text-muted-foreground/60">+0%</span>
                        </div>
                      )}
                    </div>

                    {/* Skills Match Summary */}
                    {((candidate.scoreBreakdown.requiredMatched?.length || 0) > 0 ||
                      (candidate.scoreBreakdown.requiredMissing?.length || 0) > 0) && (
                      <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {t("candidate.requiredSkills")}
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {candidate.scoreBreakdown.requiredMatched?.length || 0} of{" "}
                            {(candidate.scoreBreakdown.requiredMatched?.length || 0) +
                              (candidate.scoreBreakdown.requiredMissing?.length || 0)}{" "}
                            matched
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.scoreBreakdown.requiredMatched?.map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-green-500/10 text-green-700 border-green-500/20 text-xs gap-1 font-normal"
                            >
                              <Check className="w-3 h-3" />
                              {skill}
                            </Badge>
                          ))}
                          {candidate.scoreBreakdown.requiredMissing?.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-muted-foreground/50 text-xs gap-1 opacity-50 font-normal"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Public Activity Warning */}
                {deepAnalysis && deepAnalysis.hasPublicActivity === false && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-600">
                          {t("candidate.noVisibleActivity")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("candidate.privateActivityNote")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deep Analysis Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Behavioral Profile */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      {t("candidate.psychometricProfile")}
                    </h4>
                    {isLoadingAnalysis ? (
                      <div className="py-2">
                        <AnalysisLoadingScramble />
                      </div>
                    ) : deepAnalysis?.psychometricText ? (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {deepAnalysis.psychometricText}
                      </p>
                    ) : candidate.shortlistSummary ? (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {candidate.shortlistSummary}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {t("candidate.clickDeepProfile")}
                      </p>
                    )}
                    {deepAnalysis?.archetype && (
                      <Badge className="mt-2" variant="outline">
                        <User className="w-3 h-3 mr-1" />
                        {deepAnalysis.archetype}
                      </Badge>
                    )}
                  </div>

                  {/* Interview Guide */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      {t("candidate.interviewGuide")}
                    </h4>
                    {isLoadingAnalysis ? (
                      <div className="py-2">
                        <AnalysisLoadingScramble />
                      </div>
                    ) : deepAnalysis?.interviewTips && deepAnalysis.interviewTips.length > 0 ? (
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {deepAnalysis.interviewTips.slice(0, 3).map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="line-clamp-1">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    ) : candidate.keyEvidence && candidate.keyEvidence.length > 0 ? (
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {candidate.keyEvidence.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="line-clamp-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {t("candidate.viewDeepProfileQuestions")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Strengths & Concerns - More spacious layout */}
                {(deepAnalysis?.strengths?.length ||
                  deepAnalysis?.concerns?.length ||
                  candidate.keyEvidence?.length ||
                  candidate.risks?.length) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {(deepAnalysis?.strengths && deepAnalysis.strengths.length > 0) ||
                    (candidate.keyEvidence && candidate.keyEvidence.length > 0) ? (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          {t("candidate.keyStrengths")}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(deepAnalysis?.strengths || candidate.keyEvidence || []).slice(0, 4).map((strength, i) => {
                            const isEvidenceItem = typeof strength === 'object' && strength !== null;
                            const text = isEvidenceItem ? (strength as EvidenceItem).text : String(strength);
                            const hasEvidence = isEvidenceItem && (strength as EvidenceItem).sourceUrl;

                            return (
                              <Badge
                                key={i}
                                variant="outline"
                                className={cn(
                                  "text-xs text-green-700 bg-green-500/5 border-green-500/20 px-2.5 py-1",
                                  hasEvidence && 'cursor-pointer hover:bg-green-500/10 hover:border-green-500/30'
                                )}
                                onClick={hasEvidence ? () => setSelectedEvidence(strength as EvidenceItem) : undefined}
                              >
                                {text}
                                {hasEvidence && <Eye className="w-3 h-3 ml-1 opacity-50" />}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {(deepAnalysis?.concerns && deepAnalysis.concerns.length > 0) ||
                    (candidate.risks && candidate.risks.length > 0) ? (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          {t("candidate.areasToExplore")}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(deepAnalysis?.concerns || candidate.risks || []).slice(0, 4).map((concern, i) => {
                            const isEvidenceItem = typeof concern === 'object' && concern !== null;
                            const text = isEvidenceItem ? (concern as EvidenceItem).text : String(concern);
                            const hasEvidence = isEvidenceItem && (concern as EvidenceItem).sourceUrl;

                            return (
                              <Badge
                                key={i}
                                variant="outline"
                                className={cn(
                                  "text-xs text-yellow-700 bg-yellow-500/5 border-yellow-500/20 px-2.5 py-1",
                                  hasEvidence && 'cursor-pointer hover:bg-yellow-500/10 hover:border-yellow-500/30'
                                )}
                                onClick={hasEvidence ? () => setSelectedEvidence(concern as EvidenceItem) : undefined}
                              >
                                {text}
                                {hasEvidence && <Eye className="w-3 h-3 ml-1 opacity-50" />}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Evidence Modal */}
                {selectedEvidence && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{t("candidate.flagEvidence")}</span>
                          {selectedEvidence.confidence && (
                            <Badge variant="outline" className="text-[10px]">
                              {selectedEvidence.confidence === 'high' ? t("candidate.confidenceHigh") :
                               selectedEvidence.confidence === 'moderate' ? t("candidate.confidenceModerate") :
                               t("candidate.confidenceLow")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {selectedEvidence.source && (
                            <span className="text-xs text-muted-foreground">
                              {t("candidate.inferredFrom")}: {selectedEvidence.source}
                            </span>
                          )}
                        </p>
                        {selectedEvidence.sourceUrl && (
                          <a
                            href={selectedEvidence.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {t("candidate.viewEvidence")}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedEvidence(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Link href={`/profile/${profileSlug}/deep?candidateId=${encodeURIComponent(candidate.id)}`} className="flex-1">
                    <Button className="w-full gap-2">
                      <Brain className="w-4 h-4" />
                      {t("candidate.fullDeepProfile")}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link
                    href={`/candidates/${profileSlug}/work-analysis`}
                  >
                    <Button variant="outline" className="gap-1.5" title="Deep Work Analysis">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span className="hidden sm:inline text-xs">Work</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOutreach(candidate);
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(candidate.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </ExpandableContent>
            </div>
          </ExpandableTrigger>
        </div>
      )}
    </Expandable>

    {/* Score Explainer Sheet */}
    <ScoreExplainer
      candidate={candidate}
      isOpen={showScoreExplainer}
      onClose={() => setShowScoreExplainer(false)}
    />
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAdmin } from "@/lib/adminContext";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { GitHubLoadingScramble, AnalysisLoadingScramble } from "@/components/ui/loading-scramble";
import {
  ArrowLeft,
  Loader2,
  User,
  MapPin,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Brain,
  MessageSquare,
  RefreshCw,
  Send,
  GitBranch,
  Activity,
  FileText,
  Lightbulb,
  Globe,
  Info,
  Linkedin,
  Link as LinkIcon,
  Plus,
  HelpCircle,
  ClipboardList,
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OutreachModal from "@/components/OutreachModal";
import { BehavioralBadges } from "@/components/BehavioralBadges";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

interface EvidenceItem {
  claim: string;
  source: 'github_profile' | 'repositories' | 'contributions' | 'bio' | 'inferred' | 'location_data' | 'linkedin' | 'portfolio' | 'certificate';
  sourceDetail?: string;
  sourceUrl?: string;
  interviewQuestion?: string;
}

// Data coverage status
interface DataCoverage {
  github: 'connected' | 'partial' | 'missing';
  linkedin: 'connected' | 'partial' | 'missing';
  portfolio: 'connected' | 'partial' | 'missing';
}

interface GitHubDeepAnalysis {
  commitActivity: {
    totalCommits: number;
    avgCommitsPerWeek: number;
    mostActiveDay: string;
    mostActiveHour: number;
    commitsByDay: Record<string, number>;
    recentCommitDates: string[];
  };
  pullRequests: {
    totalOpened: number;
    totalMerged: number;
    avgMergeTime: string;
    recentPRs: Array<{
      title: string;
      repo: string;
      state: string;
      createdAt: string;
      mergedAt?: string;
    }>;
  };
  codeReview: {
    reviewsGiven: number;
    commentsGiven: number;
    avgResponseTime: string;
  };
  contributionPatterns: {
    consistency: 'high' | 'moderate' | 'sporadic';
    streak: number;
    longestStreak: number;
    activeMonths: number;
  };
  collaborationStyle: {
    soloProjects: number;
    teamProjects: number;
    opensourceContributions: number;
    style: 'solo' | 'collaborative' | 'balanced';
  };
  topLanguages: Array<{
    name: string;
    percentage: number;
    repoCount: number;
  }>;
}

interface DeepProfile {
  indicators: Array<{
    name: string;
    value: number;
    interpretation: string;
    icon: string;
  }>;
  questions: Array<{
    question: string;
    context: string;
    expectedAnswer: string;
    category: "Technical" | "Soft Skills" | "Behavioral";
  }>;
  deepAnalysis: string;
  cultureFit: string;
  companyMatch: {
    score: number;
    reasons: string[];
    risks: string[];
  };
}

interface Persona {
  archetype: string;
  psychometric: {
    communicationStyle: string;
    primaryMotivator: string;
    riskTolerance: string;
    leadershipPotential: string;
  };
  softSkills: string[];
  redFlags: string[];
  greenFlags: string[];
  reasoning: string;
  careerTrajectory?: {
    growthVelocity: "rapid" | "steady" | "slow";
    promotionFrequency: "high" | "moderate" | "low";
    roleProgression: "vertical" | "lateral" | "mixed";
    industryPivots: number;
    leadershipGrowth: "ascending" | "stable" | "declining";
    averageTenure: string;
    tenurePattern: "stable" | "job-hopper" | "long-term";
  };
  skillProfile?: {
    coreSkills: Array<{ name: string; proficiency: string; yearsActive: number }>;
    emergingSkills: string[];
    deprecatedSkills: string[];
    skillGaps: string[];
    adjacentSkills: string[];
    depthVsBreadth: "specialist" | "generalist" | "t-shaped";
  };
  riskAssessment?: {
    attritionRisk: "low" | "moderate" | "high";
    flightRiskFactors: string[];
    skillObsolescenceRisk: "low" | "moderate" | "high";
    geographicBarriers: string[];
    unexplainedGaps: boolean;
    compensationRiskLevel: "low" | "moderate" | "high";
  };
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
  yearsExperience?: number;
  shortlistSummary?: string;
  keyEvidence?: string[];
  keyEvidenceWithSources?: EvidenceItem[];
  risks?: string[];
  risksWithSources?: EvidenceItem[];
  scoreBreakdown?: {
    skills: { value: number; max: number; percentage: number };
    experience: { value: number; max: number; percentage: number };
    industry: { value: number; max: number; percentage: number };
    seniority: { value: number; max: number; percentage: number };
    location: { value: number; max: number; percentage: number };
  };
  persona?: Persona;
  deepProfile?: DeepProfile;
}

export default function DeepProfilePage() {
  const params = useParams();
  const { isAdmin } = useAdmin();
  const username = params.username as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "persona" | "github">("overview");
  const [githubAnalysis, setGithubAnalysis] = useState<GitHubDeepAnalysis | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [jobContext, setJobContext] = useState<{
    title?: string;
    company?: string;
    requiredSkills?: string[];
  } | null>(null);

  const [hasAutoRun, setHasAutoRun] = useState(false);

  useEffect(() => {
    // Load candidate from localStorage
    const stored = localStorage.getItem("apex_candidates");
    if (stored) {
      try {
        const candidates = JSON.parse(stored) as Candidate[];
        const found = candidates.find((c) => c.id === username);
        if (found) {
          setCandidate(found);
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Load job context
    const storedJob = localStorage.getItem("apex_job_context");
    if (storedJob) {
      try {
        setJobContext(JSON.parse(storedJob));
      } catch {
        // Ignore parse errors
      }
    }

    setLoading(false);
  }, [username]);

  const runDeepAnalysis = useCallback(async () => {
    if (!candidate) return;
    setAnalyzing(true);

    try {
      const response = await fetch("/api/profile/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateName: candidate.name,
          currentRole: candidate.currentRole,
          company: candidate.company,
          location: candidate.location,
          skills: candidate.skills,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedCandidate = {
          ...candidate,
          persona: data.persona,
          deepProfile: data.deepProfile,
          scoreBreakdown: data.scoreBreakdown,
          keyEvidence: data.keyEvidence,
          keyEvidenceWithSources: data.keyEvidenceWithSources,
          risks: data.risks,
          risksWithSources: data.risksWithSources,
        };
        setCandidate(updatedCandidate);

        // Update localStorage
        const stored = localStorage.getItem("apex_candidates");
        if (stored) {
          const candidates = JSON.parse(stored) as Candidate[];
          const index = candidates.findIndex((c) => c.id === username);
          if (index !== -1) {
            candidates[index] = updatedCandidate;
            localStorage.setItem("apex_candidates", JSON.stringify(candidates));
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  }, [candidate, username]);

  // Auto-run AI analysis when page loads if not already analyzed
  useEffect(() => {
    if (candidate && !candidate.persona && !analyzing && !hasAutoRun) {
      setHasAutoRun(true);
      runDeepAnalysis();
    }
  }, [candidate, analyzing, hasAutoRun, runDeepAnalysis]);

  // Fetch GitHub deep analysis when GitHub tab is selected
  useEffect(() => {
    if (activeTab === "github" && !githubAnalysis && !loadingGithub && candidate) {
      setLoadingGithub(true);
      fetch(`/api/github/deep?username=${candidate.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setGithubAnalysis(data);
          }
        })
        .catch((err) => console.error("GitHub analysis error:", err))
        .finally(() => setLoadingGithub(false));
    }
  }, [activeTab, githubAnalysis, loadingGithub, candidate]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskColor = (risk?: string) => {
    if (risk === "low") return "text-green-500";
    if (risk === "moderate") return "text-yellow-500";
    return "text-red-500";
  };

  // Get source icon and label for evidence
  const getSourceInfo = (source: EvidenceItem['source']) => {
    switch (source) {
      case 'github_profile':
        return { icon: <User className="w-3 h-3" />, label: 'GitHub Profile', color: 'text-blue-500' };
      case 'repositories':
        return { icon: <GitBranch className="w-3 h-3" />, label: 'Repositories', color: 'text-green-500' };
      case 'contributions':
        return { icon: <Activity className="w-3 h-3" />, label: 'Contributions', color: 'text-purple-500' };
      case 'bio':
        return { icon: <FileText className="w-3 h-3" />, label: 'Bio', color: 'text-cyan-500' };
      case 'inferred':
        return { icon: <Lightbulb className="w-3 h-3" />, label: 'Inferred', color: 'text-yellow-500' };
      case 'location_data':
        return { icon: <Globe className="w-3 h-3" />, label: 'Location', color: 'text-orange-500' };
      default:
        return { icon: <Info className="w-3 h-3" />, label: 'Unknown', color: 'text-muted-foreground' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex flex-col items-center justify-center">
        <AnalysisLoadingScramble />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Candidate Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This candidate is not in your pipeline.
          </p>
          <Link href={`/pipeline`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pipeline
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const radarData = candidate.scoreBreakdown
    ? [
        { subject: "Skills", value: candidate.scoreBreakdown.skills?.percentage || 0 },
        { subject: "Exp.", value: candidate.scoreBreakdown.experience?.percentage || 0 },
        { subject: "Industry", value: candidate.scoreBreakdown.industry?.percentage || 0 },
        { subject: "Seniority", value: candidate.scoreBreakdown.seniority?.percentage || 0 },
        { subject: "Location", value: candidate.scoreBreakdown.location?.percentage || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/pipeline`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <Badge className="mb-2 bg-primary/20 text-primary">Trin 3 af 4</Badge>
            <h1 className="text-3xl font-bold">Dybdeprofil</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runDeepAnalysis}
              disabled={analyzing}
              variant="outline"
              className="gap-2"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {candidate.persona ? "Opdatér analyse" : "Kør AI-analyse"}
            </Button>
            <Button
              onClick={() => setShowOutreach(true)}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Lav outreach
            </Button>
          </div>
        </div>

        {/* Profile Hero */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-24 h-24 rounded-full border-4 border-background"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{candidate.name}</h2>
                    <p className="text-muted-foreground">{candidate.currentRole}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-4xl font-bold ${getScoreColor(
                        candidate.alignmentScore
                      )}`}
                    >
                      {candidate.alignmentScore}
                    </div>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <button className="text-xs text-primary hover:underline flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            Hvorfor {candidate.alignmentScore}?
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">Klik for at se score-fordeling og kvitteringer</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {candidate.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {candidate.location}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {candidate.skills.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {/* Behavioral Insights */}
                <BehavioralBadges username={candidate.id} className="mt-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Coverage Indicator */}
        <Card className="mb-6 bg-muted/30">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Datadækning:</span>
                <div className="flex items-center gap-3">
                  {/* GitHub */}
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <GitBranch className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-500">GitHub</span>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Forbundet - repos, commits, PRs</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>

                  {/* LinkedIn */}
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button className="flex items-center gap-1.5 hover:opacity-80">
                          <Linkedin className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-yellow-500">LinkedIn</span>
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Mangler - tilføj for bedre kontekst</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>

                  {/* Portfolio */}
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button className="flex items-center gap-1.5 hover:opacity-80">
                          <LinkIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Portfolio</span>
                          <Plus className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Tilføj portfolio/cases</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <Plus className="w-3 h-3" />
                Tilføj kilde
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Overblik
          </Button>
          <Button
            variant={activeTab === "questions" ? "default" : "ghost"}
            onClick={() => setActiveTab("questions")}
            className="gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            Interviewguide
          </Button>
          <Button
            variant={activeTab === "persona" ? "default" : "ghost"}
            onClick={() => setActiveTab("persona")}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            Persona
          </Button>
          <Button
            variant={activeTab === "github" ? "default" : "ghost"}
            onClick={() => setActiveTab("github")}
            className="gap-2"
          >
            <GitBranch className="w-4 h-4" />
            GitHub-aktivitet
          </Button>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <BentoGrid className="auto-rows-[minmax(140px,_1fr)]">
            {/* Key Evidence - Large Card (2x2) */}
            <BentoCard colSpan={2} rowSpan={2} className="bg-gradient-to-br from-green-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Stærkeste beviser</h3>
                  <p className="text-xs text-muted-foreground">Baseret på GitHub + LinkedIn + øvrige kilder</p>
                </div>
              </div>
              <TooltipProvider>
                {candidate.keyEvidenceWithSources && candidate.keyEvidenceWithSources.length > 0 ? (
                  <ul className="space-y-3">
                    {candidate.keyEvidenceWithSources.map((item, i) => {
                      const sourceInfo = getSourceInfo(item.source);
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <span>{item.claim}</span>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <button className={`ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${sourceInfo.color} bg-muted hover:bg-muted/80`}>
                                  {sourceInfo.icon}
                                  <span>{sourceInfo.label}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{sourceInfo.label}</p>
                                {item.sourceDetail && <p className="text-xs text-muted-foreground">{item.sourceDetail}</p>}
                              </TooltipContent>
                            </UITooltip>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : candidate.keyEvidence && candidate.keyEvidence.length > 0 ? (
                  <ul className="space-y-3">
                    {candidate.keyEvidence.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Run AI Analysis to see evidence
                  </p>
                )}
              </TooltipProvider>
            </BentoCard>

            {/* Alignment Score - Small Card (1x1) */}
            <BentoCard colSpan={1} rowSpan={1} className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
              <div className={`text-5xl font-bold ${getScoreColor(candidate.alignmentScore)}`}>
                {candidate.alignmentScore}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Alignment Score</p>
              {candidate.persona?.archetype && (
                <Badge className="mt-2" variant="outline">
                  {candidate.persona.archetype.split(" ").slice(0, 2).join(" ")}
                </Badge>
              )}
            </BentoCard>

            {/* Potential Gaps - Tall Card (1x2) */}
            <BentoCard colSpan={1} rowSpan={2} className="bg-gradient-to-br from-yellow-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Uklarheder at afklare</h3>
                  <p className="text-xs text-muted-foreground">Ting vi mangler bevis for</p>
                </div>
              </div>
              <TooltipProvider>
                {candidate.risksWithSources && candidate.risksWithSources.length > 0 ? (
                  <ul className="space-y-3">
                    {candidate.risksWithSources.slice(0, 4).map((item, i) => {
                      const sourceInfo = getSourceInfo(item.source);
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="line-clamp-2">{item.claim}</span>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <button className={`ml-1 inline-flex items-center gap-0.5 px-1 py-0 rounded text-[10px] ${sourceInfo.color} bg-muted hover:bg-muted/80`}>
                                  {sourceInfo.icon}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{sourceInfo.label}</p>
                              </TooltipContent>
                            </UITooltip>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : candidate.risks && candidate.risks.length > 0 ? (
                  <ul className="space-y-3">
                    {candidate.risks.slice(0, 4).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                        <span className="line-clamp-2">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No gaps identified
                  </p>
                )}
              </TooltipProvider>
            </BentoCard>

            {/* Score Breakdown / Radar - Wide Card (3x1) */}
            <BentoCard colSpan={3} rowSpan={1}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Score-fordeling</h3>
                  <p className="text-xs text-muted-foreground">Klik for at se vægtning + kilder pr. kategori</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="h-40">
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Run AI Analysis to see chart
                    </div>
                  )}
                </div>

                {/* Progress Bars */}
                {candidate.scoreBreakdown ? (
                  <div className="space-y-3">
                    {[
                      { key: "skills", label: "Skills", labelDa: "Kompetencer" },
                      { key: "experience", label: "Experience", labelDa: "Erfaring" },
                      { key: "industry", label: "Industry", labelDa: "Branche" },
                      { key: "seniority", label: "Seniority", labelDa: "Senioritet" },
                      { key: "location", label: "Location", labelDa: "Lokation" },
                    ].map(({ key, label, labelDa }) => {
                      const component =
                        candidate.scoreBreakdown?.[
                          key as keyof typeof candidate.scoreBreakdown
                        ];
                      if (!component) return null;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{labelDa}</span>
                            <span className={getScoreColor(component.percentage)}>
                              {component.percentage}%
                            </span>
                          </div>
                          <Progress
                            value={component.percentage}
                            className="h-1.5"
                            indicatorClassName={getScoreBarColor(component.percentage)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-muted-foreground text-sm">
                    Kør AI-analyse for at se fordeling
                  </div>
                )}
              </div>
            </BentoCard>
          </BentoGrid>
        )}

        {activeTab === "questions" && (
          <Card>
            <CardHeader>
              <CardTitle>Interview Guide</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.deepProfile?.questions &&
              candidate.deepProfile.questions.length > 0 ? (
                <div className="space-y-6">
                  {candidate.deepProfile.questions.map((q, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{q.category}</Badge>
                      </div>
                      <h4 className="font-medium mb-2">{q.question}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {q.context}
                      </p>
                      <div className="text-sm bg-background p-3 rounded border">
                        <span className="font-medium">Expected Answer: </span>
                        {q.expectedAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Run AI Analysis to generate interview questions
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "persona" && (
          <div className="space-y-6">
            {candidate.persona ? (
              <>
                {/* Archetype */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Archetype
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg">{candidate.persona.archetype}</p>
                  </CardContent>
                </Card>

                {/* Psychometric */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Psychometric Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Communication Style Indicator */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Communication Style</span>
                          <span className="font-medium">{candidate.persona.psychometric.communicationStyle}</span>
                        </div>
                        <div className="flex gap-1">
                          {['Reserved', 'Balanced', 'Direct', 'Assertive'].map((style, i) => (
                            <div
                              key={style}
                              className={`h-2 flex-1 rounded-full ${
                                candidate.persona?.psychometric.communicationStyle?.toLowerCase().includes(style.toLowerCase())
                                  ? 'bg-primary'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Motivator Badge */}
                      <div>
                        <span className="text-sm text-muted-foreground">Primary Motivator</span>
                        <div className="mt-1">
                          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                            {candidate.persona.psychometric.primaryMotivator}
                          </Badge>
                        </div>
                      </div>

                      {/* Risk Tolerance Gauge */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Risk Tolerance</span>
                          <span className="font-medium capitalize">{candidate.persona.psychometric.riskTolerance}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              candidate.persona.psychometric.riskTolerance?.toLowerCase() === 'high'
                                ? 'w-full bg-red-500'
                                : candidate.persona.psychometric.riskTolerance?.toLowerCase() === 'moderate'
                                ? 'w-2/3 bg-yellow-500'
                                : 'w-1/3 bg-green-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Leadership Potential */}
                      <div>
                        <span className="text-sm text-muted-foreground">Leadership Potential</span>
                        <div className="mt-1">
                          <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                            {candidate.persona.psychometric.leadershipPotential}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {candidate.persona.careerTrajectory && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Career Trajectory
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Growth Velocity */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Growth Velocity</span>
                            <span className="font-medium capitalize">{candidate.persona.careerTrajectory.growthVelocity}</span>
                          </div>
                          <div className="flex gap-1">
                            {['slow', 'steady', 'rapid'].map((level) => (
                              <div
                                key={level}
                                className={`h-2 flex-1 rounded-full ${
                                  candidate.persona?.careerTrajectory?.growthVelocity === level
                                    ? level === 'rapid' ? 'bg-green-500' : level === 'steady' ? 'bg-yellow-500' : 'bg-orange-500'
                                    : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Promotion Frequency */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Promotion Frequency</span>
                            <span className="font-medium capitalize">{candidate.persona.careerTrajectory.promotionFrequency}</span>
                          </div>
                          <div className="flex gap-1">
                            {['low', 'moderate', 'high'].map((level) => (
                              <div
                                key={level}
                                className={`h-2 flex-1 rounded-full ${
                                  candidate.persona?.careerTrajectory?.promotionFrequency === level
                                    ? level === 'high' ? 'bg-green-500' : level === 'moderate' ? 'bg-yellow-500' : 'bg-orange-500'
                                    : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Tenure Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-lg font-bold">{candidate.persona.careerTrajectory.averageTenure}</div>
                            <div className="text-xs text-muted-foreground">Avg Tenure</div>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <div className="text-lg font-bold capitalize">{candidate.persona.careerTrajectory.tenurePattern}</div>
                            <div className="text-xs text-muted-foreground">Pattern</div>
                          </div>
                        </div>

                        {/* Industry Pivots */}
                        {candidate.persona.careerTrajectory.industryPivots !== undefined && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Industry Pivots</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">{candidate.persona.careerTrajectory.industryPivots}</span>
                              {candidate.persona.careerTrajectory.industryPivots > 2 && (
                                <Badge variant="outline" className="text-xs">Diverse</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Flags */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        Green Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.persona.greenFlags.map((flag, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        Red Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.persona.redFlags.length > 0 ? (
                          candidate.persona.redFlags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                              {flag}
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">No red flags identified</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Assessment */}
                {candidate.persona.riskAssessment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Risk Gauges */}
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Attrition Risk */}
                        <div className="p-4 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Attrition Risk</span>
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                candidate.persona.riskAssessment.attritionRisk === 'low'
                                  ? 'border-green-500 text-green-500'
                                  : candidate.persona.riskAssessment.attritionRisk === 'moderate'
                                  ? 'border-yellow-500 text-yellow-500'
                                  : 'border-red-500 text-red-500'
                              }`}
                            >
                              {candidate.persona.riskAssessment.attritionRisk}
                            </Badge>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                candidate.persona.riskAssessment.attritionRisk === 'low'
                                  ? 'w-1/3 bg-green-500'
                                  : candidate.persona.riskAssessment.attritionRisk === 'moderate'
                                  ? 'w-2/3 bg-yellow-500'
                                  : 'w-full bg-red-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Skill Obsolescence */}
                        <div className="p-4 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Skill Obsolescence</span>
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                candidate.persona.riskAssessment.skillObsolescenceRisk === 'low'
                                  ? 'border-green-500 text-green-500'
                                  : candidate.persona.riskAssessment.skillObsolescenceRisk === 'moderate'
                                  ? 'border-yellow-500 text-yellow-500'
                                  : 'border-red-500 text-red-500'
                              }`}
                            >
                              {candidate.persona.riskAssessment.skillObsolescenceRisk}
                            </Badge>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                candidate.persona.riskAssessment.skillObsolescenceRisk === 'low'
                                  ? 'w-1/3 bg-green-500'
                                  : candidate.persona.riskAssessment.skillObsolescenceRisk === 'moderate'
                                  ? 'w-2/3 bg-yellow-500'
                                  : 'w-full bg-red-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Compensation Risk */}
                        <div className="p-4 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Compensation Risk</span>
                            <Badge
                              variant="outline"
                              className={`capitalize ${
                                candidate.persona.riskAssessment.compensationRiskLevel === 'low'
                                  ? 'border-green-500 text-green-500'
                                  : candidate.persona.riskAssessment.compensationRiskLevel === 'moderate'
                                  ? 'border-yellow-500 text-yellow-500'
                                  : 'border-red-500 text-red-500'
                              }`}
                            >
                              {candidate.persona.riskAssessment.compensationRiskLevel}
                            </Badge>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                candidate.persona.riskAssessment.compensationRiskLevel === 'low'
                                  ? 'w-1/3 bg-green-500'
                                  : candidate.persona.riskAssessment.compensationRiskLevel === 'moderate'
                                  ? 'w-2/3 bg-yellow-500'
                                  : 'w-full bg-red-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Flight Risk Factors */}
                      {candidate.persona.riskAssessment.flightRiskFactors &&
                       candidate.persona.riskAssessment.flightRiskFactors.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Flight Risk Factors</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.persona.riskAssessment.flightRiskFactors.map((factor, i) => (
                              <Badge key={i} variant="outline" className="border-orange-500/50 text-orange-500">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Geographic Barriers */}
                      {candidate.persona.riskAssessment.geographicBarriers &&
                       candidate.persona.riskAssessment.geographicBarriers.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Geographic Barriers</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.persona.riskAssessment.geographicBarriers.map((barrier, i) => (
                              <Badge key={i} variant="secondary">
                                <MapPin className="w-3 h-3 mr-1" />
                                {barrier}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unexplained Gaps Warning */}
                      {candidate.persona.riskAssessment.unexplainedGaps && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-yellow-500">Unexplained career gaps detected</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Persona Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Run AI Analysis to generate a detailed persona profile
                  </p>
                  <Button onClick={runDeepAnalysis} disabled={analyzing}>
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Generate Persona
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "github" && (
          <div className="space-y-6">
            {loadingGithub ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <GitHubLoadingScramble />
                </CardContent>
              </Card>
            ) : githubAnalysis ? (
              <>
                {/* Commit Activity Chart */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Commit Activity by Day
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(githubAnalysis.commitActivity.commitsByDay).map(
                              ([day, count]) => ({ day: day.slice(0, 3), commits: count })
                            )}
                          >
                            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="commits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="text-2xl font-bold">{githubAnalysis.commitActivity.totalCommits}</div>
                          <div className="text-xs text-muted-foreground">Est. Commits</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="text-2xl font-bold">{githubAnalysis.commitActivity.avgCommitsPerWeek}</div>
                          <div className="text-xs text-muted-foreground">Per Week</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Languages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Top Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {githubAnalysis.topLanguages.map((lang, i) => {
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
                          return (
                            <div key={lang.name}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{lang.name}</span>
                                <span className="text-muted-foreground">{lang.percentage}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${colors[i % colors.length]}`}
                                  style={{ width: `${lang.percentage}%` }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {lang.repoCount} repositories
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Metrics */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {githubAnalysis.pullRequests.totalOpened}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">PRs Opened</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-500">
                          {githubAnalysis.pullRequests.totalMerged}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">PRs Merged</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-500">
                          {githubAnalysis.codeReview.reviewsGiven}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Reviews Given</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-500">
                          {githubAnalysis.codeReview.commentsGiven}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Comments</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contribution Patterns & Collaboration */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Contribution Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Consistency</span>
                          <Badge
                            variant="outline"
                            className={`capitalize ${
                              githubAnalysis.contributionPatterns.consistency === 'high'
                                ? 'border-green-500 text-green-500'
                                : githubAnalysis.contributionPatterns.consistency === 'moderate'
                                ? 'border-yellow-500 text-yellow-500'
                                : 'border-orange-500 text-orange-500'
                            }`}
                          >
                            {githubAnalysis.contributionPatterns.consistency}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="text-lg font-bold">{githubAnalysis.commitActivity.mostActiveDay}</div>
                          <div className="text-xs text-muted-foreground">Most Active Day</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="text-lg font-bold">{githubAnalysis.commitActivity.mostActiveHour}:00</div>
                          <div className="text-xs text-muted-foreground">Peak Hour</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">Current Streak</span>
                        <span className="font-bold">{githubAnalysis.contributionPatterns.streak} days</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Collaboration Style
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Work Style</span>
                        <Badge
                          className={`capitalize ${
                            githubAnalysis.collaborationStyle.style === 'collaborative'
                              ? 'bg-blue-500/20 text-blue-500'
                              : githubAnalysis.collaborationStyle.style === 'solo'
                              ? 'bg-purple-500/20 text-purple-500'
                              : 'bg-green-500/20 text-green-500'
                          }`}
                        >
                          {githubAnalysis.collaborationStyle.style}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="text-xl font-bold">{githubAnalysis.collaborationStyle.soloProjects}</div>
                          <div className="text-xs text-muted-foreground">Solo</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="text-xl font-bold">{githubAnalysis.collaborationStyle.teamProjects}</div>
                          <div className="text-xs text-muted-foreground">Team</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="text-xl font-bold">{githubAnalysis.collaborationStyle.opensourceContributions}</div>
                          <div className="text-xs text-muted-foreground">OSS</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent PRs */}
                {githubAnalysis.pullRequests.recentPRs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Recent Pull Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {githubAnalysis.pullRequests.recentPRs.map((pr, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{pr.title}</p>
                              <p className="text-xs text-muted-foreground">{pr.repo}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                pr.state === 'merged'
                                  ? 'border-purple-500 text-purple-500'
                                  : pr.state === 'closed'
                                  ? 'border-red-500 text-red-500'
                                  : 'border-green-500 text-green-500'
                              }
                            >
                              {pr.state}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">GitHub Analysis Unavailable</h3>
                  <p className="text-muted-foreground">
                    Unable to fetch GitHub activity data for this user
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Outreach Modal */}
        {candidate && (
          <OutreachModal
            isOpen={showOutreach}
            onClose={() => setShowOutreach(false)}
            candidate={{
              name: candidate.name,
              currentRole: candidate.currentRole,
              company: candidate.company,
              avatar: candidate.avatar,
            }}
            jobContext={jobContext || undefined}
          />
        )}
      </div>
    </div>
  );
}

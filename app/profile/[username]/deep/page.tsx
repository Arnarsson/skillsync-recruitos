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
  DollarSign,
  TrendingDown,
  Coins,
  Target,
  Phone,
  Mail,
  Users,
  Clock,
  Shield,
  MessageCircle,
  Route,
  Zap,
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OutreachModal from "@/components/OutreachModal";
import { BehavioralBadges } from "@/components/BehavioralBadges";
// DISABLED: LinkedIn connection path (keeping GitHub connection path only)
// import { LinkedInConnectionPath } from "@/components/LinkedInConnectionPath";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
  compensationIntelligence?: {
    impliedSalaryBand: { min: number; max: number; currency: string };
    compensationGrowthRate: "aggressive" | "steady" | "flat";
    equityIndicators: boolean;
    likelySalaryExpectation: number;
  };
}

// Network Dossier for Contact Strategy (Stage 3 only)
interface NetworkDossier {
  strategyContext: {
    industryPosition: string;
    companyDynamics: string;
    marketTiming: string;
    competitiveIntel: string;
  };
  networkIntelligence: {
    inferredConnections: string[];
    introductionPaths: string[];
    professionalCommunities: string[];
    thoughtLeadership: string;
  };
  culturalFit: {
    currentCultureProfile: string;
    targetCultureMatch: string;
    adaptationChallenges: string[];
    motivationalDrivers: string[];
  };
  engagementPlaybook: {
    primaryApproach: string;
    conversationStarters: string[];
    timingConsiderations: string;
    objectionHandling: Array<{ objection: string; response: string }>;
    bestContactMethod: 'linkedin' | 'email' | 'github' | 'referral';
    redFlagsToAvoid: string[];
  };
  generatedAt: string;
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
  linkedinUrl?: string; // LinkedIn profile URL for connection path feature
  sourceUrl?: string; // Original source URL (LinkedIn, GitHub, etc.)
  scoreBreakdown?: {
    // New format from AI analysis
    skills?: { value: number; max: number; percentage: number };
    experience?: { value: number; max: number; percentage: number };
    industry?: { value: number; max: number; percentage: number };
    seniority?: { value: number; max: number; percentage: number };
    location?: { value: number; max: number; percentage: number };
    // Old format from pipeline search
    requiredMatched?: string[];
    requiredMissing?: string[];
    preferredMatched?: string[];
    locationMatch?: "exact" | "remote" | "none";
    baseScore?: number;
    skillsScore?: number;
    preferredScore?: number;
    locationScore?: number;
  };
  persona?: Persona;
  deepProfile?: DeepProfile;
  networkDossier?: NetworkDossier;
  isShortlisted?: boolean;
}

export default function DeepProfilePage() {
  const params = useParams();
  const { isAdmin } = useAdmin();
  const username = params.username as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "persona" | "github" | "contact">("overview");
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
    async function loadCandidate() {
      // First try to load candidate from localStorage (pipeline)
      const stored = localStorage.getItem("apex_candidates");
      if (stored) {
        try {
          const candidates = JSON.parse(stored) as Candidate[];
          const found = candidates.find((c) => c.id === username);
          if (found) {
            setCandidate(found);
            setLoading(false);
            return;
          }
        } catch {
          // Ignore parse errors
        }
      }

      // If not in pipeline, fetch from GitHub API
      // [DEBUG] Fallback trigger verified
      console.log("Candidate not in pipeline, attempting GitHub fallback for:", username);
      try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (response.ok) {
          const user = await response.json();

          // Create a basic candidate object from GitHub data
          const githubCandidate: Candidate = {
            id: user.login,
            name: user.name || user.login,
            currentRole: user.bio ? user.bio.split('.')[0] : 'Software Developer',
            company: user.company?.replace(/^@/, '') || '',
            location: user.location || '',
            skills: [], // Will be populated by analysis
            alignmentScore: 0,
            avatar: user.avatar_url,
            sourceUrl: `https://github.com/${user.login}`,
          };

          setCandidate(githubCandidate);
        }
      } catch (error) {
        console.error("Failed to fetch GitHub profile:", error);
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
    }

    loadCandidate();
  }, [username]);

  const runDeepAnalysis = useCallback(async () => {
    if (!candidate) return;
    setAnalyzing(true);

    try {
      // Check if candidate is shortlisted (Stage 3) to determine if we should generate network dossier
      const isShortlisted = candidate.isShortlisted || false;

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
          isShortlisted, // Pass flag to trigger network dossier generation for Stage 3
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
          networkDossier: data.networkDossier, // Will be null for non-shortlisted
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

  // Convert pipeline scoreBreakdown format to display format
  // Pipeline format: { requiredMatched[], skillsScore, locationScore, ... }
  // AI format: { skills: { percentage }, experience: { percentage }, ... }
  const normalizedScoreBreakdown = (() => {
    if (!candidate.scoreBreakdown) return null;

    // Check if it's the AI analysis format (has skills.percentage)
    if (candidate.scoreBreakdown.skills?.percentage !== undefined) {
      return candidate.scoreBreakdown;
    }

    // Pipeline format - calculate percentages from matched skills
    const sb = candidate.scoreBreakdown;
    const requiredTotal = (sb.requiredMatched?.length || 0) + (sb.requiredMissing?.length || 0);
    const requiredMatched = sb.requiredMatched?.length || 0;

    // Calculate skill match percentage (0-100)
    const skillsPercentage = requiredTotal > 0
      ? Math.round((requiredMatched / requiredTotal) * 100)
      : 50;

    // Location: exact=100, remote=50, none=0
    const locationPercentage = sb.locationMatch === "exact" ? 100
      : sb.locationMatch === "remote" ? 50
      : 0;

    // Use alignment score for overall "fit"
    const overallFit = candidate.alignmentScore;

    return {
      skills: { percentage: skillsPercentage },
      experience: { percentage: overallFit }, // Use overall score as proxy
      industry: { percentage: Math.min(100, overallFit + 10) }, // Slight variation
      seniority: { percentage: Math.max(0, overallFit - 5) }, // Slight variation
      location: { percentage: locationPercentage },
    };
  })();

  const radarData = normalizedScoreBreakdown
    ? [
        { subject: "Skills", value: normalizedScoreBreakdown.skills?.percentage || 0 },
        { subject: "Erfaring", value: normalizedScoreBreakdown.experience?.percentage || 0 },
        { subject: "Branche", value: normalizedScoreBreakdown.industry?.percentage || 0 },
        { subject: "Niveau", value: normalizedScoreBreakdown.seniority?.percentage || 0 },
        { subject: "Lokation", value: normalizedScoreBreakdown.location?.percentage || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={`/pipeline`}>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <Badge className="mb-1 sm:mb-2 bg-primary/20 text-primary text-xs">Trin 3 af 4</Badge>
              <h1 className="text-xl sm:text-3xl font-bold">Dybdeprofil</h1>
            </div>
          </div>
          <div className="flex gap-2 pl-11 sm:pl-0">
            <Button
              onClick={runDeepAnalysis}
              disabled={analyzing}
              variant="outline"
              size="sm"
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              {analyzing ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="hidden xs:inline">{candidate.persona ? "Opdatér analyse" : "Kør AI-analyse"}</span>
              <span className="xs:hidden">{candidate.persona ? "Opdatér" : "Analysér"}</span>
            </Button>
            <Button
              onClick={() => setShowOutreach(true)}
              size="sm"
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Lav outreach</span>
              <span className="xs:hidden">Outreach</span>
            </Button>
          </div>
        </div>

        {/* Profile Hero */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {/* Avatar and Score Row on Mobile */}
              <div className="flex items-center gap-4 sm:block">
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-background shrink-0"
                />
                {/* Score visible on mobile next to avatar */}
                <div className="sm:hidden text-right flex-1">
                  <div
                    className={`text-3xl font-bold ${getScoreColor(
                      candidate.alignmentScore
                    )}`}
                  >
                    {candidate.alignmentScore}
                  </div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button className="text-xs text-primary hover:underline flex items-center gap-1 justify-end">
                          <HelpCircle className="w-3 h-3" />
                          Hvorfor?
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs">Klik for at se score-fordeling og kvitteringer</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold truncate">{candidate.name}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground truncate">{candidate.currentRole}</p>
                  </div>
                  {/* Score hidden on mobile, shown on desktop */}
                  <div className="hidden sm:block text-right shrink-0">
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
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{candidate.company}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[100px] sm:max-w-none">{candidate.location}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  {candidate.skills.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {/* Behavioral Insights */}
                <BehavioralBadges username={candidate.id} className="mt-3 sm:mt-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Coverage Indicator */}
        <Card className="mb-4 sm:mb-6 bg-muted/30">
          <CardContent className="py-2.5 sm:py-3 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Data:</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* GitHub */}
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                          <span className="text-xs text-green-500 hidden sm:inline">GitHub</span>
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
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
                        <button className="flex items-center gap-1 hover:opacity-80">
                          <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                          <span className="text-xs text-yellow-500 hidden sm:inline">LinkedIn</span>
                          <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500" />
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
                        <button className="flex items-center gap-1 hover:opacity-80">
                          <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground hidden sm:inline">Portfolio</span>
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Tilføj portfolio/cases</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 w-full sm:w-auto">
                <Plus className="w-3 h-3" />
                Tilføj kilde
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Overblik</span>
            <span className="sm:hidden">Overblik</span>
          </Button>
          <Button
            variant={activeTab === "questions" ? "default" : "ghost"}
            onClick={() => setActiveTab("questions")}
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
          >
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Interviewguide</span>
            <span className="sm:hidden">Interview</span>
          </Button>
          <Button
            variant={activeTab === "persona" ? "default" : "ghost"}
            onClick={() => setActiveTab("persona")}
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
          >
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Persona
          </Button>
          <Button
            variant={activeTab === "github" ? "default" : "ghost"}
            onClick={() => setActiveTab("github")}
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
          >
            <GitBranch className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            GitHub
          </Button>
          <Button
            variant={activeTab === "contact" ? "default" : "ghost"}
            onClick={() => setActiveTab("contact")}
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Kontaktstrategi</span>
            <span className="sm:hidden">Kontakt</span>
          </Button>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <BentoGrid className="auto-rows-[minmax(140px,_1fr)]">
            {/* Key Evidence */}
            <BentoCard colSpan={2} rowSpan={1} className="bg-gradient-to-br from-green-500/5 to-transparent">
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

            {/* Alignment Score */}
            <BentoCard colSpan={1} rowSpan={2} className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
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

            {/* Potential Gaps */}
            <BentoCard colSpan={2} rowSpan={1} className="bg-gradient-to-br from-yellow-500/5 to-transparent">
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
                  <h3 className="font-semibold text-white">Score-fordeling</h3>
                  <p className="text-xs text-neutral-400">Klik for at se vægtning + kilder pr. kategori</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Radar Chart */}
                <div className="h-56">
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#525252" strokeOpacity={0.6} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#e5e5e5", fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="#22d3ee"
                          fill="#22d3ee"
                          fillOpacity={0.4}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Kør AI-analyse for at se graf
                    </div>
                  )}
                </div>

                {/* Progress Bars */}
                {normalizedScoreBreakdown ? (
                  <div className="space-y-3">
                    {[
                      { key: "skills", labelDa: "Kompetencer" },
                      { key: "experience", labelDa: "Erfaring" },
                      { key: "industry", labelDa: "Branche" },
                      { key: "seniority", labelDa: "Senioritet" },
                      { key: "location", labelDa: "Lokation" },
                    ].map(({ key, labelDa }) => {
                      const component =
                        normalizedScoreBreakdown[
                          key as keyof typeof normalizedScoreBreakdown
                        ] as { percentage: number } | undefined;
                      if (!component || typeof component.percentage !== 'number') return null;
                      const pct = Math.round(component.percentage);
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-300">{labelDa}</span>
                            <span className={getScoreColor(pct)}>
                              {pct}%
                            </span>
                          </div>
                          <Progress
                            value={pct}
                            className="h-2"
                            indicatorClassName={getScoreBarColor(pct)}
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

                {/* Compensation Intelligence */}
                {candidate.persona.compensationIntelligence && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        Compensation Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Salary Range Visualization */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Implied Salary Band</span>
                          <span className="font-medium">
                            {candidate.persona.compensationIntelligence.impliedSalaryBand.currency}{' '}
                            {candidate.persona.compensationIntelligence.impliedSalaryBand.min.toLocaleString()} - {candidate.persona.compensationIntelligence.impliedSalaryBand.max.toLocaleString()}
                          </span>
                        </div>
                        {/* Range Bar Visualization */}
                        <div className="relative h-8 rounded-lg bg-muted/50 overflow-hidden">
                          {/* Background gradient to show range context */}
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-yellow-500/20 to-red-500/20" />
                          {/* The salary range indicator */}
                          {(() => {
                            const min = candidate.persona.compensationIntelligence!.impliedSalaryBand.min;
                            const max = candidate.persona.compensationIntelligence!.impliedSalaryBand.max;
                            const expected = candidate.persona.compensationIntelligence!.likelySalaryExpectation;
                            // Assume a reasonable market range for visualization (e.g., 50k-300k)
                            const marketMin = Math.max(0, min * 0.5);
                            const marketMax = max * 1.5;
                            const range = marketMax - marketMin;
                            const leftPct = ((min - marketMin) / range) * 100;
                            const widthPct = ((max - min) / range) * 100;
                            const expectedPct = ((expected - marketMin) / range) * 100;
                            return (
                              <>
                                {/* Salary band range */}
                                <div
                                  className="absolute top-1 bottom-1 rounded bg-primary/60"
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                />
                                {/* Expected salary marker */}
                                {expected > 0 && (
                                  <div
                                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                                    style={{ left: `${Math.min(95, Math.max(5, expectedPct))}%` }}
                                  >
                                    <TooltipProvider>
                                      <UITooltip>
                                        <TooltipTrigger asChild>
                                          <div className="absolute -top-1 -left-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary shadow cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">
                                            Likely Expectation: {candidate.persona.compensationIntelligence!.impliedSalaryBand.currency}{' '}
                                            {expected.toLocaleString()}
                                          </p>
                                        </TooltipContent>
                                      </UITooltip>
                                    </TooltipProvider>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        {/* Range labels */}
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{candidate.persona.compensationIntelligence.impliedSalaryBand.currency} {candidate.persona.compensationIntelligence.impliedSalaryBand.min.toLocaleString()}</span>
                          <span>{candidate.persona.compensationIntelligence.impliedSalaryBand.currency} {candidate.persona.compensationIntelligence.impliedSalaryBand.max.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {/* Growth Rate */}
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            {candidate.persona.compensationIntelligence.compensationGrowthRate === 'aggressive' ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : candidate.persona.compensationIntelligence.compensationGrowthRate === 'steady' ? (
                              <TrendingUp className="w-4 h-4 text-yellow-500 rotate-[-15deg]" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <div className={`text-sm font-bold capitalize ${
                            candidate.persona.compensationIntelligence.compensationGrowthRate === 'aggressive'
                              ? 'text-green-500'
                              : candidate.persona.compensationIntelligence.compensationGrowthRate === 'steady'
                              ? 'text-yellow-500'
                              : 'text-orange-500'
                          }`}>
                            {candidate.persona.compensationIntelligence.compensationGrowthRate}
                          </div>
                          <div className="text-xs text-muted-foreground">Growth Rate</div>
                        </div>

                        {/* Likely Expectation */}
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-sm font-bold text-primary">
                            {candidate.persona.compensationIntelligence.impliedSalaryBand.currency}{' '}
                            {candidate.persona.compensationIntelligence.likelySalaryExpectation.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Likely Expectation</div>
                        </div>

                        {/* Equity Indicators */}
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Coins className="w-4 h-4 text-purple-500" />
                          </div>
                          <div className={`text-sm font-bold ${
                            candidate.persona.compensationIntelligence.equityIndicators
                              ? 'text-purple-500'
                              : 'text-muted-foreground'
                          }`}>
                            {candidate.persona.compensationIntelligence.equityIndicators ? 'Yes' : 'No'}
                          </div>
                          <div className="text-xs text-muted-foreground">Equity Expected</div>
                        </div>
                      </div>

                      {/* Context Note */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Compensation estimates are based on role seniority, location, and industry benchmarks.
                          {candidate.persona.compensationIntelligence.equityIndicators && (
                            <> Startup experience suggests equity expectations may be part of total compensation package.</>
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
            {/* GitHub Data Context Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-500">Public Activity Only</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This analysis reflects public GitHub activity only. Private repositories and
                  enterprise work are not included. Contribution data may underrepresent actual
                  coding activity.
                </p>
              </div>
            </div>

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <Card>
                    <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-primary">
                          {githubAnalysis.pullRequests.totalOpened}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">PRs Opened</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-green-500">
                          {githubAnalysis.pullRequests.totalMerged}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">PRs Merged</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-purple-500">
                          {githubAnalysis.codeReview.reviewsGiven}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">Reviews</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-500">
                          {githubAnalysis.codeReview.commentsGiven}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">Comments</div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

        {activeTab === "contact" && (
          <div className="space-y-6">
            {candidate.networkDossier ? (
              <>
                {/* Best Contact Method Hero */}
                <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`p-3 sm:p-4 rounded-xl shrink-0 ${
                        candidate.networkDossier.engagementPlaybook.bestContactMethod === 'linkedin'
                          ? 'bg-blue-500/20'
                          : candidate.networkDossier.engagementPlaybook.bestContactMethod === 'email'
                          ? 'bg-green-500/20'
                          : candidate.networkDossier.engagementPlaybook.bestContactMethod === 'github'
                          ? 'bg-purple-500/20'
                          : 'bg-orange-500/20'
                      }`}>
                        {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'linkedin' && <Linkedin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />}
                        {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'email' && <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />}
                        {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'github' && <GitBranch className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />}
                        {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'referral' && <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground">Anbefalet kontaktmetode</p>
                        <p className="text-lg sm:text-2xl font-bold capitalize">
                          {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'linkedin' && 'LinkedIn'}
                          {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'email' && 'E-mail'}
                          {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'github' && 'GitHub'}
                          {candidate.networkDossier.engagementPlaybook.bestContactMethod === 'referral' && 'Warm Intro'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {candidate.networkDossier.engagementPlaybook.primaryApproach}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversation Starters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      Samtalestartere
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {candidate.networkDossier.engagementPlaybook.conversationStarters.map((starter, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="p-1.5 rounded-full bg-primary/20 text-primary shrink-0">
                            <Zap className="w-3 h-3" />
                          </div>
                          <p className="text-sm">{starter}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Connection Paths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Route className="w-4 h-4" />
                        Forbindelsesveje
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {candidate.networkDossier.networkIntelligence.introductionPaths.map((path, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              i === 0 ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                            }`}>
                              {i + 1}
                            </span>
                            <span>{path}</span>
                          </div>
                        ))}
                      </div>
                      {candidate.networkDossier.networkIntelligence.inferredConnections.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Mulige fælles forbindelser</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.networkDossier.networkIntelligence.inferredConnections.map((conn, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                {conn}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Timing & Communities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Timing & Kanaler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <p className="text-xs text-blue-500 font-medium mb-1">Optimal timing</p>
                          <p className="text-sm">{candidate.networkDossier.engagementPlaybook.timingConsiderations}</p>
                        </div>
                        {candidate.networkDossier.networkIntelligence.professionalCommunities.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Professionelle fællesskaber</p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.networkDossier.networkIntelligence.professionalCommunities.map((community, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {community}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {candidate.networkDossier.networkIntelligence.thoughtLeadership && (
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">Thought Leadership</p>
                            <p className="text-sm">{candidate.networkDossier.networkIntelligence.thoughtLeadership}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* DISABLED: LinkedIn Connection Path - keeping GitHub connection path only
                {candidate.linkedinUrl && (
                  <LinkedInConnectionPath
                    candidateLinkedInUrl={candidate.linkedinUrl}
                    candidateName={candidate.name}
                  />
                )}
                */}

                {/* Objection Handling */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      Indvendingshåndtering
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.networkDossier.engagementPlaybook.objectionHandling.map((item, i) => (
                        <div key={i} className="p-4 rounded-lg border">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-full bg-orange-500/20 shrink-0">
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-orange-500 mb-2">&quot;{item.objection}&quot;</p>
                              <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                                <p className="text-sm text-green-400">{item.response}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Red Flags to Avoid + Cultural Fit */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Red Flags to Avoid */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        Emner at undgå
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.networkDossier.engagementPlaybook.redFlagsToAvoid.map((flag, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Motivational Drivers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-500">
                        <Target className="w-4 h-4" />
                        Motivationsfaktorer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.networkDossier.culturalFit.motivationalDrivers.map((driver, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Strategic Context */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Info className="w-4 h-4" />
                      Strategisk kontekst
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Brancheposition</p>
                        <p className="text-sm">{candidate.networkDossier.strategyContext.industryPosition}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Virksomhedsdynamik</p>
                        <p className="text-sm">{candidate.networkDossier.strategyContext.companyDynamics}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Markedstiming</p>
                        <p className="text-sm">{candidate.networkDossier.strategyContext.marketTiming}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Konkurrenceanalyse</p>
                        <p className="text-sm">{candidate.networkDossier.strategyContext.competitiveIntel}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generation timestamp */}
                <p className="text-xs text-muted-foreground text-center">
                  Dossier genereret: {new Date(candidate.networkDossier.generatedAt).toLocaleDateString('da-DK', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </>
            ) : (
              <div className="space-y-6">
                {/* DISABLED: LinkedIn Connection Path - keeping GitHub connection path only
                {candidate.linkedinUrl && (
                  <LinkedInConnectionPath
                    candidateLinkedInUrl={candidate.linkedinUrl}
                    candidateName={candidate.name}
                  />
                )}
                */}

                <Card>
                  <CardContent className="py-12 text-center">
                    <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Fuld kontaktstrategi ikke tilgængelig</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      {candidate.linkedinUrl
                        ? "Brug LinkedIn-forbindelsesstien ovenfor til at finde en vej ind. Fuld kontaktstrategi genereres kun for shortlistede kandidater."
                        : "Kontaktstrategi genereres kun for shortlistede kandidater (Trin 3)."
                      }
                      {!candidate.isShortlisted && (
                        <span className="block mt-2 text-yellow-500">
                          Denne kandidat er ikke shortlistet endnu.
                        </span>
                      )}
                    </p>
                    {candidate.isShortlisted && (
                      <Button onClick={runDeepAnalysis} disabled={analyzing}>
                        {analyzing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Generer kontaktstrategi
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
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

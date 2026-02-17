"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAdmin } from "@/lib/adminContext";
import { candidateService } from "@/services/candidateService";
import type { Candidate as GlobalCandidate } from "@/types";
import {
  extractGitHubUsername,
  findCandidateInLocalCache,
  isUuidLike,
  type CandidateIdentitySource,
} from "@/lib/candidate-identity";
import Link from "next/link";
import { WorkflowStepper } from "@/components/WorkflowStepper";
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
  Share2,
  FileDown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OutreachModal from "@/components/OutreachModal";
import { BehavioralBadges } from "@/components/BehavioralBadges";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LinkedInConnectionPath } from "@/components/LinkedInConnectionPath";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { JobReadinessScore } from "@/components/JobReadinessScore";
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
    bigFive?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
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
  skills?: string[];
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
  const { status } = useSession();
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

  // Progressive disclosure state
  const [expandedSections, setExpandedSections] = useState<{
    bigFive: boolean;
    psychometric: boolean;
    careerTrajectory: boolean;
    compensation: boolean;
    riskAssessment: boolean;
    skillProfile: boolean;
  }>({
    bigFive: false,
    psychometric: false,
    careerTrajectory: false,
    compensation: false,
    riskAssessment: false,
    skillProfile: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Deep enrichment state
  const [enrichmentData, setEnrichmentData] = useState<{
    github: { readme: string | null; prsToOthers: any[]; contributionPattern: any; topics: string[] } | null;
    linkedin: { matches: any[]; bestMatch: any; autoAccepted: boolean } | null;
    website: { url: string; title: string; topics: string[]; hasProjects: boolean; hasBlog: boolean } | null;
    talks: { talks: any[]; hasTalks: boolean; platforms: string[] } | null;
  } | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<{
    loading: boolean;
    sources: { github: boolean | null; linkedin: boolean | null; website: boolean | null; talks: boolean | null };
    duration: number | null;
  }>({ loading: false, sources: { github: null, linkedin: null, website: null, talks: null }, duration: null });

  useEffect(() => {
    const isLikelyGitHubUsername = (value: string) => {
      if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)) return false;
      if (isUuidLike(value)) return false;
      if ((value.match(/-/g) || []).length > 1) return false;
      return true;
    };

    async function loadCandidate() {
      // Load job context from localStorage (not candidate data)
      const storedJob = localStorage.getItem("apex_job_context");
      if (storedJob) {
        try {
          setJobContext(JSON.parse(storedJob));
        } catch {
          // Ignore parse errors
        }
      }

      // Try API only for authenticated sessions to avoid noisy 401 requests.
      if (status === "authenticated") {
        try {
          const found = await candidateService.getById(username);
          if (found) {
            setCandidate(found as unknown as Candidate);
            setLoading(false);
            return;
          }
        } catch {
          // Candidate not found in API, fall through
        }
      }

      // Local fallback: load from cached pipeline candidates (demo/unauth flows).
      try {
        const cachedCandidates = localStorage.getItem("apex_candidates");
        if (cachedCandidates) {
          const parsed = JSON.parse(cachedCandidates) as Candidate[];
          const localMatch = findCandidateInLocalCache(
            parsed as unknown as CandidateIdentitySource[],
            username
          ) as unknown as Candidate | null;
          if (localMatch) {
            setCandidate(localMatch);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore local cache parse errors
      }

      // If not in pipeline, fetch from GitHub only for valid GitHub-like usernames.
      if (!isLikelyGitHubUsername(username)) {
        setLoading(false);
        return;
      }

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
            skills: [],
            alignmentScore: 0,
            avatar: user.avatar_url,
            sourceUrl: `https://github.com/${user.login}`,
          };

          setCandidate(githubCandidate);

          // Also persist to API for next time (auth-only).
          if (status === "authenticated") {
            try {
              await candidateService.create({
                ...(githubCandidate as unknown as Partial<GlobalCandidate>),
                name: githubCandidate.name,
                sourceType: 'GITHUB',
              });
            } catch {
              // Best-effort — candidate may already exist
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch GitHub profile:", error);
      }

      setLoading(false);
    }

    loadCandidate();
  }, [username, status]);

  const runDeepAnalysis = useCallback(async () => {
    if (!candidate) return;
    setAnalyzing(true);

    try {
      // Check if candidate is shortlisted (Stage 3) to determine if we should generate network dossier
      const isShortlisted = candidate.isShortlisted || false;

      // Format enrichment data for enhanced psychometric analysis
      const enrichmentPayload = enrichmentData ? {
        github: enrichmentData.github ? {
          readme: enrichmentData.github.readme,
          prsToOthers: enrichmentData.github.prsToOthers,
          contributionPattern: enrichmentData.github.contributionPattern,
          topics: enrichmentData.github.topics,
        } : null,
        linkedin: enrichmentData.linkedin?.bestMatch ? {
          headline: enrichmentData.linkedin.bestMatch.headline,
          location: enrichmentData.linkedin.bestMatch.location,
          company: enrichmentData.linkedin.bestMatch.company,
        } : null,
        website: enrichmentData.website,
        talks: enrichmentData.talks,
      } : null;

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
          enrichmentData: enrichmentPayload, // Pass enrichment for enhanced psychometric
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

        // Persist analysis results to API
        try {
          await candidateService.update(username, {
            persona: data.persona,
            deepAnalysis: data.deepProfile?.deepAnalysis,
            indicators: data.deepProfile?.indicators,
            interviewGuide: data.deepProfile?.questions,
            companyMatch: data.deepProfile?.companyMatch,
            cultureFit: data.deepProfile?.cultureFit,
            scoreBreakdown: data.scoreBreakdown,
            keyEvidence: data.keyEvidence,
            risks: data.risks,
            networkDossier: data.networkDossier,
          });
        } catch (err) {
          console.error("[Deep] Failed to persist analysis to API:", err);
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  }, [candidate, username, enrichmentData]);

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
      const lookupUsername = extractGitHubUsername(
        candidate as unknown as CandidateIdentitySource
      );
      if (!lookupUsername) {
        setLoadingGithub(false);
        return;
      }
      fetch(`/api/github/deep?username=${lookupUsername}`)
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

  // Fetch deep enrichment data on page load
  useEffect(() => {
    if (!candidate || enrichmentData || enrichmentStatus.loading) return;

    const fetchEnrichment = async () => {
      setEnrichmentStatus((prev) => ({ ...prev, loading: true }));
      const lookupUsername =
        extractGitHubUsername(candidate as unknown as CandidateIdentitySource) ||
        candidate.id;

      try {
        const response = await fetch("/api/deep-enrichment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: lookupUsername,
            githubProfile: {
              login: lookupUsername,
              name: candidate.name,
              bio: null, // Will be fetched by enrichment
              location: candidate.location,
              company: candidate.company,
              blog: candidate.sourceUrl?.includes("github") ? undefined : candidate.sourceUrl,
            },
            linkedInUrl: candidate.linkedinUrl,
          }),
        });

        const data = await response.json();

        setEnrichmentData({
          github: data.github,
          linkedin: data.linkedin,
          website: data.website,
          talks: data.talks,
        });

        setEnrichmentStatus({
          loading: false,
          sources: data.meta?.sources || { github: true, linkedin: true, website: true, talks: true },
          duration: data.meta?.duration || null,
        });

        console.log("[Deep Enrichment] Complete:", data.meta);
      } catch (error) {
        console.error("[Deep Enrichment] Error:", error);
        setEnrichmentStatus((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchEnrichment();
  }, [candidate, enrichmentData, enrichmentStatus.loading]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
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
        return { icon: <Lightbulb className="w-3 h-3" />, label: 'Inferred', color: 'text-amber-500' };
      case 'location_data':
        return { icon: <Globe className="w-3 h-3" />, label: 'Location', color: 'text-primary' };
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
              Back to Candidates
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
        {/* Workflow Stepper */}
        <div className="mb-6">
          <WorkflowStepper currentStep={4} />
        </div>

        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: "Search", href: "/search" },
          { label: candidate.name, href: `/profile/${username}` },
          { label: "Deep Analysis" }
        ]} />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/pipeline`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Dybdeprofil</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
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
              onClick={async () => {
                if (!candidate) return;
                try {
                  const res = await fetch("/api/shared-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      candidateId: candidate.id,
                      name: candidate.name,
                      currentRole: candidate.currentRole,
                      company: candidate.company,
                      location: candidate.location,
                      avatar: candidate.avatar,
                      skills: candidate.skills,
                      yearsExperience: candidate.yearsExperience,
                      alignmentScore: candidate.alignmentScore,
                      persona: candidate.persona,
                      keyEvidenceWithSources: candidate.keyEvidenceWithSources || candidate.keyEvidence?.map((e: string) => ({ claim: e })),
                      risksWithSources: candidate.risksWithSources || candidate.risks?.map((r: string) => ({ claim: r })),
                      scoreBreakdown: candidate.scoreBreakdown,
                    }),
                  });
                  const data = await res.json();
                  if (data.url) {
                    // Copy to clipboard and open
                    navigator.clipboard.writeText(data.url).catch(() => {});
                    window.open(data.url, '_blank');
                    // Show toast
                    const { toast } = await import("sonner");
                    toast.success("Shareable link copied to clipboard!", {
                      description: data.url,
                    });
                  } else {
                    // Fallback to old report page
                    window.open(`/profile/${username}/report`, '_blank');
                  }
                } catch {
                  window.open(`/profile/${username}/report`, '_blank');
                }
              }}
              variant="outline"
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Del Profil
            </Button>
            <Button
              onClick={async () => {
                if (!candidate) return;
                try {
                  const res = await fetch("/api/shared-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      candidateId: candidate.id,
                      name: candidate.name,
                      currentRole: candidate.currentRole,
                      company: candidate.company,
                      location: candidate.location,
                      avatar: candidate.avatar,
                      skills: candidate.skills,
                      yearsExperience: candidate.yearsExperience,
                      alignmentScore: candidate.alignmentScore,
                      persona: candidate.persona,
                      keyEvidenceWithSources: candidate.keyEvidenceWithSources || candidate.keyEvidence?.map((e: string) => ({ claim: e })),
                      risksWithSources: candidate.risksWithSources || candidate.risks?.map((r: string) => ({ claim: r })),
                      scoreBreakdown: candidate.scoreBreakdown,
                    }),
                  });
                  const data = await res.json();
                  if (data.url) {
                    const reportUrl = data.url;
                    const w = window.open(reportUrl, '_blank');
                    // Trigger print after load
                    if (w) {
                      w.addEventListener('afterprint', () => {}, { once: true });
                      setTimeout(() => { try { w.print(); } catch {} }, 2000);
                    }
                  } else {
                    const reportUrl = `/profile/${username}/report`;
                    window.open(reportUrl, '_blank');
                  }
                } catch {
                  const reportUrl = `/profile/${username}/report`;
                  window.open(reportUrl, '_blank');
                }
              }}
              variant="outline"
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              Eksportér PDF
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

        {/* Enrichment Status Bar */}
        {(enrichmentStatus.loading || enrichmentData) && (
          <Card className="mb-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20">
            <CardContent className="py-3">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Data Sources</span>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  {/* GitHub */}
                  <div className="flex items-center gap-1.5">
                    {enrichmentStatus.sources.github === null && enrichmentStatus.loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : enrichmentStatus.sources.github ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                    )}
                    <span className="text-xs text-muted-foreground">GitHub</span>
                    {enrichmentData?.github?.readme && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">README</Badge>
                    )}
                    {enrichmentData?.github?.prsToOthers?.length ? (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">{enrichmentData.github.prsToOthers.length} PRs</Badge>
                    ) : null}
                  </div>
                  {/* LinkedIn */}
                  <div className="flex items-center gap-1.5">
                    {enrichmentStatus.sources.linkedin === null && enrichmentStatus.loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : enrichmentStatus.sources.linkedin && enrichmentData?.linkedin?.bestMatch ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                    )}
                    <span className="text-xs text-muted-foreground">LinkedIn</span>
                    {enrichmentData?.linkedin?.bestMatch && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        {enrichmentData.linkedin.bestMatch.confidence}%
                      </Badge>
                    )}
                  </div>
                  {/* Website */}
                  <div className="flex items-center gap-1.5">
                    {enrichmentStatus.sources.website === null && enrichmentStatus.loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : enrichmentData?.website ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <span className="w-3.5 h-3.5 text-muted-foreground/50">—</span>
                    )}
                    <span className="text-xs text-muted-foreground">Website</span>
                  </div>
                  {/* Talks */}
                  <div className="flex items-center gap-1.5">
                    {enrichmentStatus.sources.talks === null && enrichmentStatus.loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : enrichmentData?.talks?.hasTalks ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <span className="w-3.5 h-3.5 text-muted-foreground/50">—</span>
                    )}
                    <span className="text-xs text-muted-foreground">Talks</span>
                    {enrichmentData?.talks?.hasTalks && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        {enrichmentData.talks.talks.length}
                      </Badge>
                    )}
                  </div>
                </div>
                {enrichmentStatus.duration && (
                  <span className="text-xs text-muted-foreground">
                    {(enrichmentStatus.duration / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Source Transparency Banner */}
        <DataSourceBanner
          hasLinkedIn={!!enrichmentData?.linkedin?.bestMatch || !!candidate.linkedinUrl}
          className="mb-6"
          compact
        />

        {/* Job Readiness Score */}
        {candidate.id && (
          <JobReadinessScore
            candidateId={candidate.id}
            readinessInput={{
              candidateId: candidate.id,
              githubUsername: username,
              currentCompany: candidate.company || undefined,
              currentRole: candidate.currentRole || undefined,
              skills: candidate.skills,
              location: candidate.location || undefined,
            }}
            className="mb-6"
          />
        )}

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
                  {(candidate.skills || []).slice(0, 6).map((skill) => (
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
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
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
          <Button
            variant={activeTab === "contact" ? "default" : "ghost"}
            onClick={() => setActiveTab("contact")}
            className="gap-2"
          >
            <Phone className="w-4 h-4" />
            Kontaktstrategi
          </Button>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <>
            {/* Quick Summary Cards - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Archetype */}
              <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground font-medium">Personlighedstype</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {candidate.persona?.archetype || "Kør AI-analyse"}
                  </p>
                </CardContent>
              </Card>

              {/* Top Skills */}
              <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-muted-foreground font-medium">Top Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(candidate.skills || []).slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fit Score */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-muted-foreground font-medium">Match Score</span>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(candidate.alignmentScore)}`}>
                    {candidate.alignmentScore}
                  </div>
                </CardContent>
              </Card>
            </div>

          <BentoGrid>
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
            <BentoCard colSpan={1} rowSpan={1} className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-transparent min-h-[140px]">
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
            <BentoCard colSpan={3} rowSpan={1} className="bg-gradient-to-br from-yellow-500/5 to-transparent">
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
          </>
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

                {/* Big Five Personality Radar - Prominent Feature */}
                {candidate.persona.psychometric.bigFive && (
                  <Card className="border-primary/30">
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('bigFive')}>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Brain className="w-5 h-5 text-primary" />
                            Personality Profile (Big Five)
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {expandedSections.bigFive 
                              ? "Inferred from work patterns, code style, and professional behavior"
                              : `${Object.keys(candidate.persona.psychometric.bigFive).length} personality traits analyzed`
                            }
                          </p>
                        </div>
                        {expandedSections.bigFive ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections.bigFive && <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Radar Chart */}
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart
                              data={[
                                { trait: 'Openness', value: candidate.persona.psychometric.bigFive.openness },
                                { trait: 'Conscientious', value: candidate.persona.psychometric.bigFive.conscientiousness },
                                { trait: 'Extraversion', value: candidate.persona.psychometric.bigFive.extraversion },
                                { trait: 'Agreeableness', value: candidate.persona.psychometric.bigFive.agreeableness },
                                { trait: 'Stability', value: 10 - candidate.persona.psychometric.bigFive.neuroticism },
                              ]}
                            >
                              <PolarGrid stroke="#333" />
                              <PolarAngleAxis dataKey="trait" tick={{ fill: '#999', fontSize: 12 }} />
                              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#666' }} />
                              <Radar
                                name="Personality"
                                dataKey="value"
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary))"
                                fillOpacity={0.3}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Trait Descriptions */}
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Openness</span>
                              <span className="text-muted-foreground">{candidate.persona.psychometric.bigFive.openness}/10</span>
                            </div>
                            <Progress value={candidate.persona.psychometric.bigFive.openness * 10} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">Innovation, curiosity, new tech adoption</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Conscientiousness</span>
                              <span className="text-muted-foreground">{candidate.persona.psychometric.bigFive.conscientiousness}/10</span>
                            </div>
                            <Progress value={candidate.persona.psychometric.bigFive.conscientiousness * 10} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">Code quality, reliability, discipline</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Extraversion</span>
                              <span className="text-muted-foreground">{candidate.persona.psychometric.bigFive.extraversion}/10</span>
                            </div>
                            <Progress value={candidate.persona.psychometric.bigFive.extraversion * 10} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">Public speaking, community involvement</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Agreeableness</span>
                              <span className="text-muted-foreground">{candidate.persona.psychometric.bigFive.agreeableness}/10</span>
                            </div>
                            <Progress value={candidate.persona.psychometric.bigFive.agreeableness * 10} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">Collaboration, helpfulness, team fit</p>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">Emotional Stability</span>
                              <span className="text-muted-foreground">{10 - candidate.persona.psychometric.bigFive.neuroticism}/10</span>
                            </div>
                            <Progress value={(10 - candidate.persona.psychometric.bigFive.neuroticism) * 10} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">Stress management, career stability</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>}
                  </Card>
                )}

                {/* Behavioral Profile */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('psychometric')}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Behavioral Profile
                        </CardTitle>
                        {expandedSections.psychometric ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections.psychometric && <CardContent className="space-y-4">
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
                          <Badge className="bg-primary/20 text-primary border-primary/30">
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
                                ? 'w-2/3 bg-amber-500'
                                : 'w-1/3 bg-green-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Leadership Potential */}
                      <div>
                        <span className="text-sm text-muted-foreground">Leadership Potential</span>
                        <div className="mt-1">
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            {candidate.persona.psychometric.leadershipPotential}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>}
                  </Card>

                  {candidate.persona.careerTrajectory && (
                    <Card>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('careerTrajectory')}>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Career Trajectory
                          </CardTitle>
                          {expandedSections.careerTrajectory ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.careerTrajectory && <CardContent className="space-y-4">
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
                                    ? level === 'rapid' ? 'bg-green-500' : level === 'steady' ? 'bg-amber-500' : 'bg-red-500'
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
                                    ? level === 'high' ? 'bg-green-500' : level === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
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
                      </CardContent>}
                    </Card>
                  )}
                </div>

                {/* Compensation Intelligence */}
                {candidate.persona.compensationIntelligence && (
                  <Card>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('compensation')}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          Compensation Intelligence
                        </CardTitle>
                        {expandedSections.compensation ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections.compensation && <CardContent className="space-y-6">
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
                      <div className="grid grid-cols-3 gap-4">
                        {/* Growth Rate */}
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            {candidate.persona.compensationIntelligence.compensationGrowthRate === 'aggressive' ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : candidate.persona.compensationIntelligence.compensationGrowthRate === 'steady' ? (
                              <TrendingUp className="w-4 h-4 text-amber-500 rotate-[-15deg]" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div className={`text-sm font-bold capitalize ${
                            candidate.persona.compensationIntelligence.compensationGrowthRate === 'aggressive'
                              ? 'text-green-500'
                              : candidate.persona.compensationIntelligence.compensationGrowthRate === 'steady'
                              ? 'text-amber-500'
                              : 'text-red-500'
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
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Compensation estimates are based on role seniority, location, and industry benchmarks.
                          {candidate.persona.compensationIntelligence.equityIndicators && (
                            <> Startup experience suggests equity expectations may be part of total compensation package.</>
                          )}
                        </p>
                      </div>
                    </CardContent>}
                  </Card>
                )}

                {/* Flags - Always visible (summary) */}
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
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSection('riskAssessment')}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Risk Assessment
                        </CardTitle>
                        {expandedSections.riskAssessment ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections.riskAssessment && <CardContent className="space-y-6">
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
                              <Badge key={i} variant="outline" className="border-amber-500/50 text-amber-500">
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
                    </CardContent>}
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
            <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">Public Activity Only</p>
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
                                ? 'border-amber-500 text-amber-500'
                                : 'border-amber-500 text-amber-500'
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

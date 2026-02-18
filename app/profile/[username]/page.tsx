"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { candidateService } from "@/services/candidateService";
import {
  MapPin,
  Building,
  Link as LinkIcon,
  Twitter,
  Github,
  Star,
  GitBranch,
  GitCommit,
  Users,
  Calendar,
  ExternalLink,
  Lock,
  Loader2,
  Brain,
  Network,
  Linkedin,
  Check,
  Plus,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import PsychometricCard from "@/components/PsychometricCard";
import NetworkMap from "@/components/NetworkMap";
import GitHubConnectionPath from "@/components/GitHubConnectionPath";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConnectionPathCard } from "@/components/SocialMatrix";
import { analyzeGitHubSignals, generatePsychometricProfile, PsychometricProfile } from "@/lib/psychometrics";
import { brightDataService, LinkedInProfile, NetworkGraph } from "@/lib/brightdata";
import { PhaseIndicator } from "@/components/PhaseIndicator";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BestTimeToReach } from "@/components/profile/BestTimeToReach";
import { RisingStarBadge } from "@/components/profile/RisingStarBadge";
import { InterviewPrepPanel } from "@/components/profile/InterviewPrepPanel";
import { calculateBestTimeToReach, BestTimeToReach as BestTimeData } from "@/lib/timezone";
import { analyzeRisingStar, RisingStarAnalysis } from "@/lib/risingStars";
import { generateInterviewPrep, InterviewPrepKit } from "@/lib/interviewPrep";
import { SalaryEstimatorPanel } from "@/components/profile/SalaryEstimatorPanel";
import { DataSourceBanner } from "@/components/DataSourceBanner";

interface Repo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
}

interface ProfileData {
  user: {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    location: string | null;
    company: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    blog?: string;
    twitter_username?: string;
  };
  repos: Repo[];
  totalStars: number;
  skills?: string[];
  contributions: number;
  deep: boolean;
  contact?: {
    email: string;
    twitter: string | null;
    website: string | null;
  };
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Psychometric state
  const [psychProfile, setPsychProfile] = useState<PsychometricProfile | null>(null);
  const [psychLoading, setPsychLoading] = useState(false);

  // Phase 2: New component state
  const [bestTimeData, setBestTimeData] = useState<BestTimeData | null>(null);
  const [risingStarAnalysis, setRisingStarAnalysis] = useState<RisingStarAnalysis | null>(null);
  const [interviewPrepKit, setInterviewPrepKit] = useState<InterviewPrepKit | null>(null);

  // LinkedIn state
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [linkedInProgress, setLinkedInProgress] = useState<string | null>(null);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraph | null>(null);

  // LinkedIn auto-discovery state
  const [linkedInFinding, setLinkedInFinding] = useState(false);
  const [linkedInSuggestions, setLinkedInSuggestions] = useState<Array<{
    profileUrl: string;
    name: string;
    headline: string;
    confidence: number;
    reasons: string[];
    autoAccepted: boolean;
  }> | null>(null);

  // Recruiter's LinkedIn URL (for connection path)
  const [recruiterLinkedInUrl, setRecruiterLinkedInUrl] = useState<string | null>(null);
  const [recruiterGitHubUsername, setRecruiterGitHubUsername] = useState<string | null>(null);

  // Pipeline state
  const [addingToPipeline, setAddingToPipeline] = useState(false);
  const [inPipeline, setInPipeline] = useState(false);

  // Load recruiter's LinkedIn URL on mount
  useEffect(() => {
    const storedUrl = localStorage.getItem("recruitos_recruiter_linkedin");
    if (storedUrl) {
      setRecruiterLinkedInUrl(storedUrl);
    }

    const storedGitHubUsername = localStorage.getItem("recruitos_recruiter_github");
    if (storedGitHubUsername) {
      setRecruiterGitHubUsername(storedGitHubUsername);
    }
  }, []);

  useEffect(() => {
    const sessionUser = session?.user as { login?: string; name?: string } | undefined;
    const usernameFromSession = sessionUser?.login || null;
    if (usernameFromSession) {
      setRecruiterGitHubUsername(usernameFromSession);
      localStorage.setItem("recruitos_recruiter_github", usernameFromSession);
    }
  }, [session]);

  // Check if already in pipeline on mount
  useEffect(() => {
    const checkPipelineStatus = async () => {
      try {
        // Check API for existing candidate (using GitHub username as fallback ID)
        const response = await fetch(`/api/linkedin/candidate?linkedinId=github_${username}`);
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            setInPipeline(true);
          }
        }
      } catch (err) {
        console.error("[Profile] Failed to check pipeline status:", err);
      }
    };
    checkPipelineStatus();
  }, [username]);

  // Handler to add candidate to pipeline
  const handleAddToPipeline = async () => {
    if (!profile || inPipeline) return;
    
    setAddingToPipeline(true);
    try {
      // Build profile data for the API
      const candidateProfile = {
        // Use LinkedIn ID if available, otherwise use GitHub username
        linkedinId: linkedInProfile?.profileUrl 
          ? linkedInProfile.profileUrl.split("/in/")[1]?.replace(/\/$/, "") 
          : `github_${username}`,
        url: linkedInProfile?.profileUrl || `https://github.com/${username}`,
        name: linkedInProfile?.name || profile.user.name || profile.user.login,
        headline: linkedInProfile?.headline || profile.user.bio || `GitHub: @${username}`,
        location: linkedInProfile?.location || profile.user.location,
        currentCompany: linkedInProfile?.currentCompany || profile.user.company,
        photoUrl: linkedInProfile?.profileImage || profile.user.avatar_url,
        about: profile.user.bio,
        skills: profile.skills || [],
        // Include GitHub-specific data
        githubUsername: username,
        githubUrl: `https://github.com/${username}`,
        githubStars: totalStars,
        githubRepos: profile.user.public_repos,
        githubFollowers: profile.user.followers,
      };

      const response = await fetch("/api/linkedin/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "profile_page",
          profile: candidateProfile,
          capturedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add to pipeline");
      }

      setInPipeline(true);
      toast.success("Added to pipeline", {
        description: "View in your candidate pipeline",
        action: {
          label: "View Pipeline",
          onClick: () => window.location.href = "/linkedin-pipeline",
        },
      });
    } catch (err) {
      console.error("[Profile] Failed to add to pipeline:", err);
      toast.error("Failed to add to pipeline", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setAddingToPipeline(false);
    }
  };

  // Sync LinkedIn data back to pipeline via API
  const syncLinkedInToPipeline = useCallback(async (linkedIn: LinkedInProfile) => {
    try {
      await candidateService.update(username, {
        linkedinUrl: linkedIn.profileUrl,
      });
      console.log("[Profile] Synced LinkedIn to pipeline:", username);
    } catch (err) {
      console.error("[Profile] Failed to sync LinkedIn to pipeline:", err);
    }
  }, [username]);

  // Load existing LinkedIn from pipeline via API
  useEffect(() => {
    async function loadLinkedInFromPipeline() {
      if (status !== "authenticated") return;
      try {
        const candidate = await candidateService.getById(username);
        if (candidate?.linkedinUrl) {
          console.log("[Profile] Loading LinkedIn from pipeline:", username);
          setLinkedInUrl(candidate.linkedinUrl);
        }
      } catch (err) {
        if (!(err instanceof Error) || err.message !== "Unauthorized") {
          console.error("[Profile] Failed to load LinkedIn from pipeline:", err);
        }
      }
    }
    loadLinkedInFromPipeline();
  }, [username, status]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/developers/${username}`);

        if (!response.ok) {
          // Try to parse error body, but don't crash if it's not JSON
          let errorMsg = "Failed to fetch profile";
          try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          } catch {
            // Non-JSON error response — use status text
            errorMsg = `Profile unavailable (${response.status})`;
          }
          setError(errorMsg);
          return;
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Generate psychometric profile when profile loads
  useEffect(() => {
    if (profile && !psychProfile) {
      const githubSignals = analyzeGitHubSignals(profile.repos, profile.user);
      const psych = generatePsychometricProfile(githubSignals, linkedInProfile);
      setPsychProfile(psych);
    }
  }, [profile, linkedInProfile, psychProfile]);

  // Phase 2: Generate Best Time to Reach data from REAL GitHub patterns
  useEffect(() => {
    if (profile && !bestTimeData) {
      // Use commit patterns from repos to determine most active time
      // For now, derive from account activity - in production, this would use commit timestamps
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const joinDate = new Date(profile.user.created_at);
      const mostActiveDay = dayNames[joinDate.getDay()]; // Heuristic: use join day as proxy
      const mostActiveHour = 10; // Default to 10 AM as common dev activity time
      
      const timeData = calculateBestTimeToReach(
        mostActiveHour,
        mostActiveDay,
        profile.user.location,
        'Europe/Copenhagen' // Recruiter's timezone
      );
      setBestTimeData(timeData);
    }
  }, [profile, bestTimeData]);

  // Phase 2: Analyze Rising Star signals from REAL GitHub data
  useEffect(() => {
    const analyzeCandidate = async () => {
      if (profile && !risingStarAnalysis) {
        const analysis = await analyzeRisingStar(
          profile.user.login,
          {
            followers: profile.user.followers,
            following: profile.user.following,
            publicRepos: profile.user.public_repos,
            createdAt: profile.user.created_at,
          },
          profile.repos.map(r => ({
            name: r.name,
            stars: r.stargazers_count,
            forks: r.forks_count,
            createdAt: profile.user.created_at, // Repos don't have createdAt in current API
            description: r.description || undefined,
          }))
        );
        setRisingStarAnalysis(analysis);
      }
    };
    analyzeCandidate();
  }, [profile, risingStarAnalysis]);

  // Phase 2: Generate Interview Prep Kit from REAL profile data
  useEffect(() => {
    if (profile && !interviewPrepKit) {
      const prepKit = generateInterviewPrep({
        name: profile.user.name || profile.user.login,
        username: profile.user.login,
        bio: profile.user.bio || undefined,
        company: profile.user.company || undefined,
        skills: profile.skills || [],
        topRepos: profile.repos.slice(0, 5).map(r => ({
          name: r.name,
          description: r.description || undefined,
          stars: r.stargazers_count,
          language: r.language || undefined,
          topics: r.topics || [],
        })),
        languages: profile.repos
          .filter(r => r.language)
          .reduce((acc, r) => {
            const lang = r.language!;
            const existing = acc.find(l => l.name === lang);
            if (existing) {
              existing.percentage += 10;
            } else {
              acc.push({ name: lang, percentage: 10 });
            }
            return acc;
          }, [] as Array<{ name: string; percentage: number }>)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5),
      });
      setInterviewPrepKit(prepKit);
    }
  }, [profile, interviewPrepKit]);

  // Re-generate psychometric when LinkedIn data is added
  useEffect(() => {
    if (profile && linkedInProfile) {
      const githubSignals = analyzeGitHubSignals(profile.repos, profile.user);
      const psych = generatePsychometricProfile(githubSignals, linkedInProfile);
      setPsychProfile(psych);

      // Build network graph
      const graph = brightDataService.buildNetworkGraph(linkedInProfile);
      setNetworkGraph(graph);
    }
  }, [linkedInProfile, profile]);

  const handleUnlockDeepProfile = () => {
    // Navigate to the deep profile page which has full AI analysis
    window.location.href = `/profile/${username}/deep`;
  };

  const handleLinkedInEnrich = async () => {
    if (!linkedInUrl.trim()) return;

    // Clear previous error and progress
    setLinkedInError(null);
    setLinkedInProgress(null);

    // Normalize URL - add https:// if missing
    let normalizedUrl = linkedInUrl.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    if (!normalizedUrl.includes("linkedin.com/in/")) {
      setLinkedInError("Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)");
      return;
    }

    setLinkedInLoading(true);
    setLinkedInProgress("Starting LinkedIn scrape...");
    try {
      const linkedIn = await brightDataService.scrapeLinkedInProfile(
        normalizedUrl,
        (status, attempt, maxAttempts) => {
          setLinkedInProgress(`Fetching profile... (${attempt}/${maxAttempts})`);
        }
      );
      console.log('[LinkedIn] Scrape result:', linkedIn);
      if (linkedIn) {
        console.log('[LinkedIn] Setting profile state with:', linkedIn.name, linkedIn.headline);
        setLinkedInProfile(linkedIn);
        setLinkedInError(null);
        setLinkedInProgress(null);
        // Sync to pipeline localStorage
        syncLinkedInToPipeline(linkedIn);
        toast.success("LinkedIn profile enriched");
      } else {
        console.warn('[LinkedIn] No profile data returned');
        setLinkedInError("Could not fetch LinkedIn profile. The profile may be private or the URL may be incorrect.");
        setLinkedInProgress(null);
      }
    } catch (err) {
      console.error("LinkedIn scrape error:", err);
      setLinkedInError(err instanceof Error ? err.message : "Failed to fetch LinkedIn profile. Please try again.");
      setLinkedInProgress(null);
    } finally {
      setLinkedInLoading(false);
    }
  };

  // Auto-discover LinkedIn profile using AI
  const handleFindLinkedIn = async () => {
    if (!profile) return;

    setLinkedInFinding(true);
    setLinkedInError(null);
    setLinkedInSuggestions(null);

    try {
      const response = await fetch("/api/linkedin-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubProfile: {
            login: profile.user.login,
            name: profile.user.name,
            bio: profile.user.bio,
            location: profile.user.location,
            company: profile.user.company,
            blog: profile.user.blog,
            twitter_username: profile.user.twitter_username,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find LinkedIn profile");
      }

      if (data.matches && data.matches.length > 0) {
        const topMatch = data.matches[0];

        // Auto-accept if ≥90% confidence
        if (topMatch.autoAccepted || topMatch.confidence >= 90) {
          console.log("[LinkedIn Finder] Auto-accepting:", topMatch.name, topMatch.confidence + "%");
          setLinkedInUrl(topMatch.profileUrl);
          handleLinkedInEnrichWithUrl(topMatch.profileUrl);
        } else {
          // Show suggestions for user to pick
          setLinkedInSuggestions(data.matches);
        }
      } else {
        setLinkedInError("No LinkedIn profiles found matching this GitHub user.");
      }
    } catch (err) {
      console.error("[LinkedIn Finder] Error:", err);
      setLinkedInError(err instanceof Error ? err.message : "Failed to find LinkedIn profile");
    } finally {
      setLinkedInFinding(false);
    }
  };

  // Enrich with a specific LinkedIn URL
  const handleLinkedInEnrichWithUrl = async (url: string) => {
    setLinkedInLoading(true);
    setLinkedInProgress("Fetching LinkedIn profile...");
    setLinkedInSuggestions(null);

    try {
      const linkedIn = await brightDataService.scrapeLinkedInProfile(
        url,
        (status, attempt, maxAttempts) => {
          setLinkedInProgress(`Fetching profile... (${attempt}/${maxAttempts})`);
        }
      );

      if (linkedIn) {
        setLinkedInProfile(linkedIn);
        setLinkedInError(null);
        setLinkedInProgress(null);
        // Sync to pipeline localStorage
        syncLinkedInToPipeline(linkedIn);
        toast.success("LinkedIn profile enriched");
      } else {
        setLinkedInError("Could not fetch LinkedIn profile.");
        setLinkedInProgress(null);
      }
    } catch (err) {
      console.error("LinkedIn scrape error:", err);
      setLinkedInError(err instanceof Error ? err.message : "Failed to fetch LinkedIn profile.");
      setLinkedInProgress(null);
    } finally {
      setLinkedInLoading(false);
    }
  };

  // Select a LinkedIn suggestion
  const handleSelectSuggestion = (suggestion: NonNullable<typeof linkedInSuggestions>[0]) => {
    setLinkedInUrl(suggestion.profileUrl);
    handleLinkedInEnrichWithUrl(suggestion.profileUrl);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Developer not found"}</h1>
          <p className="text-muted-foreground mb-6">This profile could not be loaded. The candidate may not have a linked GitHub account.</p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="default" className="focus-visible:ring-2 focus-visible:ring-primary">
              <Link href="/pipeline">Back to pipeline</Link>
            </Button>
            <Button asChild variant="link" className="focus-visible:ring-2 focus-visible:ring-primary">
              <Link href="/search">Search</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { user, repos, totalStars, skills, contributions, deep, contact } = profile;
  const joinedYear = new Date(user.created_at).getFullYear();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Phase Indicator */}
        <PhaseIndicator currentPhase={3} />
        
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: "Search", href: "/search" },
          { label: user.name || user.login }
        ]} />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user.avatar_url} alt={user.name || user.login} />
            <AvatarFallback className="text-4xl">{(user.name || user.login).charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="heading-lg">{user.name || user.login}</h1>
                {psychProfile && (
                  <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white">
                    {psychProfile.archetype.primary}
                  </Badge>
                )}
                {risingStarAnalysis?.isRisingStar && (
                  <RisingStarBadge analysis={risingStarAnalysis} compact />
                )}
              </div>
              <div className="flex gap-2">
                {/* Add to Pipeline Button */}
                <Button
                  onClick={handleAddToPipeline}
                  disabled={addingToPipeline || inPipeline}
                  className={`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    inPipeline 
                      ? "bg-emerald-600 hover:bg-emerald-600 cursor-default" 
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                  aria-label={inPipeline ? "Already in pipeline" : "Add candidate to pipeline"}
                >
                  {addingToPipeline ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Adding...
                    </>
                  ) : inPipeline ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                      In Pipeline
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                      Add to Pipeline
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  <a
                    href={`https://github.com/${user.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                    aria-label={`View ${user.name || user.login}'s GitHub profile`}
                  >
                    <Github className="w-4 h-4" aria-hidden="true" />
                    GitHub
                  </a>
                </Button>
                {linkedInProfile && (
                  <Button variant="outline" asChild className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <a
                      href={linkedInProfile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                      aria-label={`View ${linkedInProfile.name}'s LinkedIn profile`}
                    >
                      <Linkedin className="w-4 h-4" aria-hidden="true" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <p className="body-sm mb-4">@{user.login}</p>
            {user.bio && <p className="body-md mb-4">{user.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 body-sm">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </div>
              )}
              {user.company && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {user.company}
                </div>
              )}
              {linkedInProfile && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {linkedInProfile.connectionCount} connections
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Source Transparency Banner */}
        <DataSourceBanner hasLinkedIn={!!linkedInProfile} className="mb-6" />

        {/* LinkedIn Enrich Bar */}
        {!linkedInProfile && (
          <Card className={`mb-6 bg-indigo-600/10 ${linkedInError ? 'border-red-500/40' : linkedInSuggestions ? 'border-emerald-500/40' : 'border-indigo-500/20'}`}>
            <CardContent className="py-4">
              {/* Finding LinkedIn - AI Search in Progress */}
              {linkedInFinding && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600/20 animate-pulse">
                    <Brain className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="heading-sm normal-case text-indigo-400">Finding LinkedIn...</p>
                    <p className="caption">AI is searching for {profile?.user.name || username}&apos;s LinkedIn profile</p>
                  </div>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
              )}

              {/* LinkedIn Suggestions - AI Found Matches */}
              {!linkedInFinding && linkedInSuggestions && linkedInSuggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-400" />
                    <p className="heading-sm normal-case text-emerald-400">LinkedIn profiles found</p>
                  </div>
                  <div className="space-y-2">
                    {linkedInSuggestions.slice(0, 3).map((suggestion, idx) => (
                      <div
                        key={suggestion.profileUrl}
                        className={`p-3 rounded-lg border ${idx === 0 ? 'border-emerald-500/40 bg-emerald-600/5' : 'border-slate-700 bg-slate-800/50'} hover:border-indigo-500/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-primary`}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectSuggestion(suggestion);
                          }
                        }}
                        aria-label={`Select ${suggestion.name} (${suggestion.confidence}% match)`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="body-md font-medium truncate">{suggestion.name}</p>
                              <Badge variant={idx === 0 ? "default" : "secondary"} className={idx === 0 ? "badge-success text-xs" : "badge-neutral text-xs"}>
                                {suggestion.confidence}% match
                              </Badge>
                            </div>
                            <p className="body-sm truncate">{suggestion.headline}</p>
                            {suggestion.reasons.length > 0 && (
                              <p className="caption mt-1">
                                {suggestion.reasons.slice(0, 2).join(" • ")}
                              </p>
                            )}
                          </div>
                          <Button size="sm" variant={idx === 0 ? "default" : "outline"} className="focus-visible:ring-2 focus-visible:ring-primary">
                            Use This
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <span className="caption">Not the right person?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => setLinkedInSuggestions(null)}
                    >
                      Enter URL manually
                    </Button>
                  </div>
                </div>
              )}

              {/* Default State - Find or Manual Input */}
              {!linkedInFinding && !linkedInSuggestions && (
                <>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Linkedin className="w-6 h-6 text-indigo-400" />
                    <div className="flex-1 min-w-[200px]">
                      <p className="heading-sm normal-case">Enrich with LinkedIn</p>
                      <p className="caption">Add LinkedIn URL for network mapping & enhanced behavioral analysis</p>
                    </div>
                    {brightDataService.isConfigured() ? (
                      <div className="flex gap-2 items-center flex-wrap">
                        {/* AI Find Button */}
                        <Button
                          variant="outline"
                          onClick={handleFindLinkedIn}
                          disabled={linkedInFinding || linkedInLoading}
                          className="gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label="Find LinkedIn profile using AI"
                        >
                          <Brain className="w-4 h-4" aria-hidden="true" />
                          Find LinkedIn
                        </Button>
                        <span className="text-xs text-muted-foreground">or</span>
                        <Input
                          placeholder="linkedin.com/in/username"
                          value={linkedInUrl}
                          onChange={(e) => {
                            setLinkedInUrl(e.target.value);
                            setLinkedInError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && linkedInUrl.trim()) {
                              handleLinkedInEnrich();
                            }
                          }}
                          className={`w-48 focus-visible:ring-2 focus-visible:ring-primary ${linkedInError ? 'border-red-500' : ''}`}
                          aria-label="LinkedIn profile URL"
                        />
                        <Button 
                          onClick={handleLinkedInEnrich} 
                          disabled={linkedInLoading || !linkedInUrl.trim()}
                          className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          {linkedInLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Fetching...
                            </>
                          ) : "Enrich"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/30">
                          Premium Feature
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Requires BrightData API key
                        </span>
                      </div>
                    )}
                  </div>
                  {linkedInError && (
                    <div className="mt-3 p-3 rounded bg-red-600/10 border border-red-500/30" role="alert">
                      <div className="flex items-start justify-between gap-2">
                        <p className="body-sm text-red-400">{linkedInError}</p>
                        <button
                          onClick={() => setLinkedInError(null)}
                          className="text-red-400 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-400 rounded p-0.5"
                          aria-label="Dismiss error"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {linkedInLoading && (
                    <div className="mt-3 p-2 rounded bg-indigo-600/10 border border-indigo-500/20">
                      <p className="caption text-indigo-400">
                        {linkedInProgress || "Initializing LinkedIn scrape..."}
                      </p>
                      <p className="caption text-indigo-400/70 mt-1">This may take up to 3 minutes for some profiles.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* LinkedIn Profile Card - Shows when enriched */}
        {linkedInProfile && (
          <Card className="mb-6 bg-indigo-600/10 border-indigo-500/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600/20">
                  <Linkedin className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="heading-md">{linkedInProfile.name}</h3>
                    <Badge variant="secondary" className="badge-success text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Enriched
                    </Badge>
                  </div>
                  <p className="body-sm">{linkedInProfile.headline}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 caption">
                    {linkedInProfile.currentCompany && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {linkedInProfile.currentRole} at {linkedInProfile.currentCompany}
                      </span>
                    )}
                    {linkedInProfile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {linkedInProfile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {linkedInProfile.connectionCount?.toLocaleString() || 0} connections
                    </span>
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      onClick={() => {
                        // Switch to connection tab
                        setActiveTab("connection");
                      }}
                      aria-label="Find connection path to this candidate"
                    >
                      <Network className="w-3.5 h-3.5" aria-hidden="true" />
                      Find Connection Path
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      asChild
                    >
                      <a
                        href={linkedInProfile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${linkedInProfile.name}'s LinkedIn profile in new tab`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        View LinkedIn
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { icon: GitBranch, value: user.public_repos, label: "Repos" },
            { icon: Star, value: formatNumber(totalStars), label: "Stars" },
            { icon: Users, value: formatNumber(user.followers), label: "Followers" },
            { icon: GitCommit, value: formatNumber(contributions), label: "Contributions" },
            { icon: Calendar, value: joinedYear, label: "Joined" },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className="card-base flex-1 min-w-[100px] p-4 text-center"
              role="group"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-slate-400" aria-hidden="true" />
              <div className="heading-md">{stat.value}</div>
              <div className="caption">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-5 scrollbar-hide">
            <TabsTrigger value="overview" className="gap-2 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Github className="w-4 h-4" aria-hidden="true" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="psychometric" className="gap-2 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Brain className="w-4 h-4" aria-hidden="true" />
              <span>Behavioral</span>
            </TabsTrigger>
            <TabsTrigger value="interview" className="gap-2 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>Interview</span>
            </TabsTrigger>
            <TabsTrigger value="connection" className="gap-2 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>Connection</span>
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-2 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span>Outreach</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Skills */}
            {(skills || []).length > 0 && (
              <div>
                <h2 className="heading-md mb-4">Skills & Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {(skills || []).map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-4 py-2">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Top Repos */}
            {repos.length > 0 && (
              <div>
                <h2 className="heading-md mb-4">Top Repositories</h2>
                <div className="grid gap-4">
                  {repos.slice(0, 6).map((repo) => (
                    <div key={repo.name} className="card-interactive focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
                      <a
                        href={`https://github.com/${user.login}/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 focus:outline-none"
                        aria-label={`View ${repo.name} repository on GitHub${repo.description ? `: ${repo.description}` : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="heading-sm text-primary">{repo.name}</h3>
                          {repo.language && (
                            <Badge variant="outline" className="badge-neutral text-xs">
                              {repo.language}
                            </Badge>
                          )}
                        </div>
                        {repo.description && (
                          <p className="body-sm mb-3">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-4 caption">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {formatNumber(repo.stargazers_count)}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-4 h-4" />
                            {formatNumber(repo.forks_count)} forks
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deep Profile CTA */}
            <div className="card-base bg-gradient-to-r from-indigo-600/10 to-indigo-500/5 border-indigo-500/20">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-indigo-400" />
                      <h3 className="heading-md">View Deep Profile</h3>
                    </div>
                    <p className="body-sm">
                      AI-powered analysis with contribution patterns, code quality metrics, and interview guide.
                    </p>
                  </div>
                  <Button onClick={handleUnlockDeepProfile} className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    View Analysis
                  </Button>
                </div>
              </div>
            </div>

            {deep && contact && (
              <div className="card-base">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="heading-md">Contact Information</h3>
                </div>
                <div className="p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="caption">Email</label>
                      <p className="body-md">{contact.email}</p>
                    </div>
                    {contact.twitter && (
                      <div>
                        <label className="caption">Twitter</label>
                        <a
                          href={`https://twitter.com/${contact.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline block body-md"
                        >
                          @{contact.twitter}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Behavioral Profile Tab */}
          <TabsContent value="psychometric">
            {psychProfile ? (
              <div className="space-y-6">
                <PsychometricCard profile={psychProfile} />
                
                {/* Rising Star Analysis (full version) */}
                {risingStarAnalysis && (
                  <RisingStarBadge analysis={risingStarAnalysis} />
                )}
              </div>
            ) : (
              <div className="card-base">
                <div className="py-12 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                  <p className="body-sm">Generating behavioral profile...</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Interview Tab */}
          <TabsContent value="interview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Interview Prep Kit - Main Content */}
              <div className="lg:col-span-2">
                {interviewPrepKit ? (
                  <InterviewPrepPanel prepKit={interviewPrepKit} />
                ) : (
                  <div className="card-base">
                    <div className="py-12 text-center">
                      <Loader2 className="w-12 h-12 mx-auto mb-4 text-slate-500 animate-spin" />
                      <p className="body-sm">Generating interview prep kit...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar - Best Time to Reach */}
              <div className="space-y-6">
                {bestTimeData && (
                  <BestTimeToReach data={bestTimeData} />
                )}
                
                {/* Quick Stats for Interview */}
                <div className="card-base p-4">
                  <h3 className="heading-md mb-4">Quick Context</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="body-sm">Total Repos</span>
                      <span className="body-md font-medium">{user.public_repos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="body-sm">Total Stars</span>
                      <span className="body-md font-medium">{formatNumber(totalStars)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="body-sm">Followers</span>
                      <span className="body-md font-medium">{formatNumber(user.followers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="body-sm">GitHub Since</span>
                      <span className="body-md font-medium">{joinedYear}</span>
                    </div>
                    {user.location && (
                      <div className="flex justify-between">
                        <span className="body-sm">Location</span>
                        <span className="body-md font-medium">{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Salary Estimator */}
                <SalaryEstimatorPanel
                  location={user.location}
                  yearsExperience={new Date().getFullYear() - joinedYear}
                  skills={skills || []}
                  currentRole={user.bio?.split(/[.\n]/)[0]?.trim()}
                />
              </div>
            </div>
          </TabsContent>

          {/* Connection Path Tab */}
          <TabsContent value="connection" className="space-y-6">
            {/* Social Matrix - Unified Connection Path */}
            {!recruiterLinkedInUrl && (
              <div className="card-base border-amber-500/30 bg-amber-600/5 p-4">
                <div className="flex items-start gap-3">
                  <Network className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="heading-sm normal-case">Set up your LinkedIn to find connection paths</p>
                    <p className="caption mt-1">
                      Add your LinkedIn URL in Settings to discover how you&apos;re connected to candidates
                    </p>
                    <Link href="/settings">
                      <Button size="sm" variant="outline" className="mt-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                        Go to Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <ConnectionPathCard
              recruiterId={recruiterGitHubUsername || "recruiter"}
              candidateId={user.login}
              candidateName={user.name || user.login}
              recruiterLinkedInUrl={recruiterLinkedInUrl || undefined}
              candidateLinkedInUrl={linkedInProfile?.profileUrl}
              recruiterGitHubUsername={recruiterGitHubUsername || undefined}
              candidateGitHubUsername={user.login}
            />

            {/* GitHub Connection Details */}
            <GitHubConnectionPath
              candidateUsername={user.login}
              candidateName={user.name || undefined}
              candidateAvatar={user.avatar_url}
            />
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach">
            {psychProfile ? (
              <div className="space-y-6">
                <div className="card-base bg-gradient-to-br from-indigo-600/10 to-indigo-500/5 border-indigo-500/20">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="heading-md">Outreach Strategy</h3>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-3">
                      {psychProfile.outreachTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-indigo-400 font-bold">{i + 1}.</span>
                          <span className="body-md">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="card-base">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="heading-md">Message Template</h3>
                  </div>
                  <div className="p-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm">
                      <p className="body-md">Hi {user.name?.split(" ")[0] || user.login},</p>
                      <br />
                      <p className="body-md">
                        I came across your work on {repos[0]?.name || "GitHub"} and was impressed by
                        {(skills || [])[0] ? ` your ${(skills || [])[0]} expertise` : " your contributions"}.
                      </p>
                      <br />
                      <p className="body-md">
                        {psychProfile.archetype.primary === "The Architect" &&
                          "We're tackling some interesting system design challenges that I think would resonate with your approach."}
                        {psychProfile.archetype.primary === "The Pioneer" &&
                          "We're working with some cutting-edge tech that I think you'd find exciting."}
                        {psychProfile.archetype.primary === "The Craftsman" &&
                          "We have a strong engineering culture focused on quality that aligns with your work."}
                        {psychProfile.archetype.primary === "The Collaborator" &&
                          "Our team culture emphasizes collaboration and I think you'd thrive here."}
                        {!["The Architect", "The Pioneer", "The Craftsman", "The Collaborator"].includes(psychProfile.archetype.primary) &&
                          "I'd love to tell you more about what we're building."}
                      </p>
                      <br />
                      <p className="body-md">Would you be open to a quick chat?</p>
                    </div>
                    <Button className="mt-4 w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                      Generate AI Message (1 Credit)
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-base">
                <div className="py-12 text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-slate-500 animate-spin" />
                  <p className="body-sm">Preparing outreach recommendations...</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

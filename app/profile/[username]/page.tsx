"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
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
import { analyzeGitHubSignals, generatePsychometricProfile, PsychometricProfile } from "@/lib/psychometrics";
import { brightDataService, LinkedInProfile, NetworkGraph } from "@/lib/brightdata";

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
  skills: string[];
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Psychometric state
  const [psychProfile, setPsychProfile] = useState<PsychometricProfile | null>(null);
  const [psychLoading, setPsychLoading] = useState(false);

  // LinkedIn state
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [networkGraph, setNetworkGraph] = useState<NetworkGraph | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/developers/${username}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch profile");
        }

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

    // Check if BrightData is configured
    if (!brightDataService.isConfigured()) {
      console.warn("LinkedIn enrichment requires BRIGHTDATA_API_KEY to be configured");
      return;
    }

    setLinkedInLoading(true);
    try {
      const linkedIn = await brightDataService.scrapeLinkedInProfile(linkedInUrl);
      if (linkedIn) {
        setLinkedInProfile(linkedIn);
      }
    } catch (err) {
      console.error("LinkedIn scrape error:", err);
    } finally {
      setLinkedInLoading(false);
    }
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
          <Button asChild variant="link">
            <Link href="/search">Back to search</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { user, repos, totalStars, skills, contributions, deep, contact } = profile;
  const joinedYear = new Date(user.created_at).getFullYear();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user.avatar_url} alt={user.name || user.login} />
            <AvatarFallback className="text-4xl">{(user.name || user.login).charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{user.name || user.login}</h1>
                {psychProfile && (
                  <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white">
                    {psychProfile.archetype.primary}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a
                    href={`https://github.com/${user.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </Button>
                {linkedInProfile && (
                  <Button variant="outline" asChild>
                    <a
                      href={linkedInProfile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <p className="text-muted-foreground mb-4">@{user.login}</p>
            {user.bio && <p className="text-foreground/80 mb-4">{user.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

        {/* LinkedIn Enrich Bar */}
        {!linkedInProfile && (
          <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Linkedin className="w-6 h-6 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Enrich with LinkedIn</p>
                  <p className="text-xs text-muted-foreground">Add LinkedIn URL for network mapping & enhanced psychometrics</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="linkedin.com/in/username"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={handleLinkedInEnrich} disabled={linkedInLoading || !linkedInUrl.trim()}>
                    {linkedInLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enrich"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { icon: GitBranch, value: user.public_repos, label: "Repos" },
            { icon: Star, value: formatNumber(totalStars), label: "Stars" },
            { icon: Users, value: formatNumber(user.followers), label: "Followers" },
            { icon: GitCommit, value: formatNumber(contributions), label: "Contributions" },
            { icon: Calendar, value: joinedYear, label: "Joined" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <Github className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="psychometric" className="gap-2">
              <Brain className="w-4 h-4" />
              Psychometric
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2" disabled={!linkedInProfile}>
              <Network className="w-4 h-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Outreach
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Skills & Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
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
                <h2 className="text-xl font-semibold mb-4">Top Repositories</h2>
                <div className="grid gap-4">
                  {repos.slice(0, 6).map((repo) => (
                    <Card key={repo.name} className="hover:border-ring transition-colors">
                      <a
                        href={`https://github.com/${user.login}/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-primary">{repo.name}</h3>
                            {repo.language && (
                              <Badge variant="outline" className="text-xs">
                                {repo.language}
                              </Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-muted-foreground text-sm mb-3">{repo.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              {formatNumber(repo.stargazers_count)}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitBranch className="w-4 h-4" />
                              {formatNumber(repo.forks_count)} forks
                            </div>
                          </div>
                        </CardContent>
                      </a>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Deep Profile CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">View Deep Profile</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      AI-powered analysis with contribution patterns, code quality metrics, and interview guide.
                    </p>
                  </div>
                  <Button onClick={handleUnlockDeepProfile}>
                    View Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>

            {deep && contact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="text-foreground">{contact.email}</p>
                    </div>
                    {contact.twitter && (
                      <div>
                        <label className="text-sm text-muted-foreground">Twitter</label>
                        <a
                          href={`https://twitter.com/${contact.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline block"
                        >
                          @{contact.twitter}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Psychometric Tab */}
          <TabsContent value="psychometric">
            {psychProfile ? (
              <PsychometricCard profile={psychProfile} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Generating psychometric profile...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network">
            {networkGraph ? (
              <div className="space-y-6">
                <NetworkMap graph={networkGraph} />

                {linkedInProfile && linkedInProfile.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations ({linkedInProfile.recommendations.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {linkedInProfile.recommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="border-l-2 border-primary pl-4">
                          <p className="text-sm italic mb-2">&ldquo;{rec.text.slice(0, 200)}...&rdquo;</p>
                          <p className="text-xs text-muted-foreground">
                            — {rec.author}, {rec.authorTitle}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Network className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Add LinkedIn profile to view network map</p>
                  <div className="flex gap-2 justify-center items-center max-w-md mx-auto">
                    <Input
                      placeholder="linkedin.com/in/username"
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                    />
                    <Button onClick={handleLinkedInEnrich} disabled={linkedInLoading || !linkedInUrl.trim()}>
                      {linkedInLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach">
            {psychProfile ? (
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Outreach Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {psychProfile.outreachTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-primary font-bold">{i + 1}.</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Message Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                      <p>Hi {user.name?.split(" ")[0] || user.login},</p>
                      <br />
                      <p>
                        I came across your work on {repos[0]?.name || "GitHub"} and was impressed by
                        {skills[0] ? ` your ${skills[0]} expertise` : " your contributions"}.
                      </p>
                      <br />
                      <p>
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
                      <p>Would you be open to a quick chat?</p>
                    </div>
                    <Button className="mt-4 w-full">
                      Generate AI Message (1 Credit)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                  <p className="text-muted-foreground">Preparing outreach recommendations...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

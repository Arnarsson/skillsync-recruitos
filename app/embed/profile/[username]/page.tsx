"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Star, GitBranch, Users, Calendar, ArrowUpRight } from "lucide-react";
import PsychometricCard from "@/components/PsychometricCard";
import PersonalityProfileCard from "@/components/PersonalityProfileCard";
import { analyzeGitHubSignals, generatePsychometricProfile, PsychometricProfile } from "@/lib/psychometrics";
import { computePersonalityProfile, PersonalityProfile } from "@/services/personalityService";

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
}

function EmbeddedProfilePageContent({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") || "dark";

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [psychProfile, setPsychProfile] = useState<PsychometricProfile | null>(null);
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/developers/${username}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch profile");
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    if (!psychProfile) {
      const githubSignals = analyzeGitHubSignals(profile.repos, profile.user);
      setPsychProfile(generatePsychometricProfile(githubSignals, null));
    }
    if (!personalityProfile) {
      setPersonalityProfile(
        computePersonalityProfile({
          user: profile.user,
          repos: profile.repos,
          deepAnalysis: null,
        })
      );
    }
  }, [profile, psychProfile, personalityProfile]);

  const joinedYear = useMemo(() => {
    if (!profile) return null;
    return new Date(profile.user.created_at).getFullYear();
  }, [profile]);

  if (loading) {
    return (
      <div className={theme === "light" ? "bg-white text-black" : "bg-background text-foreground"}>
        <div className="p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
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
      <div className={theme === "light" ? "bg-white text-black" : "bg-background text-foreground"}>
        <div className="p-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="font-medium">{error || "Profile not found"}</p>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/profile/${username}`}>Open full profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { user, totalStars, contributions } = profile;

  return (
    <div className={theme === "light" ? "bg-white text-black" : "bg-background text-foreground"}>
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar_url} alt={user.name || user.login} />
                <AvatarFallback>{(user.name || user.login).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-lg font-semibold truncate">{user.name || user.login}</h1>
                      {psychProfile && (
                        <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white text-[10px]">
                          {psychProfile.archetype.primary}
                        </Badge>
                      )}
                      {personalityProfile && (
                        <Badge className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white text-[10px]">
                          {personalityProfile.personaTag}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{user.login}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <a href={`https://github.com/${user.login}`} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>

                {user.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{user.bio}</p>}

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center rounded-md bg-muted/50 p-2">
                    <GitBranch className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-semibold">{user.public_repos}</div>
                    <div className="text-[10px] text-muted-foreground">Repos</div>
                  </div>
                  <div className="text-center rounded-md bg-muted/50 p-2">
                    <Star className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-semibold">{totalStars}</div>
                    <div className="text-[10px] text-muted-foreground">Stars</div>
                  </div>
                  <div className="text-center rounded-md bg-muted/50 p-2">
                    <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-semibold">{user.followers}</div>
                    <div className="text-[10px] text-muted-foreground">Followers</div>
                  </div>
                </div>

                {joinedYear && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {joinedYear} • {contributions} contributions
                  </div>
                )}

                <div className="mt-3">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/profile/${user.login}`}>Open full analysis</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {personalityProfile && <PersonalityProfileCard profile={personalityProfile} />}

        {psychProfile && <PsychometricCard profile={psychProfile} />}
      </div>
    </div>
  );
}

import { Suspense } from "react";
export default function EmbeddedProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading...</div>}>
      <EmbeddedProfilePageContent params={params} />
    </Suspense>
  );
}

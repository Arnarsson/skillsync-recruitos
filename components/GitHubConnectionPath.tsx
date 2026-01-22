"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  GitBranch,
  Building2,
  Star,
  ArrowRight,
  Loader2,
  LogIn,
  RefreshCw,
  UserCheck,
  UserPlus,
  Link as LinkIcon,
  ExternalLink,
  MessageCircle,
  Handshake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  GitHubConnectionPath,
  BridgeConnection,
  MutualConnection,
  SharedRepo,
  SharedOrg,
} from "@/services/githubConnectionService";

interface GitHubConnectionPathProps {
  candidateUsername: string;
  candidateName?: string;
  candidateAvatar?: string;
}

// Connection degree badge colors
const degreeColors: Record<string, string> = {
  "1": "bg-green-500/20 text-green-400 border-green-500/30",
  "2": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "3": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "null": "bg-muted text-muted-foreground border-border",
};

const degreeLabels: Record<string, string> = {
  "1": "1st Degree",
  "2": "2nd Degree",
  "3": "3rd Degree",
  "null": "No Connection",
};

// Helper to get degree key
function getDegreeKey(degree: 1 | 2 | 3 | null): string {
  return String(degree);
}

export default function GitHubConnectionPath({
  candidateUsername,
  candidateName,
  candidateAvatar,
}: GitHubConnectionPathProps) {
  const { data: session, status } = useSession();
  const [connectionPath, setConnectionPath] = useState<GitHubConnectionPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recruiterUsername, setRecruiterUsername] = useState<string | null>(null);

  const fetchConnectionPath = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/connection-path?candidate=${encodeURIComponent(candidateUsername)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze connection");
      }

      const data = await response.json();
      setConnectionPath(data.connectionPath);
      setRecruiterUsername(data.recruiterUsername);
    } catch (err) {
      console.error("Connection path error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze connection path");
    } finally {
      setLoading(false);
    }
  }, [session, candidateUsername]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConnectionPath();
    }
  }, [status, fetchConnectionPath]);

  // Manual username input for unauthenticated users
  const [manualUsername, setManualUsername] = useState("");
  const [useManualMode, setUseManualMode] = useState(false);

  const fetchConnectionPathManual = useCallback(async (username: string) => {
    if (!username.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/github/connection-path?candidate=${encodeURIComponent(candidateUsername)}&recruiter=${encodeURIComponent(username.trim())}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze connection");
      }

      const data = await response.json();
      setConnectionPath(data.connectionPath);
      setRecruiterUsername(username.trim());
      setUseManualMode(true);
    } catch (err) {
      console.error("Connection path error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze connection path");
    } finally {
      setLoading(false);
    }
  }, [candidateUsername]);

  // Not logged in state - allow manual username input
  if (status === "unauthenticated" && !useManualMode && !connectionPath) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">See your connection path</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Enter your GitHub username to discover how you&apos;re connected to {candidateName || candidateUsername}
              through mutual follows, shared repositories, and organizations.
            </p>
            <div className="flex gap-2 w-full max-w-sm">
              <input
                type="text"
                placeholder="Your GitHub username"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualUsername.trim()) {
                    fetchConnectionPathManual(manualUsername);
                  }
                }}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={() => fetchConnectionPathManual(manualUsername)}
                disabled={!manualUsername.trim() || loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading session
  if (status === "loading") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading connection data
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Connection Path
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual path skeleton */}
          <div className="flex items-center justify-center gap-4 py-6">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-24 h-6" />
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>

          {/* Mutual connections skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchConnectionPath}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!connectionPath) {
    return null;
  }

  const { connectionDegree, directConnection, mutualConnections, sharedRepos, sharedOrgs, shortestPath } = connectionPath;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Main Connection Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Connection Path
              </CardTitle>
              <Badge
                variant="outline"
                className={degreeColors[getDegreeKey(connectionDegree)]}
              >
                {degreeLabels[getDegreeKey(connectionDegree)]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Connection Path */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 py-4">
              {/* Recruiter */}
              <div className="flex flex-col items-center">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-primary">
                  <AvatarImage src={(session?.user as { image?: string })?.image} />
                  <AvatarFallback>
                    {((session?.user as { name?: string })?.name || "You").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs mt-2 text-muted-foreground">You</span>
                <span className="text-xs font-medium truncate max-w-[80px]">
                  @{recruiterUsername}
                </span>
              </div>

              {/* Connection Arrow/Line */}
              <div className="flex-1 flex flex-col items-center max-w-[200px]">
                <div className="flex items-center w-full">
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-purple-500" />
                  {directConnection.recruiterFollowsCandidate && (
                    <Tooltip>
                      <TooltipTrigger>
                        <UserPlus className="w-4 h-4 text-green-400 mx-1" />
                      </TooltipTrigger>
                      <TooltipContent>You follow them</TooltipContent>
                    </Tooltip>
                  )}
                  {directConnection.candidateFollowsRecruiter && (
                    <Tooltip>
                      <TooltipTrigger>
                        <UserCheck className="w-4 h-4 text-blue-400 mx-1" />
                      </TooltipTrigger>
                      <TooltipContent>They follow you</TooltipContent>
                    </Tooltip>
                  )}
                  <ArrowRight className="w-5 h-5 text-purple-500 mx-1" />
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-500 to-primary" />
                </div>
                <span className="text-xs text-muted-foreground mt-2 text-center px-2">
                  {shortestPath}
                </span>
              </div>

              {/* Candidate */}
              <div className="flex flex-col items-center">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-purple-500">
                  <AvatarImage src={candidateAvatar} />
                  <AvatarFallback>
                    {(candidateName || candidateUsername).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs mt-2 text-muted-foreground truncate max-w-[80px]">
                  {candidateName || candidateUsername}
                </span>
                <span className="text-xs font-medium">@{candidateUsername}</span>
              </div>
            </div>

            {/* Direct Connection Status */}
            {(directConnection.recruiterFollowsCandidate || directConnection.candidateFollowsRecruiter) && (
              <div className="flex justify-center gap-4 flex-wrap">
                {directConnection.recruiterFollowsCandidate && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                    <UserPlus className="w-3 h-3 mr-1" />
                    You follow them
                  </Badge>
                )}
                {directConnection.candidateFollowsRecruiter && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    <UserCheck className="w-3 h-3 mr-1" />
                    They follow you
                  </Badge>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <Card className={connectionPath.totalBridgeConnections > 0 ? "border-green-500/30 bg-green-500/5" : ""}>
                <CardContent className="p-4 text-center">
                  <Handshake className="w-5 h-5 mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold">{connectionPath.totalBridgeConnections || 0}</div>
                  <div className="text-xs text-muted-foreground">Can Introduce</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{connectionPath.totalMutualFollows}</div>
                  <div className="text-xs text-muted-foreground">Shared Follows</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{connectionPath.totalSharedRepos}</div>
                  <div className="text-xs text-muted-foreground">Shared Stars</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Building2 className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{connectionPath.totalSharedOrgs}</div>
                  <div className="text-xs text-muted-foreground">Shared Orgs</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Bridge Connections - People who can introduce you */}
        {connectionPath.bridgeConnections && connectionPath.bridgeConnections.length > 0 && (
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-400">
                <Handshake className="w-5 h-5" />
                Ask for Introduction ({connectionPath.bridgeConnections.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These people can introduce you to {candidateName || candidateUsername}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connectionPath.bridgeConnections.map((bridge) => (
                  <BridgeConnectionCard key={bridge.username} bridge={bridge} candidateName={candidateName || candidateUsername} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mutual Connections (Shared Follows) */}
        {mutualConnections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Shared Follows ({mutualConnections.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                People you both follow (shared interests)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mutualConnections.map((connection) => (
                  <MutualConnectionCard key={connection.username} connection={connection} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shared Repositories */}
        {sharedRepos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                Shared Starred Repos ({sharedRepos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sharedRepos.slice(0, 5).map((repo) => (
                  <SharedRepoCard key={repo.fullName} repo={repo} />
                ))}
                {sharedRepos.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{sharedRepos.length - 5} more shared repos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shared Organizations */}
        {sharedOrgs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Shared Organizations ({sharedOrgs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {sharedOrgs.map((org) => (
                  <SharedOrgCard key={org.login} org={org} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Connection State */}
        {connectionDegree === null && mutualConnections.length === 0 && sharedRepos.length === 0 && sharedOrgs.length === 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No direct GitHub connection found. Consider reaching out through other channels or finding common interests.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchConnectionPath}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Connection Data
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Sub-components

function MutualConnectionCard({ connection }: { connection: MutualConnection }) {
  return (
    <a
      href={`https://github.com/${connection.username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={connection.avatarUrl} />
        <AvatarFallback>{connection.username.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {connection.name || connection.username}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{connection.username}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground" />
    </a>
  );
}

function SharedRepoCard({ repo }: { repo: SharedRepo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <GitBranch className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{repo.fullName}</p>
          {repo.description && (
            <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="text-sm">{repo.stars.toLocaleString()}</span>
        <ExternalLink className="w-4 h-4 text-muted-foreground ml-2" />
      </div>
    </a>
  );
}

function SharedOrgCard({ org }: { org: SharedOrg }) {
  return (
    <a
      href={`https://github.com/${org.login}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <Avatar className="w-8 h-8">
        <AvatarImage src={org.avatarUrl} />
        <AvatarFallback>{org.login.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-sm">{org.name || org.login}</span>
      <ExternalLink className="w-3 h-3 text-muted-foreground" />
    </a>
  );
}

function BridgeConnectionCard({ bridge, candidateName }: { bridge: BridgeConnection; candidateName: string }) {
  const isType1 = bridge.connectionType === 'you_follow_they_follow_candidate';

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-colors">
      <a
        href={`https://github.com/${bridge.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        <Avatar className="w-12 h-12 border-2 border-green-500/50">
          <AvatarImage src={bridge.avatarUrl} />
          <AvatarFallback>{bridge.username.charAt(0)}</AvatarFallback>
        </Avatar>
      </a>
      <div className="flex-1 min-w-0">
        <a
          href={`https://github.com/${bridge.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:underline"
        >
          <p className="font-semibold text-sm truncate text-green-400">
            {bridge.name || bridge.username}
          </p>
          <ExternalLink className="w-3 h-3 text-green-400/70 flex-shrink-0" />
        </a>
        <p className="text-xs text-muted-foreground">@{bridge.username}</p>
        {bridge.bio && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bridge.bio}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <MessageCircle className="w-3.5 h-3.5 text-green-400" />
          {isType1 ? (
            <span className="text-muted-foreground">
              <span className="text-green-400">You follow them</span> → they follow <span className="text-purple-400">{candidateName}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              <span className="text-purple-400">{candidateName}</span> follows them → <span className="text-green-400">they follow you</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

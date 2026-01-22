"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Network,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  User,
  ArrowRight,
  Building2,
  GraduationCap,
  GitBranch,
  Users,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { buildUnifiedGraph, getWarmIntroPaths } from "@/services/socialMatrixService";
import type { SocialMatrix, ConnectionPath, MatrixNode, VerificationStatus } from "@/types/socialMatrix";

interface ConnectionPathCardProps {
  recruiterId: string;
  candidateId: string;
  candidateName: string;
  recruiterLinkedInUrl?: string;
  candidateLinkedInUrl?: string;
  recruiterGitHubUsername?: string;
  candidateGitHubUsername?: string;
  teamLinkedInUrls?: string[];
  onViewFullGraph?: () => void;
}

function getNodeIcon(type: string) {
  switch (type) {
    case "person":
      return User;
    case "company":
      return Building2;
    case "school":
      return GraduationCap;
    case "repo":
    case "org":
      return GitBranch;
    default:
      return Users;
  }
}

function getVerificationIcon(status: VerificationStatus) {
  switch (status) {
    case "verified":
      return CheckCircle2;
    case "plausible":
      return HelpCircle;
    case "unverified":
      return AlertCircle;
    default:
      return AlertCircle;
  }
}

function getVerificationColor(status: VerificationStatus): string {
  switch (status) {
    case "verified":
      return "text-green-500";
    case "plausible":
      return "text-blue-500";
    case "unverified":
      return "text-yellow-500";
    default:
      return "text-red-500";
  }
}

function getDegreeColor(degree: 1 | 2 | 3 | null): string {
  switch (degree) {
    case 1:
      return "bg-green-500/10 text-green-600 border-green-500/30";
    case 2:
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case 3:
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function PathVisualization({ path }: { path: ConnectionPath }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {path.nodes.map((node, index) => {
        const Icon = getNodeIcon(node.type);
        const isFirst = index === 0;
        const isLast = index === path.nodes.length - 1;

        return (
          <div key={node.id} className="flex items-center">
            <div
              className={`
                flex flex-col items-center text-center flex-shrink-0
                ${isFirst || isLast ? "w-20" : "w-16"}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isFirst
                    ? "bg-primary/10 border-2 border-primary"
                    : isLast
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted border border-border"
                  }
                `}
              >
                {node.imageUrl ? (
                  <img
                    src={node.imageUrl}
                    alt={node.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs mt-1 max-w-full truncate">
                {isFirst ? "You" : node.name.split(" ")[0]}
              </span>
            </div>

            {!isLast && (
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ConnectionPathCard({
  recruiterId,
  candidateId,
  candidateName,
  recruiterLinkedInUrl,
  candidateLinkedInUrl,
  recruiterGitHubUsername,
  candidateGitHubUsername,
  teamLinkedInUrls,
  onViewFullGraph,
}: ConnectionPathCardProps) {
  const [matrix, setMatrix] = useState<SocialMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatrix = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await buildUnifiedGraph(recruiterId, candidateId, {
          recruiterLinkedInUrl,
          candidateLinkedInUrl,
          recruiterGitHubUsername,
          candidateGitHubUsername,
          teamLinkedInUrls,
          forceRefresh,
        });

        setMatrix(result);
      } catch (err) {
        console.error("[ConnectionPathCard] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to analyze connections");
      } finally {
        setIsLoading(false);
      }
    },
    [
      recruiterId,
      candidateId,
      recruiterLinkedInUrl,
      candidateLinkedInUrl,
      recruiterGitHubUsername,
      candidateGitHubUsername,
      teamLinkedInUrls,
    ]
  );

  const warmPaths = matrix ? getWarmIntroPaths(matrix) : [];

  // No data yet - show fetch button
  if (!matrix && !isLoading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            Connection Path
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-3">
            Discover how you&apos;re connected to {candidateName} across LinkedIn and GitHub
          </p>
          <Button onClick={() => fetchMatrix()} size="sm">
            <Search className="w-4 h-4 mr-2" />
            Find Connections
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            Connection Path
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            Connection Path
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fetchMatrix(true)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main view with data
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            Connection Path
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={getDegreeColor(matrix!.connectionDegree)}
            >
              {matrix!.connectionDegree === 1
                ? "1st Degree"
                : matrix!.connectionDegree === 2
                  ? "2nd Degree"
                  : matrix!.connectionDegree === 3
                    ? "3rd+ Degree"
                    : "No Path"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchMatrix(true)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-4">
        {/* Best Path */}
        {matrix!.bestPath && (
          <div className="space-y-2">
            <PathVisualization path={matrix!.bestPath} />

            <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{matrix!.bestPath.explanation}</p>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const VerifyIcon = getVerificationIcon(matrix!.bestPath!.verificationStatus);
                    return (
                      <span
                        className={`flex items-center gap-1 text-xs ${getVerificationColor(
                          matrix!.bestPath!.verificationStatus
                        )}`}
                      >
                        <VerifyIcon className="w-3 h-3" />
                        {matrix!.bestPath!.verificationStatus}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No path found */}
        {!matrix!.bestPath && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No direct connection path found</p>
            <p className="text-xs mt-1">
              Try connecting on LinkedIn or GitHub to find paths
            </p>
          </div>
        )}

        {/* Expand/Collapse for more paths */}
        {matrix!.paths.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                {matrix!.paths.length - 1} More Path
                {matrix!.paths.length > 2 ? "s" : ""}
              </>
            )}
          </Button>
        )}

        {/* Expanded paths */}
        <AnimatePresence>
          {isExpanded && matrix!.paths.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {matrix!.paths.slice(1).map((path, index) => (
                <div
                  key={index}
                  className="p-2 rounded-lg border border-border/50"
                >
                  <PathVisualization path={path} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {path.explanation}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warm Intro Suggestions */}
        {warmPaths.length > 0 && warmPaths[0].connector && (
          <div className="pt-2 border-t">
            <p className="text-xs uppercase text-muted-foreground mb-2">
              Warm Introduction
            </p>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {warmPaths[0].connector.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {warmPaths[0].suggestedApproach}
                </p>
              </div>
              {warmPaths[0].connector.profileUrl && (
                <a
                  href={warmPaths[0].connector.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* View Full Graph Button */}
        {onViewFullGraph && matrix!.nodes.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewFullGraph}
          >
            <Network className="w-4 h-4 mr-2" />
            View Full Network Graph
          </Button>
        )}

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-right">
          Updated{" "}
          {new Date(matrix!.lastUpdated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {matrix!.dataFreshness === "stale" && (
            <span className="text-yellow-600 ml-1">(may be outdated)</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ConnectionPathCard;

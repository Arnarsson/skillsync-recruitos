"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Linkedin,
  Users,
  Link2,
  ArrowRight,
  RefreshCw,
  Settings,
  ExternalLink,
  User,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ===== TYPES =====

interface MutualConnection {
  name: string;
  headline: string;
  profileUrl: string;
  profileImage?: string;
}

interface ConnectionPathData {
  connectionDegree: 1 | 2 | 3 | null;
  mutualConnections: MutualConnection[];
  shortestPath: string;
  recruiterProfile: {
    name: string;
    headline: string;
    profileUrl: string;
    profileImage?: string;
    connections: number;
  };
  candidateProfile: {
    name: string;
    headline: string;
    profileUrl: string;
    profileImage?: string;
    connections: number;
  };
  lastUpdated: string;
}

interface LinkedInConnectionPathProps {
  candidateLinkedInUrl: string;
  candidateName?: string;
  onSettingsClick?: () => void;
  compact?: boolean;
}

// ===== CONSTANTS =====

const CACHE_KEY_RECRUITER_URL = "recruitos_recruiter_linkedin";
const CACHE_KEY_CONNECTION_PATH = "recruitos_connection_path_";

// ===== HELPER FUNCTIONS =====

function getConnectionDegreeLabel(degree: 1 | 2 | 3 | null): string {
  switch (degree) {
    case 1:
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd+";
    default:
      return "Unknown";
  }
}

function getConnectionDegreeColor(degree: 1 | 2 | 3 | null): string {
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

function getCacheKey(candidateUrl: string): string {
  return CACHE_KEY_CONNECTION_PATH + btoa(candidateUrl).slice(0, 20);
}

function loadCachedPath(candidateUrl: string): ConnectionPathData | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(getCacheKey(candidateUrl));
    if (!cached) return null;

    const data = JSON.parse(cached);

    // Check if cache is older than 24 hours
    const lastUpdated = new Date(data.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 24) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function saveCachedPath(
  candidateUrl: string,
  data: ConnectionPathData
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getCacheKey(candidateUrl), JSON.stringify(data));
  } catch (error) {
    console.error("[ConnectionPath] Failed to cache:", error);
  }
}

// ===== MAIN COMPONENT =====

export function LinkedInConnectionPath({
  candidateLinkedInUrl,
  candidateName,
  onSettingsClick,
  compact = false,
}: LinkedInConnectionPathProps) {
  const [connectionPath, setConnectionPath] =
    useState<ConnectionPathData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recruiterUrl, setRecruiterUrl] = useState<string | null>(null);
  const [hasBrightDataKey, setHasBrightDataKey] = useState(false);

  // Load initial state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRecruiterUrl = localStorage.getItem(CACHE_KEY_RECRUITER_URL);

    setRecruiterUrl(storedRecruiterUrl);
    // API key is now server-side only; assume configured if recruiter URL is set
    setHasBrightDataKey(true);

    // Try to load cached connection path
    if (candidateLinkedInUrl) {
      const cached = loadCachedPath(candidateLinkedInUrl);
      if (cached) {
        setConnectionPath(cached);
      }
    }
  }, [candidateLinkedInUrl]);

  // Fetch connection path
  const fetchConnectionPath = useCallback(async () => {
    if (!recruiterUrl || !candidateLinkedInUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/linkedin-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recruiterLinkedInUrl: recruiterUrl,
          candidateLinkedInUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch connection path");
      }

      const data: ConnectionPathData = await response.json();
      setConnectionPath(data);
      saveCachedPath(candidateLinkedInUrl, data);
    } catch (err) {
      console.error("[ConnectionPath] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load connection path");
    } finally {
      setIsLoading(false);
    }
  }, [recruiterUrl, candidateLinkedInUrl]);

  // Show setup prompt if not configured
  if (!recruiterUrl || !hasBrightDataKey) {
    return (
      <Card className="border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            LinkedIn Connection Path
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {!hasBrightDataKey
                ? "Add your BrightData API key to discover connection paths"
                : "Add your LinkedIn URL to see how you're connected"}
            </p>
            {onSettingsClick ? (
              <Button variant="outline" size="sm" onClick={onSettingsClick}>
                <Settings className="w-4 h-4 mr-2" />
                Configure LinkedIn
              </Button>
            ) : (
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure LinkedIn
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact loading state
  if (isLoading && compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Finding connection path...
        </span>
      </div>
    );
  }

  // Full loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            LinkedIn Connection Path
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
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
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            LinkedIn Connection Path
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
            onClick={fetchConnectionPath}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data yet - show fetch button
  if (!connectionPath) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            LinkedIn Connection Path
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-3">
            Discover how you&apos;re connected to {candidateName || "this candidate"}{" "}
            on LinkedIn
          </p>
          <Button onClick={fetchConnectionPath} size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Find Connection Path
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact view
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
      >
        <Linkedin className="w-5 h-5 text-[#0A66C2]" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={getConnectionDegreeColor(connectionPath.connectionDegree)}
            >
              {getConnectionDegreeLabel(connectionPath.connectionDegree)} connection
            </Badge>
            {connectionPath.mutualConnections.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {connectionPath.mutualConnections.length} mutual
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {connectionPath.shortestPath}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={fetchConnectionPath}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            LinkedIn Connection Path
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchConnectionPath}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-4">
        {/* Connection Degree Badge */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-base px-3 py-1 ${getConnectionDegreeColor(
              connectionPath.connectionDegree
            )}`}
          >
            <Link2 className="w-4 h-4 mr-2" />
            {getConnectionDegreeLabel(connectionPath.connectionDegree)} Connection
          </Badge>
          {connectionPath.connectionDegree === 1 && (
            <Badge className="bg-green-500">
              <Users className="w-3 h-3 mr-1" />
              Direct
            </Badge>
          )}
        </div>

        {/* Connection Path Visualization */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
          {/* Recruiter */}
          <div className="flex flex-col items-center text-center flex-shrink-0">
            {connectionPath.recruiterProfile.profileImage ? (
              <img
                src={connectionPath.recruiterProfile.profileImage}
                alt={connectionPath.recruiterProfile.name}
                className="w-10 h-10 rounded-full border-2 border-[#0A66C2]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-[#0A66C2]">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs font-medium mt-1 max-w-[60px] truncate">
              You
            </span>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

          {/* Mutual Connection (if 2nd degree) */}
          {connectionPath.connectionDegree === 2 &&
            connectionPath.mutualConnections.length > 0 && (
              <>
                <div className="flex flex-col items-center text-center flex-shrink-0">
                  {connectionPath.mutualConnections[0].profileImage ? (
                    <img
                      src={connectionPath.mutualConnections[0].profileImage}
                      alt={connectionPath.mutualConnections[0].name}
                      className="w-10 h-10 rounded-full border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border-2 border-blue-500">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  <span className="text-xs mt-1 max-w-[80px] truncate">
                    {connectionPath.mutualConnections[0].name.split(" ")[0]}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </>
            )}

          {/* Candidate */}
          <div className="flex flex-col items-center text-center flex-shrink-0">
            {connectionPath.candidateProfile.profileImage ? (
              <img
                src={connectionPath.candidateProfile.profileImage}
                alt={connectionPath.candidateProfile.name}
                className="w-10 h-10 rounded-full border-2 border-primary"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            <span className="text-xs font-medium mt-1 max-w-[60px] truncate">
              {connectionPath.candidateProfile.name.split(" ")[0]}
            </span>
          </div>
        </div>

        {/* Shortest Path Description */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm">{connectionPath.shortestPath}</p>
          </div>
        </div>

        {/* Mutual Connections */}
        <AnimatePresence>
          {connectionPath.mutualConnections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="text-xs uppercase text-muted-foreground mb-2">
                Mutual Connections ({connectionPath.mutualConnections.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {connectionPath.mutualConnections.map((conn, index) => (
                  <a
                    key={index}
                    href={conn.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    {conn.profileImage ? (
                      <img
                        src={conn.profileImage}
                        alt={conn.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {conn.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {conn.headline}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-right">
          Updated{" "}
          {new Date(connectionPath.lastUpdated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default LinkedInConnectionPath;

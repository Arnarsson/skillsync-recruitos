"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, Loader2 } from "lucide-react";
import { getConnectionDegree } from "@/services/socialMatrixService";
import type { ConnectionDegreeResult } from "@/types/socialMatrix";

interface ConnectionBadgeProps {
  recruiterId: string;
  candidateId: string;
  recruiterGitHubUsername?: string;
  candidateGitHubUsername?: string;
  className?: string;
  showTooltip?: boolean;
  size?: "sm" | "md";
}

function getDegreeLabel(degree: 1 | 2 | 3 | null): string {
  switch (degree) {
    case 1:
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd";
    default:
      return "?";
  }
}

function getDegreeColor(degree: 1 | 2 | 3 | null): string {
  switch (degree) {
    case 1:
      return "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20";
    case 2:
      return "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20";
    case 3:
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function ConnectionBadge({
  recruiterId,
  candidateId,
  recruiterGitHubUsername,
  candidateGitHubUsername,
  className = "",
  showTooltip = true,
  size = "sm",
}: ConnectionBadgeProps) {
  const [result, setResult] = useState<ConnectionDegreeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchDegree() {
      try {
        const degreeResult = await getConnectionDegree(
          recruiterId,
          candidateId,
          recruiterGitHubUsername,
          candidateGitHubUsername
        );

        if (mounted) {
          setResult(degreeResult);
        }
      } catch (error) {
        console.error("[ConnectionBadge] Failed to get degree:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDegree();

    return () => {
      mounted = false;
    };
  }, [recruiterId, candidateId, recruiterGitHubUsername, candidateGitHubUsername]);

  const sizeClasses = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1";

  if (isLoading) {
    return (
      <Badge
        variant="outline"
        className={`${sizeClasses} bg-muted/50 ${className}`}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
      </Badge>
    );
  }

  if (!result || result.degree === null) {
    return null; // Don't show badge if no connection data
  }

  const badge = (
    <Badge
      variant="outline"
      className={`${sizeClasses} ${getDegreeColor(result.degree)} cursor-pointer transition-colors ${className}`}
    >
      <Link2 className="w-3 h-3 mr-1" />
      {getDegreeLabel(result.degree)}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {result.degree === 1
                ? "Direct Connection"
                : result.degree === 2
                  ? "2nd Degree Connection"
                  : "3rd+ Degree Connection"}
            </p>
            {result.path && (
              <p className="text-xs text-muted-foreground">{result.path}</p>
            )}
            {result.isStale && (
              <p className="text-xs text-yellow-600">
                Connection data may be outdated
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConnectionBadge;

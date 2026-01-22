"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Users, TrendingUp, GitBranch, Crown } from "lucide-react";
import {
  Buildprint,
  BuildprintMetric,
  computeBuildprint,
  getBuildprintColor,
  getBuildprintBgColor,
  GitHubDeepAnalysisInput,
  UserProfileInput,
} from "@/services/buildprintService";

interface BuildprintStripProps {
  githubAnalysis?: GitHubDeepAnalysisInput | null;
  userProfile?: UserProfileInput | null;
  buildprint?: Buildprint | null;
  compact?: boolean;
  className?: string;
}

const ICONS = {
  Zap,
  Users,
  TrendingUp,
  GitBranch,
  Crown,
};

function MetricBar({
  metric,
  compact,
}: {
  metric: BuildprintMetric;
  compact?: boolean;
}) {
  const Icon = ICONS[metric.icon as keyof typeof ICONS] || Zap;
  const colorClass = getBuildprintColor(metric.value);
  const bgClass = getBuildprintBgColor(metric.value);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className={`flex flex-col items-center gap-1 ${compact ? "w-8" : "w-12"}`}>
            {/* Icon */}
            <Icon className={`w-3 h-3 ${colorClass}`} />

            {/* Progress bar */}
            <div className={`w-full ${compact ? "h-1" : "h-1.5"} bg-muted rounded-full overflow-hidden`}>
              <div
                className={`h-full ${bgClass} rounded-full transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
              />
            </div>

            {/* Label (only if not compact) */}
            {!compact && (
              <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                {metric.label.slice(0, 3)}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">{metric.label}</span>
              <span className={`font-bold ${colorClass}`}>{metric.value}</span>
            </div>

            {/* Receipts */}
            {metric.receipts.length > 0 && (
              <div className="space-y-1 pt-1 border-t">
                {metric.receipts.slice(0, 4).map((receipt, i) => (
                  <div key={i} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-muted-foreground">{receipt.label}</span>
                    {receipt.url ? (
                      <a
                        href={receipt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {receipt.value}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="font-medium">{receipt.value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BuildprintStrip({
  githubAnalysis,
  userProfile,
  buildprint: providedBuildprint,
  compact = false,
  className = "",
}: BuildprintStripProps) {
  // Compute buildprint if not provided
  const buildprint = useMemo(() => {
    if (providedBuildprint) return providedBuildprint;
    return computeBuildprint(githubAnalysis || null, userProfile || null);
  }, [providedBuildprint, githubAnalysis, userProfile]);

  if (!buildprint) {
    return null;
  }

  const metrics = [
    buildprint.impact,
    buildprint.collaboration,
    buildprint.consistency,
    buildprint.complexity,
    buildprint.ownership,
  ];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Buildprint label */}
      {!compact && (
        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 mr-1">
          Buildprint
        </Badge>
      )}

      {/* Metric bars */}
      {metrics.map((metric) => (
        <MetricBar key={metric.label} metric={metric} compact={compact} />
      ))}

      {/* Overall score */}
      {!compact && (
        <div className="flex items-center gap-1 ml-1 pl-1.5 border-l">
          <span className={`text-xs font-bold ${getBuildprintColor(buildprint.overallScore)}`}>
            {buildprint.overallScore}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Inline mini version for tight spaces
 */
export function BuildprintMini({
  buildprint,
  className = "",
}: {
  buildprint: Buildprint | null;
  className?: string;
}) {
  if (!buildprint) return null;

  const metrics = [
    { ...buildprint.impact, abbr: "I" },
    { ...buildprint.collaboration, abbr: "C" },
    { ...buildprint.consistency, abbr: "S" },
    { ...buildprint.complexity, abbr: "X" },
    { ...buildprint.ownership, abbr: "O" },
  ];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {metrics.map((metric) => (
        <TooltipProvider key={metric.label}>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div
                className={`w-1.5 h-4 rounded-sm ${getBuildprintBgColor(metric.value)}`}
                style={{ opacity: 0.3 + (metric.value / 100) * 0.7 }}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {metric.label}: {metric.value}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

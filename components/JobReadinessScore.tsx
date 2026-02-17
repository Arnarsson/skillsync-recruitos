"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ReadinessScore, PillarName, ReadinessInput } from "@/services/jobReadiness/types";
import { PILLAR_WEIGHTS } from "@/services/jobReadiness/types";
import { computeReadinessScore } from "@/services/jobReadiness/engine";

const LEVEL_CONFIG = {
  hot: { color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", border: "border-red-200", label: "Hot" },
  warm: { color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50", border: "border-orange-200", label: "Warm" },
  warming: { color: "bg-yellow-500", textColor: "text-yellow-700", bgLight: "bg-yellow-50", border: "border-yellow-200", label: "Warming" },
  cold: { color: "bg-blue-400", textColor: "text-blue-700", bgLight: "bg-blue-50", border: "border-blue-200", label: "Cold" },
} as const;

const PILLAR_LABELS: Record<PillarName, string> = {
  networkIntelligence: "Network",
  engagementDecay: "Engagement",
  skillDiversification: "Skills",
  companyHealth: "Company",
  tenureRisk: "Tenure",
  profileOptimization: "Profile",
  sentimentShift: "Sentiment",
};

interface JobReadinessScoreProps {
  candidateId: string;
  /** Optional readiness input for client-side computation (when candidate not in DB) */
  readinessInput?: ReadinessInput;
  compact?: boolean;
  className?: string;
}

export function JobReadinessScore({ candidateId, readinessInput, compact = false, className }: JobReadinessScoreProps) {
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReadiness() {
      try {
        // Try API first (works for DB-backed candidates)
        const res = await fetch(`/api/candidates/${candidateId}/readiness`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setReadiness(data);
      } catch {
        // Fall back to client-side computation if we have input data
        if (readinessInput) {
          try {
            const result = await computeReadinessScore(readinessInput);
            setReadiness(result);
          } catch {
            setError("Could not compute readiness");
          }
        } else {
          setError("Could not compute readiness");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReadiness();
  }, [candidateId, readinessInput]);

  if (loading) {
    return (
      <div className={cn("animate-pulse rounded-md bg-muted h-6 w-20", className)} />
    );
  }

  if (error || !readiness) return null;

  const config = LEVEL_CONFIG[readiness.level];

  // Compact: just the badge
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          config.bgLight, config.textColor, config.border, "border",
          className
        )}
        title={`Job Readiness: ${readiness.overall}/100 (${config.label})`}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", config.color)} />
        {config.label} {readiness.overall}
      </span>
    );
  }

  // Full: badge + expandable breakdown
  return (
    <div className={cn("rounded-lg border", config.border, config.bgLight, className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", config.color)} />
          <span className={cn("text-sm font-semibold", config.textColor)}>
            {config.label}
          </span>
          <span className="text-sm text-muted-foreground">
            {readiness.overall}/100
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {Math.round(readiness.confidence * 100)}% confidence
          </span>
          <svg
            className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            Job Readiness signals how likely this person is receptive to outreach right now.
          </p>
          {(Object.entries(readiness.pillars) as [PillarName, ReadinessScore['pillars'][PillarName]][]).map(
            ([name, pillar]) => (
              <div key={name} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground truncate" title={name}>
                  {PILLAR_LABELS[name]}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pillar.score === null ? "bg-muted-foreground/20" : config.color
                    )}
                    style={{ width: `${pillar.score ?? 0}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums text-muted-foreground">
                  {pillar.score !== null ? pillar.score : "—"}
                </span>
                <span className="w-10 text-right text-muted-foreground/60">
                  {Math.round(PILLAR_WEIGHTS[name] * 100)}%
                </span>
              </div>
            )
          )}
          <div className="pt-1 text-[10px] text-muted-foreground/60">
            Sources: {readiness.dataSourcesSummary.join(", ")} | Computed {new Date(readiness.computedAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

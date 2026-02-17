"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ReadinessScore, PillarName, ReadinessInput, Signal } from "@/services/jobReadiness/types";
import { computeReadinessScore } from "@/services/jobReadiness/engine";

// ===== Recruiter-friendly level config =====
const LEVEL_CONFIG = {
  hot: {
    label: "Strong signal",
    description: "Multiple signs this person is actively looking — great time to reach out",
    gradient: "from-red-500 to-orange-500",
    markerColor: "bg-red-500",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  warm: {
    label: "Good timing",
    description: "Some positive signals — worth reaching out with a personalized message",
    gradient: "from-orange-500 to-amber-500",
    markerColor: "bg-orange-500",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  warming: {
    label: "Early signals",
    description: "A few indicators of potential interest — keep an eye on this candidate",
    gradient: "from-amber-500 to-yellow-500",
    markerColor: "bg-yellow-500",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  cold: {
    label: "No signals yet",
    description: "No clear signs of movement — may still be worth a soft touch",
    gradient: "from-blue-500 to-cyan-500",
    markerColor: "bg-blue-400",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
} as const;

// ===== Map technical signal names to recruiter-friendly explanations =====
const SIGNAL_EXPLANATIONS: Record<string, { label: string; explain: (detail?: string) => string }> = {
  // Network Intelligence
  following_ratio: {
    label: "Exploring new connections",
    explain: (d) => d?.includes("ratio")
      ? "Following many more people than follow them — often a sign of actively networking"
      : "Network activity suggests they're looking outward",
  },
  org_diversity: {
    label: "Watching other companies",
    explain: (d) => {
      const match = d?.match(/(\d+) unique external orgs/);
      return match
        ? `Engaging with ${match[1]} different organizations — may be exploring options`
        : "Interacting with multiple organizations outside their current employer";
    },
  },
  recent_engagement_volume: {
    label: "Active on GitHub",
    explain: () => "Recent starring and forking activity suggests they're actively exploring",
  },
  recent_forks: {
    label: "Forking new projects",
    explain: (d) => {
      const match = d?.match(/(\d+) repos forked/);
      return match
        ? `Forked ${match[1]} projects recently — often a sign of evaluating new tech`
        : "Recently forking repositories from other organizations";
    },
  },
  // Engagement Decay
  activity_cliff: {
    label: "Activity drop-off",
    explain: (d) => d?.includes("Sudden")
      ? "Sudden drop in coding activity — could indicate dissatisfaction or preparing to leave"
      : "Noticeable change in their coding patterns recently",
  },
  decay_pattern: {
    label: "Changing work patterns",
    explain: (d) => d?.includes("Sudden")
      ? "Sharp decrease in activity — a common signal before job transitions"
      : d?.includes("Gradual")
        ? "Gradually becoming less active — may be losing engagement at current role"
        : "Coding patterns are stable — no sign of disengagement",
  },
  event_type_diversity: {
    label: "Narrowing focus",
    explain: () => "Types of GitHub activity have shifted — could indicate changing priorities",
  },
  repo_push_decay: {
    label: "Fewer code pushes",
    explain: () => "Pushing code less frequently than before — may be winding down at current role",
  },
  // Skill Diversification
  new_languages: {
    label: "Learning new tech",
    explain: (d) => {
      const match = d?.match(/New languages?: (.+)/);
      return match
        ? `Started using ${match[1]} recently — people exploring new skills are often considering new roles`
        : "Picking up new programming languages — a common sign of career exploration";
    },
  },
  language_diversity: {
    label: "Broad skill set",
    explain: (d) => {
      const match = d?.match(/(\d+) unique languages/);
      return match
        ? `Works across ${match[1]} languages — versatile developer, attractive to many teams`
        : "Uses a diverse set of technologies";
    },
  },
  topic_expansion: {
    label: "Exploring new areas",
    explain: () => "Moving into new technical domains — suggests they're expanding their horizons",
  },
  recent_repo_creation: {
    label: "Starting new projects",
    explain: (d) => {
      const match = d?.match(/(\d+) new repos/);
      return match
        ? `Created ${match[1]} new projects recently — high creative energy, may want a new challenge`
        : "Recently started new side projects";
    },
  },
  linkedin_skills: {
    label: "Skills on LinkedIn",
    explain: (d) => {
      const match = d?.match(/(\d+) skills listed/);
      return match
        ? `${match[1]} skills listed on LinkedIn — well-positioned profile`
        : "Skills listed on LinkedIn profile";
    },
  },
  // Company Health
  layoff_data: {
    label: "Company layoffs",
    explain: (d) => d?.includes("recent layoffs")
      ? "Their company has had recent layoffs — employees are often more receptive after layoffs"
      : "No recent layoff data found for their company",
  },
  news_sentiment: {
    label: "Company in the news",
    explain: (d) => d?.includes("negative") || (d && parseFloat(d) < 0.4)
      ? "Negative press about their employer — may be considering other options"
      : "Recent news about their company",
  },
  departure_signal: {
    label: "Possible departure clues",
    explain: (d) => d?.includes("departure-related")
      ? "Their GitHub bio contains phrases that suggest they may be leaving or have left"
      : d?.includes("No company listed")
        ? "No company listed on their profile — may be between roles"
        : "Company info present on their profile",
  },
  // Tenure Risk
  linkedin_tenure: {
    label: "Time at current job",
    explain: (d) => {
      const match = d?.match(/([\d.]+) years? at/);
      if (!match) return "Tenure data from LinkedIn";
      const years = parseFloat(match[1]);
      if (years >= 2 && years <= 3.5) return `${match[1]} years at current role — this is the most common transition window`;
      if (years > 4) return `${match[1]} years at current role — long tenure suggests they're settled`;
      return `${match[1]} years at current role — still relatively new`;
    },
  },
  provided_tenure: {
    label: "Time at current job",
    explain: (d) => {
      const match = d?.match(/([\d.]+) years/);
      if (!match) return "Tenure information available";
      const years = parseFloat(match[1]);
      if (years >= 2 && years <= 3.5) return `${match[1]} years — peak window for job transitions`;
      if (years > 4) return `${match[1]} years — likely comfortable in current role`;
      return `${match[1]} years — still building at current company`;
    },
  },
  tenure_pattern: {
    label: "Job history pattern",
    explain: (d) => {
      const match = d?.match(/Average past tenure: ([\d.]+) years across (\d+)/);
      return match
        ? `Averages ${match[1]} years per role across ${match[2]} positions — helps predict when they'll move next`
        : "Historical tenure pattern from LinkedIn";
    },
  },
  github_age_proxy: {
    label: "Career length estimate",
    explain: (d) => d || "Estimated career length based on GitHub account age",
  },
  // Profile Optimization
  seeking_keywords: {
    label: "\"Open to work\" signals",
    explain: (d) => d?.includes("Matches:")
      ? `Their bio contains job-seeking phrases — strong indicator they want to be contacted`
      : "No explicit job-seeking language found in their profile",
  },
  readme_freshness: {
    label: "Profile recently updated",
    explain: (d) => {
      const match = d?.match(/(\d+) days ago/);
      return match
        ? `Updated their GitHub profile README ${match[1]} days ago — people polish profiles when job hunting`
        : "Profile README activity tracked";
    },
  },
  website_activity: {
    label: "Portfolio/website active",
    explain: (d) => d?.includes("updated")
      ? "Recently updated their portfolio — often happens before a job search"
      : "Portfolio or personal website tracked",
  },
  profile_completeness: {
    label: "Complete profile",
    explain: (d) => {
      const match = d?.match(/(\d)\/4/);
      return match
        ? `${match[1]} of 4 profile fields filled — ${parseInt(match[1]) >= 3 ? 'well-maintained profile, cares about visibility' : 'sparse profile'}`
        : "Profile completeness assessed";
    },
  },
  // Sentiment Shift
  llm_sentiment: {
    label: "Tone analysis",
    explain: () => "AI analysis of their public writing suggests potential openness to new opportunities",
  },
  keyword_sentiment: {
    label: "Language patterns",
    explain: (d) => d?.includes("negative") || d?.includes("Negative")
      ? "Using language that may indicate dissatisfaction — could be receptive to outreach"
      : "Language patterns in their public posts analyzed",
  },
  post_engagement_trend: {
    label: "Social engagement shift",
    explain: (d) => d?.includes("down")
      ? "Engagement on their posts has dropped — sometimes correlates with career transitions"
      : "Social media engagement patterns tracked",
  },
};

// Get the top N most interesting signals across all pillars
function getTopSignals(readiness: ReadinessScore, maxSignals: number = 4): Array<Signal & { pillarLabel: string }> {
  const PILLAR_CONTEXT: Record<PillarName, string> = {
    networkIntelligence: "Networking",
    engagementDecay: "Activity",
    skillDiversification: "Skills",
    companyHealth: "Company",
    tenureRisk: "Tenure",
    profileOptimization: "Profile",
    sentimentShift: "Sentiment",
  };

  const allSignals: Array<Signal & { pillarLabel: string }> = [];

  for (const [pillarName, pillar] of Object.entries(readiness.pillars)) {
    if (pillar.score === null) continue;
    for (const signal of pillar.signals) {
      // Skip signals with zero contribution
      if (signal.normalizedValue === 0 && signal.confidence < 0.3) continue;
      allSignals.push({
        ...signal,
        pillarLabel: PILLAR_CONTEXT[pillarName as PillarName],
      });
    }
  }

  // Sort by: high normalizedValue * confidence first (most interesting signals)
  allSignals.sort((a, b) => (b.normalizedValue * b.confidence) - (a.normalizedValue * a.confidence));

  return allSignals.slice(0, maxSignals);
}

// Generate a one-line summary for the level
function getLevelSummary(readiness: ReadinessScore): string {
  const topSignals = getTopSignals(readiness, 2);
  if (topSignals.length === 0) return LEVEL_CONFIG[readiness.level].description;

  // Build summary from top signals
  const parts = topSignals.map(s => {
    const explainer = SIGNAL_EXPLANATIONS[s.name];
    return explainer?.label || s.name.replace(/_/g, ' ');
  });

  return parts.join(" · ");
}

interface OutreachTimingProps {
  candidateId: string;
  readinessInput?: ReadinessInput;
  compact?: boolean;
  className?: string;
}

export function OutreachTiming({ candidateId, readinessInput, compact = false, className }: OutreachTimingProps) {
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReadiness() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/readiness`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setReadiness(data);
      } catch {
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

  const config = readiness ? LEVEL_CONFIG[readiness.level] : null;
  const topSignals = useMemo(() => readiness ? getTopSignals(readiness) : [], [readiness]);
  const summary = useMemo(() => readiness ? getLevelSummary(readiness) : "", [readiness]);

  if (loading) {
    return (
      <div className={cn("animate-pulse rounded-lg bg-muted/50 h-12", className)} />
    );
  }

  if (error || !readiness || !config) return null;

  // ===== COMPACT: Thermometer + one-line reason (pipeline card) =====
  if (compact) {
    return (
      <div className={cn("rounded-lg border p-2.5 sm:p-3", config.borderColor, config.bgColor, className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Outreach Timing
          </span>
          <span className={cn("text-[10px] sm:text-xs font-semibold", config.textColor)}>
            {config.label}
          </span>
        </div>

        {/* Thermometer */}
        <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden mb-2">
          {/* Gradient track */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 via-yellow-500/30 to-red-500/30" />
          {/* Fill */}
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", config.gradient, "transition-all duration-700")}
            style={{ width: `${Math.max(readiness.overall, 5)}%` }}
          />
        </div>

        {/* One-line reason */}
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
          {summary}
        </p>
      </div>
    );
  }

  // ===== FULL: Thermometer + explained evidence cards (deep profile) =====
  return (
    <div className={cn("rounded-lg border", config.borderColor, config.bgColor, className)}>
      {/* Header */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex w-full items-center justify-between p-4 text-left cursor-pointer hover:bg-muted/20 transition-colors rounded-t-lg"
        type="button"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Outreach Timing
            </span>
            <span className={cn("text-sm font-semibold", config.textColor)}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {config.description}
          </p>
        </div>
        <svg
          className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-4", expanded && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Thermometer */}
      <div className="px-4 pb-3">
        <div className="relative h-2.5 rounded-full bg-muted/50 overflow-hidden">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-yellow-500/20 to-red-500/20" />
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", config.gradient, "transition-all duration-700")}
            style={{ width: `${Math.max(readiness.overall, 5)}%` }}
          />
          {/* Labels */}
          <div className="absolute inset-0 flex justify-between items-center px-2 text-[9px] font-medium text-muted-foreground/50">
            <span>Cold</span>
            <span>Hot</span>
          </div>
        </div>
      </div>

      {/* Expanded: Evidence signals */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            What we found — signals that indicate whether this person might be open to new opportunities:
          </p>

          {topSignals.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic">
              Not enough data to identify specific signals. Consider enriching this profile with more sources.
            </p>
          ) : (
            <div className="space-y-2">
              {topSignals.map((signal, i) => {
                const explainer = SIGNAL_EXPLANATIONS[signal.name];
                const isLowConfidence = signal.confidence < 0.5;

                return (
                  <div
                    key={`${signal.name}-${i}`}
                    className={cn(
                      "rounded-md border p-2.5 text-xs",
                      isLowConfidence ? "opacity-50 border-dashed" : "border-solid",
                      config.borderColor,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.markerColor)} />
                          <span className="font-medium text-foreground">
                            {explainer?.label || signal.name.replace(/_/g, ' ')}
                          </span>
                          <span className="text-muted-foreground/40 text-[10px]">
                            {signal.pillarLabel}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed pl-3">
                          {explainer?.explain(signal.detail) || signal.detail || 'Signal detected'}
                        </p>
                      </div>
                      {isLowConfidence && (
                        <span className="text-[10px] text-muted-foreground/40 whitespace-nowrap shrink-0">
                          limited data
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground/40">
            <span>
              Based on: {readiness.dataSourcesSummary.join(", ")}
            </span>
            <span>
              Updated {new Date(readiness.computedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep backward compatibility
export const JobReadinessScore = OutreachTiming;

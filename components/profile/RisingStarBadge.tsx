"use client";

import { TrendingUp, Zap, Star, Users, Rocket } from "lucide-react";
import { RisingStarAnalysis, RisingStarSignal } from "@/lib/risingStars";
import { cn } from "@/lib/utils";

interface RisingStarBadgeProps {
  analysis: RisingStarAnalysis;
  compact?: boolean;
  className?: string;
}

const signalIcons: Record<RisingStarSignal["type"], React.ElementType> = {
  follower_velocity: Users,
  star_ratio: Star,
  quality_repos: Zap,
  trending_repo: TrendingUp,
  first_major_pr: Rocket,
};

export function RisingStarBadge({ analysis, compact = false, className }: RisingStarBadgeProps) {
  if (!analysis.isRisingStar && compact) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        analysis.score >= 70 
          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30"
          : "bg-purple-500/20 text-purple-300 border border-purple-500/30",
        className
      )}>
        <TrendingUp className="w-3 h-3" />
        Rising Star
        <span className="text-[10px] opacity-70">{analysis.score}%</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-4",
      analysis.score >= 70 
        ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20"
        : analysis.score >= 40
        ? "bg-purple-500/10 border-purple-500/20"
        : "bg-zinc-900/50 border-zinc-800",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2 rounded-lg",
          analysis.score >= 70 ? "bg-amber-500/20" : "bg-purple-500/20"
        )}>
          <TrendingUp className={cn(
            "w-5 h-5",
            analysis.score >= 70 ? "text-amber-400" : "text-purple-400"
          )} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Rising Star Analysis</h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              analysis.score >= 70 
                ? "bg-amber-500/20 text-amber-300" 
                : analysis.score >= 40
                ? "bg-purple-500/20 text-purple-300"
                : "bg-zinc-700 text-zinc-400"
            )}>
              {analysis.score}%
            </span>
          </div>
          <p className="text-sm text-zinc-400">{analysis.summary}</p>
        </div>
      </div>

      {/* Signals */}
      {analysis.signals.length > 0 && (
        <div className="space-y-2">
          {analysis.signals.map((signal, i) => {
            const Icon = signalIcons[signal.type];
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
              >
                <div className="p-1.5 rounded bg-zinc-700/50">
                  <Icon className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{signal.label}</span>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      +{signal.score}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{signal.value}</p>
                  {signal.evidence && (
                    <p className="text-xs text-zinc-500 mt-1">{signal.evidence}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {analysis.signals.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-4">
          No strong rising star signals detected
        </p>
      )}
    </div>
  );
}

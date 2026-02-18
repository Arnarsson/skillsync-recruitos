"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
  hasGithubData?: boolean; // When false, score is based on text-only matching
}

export function getScoreInfo(score: number) {
  if (score >= 80) {
    return {
      label: "Excellent Match",
      labelDa: "Fremragende Match",
      color: "text-green-500",
      bg: "bg-green-500/20",
      border: "border-green-500/30",
      ring: "ring-green-500/30",
    };
  }
  if (score >= 60) {
    return {
      label: "Good Match",
      labelDa: "God Match",
      color: "text-yellow-500",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/30",
      ring: "ring-yellow-500/30",
    };
  }
  if (score >= 40) {
    return {
      label: "Moderate Match",
      labelDa: "Moderat Match",
      color: "text-orange-500",
      bg: "bg-orange-500/20",
      border: "border-orange-500/30",
      ring: "ring-orange-500/30",
    };
  }
  return {
    label: "Low Match",
    labelDa: "Lav Match",
    color: "text-red-500",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    ring: "ring-red-500/30",
  };
}

export default function ScoreBadge({
  score,
  size = "md",
  showLabel = true,
  showTooltip = true,
  className,
  hasGithubData = true,
}: ScoreBadgeProps) {
  const { lang } = useLanguage();
  // Cap score display at 50 and use grey styling when no GitHub data to back it up
  const effectiveScore = !hasGithubData && score > 50 ? 50 : score;
  const info = !hasGithubData
    ? {
        label: "Unverified",
        labelDa: "Ikke verificeret",
        color: "text-zinc-400",
        bg: "bg-zinc-500/20",
        border: "border-zinc-500/30",
        ring: "ring-zinc-500/30",
      }
    : getScoreInfo(effectiveScore);
  const label = lang === "da" ? info.labelDa : info.label;

  const sizeClasses = {
    sm: "text-lg w-10 h-10",
    md: "text-2xl w-14 h-14",
    lg: "text-3xl w-20 h-20",
  };

  const labelSizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const badge = (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl",
        info.bg,
        info.border,
        "border",
        className
      )}
    >
      <div className={cn("font-bold", info.color, sizeClasses[size])}>
        <div className="flex items-center justify-center h-full">{effectiveScore}</div>
      </div>
      {showLabel && (
        <div
          className={cn(
            "font-medium text-center px-1 pb-1",
            info.color,
            labelSizeClasses[size]
          )}
        >
          {label}
        </div>
      )}
      {!hasGithubData && (
        <div className="text-[9px] text-zinc-500 text-center px-1 pb-1">No GitHub data</div>
      )}
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              {lang === "da" ? "Score Forklaring" : "Score Explanation"}
            </div>
            <div className="text-sm text-muted-foreground">
              {lang === "da" ? (
                <>
                  <p className="mb-2">Scoren er baseret på:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Kompetence match (35%)</li>
                    <li>Erfaring (20%)</li>
                    <li>Branche (15%)</li>
                    <li>Senioritet (20%)</li>
                    <li>Lokation (10%)</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="mb-2">Score is based on:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Skills match (35%)</li>
                    <li>Experience (20%)</li>
                    <li>Industry (15%)</li>
                    <li>Seniority (20%)</li>
                    <li>Location (10%)</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

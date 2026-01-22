"use client";

import { LoadingScramble as BaseLoadingScramble } from "./text-scramble";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingScrambleProps {
  phases: string[];
  interval?: number;
  className?: string;
  showIcon?: boolean;
}

export function LoadingScramble({
  phases,
  interval = 2000,
  className,
  showIcon = true,
}: LoadingScrambleProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showIcon && (
        <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
      )}
      <BaseLoadingScramble
        phases={phases}
        interval={interval}
        className="text-sm text-muted-foreground"
      />
    </div>
  );
}

// Pre-configured loading scramble for common use cases
export function PipelineLoadingScramble() {
  return (
    <LoadingScramble
      phases={[
        "Searching GitHub profiles...",
        "Analyzing skill sets...",
        "Scoring candidates...",
        "Building pipeline...",
      ]}
      interval={2500}
    />
  );
}

export function AnalysisLoadingScramble() {
  return (
    <LoadingScramble
      phases={[
        "Fetching repositories...",
        "Analyzing commit history...",
        "Evaluating contributions...",
        "Generating insights...",
      ]}
      interval={2000}
    />
  );
}

export function GitHubLoadingScramble() {
  return (
    <LoadingScramble
      phases={[
        "Fetching repos...",
        "Analyzing commits...",
        "Checking PRs...",
        "Generating insights...",
      ]}
      interval={2000}
    />
  );
}

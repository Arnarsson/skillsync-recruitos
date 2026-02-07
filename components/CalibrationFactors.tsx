"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
  Target,
  User,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  Info,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalibrationResult, CalibrationFactor } from "@/types";
import { useLanguage } from "@/lib/i18n";

interface CalibrationFactorsProps {
  calibrationResult?: CalibrationResult;
  socialContext?: {
    companyUrl?: string;
    managerUrl?: string;
    benchmarkUrl?: string;
  };
  className?: string;
  defaultExpanded?: boolean;
}

export function CalibrationFactors({
  calibrationResult,
  socialContext,
  className,
  defaultExpanded = false,
}: CalibrationFactorsProps) {
  const { lang } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // If no calibration data, show placeholder with info about adding social context
  if (!calibrationResult && !socialContext) {
    return null; // Don't render anything if no data
  }

  const hasAnySocialContext = socialContext?.companyUrl || socialContext?.managerUrl || socialContext?.benchmarkUrl;

  if (!calibrationResult && hasAnySocialContext) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4" />
            <span className="text-sm">
              {lang === "da"
                ? "Social kontekst tilføjet - kør analyse for at se effekt"
                : "Social context added - run analysis to see impact"}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calibrationResult) return null;

  const { factors, totalImpact, appliedToScore } = calibrationResult;

  const sourceLabels = {
    hiring_manager: {
      icon: User,
      label: lang === "da" ? "Hiring Manager" : "Hiring Manager",
      color: "text-blue-500",
    },
    company: {
      icon: Building2,
      label: lang === "da" ? "Virksomhed" : "Company",
      color: "text-purple-500",
    },
    benchmark: {
      icon: Users,
      label: lang === "da" ? "Top Performer" : "Benchmark",
      color: "text-green-500",
    },
  };

  return (
    <Card className={cn("", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">
                  {lang === "da" ? "Kalibreringseffekt" : "Calibration Impact"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {lang === "da"
                    ? "Sådan påvirker social kontekst scoren"
                    : "How social context affects the score"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalImpact !== 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono",
                    totalImpact > 0 ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"
                  )}
                >
                  {totalImpact > 0 ? "+" : ""}{totalImpact}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4">
          <div className="space-y-3">
            {factors.map((factor, index) => {
              const sourceInfo = sourceLabels[factor.source];
              const Icon = sourceInfo.icon;

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div className={cn("p-1 rounded", sourceInfo.color, "bg-current/10")}>
                    <Icon className={cn("w-3 h-3", sourceInfo.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{factor.factor}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1 py-0 h-4",
                          factor.impact > 0
                            ? "text-green-500 border-green-500/30"
                            : factor.impact < 0
                            ? "text-red-500 border-red-500/30"
                            : "text-muted-foreground"
                        )}
                      >
                        {factor.impact > 0 ? (
                          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                        ) : factor.impact < 0 ? (
                          <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                        ) : null}
                        {factor.impact > 0 ? "+" : ""}{factor.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {factor.reasoning}
                    </p>
                  </div>
                </div>
              );
            })}

            {factors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                {lang === "da"
                  ? "Ingen kalibreringseffekt anvendt"
                  : "No calibration effects applied"}
              </p>
            )}

            {/* Summary */}
            {factors.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {lang === "da" ? "Total påvirkning" : "Total impact"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono font-medium",
                        totalImpact > 0 ? "text-green-500" : totalImpact < 0 ? "text-red-500" : "text-muted-foreground"
                      )}
                    >
                      {totalImpact > 0 ? "+" : ""}{totalImpact} point
                    </span>
                    {appliedToScore && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {lang === "da"
                                ? "Allerede inkluderet i kandidatens score"
                                : "Already included in candidate's score"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Compact inline badge version
export function CalibrationImpactBadge({
  totalImpact,
  className,
}: {
  totalImpact: number;
  className?: string;
}) {
  const { lang } = useLanguage();

  if (totalImpact === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] gap-0.5",
              totalImpact > 0 ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30",
              className
            )}
          >
            <Target className="w-2.5 h-2.5" />
            {totalImpact > 0 ? "+" : ""}{totalImpact}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {lang === "da"
              ? `Score justeret med ${totalImpact > 0 ? "+" : ""}${totalImpact} baseret på social kontekst`
              : `Score adjusted by ${totalImpact > 0 ? "+" : ""}${totalImpact} based on social context`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

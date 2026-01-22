"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Info,
  Code,
  TrendingUp,
  Briefcase,
  Target,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreLegendProps {
  className?: string;
  defaultExpanded?: boolean;
}

const SCORE_WEIGHTS = [
  {
    key: "skills",
    label: "Skills",
    weight: 35,
    icon: Code,
    description: "Technical skills match with job requirements",
  },
  {
    key: "experience",
    label: "Experience",
    weight: 20,
    icon: TrendingUp,
    description: "Years and depth of relevant experience",
  },
  {
    key: "industry",
    label: "Industry",
    weight: 15,
    icon: Briefcase,
    description: "Domain expertise and industry background",
  },
  {
    key: "seniority",
    label: "Seniority",
    weight: 15,
    icon: Target,
    description: "Career level alignment with role",
  },
  {
    key: "location",
    label: "Location",
    weight: 15,
    icon: MapPin,
    description: "Geographic proximity and timezone fit",
  },
];

const COLOR_SCALE = [
  {
    range: "80-100",
    label: "Excellent Match",
    color: "bg-green-500",
    textColor: "text-green-500",
    description: "Strong alignment across all criteria",
  },
  {
    range: "60-79",
    label: "Good Match",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    description: "Solid fit with minor gaps",
  },
  {
    range: "0-59",
    label: "Limited Match",
    color: "bg-red-500",
    textColor: "text-red-500",
    description: "Significant gaps in key areas",
  },
];

export default function ScoreLegend({
  className,
  defaultExpanded = false,
}: ScoreLegendProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <Card className={cn("border-border/50", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">How Alignment Scores Work</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Color Scale */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Score Ranges
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_SCALE.map((item) => (
                <div
                  key={item.range}
                  className="flex flex-col items-center p-3 rounded-lg bg-muted/30"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mb-2",
                      item.color
                    )}
                  >
                    <span className="text-xs font-bold text-white">
                      {item.range.split("-")[0]}+
                    </span>
                  </div>
                  <span className={cn("text-xs font-medium", item.textColor)}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center mt-1">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weight Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Weight Distribution
            </h4>
            <div className="space-y-2">
              {SCORE_WEIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.weight}%
                    </Badge>
                  </div>
                );
              })}
            </div>
            {/* Visual weight bar */}
            <div className="flex h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 w-[35%]" title="Skills 35%" />
              <div className="bg-purple-500 w-[20%]" title="Experience 20%" />
              <div className="bg-orange-500 w-[15%]" title="Industry 15%" />
              <div className="bg-green-500 w-[15%]" title="Seniority 15%" />
              <div className="bg-pink-500 w-[15%]" title="Location 15%" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Skills</span>
              <span>Experience</span>
              <span>Industry</span>
              <span>Seniority</span>
              <span>Location</span>
            </div>
          </div>

          {/* Expandable Explanation */}
          <div className="border-t border-border/50 pt-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showExplanation ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              What does this mean?
            </button>

            {showExplanation && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 space-y-3 text-sm text-muted-foreground">
                <p>
                  The alignment score (0-100) measures how well a candidate
                  matches your job requirements across five key dimensions.
                </p>
                <p>
                  <strong className="text-foreground">Skills (35%)</strong> -
                  The most heavily weighted factor. Evaluates technical
                  competencies, programming languages, frameworks, and tools
                  against your requirements.
                </p>
                <p>
                  <strong className="text-foreground">Experience (20%)</strong>{" "}
                  - Assesses years of relevant experience and depth of
                  expertise in similar roles or projects.
                </p>
                <p>
                  <strong className="text-foreground">Industry (15%)</strong> -
                  Considers domain knowledge and experience in your specific
                  industry or sector.
                </p>
                <p>
                  <strong className="text-foreground">Seniority (15%)</strong> -
                  Matches the candidate&apos;s career level with your role
                  requirements (junior, mid, senior, lead).
                </p>
                <p>
                  <strong className="text-foreground">Location (15%)</strong> -
                  Evaluates geographic fit, timezone compatibility, and
                  willingness to relocate if applicable.
                </p>
                <p className="text-xs pt-2 border-t border-border/30">
                  Scores are generated by AI analysis of public profile data and
                  compared against your job context. Higher scores indicate
                  stronger overall alignment.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

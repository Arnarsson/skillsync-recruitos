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
import { useLanguage } from "@/lib/i18n";

interface ScoreLegendProps {
  className?: string;
  defaultExpanded?: boolean;
}

export default function ScoreLegend({
  className,
  defaultExpanded = false,
}: ScoreLegendProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showExplanation, setShowExplanation] = useState(false);

  const SCORE_WEIGHTS = [
    {
      key: "skills",
      label: t("score.skills"),
      weight: 35,
      icon: Code,
      description: t("score.skillsDesc"),
    },
    {
      key: "experience",
      label: t("score.experience"),
      weight: 20,
      icon: TrendingUp,
      description: t("score.experienceDesc"),
    },
    {
      key: "industry",
      label: t("score.industry"),
      weight: 15,
      icon: Briefcase,
      description: t("score.industryDesc"),
    },
    {
      key: "seniority",
      label: t("score.seniority"),
      weight: 15,
      icon: Target,
      description: t("score.seniorityDesc"),
    },
    {
      key: "location",
      label: t("score.location"),
      weight: 15,
      icon: MapPin,
      description: t("score.locationDesc"),
    },
  ];

  const COLOR_SCALE = [
    {
      range: "80-100",
      label: t("score.excellent"),
      color: "bg-green-500",
      textColor: "text-green-500",
      description: t("score.excellentDesc"),
    },
    {
      range: "60-79",
      label: t("score.good"),
      color: "bg-yellow-500",
      textColor: "text-yellow-500",
      description: t("score.goodDesc"),
    },
    {
      range: "0-59",
      label: t("score.limited"),
      color: "bg-red-500",
      textColor: "text-red-500",
      description: t("score.limitedDesc"),
    },
  ];

  return (
    <Card className={cn("border-border/50", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("score.title")}</span>
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
              {t("score.ranges")}
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
              {t("score.weights")}
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
              <div className="bg-blue-500 w-[35%]" title={`${t("score.skills")} 35%`} />
              <div className="bg-purple-500 w-[20%]" title={`${t("score.experience")} 20%`} />
              <div className="bg-orange-500 w-[15%]" title={`${t("score.industry")} 15%`} />
              <div className="bg-green-500 w-[15%]" title={`${t("score.seniority")} 15%`} />
              <div className="bg-pink-500 w-[15%]" title={`${t("score.location")} 15%`} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t("score.skills")}</span>
              <span>{t("score.experience")}</span>
              <span>{t("score.industry")}</span>
              <span>{t("score.seniority")}</span>
              <span>{t("score.location")}</span>
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
              {t("score.explanation")}
            </button>

            {showExplanation && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 space-y-3 text-sm text-muted-foreground">
                <p>{t("score.explanationIntro")}</p>
                <p>
                  <strong className="text-foreground">{t("score.skills")} (35%)</strong> -{" "}
                  {t("score.skillsExplanation")}
                </p>
                <p>
                  <strong className="text-foreground">{t("score.experience")} (20%)</strong> -{" "}
                  {t("score.experienceExplanation")}
                </p>
                <p>
                  <strong className="text-foreground">{t("score.industry")} (15%)</strong> -{" "}
                  {t("score.industryExplanation")}
                </p>
                <p>
                  <strong className="text-foreground">{t("score.seniority")} (15%)</strong> -{" "}
                  {t("score.seniorityExplanation")}
                </p>
                <p>
                  <strong className="text-foreground">{t("score.location")} (15%)</strong> -{" "}
                  {t("score.locationExplanation")}
                </p>
                <p className="text-xs pt-2 border-t border-border/30">
                  {t("score.footer")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

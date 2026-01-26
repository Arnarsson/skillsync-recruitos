"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GitBranch, Linkedin, FileText, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataSourceConfidence } from "@/types";
import { useLanguage } from "@/lib/i18n";

interface DataSourceBadgesProps {
  dataSourceConfidence?: DataSourceConfidence;
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
}

export function DataSourceBadges({
  dataSourceConfidence,
  className,
  showLabels = true,
  size = "md",
}: DataSourceBadgesProps) {
  const { t, lang } = useLanguage();

  // If no data source info, show placeholder
  if (!dataSourceConfidence) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-muted-foreground">
                <HelpCircle className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
                {showLabels && (
                  <span className={cn("text-xs", size === "sm" && "text-[10px]")}>
                    {lang === "da" ? "Ingen datakilde" : "No data source"}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {lang === "da"
                  ? "Klik 'Kør analyse' for at indsamle data"
                  : "Click 'Run analysis' to gather data"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  const sources = [
    {
      key: "github",
      icon: GitBranch,
      label: "GitHub",
      data: dataSourceConfidence.github,
      activeColor: "text-green-500",
      inactiveColor: "text-muted-foreground",
      tooltipActive: lang === "da"
        ? `${dataSourceConfidence.github.dataPoints.repos} repos, ${dataSourceConfidence.github.dataPoints.commits} commits`
        : `${dataSourceConfidence.github.dataPoints.repos} repos, ${dataSourceConfidence.github.dataPoints.commits} commits`,
      tooltipInactive: lang === "da" ? "Ikke tilgængelig" : "Not available",
    },
    {
      key: "linkedin",
      icon: Linkedin,
      label: "LinkedIn",
      data: dataSourceConfidence.linkedin,
      activeColor: "text-blue-500",
      inactiveColor: "text-muted-foreground",
      tooltipActive: lang === "da"
        ? `Profil fundet (${Math.round(dataSourceConfidence.linkedin.confidence * 100)}% konfidens)`
        : `Profile found (${Math.round(dataSourceConfidence.linkedin.confidence * 100)}% confidence)`,
      tooltipInactive: lang === "da" ? "Tilføj LinkedIn for bedre match" : "Add LinkedIn for better matching",
    },
    {
      key: "manual",
      icon: FileText,
      label: lang === "da" ? "Manuel" : "Manual",
      data: dataSourceConfidence.manual,
      activeColor: "text-purple-500",
      inactiveColor: "text-muted-foreground",
      tooltipActive: dataSourceConfidence.manual.source
        ? `${lang === "da" ? "Kilde" : "Source"}: ${dataSourceConfidence.manual.source}`
        : lang === "da" ? "Manuelt tilføjet data" : "Manually added data",
      tooltipInactive: lang === "da" ? "Ingen manuel data" : "No manual data",
    },
  ];

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <TooltipProvider>
        {sources.map(({ key, icon: Icon, label, data, activeColor, inactiveColor, tooltipActive, tooltipInactive }) => {
          const isActive = data.available;
          const confidence = 'confidence' in data ? (data as { confidence: number }).confidence : 0;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-1 cursor-default",
                    isActive ? activeColor : inactiveColor
                  )}
                >
                  <Icon className={iconSize} />
                  {showLabels && (
                    <span className={textSize}>{label}</span>
                  )}
                  {isActive ? (
                    <CheckCircle className={cn(iconSize, "opacity-80")} />
                  ) : (
                    <AlertTriangle className={cn(iconSize, "opacity-50")} />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {isActive ? tooltipActive : tooltipInactive}
                </p>
                {isActive && confidence > 0 && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span>{lang === "da" ? "Datakvalitet" : "Data quality"}</span>
                      <span>{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full mt-0.5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          confidence > 0.7 ? "bg-green-500" : confidence > 0.4 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      {/* Overall quality indicator */}
      {dataSourceConfidence.overallQuality > 0 && (
        <Badge
          variant="outline"
          className={cn(
            textSize,
            "ml-1",
            dataSourceConfidence.overallQuality >= 70 ? "border-green-500/50 text-green-500" :
            dataSourceConfidence.overallQuality >= 40 ? "border-yellow-500/50 text-yellow-500" :
            "border-red-500/50 text-red-500"
          )}
        >
          {dataSourceConfidence.overallQuality}%
        </Badge>
      )}
    </div>
  );
}

// Compact inline version for lists
export function DataSourceIndicator({
  dataSourceConfidence,
  className,
}: {
  dataSourceConfidence?: DataSourceConfidence;
  className?: string;
}) {
  if (!dataSourceConfidence) return null;

  const { github, linkedin, manual, primarySource } = dataSourceConfidence;

  const sourceIcons = {
    github: <GitBranch className="w-3 h-3 text-green-500" />,
    linkedin: <Linkedin className="w-3 h-3 text-blue-500" />,
    manual: <FileText className="w-3 h-3 text-purple-500" />,
    mixed: null,
  };

  const activeSources = [
    github.available && "github",
    linkedin.available && "linkedin",
    manual.available && "manual",
  ].filter(Boolean);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-0.5", className)}>
            {activeSources.map((source) => (
              <span key={source as string}>{sourceIcons[source as keyof typeof sourceIcons]}</span>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Score based on: {activeSources.join(", ")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

"use client";

import { Info, Github, Linkedin } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface DataSourceBannerProps {
  hasLinkedIn: boolean;
  className?: string;
  compact?: boolean;
}

export function DataSourceBanner({
  hasLinkedIn,
  className,
  compact = false,
}: DataSourceBannerProps) {
  const { t } = useLanguage();

  const headline = hasLinkedIn
    ? t("candidate.dataSourceBannerBoth")
    : t("candidate.dataSourceBannerGithub");

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          className
        )}
      >
        <Info className="w-3 h-3 shrink-0" />
        <span>{headline}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3",
        className
      )}
    >
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-foreground">{headline}</span>
          <div className="flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5 text-muted-foreground" />
            {hasLinkedIn && (
              <Linkedin className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("candidate.dataSourceBannerNote")}
        </p>
      </div>
    </div>
  );
}

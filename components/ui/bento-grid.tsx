"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  compact?: boolean; // Mobile-friendly compact mode
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  compact?: boolean; // Reduced padding
}

export function BentoGrid({ children, className, compact = false }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4",
        // Responsive row sizing: smaller on mobile, larger on desktop
        compact
          ? "auto-rows-auto"
          : "auto-rows-[minmax(auto,_1fr)] sm:auto-rows-[minmax(120px,_1fr)] md:auto-rows-[minmax(140px,_1fr)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  compact = false,
}: BentoCardProps) {
  const colSpanClasses = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
  };

  const rowSpanClasses = {
    1: "row-span-1",
    2: "md:row-span-2", // Only apply rowSpan on desktop
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
        // Responsive padding: tighter on mobile
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5 md:p-6",
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
    >
      {children}
    </div>
  );
}

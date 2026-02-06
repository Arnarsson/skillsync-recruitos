"use client";

import { Skeleton } from "./skeleton";

interface SkeletonCardProps {
  count?: number;
  variant?: "candidate" | "kanban" | "profile";
}

export function SkeletonCard({ count = 3, variant = "candidate" }: SkeletonCardProps) {
  const cards = Array.from({ length: count }, (_, i) => i);

  if (variant === "kanban") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="space-y-2 min-h-[300px]">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="p-3 bg-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((i) => (
        <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-4 pt-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { Clock, Globe, Calendar, Zap } from "lucide-react";
import { BestTimeToReach as BestTimeData, formatTimezone } from "@/lib/timezone";
import { cn } from "@/lib/utils";

interface BestTimeToReachProps {
  data: BestTimeData;
  className?: string;
}

export function BestTimeToReach({ data, className }: BestTimeToReachProps) {
  const confidenceColors = {
    high: "text-green-400 bg-green-400/10 border-green-400/20",
    medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    low: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  };

  const confidenceLabels = {
    high: "Great overlap",
    medium: "Some overlap",
    low: "Limited overlap",
  };

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Clock className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Best Time to Reach Out</h3>
          <p className="text-xs text-zinc-500">Based on their GitHub activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Best Day */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Calendar className="w-3 h-3" />
            Best Day
          </div>
          <div className="font-semibold text-white">{data.bestDay}</div>
        </div>

        {/* Best Time (Their Local) */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Clock className="w-3 h-3" />
            Their Time
          </div>
          <div className="font-semibold text-white">{data.localTime}</div>
        </div>

        {/* Your Time */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
            <Zap className="w-3 h-3" />
            Your Time
          </div>
          <div className="font-semibold text-emerald-300">{data.yourTime}</div>
        </div>

        {/* Timezone */}
        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
            <Globe className="w-3 h-3" />
            Timezone
          </div>
          <div className="font-semibold text-white">
            {data.timezone ? formatTimezone(data.timezone) : "Unknown"}
          </div>
        </div>
      </div>

      {/* Overlap Badge */}
      <div className={cn(
        "mt-4 px-3 py-2 rounded-lg border flex items-center justify-between",
        confidenceColors[data.confidence]
      )}>
        <span className="text-sm">
          {data.overlapHours}h work overlap
          {data.overlapRange && <span className="text-xs opacity-70 ml-1">({data.overlapRange})</span>}
        </span>
        <span className="text-xs font-medium">
          {confidenceLabels[data.confidence]}
        </span>
      </div>
    </div>
  );
}

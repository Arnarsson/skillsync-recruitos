"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, RefreshCw } from "lucide-react";
import { FunnelAnalytics, calculateFunnelAnalytics, getCachedFunnelAnalytics } from "@/lib/funnelAnalytics";
import { PipelineStage } from "@/components/pipeline/PipelineKanban";
import { cn } from "@/lib/utils";

interface FunnelAnalyticsPanelProps {
  candidateStages: Record<string, PipelineStage>;
  className?: string;
}

export function FunnelAnalyticsPanel({ candidateStages, className }: FunnelAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<FunnelAnalytics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate analytics when stages change
  useEffect(() => {
    const calculated = calculateFunnelAnalytics(candidateStages);
    setAnalytics(calculated);
  }, [candidateStages]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const calculated = calculateFunnelAnalytics(candidateStages);
    setAnalytics(calculated);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!analytics || analytics.totalCandidates === 0) {
    return (
      <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-zinc-500" />
          <h3 className="font-semibold text-white">Funnel Analytics</h3>
        </div>
        <p className="text-sm text-zinc-500 text-center py-8">
          Not enough data yet. Move candidates through stages to see conversion metrics.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-white">Funnel Analytics</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded hover:bg-zinc-800 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-4 h-4 text-zinc-400", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Funnel Visualization */}
      <div className="p-4">
        <div className="space-y-3">
          {analytics.stages.map((stage, index) => {
            const widthPercent = analytics.totalCandidates > 0 
              ? Math.max(20, stage.percentage) 
              : 20;
            
            return (
              <div key={stage.stage} className="relative">
                {/* Stage Bar */}
                <div
                  className="h-12 rounded-lg flex items-center px-4 transition-all duration-300"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: `${stage.color}20`,
                    borderLeft: `3px solid ${stage.color}`,
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{stage.label}</span>
                      <span className="text-xs text-zinc-400">{stage.count}</span>
                    </div>
                    {stage.conversionFromPrevious !== null && (
                      <div className="flex items-center gap-1">
                        {stage.conversionFromPrevious >= 50 ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : stage.conversionFromPrevious >= 25 ? (
                          <TrendingDown className="w-3 h-3 text-amber-400" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        )}
                        <span className={cn(
                          "text-xs font-medium",
                          stage.conversionFromPrevious >= 50 ? "text-emerald-400" :
                          stage.conversionFromPrevious >= 25 ? "text-amber-400" :
                          "text-red-400"
                        )}>
                          {stage.conversionFromPrevious}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conversion arrow */}
                {index < analytics.stages.length - 1 && (
                  <div className="absolute -bottom-1.5 left-6 text-zinc-600">
                    ↓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <div className="text-xs text-zinc-400 mb-1">Overall Conversion</div>
            <div className={cn(
              "text-xl font-bold",
              analytics.overallConversion >= 10 ? "text-emerald-400" :
              analytics.overallConversion >= 5 ? "text-amber-400" :
              "text-red-400"
            )}>
              {analytics.overallConversion}%
            </div>
            <div className="text-xs text-zinc-500">Sourced → Offer</div>
          </div>

          {analytics.bottleneck && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-400 mb-1">Bottleneck</div>
              <div className="text-lg font-bold text-amber-300">
                {analytics.stages.find(s => s.stage === analytics.bottleneck)?.label}
              </div>
              <div className="text-xs text-amber-400/70">Lowest conversion rate</div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <p className="text-xs text-zinc-500 mt-4 text-center">
          Updated {new Date(analytics.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

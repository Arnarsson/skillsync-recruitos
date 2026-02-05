"use client";

import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Minus, Info, ChevronDown, ChevronUp } from "lucide-react";
import { estimateSalary, formatSalaryRange, SalaryEstimate } from "@/lib/salaryEstimator";
import { cn } from "@/lib/utils";

interface SalaryEstimatorPanelProps {
  location: string | null;
  yearsExperience: number;
  skills: string[];
  currentRole?: string;
  className?: string;
}

export function SalaryEstimatorPanel({
  location,
  yearsExperience,
  skills,
  currentRole,
  className,
}: SalaryEstimatorPanelProps) {
  const [showFactors, setShowFactors] = useState(false);

  const estimate = useMemo(() => {
    return estimateSalary(location, yearsExperience, skills, currentRole);
  }, [location, yearsExperience, skills, currentRole]);

  const confidenceColors = {
    high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    low: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  };

  const marketPositionConfig = {
    below: { label: "Below Market", icon: TrendingDown, color: "text-red-400" },
    competitive: { label: "Competitive", icon: Minus, color: "text-emerald-400" },
    premium: { label: "Premium", icon: TrendingUp, color: "text-purple-400" },
  };

  const position = marketPositionConfig[estimate.marketPosition];

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Salary Estimate</h3>
            <p className="text-xs text-zinc-500">Based on location & experience</p>
          </div>
        </div>
      </div>

      {/* Main Estimate */}
      <div className="p-4">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white mb-1">
            {formatSalaryRange(estimate)}
          </div>
          <div className="text-sm text-zinc-400">
            {estimate.currency} / year
          </div>
        </div>

        {/* Market Position & Confidence */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
            <div className="text-xs text-zinc-400 mb-1">Market Position</div>
            <div className={cn("flex items-center gap-1.5 font-medium", position.color)}>
              <position.icon className="w-4 h-4" />
              {position.label}
            </div>
          </div>
          <div className={cn("p-3 rounded-lg border", confidenceColors[estimate.confidence])}>
            <div className="text-xs opacity-70 mb-1">Confidence</div>
            <div className="font-medium capitalize">{estimate.confidence}</div>
          </div>
        </div>

        {/* Factors Toggle */}
        <button
          onClick={() => setShowFactors(!showFactors)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors text-sm"
        >
          <span className="flex items-center gap-2 text-zinc-400">
            <Info className="w-4 h-4" />
            {estimate.factors.length} factors considered
          </span>
          {showFactors ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {/* Factors List */}
        {showFactors && (
          <div className="mt-3 space-y-2">
            {estimate.factors.map((factor, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-2 rounded-lg bg-zinc-800/30"
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  factor.impact === 'positive' ? "bg-emerald-500/20" :
                  factor.impact === 'negative' ? "bg-red-500/20" :
                  "bg-zinc-500/20"
                )}>
                  {factor.impact === 'positive' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                  {factor.impact === 'negative' && <TrendingDown className="w-3 h-3 text-red-400" />}
                  {factor.impact === 'neutral' && <Minus className="w-3 h-3 text-zinc-400" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{factor.name}</div>
                  <div className="text-xs text-zinc-500">{factor.reason}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Note */}
        <p className="text-xs text-zinc-500 mt-4 text-center">
          {estimate.dataNote}
        </p>
      </div>
    </div>
  );
}

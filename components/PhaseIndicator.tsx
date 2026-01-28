"use client";

import { Search, List, Microscope, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PhaseIndicatorProps {
  currentPhase: 1 | 2 | 3 | 4;
  className?: string;
}

const PHASES = [
  { 
    id: 1, 
    label: "SØGNING", 
    labelEn: "SEARCH",
    description: "Define skills + requirements", 
    icon: Search, 
    path: "/search",
    color: "teal",
    requiresCompletion: false
  },
  { 
    id: 2, 
    label: "LISTE", 
    labelEn: "LIST",
    description: "See results → Select candidates", 
    icon: List, 
    path: "/pipeline",
    color: "teal",
    requiresCompletion: true
  },
  { 
    id: 3, 
    label: "ANALYSE", 
    labelEn: "ANALYZE",
    description: "Deep dive on selections", 
    icon: Microscope, 
    path: "/analyse",
    color: "teal",
    requiresCompletion: true
  },
  { 
    id: 4, 
    label: "HANDLING", 
    labelEn: "OUTREACH",
    description: "Generate messages", 
    icon: MessageSquare, 
    path: "/shortlist",
    color: "teal",
    requiresCompletion: true
  },
] as const;

const PHASE_COLORS = {
  teal: {
    bg: "bg-primary",
    text: "text-primary",
    ring: "ring-primary/20",
    border: "border-primary",
  },
};

export function PhaseIndicator({ currentPhase, className = "" }: PhaseIndicatorProps) {
  // Gated progression: can only access completed phases or current phase
  const canAccessPhase = (phaseId: number) => {
    return phaseId <= currentPhase;
  };

  return (
    <div className={cn("w-full mb-6", className)}>
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {PHASES.map((phase, index) => {
          const isCompleted = phase.id < currentPhase;
          const isCurrent = phase.id === currentPhase;
          const isFuture = phase.id > currentPhase;
          const isClickable = canAccessPhase(phase.id);
          const PhaseIcon = phase.icon;
          const colors = PHASE_COLORS[phase.color];

          const stepContent = (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative",
                  isCompleted && "bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400",
                  isCurrent && "bg-primary text-white ring-4 ring-primary/20",
                  isFuture && "bg-muted/30 opacity-40 cursor-not-allowed text-muted-foreground",
                  isClickable && !isFuture && "cursor-pointer hover:scale-105"
                )}
                title={isFuture ? "Complete previous stages first" : ""}
              >
                <PhaseIcon className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {phase.labelEn}
                  </span>
                  <span className="text-[10px] opacity-90">
                    {phase.description}
                  </span>
                </div>
                {/* Completed checkmark */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Connector arrow */}
              {index < PHASES.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 transition-all",
                  phase.id < currentPhase ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          );

          return (
            <div key={phase.id}>
              {isClickable && !isFuture ? (
                <Link href={phase.path} className="transition-transform">
                  {stepContent}
                </Link>
              ) : (
                stepContent
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact indicator */}
      <div className="md:hidden flex items-center justify-between p-3 rounded-lg bg-card border">
        <div className="flex items-center gap-2">
          {PHASES[currentPhase - 1] && (
            <>
              {(() => {
                const PhaseIcon = PHASES[currentPhase - 1].icon;
                return (
                  <>
                    <div className="p-2 rounded-lg bg-primary">
                      <PhaseIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-wider">
                        {PHASES[currentPhase - 1].label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Phase {currentPhase} of 4
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {PHASES.map((phase) => (
            <div
              key={phase.id}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                phase.id <= currentPhase ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhaseIndicator;

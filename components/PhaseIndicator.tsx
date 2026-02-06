"use client";

import { Search, ListFilter, Microscope, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePhase } from "@/lib/phaseContext";

interface PhaseIndicatorProps {
  /** Override current phase (optional - uses context if not provided) */
  currentPhase?: 1 | 2 | 3 | 4;
  className?: string;
}

const PHASES = [
  { 
    id: 1, 
    label: "SEARCH", 
    description: "Find candidates", 
    icon: Search, 
    path: "/search",
    color: "blue"
  },
  { 
    id: 2, 
    label: "SHORTLIST", 
    description: "Review & compare", 
    icon: ListFilter, 
    path: "/pipeline",
    color: "purple"
  },
  { 
    id: 3, 
    label: "PROFILE", 
    description: "Deep analysis", 
    icon: Microscope, 
    path: "/profile",
    color: "green"
  },
  { 
    id: 4, 
    label: "OUTREACH", 
    description: "Contact candidates", 
    icon: Mail, 
    path: "/shortlist",
    color: "orange"
  },
] as const;

const PHASE_COLORS = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-500",
    ring: "ring-blue-500/20",
    border: "border-blue-500",
  },
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-500",
    ring: "ring-purple-500/20",
    border: "border-purple-500",
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-500",
    ring: "ring-green-500/20",
    border: "border-green-500",
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-500",
    ring: "ring-orange-500/20",
    border: "border-orange-500",
  },
};

export function PhaseIndicator({ currentPhase: propPhase, className = "" }: PhaseIndicatorProps) {
  const { currentPhase: contextPhase, canAccessPhase } = usePhase();
  
  // Use prop if provided, otherwise use context
  const currentPhase = propPhase ?? contextPhase;
  
  return (
    <div className={cn("w-full mb-6", className)}>
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center justify-center gap-2">
        {PHASES.map((phase, index) => {
          const isCompleted = phase.id < currentPhase;
          const isCurrent = phase.id === currentPhase;
          const isFuture = phase.id > currentPhase;
          // Use context's canAccessPhase for proper access control
          const isClickable = canAccessPhase(phase.id as 1 | 2 | 3 | 4);
          const PhaseIcon = phase.icon;
          const colors = PHASE_COLORS[phase.color];

          const stepContent = (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                  isCompleted && "bg-muted/50 opacity-60",
                  isCurrent && `${colors.bg} text-white ring-4 ${colors.ring}`,
                  isFuture && "bg-muted/30 opacity-40",
                  isClickable && "cursor-pointer hover:scale-105"
                )}
              >
                <PhaseIcon className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {phase.label}
                  </span>
                  <span className="text-[10px] opacity-90">
                    {phase.description}
                  </span>
                </div>
              </div>
              
              {/* Connector arrow */}
              {index < PHASES.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 transition-all",
                  phase.id < currentPhase ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );

          return (
            <div key={phase.id}>
              {isClickable ? (
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
                const colors = PHASE_COLORS[PHASES[currentPhase - 1].color];
                return (
                  <>
                    <div className={cn("p-2 rounded-lg", colors.bg)}>
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

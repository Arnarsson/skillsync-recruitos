"use client";

import { Briefcase, Sliders, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { step: 1, label: "Define Role", icon: Briefcase },
  { step: 2, label: "Skills Rubric", icon: Sliders },
  { step: 3, label: "Candidates", icon: Users },
];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      {/* Desktop: Horizontal phase pills */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {STEPS.map((s, idx) => {
          const isCompleted = s.step < currentStep;
          const isActive = s.step === currentStep;
          const isFuture = s.step > currentStep;
          const StepIcon = s.icon;

          return (
            <div key={s.step} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative",
                  isCompleted &&
                    "bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400",
                  isActive &&
                    "bg-primary text-white ring-4 ring-primary/20",
                  isFuture &&
                    "bg-muted/30 opacity-40 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {s.label}
                </span>
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 transition-all",
                    s.step < currentStep ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact indicator */}
      <div className="sm:hidden flex items-center justify-between p-3 rounded-lg bg-card border">
        <div className="flex items-center gap-2">
          {(() => {
            const current = STEPS[currentStep - 1];
            if (!current) return null;
            const StepIcon = current.icon;
            return (
              <>
                <div className="p-2 rounded-lg bg-primary">
                  <StepIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider">
                    {current.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Step {currentStep} of 3
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <div className="flex gap-1.5">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                s.step <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { CheckCircle, FileText, ListChecks, Users, Microscope, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WorkflowStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

<<<<<<< HEAD
const STEPS = [
  { id: 1, label: "Job Intake", description: "Beskriv hvad du søger", icon: FileText, path: "/intake" },
  { id: 2, label: "Skills Review", description: "Prioritér kompetencer", icon: ListChecks, path: "/skills-review" },
  { id: 3, label: "Candidates", description: "Gennemse matches", icon: Users, path: "/pipeline" },
  { id: 4, label: "Deep Profile", description: "Personlighed + skills", icon: Microscope, path: "/profile" },
  { id: 5, label: "Outreach Pack", description: "E-mail + guide", icon: Mail, path: "/outreach" },
=======
/**
 * Phase definitions for the recruiting workflow.
 * Phase 1: Search (Search & Filter) - Steps 1-2
 * Phase 2: Select (Screening) - Step 3
 * Phase 3: Analyze (Deep Dive) - Step 4
 * Phase 4: Contact (Outreach) - Step 5
 */
const PHASES = [
  {
    id: 1,
    label: "Search & Define",
    shortLabel: "Search",
    color: "blue",
    bgClass: "bg-blue-500",
    bgLightClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    ringClass: "ring-blue-500/20",
    gradientFrom: "from-blue-500",
    gradientTo: "to-blue-400",
    steps: [1, 2],
  },
  {
    id: 2,
    label: "Select & Screen",
    shortLabel: "Select",
    color: "purple",
    bgClass: "bg-purple-500",
    bgLightClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/30",
    ringClass: "ring-purple-500/20",
    gradientFrom: "from-purple-500",
    gradientTo: "to-purple-400",
    steps: [3],
  },
  {
    id: 3,
    label: "AI Analysis",
    shortLabel: "Analyze",
    color: "amber",
    bgClass: "bg-amber-500",
    bgLightClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/30",
    ringClass: "ring-amber-500/20",
    gradientFrom: "from-amber-500",
    gradientTo: "to-amber-400",
    steps: [4],
  },
  {
    id: 4,
    label: "Contact & Hire",
    shortLabel: "Contact",
    color: "emerald",
    bgClass: "bg-emerald-500",
    bgLightClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    ringClass: "ring-emerald-500/20",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-emerald-400",
    steps: [5],
  },
] as const;

const STEPS = [
  { id: 1, label: "Job Intake", icon: FileText, path: "/intake", phaseId: 1 },
  { id: 2, label: "Candidates", icon: Users, path: "/search", phaseId: 1 },
  { id: 3, label: "Skills Review", icon: ListChecks, path: "/skills-review", phaseId: 2 },
  { id: 4, label: "Deep Dive", icon: Microscope, path: "/shortlist", phaseId: 3 },
  { id: 5, label: "Outreach", icon: Mail, path: "/pipeline", phaseId: 4 },
>>>>>>> 57816c0 (feat(7-167): implement 4-phase stepper workflow)
] as const;

export function WorkflowStepper({ currentStep, className = "" }: WorkflowStepperProps) {
  return (
    <div className={cn("w-full bg-card border border-border rounded-lg p-4 sm:p-6 shadow-sm", className)}>
      <div className="text-center mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Din Rekrutteringsproces</h2>
        <p className="text-xs text-muted-foreground mt-1">Trin {currentStep} af 5</p>
      </div>
      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isFuture = step.id > currentStep;
          const isClickable = isCompleted || isCurrent;
          const StepIcon = step.icon;

          const stepContent = (
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isFuture && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:scale-110 hover:shadow-lg"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <div className="text-center">
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap block",
                    isCompleted && "text-green-600",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap block mt-0.5">
                  {step.description}
                </span>
              </div>
            </div>
          );

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle and label */}
              {isClickable ? (
                <Link href={step.path} className="transition-transform">
                  {stepContent}
                </Link>
              ) : (
                stepContent
              )}

              {/* Connector line (not after last step) */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3",
                    step.id < currentStep ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical/stacked layout */}
      <div className="sm:hidden space-y-3">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isFuture = step.id > currentStep;
          const isClickable = isCompleted || isCurrent;
          const StepIcon = step.icon;

          const stepContent = (
            <div className="flex items-start gap-3 w-full">
              {/* Step indicator column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                    isFuture && "bg-muted text-muted-foreground",
                    isClickable && "cursor-pointer hover:scale-110"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                {/* Vertical connector (not after last step) */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-6 mt-1",
                      step.id < currentStep ? "bg-green-500" : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Step label */}
              <div className="pt-1">
                <span
                  className={cn(
                    "text-sm font-medium block",
                    isCompleted && "text-green-600",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  {isCurrent ? "Du er her" : step.description}
                </span>
              </div>
            </div>
          );

          return (
            <div key={step.id}>
              {isClickable ? (
                <Link href={step.path}>
                  {stepContent}
                </Link>
              ) : (
                stepContent
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorkflowStepper;

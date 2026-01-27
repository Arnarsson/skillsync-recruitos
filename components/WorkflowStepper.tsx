"use client";

import { CheckCircle, FileText, ListChecks, Users, Microscope, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface WorkflowStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

const STEPS = [
  { id: 1, label: "Job Intake", icon: FileText, path: "/intake" },
  { id: 2, label: "Skills Review", icon: ListChecks, path: "/skills-review" },
  { id: 3, label: "Candidates", icon: Users, path: "/search" },
  { id: 4, label: "Deep Dive", icon: Microscope, path: "/shortlist" },
  { id: 5, label: "Outreach", icon: Mail, path: "/pipeline" },
] as const;

export function WorkflowStepper({ currentStep, className = "" }: WorkflowStepperProps) {
  const router = useRouter();

  const handleStepClick = (step: (typeof STEPS)[number]) => {
    // Allow clicking completed steps and current step (for refresh)
    if (step.id <= currentStep) {
      router.push(step.path);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isFuture = step.id > currentStep;
          const isClickable = step.id <= currentStep;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle and label */}
              <button
                onClick={() => handleStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 group",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default"
                )}
                title={isClickable ? `Gå til ${step.label}` : step.label}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted && "bg-green-500 text-white group-hover:bg-green-400",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap transition-colors",
                    isCompleted && "text-green-600 group-hover:text-green-400",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>

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
          const isClickable = step.id <= currentStep;
          const StepIcon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step)}
              disabled={!isClickable}
              className={cn(
                "flex items-start gap-3 w-full text-left group",
                isClickable && "cursor-pointer",
                !isClickable && "cursor-default"
              )}
            >
              {/* Step indicator column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                    isCompleted && "bg-green-500 text-white group-hover:bg-green-400",
                    isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                    isFuture && "bg-muted text-muted-foreground"
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
                    "text-sm font-medium transition-colors",
                    isCompleted && "text-green-600 group-hover:text-green-400",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">Nuværende trin</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WorkflowStepper;

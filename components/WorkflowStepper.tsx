"use client";

import { CheckCircle, FileText, ListChecks, Users, Microscope, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WorkflowStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

const STEPS = [
  { id: 1, label: "Job Intake", icon: FileText, path: "/intake" },
  { id: 2, label: "Skills Review", icon: ListChecks, path: "/skills-review" },
  { id: 3, label: "Candidates", icon: Users, path: "/pipeline" },
  { id: 4, label: "Deep Dive", icon: Microscope, path: "/profile" },
  { id: 5, label: "Outreach", icon: Mail, path: "/outreach" },
] as const;

export function WorkflowStepper({ currentStep, className = "" }: WorkflowStepperProps) {
  return (
    <div className={cn("w-full", className)}>
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
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isCompleted && "text-green-600",
                  isCurrent && "text-primary",
                  isFuture && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
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
                    "text-sm font-medium",
                    isCompleted && "text-green-600",
                    isCurrent && "text-primary",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">Current step</p>
                )}
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

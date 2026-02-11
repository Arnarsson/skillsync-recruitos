"use client";

import { CheckCircle, FileText, ListChecks, Users, Microscope, Mail, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

interface WorkflowStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

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
    labelKey: "workflow.phases.searchDefine.label",
    shortLabelKey: "workflow.phases.searchDefine.short",
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
    labelKey: "workflow.phases.selectScreen.label",
    shortLabelKey: "workflow.phases.selectScreen.short",
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
    labelKey: "workflow.phases.aiAnalysis.label",
    shortLabelKey: "workflow.phases.aiAnalysis.short",
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
    labelKey: "workflow.phases.contactHire.label",
    shortLabelKey: "workflow.phases.contactHire.short",
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
  { id: 1, labelKey: "workflow.steps.jobIntake", icon: FileText, path: "/intake", phaseId: 1 },
  { id: 2, labelKey: "workflow.steps.candidates", icon: Users, path: "/search", phaseId: 1 },
  { id: 3, labelKey: "workflow.steps.skillsReview", icon: ListChecks, path: "/skills-review", phaseId: 2 },
  { id: 4, labelKey: "workflow.steps.deepDive", icon: Microscope, path: "/shortlist", phaseId: 3 },
  { id: 5, labelKey: "workflow.steps.outreach", icon: Mail, path: "/pipeline", phaseId: 4 },
] as const;

function getPhaseForStep(stepId: number) {
  return PHASES.find((p) => (p.steps as readonly number[]).includes(stepId))!;
}

function getPhaseProgress(phaseId: number, currentStep: number) {
  const phase = PHASES.find((p) => p.id === phaseId)!;
  const completedInPhase = phase.steps.filter((s) => s < currentStep).length;
  const currentInPhase = (phase.steps as readonly number[]).includes(currentStep) ? 1 : 0;
  const total = phase.steps.length;

  if (completedInPhase === total) return 100;
  if (completedInPhase === 0 && currentInPhase === 0) return 0;
  // If current step is in this phase, show partial progress
  return Math.round(((completedInPhase + currentInPhase * 0.5) / total) * 100);
}

export function WorkflowStepper({ currentStep, className = "" }: WorkflowStepperProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const currentPhase = getPhaseForStep(currentStep);

  const handleStepClick = (step: (typeof STEPS)[number]) => {
    if (step.id <= currentStep) {
      router.push(step.path);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Phase Indicator Bar */}
      <div className="mb-6">
        {/* Phase breadcrumb */}
        <div className="flex items-center gap-2 mb-3">
          {PHASES.map((phase, idx) => {
            const isActive = phase.id === currentPhase.id;
            const isCompleted = phase.steps.every((s) => s < currentStep);
            const isFuture = phase.steps.every((s) => s > currentStep);
            const progress = getPhaseProgress(phase.id, currentStep);

            return (
              <div key={phase.id} className="flex items-center gap-2">
                {idx > 0 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                )}
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    isActive && `${phase.bgLightClass} ${phase.textClass} ${phase.borderClass} border`,
                    isCompleted && "bg-green-500/10 text-green-400 border border-green-500/30",
                    isFuture && "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {isCompleted && <CheckCircle className="w-3 h-3" />}
                  <span className="hidden sm:inline">{t(phase.labelKey)}</span>
                  <span className="sm:hidden">{t(phase.shortLabelKey)}</span>
                  {isActive && (
                    <span className={cn("text-[10px] opacity-70")}>{progress}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase progress bar */}
        <div className="flex gap-1 h-1 rounded-full overflow-hidden">
          {PHASES.map((phase) => {
            const progress = getPhaseProgress(phase.id, currentStep);
            const isActive = phase.id === currentPhase.id;

            return (
              <div
                key={phase.id}
                className="flex-1 bg-muted/30 rounded-full overflow-hidden"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    phase.bgClass,
                    isActive && "animate-pulse"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Horizontal layout with phase grouping */}
      <div className="hidden sm:flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isFuture = step.id > currentStep;
          const isClickable = step.id <= currentStep;
          const phase = getPhaseForStep(step.id);
          const StepIcon = step.icon;

          // Check if we're crossing a phase boundary
          const prevStep = index > 0 ? STEPS[index - 1] : null;
          const crossingPhase = prevStep && prevStep.phaseId !== step.phaseId;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Phase divider */}
              {crossingPhase && (
                <div className="w-px h-10 bg-border mx-2 shrink-0" />
              )}

              {/* Step circle and label */}
              <button
                onClick={() => handleStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 group relative",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default"
                )}
                title={
                  isClickable
                    ? `${t("workflow.goTo")} ${t(step.labelKey)}`
                    : t(step.labelKey)
                }
              >
                {/* Phase color indicator dot */}
                {isCurrent && (
                  <div className={cn(
                    "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full",
                    phase.bgClass,
                    "animate-pulse"
                  )} />
                )}

                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted && "bg-green-500 text-white group-hover:bg-green-400",
                    isCurrent && cn(
                      phase.bgClass,
                      "text-white",
                      "ring-4",
                      phase.ringClass
                    ),
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
                    isCurrent && phase.textClass,
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && !crossingPhase && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 transition-colors",
                    step.id < currentStep ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
              {index < STEPS.length - 1 && crossingPhase && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 transition-colors",
                    step.id < currentStep ? "bg-green-500" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical layout with phase headers */}
      <div className="sm:hidden space-y-1">
        {PHASES.map((phase) => {
          const phaseSteps = STEPS.filter((s) => s.phaseId === phase.id);
          const isPhaseActive = phase.id === currentPhase.id;
          const isPhaseCompleted = phase.steps.every((s) => s < currentStep);

          return (
            <div key={phase.id} className="mb-3">
              {/* Phase header */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 mb-2 rounded-md text-xs font-semibold uppercase tracking-wider",
                isPhaseActive && `${phase.bgLightClass} ${phase.textClass}`,
                isPhaseCompleted && "bg-green-500/10 text-green-400",
                !isPhaseActive && !isPhaseCompleted && "text-muted-foreground"
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isPhaseActive && phase.bgClass,
                  isPhaseCompleted && "bg-green-500",
                  !isPhaseActive && !isPhaseCompleted && "bg-muted-foreground"
                )} />
                {t(phase.shortLabelKey)}
              </div>

              {phaseSteps.map((step, index) => {
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
                      "flex items-start gap-3 w-full text-left group pl-3",
                      isClickable && "cursor-pointer",
                      !isClickable && "cursor-default"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                          isCompleted && "bg-green-500 text-white group-hover:bg-green-400",
                          isCurrent && cn(phase.bgClass, "text-white ring-2", phase.ringClass),
                          isFuture && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      {index < phaseSteps.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 h-6 mt-1",
                            step.id < currentStep ? "bg-green-500" : "bg-muted"
                          )}
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isCompleted && "text-green-600 group-hover:text-green-400",
                          isCurrent && phase.textClass,
                          isFuture && "text-muted-foreground"
                        )}
                      >
                        {t(step.labelKey)}
                      </span>
                      {isCurrent && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t("workflow.currentStep")}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorkflowStepper;

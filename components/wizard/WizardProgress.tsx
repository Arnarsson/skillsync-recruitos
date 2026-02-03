import { cn } from "@/lib/utils";

const STEPS = [
  { step: 1, label: "Define Role" },
  { step: 2, label: "Skills Rubric" },
  { step: 3, label: "Candidates" },
];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, idx) => {
          const isActive = s.step === currentStep;
          const isDone = s.step < currentStep;
          return (
            <div key={s.step} className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                    isDone && "bg-primary text-primary-foreground border-primary",
                    isActive && !isDone && "border-primary text-primary",
                    !isActive && !isDone && "border-border text-muted-foreground"
                  )}
                >
                  {s.step}
                </div>
                <div className={cn("text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="mt-3 h-px w-full bg-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

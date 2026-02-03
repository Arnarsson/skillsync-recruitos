import { ReactNode } from "react";

export function WizardStep({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Step {step}</div>
        <h2 className="text-xl sm:text-2xl font-semibold mt-1">{title}</h2>
      </div>
      {children}
    </div>
  );
}

import type { PropsWithChildren } from "react";

export function WorkPatternDisclaimer({ children }: PropsWithChildren) {
  return (
    <p className="text-xs text-muted-foreground leading-relaxed">
      {children}
    </p>
  );
}

export default WorkPatternDisclaimer;

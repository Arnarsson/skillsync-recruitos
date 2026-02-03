import { Coins } from "lucide-react";

export function CreditEstimate() {
  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-start gap-2">
      <Coins className="w-4 h-4 text-muted-foreground mt-0.5" />
      <div>
        <div className="text-sm font-medium">Credit estimate</div>
        <p className="text-xs text-muted-foreground">
          Your first shortlist is generated from public GitHub data and is free to preview.
        </p>
      </div>
    </div>
  );
}

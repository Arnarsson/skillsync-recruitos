import { CheckCircle2 } from "lucide-react";

export function EvidencePreview({ label }: { label: string }) {
  const items = [
    "Recent repositories and contribution activity",
    "Language & framework usage across repos",
    "Signals like stars, followers, and consistency",
  ];

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="text-sm font-medium mb-3">{label}</div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { SkillChips } from "@/components/wizard/SkillChips";

export function SkillCategory({
  title,
  skills,
  onChange,
  editable = true,
}: {
  title: string;
  skills?: string[];
  onChange: (next: string[]) => void;
  editable?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="text-sm font-semibold mb-3">{title}</div>
      {editable ? (
        <SkillChips
          label=""
          value={skills || []}
          onChange={onChange}
          placeholder="Add skills…"
        />
      ) : (
        <div className="text-sm text-muted-foreground">
          {(skills || []).length ? (skills || []).join(", ") : "—"}
        </div>
      )}
    </div>
  );
}

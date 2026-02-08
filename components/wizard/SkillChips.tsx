"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function normalizeSkill(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^#+\s*/, "")
    .replace(/[·•\-]+/g, "")
    .trim();
}

export function SkillChips({
  label,
  value,
  onChange,
  placeholder = "Type a skill and press Enter",
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const skills = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    value.forEach((s) => {
      const n = normalizeSkill(s);
      if (!n) return;
      const key = n.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(n);
    });
    return out;
  }, [value]);

  const addFromDraft = () => {
    const text = draft.trim();
    if (!text) return;

    const parts = text
      .split(/[,\n]/g)
      .map((p) => normalizeSkill(p))
      .filter(Boolean);

    if (parts.length === 0) return;
    onChange([...skills, ...parts]);
    setDraft("");
  };

  const remove = (skill: string) => {
    const key = skill.toLowerCase();
    onChange(skills.filter((s) => s.toLowerCase() !== key));
  };

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium">{label}</div> : null}
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <Badge key={s} variant="secondary" className="gap-1">
            {s}
            <button
              type="button"
              onClick={() => remove(s)}
              className="ml-1 rounded-sm opacity-70 hover:opacity-100"
              aria-label={`Remove ${s}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="group relative flex-1">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Input
            className="relative"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromDraft();
              }
            }}
            placeholder={placeholder}
          />
        </div>
        <Button type="button" variant="outline" onClick={addFromDraft}>
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: separate multiple skills with commas.
      </p>
    </div>
  );
}

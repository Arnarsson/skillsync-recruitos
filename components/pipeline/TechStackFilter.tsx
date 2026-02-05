"use client";

import { useState } from "react";
import { Code2, X, Plus, Check, AlertCircle } from "lucide-react";
import { TechStackFilter as TechStackFilterType } from "@/lib/techStackMatching";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TechStackFilterProps {
  filter: TechStackFilterType;
  onChange: (filter: TechStackFilterType) => void;
  className?: string;
}

const COMMON_SKILLS = [
  // Languages
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C#",
  // Frontend
  "React", "Vue", "Angular", "Next.js", "Svelte",
  // Backend
  "Node.js", "Express", "Django", "FastAPI", "Spring",
  // Databases
  "PostgreSQL", "MongoDB", "Redis", "MySQL", "DynamoDB",
  // Cloud/DevOps
  "AWS", "GCP", "Azure", "Docker", "Kubernetes",
  // Other
  "GraphQL", "REST", "Microservices", "CI/CD",
];

export function TechStackFilter({ filter, onChange, className }: TechStackFilterProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<"required" | "preferred" | "exclude">("required");

  const handleAddSkill = (skill: string, type: "required" | "preferred" | "exclude") => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    
    // Check if already in any list
    if (filter.required.includes(trimmed) || 
        filter.preferred.includes(trimmed) || 
        filter.exclude.includes(trimmed)) {
      return;
    }

    const newFilter = { ...filter };
    newFilter[type] = [...newFilter[type], trimmed];
    onChange(newFilter);
    setInputValue("");
  };

  const handleRemoveSkill = (skill: string, type: "required" | "preferred" | "exclude") => {
    const newFilter = { ...filter };
    newFilter[type] = newFilter[type].filter(s => s !== skill);
    onChange(newFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill(inputValue, activeTab);
    }
  };

  const totalActive = filter.required.length + filter.preferred.length + filter.exclude.length;

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50", className)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Tech Stack Filter</h3>
            {totalActive > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalActive} active
              </Badge>
            )}
          </div>
          {totalActive > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ required: [], preferred: [], exclude: [] })}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {(["required", "preferred", "exclude"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors relative",
              activeTab === tab
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab === "required" && "Must Have"}
            {tab === "preferred" && "Nice to Have"}
            {tab === "exclude" && "Exclude"}
            {filter[tab].length > 0 && (
              <span className="ml-1 text-xs text-zinc-400">({filter[tab].length})</span>
            )}
            {activeTab === tab && (
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5",
                tab === "required" && "bg-red-500",
                tab === "preferred" && "bg-amber-500",
                tab === "exclude" && "bg-zinc-500"
              )} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Input */}
        <div className="flex gap-2 mb-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Add ${activeTab} skill...`}
            className="flex-1"
          />
          <Button
            onClick={() => handleAddSkill(inputValue, activeTab)}
            disabled={!inputValue.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Skills for this tab */}
        {filter[activeTab].length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filter[activeTab].map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className={cn(
                  "flex items-center gap-1.5 pr-1.5",
                  activeTab === "required" && "bg-red-500/20 text-red-400 border-red-500/30",
                  activeTab === "preferred" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  activeTab === "exclude" && "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                )}
              >
                {activeTab === "required" && <Check className="w-3 h-3" />}
                {activeTab === "exclude" && <AlertCircle className="w-3 h-3" />}
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill, activeTab)}
                  className="ml-1 p-0.5 rounded hover:bg-black/20"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Add Common Skills */}
        <div>
          <p className="text-xs text-zinc-500 mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SKILLS.filter(
              s => !filter.required.includes(s) && 
                   !filter.preferred.includes(s) && 
                   !filter.exclude.includes(s)
            ).slice(0, 12).map((skill) => (
              <button
                key={skill}
                onClick={() => handleAddSkill(skill, activeTab)}
                className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

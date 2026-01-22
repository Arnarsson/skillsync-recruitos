"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Common tech skills for autocomplete suggestions
const SKILL_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Python",
  "Django",
  "FastAPI",
  "Java",
  "Spring Boot",
  "Kotlin",
  "Go",
  "Rust",
  "C++",
  "C#",
  ".NET",
  "Ruby",
  "Ruby on Rails",
  "PHP",
  "Laravel",
  "Swift",
  "SwiftUI",
  "Kubernetes",
  "Docker",
  "AWS",
  "Azure",
  "GCP",
  "Terraform",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST API",
  "Machine Learning",
  "TensorFlow",
  "PyTorch",
  "Data Science",
  "DevOps",
  "CI/CD",
  "Linux",
  "Git",
  "Agile",
  "Microservices",
];

interface SkillsComboboxProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  textQuery: string;
  onTextQueryChange: (query: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
}

export function SkillsCombobox({
  selectedSkills,
  onSkillsChange,
  textQuery,
  onTextQueryChange,
  onSearch,
  placeholder = "Search for skills, roles, locations...",
  className,
}: SkillsComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(textQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    (skill) =>
      skill.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedSkills.includes(skill)
  ).slice(0, 8);

  const handleSelect = useCallback(
    (skill: string) => {
      if (!selectedSkills.includes(skill)) {
        onSkillsChange([...selectedSkills, skill]);
      }
      setInputValue("");
      setOpen(false);
      inputRef.current?.focus();
    },
    [selectedSkills, onSkillsChange]
  );

  const handleRemoveSkill = useCallback(
    (skillToRemove: string) => {
      onSkillsChange(selectedSkills.filter((s) => s !== skillToRemove));
    },
    [selectedSkills, onSkillsChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !inputValue && selectedSkills.length > 0) {
        // Remove last skill when backspace is pressed on empty input
        handleRemoveSkill(selectedSkills[selectedSkills.length - 1]);
      } else if (e.key === "Enter") {
        if (filteredSuggestions.length > 0 && open) {
          // Select first suggestion
          e.preventDefault();
          handleSelect(filteredSuggestions[0]);
        } else if (inputValue.trim()) {
          // Add custom skill or trigger search
          e.preventDefault();
          const matchingSuggestion = SKILL_SUGGESTIONS.find(
            (s) => s.toLowerCase() === inputValue.toLowerCase()
          );
          if (matchingSuggestion && !selectedSkills.includes(matchingSuggestion)) {
            handleSelect(matchingSuggestion);
          } else if (!selectedSkills.some((s) => s.toLowerCase() === inputValue.toLowerCase())) {
            // If it's a new custom skill, add it
            // Or just pass the text query to search
            onTextQueryChange(inputValue);
            onSearch();
          }
        } else {
          // Empty input, trigger search with existing skills
          onSearch();
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [inputValue, selectedSkills, filteredSuggestions, open, handleSelect, handleRemoveSkill, onTextQueryChange, onSearch]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      onTextQueryChange(value);
      setOpen(value.length > 0 && filteredSuggestions.length > 0);
    },
    [onTextQueryChange, filteredSuggestions.length]
  );

  return (
    <div className={cn("relative", className)}>
      <Command className="overflow-visible bg-transparent" shouldFilter={false}>
        <div className="flex items-center gap-2 border rounded-lg bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />

          {/* Selected Skills Pills */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {selectedSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="gap-1 px-2 py-0.5 text-xs"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}

            {/* Input */}
            <CommandInput
              ref={inputRef}
              value={inputValue}
              onValueChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(inputValue.length > 0 && filteredSuggestions.length > 0)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder={selectedSkills.length === 0 ? placeholder : "Add more..."}
              className="flex-1 min-w-[120px] border-0 outline-none focus:ring-0 p-0 text-sm bg-transparent placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {open && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1">
            <CommandList className="bg-popover border rounded-lg shadow-lg max-h-64 overflow-auto">
              <CommandGroup heading="Suggestions">
                {filteredSuggestions.map((skill) => (
                  <CommandItem
                    key={skill}
                    value={skill}
                    onSelect={() => handleSelect(skill)}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Badge variant="outline" className="mr-2 text-xs">
                      {skill}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      Click or press Enter to add
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}

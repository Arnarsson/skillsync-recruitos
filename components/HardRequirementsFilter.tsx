"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Clock, 
  Languages, 
  Plus, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HardRequirement, HardRequirementsConfig } from "@/types";

interface HardRequirementsFilterProps {
  initialRequirements?: HardRequirementsConfig;
  candidateCount?: number;
  totalCandidates?: number;
  isLoadingCount?: boolean;
  onChange?: (config: HardRequirementsConfig) => void;
  onCountChange?: (delta: number) => void;
}

const COUNTRY_OPTIONS = [
  { value: "denmark", label: "🇩🇰 Denmark" },
  { value: "sweden", label: "🇸🇪 Sweden" },
  { value: "norway", label: "🇳🇴 Norway" },
  { value: "finland", label: "🇫🇮 Finland" },
  { value: "germany", label: "🇩🇪 Germany" },
  { value: "uk", label: "🇬🇧 United Kingdom" },
  { value: "usa", label: "🇺🇸 United States" },
  { value: "canada", label: "🇨🇦 Canada" },
  { value: "europe", label: "🇪🇺 Europe (Any)" },
  { value: "remote", label: "🌍 Remote (Anywhere)" },
];

const LANGUAGE_OPTIONS = [
  "English",
  "Danish",
  "Swedish",
  "Norwegian",
  "Finnish",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Dutch",
  "Polish",
  "Portuguese",
];

const EXPERIENCE_OPTIONS = [
  { value: 0, label: "Any experience" },
  { value: 1, label: "1+ years" },
  { value: 2, label: "2+ years" },
  { value: 3, label: "3+ years" },
  { value: 5, label: "5+ years" },
  { value: 7, label: "7+ years" },
  { value: 10, label: "10+ years" },
  { value: 15, label: "15+ years" },
];

export function HardRequirementsFilter({
  initialRequirements,
  candidateCount,
  totalCandidates,
  isLoadingCount = false,
  onChange,
  onCountChange,
}: HardRequirementsFilterProps) {
  const [config, setConfig] = useState<HardRequirementsConfig>(
    initialRequirements || {
      requirements: [],
      enabled: false,
    }
  );

  const [previousCount, setPreviousCount] = useState<number | null>(null);

  // Track initial count for delta calculation
  useEffect(() => {
    if (candidateCount !== undefined && previousCount === null) {
      setPreviousCount(candidateCount);
    }
  }, [candidateCount, previousCount]);

  const updateConfig = (newConfig: HardRequirementsConfig) => {
    setConfig(newConfig);
    onChange?.(newConfig);
  };

  const toggleEnabled = () => {
    updateConfig({ ...config, enabled: !config.enabled });
  };

  const addRequirement = (type: HardRequirement["type"]) => {
    const newReq: HardRequirement = {
      id: `${type}-${Date.now()}`,
      type,
      value: type === "experience" ? 5 : "",
      enabled: true,
      isMustHave: true,
    };
    updateConfig({
      ...config,
      requirements: [...config.requirements, newReq],
    });
  };

  const removeRequirement = (id: string) => {
    updateConfig({
      ...config,
      requirements: config.requirements.filter((r) => r.id !== id),
    });
  };

  const updateRequirement = (id: string, updates: Partial<HardRequirement>) => {
    updateConfig({
      ...config,
      requirements: config.requirements.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  // Calculate candidate count delta
  const countDelta = 
    candidateCount !== undefined && previousCount !== null 
      ? candidateCount - previousCount 
      : null;

  // Group requirements by type
  const locations = config.requirements.filter((r) => r.type === "location");
  const experiences = config.requirements.filter((r) => r.type === "experience");
  const languages = config.requirements.filter((r) => r.type === "language");

  const enabledCount = config.requirements.filter((r) => r.enabled).length;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Hard Requirements
                {config.enabled && candidateCount !== undefined && totalCandidates !== undefined && totalCandidates > 0 ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    ({candidateCount.toLocaleString()} of {totalCandidates.toLocaleString()} candidates match)
                  </span>
                ) : enabledCount > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    {enabledCount} active
                  </Badge>
                ) : null}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Filter on must-haves early (geography, experience, languages)
              </p>
            </div>
          </div>
          <Switch checked={config.enabled} onCheckedChange={toggleEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Candidate Count Indicator */}
        {config.enabled && (
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Matching candidates</span>
              <div className="flex items-center gap-2">
                {isLoadingCount ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <>
                    {countDelta !== null && countDelta !== 0 && (
                      <div className="flex items-center gap-1">
                        {countDelta > 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-500">+{countDelta}</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-yellow-500">{countDelta}</span>
                          </>
                        )}
                      </div>
                    )}
                    <span className="text-2xl font-bold">
                      {candidateCount?.toLocaleString() || "—"}
                    </span>
                  </>
                )}
              </div>
            </div>
            {candidateCount !== undefined && candidateCount < 50 && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
                <AlertCircle className="w-3 h-3" />
                <span>Low candidate pool - consider relaxing requirements</span>
              </div>
            )}
          </div>
        )}

        {/* Location Requirements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addRequirement("location")}
              disabled={!config.enabled}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          {locations.map((req) => (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                req.enabled ? "bg-card" : "bg-muted/30 opacity-60"
              )}
            >
              <Switch
                checked={req.enabled}
                onCheckedChange={(checked) =>
                  updateRequirement(req.id, { enabled: checked })
                }
                disabled={!config.enabled}
              />
              <Select
                value={String(req.value)}
                onValueChange={(value) =>
                  updateRequirement(req.id, { value })
                }
                disabled={!config.enabled || !req.enabled}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Select country/region" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant={req.isMustHave ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateRequirement(req.id, { isMustHave: !req.isMustHave })
                  }
                  disabled={!config.enabled || !req.enabled}
                  className="h-7 text-xs"
                >
                  {req.isMustHave ? "Must-have" : "Nice-to-have"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRequirement(req.id)}
                  disabled={!config.enabled}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Experience Requirements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Experience</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addRequirement("experience")}
              disabled={!config.enabled || experiences.length > 0}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          {experiences.map((req) => (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                req.enabled ? "bg-card" : "bg-muted/30 opacity-60"
              )}
            >
              <Switch
                checked={req.enabled}
                onCheckedChange={(checked) =>
                  updateRequirement(req.id, { enabled: checked })
                }
                disabled={!config.enabled}
              />
              <Select
                value={String(req.value)}
                onValueChange={(value) =>
                  updateRequirement(req.id, { value: Number(value) })
                }
                disabled={!config.enabled || !req.enabled}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Minimum years" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant={req.isMustHave ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateRequirement(req.id, { isMustHave: !req.isMustHave })
                  }
                  disabled={!config.enabled || !req.enabled}
                  className="h-7 text-xs"
                >
                  {req.isMustHave ? "Must-have" : "Nice-to-have"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRequirement(req.id)}
                  disabled={!config.enabled}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Language Requirements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Languages</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addRequirement("language")}
              disabled={!config.enabled}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          {languages.map((req) => (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                req.enabled ? "bg-card" : "bg-muted/30 opacity-60"
              )}
            >
              <Switch
                checked={req.enabled}
                onCheckedChange={(checked) =>
                  updateRequirement(req.id, { enabled: checked })
                }
                disabled={!config.enabled}
              />
              <Select
                value={String(req.value)}
                onValueChange={(value) =>
                  updateRequirement(req.id, { value })
                }
                disabled={!config.enabled || !req.enabled}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang} value={lang.toLowerCase()}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant={req.isMustHave ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateRequirement(req.id, { isMustHave: !req.isMustHave })
                  }
                  disabled={!config.enabled || !req.enabled}
                  className="h-7 text-xs"
                >
                  {req.isMustHave ? "Must-have" : "Nice-to-have"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRequirement(req.id)}
                  disabled={!config.enabled}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {config.requirements.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hard requirements added yet. Click "+ Add" to start.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

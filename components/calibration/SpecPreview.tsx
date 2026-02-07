"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Circle,
  Briefcase,
  MapPin,
  Users,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";
import type { HiringSpec } from "@/services/calibrationService";

interface SpecPreviewProps {
  spec: Partial<HiringSpec>;
  phase: "gathering" | "refining" | "complete";
  onFinalize: () => void;
}

function FieldStatus({
  filled,
  label,
  value,
  icon: Icon,
}: {
  filled: boolean;
  label: string;
  value?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5">
        {filled ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        {filled && value ? (
          <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
        ) : (
          <p className="text-xs text-muted-foreground/50 mt-0.5 italic">
            Pending...
          </p>
        )}
      </div>
    </div>
  );
}

export function SpecPreview({ spec, phase, onFinalize }: SpecPreviewProps) {
  const mustHaveSkills =
    spec.skills?.filter((s) => s.priority === "must-have") || [];
  const niceToHaveSkills =
    spec.skills?.filter((s) => s.priority === "nice-to-have") || [];
  const bonusSkills =
    spec.skills?.filter((s) => s.priority === "bonus") || [];

  // Count filled core fields
  let filledCount = 0;
  const totalFields = 6;
  if (spec.title) filledCount++;
  if (spec.level) filledCount++;
  if (spec.skills && spec.skills.length > 0) filledCount++;
  if (spec.experience) filledCount++;
  if (spec.location) filledCount++;
  if (spec.teamContext) filledCount++;

  const progressPercent = Math.round((filledCount / totalFields) * 100);

  const canFinalize = phase === "refining" || phase === "complete" || filledCount >= 4;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Live Hiring Spec
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {filledCount}/{totalFields}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core fields */}
        <div className="space-y-3">
          <FieldStatus
            filled={!!spec.title}
            label="Title"
            value={spec.title}
            icon={Briefcase}
          />
          <FieldStatus
            filled={!!spec.level}
            label="Level"
            value={spec.level ? spec.level.charAt(0).toUpperCase() + spec.level.slice(1) : undefined}
            icon={Target}
          />
          <FieldStatus
            filled={!!spec.experience}
            label="Experience"
            value={
              spec.experience
                ? `${spec.experience.min}-${spec.experience.max} years`
                : undefined
            }
            icon={Clock}
          />
          <FieldStatus
            filled={!!spec.location}
            label="Location"
            value={
              spec.location
                ? `${spec.location.preference}${spec.location.remote ? " (Remote OK)" : ""}`
                : undefined
            }
            icon={MapPin}
          />
          <FieldStatus
            filled={!!spec.teamContext}
            label="Team"
            value={
              spec.teamContext
                ? `${spec.teamContext.size} people, ${spec.teamContext.role.toUpperCase()} role`
                : undefined
            }
            icon={Users}
          />
        </div>

        {/* Skills section */}
        {spec.skills && spec.skills.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Skills ({spec.skills.length})
              </span>
            </div>
            {mustHaveSkills.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Must-have
                </p>
                <div className="flex flex-wrap gap-1">
                  {mustHaveSkills.map((s) => (
                    <Badge
                      key={s.name}
                      className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary"
                    >
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {niceToHaveSkills.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Nice-to-have
                </p>
                <div className="flex flex-wrap gap-1">
                  {niceToHaveSkills.map((s) => (
                    <Badge
                      key={s.name}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {bonusSkills.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Bonus
                </p>
                <div className="flex flex-wrap gap-1">
                  {bonusSkills.map((s) => (
                    <Badge
                      key={s.name}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salary (optional) */}
        {spec.salary && (
          <div className="pt-2 border-t">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
              Salary range
            </p>
            <p className="text-sm font-medium">
              {spec.salary.min.toLocaleString()}-
              {spec.salary.max.toLocaleString()} {spec.salary.currency}
            </p>
          </div>
        )}

        {/* Finalize button */}
        {canFinalize && (
          <div className="pt-3 border-t">
            <Button
              onClick={onFinalize}
              className="w-full gap-2"
              size="sm"
            >
              Finalize Spec
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Expandable,
  ExpandableCard,
  ExpandableTrigger,
  ExpandableCardContent,
  ExpandableContent,
  ExpandableCardHeader,
} from "@/components/ui/expandable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ScoreBadge from "@/components/ScoreBadge";
import { BehavioralBadges } from "@/components/BehavioralBadges";
import {
  MapPin,
  ArrowRight,
  Trash2,
  MessageSquare,
  Check,
  AlertTriangle,
  CheckSquare,
  Square,
  Brain,
  Target,
  Lightbulb,
  ChevronDown,
  Loader2,
  User,
  Briefcase,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface ScoreBreakdown {
  requiredMatched: string[];
  requiredMissing: string[];
  preferredMatched: string[];
  locationMatch: "exact" | "remote" | "none";
  baseScore: number;
  skillsScore: number;
  preferredScore: number;
  locationScore: number;
}

interface DeepAnalysis {
  psychometricText?: string;
  archetype?: string;
  interviewTips?: string[];
  strengths?: string[];
  concerns?: string[];
  cultureFit?: string;
  managementStyle?: string;
}

interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  skills: string[];
  createdAt?: string;
  risks?: string[];
  keyEvidence?: string[];
  scoreBreakdown?: ScoreBreakdown;
  persona?: {
    archetype?: string;
    riskAssessment?: {
      attritionRisk?: string;
    };
  };
}

interface CandidatePipelineItemProps {
  candidate: Candidate;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOutreach: (candidate: Candidate) => void;
  adminSuffix: string;
}

export function CandidatePipelineItem({
  candidate,
  isSelected,
  onToggleSelect,
  onDelete,
  onOutreach,
  adminSuffix,
}: CandidatePipelineItemProps) {
  const { t } = useLanguage();
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [hasLoadedAnalysis, setHasLoadedAnalysis] = useState(false);

  // Fetch deep analysis when card expands
  const handleExpandStart = useCallback(async () => {
    if (hasLoadedAnalysis || isLoadingAnalysis) return;

    setIsLoadingAnalysis(true);
    try {
      const response = await fetch(`/api/developers/${candidate.id}?deep=true`);
      if (response.ok) {
        const data = await response.json();
        setDeepAnalysis({
          psychometricText: data.persona?.psychometricProfile || data.bio,
          archetype: data.persona?.archetype || candidate.persona?.archetype,
          interviewTips: data.interviewGuide?.questions || [],
          strengths: data.keyEvidence || candidate.keyEvidence || [],
          concerns: data.risks || candidate.risks || [],
          cultureFit: data.persona?.cultureFit,
          managementStyle: data.persona?.managementStyle,
        });
      }
    } catch (error) {
      console.error("Failed to fetch deep analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
      setHasLoadedAnalysis(true);
    }
  }, [candidate.id, hasLoadedAnalysis, isLoadingAnalysis, candidate.persona?.archetype, candidate.keyEvidence, candidate.risks]);

  return (
    <Expandable
      expandDirection="vertical"
      expandBehavior="push"
      onExpandStart={handleExpandStart}
      className="w-full"
    >
      {({ isExpanded }) => (
        <div className="w-full">
          <ExpandableTrigger className="w-full">
            <div
              className={`
                w-full bg-card border rounded-xl transition-all duration-300
                ${isExpanded ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30"}
              `}
            >
              {/* Always Visible Header */}
              <div className="flex items-center gap-4 p-4">
                {/* Checkbox - stop propagation to prevent expand */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(candidate.id);
                  }}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Avatar */}
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-12 h-12 rounded-full flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{candidate.name}</h3>
                    {candidate.persona?.archetype && (
                      <Badge variant="outline" className="text-xs">
                        {candidate.persona.archetype.split(" ").slice(0, 2).join(" ")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {candidate.currentRole} at {candidate.company}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {candidate.location}
                    </span>
                    {candidate.skills && candidate.skills.length > 0 && (
                      <span className="hidden sm:inline">{candidate.skills.slice(0, 3).join(", ")}</span>
                    )}
                  </div>
                  <BehavioralBadges username={candidate.id} compact className="mt-2" />
                </div>

                {/* Score */}
                <div className="flex-shrink-0">
                  <ScoreBadge score={candidate.alignmentScore} size="md" showTooltip={false} />
                </div>

                {/* Expand Indicator */}
                <div className="flex-shrink-0">
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              <ExpandableContent preset="blur-md" className="px-4 pb-4">
                {/* Quick Tags */}
                <div className="flex flex-wrap gap-2 mb-4 pt-2 border-t">
                  {candidate.skills?.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Score Breakdown */}
                {candidate.scoreBreakdown && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Score Breakdown
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-bold text-muted-foreground">
                          {candidate.scoreBreakdown.baseScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Base</div>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10 text-center">
                        <div className="text-lg font-bold text-green-500">
                          +{candidate.scoreBreakdown.skillsScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Skills</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                        <div className="text-lg font-bold text-blue-500">
                          +{candidate.scoreBreakdown.preferredScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Preferred</div>
                      </div>
                      <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
                        <div className="text-lg font-bold text-yellow-500">
                          +{candidate.scoreBreakdown.locationScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Location</div>
                      </div>
                    </div>

                    {/* Skills Match */}
                    {(candidate.scoreBreakdown.requiredMatched.length > 0 ||
                      candidate.scoreBreakdown.requiredMissing.length > 0) && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          Required Skills ({candidate.scoreBreakdown.requiredMatched.length}/
                          {candidate.scoreBreakdown.requiredMatched.length +
                            candidate.scoreBreakdown.requiredMissing.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.scoreBreakdown.requiredMatched.map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-green-500/20 text-green-600 border-green-500/30 text-xs gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {skill}
                            </Badge>
                          ))}
                          {candidate.scoreBreakdown.requiredMissing.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-muted-foreground text-xs gap-1 opacity-60"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Deep Analysis Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Psychometric Profile */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Psychometric Profile
                    </h4>
                    {isLoadingAnalysis ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    ) : deepAnalysis?.psychometricText ? (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {deepAnalysis.psychometricText}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Click &quot;Deep Profile&quot; for full AI analysis
                      </p>
                    )}
                    {deepAnalysis?.archetype && (
                      <Badge className="mt-2" variant="outline">
                        <User className="w-3 h-3 mr-1" />
                        {deepAnalysis.archetype}
                      </Badge>
                    )}
                  </div>

                  {/* Interview Guide */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Interview Guide
                    </h4>
                    {isLoadingAnalysis ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : deepAnalysis?.interviewTips && deepAnalysis.interviewTips.length > 0 ? (
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {deepAnalysis.interviewTips.slice(0, 3).map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="line-clamp-1">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        View deep profile for tailored questions
                      </p>
                    )}
                  </div>
                </div>

                {/* Strengths & Concerns */}
                {(deepAnalysis?.strengths?.length || deepAnalysis?.concerns?.length) && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {deepAnalysis.strengths && deepAnalysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase text-muted-foreground mb-2">
                          Key Strengths
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {deepAnalysis.strengths.slice(0, 3).map((strength, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs text-green-600 border-green-500/30"
                            >
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {deepAnalysis.concerns && deepAnalysis.concerns.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase text-muted-foreground mb-2">
                          Areas to Explore
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {deepAnalysis.concerns.slice(0, 3).map((concern, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs text-yellow-600 border-yellow-500/30"
                            >
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Link href={`/profile/${candidate.id}/deep${adminSuffix}`} className="flex-1">
                    <Button className="w-full gap-2">
                      <Brain className="w-4 h-4" />
                      Full Deep Profile
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOutreach(candidate);
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(candidate.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </ExpandableContent>
            </div>
          </ExpandableTrigger>
        </div>
      )}
    </Expandable>
  );
}

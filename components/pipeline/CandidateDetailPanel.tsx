"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { resolveProfileSlug } from "@/lib/candidate-identity";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ScoreBadge from "@/components/ScoreBadge";
import { BehavioralBadges } from "@/components/BehavioralBadges";
import {
  X,
  MapPin,
  Briefcase,
  ArrowRight,
  MessageSquare,
  Brain,
  Target,
  Lightbulb,
  Check,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  skills?: string[];
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
  // Demo profile fields
  buildprint?: any;
  topRepos?: any[];
  hasReceipts?: boolean;
}

interface CandidateDetailPanelProps {
  candidate: Candidate;
  onClose: () => void;
  onOutreach: (candidate: Candidate) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export function CandidateDetailPanel({
  candidate,
  onClose,
  onOutreach,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  currentIndex,
  totalCount,
}: CandidateDetailPanelProps) {
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we have navigation functions
      if (!onNext && !onPrevious) return;

      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrevious, onClose, hasNext, hasPrevious]);

  // Fetch deep analysis on mount
  const fetchDeepAnalysis = useCallback(async () => {
    if (isLoadingAnalysis) return;

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
    }
  }, [candidate.id, candidate.persona?.archetype, candidate.keyEvidence, candidate.risks, isLoadingAnalysis]);

  useEffect(() => {
    fetchDeepAnalysis();
  }, [fetchDeepAnalysis]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-card border-l"
    >
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="font-semibold text-lg">{candidate.name}</h2>
              <p className="text-sm text-muted-foreground">
                {candidate.currentRole}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Navigation Controls */}
        {(onNext || onPrevious) && (
          <div className="pt-2 border-t space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              {currentIndex !== undefined && totalCount !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} of {totalCount}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!hasNext}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center text-[10px] text-muted-foreground">
              Use ← → arrow keys or Esc to close
            </div>
          </div>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Score and Basic Info */}
        <div className="flex items-center justify-between">
          <ScoreBadge score={candidate.alignmentScore} size="lg" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {candidate.location}
          </div>
        </div>

        {/* Company */}
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <span>{candidate.company}</span>
        </div>

        {/* Behavioral Badges */}
        <BehavioralBadges username={candidate.id} />

        {/* Skills */}
        <div>
          <h3 className="text-xs uppercase text-muted-foreground mb-2">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {(candidate.skills || []).slice(0, 8).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {(candidate.skills || []).length > 8 && (
              <Badge variant="outline" className="text-xs">
                +{(candidate.skills || []).length - 8}
              </Badge>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        {candidate.scoreBreakdown && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
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
                  <div className="text-[10px] text-muted-foreground">Pref.</div>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
                  <div className="text-lg font-bold text-yellow-500">
                    +{candidate.scoreBreakdown.locationScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Loc.</div>
                </div>
              </div>

              {/* Skills Match */}
              {((candidate.scoreBreakdown.requiredMatched?.length || 0) > 0 ||
                (candidate.scoreBreakdown.requiredMissing?.length || 0) > 0) && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Required Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {candidate.scoreBreakdown.requiredMatched?.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px] gap-0.5"
                      >
                        <Check className="w-2.5 h-2.5" />
                        {skill}
                      </Badge>
                    ))}
                    {candidate.scoreBreakdown.requiredMissing?.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-muted-foreground text-[10px] gap-0.5 opacity-60"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Key Evidence */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Key Evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoadingAnalysis ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : deepAnalysis?.strengths && deepAnalysis.strengths.length > 0 ? (
              <ul className="space-y-2">
                {deepAnalysis.strengths.slice(0, 4).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <span className="line-clamp-2">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                View deep profile for evidence
              </p>
            )}
          </CardContent>
        </Card>

        {/* Potential Gaps */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Potential Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoadingAnalysis ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : deepAnalysis?.concerns && deepAnalysis.concerns.length > 0 ? (
              <ul className="space-y-2">
                {deepAnalysis.concerns.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                    <span className="line-clamp-2">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No gaps identified
              </p>
            )}
          </CardContent>
        </Card>

        {/* Interview Guide */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Interview Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {isLoadingAnalysis ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : deepAnalysis?.interviewTips && deepAnalysis.interviewTips.length > 0 ? (
              <ul className="space-y-2">
                {deepAnalysis.interviewTips.slice(0, 3).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-medium">{i + 1}.</span>
                    <span className="line-clamp-2">{tip}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                View deep profile for tailored questions
              </p>
            )}
          </CardContent>
        </Card>

        {/* Archetype */}
        {deepAnalysis?.archetype && (
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Archetype
            </div>
            <Badge variant="outline" className="gap-1">
              <User className="w-3 h-3" />
              {deepAnalysis.archetype}
            </Badge>
          </div>
        )}
      </div>

      {/* Actions - Fixed Footer */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Link href={`/profile/${resolveProfileSlug(candidate)}/deep`} className="flex-1">
            <Button className="w-full gap-2">
              <Brain className="w-4 h-4" />
              Full Profile
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => onOutreach(candidate)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

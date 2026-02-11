"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ArrowLeft,
  Loader2,
  MapPin,
  Briefcase,
  Mail,
  Sparkles,
  ExternalLink,
  Check,
  Coins,
  X,
} from "lucide-react";
import ScoreBadge from "@/components/ScoreBadge";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { PhaseIndicator } from "@/components/PhaseIndicator";
import OutreachModal from "@/components/OutreachModal";
import { PRICING, CREDITS_TO_EUR } from "@/types";
import { candidateService } from "@/services/candidateService";
import { useLanguage } from "@/lib/i18n";
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
}

export default function ShortlistPage() {
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobContext, setJobContext] = useState<{
    title: string;
    company: string;
    requiredSkills?: string[];
  } | null>(null);

  // Outreach modal state
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachCandidate, setOutreachCandidate] = useState<Candidate | null>(null);

  // Completed outreach tracking
  const [completedOutreach, setCompletedOutreach] = useState<Set<string>>(new Set());

  // Load shortlist on mount
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const storedJobContext = localStorage.getItem("apex_job_context");

      if (!isMounted) return;

      if (storedJobContext) {
        try {
          const parsed = JSON.parse(storedJobContext);
          setJobContext(parsed);
        } catch {
          // Ignore
        }
      }

      // Load candidates from API instead of localStorage
      const shortlistIds = localStorage.getItem("apex_shortlist");
      if (shortlistIds) {
        try {
          const ids: string[] = JSON.parse(shortlistIds);
          const { candidates: all } = await candidateService.fetchAll();
          if (!isMounted) return;
          const shortlisted = (all as unknown as Candidate[]).filter((c) => ids.includes(c.id));
          setCandidates(shortlisted);
        } catch (e) {
          console.error("Failed to load shortlist:", e);
        }
      }
      if (isMounted) setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate credit cost for all outreach
  const totalOutreachCost = useMemo(() => {
    const remaining = candidates.filter((c) => !completedOutreach.has(c.id));
    return remaining.length * PRICING.OUTREACH;
  }, [candidates, completedOutreach]);

  const totalOutreachEur = (totalOutreachCost * CREDITS_TO_EUR).toFixed(2);

  const handleRemoveFromShortlist = (id: string) => {
    setCandidates((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      // Update localStorage
      localStorage.setItem("apex_shortlist", JSON.stringify(updated.map((c) => c.id)));
      return updated;
    });
  };

  const handleOutreachComplete = (candidateId: string) => {
    setCompletedOutreach((prev) => new Set([...prev, candidateId]));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <PhaseIndicator currentPhase={4} />
          <Card className="border-dashed mt-6">
            <CardContent className="py-16 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t("shortlist.empty.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("shortlist.empty.description")}
              </p>
              <Link href="/pipeline">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("shortlist.backToCandidates")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Phase Indicator */}
        <PhaseIndicator currentPhase={4} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Badge className="mb-2 bg-green-500/20 text-green-400 text-xs">
              {t("shortlist.phaseLabel")}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("shortlist.title")}</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {candidates.length} {t("shortlist.candidatesReady")}
              {jobContext && ` for ${jobContext.title}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/pipeline">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("shortlist.backToCandidates")}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Cost Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("shortlist.outreachPackForAll")}</p>
                  <p className="text-xs text-muted-foreground">
                    {candidates.length - completedOutreach.size} {t("shortlist.remaining")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-semibold">{totalOutreachCost.toLocaleString()} {t("shortlist.credits")}</p>
                  <p className="text-xs text-muted-foreground">~{totalOutreachEur} EUR</p>
                </div>
                <Button
                  disabled={completedOutreach.size === candidates.length}
                  onClick={() => {
                    const firstRemaining = candidates.find(
                      (c) => !completedOutreach.has(c.id)
                    );
                    if (firstRemaining) {
                      setOutreachCandidate(firstRemaining);
                      setShowOutreach(true);
                    }
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("shortlist.generateAll")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {candidates.map((candidate, index) => {
              const isCompleted = completedOutreach.has(candidate.id);
              return (
                <motion.div
                  key={candidate.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      isCompleted ? "border-green-500/50 bg-green-500/5" : ""
                    }`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveFromShortlist(candidate.id)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-white transition-colors z-10"
                      title={t("shortlist.removeFromShortlist")}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-green-500 text-white gap-1">
                          <Check className="w-3 h-3" />
                          {t("shortlist.done")}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="pt-6">
                      {/* Avatar & Score */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-14 h-14 rounded-full border-2 border-background shadow-md"
                          />
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">
                              {candidate.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {candidate.currentRole}
                            </p>
                          </div>
                        </div>
                        <ScoreBadge score={candidate.alignmentScore} size="md" />
                      </div>

                      {/* Info */}
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{candidate.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{candidate.location}</span>
                        </div>
                      </div>

                      {/* Skills */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {candidate.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/profile/${candidate.id}/deep`}
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {t("shortlist.deepProfile")}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={isCompleted}
                          onClick={() => {
                            setOutreachCandidate(candidate);
                            setShowOutreach(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {isCompleted ? t("shortlist.sent") : t("shortlist.outreach")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Progress Summary */}
        {completedOutreach.size > 0 && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="font-medium">
                    {completedOutreach.size} {t("shortlist.of")} {candidates.length} {t("shortlist.outreachPacksGenerated")}
                  </span>
                </div>
                {completedOutreach.size === candidates.length && (
                  <Badge className="bg-green-500 text-white">{t("shortlist.allComplete")}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Outreach Modal */}
      {outreachCandidate && (
        <OutreachModal
          isOpen={showOutreach}
          onClose={() => {
            setShowOutreach(false);
            // Mark as complete when modal closes after generation
            if (outreachCandidate) {
              handleOutreachComplete(outreachCandidate.id);
            }
            setOutreachCandidate(null);
          }}
          candidate={{
            name: outreachCandidate.name,
            currentRole: outreachCandidate.currentRole,
            company: outreachCandidate.company,
            avatar: outreachCandidate.avatar,
          }}
          jobContext={jobContext || undefined}
        />
      )}
    </div>
  );
}

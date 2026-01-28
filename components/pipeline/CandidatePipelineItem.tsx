"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Expandable,
  ExpandableTrigger,
  ExpandableContent,
} from "@/components/ui/expandable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisLoadingScramble } from "@/components/ui/loading-scramble";
import ScoreBadge from "@/components/ScoreBadge";
import { BuildprintStrip } from "@/components/pipeline/BuildprintStrip";
import { ScoreExplainer } from "@/components/ScoreExplainer";
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
  Github,
  Linkedin,
  ExternalLink,
  Info,
  Lock,
  Eye,
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

interface EvidenceItem {
  text: string;
  source?: string;
  sourceUrl?: string;
  confidence?: 'high' | 'moderate' | 'low';
}

interface DeepAnalysis {
  psychometricText?: string;
  archetype?: string;
  interviewTips?: string[];
  strengths?: Array<string | EvidenceItem>;
  concerns?: Array<string | EvidenceItem>;
  cultureFit?: string;
  managementStyle?: string;
  hasPublicActivity?: boolean;
  totalCommits?: number;
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
  source?: "github" | "linkedin" | "import";
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
  compact?: boolean;
}

export function CandidatePipelineItem({
  candidate,
  isSelected,
  onToggleSelect,
  onDelete,
  onOutreach,
  compact = false,
}: CandidatePipelineItemProps) {
  const { t, lang } = useLanguage();
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [hasLoadedAnalysis, setHasLoadedAnalysis] = useState(false);
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);
  const [githubAnalysis, setGithubAnalysis] = useState<any>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Fetch deep analysis when card expands
  const handleExpandStart = useCallback(async () => {
    if (hasLoadedAnalysis || isLoadingAnalysis) return;

    setIsLoadingAnalysis(true);
    try {
      // Fetch both developer profile and GitHub deep analysis in parallel
      const [profileRes, githubRes] = await Promise.all([
        fetch(`/api/developers/${candidate.id}?deep=true`),
        fetch(`/api/github/deep?username=${candidate.id}`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setDeepAnalysis({
          psychometricText: data.persona?.psychometricProfile || data.bio,
          archetype: data.persona?.archetype || candidate.persona?.archetype,
          interviewTips: data.interviewGuide?.questions || [],
          strengths: data.keyEvidence || candidate.keyEvidence || [],
          concerns: data.risks || candidate.risks || [],
          cultureFit: data.persona?.cultureFit,
          managementStyle: data.persona?.managementStyle,
          hasPublicActivity: data.hasPublicActivity ?? true,
          totalCommits: data.totalCommits,
        });
      }

      if (githubRes.ok) {
        const githubData = await githubRes.json();
        setGithubAnalysis(githubData);
      }
    } catch (error) {
      console.error("Failed to fetch deep analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
      setHasLoadedAnalysis(true);
    }
  }, [candidate.id, hasLoadedAnalysis, isLoadingAnalysis, candidate.persona?.archetype, candidate.keyEvidence, candidate.risks]);

  // In compact mode, render a simplified non-expandable version
  if (compact) {
    return (
      <div className="w-full bg-card border rounded-xl transition-all duration-300 border-border hover:border-primary/30">
        <div className="flex items-center gap-3 p-3">
          {/* Checkbox */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(candidate.id);
            }}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </Button>

          {/* Avatar */}
          <img
            src={candidate.avatar}
            alt={candidate.name}
            className="w-10 h-10 rounded-full flex-shrink-0"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{candidate.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {candidate.currentRole}
            </p>
          </div>

          {/* Score */}
          <div className="flex-shrink-0">
            <ScoreBadge score={candidate.alignmentScore} size="sm" showTooltip={false} />
          </div>
        </div>

        {/* Compact Skills Preview */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="px-3 pb-3 flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{candidate.skills.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
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
                <Button
                  variant="ghost"
                  size="icon"
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
                </Button>

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
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {candidate.location}
                    </span>
                    {/* Source Badge */}
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 text-[10px]">
                      {(candidate.source === "linkedin") ? (
                        <>
                          <Linkedin className="w-2.5 h-2.5" />
                          LinkedIn
                        </>
                      ) : (
                        <>
                          <Github className="w-2.5 h-2.5" />
                          GitHub
                        </>
                      )}
                    </span>
                  </div>
                  {/* Skill Badges on collapsed card */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                      {candidate.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{candidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <BehavioralBadges username={candidate.id} compact className="mt-2" />
                </div>

                {/* Score - Clickable for explainer */}
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowScoreExplainer(true);
                    }}
                    className="hover:scale-105 transition-transform cursor-pointer h-auto p-0"
                    title="Click to see score breakdown"
                  >
                    <ScoreBadge score={candidate.alignmentScore} size="md" showTooltip={false} />
                  </Button>
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
                {/* Buildprint Strip */}
                {githubAnalysis && (
                  <div className="pt-2 pb-3 border-t mb-3">
                    <BuildprintStrip
                      githubAnalysis={githubAnalysis}
                      userProfile={{ totalStars: candidate.skills?.length || 0 }}
                    />
                  </div>
                )}

                {/* Quick Tags */}
                <div className={`flex flex-wrap gap-2 mb-4 ${!githubAnalysis ? "pt-2 border-t" : ""}`}>
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
                      {t("candidate.scoreBreakdown")}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="text-lg font-bold text-muted-foreground">
                          {candidate.scoreBreakdown.baseScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t("candidate.base")}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/10 text-center">
                        <div className="text-lg font-bold text-green-500">
                          +{candidate.scoreBreakdown.skillsScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t("score.skills")}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                        <div className="text-lg font-bold text-blue-500">
                          +{candidate.scoreBreakdown.preferredScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t("candidate.preferred")}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-yellow-500/10 text-center relative group">
                        <div className="text-lg font-bold text-yellow-500">
                          +{candidate.scoreBreakdown.locationScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{t("score.location")}</div>
                        {/* Location score tooltip for 0% */}
                        {candidate.scoreBreakdown.locationScore === 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg shadow-lg border max-w-[200px] whitespace-normal">
                              <div className="flex items-center gap-1 mb-1">
                                <Info className="w-3 h-3" />
                                {t("score.remoteEligible")}
                              </div>
                              <p className="text-muted-foreground">
                                {lang === "da"
                                  ? "Kandidatens lokation matcher ikke direkte, men kan være remote-kompatibel."
                                  : "Location doesn't match directly, but may be remote-compatible."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills Match */}
                    {((candidate.scoreBreakdown.requiredMatched?.length || 0) > 0 ||
                      (candidate.scoreBreakdown.requiredMissing?.length || 0) > 0) && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {t("candidate.requiredSkills")} ({candidate.scoreBreakdown.requiredMatched?.length || 0}/
                          {(candidate.scoreBreakdown.requiredMatched?.length || 0) +
                            (candidate.scoreBreakdown.requiredMissing?.length || 0)})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {candidate.scoreBreakdown.requiredMatched?.map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-green-500/20 text-green-600 border-green-500/30 text-xs gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {skill}
                            </Badge>
                          ))}
                          {candidate.scoreBreakdown.requiredMissing?.map((skill) => (
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

                {/* No Public Activity Warning */}
                {deepAnalysis && deepAnalysis.hasPublicActivity === false && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-600">
                          {t("candidate.noVisibleActivity")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("candidate.privateActivityNote")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deep Analysis Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Psychometric Profile */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      {t("candidate.psychometricProfile")}
                    </h4>
                    {isLoadingAnalysis ? (
                      <div className="py-2">
                        <AnalysisLoadingScramble />
                      </div>
                    ) : deepAnalysis?.psychometricText ? (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {deepAnalysis.psychometricText}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {t("candidate.clickDeepProfile")}
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
                      {t("candidate.interviewGuide")}
                    </h4>
                    {isLoadingAnalysis ? (
                      <div className="py-2">
                        <AnalysisLoadingScramble />
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
                        {t("candidate.viewDeepProfileQuestions")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Strengths & Concerns - Clickable with Evidence */}
                {(deepAnalysis?.strengths?.length || deepAnalysis?.concerns?.length) && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {deepAnalysis.strengths && deepAnalysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase text-muted-foreground mb-2">
                          {t("candidate.keyStrengths")}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {deepAnalysis.strengths.slice(0, 3).map((strength, i) => {
                            const isEvidenceItem = typeof strength === 'object' && strength !== null;
                            const text = isEvidenceItem ? (strength as EvidenceItem).text : String(strength);
                            const hasEvidence = isEvidenceItem && (strength as EvidenceItem).sourceUrl;

                            return (
                              <Badge
                                key={i}
                                variant="outline"
                                className={`text-xs text-green-600 border-green-500/30 ${
                                  hasEvidence ? 'cursor-pointer hover:bg-green-500/10' : ''
                                }`}
                                onClick={hasEvidence ? () => setSelectedEvidence(strength as EvidenceItem) : undefined}
                              >
                                {text}
                                {hasEvidence && <Eye className="w-2.5 h-2.5 ml-1" />}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {deepAnalysis.concerns && deepAnalysis.concerns.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase text-muted-foreground mb-2">
                          {t("candidate.areasToExplore")}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {deepAnalysis.concerns.slice(0, 3).map((concern, i) => {
                            const isEvidenceItem = typeof concern === 'object' && concern !== null;
                            const text = isEvidenceItem ? (concern as EvidenceItem).text : String(concern);
                            const hasEvidence = isEvidenceItem && (concern as EvidenceItem).sourceUrl;

                            return (
                              <Badge
                                key={i}
                                variant="outline"
                                className={`text-xs text-yellow-600 border-yellow-500/30 ${
                                  hasEvidence ? 'cursor-pointer hover:bg-yellow-500/10' : ''
                                }`}
                                onClick={hasEvidence ? () => setSelectedEvidence(concern as EvidenceItem) : undefined}
                              >
                                {text}
                                {hasEvidence && <Eye className="w-2.5 h-2.5 ml-1" />}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Evidence Modal */}
                {selectedEvidence && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{t("candidate.flagEvidence")}</span>
                          {selectedEvidence.confidence && (
                            <Badge variant="outline" className="text-[10px]">
                              {selectedEvidence.confidence === 'high' ? t("candidate.confidenceHigh") :
                               selectedEvidence.confidence === 'moderate' ? t("candidate.confidenceModerate") :
                               t("candidate.confidenceLow")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {selectedEvidence.source && (
                            <span className="text-xs text-muted-foreground">
                              {t("candidate.inferredFrom")}: {selectedEvidence.source}
                            </span>
                          )}
                        </p>
                        {selectedEvidence.sourceUrl && (
                          <a
                            href={selectedEvidence.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {t("candidate.viewEvidence")}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedEvidence(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Link href={`/profile/${candidate.id}/deep`} className="flex-1">
                    <Button className="w-full gap-2">
                      <Brain className="w-4 h-4" />
                      {t("candidate.fullDeepProfile")}
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

    {/* Score Explainer Sheet */}
    <ScoreExplainer
      candidate={candidate}
      isOpen={showScoreExplainer}
      onClose={() => setShowScoreExplainer(false)}
    />
    </>
  );
}

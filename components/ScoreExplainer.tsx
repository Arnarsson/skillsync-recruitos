"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  Briefcase,
  MapPin,
  Code,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

interface ScoreBreakdownComponent {
  value?: number;
  max?: number;
  percentage: number;
}

interface ScoreBreakdown {
  skills?: ScoreBreakdownComponent;
  experience?: ScoreBreakdownComponent;
  industry?: ScoreBreakdownComponent;
  seniority?: ScoreBreakdownComponent;
  location?: ScoreBreakdownComponent;
  requiredMatched?: string[];
  requiredMissing?: string[];
  preferredMatched?: string[];
}

interface EvidenceWithSource {
  claim: string;
  source?: string;
  sourceDetail?: string;
  sourceUrl?: string;
}

interface Candidate {
  id: string;
  name: string;
  alignmentScore: number;
  scoreBreakdown?: ScoreBreakdown;
  scoreConfidence?: 'high' | 'moderate' | 'low';
  scoreDrivers?: string[];
  scoreDrags?: string[];
  keyEvidence?: string[];
  keyEvidenceWithSources?: EvidenceWithSource[];
  risks?: string[];
  risksWithSources?: EvidenceWithSource[];
  skills?: string[];
  topRepos?: Array<{
    name: string;
    url?: string;
    html_url?: string;
    stars?: number;
    language?: string;
  }>;
}

interface ScoreExplainerProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
}

const SCORE_COMPONENTS = [
  { key: "skills", label: "Technical Skills", icon: Code, weight: 30 },
  { key: "experience", label: "Experience Level", icon: TrendingUp, weight: 25 },
  { key: "industry", label: "Industry Fit", icon: Briefcase, weight: 20 },
  { key: "seniority", label: "Seniority Match", icon: Target, weight: 15 },
  { key: "location", label: "Location", icon: MapPin, weight: 10 },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function getConfidenceBadge(confidence?: string) {
  switch (confidence) {
    case "high":
      return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">High Confidence</Badge>;
    case "moderate":
      return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Moderate Confidence</Badge>;
    case "low":
      return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Low Confidence</Badge>;
    default:
      return null;
  }
}

export function ScoreExplainer({ candidate, isOpen, onClose }: ScoreExplainerProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Reset expanded section when candidate changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset state on prop change is intentional
    setExpandedSection(null);
  }, [candidate.id]);

  const breakdown = candidate.scoreBreakdown;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              Why {candidate.alignmentScore}?
            </SheetTitle>
            {getConfidenceBadge(candidate.scoreConfidence)}
          </div>
          <SheetDescription>
            Score breakdown for {candidate.name} with linked evidence
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Big Score Display */}
          <div className="flex items-center justify-center gap-6 p-6 rounded-xl bg-muted/30">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(candidate.alignmentScore)}`}>
                {candidate.alignmentScore}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Alignment Score</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-left space-y-1">
              {candidate.scoreDrivers && candidate.scoreDrivers.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Strong: {candidate.scoreDrivers.join(", ")}</span>
                </div>
              )}
              {candidate.scoreDrags && candidate.scoreDrags.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Gap: {candidate.scoreDrags.join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Score Components */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Score Breakdown</h3>

            {breakdown ? (
              <div className="space-y-3">
                {SCORE_COMPONENTS.map(({ key, label, icon: Icon, weight }) => {
                  const component = breakdown[key as keyof ScoreBreakdown] as ScoreBreakdownComponent | undefined;
                  const percentage = component?.percentage || 0;
                  const isExpanded = expandedSection === key;

                  return (
                    <div key={key} className="space-y-2">
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : key)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{label}</span>
                          <Badge variant="outline" className="text-[10px]">{weight}%</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${getScoreColor(percentage)}`}>
                            {percentage}%
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 text-muted-foreground transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </button>

                      <Progress value={percentage} className="h-2" />

                      {/* Expanded Evidence */}
                      {isExpanded && (
                        <div className="pl-4 pt-2 space-y-2 border-l-2 border-primary/20 ml-2">
                          {key === "skills" && breakdown.requiredMatched && (
                            <>
                              <div className="text-xs text-muted-foreground mb-2">Matched Skills</div>
                              <div className="flex flex-wrap gap-1.5">
                                {breakdown.requiredMatched.map((skill) => (
                                  <Badge
                                    key={skill}
                                    className="bg-green-500/20 text-green-600 border-green-500/30 text-xs gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              {breakdown.requiredMissing && breakdown.requiredMissing.length > 0 && (
                                <>
                                  <div className="text-xs text-muted-foreground mt-3 mb-2">Missing Skills</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {breakdown.requiredMissing.map((skill) => (
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
                                </>
                              )}
                              {/* Link to top repos */}
                              {candidate.topRepos && candidate.topRepos.length > 0 && (
                                <>
                                  <div className="text-xs text-muted-foreground mt-3 mb-2">Evidence (Top Repos)</div>
                                  <div className="space-y-1.5">
                                    {candidate.topRepos.slice(0, 3).map((repo) => (
                                      <a
                                        key={repo.name}
                                        href={repo.url || repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 text-xs"
                                      >
                                        <span className="flex items-center gap-2">
                                          <Code className="w-3 h-3" />
                                          {repo.name}
                                          {repo.language && (
                                            <Badge variant="outline" className="text-[10px]">
                                              {repo.language}
                                            </Badge>
                                          )}
                                        </span>
                                        <span className="flex items-center gap-1 text-primary">
                                          View <ExternalLink className="w-3 h-3" />
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                </>
                              )}
                            </>
                          )}

                          {key !== "skills" && (
                            <p className="text-xs text-muted-foreground">
                              Based on profile analysis and job requirements matching
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Evidence with Receipts */}
          {(candidate.keyEvidenceWithSources || candidate.keyEvidence) && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Key Evidence
              </h3>
              <div className="space-y-2">
                {(candidate.keyEvidenceWithSources || candidate.keyEvidence?.map(e => ({ claim: e, source: undefined, sourceUrl: undefined })) || [])
                  .slice(0, 5)
                  .map((evidence, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 text-sm">
                        <span>{evidence.claim}</span>
                        {evidence.sourceUrl && (
                          <a
                            href={evidence.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View Receipt <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {evidence.source && !evidence.sourceUrl && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            {evidence.source}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Risks/Gaps */}
          {(candidate.risksWithSources || candidate.risks) && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Potential Gaps
              </h3>
              <div className="space-y-2">
                {(candidate.risksWithSources || candidate.risks?.map(r => ({ claim: r, sourceUrl: undefined })) || [])
                  .slice(0, 4)
                  .map((risk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 text-sm">
                        <span>{risk.claim}</span>
                        {risk.sourceUrl && (
                          <a
                            href={risk.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action */}
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

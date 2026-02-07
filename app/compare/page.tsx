"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  Trophy,
  MapPin,
  Briefcase,
  Building2,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import type { Candidate, ScoreBreakdown } from "@/types";

// ===== Types for AI comparison response =====

interface DimensionScore {
  score: number;
  notes: string;
}

interface ComparisonVerdict {
  recommended: string;
  reasoning: string;
  tradeoffs: string;
}

interface ComparisonResult {
  dimensions: {
    skills: Record<string, DimensionScore>;
    experience: Record<string, DimensionScore>;
    industry: Record<string, DimensionScore>;
    seniority: Record<string, DimensionScore>;
    location: Record<string, DimensionScore>;
  };
  verdict: ComparisonVerdict;
}

type DimensionKey = keyof ComparisonResult["dimensions"];

// ===== Helpers =====

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  skills: "Skills",
  experience: "Experience",
  industry: "Industry",
  seniority: "Seniority",
  location: "Location",
};

const DIMENSION_ICONS: Record<DimensionKey, string> = {
  skills: "code",
  experience: "clock",
  industry: "factory",
  seniority: "trending-up",
  location: "map-pin",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500/20";
  if (score >= 60) return "bg-yellow-500/20";
  return "bg-red-500/20";
}

function getBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function getScorePercentage(breakdown: ScoreBreakdown | undefined, key: DimensionKey): number | null {
  if (!breakdown) return null;
  const component = breakdown[key];
  if (!component) return null;
  return component.percentage ?? null;
}

// ===== Component =====

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const candidateIds = useMemo(() => {
    const idsParam = searchParams.get("ids");
    if (!idsParam) return [];
    return idsParam.split(",").filter(Boolean).slice(0, 4);
  }, [searchParams]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [comparingAI, setComparingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch candidates on mount
  useEffect(() => {
    if (candidateIds.length === 0) {
      setLoading(false);
      setError("No candidate IDs provided. Navigate from the pipeline page.");
      return;
    }

    if (candidateIds.length < 2) {
      setLoading(false);
      setError("At least 2 candidates are required for comparison.");
      return;
    }

    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          candidateIds.map(async (id) => {
            const res = await fetch(`/api/candidates/${encodeURIComponent(id)}`);
            if (!res.ok) {
              throw new Error(`Candidate "${id}" not found (${res.status})`);
            }
            const data = await res.json();
            return data.candidate as Candidate;
          })
        );

        setCandidates(results);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to fetch candidates";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [candidateIds]);

  // Generate AI comparison
  const handleGenerateVerdict = async () => {
    if (candidates.length < 2) return;

    setComparingAI(true);
    setAiError(null);

    try {
      // Get job context from localStorage
      let jobContext = "";
      try {
        const stored = localStorage.getItem("apex_job_context");
        if (stored) {
          const parsed = JSON.parse(stored);
          jobContext = `${parsed.title || ""} at ${parsed.company || ""}. Required skills: ${parsed.requiredSkills?.join(", ") || "N/A"}. Location: ${parsed.location || "N/A"}.`;
        }
      } catch {
        // Ignore localStorage errors
      }

      const res = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates, jobContext }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `AI comparison failed (${res.status})`);
      }

      const result: ComparisonResult = await res.json();
      setComparison(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI comparison failed";
      setAiError(msg);
    } finally {
      setComparingAI(false);
    }
  };

  // ===== Loading State =====

  if (loading) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Loading candidates...</h1>
              <p className="text-sm text-muted-foreground">Fetching data for comparison</p>
            </div>
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-3/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== Error State =====

  if (error) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-destructive/50">
            <CardContent className="py-16 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-lg font-semibold mb-2">Comparison Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Link href="/pipeline">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Pipeline
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ===== Determine winner from existing scores or AI comparison =====

  const winnerId = comparison?.verdict?.recommended ?? null;

  // Column width classes based on count
  const colClass =
    candidates.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : candidates.length === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/pipeline">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Battle Cards</h1>
              <p className="text-sm text-muted-foreground">
                Comparing {candidates.length} candidates side-by-side
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerateVerdict}
            disabled={comparingAI || candidates.length < 2}
            className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            {comparingAI ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {comparingAI ? "Analyzing..." : comparison ? "Re-generate Verdict" : "Generate AI Verdict"}
          </Button>
        </div>

        {/* Candidate Header Cards */}
        <div className={`grid ${colClass} gap-4 mb-6`}>
          {candidates.map((c) => {
            const isWinner = winnerId === c.id;
            return (
              <Card
                key={c.id}
                className={`relative overflow-hidden transition-all ${
                  isWinner ? "ring-2 ring-yellow-500 bg-yellow-500/5" : ""
                }`}
              >
                {isWinner && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-950 text-[10px] font-bold px-2 py-0.5 rounded-bl flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    RECOMMENDED
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`}
                      alt={c.name}
                      className="w-12 h-12 rounded-full border-2 border-background"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.currentRole}
                      </p>
                    </div>
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${getScoreBg(c.alignmentScore)}`}
                    >
                      <span className={`text-lg font-bold ${getScoreColor(c.alignmentScore)}`}>
                        {c.alignmentScore}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.company || "Independent"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      <span>
                        {c.yearsExperience
                          ? `${c.yearsExperience} years`
                          : "Experience not specified"}
                      </span>
                    </div>
                  </div>
                  {/* Skills preview */}
                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {c.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {skill}
                        </Badge>
                      ))}
                      {c.skills.length > 5 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{c.skills.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Link href={`/profile/${c.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                        Profile
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dimension Comparison Table */}
        <Card className="mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-36">
                    Dimension
                  </th>
                  {candidates.map((c) => (
                    <th key={c.id} className="text-center py-3 px-4 text-sm font-medium min-w-[160px]">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((dim) => {
                  // Determine the best score for this dimension (for highlighting)
                  const scores = candidates.map((c) => {
                    if (comparison?.dimensions?.[dim]?.[c.id]) {
                      return comparison.dimensions[dim][c.id].score;
                    }
                    return getScorePercentage(c.scoreBreakdown, dim) ?? c.alignmentScore;
                  });
                  const maxScore = Math.max(...scores);

                  return (
                    <tr key={dim} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-muted-foreground">
                        {DIMENSION_LABELS[dim]}
                      </td>
                      {candidates.map((c, idx) => {
                        const aiScore = comparison?.dimensions?.[dim]?.[c.id];
                        const existingScore = getScorePercentage(c.scoreBreakdown, dim);
                        const score = aiScore?.score ?? existingScore ?? null;
                        const isBest = score !== null && score === maxScore && scores.filter((s) => s === maxScore).length === 1;

                        return (
                          <td key={c.id} className="py-3 px-4 text-center">
                            {score !== null ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-center gap-2">
                                  <span
                                    className={`text-lg font-bold ${getScoreColor(score)} ${
                                      isBest ? "underline decoration-yellow-500 decoration-2 underline-offset-4" : ""
                                    }`}
                                  >
                                    {score}
                                  </span>
                                </div>
                                {/* Score bar */}
                                <div className="w-full bg-muted rounded-full h-2 mx-auto max-w-[120px]">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${getBarColor(score)}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                                {/* AI notes */}
                                {aiScore?.notes && (
                                  <p className="text-[11px] text-muted-foreground leading-tight mt-1 max-w-[200px] mx-auto">
                                    {aiScore.notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">--</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Overall Score Row */}
                <tr className="bg-muted/30 font-medium">
                  <td className="py-3 px-4 text-sm font-semibold">Overall</td>
                  {candidates.map((c) => (
                    <td key={c.id} className="py-3 px-4 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${getScoreBg(c.alignmentScore)}`}
                      >
                        <span className={`text-2xl font-bold ${getScoreColor(c.alignmentScore)}`}>
                          {c.alignmentScore}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Verdict Section */}
        {aiError && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">AI Verdict Failed</p>
                  <p className="text-sm text-muted-foreground">{aiError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateVerdict}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {comparison?.verdict && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">AI Verdict</h3>
                  {(() => {
                    const recommended = candidates.find(
                      (c) => c.id === comparison.verdict.recommended
                    );
                    return recommended ? (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={
                              recommended.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${recommended.name}`
                            }
                            alt={recommended.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium">{recommended.name}</span>
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                            Best Match
                          </Badge>
                        </div>
                      </div>
                    ) : null;
                  })()}
                  <p className="text-sm text-foreground/90 mb-3">
                    {comparison.verdict.reasoning}
                  </p>
                  {comparison.verdict.tradeoffs && (
                    <div className="text-sm text-muted-foreground border-t border-border/50 pt-3 mt-3">
                      <span className="font-medium text-foreground/70">Trade-offs: </span>
                      {comparison.verdict.tradeoffs}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action when no comparison yet */}
        {!comparison && !comparingAI && !aiError && (
          <Card className="mb-6 border-dashed">
            <CardContent className="py-8 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-medium mb-1">Ready for AI Analysis?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click &quot;Generate AI Verdict&quot; to get a detailed comparison with scores, notes,
                and a recommendation across all dimensions.
              </p>
              <Button
                onClick={handleGenerateVerdict}
                className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Verdict
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Loading State */}
        {comparingAI && (
          <Card className="mb-6 border-primary/20">
            <CardContent className="py-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
              <h3 className="font-medium mb-1">Analyzing candidates...</h3>
              <p className="text-sm text-muted-foreground">
                AI is comparing {candidates.length} candidates across 5 dimensions.
                This may take a few seconds.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

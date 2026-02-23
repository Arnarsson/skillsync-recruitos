"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { resolveProfileSlug } from "@/lib/candidate-identity";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { candidateService } from "@/services/candidateService";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react";
import { PhaseIndicator } from "@/components/PhaseIndicator";
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

export default function AnalysePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { status } = useSession();
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const shortlistData = localStorage.getItem("apex_shortlist_data");
      const shortlistIds = localStorage.getItem("apex_shortlist");
      if (!shortlistData) return [];
      const saved = JSON.parse(shortlistData) as Candidate[];
      const ids: string[] = shortlistIds ? JSON.parse(shortlistIds) : saved.map((c) => c.id);
      return saved.filter((c) => ids.includes(c.id));
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [jobContext, setJobContext] = useState<{
    title: string;
    company: string;
    requiredSkills?: string[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      // Load job context from localStorage (not candidate data)
      const storedJobContext = localStorage.getItem("apex_job_context");

      if (storedJobContext) {
        try {
          setJobContext(JSON.parse(storedJobContext));
        } catch {
          // Ignore
        }
      }

      // Load selected candidates — prefer pre-saved shortlist data (works for demo + real candidates)
      const shortlistData = localStorage.getItem("apex_shortlist_data");
      const shortlistIds = localStorage.getItem("apex_shortlist");
      if (shortlistData) {
        try {
          const saved = JSON.parse(shortlistData) as Candidate[];
          const ids: string[] = shortlistIds ? JSON.parse(shortlistIds) : saved.map((c) => c.id);
          setSelectedCandidates(saved.filter((c) => ids.includes(c.id)));
        } catch (e) {
          console.error("Failed to parse shortlist data:", e);
        }
      } else if (shortlistIds) {
        // Fallback: fetch from API (for real candidates saved to DB)
        try {
          const ids: string[] = JSON.parse(shortlistIds);
          if (status === "authenticated") {
            try {
              const { candidates: all } = await candidateService.fetchAll();
              const selected = (all as unknown as Candidate[]).filter((c) => ids.includes(c.id));
              setSelectedCandidates(selected);
            } catch (error) {
              // In demo/unauthenticated flows, /api/candidates returns 401.
              // Fall back to local cached candidates to avoid hard UI failures.
              if (error instanceof Error && error.message === "Unauthorized") {
                const cachedCandidates = localStorage.getItem("apex_candidates");
                if (cachedCandidates) {
                  const parsed = JSON.parse(cachedCandidates) as Candidate[];
                  const selected = parsed.filter((c) => ids.includes(c.id));
                  setSelectedCandidates(selected);
                }
              } else {
                throw error;
              }
            }
          } else {
            const cachedCandidates = localStorage.getItem("apex_candidates");
            if (cachedCandidates) {
              const parsed = JSON.parse(cachedCandidates) as Candidate[];
              const selected = parsed.filter((c) => ids.includes(c.id));
              setSelectedCandidates(selected);
            }
          }
        } catch (e) {
          console.error("Failed to load selections:", e);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [status]);

  const handleContinueToOutreach = () => {
    // Navigate to Stage 4 (Outreach)
    router.push("/shortlist");
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No selections from Stage 2 - redirect back
  if (selectedCandidates.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content max-w-4xl">
          <PhaseIndicator currentPhase={3} />
          
          <Card className="border-dashed border-orange-500/50 bg-orange-500/5">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-semibold mb-2">No Candidates Selected</h3>
              <p className="text-muted-foreground mb-6">
                You need to select candidates in Stage 2 (List) before you can analyze them here.
              </p>
              <Link href="/pipeline">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content max-w-7xl">
        {/* Phase Indicator */}
        <PhaseIndicator currentPhase={3} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                Stage 3 of 4
              </Badge>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {selectedCandidates.length} selected from Stage 2
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Deep Analysis</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Review detailed profiles of your selected candidates
              {jobContext && ` for ${jobContext.title}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/pipeline">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to List</span>
              </Button>
            </Link>
            <Button 
              onClick={handleContinueToOutreach}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              <span className="hidden sm:inline">Continue to Outreach</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight className="w-4 h-4 sm:ml-2" />
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedCandidates.length}</p>
                  <p className="text-sm text-muted-foreground">Candidates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      selectedCandidates.reduce((sum, c) => sum + c.alignmentScore, 0) /
                        selectedCandidates.length
                    )}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg. Alignment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {selectedCandidates.filter(c => c.alignmentScore >= 80).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Strong Matches (80+)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate Deep Profile Cards */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {selectedCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/profile/${resolveProfileSlug(candidate)}/deep`}>
                  <Card className="group overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar & Basic Info */}
                        <div className="flex items-start gap-4">
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-16 h-16 rounded-full border-2 border-primary/20"
                          />
                          <div>
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {candidate.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {candidate.currentRole}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {candidate.company} • {candidate.location}
                            </p>
                          </div>
                        </div>

                        {/* Alignment Score */}
                        <div className="flex items-center gap-4 sm:ml-auto">
                          <div className="text-center">
                            <div
                              className={`text-3xl font-bold ${
                                candidate.alignmentScore >= 80
                                  ? "text-green-500"
                                  : candidate.alignmentScore >= 60
                                  ? "text-yellow-500"
                                  : "text-red-500"
                              }`}
                            >
                              {candidate.alignmentScore}%
                            </div>
                            <p className="text-xs text-muted-foreground">Alignment</p>
                          </div>
                          
                          <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Skills Preview */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 6).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <Card className="mt-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Ready for Outreach?</h3>
                <p className="text-sm text-muted-foreground">
                  Continue to Stage 4 to generate personalized outreach messages
                </p>
              </div>
              <Button 
                onClick={handleContinueToOutreach}
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600"
              >
                Continue to Outreach
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

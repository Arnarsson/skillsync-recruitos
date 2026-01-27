"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
<<<<<<< HEAD
import Link from "next/link";
import {
  User,
  MapPin,
  Briefcase,
  Brain,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Shield,
  Target,
  TrendingUp,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
=======
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Printer,
  Share2,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Building,
} from "lucide-react";
import {
>>>>>>> df9172b (feat(7-166): add standalone report page)
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
<<<<<<< HEAD
} from "recharts";

// --- Local interfaces (mirrors deep page pattern) ---

interface EvidenceItem {
  claim: string;
  source?: string;
  sourceUrl?: string;
=======
  ResponsiveContainer,
} from "recharts";
import { BehavioralBadges } from "@/components/BehavioralBadges";

// Types matching the Deep Profile
interface DeepProfile {
  indicators: Array<{
    name: string;
    value: number;
    interpretation: string;
    icon: string;
  }>;
  questions: Array<{
    question: string;
    context: string;
    expectedAnswer: string;
    category: "Technical" | "Soft Skills" | "Behavioral";
  }>;
  deepAnalysis: string;
  cultureFit: string;
  companyMatch: {
    score: number;
    reasons: string[];
    risks: string[];
  };
>>>>>>> df9172b (feat(7-166): add standalone report page)
}

interface Persona {
  archetype: string;
  psychometric: {
    communicationStyle: string;
    primaryMotivator: string;
    riskTolerance: string;
    leadershipPotential: string;
<<<<<<< HEAD
    bigFive?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
=======
>>>>>>> df9172b (feat(7-166): add standalone report page)
  };
  softSkills: string[];
  redFlags: string[];
  greenFlags: string[];
  reasoning: string;
<<<<<<< HEAD
  careerTrajectory?: {
    growthVelocity: "rapid" | "steady" | "slow";
    promotionFrequency: "high" | "moderate" | "low";
    roleProgression: "vertical" | "lateral" | "mixed";
    averageTenure: string;
    tenurePattern: "stable" | "job-hopper" | "long-term";
  };
  skillProfile?: {
    coreSkills: Array<{ name: string; proficiency: string; yearsActive: number }>;
    depthVsBreadth: "specialist" | "generalist" | "t-shaped";
  };
  riskAssessment?: {
    attritionRisk: "low" | "moderate" | "high";
    flightRiskFactors: string[];
  };
=======
>>>>>>> df9172b (feat(7-166): add standalone report page)
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
<<<<<<< HEAD
  yearsExperience?: number;
  shortlistSummary?: string;
  keyEvidence?: string[];
  keyEvidenceWithSources?: EvidenceItem[];
  risks?: string[];
  risksWithSources?: EvidenceItem[];
  sourceUrl?: string;
=======
  persona?: Persona;
  deepProfile?: DeepProfile;
>>>>>>> df9172b (feat(7-166): add standalone report page)
  scoreBreakdown?: {
    skills?: { percentage: number };
    experience?: { percentage: number };
    industry?: { percentage: number };
    seniority?: { percentage: number };
    location?: { percentage: number };
  };
<<<<<<< HEAD
  persona?: Persona;
}

// --- Trait descriptions for Big Five ---

const TRAIT_DESCRIPTIONS: Record<string, string> = {
  Openness: "Innovation, curiosity, new technology adoption",
  Conscientiousness: "Code quality, documentation, consistency",
  Extraversion: "Community involvement, collaboration patterns",
  Agreeableness: "Team fit, code review style, helpfulness",
  Stability: "Resilience, career consistency, stress management",
};

// --- Helper: score label ---

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Developing";
  return "Limited";
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-blue-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 30) return "text-orange-400";
  return "text-red-400";
}

function scoreBorderColor(score: number): string {
  if (score >= 85) return "border-emerald-500/50";
  if (score >= 70) return "border-blue-500/50";
  if (score >= 50) return "border-yellow-500/50";
  if (score >= 30) return "border-orange-500/50";
  return "border-red-500/50";
}

// =============================================================================

export default function ProfileReportPage() {
=======
}

export default function ReportPage() {
>>>>>>> df9172b (feat(7-166): add standalone report page)
  const params = useParams();
  const username = params.username as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    // Primary: localStorage (same as deep page)
    const stored = localStorage.getItem("apex_candidates");
    if (stored) {
      try {
        const candidates = JSON.parse(stored) as Candidate[];
        const found = candidates.find((c) => c.id === username);
        if (found) {
          setCandidate(found);
          setLoading(false);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    // Fallback: GitHub API (same pattern as deep page)
    fetch(`/api/github/user?username=${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          const fallbackCandidate: Candidate = {
            id: data.login || username,
            name: data.name || username,
            currentRole: data.bio || "",
            company: data.company || "",
            location: data.location || "",
            alignmentScore: 0,
            avatar:
              data.avatar_url || `https://github.com/${username}.png`,
            skills: data.topLanguages || [],
            sourceUrl: `https://github.com/${username}`,
          };
          setCandidate(fallbackCandidate);

          // Cache for future visits
          const existing = localStorage.getItem("apex_candidates");
          const candidates = existing ? JSON.parse(existing) : [];
          candidates.push(fallbackCandidate);
          localStorage.setItem(
            "apex_candidates",
            JSON.stringify(candidates)
          );
        }
      })
      .catch((err) => console.error("GitHub fallback error:", err))
      .finally(() => setLoading(false));
  }, [username]);

  // --- Big Five data ---
  const bigFiveData = candidate?.persona?.psychometric.bigFive
    ? [
        {
          trait: "Openness",
          value: candidate.persona.psychometric.bigFive.openness,
          fullMark: 10,
        },
        {
          trait: "Conscientiousness",
          value: candidate.persona.psychometric.bigFive.conscientiousness,
          fullMark: 10,
        },
        {
          trait: "Extraversion",
          value: candidate.persona.psychometric.bigFive.extraversion,
          fullMark: 10,
        },
        {
          trait: "Agreeableness",
          value: candidate.persona.psychometric.bigFive.agreeableness,
          fullMark: 10,
        },
        {
          trait: "Stability",
          value:
            10 - candidate.persona.psychometric.bigFive.neuroticism,
          fullMark: 10,
        },
      ]
    : [];

  // --- Score breakdown data ---
  const breakdownEntries = candidate?.scoreBreakdown
    ? [
        { label: "Skills", pct: candidate.scoreBreakdown.skills?.percentage ?? 0 },
        { label: "Experience", pct: candidate.scoreBreakdown.experience?.percentage ?? 0 },
        { label: "Industry", pct: candidate.scoreBreakdown.industry?.percentage ?? 0 },
        { label: "Seniority", pct: candidate.scoreBreakdown.seniority?.percentage ?? 0 },
        { label: "Location", pct: candidate.scoreBreakdown.location?.percentage ?? 0 },
      ]
    : [];

  // --- Evidence lists ---
  const evidenceList =
    candidate?.keyEvidenceWithSources ??
    candidate?.keyEvidence?.map((e) => ({ claim: e })) ??
    [];
  const riskList =
    candidate?.risksWithSources ??
    candidate?.risks?.map((r) => ({ claim: r })) ??
    [];

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
          <p className="text-zinc-500 text-sm">Loading report...</p>
=======
    async function loadCandidate() {
      // 1. Try localStorage
      const stored = localStorage.getItem("apex_candidates");
      if (stored) {
        try {
          const candidates = JSON.parse(stored) as Candidate[];
          const found = candidates.find((c) => c.id === username);
          if (found) {
            setCandidate(found);
            setLoading(false);
            return;
          }
        } catch {
          // Ignore
        }
      }

      // 2. Fallback to GitHub API (if direct link)
      try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (response.ok) {
          const user = await response.json();
          const githubCandidate: Candidate = {
            id: user.login,
            name: user.name || user.login,
            currentRole: user.bio ? user.bio.split('.')[0] : 'Software Developer',
            company: user.company?.replace(/^@/, '') || '',
            location: user.location || '',
            skills: [],
            alignmentScore: 0,
            avatar: user.avatar_url,
          };
          setCandidate(githubCandidate);
          // Trigger analysis automatically? (Maybe later)
        }
      } catch (error) {
        console.error("Failed to fetch GitHub profile:", error);
      }
      setLoading(false);
    }

    loadCandidate();
  }, [username]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating Report...</p>
>>>>>>> df9172b (feat(7-166): add standalone report page)
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Candidate not found</p>
          <Link
            href="/pipeline"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Back to pipeline
          </Link>
=======
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Could not find a candidate with username "{username}".
          </p>
          <Button onClick={() => window.location.href = "/search"}>
            Back to Search
          </Button>
>>>>>>> df9172b (feat(7-166): add standalone report page)
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  const hasPersona = !!candidate.persona;
  const hasBigFive = bigFiveData.length > 0;
  const hasBreakdown = breakdownEntries.length > 0;
  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* ---- Print & global styles ---- */}
      <style jsx global>{`
        @media print {
          html, body {
            background: #fff !important;
            color: #111 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-break-before {
            page-break-before: always;
          }
          .print-avoid-break {
            page-break-inside: avoid;
          }
          /* Override dark backgrounds for print */
          .report-page {
            background: #fff !important;
            color: #111 !important;
          }
          .report-card {
            background: #f9fafb !important;
            border-color: #e5e7eb !important;
            color: #111 !important;
          }
          .report-card h3, .report-card h4 {
            color: #111 !important;
          }
          .report-card p, .report-card span, .report-card li {
            color: #374151 !important;
          }
          .report-header {
            background: #f3f4f6 !important;
            border-color: #d1d5db !important;
          }
          .report-header * {
            color: #111 !important;
          }
          .score-ring {
            border-color: #3b82f6 !important;
            color: #3b82f6 !important;
          }
          .print-brand {
            display: block !important;
          }
          .radar-chart-container {
            background: #fff !important;
          }
        }
      `}</style>

      <div className="report-page min-h-screen bg-[#0a0a0f] text-zinc-100">
        {/* ---- Toolbar (hidden on print) ---- */}
        <div className="no-print sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-zinc-800/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link
              href={`/profile/${username}/deep`}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to profile
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Export PDF
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* ================================================================
              SECTION 1 — Report Header & Candidate Overview
              ================================================================ */}
          <header className="report-header rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-8">
            {/* Branding bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm tracking-wide text-zinc-300">
                  RecruitOS
                </span>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>Personality &amp; Alignment Report</p>
                <p>{reportDate}</p>
              </div>
            </div>

            {/* Candidate info row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-zinc-700 print:border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {candidate.name}
                </h1>
                {candidate.currentRole && (
                  <p className="text-zinc-400 mt-1 text-sm sm:text-base truncate">
                    {candidate.currentRole}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-zinc-500">
                  {candidate.company && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {candidate.company}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {candidate.location}
                    </span>
                  )}
                  {candidate.yearsExperience != null && candidate.yearsExperience > 0 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {candidate.yearsExperience} years experience
                    </span>
                  )}
                </div>
              </div>

              {/* Alignment Score */}
              {candidate.alignmentScore > 0 && (
                <div className="flex-shrink-0">
                  <div
                    className={`score-ring w-24 h-24 rounded-full border-4 ${scoreBorderColor(candidate.alignmentScore)} flex flex-col items-center justify-center`}
                  >
                    <span className={`text-3xl font-bold ${scoreColor(candidate.alignmentScore)}`}>
                      {candidate.alignmentScore}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {scoreLabel(candidate.alignmentScore)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Skills row */}
            {candidate.skills.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.slice(0, 10).map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-md text-xs font-medium print:bg-gray-100 print:text-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* ================================================================
              SECTION 2 — Score Breakdown
              ================================================================ */}
          {hasBreakdown && (
            <section className="report-card print-avoid-break rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
                <Target className="w-5 h-5 text-blue-400" />
                Alignment Breakdown
              </h3>
              <div className="space-y-3">
                {breakdownEntries.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className="text-zinc-300 font-medium">
                        {Math.round(item.pct)}%
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden print:bg-gray-200">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all print:from-blue-600 print:to-blue-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================================================================
              SECTION 3 — Personality Archetype
              ================================================================ */}
          {hasPersona && candidate.persona!.archetype && (
            <section className="report-card print-avoid-break rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-purple-400" />
                Personality Archetype
              </h3>
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-5 print:bg-purple-50 print:border-purple-200">
                <p className="text-xl font-bold text-purple-300 print:text-purple-700">
                  {candidate.persona!.archetype}
                </p>
                {candidate.persona!.reasoning && (
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed print:text-gray-600">
                    {candidate.persona!.reasoning}
                  </p>
                )}
              </div>

              {/* Psychometric quick facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  {
                    label: "Communication",
                    value: candidate.persona!.psychometric.communicationStyle,
                    icon: MessageSquare,
                    color: "text-sky-400",
                  },
                  {
                    label: "Motivator",
                    value: candidate.persona!.psychometric.primaryMotivator,
                    icon: Sparkles,
                    color: "text-amber-400",
                  },
                  {
                    label: "Risk Tolerance",
                    value: candidate.persona!.psychometric.riskTolerance,
                    icon: Shield,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Leadership",
                    value: candidate.persona!.psychometric.leadershipPotential,
                    icon: TrendingUp,
                    color: "text-rose-400",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-zinc-800/50 rounded-lg p-3 print:bg-gray-50 print:border print:border-gray-200"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-200 print:text-gray-800 truncate">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================================================================
              SECTION 4 — Big Five Personality Radar
              ================================================================ */}
          {hasBigFive && (
            <section className="report-card print-avoid-break print-break-before rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
                <Brain className="w-5 h-5 text-blue-400" />
                Big Five Personality Profile
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="radar-chart-container h-72 bg-zinc-800/30 rounded-xl p-3 print:bg-white print:border print:border-gray-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={bigFiveData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid
                        stroke="#3f3f46"
                        gridType="polygon"
                      />
                      <PolarAngleAxis
                        dataKey="trait"
                        tick={{ fill: "#a1a1aa", fontSize: 11, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 10]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Personality"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.25}
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#3b82f6", stroke: "#1d4ed8", strokeWidth: 1 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Trait bars + descriptions */}
                <div className="space-y-4">
                  {bigFiveData.map((trait) => (
                    <div key={trait.trait}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-medium text-zinc-200 print:text-gray-800">
                          {trait.trait}
                        </span>
                        <span className="text-xs text-zinc-500 tabular-nums">
                          {trait.value.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden print:bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all print:from-blue-600 print:to-blue-400"
                          style={{ width: `${trait.value * 10}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        {TRAIT_DESCRIPTIONS[trait.trait] ?? ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              SECTION 5 — Green Flags & Red Flags (side by side)
              ================================================================ */}
          {hasPersona &&
            ((candidate.persona!.greenFlags?.length ?? 0) > 0 ||
              (candidate.persona!.redFlags?.length ?? 0) > 0) && (
              <section className="print-avoid-break grid md:grid-cols-2 gap-6 mb-6">
                {/* Green Flags */}
                {candidate.persona!.greenFlags?.length > 0 && (
                  <div className="report-card rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 print:bg-green-50 print:border-green-200">
                    <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2 mb-4 print:text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Green Flags
                    </h3>
                    <ul className="space-y-2.5">
                      {candidate.persona!.greenFlags.map((flag, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-zinc-300 print:text-gray-700"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Flags */}
                {candidate.persona!.redFlags?.length > 0 && (
                  <div className="report-card rounded-2xl border border-red-500/20 bg-red-500/5 p-6 print:bg-red-50 print:border-red-200">
                    <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-4 print:text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      Red Flags
                    </h3>
                    <ul className="space-y-2.5">
                      {candidate.persona!.redFlags.map((flag, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-zinc-300 print:text-gray-700"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

          {/* ================================================================
              SECTION 6 — Key Evidence (Strengths)
              ================================================================ */}
          {evidenceList.length > 0 && (
            <section className="report-card print-avoid-break rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Key Evidence &amp; Strengths
              </h3>
              <ul className="space-y-2.5">
                {evidenceList.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-zinc-300 print:text-gray-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 print:bg-green-100 print:text-green-700">
                      {i + 1}
                    </span>
                    <span>{item.claim}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ================================================================
              SECTION 7 — Risks / Areas to Explore
              ================================================================ */}
          {riskList.length > 0 && (
            <section className="report-card print-avoid-break rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Areas to Explore
              </h3>
              <ul className="space-y-2.5">
                {riskList.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-zinc-300 print:text-gray-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 print:bg-yellow-100 print:text-yellow-700">
                      !
                    </span>
                    <span>{item.claim}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ================================================================
              SECTION 8 — Soft Skills
              ================================================================ */}
          {hasPersona && candidate.persona!.softSkills?.length > 0 && (
            <section className="report-card print-avoid-break rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Soft Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.persona!.softSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-lg text-sm print:bg-purple-50 print:border-purple-200 print:text-purple-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ================================================================
              SECTION 9 — Career Trajectory (if available)
              ================================================================ */}
          {candidate.persona?.careerTrajectory && (
            <section className="report-card print-avoid-break rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Career Trajectory
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Growth Velocity", value: candidate.persona.careerTrajectory.growthVelocity },
                  { label: "Promotion Freq.", value: candidate.persona.careerTrajectory.promotionFrequency },
                  { label: "Role Progression", value: candidate.persona.careerTrajectory.roleProgression },
                  { label: "Avg. Tenure", value: candidate.persona.careerTrajectory.averageTenure },
                  { label: "Tenure Pattern", value: candidate.persona.careerTrajectory.tenurePattern },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-zinc-800/50 rounded-lg p-3 print:bg-gray-50 print:border print:border-gray-200"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-zinc-200 capitalize print:text-gray-800">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================================================================
              FOOTER — Branding + Disclaimer
              ================================================================ */}
          <footer className="mt-10 pt-6 border-t border-zinc-800 print:border-gray-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 print:text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center print:bg-blue-600">
                  <Target className="w-3 h-3 text-white" />
                </div>
                <span className="font-medium text-zinc-400 print:text-gray-700">
                  RecruitOS
                </span>
                <span className="text-zinc-600">|</span>
                <span>recruitos.xyz</span>
              </div>
              <p className="text-center sm:text-right max-w-md">
                This report is generated from publicly available data using AI
                analysis. It should be used as a decision-support tool, not as
                a sole basis for hiring decisions.
              </p>
            </div>
            <p className="text-center text-[10px] text-zinc-600 mt-3 print:text-gray-400">
              Report ID: {username}-{Date.now().toString(36)} &bull; Generated{" "}
              {reportDate} &bull; Confidential
            </p>
          </footer>
        </div>
      </div>
    </>
=======
  // Calculate radar data
  const radarData = candidate.scoreBreakdown
    ? [
        { subject: "Skills", value: candidate.scoreBreakdown.skills?.percentage || 0 },
        { subject: "Experience", value: candidate.scoreBreakdown.experience?.percentage || 0 },
        { subject: "Industry", value: candidate.scoreBreakdown.industry?.percentage || 0 },
        { subject: "Seniority", value: candidate.scoreBreakdown.seniority?.percentage || 0 },
        { subject: "Location", value: candidate.scoreBreakdown.location?.percentage || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white text-black print:p-0 p-8 font-sans">
      {/* Print Controls (Hidden in Print) */}
      <div className="max-w-[210mm] mx-auto mb-8 print:hidden flex justify-between items-center">
        <Button variant="outline" onClick={() => window.history.back()}>
          ← Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print / PDF
          </Button>
          <Button>
            <Share2 className="w-4 h-4 mr-2" />
            Share Report
          </Button>
        </div>
      </div>

      {/* A4 Page Container */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none">
        
        {/* Header */}
        <header className="border-b-2 border-black pb-6 mb-8 flex justify-between items-start">
          <div className="flex items-center gap-6">
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-24 h-24 rounded-full border-4 border-gray-100 grayscale print:grayscale-0"
            />
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{candidate.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {candidate.currentRole}
                </div>
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {candidate.company}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {candidate.location}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-4 py-2 bg-black text-white rounded-lg mb-2">
              <span className="text-3xl font-bold">{candidate.alignmentScore}</span>
              <span className="text-sm font-medium opacity-80">/100</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Fit Score</p>
          </div>
        </header>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          
          {/* Column 1: Archetype & Stats */}
          <div className="col-span-1 space-y-6">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Archetype</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Brain className="w-5 h-5" />
                  <span className="font-bold text-lg">
                    {candidate.persona?.archetype || "Analyzing..."}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {candidate.persona?.reasoning || "AI analysis pending for this candidate."}
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Score Breakdown</h3>
              <div className="h-48 w-full -ml-4">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#000000"
                        strokeWidth={2}
                        fill="#000000"
                        fillOpacity={0.1}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No data
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Column 2 & 3: Deep Dive */}
          <div className="col-span-2 space-y-8">
            
            {/* Key Strengths (Green Flags) */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Key Strengths
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {candidate.persona?.greenFlags?.slice(0, 4).map((flag, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-green-100 bg-green-50/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800">{flag}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Risk Factors (Red Flags) */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Risk Factors
              </h3>
              <div className="space-y-2">
                {candidate.persona?.redFlags?.slice(0, 3).map((flag, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    {flag}
                  </div>
                ))}
                {!candidate.persona?.redFlags?.length && (
                  <p className="text-sm text-gray-400 italic">No major red flags detected.</p>
                )}
              </div>
            </section>

            {/* Psychometric Profile */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Psychometric Profile</h3>
              <div className="space-y-4">
                {/* Communication */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-500">Communication Style</span>
                    <span>{candidate.persona?.psychometric.communicationStyle}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black w-3/4 rounded-full" />
                  </div>
                </div>
                {/* Motivation */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-500">Primary Motivator</span>
                    <span>{candidate.persona?.psychometric.primaryMotivator}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black w-1/2 rounded-full" />
                  </div>
                </div>
                {/* Leadership */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-500">Leadership Potential</span>
                    <span>{candidate.persona?.psychometric.leadershipPotential}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black w-2/3 rounded-full" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Page Break for Print */}
        <div className="print:break-before-page" />

        {/* Interview Guide */}
        <section className="mt-8 pt-8 border-t-2 border-gray-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Interview Guide
          </h2>
          
          <div className="grid gap-6">
            {candidate.deepProfile?.questions?.slice(0, 3).map((q, i) => (
              <div key={i} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-white">{q.category}</Badge>
                </div>
                <h4 className="font-bold text-lg mb-2">{q.question}</h4>
                <p className="text-sm text-gray-600 mb-4 italic">"{q.context}"</p>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm">
                  <span className="font-bold text-gray-900 block mb-1">Look for:</span>
                  {q.expectedAnswer}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400 flex justify-between">
          <span>Generated by RecruitOS AI</span>
          <span>{new Date().toLocaleDateString()}</span>
        </footer>

      </div>
    </div>
>>>>>>> df9172b (feat(7-166): add standalone report page)
  );
}

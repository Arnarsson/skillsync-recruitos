"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  User,
  MapPin,
  Briefcase,
  Brain,
  CheckCircle,
  AlertTriangle,
  Printer,
  Shield,
  Target,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Download,
  Share2,
  Users,
  Zap,
  Eye,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

/* ─────────────────────────── Types ─────────────────────────── */

interface SharedProfile {
  id: string;
  viewCount: number;
  createdAt: string;
  data: {
    candidateId: string;
    name: string;
    currentRole?: string;
    company?: string;
    location?: string;
    avatar?: string;
    skills: string[];
    yearsExperience?: number;
    alignmentScore: number;
    persona?: {
      archetype: string;
      psychometric: {
        communicationStyle: string;
        primaryMotivator: string;
        riskTolerance: string;
        leadershipPotential: string;
        bigFive?: {
          openness: number;
          conscientiousness: number;
          extraversion: number;
          agreeableness: number;
          neuroticism: number;
        };
      };
      softSkills: string[];
      redFlags: string[];
      greenFlags: string[];
      reasoning: string;
      careerTrajectory?: {
        growthVelocity: string;
        promotionFrequency: string;
        roleProgression: string;
        averageTenure: string;
        tenurePattern: string;
      };
      skillProfile?: {
        coreSkills: Array<{
          name: string;
          proficiency: string;
          yearsActive: number;
        }>;
        depthVsBreadth: string;
      };
    };
    keyEvidence?: Array<{ claim: string }>;
    risks?: Array<{ claim: string }>;
    scoreBreakdown?: {
      skills?: { percentage: number };
      experience?: { percentage: number };
      industry?: { percentage: number };
      seniority?: { percentage: number };
      location?: { percentage: number };
    };
  };
}

/* ─────────────────────────── Helpers ─────────────────────────── */

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

function scoreBg(score: number): string {
  if (score >= 85) return "from-emerald-500/20 to-emerald-500/5";
  if (score >= 70) return "from-blue-500/20 to-blue-500/5";
  if (score >= 50) return "from-yellow-500/20 to-yellow-500/5";
  return "from-orange-500/20 to-orange-500/5";
}

function scoreBorderColor(score: number): string {
  if (score >= 85) return "border-emerald-500/50";
  if (score >= 70) return "border-blue-500/50";
  if (score >= 50) return "border-yellow-500/50";
  return "border-orange-500/50";
}

function riskColor(risk: string): string {
  if (risk.toLowerCase() === "low") return "text-emerald-400";
  if (risk.toLowerCase() === "moderate") return "text-yellow-400";
  return "text-red-400";
}

function riskBg(risk: string): string {
  if (risk.toLowerCase() === "low") return "bg-emerald-500/10 border-emerald-500/20";
  if (risk.toLowerCase() === "moderate") return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

const TRAIT_DESCRIPTIONS: Record<string, string> = {
  Openness: "Innovation, curiosity, willingness to explore new approaches",
  Conscientiousness: "Reliability, attention to detail, follow-through on commitments",
  Extraversion: "Collaboration energy, community engagement, communication initiative",
  Agreeableness: "Team harmony, constructive feedback, supportive mentoring",
  Stability: "Resilience under pressure, emotional consistency, steady performance",
};

/* ─────────────────────────── Component ─────────────────────────── */

export default function SharedReportPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [profile, setProfile] = useState<SharedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/shared-profile/${reportId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Profile not found");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-zinc-400 text-sm font-medium">Loading profile report...</p>
            <p className="text-zinc-600 text-xs mt-1">Powered by RecruitOS</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error / Not Found ─── */
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-zinc-500" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-200 mb-2">
            Profile Not Found
          </h1>
          <p className="text-zinc-500 text-sm mb-6">
            This report may have expired or the link may be invalid.
            Shared reports are available for 90 days.
          </p>
          <a
            href="https://recruitos.xyz"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            Learn more about RecruitOS →
          </a>
        </div>
      </div>
    );
  }

  const d = profile.data;
  const persona = d.persona;
  const hasBigFive = !!persona?.psychometric?.bigFive;
  const hasBreakdown = !!d.scoreBreakdown;
  const hasCareer = !!persona?.careerTrajectory;
  const reportDate = new Date(profile.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bigFiveData = hasBigFive
    ? [
        { trait: "Openness", value: persona!.psychometric.bigFive!.openness, fullMark: 10 },
        { trait: "Conscientiousness", value: persona!.psychometric.bigFive!.conscientiousness, fullMark: 10 },
        { trait: "Extraversion", value: persona!.psychometric.bigFive!.extraversion, fullMark: 10 },
        { trait: "Agreeableness", value: persona!.psychometric.bigFive!.agreeableness, fullMark: 10 },
        { trait: "Stability", value: 10 - persona!.psychometric.bigFive!.neuroticism, fullMark: 10 },
      ]
    : [];

  const breakdownEntries = hasBreakdown
    ? [
        { label: "Skills Match", pct: d.scoreBreakdown!.skills?.percentage ?? 0, icon: Zap },
        { label: "Experience", pct: d.scoreBreakdown!.experience?.percentage ?? 0, icon: TrendingUp },
        { label: "Industry Fit", pct: d.scoreBreakdown!.industry?.percentage ?? 0, icon: Briefcase },
        { label: "Seniority", pct: d.scoreBreakdown!.seniority?.percentage ?? 0, icon: Users },
        { label: "Location", pct: d.scoreBreakdown!.location?.percentage ?? 0, icon: MapPin },
      ]
    : [];

  return (
    <>
      {/* ─── Print Styles ─── */}
      <style jsx global>{`
        @media print {
          html, body { background: #fff !important; color: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid { page-break-inside: avoid; }
          .report-page { background: #fff !important; }
          .rp-card { background: #f9fafb !important; border-color: #e5e7eb !important; }
          .rp-card h3, .rp-card h4, .rp-card p, .rp-card span, .rp-card li, .rp-card div { color: #374151 !important; }
          .rp-card .rp-heading { color: #111827 !important; }
          .rp-header { background: #f3f4f6 !important; border-color: #d1d5db !important; }
          .rp-header * { color: #111827 !important; }
          .rp-badge { background: #e5e7eb !important; color: #374151 !important; border: none !important; }
          .rp-bar-track { background: #e5e7eb !important; }
          .rp-green { background: #ecfdf5 !important; border-color: #a7f3d0 !important; }
          .rp-green * { color: #065f46 !important; }
          .rp-red { background: #fef2f2 !important; border-color: #fecaca !important; }
          .rp-red * { color: #991b1b !important; }
          .print-brand { display: block !important; }
        }
        @page { margin: 0.75in; }
      `}</style>

      <div className="report-page min-h-screen bg-[#0a0a0f] text-zinc-100">
        {/* ════════════════════════ Floating Toolbar ════════════════════════ */}
        <div className="no-print sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-zinc-800/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-sm text-zinc-200">RecruitOS</span>
                <span className="text-zinc-600 text-xs ml-2">Virtual Personality Profile</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors border border-zinc-700/50"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* ════════════════════════ HEADER ════════════════════════ */}
          <header className="rp-header rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 p-6 sm:p-8 mb-8 backdrop-blur-sm">
            {/* Branding bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Target className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-wide text-zinc-200">
                    RecruitOS
                  </span>
                  <span className="text-zinc-600 text-xs block">recruitos.xyz</span>
                </div>
              </div>
              <div className="text-right text-xs text-zinc-500 space-y-0.5">
                <p className="font-medium text-zinc-400">Virtual Personality Profile</p>
                <p>{reportDate}</p>
                <div className="flex items-center gap-3 justify-end mt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {profile.viewCount} views
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {d.avatar && (
                <img
                  src={d.avatar}
                  alt={d.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-zinc-700/50 shadow-xl"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {d.name}
                </h1>
                {d.currentRole && (
                  <p className="text-zinc-400 mt-1 text-sm sm:text-base">{d.currentRole}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-zinc-500">
                  {d.company && (
                    <span className="flex items-center gap-1.5 bg-zinc-800/50 px-2.5 py-1 rounded-md">
                      <Briefcase className="w-3.5 h-3.5" />
                      {d.company}
                    </span>
                  )}
                  {d.location && (
                    <span className="flex items-center gap-1.5 bg-zinc-800/50 px-2.5 py-1 rounded-md">
                      <MapPin className="w-3.5 h-3.5" />
                      {d.location}
                    </span>
                  )}
                  {d.yearsExperience != null && d.yearsExperience > 0 && (
                    <span className="flex items-center gap-1.5 bg-zinc-800/50 px-2.5 py-1 rounded-md">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {d.yearsExperience} years
                    </span>
                  )}
                </div>
              </div>

              {/* Score ring */}
              {d.alignmentScore > 0 && (
                <div className="flex-shrink-0">
                  <div
                    className={`relative w-28 h-28 rounded-full border-[3px] ${scoreBorderColor(d.alignmentScore)} flex flex-col items-center justify-center bg-gradient-to-br ${scoreBg(d.alignmentScore)}`}
                  >
                    <span className={`text-4xl font-black ${scoreColor(d.alignmentScore)}`}>
                      {d.alignmentScore}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                      {scoreLabel(d.alignmentScore)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            {d.skills.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-800/60">
                <div className="flex flex-wrap gap-2">
                  {d.skills.slice(0, 12).map((skill) => (
                    <span
                      key={skill}
                      className="rp-badge px-3 py-1.5 bg-zinc-800/60 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* ════════════════════════ EXECUTIVE SUMMARY ════════════════════════ */}
          {persona && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                Executive Summary
              </h3>

              {/* Archetype */}
              <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/8 to-transparent border border-purple-500/20 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-xs uppercase tracking-widest text-purple-400/80 font-semibold">
                    Personality Archetype
                  </span>
                </div>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
                  {persona.archetype}
                </p>
                {persona.reasoning && (
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    {persona.reasoning}
                  </p>
                )}
              </div>

              {/* Psychometric grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Communication",
                    value: persona.psychometric.communicationStyle,
                    icon: MessageSquare,
                    color: "text-sky-400",
                    bg: "bg-sky-500/10",
                  },
                  {
                    label: "Primary Motivator",
                    value: persona.psychometric.primaryMotivator,
                    icon: Sparkles,
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                  },
                  {
                    label: "Risk Tolerance",
                    value: persona.psychometric.riskTolerance,
                    icon: Shield,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                  },
                  {
                    label: "Leadership",
                    value: persona.psychometric.leadershipPotential,
                    icon: TrendingUp,
                    color: "text-rose-400",
                    bg: "bg-rose-500/10",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-md ${item.bg}`}>
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium block mb-1">
                      {item.label}
                    </span>
                    <p className="text-sm font-semibold text-zinc-200">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ════════════════════════ ALIGNMENT BREAKDOWN ════════════════════════ */}
          {hasBreakdown && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                Alignment Breakdown
              </h3>
              <div className="space-y-4">
                {breakdownEntries.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400 flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-zinc-500" />
                        {item.label}
                      </span>
                      <span className={`font-semibold tabular-nums ${scoreColor(item.pct)}`}>
                        {Math.round(item.pct)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-zinc-800/80 rp-bar-track rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ════════════════════════ BIG FIVE RADAR ════════════════════════ */}
          {hasBigFive && (
            <section className="rp-card print-avoid print-break rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>
                Big Five Personality Profile
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Radar */}
                <div className="h-80 bg-zinc-800/20 rounded-xl p-4 border border-zinc-700/20">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={bigFiveData} cx="50%" cy="50%" outerRadius="72%">
                      <PolarGrid stroke="#3f3f46" strokeOpacity={0.6} gridType="polygon" />
                      <PolarAngleAxis
                        dataKey="trait"
                        tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar
                        name="Personality"
                        dataKey="value"
                        stroke="#6366f1"
                        fill="url(#radarGradient)"
                        fillOpacity={0.35}
                        strokeWidth={2.5}
                        dot={{ r: 5, fill: "#6366f1", stroke: "#4338ca", strokeWidth: 2 }}
                      />
                      <defs>
                        <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Trait bars */}
                <div className="space-y-5">
                  {bigFiveData.map((trait) => (
                    <div key={trait.trait}>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm font-semibold text-zinc-200">{trait.trait}</span>
                        <span className="text-xs text-zinc-500 tabular-nums font-medium">
                          {trait.value.toFixed(1)} / 10
                        </span>
                      </div>
                      <div className="h-2.5 bg-zinc-800/80 rp-bar-track rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-400 transition-all duration-700"
                          style={{ width: `${trait.value * 10}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                        {TRAIT_DESCRIPTIONS[trait.trait] ?? ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════ STRENGTHS & RISKS ════════════════════════ */}
          {persona &&
            ((persona.greenFlags?.length ?? 0) > 0 ||
              (persona.redFlags?.length ?? 0) > 0) && (
              <div className="print-avoid grid md:grid-cols-2 gap-6 mb-6">
                {/* Green Flags */}
                {persona.greenFlags?.length > 0 && (
                  <section className="rp-card rp-green rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                    <h3 className="rp-heading text-lg font-semibold text-emerald-400 flex items-center gap-2.5 mb-5">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      Strengths
                    </h3>
                    <ul className="space-y-3">
                      {persona.greenFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Red Flags */}
                {persona.redFlags?.length > 0 && (
                  <section className="rp-card rp-red rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
                    <h3 className="rp-heading text-lg font-semibold text-red-400 flex items-center gap-2.5 mb-5">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      Areas to Explore
                    </h3>
                    <ul className="space-y-3">
                      {persona.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

          {/* ════════════════════════ KEY EVIDENCE ════════════════════════ */}
          {d.keyEvidence && d.keyEvidence.length > 0 && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                Key Evidence &amp; Strengths
              </h3>
              <ul className="space-y-3">
                {d.keyEvidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{item.claim}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ════════════════════════ RISKS ════════════════════════ */}
          {d.risks && d.risks.length > 0 && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                Areas to Explore
              </h3>
              <ul className="space-y-3">
                {d.risks.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      !
                    </span>
                    <span className="leading-relaxed">{item.claim}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ════════════════════════ SOFT SKILLS ════════════════════════ */}
          {persona && persona.softSkills?.length > 0 && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                Soft Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {persona.softSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="rp-badge px-3.5 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-xl text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ════════════════════════ CAREER TRAJECTORY ════════════════════════ */}
          {hasCareer && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                Career Trajectory
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Growth Velocity", value: persona!.careerTrajectory!.growthVelocity },
                  { label: "Promotion Freq.", value: persona!.careerTrajectory!.promotionFrequency },
                  { label: "Role Progression", value: persona!.careerTrajectory!.roleProgression },
                  { label: "Avg. Tenure", value: persona!.careerTrajectory!.averageTenure },
                  { label: "Tenure Pattern", value: persona!.careerTrajectory!.tenurePattern },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-2">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-zinc-200 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ════════════════════════ TEAM FIT ANALYSIS ════════════════════════ */}
          {persona && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Users className="w-5 h-5 text-orange-400" />
                </div>
                Team Fit Analysis
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Communication Style Detail */}
                <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                      Communication Style
                    </span>
                  </div>
                  <p className="text-base font-semibold text-zinc-200 mb-2">
                    {persona.psychometric.communicationStyle}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {persona.psychometric.communicationStyle.toLowerCase().includes("direct")
                      ? "Prefers clear, concise communication. Best paired with team members who value efficiency and straightforward feedback."
                      : persona.psychometric.communicationStyle.toLowerCase().includes("collaborative")
                      ? "Excels in team discussions and brainstorming. Naturally builds consensus and ensures all voices are heard."
                      : persona.psychometric.communicationStyle.toLowerCase().includes("analytical")
                      ? "Data-driven communicator who backs arguments with evidence. Excellent for technical discussions and code reviews."
                      : "Adapts communication approach based on context. Flexible in team dynamics and cross-functional collaboration."}
                  </p>
                </div>

                {/* Work Style */}
                <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                      Work Approach
                    </span>
                  </div>
                  <p className="text-base font-semibold text-zinc-200 mb-2">
                    {persona.psychometric.primaryMotivator}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {persona.psychometric.riskTolerance.toLowerCase() === "high"
                      ? "Thrives in fast-paced environments with ambiguity. Great for startups and innovation-driven teams."
                      : persona.psychometric.riskTolerance.toLowerCase() === "moderate"
                      ? "Balanced approach to risk-taking. Comfortable with calculated changes while maintaining stability."
                      : "Prefers structured environments with clear processes. Excellent for maintaining quality and consistency."}
                  </p>
                </div>

                {/* Leadership */}
                <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                    <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                      Leadership Potential
                    </span>
                  </div>
                  <p className="text-base font-semibold text-zinc-200 mb-2">
                    {persona.psychometric.leadershipPotential}
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {persona.psychometric.leadershipPotential.toLowerCase().includes("high") ||
                    persona.psychometric.leadershipPotential.toLowerCase().includes("strong")
                      ? "Shows natural leadership qualities. Could grow into tech lead or architect roles with the right mentoring."
                      : persona.psychometric.leadershipPotential.toLowerCase().includes("moderate")
                      ? "Situational leader who steps up when expertise is needed. Strong individual contributor with mentoring ability."
                      : "Thrives as a deep individual contributor. Influences through expertise rather than formal authority."}
                  </p>
                </div>

                {/* Risk Profile */}
                <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                      Risk Profile
                    </span>
                  </div>
                  <p className="text-base font-semibold text-zinc-200 mb-2">
                    {persona.psychometric.riskTolerance} Risk Tolerance
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {hasCareer && persona.careerTrajectory!.tenurePattern === "stable"
                      ? "Shows consistent career choices and loyalty. Low flight risk in the right environment."
                      : hasCareer && persona.careerTrajectory!.tenurePattern === "job-hopper"
                      ? "Explores opportunities actively. Ensure role offers growth and challenge to retain."
                      : "Career pattern suggests adaptability and openness to new challenges."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ════════════════════════ CORE SKILLS MATRIX ════════════════════════ */}
          {persona?.skillProfile?.coreSkills && persona.skillProfile.coreSkills.length > 0 && (
            <section className="rp-card print-avoid rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 mb-6">
              <h3 className="rp-heading text-lg font-semibold text-white flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Zap className="w-5 h-5 text-teal-400" />
                </div>
                Core Skills Matrix
                {persona.skillProfile.depthVsBreadth && (
                  <span className="ml-3 text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 font-medium capitalize">
                    {persona.skillProfile.depthVsBreadth}
                  </span>
                )}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {persona.skillProfile.coreSkills.map((skill, i) => (
                  <div
                    key={i}
                    className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{skill.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {skill.yearsActive > 0 ? `${skill.yearsActive}+ years` : "Active"}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        skill.proficiency.toLowerCase() === "expert"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : skill.proficiency.toLowerCase() === "advanced"
                          ? "bg-blue-500/15 text-blue-400"
                          : skill.proficiency.toLowerCase() === "intermediate"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      {skill.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ════════════════════════ FOOTER ════════════════════════ */}
          <footer className="mt-12 pt-8 border-t border-zinc-800/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/15">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-300 block">RecruitOS</span>
                  <span className="text-zinc-600">AI-Powered Talent Intelligence</span>
                </div>
              </div>
              <p className="text-center sm:text-right max-w-md leading-relaxed">
                This report is generated using AI analysis of publicly available professional data.
                It should be used as a decision-support tool alongside traditional hiring processes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-600">
              <span>Report ID: {profile.id}</span>
              <span>Generated {reportDate} · Confidential</span>
              <span>recruitos.xyz</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

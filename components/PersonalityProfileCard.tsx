"use client";

import { useState } from "react";
import {
  PersonalityProfile,
  PersonalityDimension,
  PersonalityTrait,
} from "@/services/personalityService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Activity,
  Users,
  Code,
  Rocket,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface PersonalityProfileCardProps {
  profile: PersonalityProfile;
}

// ─── Icon map ─────────────────────────────────────────────────────────
const DIMENSION_ICONS: Record<string, React.ElementType> = {
  MessageSquare,
  Activity,
  Users,
  Code,
  Rocket,
};

// ─── Color palette per dimension ──────────────────────────────────────
const DIMENSION_COLORS: Record<string, { gradient: string; accent: string; bg: string }> = {
  Communication: {
    gradient: "from-blue-500 to-cyan-400",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  "Work Pattern": {
    gradient: "from-amber-500 to-orange-400",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  Collaboration: {
    gradient: "from-green-500 to-emerald-400",
    accent: "text-green-400",
    bg: "bg-green-500/10",
  },
  "Technical Profile": {
    gradient: "from-purple-500 to-violet-400",
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  Initiative: {
    gradient: "from-rose-500 to-pink-400",
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
  },
};

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 45) return "text-amber-400";
  return "text-muted-foreground";
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-muted-foreground";
}

// ─── Confidence ring (reused pattern) ─────────────────────────────────
function ConfidenceRing({ confidence }: { confidence: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="url(#personalityGradient)"
          strokeWidth="6" strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="personalityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {confidence}%
        </motion.span>
        <span className="text-[9px] text-muted-foreground">confidence</span>
      </div>
    </div>
  );
}

// ─── Dimension row ────────────────────────────────────────────────────
function DimensionRow({ dimension }: { dimension: PersonalityDimension }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = DIMENSION_ICONS[dimension.icon] || Activity;
  const colors = DIMENSION_COLORS[dimension.label] || DIMENSION_COLORS.Communication;

  return (
    <div className="group">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted/20 transition-colors"
      >
        {/* Icon */}
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-4 h-4 ${colors.accent}`} />
        </div>

        {/* Label + sublabel */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{dimension.label}</span>
            <span className={`text-xs font-bold ${getScoreColor(dimension.score)}`}>
              {dimension.score}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{dimension.sublabel}</p>
        </div>

        {/* Score bar */}
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden shrink-0">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${dimension.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Expand arrow */}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded traits */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-12 mr-2 pb-3 space-y-2">
              {dimension.traits.map((trait, i) => (
                <motion.div
                  key={trait.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/10"
                >
                  <span className="text-muted-foreground">{trait.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{trait.value}</span>
                    {trait.detail && (
                      <span className="text-muted-foreground/60 hidden sm:inline">
                        ({trait.detail})
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────
export default function PersonalityProfileCard({ profile }: PersonalityProfileCardProps) {
  const dimensions = [
    profile.communicationStyle,
    profile.workPattern,
    profile.collaborationScore,
    profile.technicalProfile,
    profile.initiative,
  ];

  // Radar data
  const radarData = dimensions.map((d) => ({
    trait: d.label.replace("Technical Profile", "Tech"),
    value: d.score,
    fullMark: 100,
  }));

  // Overall score (weighted average)
  const overallScore = Math.round(
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length
  );

  return (
    <div className="space-y-6">
      {/* Header Card — Persona + Radar */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20"
              >
                <Fingerprint className="w-6 h-6 text-purple-400" />
              </motion.div>
              <div>
                <CardTitle className="text-lg">Personality Profile</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white text-[10px] px-2 py-0">
                    {profile.personaTag}
                  </Badge>
                  <span className={`text-sm font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}/100
                  </span>
                </div>
              </div>
            </div>
            <ConfidenceRing confidence={profile.confidence} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <motion.p
            className="text-sm text-muted-foreground mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {profile.summary}
          </motion.p>

          {/* Radar Chart */}
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
                  tickCount={5}
                />
                <Radar
                  name="Personality"
                  dataKey="value"
                  stroke="#a855f7"
                  fill="url(#radarFill)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Dimension Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Click any dimension to see detailed trait analysis
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-border/30">
          {dimensions.map((dim) => (
            <DimensionRow key={dim.label} dimension={dim} />
          ))}
        </CardContent>
      </Card>

      {/* Data notice */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground/60 px-2">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          {profile.confidence > 30
            ? "Profile generated from public GitHub activity. Accuracy improves with more data points."
            : "Profile generated from public information (no GitHub activity found)."}
          {" "}Confidence: {profile.confidence}%.
        </span>
      </div>
    </div>
  );
}

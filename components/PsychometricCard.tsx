"use client";

import { useState } from "react";
import { PsychometricProfile, ArchetypeType } from "@/lib/psychometrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Users,
  Lightbulb,
  Zap,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Snowflake,
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

interface PsychometricCardProps {
  profile: PsychometricProfile;
}

const archetypeIcons: Record<ArchetypeType, string> = {
  "The Architect": "🏗️",
  "The Optimizer": "⚡",
  "The Collaborator": "🤝",
  "The Pioneer": "🚀",
  "The Craftsman": "🎨",
  "The Mentor": "🎓",
  "The Strategist": "♟️",
  "The Specialist": "🔬",
};

const archetypeColors: Record<ArchetypeType, { gradient: string; primary: string }> = {
  "The Architect": { gradient: "from-blue-500 to-cyan-500", primary: "#3b82f6" },
  "The Optimizer": { gradient: "from-yellow-500 to-orange-500", primary: "#f59e0b" },
  "The Collaborator": { gradient: "from-green-500 to-emerald-500", primary: "#22c55e" },
  "The Pioneer": { gradient: "from-purple-500 to-pink-500", primary: "#a855f7" },
  "The Craftsman": { gradient: "from-rose-500 to-red-500", primary: "#f43f5e" },
  "The Mentor": { gradient: "from-teal-500 to-cyan-500", primary: "#14b8a6" },
  "The Strategist": { gradient: "from-indigo-500 to-purple-500", primary: "#6366f1" },
  "The Specialist": { gradient: "from-amber-500 to-yellow-500", primary: "#f59e0b" },
};

// Animated confidence ring component
function ConfidenceRing({ confidence, color }: { confidence: number; color: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {confidence}%
        </motion.span>
        <span className="text-[10px] text-muted-foreground">confidence</span>
      </div>
    </div>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  className = ""
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Interview question with copy button
function InterviewQuestion({ question, index }: { question: string; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(question);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.li
      className="flex gap-3 group p-2 rounded-lg hover:bg-muted/30 transition-colors"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <span className="text-primary font-medium shrink-0">{index + 1}.</span>
      <span className="text-sm flex-1">{question}</span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
        title="Copy question"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </motion.li>
  );
}

export default function PsychometricCard({ profile }: PsychometricCardProps) {
  const { archetype, workStyle, motivators, stressors, greenFlags, redFlags, interviewQuestions, outreachTips, confidence } = profile;
  const colorConfig = archetypeColors[archetype.primary];

  // Prepare radar chart data
  const radarData = [
    { trait: "Autonomy", value: workStyle.autonomy, fullMark: 100 },
    { trait: "Collaboration", value: workStyle.collaboration, fullMark: 100 },
    { trait: "Structure", value: workStyle.structure, fullMark: 100 },
    { trait: "Pace", value: workStyle.pacePreference === "fast" ? 90 : workStyle.pacePreference === "steady" ? 60 : 30, fullMark: 100 },
    { trait: "Analysis", value: workStyle.decisionMaking === "analytical" ? 90 : workStyle.decisionMaking === "consensus" ? 60 : 30, fullMark: 100 },
    { trait: "Directness", value: workStyle.feedbackStyle === "direct" ? 90 : workStyle.feedbackStyle === "data-driven" ? 60 : 30, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Archetype Card - Enhanced with confidence ring */}
      <Card className="overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${colorConfig.gradient}`} />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.span
                className="text-5xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {archetypeIcons[archetype.primary]}
              </motion.span>
              <div>
                <CardTitle className="text-xl">{archetype.primary}</CardTitle>
                {archetype.secondary && (
                  <p className="text-sm text-muted-foreground">
                    with {archetypeIcons[archetype.secondary]} {archetype.secondary} tendencies
                  </p>
                )}
              </div>
            </div>
            <ConfidenceRing confidence={confidence} color={colorConfig.primary} />
          </div>
        </CardHeader>
        <CardContent>
          <motion.p
            className="text-muted-foreground mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {archetype.description}
          </motion.p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                Strengths
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {archetype.strengths.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <Badge variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-500" />
                Blind Spots
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {archetype.blindSpots.map((b, i) => (
                  <motion.div
                    key={b}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <Badge variant="outline" className="text-xs">
                      {b}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Style - Radar Chart */}
      <CollapsibleSection title="Work Style Profile" icon={Users}>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Radar Chart */}
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="Work Style"
                  dataKey="value"
                  stroke={colorConfig.primary}
                  fill={colorConfig.primary}
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Style badges */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Pace</p>
                <Badge variant="secondary" className="capitalize">{workStyle.pacePreference}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Feedback</p>
                <Badge variant="secondary" className="capitalize">{workStyle.feedbackStyle}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Decisions</p>
                <Badge variant="secondary" className="capitalize">{workStyle.decisionMaking}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Independence</span>
                <span>{workStyle.autonomy > 60 ? "Prefers autonomy" : "Welcomes guidance"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teamwork</span>
                <span>{workStyle.collaboration > 60 ? "Team-oriented" : "Solo contributor"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span>{workStyle.structure > 60 ? "Structured" : "Flexible"}</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Flags */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              Green Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {greenFlags.length > 0 ? (
              <ul className="space-y-2">
                {greenFlags.map((flag, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {flag}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Analyzing profile data...</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              Areas to Explore
            </CardTitle>
          </CardHeader>
          <CardContent>
            {redFlags.length > 0 ? (
              <ul className="space-y-2">
                {redFlags.map((flag, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                    {flag}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No significant concerns identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Motivators vs Stressors - Visual Balance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-center gap-4">
            <span className="flex items-center gap-1 text-green-500">
              <Flame className="w-5 h-5" />
              Energizers
            </span>
            <span className="text-muted-foreground">vs</span>
            <span className="flex items-center gap-1 text-blue-500">
              <Snowflake className="w-5 h-5" />
              Drains
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Motivators side */}
            <div className="flex-1 space-y-2">
              {motivators.map((m, i) => (
                <motion.div
                  key={m}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 text-right">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                      {m}
                    </Badge>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px bg-border" />

            {/* Stressors side */}
            <div className="flex-1 space-y-2">
              {stressors.map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <Badge variant="outline" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/20">
                      {s}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Questions - With Copy */}
      <CollapsibleSection title="Interview Questions" icon={MessageSquare}>
        <ol className="space-y-1">
          {interviewQuestions.map((q, i) => (
            <InterviewQuestion key={i} question={q} index={i} />
          ))}
        </ol>
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => {
              const allQuestions = interviewQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
              navigator.clipboard.writeText(allQuestions);
            }}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            Copy all questions
          </button>
        </div>
      </CollapsibleSection>

      {/* Outreach Tips */}
      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Outreach Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {outreachTips.map((tip, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2 text-sm p-2 rounded-lg hover:bg-primary/5 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-primary text-lg">→</span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

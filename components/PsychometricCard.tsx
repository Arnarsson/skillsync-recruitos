"use client";

import { PsychometricProfile, ArchetypeType } from "@/lib/psychometrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";

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

const archetypeColors: Record<ArchetypeType, string> = {
  "The Architect": "from-blue-500 to-cyan-500",
  "The Optimizer": "from-yellow-500 to-orange-500",
  "The Collaborator": "from-green-500 to-emerald-500",
  "The Pioneer": "from-purple-500 to-pink-500",
  "The Craftsman": "from-rose-500 to-red-500",
  "The Mentor": "from-teal-500 to-cyan-500",
  "The Strategist": "from-indigo-500 to-purple-500",
  "The Specialist": "from-amber-500 to-yellow-500",
};

export default function PsychometricCard({ profile }: PsychometricCardProps) {
  const { archetype, workStyle, communicationStyle, motivators, stressors, teamDynamics, greenFlags, redFlags, interviewQuestions, outreachTips, confidence } = profile;

  return (
    <div className="space-y-6">
      {/* Archetype Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${archetypeColors[archetype.primary]}`} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{archetypeIcons[archetype.primary]}</span>
              <div>
                <CardTitle className="text-xl">{archetype.primary}</CardTitle>
                {archetype.secondary && (
                  <p className="text-sm text-muted-foreground">
                    with {archetypeIcons[archetype.secondary]} {archetype.secondary} tendencies
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Brain className="w-3 h-3" />
              {confidence}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{archetype.description}</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                Strengths
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {archetype.strengths.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-500" />
                Blind Spots
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {archetype.blindSpots.map((b) => (
                  <Badge key={b} variant="outline" className="text-xs">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Work Style Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Autonomy</span>
                <span className="text-muted-foreground">
                  {workStyle.autonomy > 60 ? "Prefers independence" : "Welcomes guidance"}
                </span>
              </div>
              <Progress value={workStyle.autonomy} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Collaboration</span>
                <span className="text-muted-foreground">
                  {workStyle.collaboration > 60 ? "Team-oriented" : "Solo contributor"}
                </span>
              </div>
              <Progress value={workStyle.collaboration} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Structure</span>
                <span className="text-muted-foreground">
                  {workStyle.structure > 60 ? "Organized" : "Flexible"}
                </span>
              </div>
              <Progress value={workStyle.structure} className="h-2" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pace</p>
              <Badge variant="secondary" className="capitalize">{workStyle.pacePreference}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Feedback</p>
              <Badge variant="secondary" className="capitalize">{workStyle.feedbackStyle}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Decisions</p>
              <Badge variant="secondary" className="capitalize">{workStyle.decisionMaking}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flags */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              Green Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {greenFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
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
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No significant concerns identified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Motivators */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Motivators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {motivators.map((m) => (
                <Badge key={m} className="bg-primary/10 text-primary border-primary/20">
                  {m}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Stressors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stressors.map((s) => (
                <Badge key={s} variant="outline" className="border-destructive/30 text-destructive">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Suggested Interview Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {interviewQuestions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary font-medium">{i + 1}.</span>
                <span className="text-sm">{q}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Outreach Tips */}
      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Outreach Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {outreachTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

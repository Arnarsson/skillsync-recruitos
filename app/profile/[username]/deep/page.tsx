"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Loader2,
  User,
  MapPin,
  Briefcase,
  Star,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Brain,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import OutreachModal from "@/components/OutreachModal";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";

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
}

interface Persona {
  archetype: string;
  psychometric: {
    communicationStyle: string;
    primaryMotivator: string;
    riskTolerance: string;
    leadershipPotential: string;
  };
  softSkills: string[];
  redFlags: string[];
  greenFlags: string[];
  reasoning: string;
  careerTrajectory?: {
    growthVelocity: "rapid" | "steady" | "slow";
    promotionFrequency: "high" | "moderate" | "low";
    roleProgression: "vertical" | "lateral" | "mixed";
    industryPivots: number;
    leadershipGrowth: "ascending" | "stable" | "declining";
    averageTenure: string;
    tenurePattern: "stable" | "job-hopper" | "long-term";
  };
  skillProfile?: {
    coreSkills: Array<{ name: string; proficiency: string; yearsActive: number }>;
    emergingSkills: string[];
    deprecatedSkills: string[];
    skillGaps: string[];
    adjacentSkills: string[];
    depthVsBreadth: "specialist" | "generalist" | "t-shaped";
  };
  riskAssessment?: {
    attritionRisk: "low" | "moderate" | "high";
    flightRiskFactors: string[];
    skillObsolescenceRisk: "low" | "moderate" | "high";
    geographicBarriers: string[];
    unexplainedGaps: boolean;
    compensationRiskLevel: "low" | "moderate" | "high";
  };
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
  yearsExperience?: number;
  shortlistSummary?: string;
  keyEvidence?: string[];
  risks?: string[];
  scoreBreakdown?: {
    skills: { value: number; max: number; percentage: number };
    experience: { value: number; max: number; percentage: number };
    industry: { value: number; max: number; percentage: number };
    seniority: { value: number; max: number; percentage: number };
    location: { value: number; max: number; percentage: number };
  };
  persona?: Persona;
  deepProfile?: DeepProfile;
}

export default function DeepProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") !== null;
  const adminSuffix = isAdmin ? "?admin" : "";
  const username = params.username as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "persona">("overview");
  const [showOutreach, setShowOutreach] = useState(false);
  const [jobContext, setJobContext] = useState<{
    title?: string;
    company?: string;
    requiredSkills?: string[];
  } | null>(null);

  useEffect(() => {
    // Load candidate from localStorage
    const stored = localStorage.getItem("apex_candidates");
    if (stored) {
      try {
        const candidates = JSON.parse(stored) as Candidate[];
        const found = candidates.find((c) => c.id === username);
        if (found) {
          setCandidate(found);
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Load job context
    const storedJob = localStorage.getItem("apex_job_context");
    if (storedJob) {
      try {
        setJobContext(JSON.parse(storedJob));
      } catch {
        // Ignore parse errors
      }
    }

    setLoading(false);
  }, [username]);

  const runDeepAnalysis = useCallback(async () => {
    if (!candidate) return;
    setAnalyzing(true);

    try {
      const response = await fetch("/api/profile/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          candidateName: candidate.name,
          currentRole: candidate.currentRole,
          company: candidate.company,
          location: candidate.location,
          skills: candidate.skills,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedCandidate = {
          ...candidate,
          persona: data.persona,
          deepProfile: data.deepProfile,
          scoreBreakdown: data.scoreBreakdown,
          keyEvidence: data.keyEvidence,
          risks: data.risks,
        };
        setCandidate(updatedCandidate);

        // Update localStorage
        const stored = localStorage.getItem("apex_candidates");
        if (stored) {
          const candidates = JSON.parse(stored) as Candidate[];
          const index = candidates.findIndex((c) => c.id === username);
          if (index !== -1) {
            candidates[index] = updatedCandidate;
            localStorage.setItem("apex_candidates", JSON.stringify(candidates));
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  }, [candidate, username]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskColor = (risk?: string) => {
    if (risk === "low") return "text-green-500";
    if (risk === "moderate") return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Candidate Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This candidate is not in your pipeline.
          </p>
          <Link href={`/pipeline${adminSuffix}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pipeline
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const radarData = candidate.scoreBreakdown
    ? [
        { subject: "Skills", value: candidate.scoreBreakdown.skills?.percentage || 0 },
        { subject: "Exp.", value: candidate.scoreBreakdown.experience?.percentage || 0 },
        { subject: "Industry", value: candidate.scoreBreakdown.industry?.percentage || 0 },
        { subject: "Seniority", value: candidate.scoreBreakdown.seniority?.percentage || 0 },
        { subject: "Location", value: candidate.scoreBreakdown.location?.percentage || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/pipeline${adminSuffix}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <Badge className="mb-2 bg-primary/20 text-primary">Step 3 of 4</Badge>
            <h1 className="text-3xl font-bold">Deep Profile</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runDeepAnalysis}
              disabled={analyzing}
              variant="outline"
              className="gap-2"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {candidate.persona ? "Refresh Analysis" : "Run AI Analysis"}
            </Button>
            <Button
              onClick={() => setShowOutreach(true)}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Generate Outreach
            </Button>
          </div>
        </div>

        {/* Profile Hero */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-24 h-24 rounded-full border-4 border-background"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{candidate.name}</h2>
                    <p className="text-muted-foreground">{candidate.currentRole}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-4xl font-bold ${getScoreColor(
                        candidate.alignmentScore
                      )}`}
                    >
                      {candidate.alignmentScore}
                    </div>
                    <p className="text-xs text-muted-foreground">Alignment Score</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {candidate.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {candidate.location}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {candidate.skills.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Overview
          </Button>
          <Button
            variant={activeTab === "questions" ? "default" : "ghost"}
            onClick={() => setActiveTab("questions")}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Interview Guide
          </Button>
          <Button
            variant={activeTab === "persona" ? "default" : "ghost"}
            onClick={() => setActiveTab("persona")}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            Persona
          </Button>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alignment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {radarData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Run AI Analysis to see score breakdown
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Key Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.keyEvidence && candidate.keyEvidence.length > 0 ? (
                  <ul className="space-y-3">
                    {candidate.keyEvidence.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Run AI Analysis to see evidence
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Risks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Potential Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.risks && candidate.risks.length > 0 ? (
                  <ul className="space-y-3">
                    {candidate.risks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Run AI Analysis to see gaps
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            {candidate.scoreBreakdown && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: "skills", label: "Technical Skills" },
                    { key: "experience", label: "Experience" },
                    { key: "industry", label: "Industry Fit" },
                    { key: "seniority", label: "Seniority Match" },
                    { key: "location", label: "Location" },
                  ].map(({ key, label }) => {
                    const component =
                      candidate.scoreBreakdown?.[
                        key as keyof typeof candidate.scoreBreakdown
                      ];
                    if (!component) return null;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{label}</span>
                          <span className={getScoreColor(component.percentage)}>
                            {component.percentage}%
                          </span>
                        </div>
                        <Progress
                          value={component.percentage}
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "questions" && (
          <Card>
            <CardHeader>
              <CardTitle>Interview Guide</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.deepProfile?.questions &&
              candidate.deepProfile.questions.length > 0 ? (
                <div className="space-y-6">
                  {candidate.deepProfile.questions.map((q, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{q.category}</Badge>
                      </div>
                      <h4 className="font-medium mb-2">{q.question}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {q.context}
                      </p>
                      <div className="text-sm bg-background p-3 rounded border">
                        <span className="font-medium">Expected Answer: </span>
                        {q.expectedAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Run AI Analysis to generate interview questions
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "persona" && (
          <div className="space-y-6">
            {candidate.persona ? (
              <>
                {/* Archetype */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Archetype
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg">{candidate.persona.archetype}</p>
                  </CardContent>
                </Card>

                {/* Psychometric */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Psychometric Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Communication:</span>
                        <span>{candidate.persona.psychometric.communicationStyle}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Motivator:</span>
                        <span>{candidate.persona.psychometric.primaryMotivator}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Risk Tolerance:</span>
                        <span>{candidate.persona.psychometric.riskTolerance}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Leadership:</span>
                        <span>{candidate.persona.psychometric.leadershipPotential}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {candidate.persona.careerTrajectory && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Career Trajectory
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Growth:</span>
                          <span className="capitalize">
                            {candidate.persona.careerTrajectory.growthVelocity}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Promotions:</span>
                          <span className="capitalize">
                            {candidate.persona.careerTrajectory.promotionFrequency}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Tenure:</span>
                          <span>{candidate.persona.careerTrajectory.averageTenure}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pattern:</span>
                          <span className="capitalize">
                            {candidate.persona.careerTrajectory.tenurePattern}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Flags */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        Green Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.persona.greenFlags.map((flag, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        Red Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.persona.redFlags.length > 0 ? (
                          candidate.persona.redFlags.map((flag, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                              {flag}
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">No red flags identified</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Assessment */}
                {candidate.persona.riskAssessment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">
                            Attrition Risk
                          </p>
                          <p
                            className={`text-lg font-bold capitalize ${getRiskColor(
                              candidate.persona.riskAssessment.attritionRisk
                            )}`}
                          >
                            {candidate.persona.riskAssessment.attritionRisk}
                          </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">
                            Skill Obsolescence
                          </p>
                          <p
                            className={`text-lg font-bold capitalize ${getRiskColor(
                              candidate.persona.riskAssessment.skillObsolescenceRisk
                            )}`}
                          >
                            {candidate.persona.riskAssessment.skillObsolescenceRisk}
                          </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">
                            Compensation Risk
                          </p>
                          <p
                            className={`text-lg font-bold capitalize ${getRiskColor(
                              candidate.persona.riskAssessment.compensationRiskLevel
                            )}`}
                          >
                            {candidate.persona.riskAssessment.compensationRiskLevel}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Persona Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Run AI Analysis to generate a detailed persona profile
                  </p>
                  <Button onClick={runDeepAnalysis} disabled={analyzing}>
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Generate Persona
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Outreach Modal */}
        {candidate && (
          <OutreachModal
            isOpen={showOutreach}
            onClose={() => setShowOutreach(false)}
            candidate={{
              name: candidate.name,
              currentRole: candidate.currentRole,
              company: candidate.company,
              avatar: candidate.avatar,
            }}
            jobContext={jobContext || undefined}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
  persona?: Persona;
  deepProfile?: DeepProfile;
  scoreBreakdown?: {
    skills?: { percentage: number };
    experience?: { percentage: number };
    industry?: { percentage: number };
    seniority?: { percentage: number };
    location?: { percentage: number };
  };
}

export default function ReportPage() {
  const params = useParams();
  const username = params.username as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Could not find a candidate with username "{username}".
          </p>
          <Button onClick={() => window.location.href = "/search"}>
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

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
  );
}

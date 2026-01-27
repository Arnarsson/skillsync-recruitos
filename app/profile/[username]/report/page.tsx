"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  MapPin,
  Briefcase,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  skills: string[];
  persona?: {
    archetype: string;
    psychometric: {
      bigFive?: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
      };
    };
    greenFlags: string[];
    redFlags: string[];
  };
  keyEvidenceWithSources?: Array<{ claim: string }>;
  risksWithSources?: Array<{ claim: string }>;
}

export default function ProfileReportPage() {
  const params = useParams();
  const username = params.username as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("apex_candidates");
    if (stored) {
      try {
        const candidates = JSON.parse(stored) as Candidate[];
        const found = candidates.find((c) => c.id === username);
        if (found) {
          setCandidate(found);
        }
      } catch {
        // Ignore
      }
    }
    setLoading(false);
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Kandidat ikke fundet</p>
      </div>
    );
  }

  const bigFiveData = candidate.persona?.psychometric.bigFive
    ? [
        { trait: "Openness", value: candidate.persona.psychometric.bigFive.openness },
        { trait: "Conscientiousness", value: candidate.persona.psychometric.bigFive.conscientiousness },
        { trait: "Extraversion", value: candidate.persona.psychometric.bigFive.extraversion },
        { trait: "Agreeableness", value: candidate.persona.psychometric.bigFive.agreeableness },
        { trait: "Stability", value: 10 - candidate.persona.psychometric.bigFive.neuroticism },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-4">
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h1 className="text-3xl font-bold mb-2">Kandidat Dybdeprofil</h1>
          <p className="text-gray-600">
            Genereret af RecruitOS • {new Date().toLocaleDateString("da-DK")}
          </p>
        </div>

        {/* Candidate Overview */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-24 h-24 rounded-full border-4 border-gray-100"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{candidate.name}</h2>
              <p className="text-gray-700 mb-2">{candidate.currentRole}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {candidate.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {candidate.location}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">
                {candidate.alignmentScore}
              </div>
              <p className="text-sm text-gray-600">Match Score</p>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Nøglekompetencer</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.slice(0, 8).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Personality Archetype */}
        {candidate.persona?.archetype && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personlighedstype
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-lg font-medium">{candidate.persona.archetype}</p>
            </div>
          </div>
        )}

        {/* Big Five Personality */}
        {bigFiveData.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Big Five Personlighedsprofil
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={bigFiveData}>
                    <PolarGrid stroke="#ddd" />
                    <PolarAngleAxis dataKey="trait" tick={{ fill: "#666", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} />
                    <Radar
                      name="Personality"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Trait Descriptions */}
              <div className="space-y-3 text-sm">
                {bigFiveData.map((trait) => (
                  <div key={trait.trait}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{trait.trait}</span>
                      <span className="text-gray-600">{trait.value}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${trait.value * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {candidate.keyEvidenceWithSources && candidate.keyEvidenceWithSources.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Styrker & Højdepunkter
            </h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <ul className="space-y-2">
                {candidate.keyEvidenceWithSources.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <span>{item.claim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Green Flags */}
        {candidate.persona?.greenFlags && candidate.persona.greenFlags.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Grønne Flag
            </h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <ul className="space-y-2">
                {candidate.persona.greenFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Areas to Explore */}
        {candidate.risksWithSources && candidate.risksWithSources.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Områder at Afklare
            </h3>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <ul className="space-y-2">
                {candidate.risksWithSources.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                    <span>{item.claim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Red Flags */}
        {candidate.persona?.redFlags && candidate.persona.redFlags.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Røde Flag
            </h3>
            <div className="bg-red-50 p-4 rounded-lg">
              <ul className="space-y-2">
                {candidate.persona.redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-600">
          <p className="mb-2">
            Denne rapport er genereret automatisk baseret på offentligt tilgængelige data.
          </p>
          <p className="font-medium">Powered by RecruitOS • recruitos.xyz</p>
        </div>
      </div>
    </div>
  );
}

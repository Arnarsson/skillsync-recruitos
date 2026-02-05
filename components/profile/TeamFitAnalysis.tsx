"use client";

import { useState, useMemo } from "react";
import {
  calculateTeamFit,
  TeamFitAnalysis,
} from "@/lib/teamFit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Users,
  Code2,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
} from "lucide-react";

interface TeamFitAnalysisProps {
  candidate: {
    name: string;
    topRepos?: Array<{
      name: string;
      language?: string;
      topics?: string[];
    }>;
    followers?: number;
    createdAt?: string;
    bio?: string;
  };
  teamProfile?: {
    workPattern?: "async" | "sync" | "hybrid";
    techStack?: string[];
  };
}

function getFitColor(percentage: number): string {
  if (percentage >= 80) return "text-emerald-400";
  if (percentage >= 60) return "text-yellow-400";
  if (percentage >= 40) return "text-orange-400";
  return "text-red-400";
}

function getFitBgColor(percentage: number): string {
  if (percentage >= 80) return "bg-emerald-900/30";
  if (percentage >= 60) return "bg-yellow-900/30";
  if (percentage >= 40) return "bg-orange-900/30";
  return "bg-red-900/30";
}

function getScoreBadge(score: number): string {
  if (score >= 80) return "bg-emerald-900 text-emerald-200";
  if (score >= 60) return "bg-yellow-900 text-yellow-200";
  if (score >= 40) return "bg-orange-900 text-orange-200";
  return "bg-red-900 text-red-200";
}

export function TeamFitAnalysisComponent({
  candidate,
  teamProfile = {
    workPattern: "hybrid",
    techStack: ["TypeScript", "React", "Node.js"],
  },
}: TeamFitAnalysisProps) {
  const analysis = useMemo(
    () => calculateTeamFit(candidate, teamProfile),
    [candidate, teamProfile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <CardTitle className="text-white">Team Fit Analysis</CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Culture and skill compatibility assessment
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Overall Fit Score */}
          <motion.div
            className={`p-6 rounded-lg mb-6 border-2 ${getFitBgColor(analysis.overallFitPercentage)} border-slate-600`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Team Fit Score</h3>
              <div className={`text-3xl font-bold ${getFitColor(analysis.overallFitPercentage)}`}>
                {analysis.overallFitPercentage}%
              </div>
            </div>
            <Progress
              value={analysis.overallFitPercentage}
              className="h-2 bg-slate-700"
            />
            <p className="text-sm text-slate-300 mt-3">
              {analysis.overallFitPercentage >= 80 &&
                "Excellent cultural and technical fit"}
              {analysis.overallFitPercentage >= 60 &&
                analysis.overallFitPercentage < 80 &&
                "Good fit with minor learning curve"}
              {analysis.overallFitPercentage >= 40 &&
                analysis.overallFitPercentage < 60 &&
                "Moderate fit - will require onboarding"}
              {analysis.overallFitPercentage < 40 &&
                "Significant adjustment period expected"}
            </p>
          </motion.div>

          {/* Detailed Breakdown */}
          <div className="space-y-4 mb-6">
            {/* Work Pattern */}
            <motion.div
              className="bg-slate-700/50 rounded-lg p-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Work Pattern Compatibility
                </h4>
                <Badge className={getScoreBadge(analysis.workPatternCompatibility)}>
                  {analysis.workPatternCompatibility}%
                </Badge>
              </div>
              <Progress
                value={analysis.workPatternCompatibility}
                className="h-1.5 mb-2"
              />
              <p className="text-sm text-slate-400">
                {analysis.insights[0]}
              </p>
            </motion.div>

            {/* Tech Stack */}
            <motion.div
              className="bg-slate-700/50 rounded-lg p-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Tech Stack Overlap
                </h4>
                <Badge className={getScoreBadge(analysis.techStackOverlap)}>
                  {analysis.techStackOverlap}%
                </Badge>
              </div>
              <Progress
                value={analysis.techStackOverlap}
                className="h-1.5 mb-2"
              />
              <p className="text-sm text-slate-400">
                {analysis.insights[1]}
              </p>
            </motion.div>

            {/* Communication */}
            <motion.div
              className="bg-slate-700/50 rounded-lg p-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Communication Style
                </h4>
                <Badge className={getScoreBadge(analysis.communicationStyleScore)}>
                  {analysis.communicationStyleScore}%
                </Badge>
              </div>
              <Progress
                value={analysis.communicationStyleScore}
                className="h-1.5 mb-2"
              />
              <p className="text-sm text-slate-400">
                {analysis.insights[2]}
              </p>
            </motion.div>
          </div>

          {/* Recommendations and Risks */}
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
              <TabsTrigger value="recommendations" className="text-xs">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="risks" className="text-xs">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Risk Factors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="mt-4">
              {analysis.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <motion.li
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-emerald-900/20 border border-emerald-700/30 rounded text-sm text-emerald-100"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                    >
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                      <span>{rec}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">No specific recommendations</p>
              )}
            </TabsContent>

            <TabsContent value="risks" className="mt-4">
              {analysis.riskFactors.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.riskFactors.map((risk, idx) => (
                    <motion.li
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-orange-900/20 border border-orange-700/30 rounded text-sm text-orange-100"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                    >
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-400" />
                      <span>{risk}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">No identified risk factors</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Info Box */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 flex gap-3">
              <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-100">
                This assessment is based on publicly available GitHub data and
                inferred patterns. Always conduct personal interviews to
                validate cultural fit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

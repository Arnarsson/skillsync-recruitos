"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ScoreBadge from "@/components/ScoreBadge";
import {
  ArrowUp,
  ArrowDown,
  Equal,
  X,
  MapPin,
  Briefcase,
  Github,
  Star,
  Users,
  Code2,
  Award,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

interface ComparisonCandidate {
  id: string;
  name: string;
  avatar: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  skills?: string[];
  followers?: number;
  topRepos?: Array<{
    name: string;
    stargazers_count: number;
    language?: string;
  }>;
  public_repos?: number;
  createdAt?: string;
}

interface CandidateComparisonProps {
  candidates: ComparisonCandidate[];
  onClose?: () => void;
}

type ComparisonMetric =
  | "score"
  | "followers"
  | "repos"
  | "experience"
  | "topSkills";

interface MetricComparison {
  metric: ComparisonMetric;
  label: string;
  values: Array<{
    candidateId: string;
    value: any;
    formatted: string;
  }>;
  winner?: string;
}

function getMetricComparison(
  candidates: ComparisonCandidate[],
  metric: ComparisonMetric
): MetricComparison {
  const values = candidates.map((c) => {
    let value: any;
    let formatted: string;

    switch (metric) {
      case "score":
        value = c.alignmentScore || 0;
        formatted = `${value}%`;
        break;
      case "followers":
        value = c.followers || 0;
        formatted = `${value.toLocaleString()}`;
        break;
      case "repos":
        value = c.public_repos || 0;
        formatted = `${value} repos`;
        break;
      case "experience":
        if (c.createdAt) {
          const years = Math.floor(
            (Date.now() - new Date(c.createdAt).getTime()) /
              (365 * 24 * 60 * 60 * 1000)
          );
          value = years;
          formatted = `${years} years`;
        } else {
          value = 0;
          formatted = "Unknown";
        }
        break;
      case "topSkills":
        value = (c.skills || []).length;
        formatted = `${value} skills`;
        break;
      default:
        value = 0;
        formatted = "N/A";
    }

    return {
      candidateId: c.id,
      value,
      formatted,
    };
  });

  // Determine winner
  const maxValue = Math.max(...values.map((v) => v.value));
  const winner =
    maxValue > 0
      ? values.find((v) => v.value === maxValue)?.candidateId
      : undefined;

  return {
    metric,
    label: {
      score: "Alignment Score",
      followers: "GitHub Followers",
      repos: "Public Repositories",
      experience: "Years Active",
      topSkills: "Skills Claimed",
    }[metric],
    values,
    winner,
  };
}

function ComparisonRow({
  metric,
  values,
  winner,
}: {
  metric: ComparisonMetric;
  values: MetricComparison["values"];
  winner?: string;
}) {
  return (
    <div className="grid grid-cols-5 items-center gap-4 py-4 border-b border-slate-700 last:border-b-0">
      {/* Label */}
      <div className="col-span-1 font-semibold text-slate-300">
        {metric === "score" && "Alignment"}
        {metric === "followers" && "Followers"}
        {metric === "repos" && "Repos"}
        {metric === "experience" && "Experience"}
        {metric === "topSkills" && "Skills"}
      </div>

      {/* Values */}
      {values.map((v, idx) => (
        <div
          key={v.candidateId}
          className={`col-span-1 p-2 rounded text-center font-semibold transition-colors ${
            winner === v.candidateId
              ? "bg-emerald-900/50 text-emerald-200"
              : "text-slate-300"
          }`}
        >
          {v.formatted}
        </div>
      ))}
    </div>
  );
}

export function CandidateComparison({
  candidates,
  onClose,
}: CandidateComparisonProps) {
  if (candidates.length < 2) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="pt-6">
          <p className="text-slate-400 text-center">
            Select 2-4 candidates to compare
          </p>
        </CardContent>
      </Card>
    );
  }

  const comparisons: MetricComparison[] = [
    getMetricComparison(candidates, "score"),
    getMetricComparison(candidates, "followers"),
    getMetricComparison(candidates, "repos"),
    getMetricComparison(candidates, "experience"),
    getMetricComparison(candidates, "topSkills"),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white mb-2">
                Candidate Comparison
              </CardTitle>
              <p className="text-sm text-slate-400">
                Side-by-side analysis of {candidates.length} candidates
              </p>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Candidate Headers */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {/* Empty space for label column */}
            <div />

            {/* Candidate cards */}
            {candidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                className="col-span-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarImage src={candidate.avatar} alt={candidate.name} />
                    <AvatarFallback>{candidate.name[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-white text-sm mb-1">
                    {candidate.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-2">
                    {candidate.currentRole}
                  </p>
                  <ScoreBadge
                    score={candidate.alignmentScore}
                    size="sm"
                    className="justify-center"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison Metrics */}
          <div className="space-y-2">
            {comparisons.map((comp) => (
              <ComparisonRow
                key={comp.metric}
                metric={comp.metric}
                values={comp.values}
                winner={comp.winner}
              />
            ))}
          </div>

          {/* Skills Comparison */}
          {candidates.some((c) => (c.skills || []).length > 0) && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Skills Overview
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {candidates.map((candidate) => (
                  <div key={candidate.id}>
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      {candidate.name}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(candidate.skills || []).slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(candidate.skills || []).length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{(candidate.skills || []).length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Repos */}
          {candidates.some((c) => (c.topRepos || []).length > 0) && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Top Repositories
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {candidates.map((candidate) => (
                  <div key={candidate.id}>
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      {candidate.name}
                    </p>
                    <div className="space-y-2">
                      {(candidate.topRepos || []).slice(0, 3).map((repo) => (
                        <div
                          key={repo.name}
                          className="flex items-center justify-between bg-slate-700/30 rounded px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {repo.name}
                            </p>
                            {repo.language && (
                              <p className="text-xs text-slate-400">
                                {repo.language}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {repo.stargazers_count} ⭐
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <p className="text-sm text-blue-200">
                <TrendingUp className="inline h-4 w-4 mr-2" />
                <strong>Tip:</strong> Consider the context of your role when
                comparing. Alignment score is weighted based on your job
                requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

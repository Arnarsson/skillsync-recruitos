"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Github,
  Star,
  GitFork,
  Clock,
  Code2,
  Brain,
  TrendingUp,
  Globe,
  Users,
  Activity,
  ExternalLink,
  AlertTriangle,
  Zap,
  Sun,
  Sunset,
  Moon,
  CloudMoon,
} from "lucide-react";
import {
  extractGitHubUsername,
  isUuidLike,
  readLocalCandidates,
  type CandidateIdentitySource,
} from "@/lib/candidate-identity";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---- Types ----

interface WorkAnalysis {
  cached: boolean;
  githubUsername: string;
  candidateName: string;
  analyzedAt: string;
  user: {
    name: string;
    bio: string;
    location: string;
    company: string;
    followers: number;
    following: number;
    publicRepos: number;
    createdAt: string;
    avatarUrl: string;
  };
  commitPatterns: {
    timeOfDay: { morning: number; afternoon: number; evening: number; night: number };
    dayOfWeek: Record<string, number>;
    totalPushEvents: number;
    recentActivityCount: number;
  };
  contributions: Array<{ date: string; count: number }>;
  languages: Array<{ name: string; percentage: number; repoCount: number }>;
  topRepos: Array<{
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    stars: number;
    forks: number;
    language: string | null;
    topics: string[];
    updatedAt: string;
  }>;
  techStack: Array<{
    name: string;
    count: number;
    proficiency: string;
  }>;
  stats: {
    totalStars: number;
    totalForks: number;
    ownedRepos: number;
    forkedRepos: number;
    totalEvents: number;
  };
  aiInsights?: {
    workPatterns?: { summary: string; consistency: string; peakHours: string };
    technicalDepth?: { summary: string; primaryDomain: string; specializations: string[] };
    openSourceImpact?: { summary: string; impactLevel: string; notableContributions: string };
    growthTrajectory?: { summary: string; trajectory: string; nextLikelySkills: string[] };
    recruitingInsights?: { strengths: string[]; concerns: string[]; outreachAngle: string };
    error?: string;
    rawInsights?: string;
  };
}

// ---- Color constants ----

const LANG_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e",
  "#06b6d4", "#eab308", "#ef4444",
];

const HEATMAP_COLORS = [
  "bg-zinc-800",       // 0 contributions
  "bg-emerald-900",    // 1
  "bg-emerald-700",    // 2-3
  "bg-emerald-500",    // 4-6
  "bg-emerald-400",    // 7+
];

function getHeatmapColor(count: number): string {
  if (count === 0) return HEATMAP_COLORS[0];
  if (count === 1) return HEATMAP_COLORS[1];
  if (count <= 3) return HEATMAP_COLORS[2];
  if (count <= 6) return HEATMAP_COLORS[3];
  return HEATMAP_COLORS[4];
}

function getProficiencyWidth(proficiency: string): string {
  switch (proficiency) {
    case "expert": return "w-full";
    case "proficient": return "w-3/4";
    case "familiar": return "w-1/2";
    case "exploring": return "w-1/4";
    default: return "w-1/4";
  }
}

function getProficiencyColor(proficiency: string): string {
  switch (proficiency) {
    case "expert": return "bg-emerald-500";
    case "proficient": return "bg-blue-500";
    case "familiar": return "bg-yellow-500";
    case "exploring": return "bg-zinc-500";
    default: return "bg-zinc-500";
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ---- Contribution Heatmap Component ----

function ContributionHeatmap({ contributions }: { contributions: WorkAnalysis["contributions"] }) {
  // Group contributions by week (columns) and day (rows)
  // Each column = 1 week, each row = 1 day (Mon-Sun)
  const weeks: Array<Array<{ date: string; count: number } | null>> = [];
  let currentWeek: Array<{ date: string; count: number } | null> = [];

  // Pad the beginning to align with the correct day of week
  const firstDay = new Date(contributions[0]?.date || new Date());
  const startDow = firstDay.getDay(); // 0=Sun, 1=Mon...
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  contributions.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const totalContributions = contributions.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Contribution Activity</h3>
          </div>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
            {totalContributions} contributions in the last year
          </Badge>
        </div>

        {/* Heatmap grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-[3px] min-w-[720px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-[11px] h-[11px] rounded-[2px] ${
                      day ? getHeatmapColor(day.count) : "bg-transparent"
                    }`}
                    title={day ? `${day.date}: ${day.count} contributions` : ""}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
          <span>Less</span>
          {HEATMAP_COLORS.map((color, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${color}`} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Loading Skeleton ----

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg bg-zinc-800" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 bg-zinc-800" />
            <Skeleton className="h-4 w-40 bg-zinc-800" />
          </div>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />
          ))}
        </div>

        {/* Heatmap skeleton */}
        <Skeleton className="h-48 rounded-xl bg-zinc-800" />

        {/* Charts row skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl bg-zinc-800" />
          <Skeleton className="h-72 rounded-xl bg-zinc-800" />
        </div>

        {/* Repos skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function WorkAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<WorkAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalysis() {
      try {
        let resolvedUsername: string | null = null;

        if (isUuidLike(id)) {
          const localCandidates = readLocalCandidates<CandidateIdentitySource>();
          const localMatch = localCandidates.find((c) => c?.id === id);
          if (localMatch) {
            resolvedUsername = extractGitHubUsername(localMatch);
          }
        }

        const endpoint = resolvedUsername
          ? `/api/candidates/${id}/work-analysis?username=${encodeURIComponent(resolvedUsername)}`
          : `/api/candidates/${id}/work-analysis`;
        const res = await fetch(endpoint);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const result = await res.json();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/pipeline">
            <Button variant="ghost" className="mb-6 text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pipeline
            </Button>
          </Link>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-16 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-medium text-white mb-2">Analysis Unavailable</h3>
              <p className="text-zinc-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="border-zinc-700 text-zinc-300">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const insights = data.aiInsights;

  // Prepare chart data
  const timeOfDayData = [
    { name: "Morning", value: data.commitPatterns.timeOfDay.morning, icon: "sun" },
    { name: "Afternoon", value: data.commitPatterns.timeOfDay.afternoon, icon: "sunset" },
    { name: "Evening", value: data.commitPatterns.timeOfDay.evening, icon: "moon" },
    { name: "Night", value: data.commitPatterns.timeOfDay.night, icon: "cloud-moon" },
  ];

  const dayOfWeekData = Object.entries(data.commitPatterns.dayOfWeek).map(([day, count]) => ({
    name: day,
    count,
  }));

  const languageChartData = data.languages.map((lang) => ({
    name: lang.name,
    value: lang.percentage,
  }));

  const TimeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "sun": return <Sun className="w-4 h-4 text-yellow-400" />;
      case "sunset": return <Sunset className="w-4 h-4 text-orange-400" />;
      case "moon": return <Moon className="w-4 h-4 text-blue-400" />;
      case "cloud-moon": return <CloudMoon className="w-4 h-4 text-indigo-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back button */}
        <Link href="/pipeline">
          <Button variant="ghost" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pipeline
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={data.user.avatarUrl}
              alt={data.user.name}
              className="w-14 h-14 rounded-full border-2 border-zinc-700"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {data.candidateName}
              </h1>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <Github className="w-4 h-4" />
                  @{data.githubUsername}
                </span>
                {data.user.location && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {data.user.location}
                  </span>
                )}
                {data.user.company && (
                  <span className="hidden sm:inline">{data.user.company}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://github.com/${data.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Github className="w-4 h-4 mr-2" />
                GitHub Profile
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                Total Stars
              </div>
              <p className="text-2xl font-bold text-white">{data.stats.totalStars.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <GitFork className="w-3.5 h-3.5 text-blue-400" />
                Total Forks
              </div>
              <p className="text-2xl font-bold text-white">{data.stats.totalForks.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Repositories
              </div>
              <p className="text-2xl font-bold text-white">{data.stats.ownedRepos}</p>
              <p className="text-xs text-zinc-500">{data.stats.forkedRepos} forked</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Followers
              </div>
              <p className="text-2xl font-bold text-white">{data.user.followers.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Contribution Heatmap */}
        <ContributionHeatmap contributions={data.contributions} />

        {/* Charts Row: Language Breakdown + Work Pattern */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Breakdown - Donut Chart */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Language Breakdown</h3>
              </div>
              {languageChartData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-48 h-48 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={languageChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          stroke="none"
                        >
                          {languageChartData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={LANG_COLORS[index % LANG_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
                                  <p className="text-white font-medium">{payload[0].name}</p>
                                  <p className="text-zinc-400">{payload[0].value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {data.languages.map((lang, i) => (
                      <div key={lang.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: LANG_COLORS[i % LANG_COLORS.length] }}
                        />
                        <span className="text-sm text-zinc-300 flex-1">{lang.name}</span>
                        <span className="text-xs text-zinc-500">{lang.percentage}%</span>
                        <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400">
                          {lang.repoCount} repos
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No language data available</p>
              )}
            </CardContent>
          </Card>

          {/* Work Pattern - Time of Day + Day of Week */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Work Pattern</h3>
              </div>

              {/* Time of day cards */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {timeOfDayData.map((slot) => {
                  const maxVal = Math.max(...timeOfDayData.map((d) => d.value), 1);
                  const opacity = 0.2 + (slot.value / maxVal) * 0.8;
                  return (
                    <div
                      key={slot.name}
                      className="text-center p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                      style={{ opacity: Math.max(0.4, opacity) }}
                    >
                      <TimeIcon type={slot.icon} />
                      <p className="text-lg font-bold text-white mt-1">{slot.value}</p>
                      <p className="text-[10px] text-zinc-500">{slot.name}</p>
                    </div>
                  );
                })}
              </div>

              {/* Day of week bar chart */}
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#71717a" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
                              <p className="text-white">{payload[0].payload.name}: {payload[0].value} commits</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Repositories */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold text-white">Top Repositories</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topRepos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 transition-colors h-full">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-blue-400 group-hover:text-blue-300 truncate flex-1">
                        {repo.name}
                      </h4>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                      {repo.description || "No description"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" />
                        {repo.forks}
                      </span>
                      <span className="ml-auto">{formatTimeAgo(repo.updatedAt)}</span>
                    </div>
                    {repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {repo.topics.slice(0, 4).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400 border-zinc-700">
                            {topic}
                          </Badge>
                        ))}
                        {repo.topics.length > 4 && (
                          <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-500">
                            +{repo.topics.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>

        {/* Technical DNA */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Technical DNA</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.techStack.map((tech) => (
                <div key={tech.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-300 truncate">{tech.name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ml-2 flex-shrink-0 ${
                          tech.proficiency === "expert"
                            ? "bg-emerald-900/50 text-emerald-400"
                            : tech.proficiency === "proficient"
                            ? "bg-blue-900/50 text-blue-400"
                            : tech.proficiency === "familiar"
                            ? "bg-yellow-900/50 text-yellow-400"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {tech.proficiency}
                      </Badge>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProficiencyColor(tech.proficiency)} ${getProficiencyWidth(tech.proficiency)}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {insights && !insights.error && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              {data.cached && (
                <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-500">
                  Cached
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Work Patterns */}
              {insights.workPatterns && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <h4 className="font-semibold text-white text-sm">Work Patterns</h4>
                      <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400 ml-auto">
                        {insights.workPatterns.consistency}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{insights.workPatterns.summary}</p>
                    <p className="text-xs text-zinc-500">{insights.workPatterns.peakHours}</p>
                  </CardContent>
                </Card>
              )}

              {/* Technical Depth */}
              {insights.technicalDepth && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <h4 className="font-semibold text-white text-sm">Technical Depth</h4>
                      <Badge variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400 ml-auto">
                        {insights.technicalDepth.primaryDomain}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{insights.technicalDepth.summary}</p>
                    {insights.technicalDepth.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {insights.technicalDepth.specializations.map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-[10px] bg-blue-900/30 text-blue-400">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Open Source Impact */}
              {insights.openSourceImpact && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-semibold text-white text-sm">Open Source Impact</h4>
                      <Badge variant="secondary" className={`text-[10px] ml-auto ${
                        insights.openSourceImpact.impactLevel === "high"
                          ? "bg-emerald-900/50 text-emerald-400"
                          : insights.openSourceImpact.impactLevel === "moderate"
                          ? "bg-blue-900/50 text-blue-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {insights.openSourceImpact.impactLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{insights.openSourceImpact.summary}</p>
                    <p className="text-xs text-zinc-500">{insights.openSourceImpact.notableContributions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Growth Trajectory */}
              {insights.growthTrajectory && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <h4 className="font-semibold text-white text-sm">Growth Trajectory</h4>
                      <Badge variant="secondary" className={`text-[10px] ml-auto ${
                        insights.growthTrajectory.trajectory === "accelerating"
                          ? "bg-emerald-900/50 text-emerald-400"
                          : insights.growthTrajectory.trajectory === "steady"
                          ? "bg-blue-900/50 text-blue-400"
                          : "bg-yellow-900/50 text-yellow-400"
                      }`}>
                        {insights.growthTrajectory.trajectory}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{insights.growthTrajectory.summary}</p>
                    {insights.growthTrajectory.nextLikelySkills.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Likely next skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {insights.growthTrajectory.nextLikelySkills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-[10px] bg-purple-900/30 text-purple-400">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recruiting Insights - Full Width */}
            {insights.recruitingInsights && (
              <Card className="bg-zinc-900/50 border-zinc-800 mt-4">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Recruiting Insights</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Strengths */}
                    <div>
                      <h4 className="text-sm font-medium text-emerald-400 mb-2">Strengths</h4>
                      <ul className="space-y-1.5">
                        {insights.recruitingInsights.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Concerns */}
                    <div>
                      <h4 className="text-sm font-medium text-yellow-400 mb-2">Concerns</h4>
                      <ul className="space-y-1.5">
                        {insights.recruitingInsights.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outreach Angle */}
                    <div>
                      <h4 className="text-sm font-medium text-blue-400 mb-2">Outreach Angle</h4>
                      <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                        {insights.recruitingInsights.outreachAngle}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* AI Error fallback */}
        {insights?.error && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-zinc-500" />
                <h3 className="text-lg font-semibold text-zinc-400">AI Insights</h3>
              </div>
              <p className="text-sm text-zinc-500">
                AI analysis could not be generated: {insights.error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 pt-4 pb-8">
          Analysis generated {data.cached ? "(cached)" : ""} at{" "}
          {new Date(data.analyzedAt).toLocaleString()} | Data from GitHub public activity
        </div>
      </div>
    </div>
  );
}

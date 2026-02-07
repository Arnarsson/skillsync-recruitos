"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  TrendingUp,
  Target,
  CalendarPlus,
  RefreshCw,
  ArrowRight,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import Link from "next/link";

// ---- Types ----

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  conversionRate: number | null;
}

interface SourceItem {
  source: string;
  count: number;
  percentage: number;
}

interface ScoreBucket {
  bucket: string;
  count: number;
}

interface SkillItem {
  skill: string;
  count: number;
}

interface LocationItem {
  location: string;
  count: number;
}

interface TimelinePoint {
  week: string;
  count: number;
}

interface SummaryStats {
  total: number;
  averageScore: number;
  highestScore: number;
  activePipeline: number;
  addedThisWeek: number;
}

interface AnalyticsData {
  funnel: FunnelStage[];
  sourceBreakdown: SourceItem[];
  scoreDistribution: ScoreBucket[];
  topSkills: SkillItem[];
  topLocations: LocationItem[];
  timeline: TimelinePoint[];
  summary: SummaryStats;
}

// ---- Constants ----

const SOURCE_COLORS: Record<string, string> = {
  GITHUB: "#6366f1",
  LINKEDIN: "#0ea5e9",
  MANUAL: "#f59e0b",
};

const SOURCE_LABELS: Record<string, string> = {
  GITHUB: "GitHub",
  LINKEDIN: "LinkedIn",
  MANUAL: "Manual",
};

const FUNNEL_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#22c55e", // green
  "#10b981", // emerald
];

const SCORE_BUCKET_COLORS = [
  "#ef4444", // red  (0-20)
  "#f97316", // orange (21-40)
  "#eab308", // yellow (41-60)
  "#22c55e", // green (61-80)
  "#10b981", // emerald (81-100)
];

// ---- Skeleton components ----

function CardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="pt-6">
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="h-8 w-16 bg-muted rounded mb-1" />
        <div className="h-3 w-20 bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-32 bg-muted rounded" />
      </CardHeader>
      <CardContent>
        <div className={`${height} bg-muted/30 rounded`} />
      </CardContent>
    </Card>
  );
}

// ---- Custom tooltip ----

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <p className="text-sm text-zinc-400">
        {payload[0].value} candidate{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ---- Score color helper ----

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

// ---- Main component ----

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/analytics/pipeline");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ---- Empty state ----
  if (!loading && data && data.summary.total === 0) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No candidates yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start by searching for developers to populate your pipeline.
              Analytics will appear here once you have candidates.
            </p>
            <Link href="/search">
              <Button size="lg" className="gap-2">
                <Search className="w-5 h-5" />
                Search for Developers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (!loading && error) {
    return (
      <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto text-center py-24">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-24 sm:pb-16 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Pipeline Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Recruitment funnel metrics and candidate insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Row 1 — Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Candidates */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Total Candidates
                  </span>
                </div>
                <p className="text-4xl font-bold">{summary?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all sources
                </p>
              </CardContent>
            </Card>

            {/* Average Score */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Avg. Score
                  </span>
                </div>
                <p
                  className={`text-4xl font-bold ${getScoreColor(
                    summary?.averageScore ?? 0
                  )}`}
                >
                  {summary?.averageScore ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Highest: {summary?.highestScore ?? 0}
                </p>
              </CardContent>
            </Card>

            {/* Active Pipeline */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Active Pipeline
                  </span>
                </div>
                <p className="text-4xl font-bold">
                  {summary?.activePipeline ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Excluding rejected
                </p>
              </CardContent>
            </Card>

            {/* Added This Week */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CalendarPlus className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Added This Week
                  </span>
                </div>
                <p className="text-4xl font-bold">
                  {summary?.addedThisWeek ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Row 2 — Funnel + Source Mix */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <ChartSkeleton height="h-72" />
            <ChartSkeleton height="h-72" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Pipeline Funnel */}
            <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Pipeline Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.funnel && data.funnel.some((s) => s.count > 0) ? (
                  <div className="space-y-3">
                    {data.funnel.map((stage, i) => {
                      const maxCount = Math.max(
                        ...data.funnel.map((s) => s.count),
                        1
                      );
                      const widthPct = Math.max(
                        (stage.count / maxCount) * 100,
                        4
                      );
                      return (
                        <div key={stage.stage}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {stage.label}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0"
                              >
                                {stage.count}
                              </Badge>
                            </div>
                            {stage.conversionRate !== null && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ArrowRight className="w-3 h-3" />
                                <span>{stage.conversionRate}% from prev</span>
                              </div>
                            )}
                          </div>
                          <div className="h-8 bg-zinc-800 rounded-md overflow-hidden">
                            <div
                              className="h-full rounded-md transition-all duration-500 flex items-center pl-3"
                              style={{
                                width: `${widthPct}%`,
                                backgroundColor:
                                  FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                              }}
                            >
                              {stage.count > 0 && (
                                <span className="text-xs font-semibold text-white drop-shadow-sm">
                                  {stage.count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No funnel data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Mix — Pie Chart */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Source Mix
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.sourceBreakdown && data.sourceBreakdown.length > 0 ? (
                  <div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.sourceBreakdown.map((s) => ({
                              name: SOURCE_LABELS[s.source] || s.source,
                              value: s.count,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {data.sourceBreakdown.map((s, idx) => (
                              <Cell
                                key={idx}
                                fill={
                                  SOURCE_COLORS[s.source] || "#71717a"
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const item = payload[0];
                              return (
                                <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                                  <p className="text-sm font-medium text-zinc-200">
                                    {item.name}
                                  </p>
                                  <p className="text-sm text-zinc-400">
                                    {item.value} candidates
                                  </p>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-col gap-2 mt-2">
                      {data.sourceBreakdown.map((s) => (
                        <div
                          key={s.source}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{
                                backgroundColor:
                                  SOURCE_COLORS[s.source] || "#71717a",
                              }}
                            />
                            <span className="text-sm">
                              {SOURCE_LABELS[s.source] || s.source}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {s.count}{" "}
                            <span className="text-xs">({s.percentage}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    No source data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Row 3 — Score Distribution + Timeline */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Score Distribution */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.scoreDistribution &&
                data.scoreDistribution.some((b) => b.count > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.scoreDistribution}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#3f3f46"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="bucket"
                          tick={{ fontSize: 12, fill: "#a1a1aa" }}
                          axisLine={{ stroke: "#3f3f46" }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12, fill: "#a1a1aa" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {data.scoreDistribution.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={SCORE_BUCKET_COLORS[idx]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No score data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Candidates Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.timeline && data.timeline.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.timeline}>
                        <defs>
                          <linearGradient
                            id="colorCount"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#3f3f46"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 11, fill: "#a1a1aa" }}
                          axisLine={{ stroke: "#3f3f46" }}
                          tickLine={false}
                          tickFormatter={(v: string) => {
                            const d = new Date(v);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12, fill: "#a1a1aa" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                                <p className="text-sm font-medium text-zinc-200">
                                  Week of {label}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  {payload[0].value} added
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No timeline data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Row 4 — Top Skills + Top Locations */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartSkeleton height="h-80" />
            <ChartSkeleton height="h-80" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Skills — Horizontal bar chart */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.topSkills && data.topSkills.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.topSkills.slice(0, 10).map((item, idx) => {
                      const maxCount = data.topSkills[0].count || 1;
                      const widthPct = Math.max(
                        (item.count / maxCount) * 100,
                        8
                      );
                      return (
                        <div key={item.skill} className="flex items-center gap-3">
                          <span className="text-sm w-28 truncate text-right text-muted-foreground capitalize">
                            {item.skill}
                          </span>
                          <div className="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
                            <div
                              className="h-full rounded transition-all duration-500 flex items-center px-2"
                              style={{
                                width: `${widthPct}%`,
                                backgroundColor:
                                  idx < 3
                                    ? "#6366f1"
                                    : idx < 6
                                    ? "#8b5cf6"
                                    : "#a78bfa",
                              }}
                            >
                              <span className="text-xs font-medium text-white">
                                {item.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No skills data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Locations */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Top Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.topLocations && data.topLocations.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.topLocations.slice(0, 10).map((item, idx) => {
                      const maxCount = data.topLocations[0].count || 1;
                      const widthPct = Math.max(
                        (item.count / maxCount) * 100,
                        8
                      );
                      return (
                        <div
                          key={item.location}
                          className="flex items-center gap-3"
                        >
                          <span className="text-sm w-28 truncate text-right text-muted-foreground">
                            {item.location}
                          </span>
                          <div className="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
                            <div
                              className="h-full rounded transition-all duration-500 flex items-center px-2"
                              style={{
                                width: `${widthPct}%`,
                                backgroundColor:
                                  idx < 3
                                    ? "#f59e0b"
                                    : idx < 6
                                    ? "#fbbf24"
                                    : "#fcd34d",
                              }}
                            >
                              <span className="text-xs font-medium text-zinc-900">
                                {item.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No location data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

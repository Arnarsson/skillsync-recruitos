/**
 * Pipeline Analytics API
 * GET /api/analytics/pipeline — Compute aggregate analytics from Prisma candidates
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireOptionalAuth } from "@/lib/auth-guard";

// Pipeline stage ordering for funnel
const PIPELINE_STAGES = [
  "sourced",
  "screening",
  "interview",
  "offer",
  "hired",
] as const;

// Readable labels
const STAGE_LABELS: Record<string, string> = {
  sourced: "Sourced",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

// Score distribution buckets
const SCORE_BUCKETS = [
  { label: "0-20", min: 0, max: 20 },
  { label: "21-40", min: 21, max: 40 },
  { label: "41-60", min: 41, max: 60 },
  { label: "61-80", min: 61, max: 80 },
  { label: "81-100", min: 81, max: 100 },
] as const;

export async function GET() {
  try {
    const auth = await requireOptionalAuth();
    const where: { userId?: string } = {};
    if (auth?.user?.id) {
      where.userId = auth.user.id;
    }

    const candidates = await prisma.candidate.findMany({
      where,
      select: {
        id: true,
        pipelineStage: true,
        sourceType: true,
        alignmentScore: true,
        skills: true,
        location: true,
        createdAt: true,
      },
    });

    const total = candidates.length;

    if (total === 0) {
      return NextResponse.json({
        funnel: PIPELINE_STAGES.map((stage) => ({
          stage,
          label: STAGE_LABELS[stage],
          count: 0,
          conversionRate: null,
        })),
        sourceBreakdown: [],
        scoreDistribution: SCORE_BUCKETS.map((b) => ({
          bucket: b.label,
          count: 0,
        })),
        topSkills: [],
        topLocations: [],
        timeline: [],
        summary: {
          total: 0,
          averageScore: 0,
          highestScore: 0,
          activePipeline: 0,
          addedThisWeek: 0,
        },
      });
    }

    // ---- Funnel data ----
    const stageCounts: Record<string, number> = {};
    for (const stage of PIPELINE_STAGES) {
      stageCounts[stage] = 0;
    }
    stageCounts["rejected"] = 0;

    for (const c of candidates) {
      const s = c.pipelineStage || "sourced";
      if (stageCounts[s] !== undefined) {
        stageCounts[s]++;
      } else {
        stageCounts["sourced"]++;
      }
    }

    const funnel = PIPELINE_STAGES.map((stage, i) => {
      const count = stageCounts[stage];
      let conversionRate: number | null = null;
      if (i > 0) {
        const prevCount = stageCounts[PIPELINE_STAGES[i - 1]];
        // Conversion = count at this stage / count at previous stage
        // But for a funnel, we want cumulative "reached this stage"
        // Since candidates are at ONE stage, we use cumulative counts
        // Actually, use direct stage counts — each candidate is in exactly one stage
        conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
      }
      return {
        stage,
        label: STAGE_LABELS[stage],
        count,
        conversionRate,
      };
    });

    // ---- Source breakdown ----
    const sourceCounts: Record<string, number> = {};
    for (const c of candidates) {
      const src = c.sourceType || "GITHUB";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }
    const sourceBreakdown = Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / total) * 100),
    }));

    // ---- Score distribution ----
    const scoreDistribution = SCORE_BUCKETS.map((bucket) => {
      const count = candidates.filter((c) => {
        const score = c.alignmentScore ?? 0;
        return score >= bucket.min && score <= bucket.max;
      }).length;
      return { bucket: bucket.label, count };
    });

    // ---- Top skills ----
    const skillFreq: Record<string, number> = {};
    for (const c of candidates) {
      if (c.skills && Array.isArray(c.skills)) {
        for (const skill of c.skills as unknown[]) {
          if (typeof skill !== 'string') continue;
          const normalized = skill.trim().toLowerCase();
          if (normalized) {
            skillFreq[normalized] = (skillFreq[normalized] || 0) + 1;
          }
        }
      }
    }
    const topSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    // ---- Location breakdown ----
    const locationFreq: Record<string, number> = {};
    for (const c of candidates) {
      const loc = (c.location || "Unknown").trim();
      if (loc) {
        locationFreq[loc] = (locationFreq[loc] || 0) + 1;
      }
    }
    const topLocations = Object.entries(locationFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));

    // ---- Timeline (candidates added per week) ----
    const weekMap: Record<string, number> = {};
    for (const c of candidates) {
      const date = new Date(c.createdAt);
      // Get ISO week start (Monday)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date.setDate(diff));
      const key = weekStart.toISOString().split("T")[0];
      weekMap[key] = (weekMap[key] || 0) + 1;
    }
    const timeline = Object.entries(weekMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, count]) => ({ week, count }));

    // ---- Summary stats ----
    const scores = candidates
      .map((c) => c.alignmentScore ?? 0)
      .filter((s) => s > 0);
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

    const activePipeline = candidates.filter(
      (c) => c.pipelineStage !== "rejected"
    ).length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const addedThisWeek = candidates.filter(
      (c) => new Date(c.createdAt) >= oneWeekAgo
    ).length;

    return NextResponse.json({
      funnel,
      sourceBreakdown,
      scoreDistribution,
      topSkills,
      topLocations,
      timeline,
      summary: {
        total,
        averageScore,
        highestScore,
        activePipeline,
        addedThisWeek,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API] Pipeline analytics error:", msg);
    return NextResponse.json(
      { error: "Failed to compute analytics", detail: msg },
      { status: 500 }
    );
  }
}

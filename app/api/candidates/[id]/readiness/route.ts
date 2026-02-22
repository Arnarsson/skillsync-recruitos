import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeReadinessScore } from "@/services/jobReadiness";
import type { ReadinessInput } from "@/services/jobReadiness";
import { createExternalFetchers } from "@/services/jobReadiness/fetchers";
import { Octokit } from "@octokit/rest";

// Synthetic readiness data for demo candidates (GitHub API may be unavailable)
const DEMO_READINESS: Record<string, Record<string, unknown>> = {
  andersbll: {
    overall: 72, confidence: 0.65, level: 'warm',
    pillars: {
      networkIntelligence: { score: 80, signals: ['Growing follower base (+12% 90d)'], weight: 0.15 },
      engagementDecay: { score: 65, signals: ['Active last 14 days'], weight: 0.20 },
      skillDiversification: { score: 78, signals: ['Added Rust to portfolio'], weight: 0.15 },
      companyHealth: { score: 60, signals: ['No layoff signals'], weight: 0.15 },
      tenureRisk: { score: 70, signals: ['2.5yr current tenure'], weight: 0.15 },
      profileOptimization: { score: 82, signals: ['Bio updated recently'], weight: 0.10 },
      sentimentShift: { score: 55, signals: ['Neutral commit tone'], weight: 0.10 },
    },
    computedAt: new Date().toISOString(), dataSourcesSummary: ['github'], demo: true,
  },
  MarcSkovMadsen: {
    overall: 58, confidence: 0.55, level: 'warming',
    pillars: {
      networkIntelligence: { score: 65, signals: ['Steady follower growth'], weight: 0.15 },
      engagementDecay: { score: 50, signals: ['Last push 3 weeks ago'], weight: 0.20 },
      skillDiversification: { score: 70, signals: ['Python + data viz ecosystem'], weight: 0.15 },
      companyHealth: { score: 55, signals: ['Stable employer'], weight: 0.15 },
      tenureRisk: { score: 45, signals: ['4yr tenure — low churn risk'], weight: 0.15 },
      profileOptimization: { score: 60, signals: ['Active OSS maintainer'], weight: 0.10 },
      sentimentShift: { score: 50, signals: ['Neutral recent tone'], weight: 0.10 },
    },
    computedAt: new Date().toISOString(), dataSourcesSummary: ['github'], demo: true,
  },
  leondz: {
    overall: 18, confidence: 0.40, level: 'cold',
    pillars: {
      networkIntelligence: { score: 30, signals: ['Stable follower count'], weight: 0.15 },
      engagementDecay: { score: 15, signals: ['No recent commits'], weight: 0.20 },
      skillDiversification: { score: 25, signals: ['Focused on NLP only'], weight: 0.15 },
      companyHealth: { score: 10, signals: ['NVIDIA — no signals'], weight: 0.15 },
      tenureRisk: { score: 12, signals: ['Long tenure, low mobility'], weight: 0.15 },
      profileOptimization: { score: 20, signals: ['Profile unchanged 6+ months'], weight: 0.10 },
      sentimentShift: { score: 15, signals: ['No recent data'], weight: 0.10 },
    },
    computedAt: new Date().toISOString(), dataSourcesSummary: ['github'], demo: true,
  },
  fnielsen: {
    overall: 45, confidence: 0.50, level: 'warming',
    pillars: {
      networkIntelligence: { score: 55, signals: ['Moderate community presence'], weight: 0.15 },
      engagementDecay: { score: 40, signals: ['Sporadic activity'], weight: 0.20 },
      skillDiversification: { score: 50, signals: ['Python + NLP tools'], weight: 0.15 },
      companyHealth: { score: 45, signals: ['Academic position — stable'], weight: 0.15 },
      tenureRisk: { score: 35, signals: ['Long academic tenure'], weight: 0.15 },
      profileOptimization: { score: 48, signals: ['Bio present but dated'], weight: 0.10 },
      sentimentShift: { score: 42, signals: ['Neutral tone'], weight: 0.10 },
    },
    computedAt: new Date().toISOString(), dataSourcesSummary: ['github'], demo: true,
  },
  thomasahle: {
    overall: 82, confidence: 0.70, level: 'hot',
    pillars: {
      networkIntelligence: { score: 88, signals: ['Rapid follower growth (+25% 90d)'], weight: 0.15 },
      engagementDecay: { score: 85, signals: ['Daily commits this week'], weight: 0.20 },
      skillDiversification: { score: 78, signals: ['Python, C++, algorithms'], weight: 0.15 },
      companyHealth: { score: 70, signals: ['Recent org change detected'], weight: 0.15 },
      tenureRisk: { score: 80, signals: ['1.2yr tenure — mobility window'], weight: 0.15 },
      profileOptimization: { score: 90, signals: ['Bio updated this month, "open to" keywords'], weight: 0.10 },
      sentimentShift: { score: 75, signals: ['Positive recent commits'], weight: 0.10 },
    },
    computedAt: new Date().toISOString(), dataSourcesSummary: ['github'], demo: true,
  },
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - compute or return cached readiness score
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Return synthetic data for known demo candidates immediately
    const demoData = DEMO_READINESS[id];
    if (demoData) {
      return NextResponse.json({ candidateId: id, ...demoData });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Accept both Prisma ID and GitHub username as lookup key
    const candidate = await prisma.candidate.findFirst({
      where: userId
        ? { OR: [{ id }, { githubUsername: id }], userId }
        : { OR: [{ id }, { githubUsername: id }] },
    });

    if (!candidate) {
      // If the id looks like a GitHub username (not a UUID), compute readiness on-the-fly.
      // This handles fresh search results that haven't been persisted to DB yet.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUuid) {
        try {
          const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
          const [profileRes, reposRes, eventsRes] = await Promise.all([
            octokit.users.getByUsername({ username: id }),
            octokit.repos.listForUser({ username: id, sort: "updated", per_page: 30 }),
            octokit.activity.listPublicEventsForUser({ username: id, per_page: 30 }),
          ]);
          const input: ReadinessInput = {
            candidateId: id,
            githubUsername: id,
            githubProfile: profileRes.data,
            githubRepos: reposRes.data as any,
            githubEvents: eventsRes.data as any,
          };
          const fetchers = createExternalFetchers();
          const readiness = await computeReadinessScore(input, fetchers);
          return NextResponse.json(readiness);
        } catch {
          // GitHub fetch failed — fall through to graceful zero response
        }
      }
      return NextResponse.json({
        candidateId: id,
        overall: 0,
        confidence: 0,
        level: 'cold',
        pillars: {},
        computedAt: new Date().toISOString(),
        dataSourcesSummary: [],
        notInDb: true,
      });
    }

    // Check for cached result (valid for 24 hours)
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    if (!forceRefresh && candidate.jobReadiness) {
      const cached = candidate.jobReadiness as any;
      if (cached.computedAt) {
        const age = Date.now() - new Date(cached.computedAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          return NextResponse.json(cached);
        }
      }
    }

    // Parse cached GitHub data — fetch on-demand if missing
    let githubData = candidate.githubData as any;

    if (!githubData && candidate.githubUsername) {
      try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const [profileRes, reposRes, eventsRes] = await Promise.all([
          octokit.users.getByUsername({ username: candidate.githubUsername }),
          octokit.repos.listForUser({ username: candidate.githubUsername, sort: "updated", per_page: 30 }),
          octokit.activity.listPublicEventsForUser({ username: candidate.githubUsername, per_page: 30 }),
        ]);
        githubData = {
          profile: profileRes.data,
          repos: reposRes.data,
          events: eventsRes.data,
        };
        // Cache for next call (fire-and-forget)
        prisma.candidate.update({
          where: { id: candidate.id },
          data: { githubData: githubData as any, githubFetchedAt: new Date() },
        }).catch(() => {});
      } catch {
        // Graceful fallback — compute with whatever we have
      }
    }

    // Build readiness input from candidate data
    const input: ReadinessInput = {
      candidateId: candidate.id,
      githubUsername: candidate.githubUsername || undefined,
      linkedinUrl: candidate.linkedinUrl || undefined,
      currentCompany: candidate.company || undefined,
      currentRole: candidate.currentRole || undefined,
      skills: Array.isArray(candidate.skills) ? candidate.skills as string[] : undefined,
      location: candidate.location || undefined,
      // Include full GitHub data from cache for pillar analysis
      githubProfile: githubData?.profile,
      githubRepos: githubData?.repos,
      githubEvents: githubData?.events,
    };

    // Compute readiness score with external fetchers
    const fetchers = createExternalFetchers();
    const readiness = await computeReadinessScore(input, fetchers);

    // Cache result
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { jobReadiness: readiness as any },
    });

    return NextResponse.json(readiness);
  } catch (error) {
    console.error("Readiness computation error:", error);
    return NextResponse.json(
      { error: "Failed to compute readiness score" },
      { status: 500 }
    );
  }
}

// POST - force recompute
export async function POST(request: NextRequest, { params }: RouteParams) {
  const url = new URL(request.url);
  url.searchParams.set("refresh", "true");
  const newRequest = new NextRequest(url, { headers: request.headers });
  return GET(newRequest, { params });
}

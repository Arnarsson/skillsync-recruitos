import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeReadinessScore } from "@/services/jobReadiness";
import type { ReadinessInput } from "@/services/jobReadiness";
import { createExternalFetchers } from "@/services/jobReadiness/fetchers";
import { Octokit } from "@octokit/rest";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - compute or return cached readiness score
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
      // This handles demo mode and fresh search results that haven't been persisted to DB yet.
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

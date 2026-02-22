import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { computeReadinessScore } from "@/services/jobReadiness";
import { createExternalFetchers } from "@/services/jobReadiness/fetchers";
import type { ReadinessInput } from "@/services/jobReadiness";

/**
 * DEV-ONLY: Test readiness engine against any GitHub username.
 * No auth, no DB — fetches live from GitHub API and computes score.
 *
 * Usage: GET /api/readiness-test?username=nc-sjw
 *        GET /api/readiness-test?username=nc-sjw&linkedin=https://linkedin.com/in/...
 */
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const linkedinUrl = request.nextUrl.searchParams.get("linkedin") || undefined;

  if (!username) {
    return NextResponse.json(
      { error: "?username= is required", example: "/api/readiness-test?username=nc-sjw" },
      { status: 400 }
    );
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    const octokit = new Octokit({ auth: token });

    const [profileRes, reposRes, eventsRes] = await Promise.all([
      octokit.users.getByUsername({ username }),
      octokit.repos.listForUser({ username, per_page: 30, sort: "pushed" }),
      octokit.activity.listPublicEventsForUser({ username, per_page: 30 }).catch(() => ({ data: [] })),
    ]);

    const profile = profileRes.data;
    const repos = reposRes.data;
    const events = eventsRes.data;

    const input: ReadinessInput = {
      candidateId: `test-${username}`,
      githubUsername: username,
      linkedinUrl,
      currentCompany: profile.company || undefined,
      location: profile.location || undefined,
      githubProfile: {
        login: profile.login,
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        bio: profile.bio,
        company: profile.company,
      },
      githubRepos: repos.map(r => ({
        name: r.name,
        language: r.language || null,
        stargazers_count: r.stargazers_count ?? 0,
        forks_count: r.forks_count ?? 0,
        pushed_at: r.pushed_at || new Date().toISOString(),
        created_at: r.created_at || new Date().toISOString(),
        topics: r.topics || [],
        fork: r.fork,
      })),
      githubEvents: (events as any[]).map(e => ({
        type: e.type || "Unknown",
        created_at: e.created_at || new Date().toISOString(),
        repo: { name: e.repo.name },
      })),
    };

    const fetchers = createExternalFetchers();
    const result = await computeReadinessScore(input, fetchers);

    return NextResponse.json({
      ...result,
      _debug: {
        githubUpdatedAt: profile.updated_at,
        githubCompany: profile.company,
        githubBio: profile.bio,
        repoCount: repos.length,
        eventCount: events.length,
        linkedinUrl: linkedinUrl || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch GitHub data" },
      { status: error.status || 500 }
    );
  }
}

/**
 * Unified Enrichment Service
 *
 * Orchestrates background enrichment of candidates with:
 * - Full GitHub API data (profile, repos, events)
 * - Job Readiness Score (Outreach Timing)
 * - Buildprint metrics
 *
 * Triggered automatically when candidates are added to pipeline.
 */

import { createOctokit } from "@/lib/github";
import { prisma } from "@/lib/db";
import { computeReadinessScore } from "@/services/jobReadiness";
import { createExternalFetchers } from "@/services/jobReadiness/fetchers";
import type { ReadinessInput } from "@/services/jobReadiness";
import type { Prisma } from "@prisma/client";

/**
 * Fetch full GitHub data for a user
 * Returns profile, repos, and events in the format expected by ReadinessInput
 */
async function fetchFullGitHubData(githubUsername: string, accessToken?: string) {
  const octokit = createOctokit(accessToken);

  try {
    // Fetch all data in parallel
    const [profileResponse, reposResponse, eventsResponse] = await Promise.all([
      octokit.users.getByUsername({ username: githubUsername }),
      octokit.repos.listForUser({
        username: githubUsername,
        sort: "updated",
        per_page: 100
      }),
      octokit.activity.listPublicEventsForUser({
        username: githubUsername,
        per_page: 100
      }),
    ]);

    const profile = profileResponse.data;
    const repos = reposResponse.data;
    const events = eventsResponse.data;

    // Format for ReadinessInput interface
    const githubData = {
      profile: {
        login: profile.login,
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        bio: profile.bio,
        company: profile.company,
      },
      repos: repos.map(repo => ({
        name: repo.name,
        language: repo.language || null,
        stargazers_count: repo.stargazers_count || 0,
        forks_count: repo.forks_count || 0,
        pushed_at: repo.pushed_at || repo.created_at || new Date().toISOString(),
        created_at: repo.created_at || new Date().toISOString(),
        topics: repo.topics || [],
        fork: repo.fork || false,
      })),
      events: events.map(event => ({
        type: event.type || 'Unknown',
        created_at: event.created_at || new Date().toISOString(),
        repo: { name: event.repo.name },
      })),
    };

    return githubData;
  } catch (error) {
    console.error(`[Enrichment] Failed to fetch GitHub data for ${githubUsername}:`, error);
    return null;
  }
}

/**
 * Compute buildprint metrics from GitHub data
 * Returns 5 key metrics about coding patterns
 */
function computeBuildprint(githubData: any) {
  const { repos, events } = githubData;

  // 1. Language diversity
  const languages = new Set(repos.map((r: any) => r.language).filter(Boolean));
  const languageDiversity = Math.min(100, languages.size * 20); // 5 languages = 100%

  // 2. Project ownership (original vs forked)
  const originalRepos = repos.filter((r: any) => !r.fork);
  const ownership = repos.length > 0
    ? Math.round((originalRepos.length / repos.length) * 100)
    : 0;

  // 3. Community impact (stars)
  const totalStars = repos.reduce((sum: number, r: any) => sum + r.stargazers_count, 0);
  const impact = Math.min(100, Math.log10(totalStars + 1) * 25); // Log scale, 1k stars ≈ 75%

  // 4. Activity level (recent events)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentEvents = events.filter((e: any) =>
    new Date(e.created_at) > thirtyDaysAgo
  );
  const activity = Math.min(100, recentEvents.length * 2); // 50 events = 100%

  // 5. Consistency (active repos in last 3 months)
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const activeRepos = repos.filter((r: any) =>
    new Date(r.pushed_at) > threeMonthsAgo
  );
  const consistency = Math.min(100, activeRepos.length * 10); // 10 active repos = 100%

  return {
    languageDiversity,
    ownership,
    impact,
    activity,
    consistency,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Main enrichment function - orchestrates all background data fetching
 *
 * @param candidateId - Prisma candidate ID
 * @param githubUsername - GitHub username to enrich
 * @param accessToken - Optional GitHub API token for higher rate limits
 */
export async function enrichCandidateBackground(
  candidateId: string,
  githubUsername: string,
  accessToken?: string
): Promise<void> {
  console.log(`[Enrichment] Starting background enrichment for ${githubUsername} (${candidateId})`);

  try {
    // 1. Fetch full GitHub data
    const githubData = await fetchFullGitHubData(githubUsername, accessToken);

    if (!githubData) {
      console.warn(`[Enrichment] Failed to fetch GitHub data for ${githubUsername}, skipping enrichment`);
      return;
    }

    // 2. Fetch candidate data for context
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      console.error(`[Enrichment] Candidate ${candidateId} not found, aborting enrichment`);
      return;
    }

    // 3. Compute Job Readiness Score with full GitHub data
    const readinessInput: ReadinessInput = {
      candidateId: candidate.id,
      githubUsername: githubUsername,
      currentCompany: candidate.company || undefined,
      currentRole: candidate.currentRole || undefined,
      skills: Array.isArray(candidate.skills) ? candidate.skills as string[] : undefined,
      location: candidate.location || undefined,
      // Full GitHub data for pillars
      githubProfile: githubData.profile,
      githubRepos: githubData.repos,
      githubEvents: githubData.events,
    };

    const fetchers = createExternalFetchers();
    const readinessScore = await computeReadinessScore(readinessInput, fetchers);

    console.log(`[Enrichment] Readiness score computed: ${readinessScore.overall}% (${readinessScore.level})`);

    // 4. Compute Buildprint metrics
    const buildprint = computeBuildprint(githubData);

    console.log(`[Enrichment] Buildprint computed: ${buildprint.activity}% activity, ${buildprint.languageDiversity}% diversity`);

    // 5. Update candidate with all enriched data
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        jobReadiness: readinessScore as unknown as Prisma.InputJsonValue,
        githubData: githubData as unknown as Prisma.InputJsonValue,
        buildprint: buildprint as unknown as Prisma.InputJsonValue,
        githubFetchedAt: new Date(),
      },
    });

    console.log(`[Enrichment] ✅ Background enrichment complete for ${githubUsername}`);

  } catch (error) {
    console.error(`[Enrichment] Background enrichment failed for ${githubUsername}:`, error);
    // Don't throw - enrichment is best-effort, non-blocking
  }
}

/**
 * Check if candidate needs re-enrichment (data is stale)
 * Returns true if GitHub data is older than 24 hours or missing
 */
export function needsEnrichment(candidate: any): boolean {
  if (!candidate.githubFetchedAt || !candidate.githubData) {
    return true;
  }

  const age = Date.now() - new Date(candidate.githubFetchedAt).getTime();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  return age > TWENTY_FOUR_HOURS;
}

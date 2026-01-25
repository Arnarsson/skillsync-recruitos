/**
 * GitHub Enrichment - Fetch additional data from GitHub
 * - Profile README
 * - PRs to other repos
 * - Contribution patterns
 */

import { Octokit } from "@octokit/rest";

interface PRToOtherRepo {
  repo: string;
  repoOwner: string;
  title: string;
  state: "open" | "closed" | "merged";
  url: string;
  createdAt: string;
  mergedAt?: string;
}

interface ContributionPattern {
  totalContributions: number;
  averagePerWeek: number;
  longestStreak: number;
  mostActiveDay: string;
  activityLevel: "very-active" | "active" | "moderate" | "low";
}

interface GitHubEnrichment {
  readme: string | null;
  prsToOthers: PRToOtherRepo[];
  contributionPattern: ContributionPattern;
  topics: string[];
}

/**
 * Fetch user's profile README (username/username repo)
 */
async function fetchProfileReadme(
  octokit: Octokit,
  username: string
): Promise<string | null> {
  try {
    const response = await octokit.repos.getReadme({
      owner: username,
      repo: username,
      mediaType: { format: "raw" },
    });
    return response.data as unknown as string;
  } catch (error) {
    // No profile README exists
    return null;
  }
}

/**
 * Fetch PRs user has made to OTHER repos (not their own)
 */
async function fetchPRsToOthers(
  octokit: Octokit,
  username: string
): Promise<PRToOtherRepo[]> {
  try {
    // Search for PRs authored by user
    const response = await octokit.search.issuesAndPullRequests({
      q: `type:pr author:${username} -user:${username}`,
      sort: "created",
      order: "desc",
      per_page: 20,
    });

    return response.data.items.map((pr) => {
      // Extract repo info from URL
      const urlParts = pr.html_url.split("/");
      const repoOwner = urlParts[3];
      const repoName = urlParts[4];

      return {
        repo: `${repoOwner}/${repoName}`,
        repoOwner,
        title: pr.title,
        state: pr.pull_request?.merged_at
          ? "merged"
          : (pr.state as "open" | "closed"),
        url: pr.html_url,
        createdAt: pr.created_at,
        mergedAt: pr.pull_request?.merged_at || undefined,
      };
    });
  } catch (error) {
    console.error("[GitHub Enrichment] Failed to fetch PRs:", error);
    return [];
  }
}

/**
 * Analyze contribution patterns from recent activity
 */
async function analyzeContributionPattern(
  octokit: Octokit,
  username: string
): Promise<ContributionPattern> {
  try {
    // Get user's recent events
    const events = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: 100,
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter to recent events
    const recentEvents = events.data.filter(
      (e) => new Date(e.created_at || "") > thirtyDaysAgo
    );

    // Count by day of week
    const dayCount: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    recentEvents.forEach((event) => {
      const day = days[new Date(event.created_at || "").getDay()];
      dayCount[day]++;
    });

    const mostActiveDay = Object.entries(dayCount).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Calculate streak (simplified - consecutive days with activity)
    const eventDates = new Set(
      recentEvents.map((e) =>
        new Date(e.created_at || "").toISOString().split("T")[0]
      )
    );
    let currentStreak = 0;
    let maxStreak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (eventDates.has(dateStr)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const totalContributions = recentEvents.length;
    const averagePerWeek = Math.round((totalContributions / 30) * 7);

    let activityLevel: ContributionPattern["activityLevel"];
    if (averagePerWeek >= 20) activityLevel = "very-active";
    else if (averagePerWeek >= 10) activityLevel = "active";
    else if (averagePerWeek >= 3) activityLevel = "moderate";
    else activityLevel = "low";

    return {
      totalContributions,
      averagePerWeek,
      longestStreak: maxStreak,
      mostActiveDay,
      activityLevel,
    };
  } catch (error) {
    console.error("[GitHub Enrichment] Failed to analyze patterns:", error);
    return {
      totalContributions: 0,
      averagePerWeek: 0,
      longestStreak: 0,
      mostActiveDay: "Unknown",
      activityLevel: "low",
    };
  }
}

/**
 * Extract topics from user's repos
 */
async function extractTopics(
  octokit: Octokit,
  username: string
): Promise<string[]> {
  try {
    const repos = await octokit.repos.listForUser({
      username,
      sort: "updated",
      per_page: 20,
    });

    const topicCounts: Record<string, number> = {};
    repos.data.forEach((repo) => {
      (repo.topics || []).forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    // Return top topics sorted by frequency
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([topic]) => topic);
  } catch (error) {
    console.error("[GitHub Enrichment] Failed to extract topics:", error);
    return [];
  }
}

/**
 * Main enrichment function - fetches all GitHub data in parallel
 */
export async function enrichFromGitHub(
  username: string,
  accessToken?: string
): Promise<GitHubEnrichment> {
  const octokit = new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN,
  });

  console.log("[GitHub Enrichment] Starting for:", username);

  // Fetch all data in parallel
  const [readme, prsToOthers, contributionPattern, topics] = await Promise.all([
    fetchProfileReadme(octokit, username),
    fetchPRsToOthers(octokit, username),
    analyzeContributionPattern(octokit, username),
    extractTopics(octokit, username),
  ]);

  console.log("[GitHub Enrichment] Complete:", {
    hasReadme: !!readme,
    prsCount: prsToOthers.length,
    activityLevel: contributionPattern.activityLevel,
    topicsCount: topics.length,
  });

  return {
    readme,
    prsToOthers,
    contributionPattern,
    topics,
  };
}

export type { GitHubEnrichment, PRToOtherRepo, ContributionPattern };

import { Octokit } from "@octokit/rest";

// Create authenticated Octokit instance
export function createOctokit(accessToken?: string) {
  return new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN,
  });
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language?: string | null;
  topics: string[];
}

export interface SearchResult {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  skills: string[];
  repos: number;
  stars: number;
  followers: number;
  score: number;
}

// Parse natural language query into GitHub search qualifiers
function parseSearchQuery(query: string): {
  keywords: string[];
  language: string | null;
  location: string | null;
} {
  const lowerQuery = query.toLowerCase();

  // Known cities and countries for location extraction
  const locations = [
    "copenhagen", "denmark", "stockholm", "sweden", "oslo", "norway",
    "helsinki", "finland", "berlin", "germany", "amsterdam", "netherlands",
    "london", "uk", "united kingdom", "paris", "france", "madrid", "spain",
    "new york", "san francisco", "seattle", "austin", "boston", "chicago",
    "los angeles", "toronto", "vancouver", "canada", "sydney", "melbourne",
    "australia", "tokyo", "japan", "singapore", "bangalore", "india",
    "tel aviv", "israel", "dublin", "ireland", "zurich", "switzerland",
    "remote", "usa", "united states", "europe", "asia",
  ];

  // Language mappings (handle variations like c++, c#)
  const languageMap: Record<string, string> = {
    "c++": "cpp",
    "c#": "csharp",
    "javascript": "javascript",
    "typescript": "typescript",
    "python": "python",
    "rust": "rust",
    "go": "go",
    "golang": "go",
    "java": "java",
    "ruby": "ruby",
    "php": "php",
    "swift": "swift",
    "kotlin": "kotlin",
    "scala": "scala",
    "react": "javascript",
    "vue": "javascript",
    "angular": "typescript",
    "node": "javascript",
    "nodejs": "javascript",
    "deno": "typescript",
    "cpp": "cpp",
    "csharp": "csharp",
  };

  // Terms to filter out (not searchable on GitHub)
  const filterTerms = [
    "years", "experience", "senior", "junior", "mid", "level",
    "developer", "engineer", "programmer", "5+", "3+", "10+",
    "looking", "for", "with", "and", "or", "the", "a", "an",
  ];

  let detectedLocation: string | null = null;
  let detectedLanguage: string | null = null;
  let remainingQuery = lowerQuery;

  // Extract location
  for (const loc of locations) {
    if (lowerQuery.includes(loc)) {
      detectedLocation = loc;
      remainingQuery = remainingQuery.replace(new RegExp(loc, "gi"), "").trim();
      break;
    }
  }

  // Extract language
  for (const [term, lang] of Object.entries(languageMap)) {
    if (lowerQuery.includes(term)) {
      detectedLanguage = lang;
      remainingQuery = remainingQuery.replace(new RegExp(term.replace("+", "\\+"), "gi"), "").trim();
      break;
    }
  }

  // Filter out non-searchable terms and clean up
  const keywords = remainingQuery
    .split(/\s+/)
    .filter(word => word.length > 1 && !filterTerms.includes(word))
    .filter(word => !/^\d+\+?$/.test(word)); // Remove numbers like "5+"

  return { keywords, language: detectedLanguage, location: detectedLocation };
}

// Search GitHub users by query
export async function searchDevelopers(
  query: string,
  accessToken?: string,
  page: number = 1,
  perPage: number = 10
): Promise<{ users: SearchResult[]; total: number }> {
  const octokit = createOctokit(accessToken);

  // Parse the natural language query
  const { keywords, language, location } = parseSearchQuery(query);

  // Build GitHub search query with qualifiers
  const queryParts: string[] = [];

  // Add any remaining keywords
  if (keywords.length > 0) {
    queryParts.push(keywords.join(" "));
  }

  // Add language qualifier
  if (language) {
    queryParts.push(`language:${language}`);
  }

  // Add location qualifier
  if (location) {
    queryParts.push(`location:${location}`);
  }

  // Ensure we have at least some search criteria
  const searchQuery = queryParts.length > 0 ? queryParts.join(" ") : "type:user";

  console.log("GitHub search query:", searchQuery); // Debug logging

  try {
    // Search users
    const { data: searchData } = await octokit.search.users({
      q: searchQuery,
      sort: "followers",
      order: "desc",
      per_page: perPage,
      page,
    });

    // Fetch detailed info for each user
    const users = await Promise.all(
      searchData.items.slice(0, perPage).map(async (user) => {
        try {
          const [userDetails, repos] = await Promise.all([
            octokit.users.getByUsername({ username: user.login }),
            octokit.repos.listForUser({
              username: user.login,
              sort: "updated",
              per_page: 10,
            }),
          ]);

          // Calculate total stars
          const totalStars = repos.data.reduce(
            (sum, repo) => sum + (repo.stargazers_count || 0),
            0
          );

          // Extract skills from top repos
          const skills = extractSkills(repos.data as any);

          // Calculate match score (simple algorithm)
          const score = calculateScore(userDetails.data as any, totalStars, query);

          return {
            username: user.login,
            name: userDetails.data.name || user.login,
            avatar: userDetails.data.avatar_url,
            bio: userDetails.data.bio || "",
            location: userDetails.data.location || "",
            company: userDetails.data.company || "",
            skills,
            repos: userDetails.data.public_repos,
            stars: totalStars,
            followers: userDetails.data.followers,
            score,
          };
        } catch {
          return null;
        }
      })
    );

    return {
      users: users.filter((u): u is SearchResult => u !== null),
      total: searchData.total_count,
    };
  } catch (error) {
    console.error("GitHub search error:", error);
    return { users: [], total: 0 };
  }
}

// Get detailed user profile
export async function getUserProfile(
  username: string,
  accessToken?: string
): Promise<{
  user: GitHubUser;
  repos: GitHubRepo[];
  totalStars: number;
  skills: string[];
  contributions: number;
} | null> {
  const octokit = createOctokit(accessToken);

  try {
    const [userResponse, reposResponse] = await Promise.all([
      octokit.users.getByUsername({ username }),
      octokit.repos.listForUser({
        username,
        sort: "updated",
        per_page: 100,
      }),
    ]);

    const totalStars = reposResponse.data.reduce(
      (sum, repo) => sum + (repo.stargazers_count || 0),
      0
    );

    const skills = extractSkills(reposResponse.data as any);

    // Estimate contributions (public repos * avg commits)
    const contributions = userResponse.data.public_repos * 50;

    return {
      user: userResponse.data as GitHubUser,
      repos: reposResponse.data.slice(0, 6).map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count || 0,
        forks_count: repo.forks_count || 0,
        language: repo.language,
        topics: repo.topics || [],
      })),
      totalStars,
      skills,
      contributions,
    };
  } catch (error) {
    console.error("GitHub profile error:", error);
    return null;
  }
}

// Extract programming languages from query
function extractLanguages(queryParts: string[]): string[] {
  const knownLanguages = [
    "javascript", "typescript", "python", "rust", "go", "java",
    "ruby", "php", "c", "cpp", "csharp", "swift", "kotlin",
    "react", "vue", "angular", "node", "nodejs", "deno",
  ];

  return queryParts.filter((part) =>
    knownLanguages.includes(part.toLowerCase())
  );
}

// Extract skills from repositories
function extractSkills(repos: { language?: string | null; topics?: string[] }[]): string[] {
  const skillsMap = new Map<string, number>();

  repos.forEach((repo) => {
    if (repo.language) {
      skillsMap.set(repo.language, (skillsMap.get(repo.language) || 0) + 1);
    }
    repo.topics?.forEach((topic) => {
      skillsMap.set(topic, (skillsMap.get(topic) || 0) + 1);
    });
  });

  return Array.from(skillsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill]) => skill);
}

// Calculate match score
function calculateScore(
  user: GitHubUser,
  totalStars: number,
  query: string
): number {
  let score = 50;

  // Boost for stars
  if (totalStars > 10000) score += 20;
  else if (totalStars > 1000) score += 15;
  else if (totalStars > 100) score += 10;

  // Boost for followers
  if (user.followers > 5000) score += 15;
  else if (user.followers > 1000) score += 10;
  else if (user.followers > 100) score += 5;

  // Boost for bio containing query terms
  const queryTerms = query.toLowerCase().split(/\s+/);
  const bio = (user.bio || "").toLowerCase();
  queryTerms.forEach((term) => {
    if (bio.includes(term)) score += 5;
  });

  return Math.min(99, score);
}

// Deep GitHub Analysis Types
export interface GitHubDeepAnalysis {
  commitActivity: {
    totalCommits: number;
    avgCommitsPerWeek: number;
    mostActiveDay: string;
    mostActiveHour: number;
    commitsByDay: Record<string, number>;
    recentCommitDates: string[];
  };
  pullRequests: {
    totalOpened: number;
    totalMerged: number;
    avgMergeTime: string;
    recentPRs: Array<{
      title: string;
      repo: string;
      state: string;
      createdAt: string;
      mergedAt?: string;
    }>;
  };
  codeReview: {
    reviewsGiven: number;
    commentsGiven: number;
    avgResponseTime: string;
  };
  contributionPatterns: {
    consistency: 'high' | 'moderate' | 'sporadic';
    streak: number;
    longestStreak: number;
    activeMonths: number;
  };
  collaborationStyle: {
    soloProjects: number;
    teamProjects: number;
    opensourceContributions: number;
    style: 'solo' | 'collaborative' | 'balanced';
  };
  topLanguages: Array<{
    name: string;
    percentage: number;
    repoCount: number;
  }>;
}

// Fetch deep analysis for a GitHub user
export async function getDeepGitHubAnalysis(
  username: string,
  accessToken?: string
): Promise<GitHubDeepAnalysis | null> {
  const octokit = createOctokit(accessToken);

  try {
    // Fetch user events (commits, PRs, reviews)
    const [eventsResponse, reposResponse] = await Promise.all([
      octokit.activity.listPublicEventsForUser({
        username,
        per_page: 100,
      }),
      octokit.repos.listForUser({
        username,
        sort: "updated",
        per_page: 100,
      }),
    ]);

    const events = eventsResponse.data;
    const repos = reposResponse.data;

    // Analyze commit activity
    const pushEvents = events.filter((e) => e.type === "PushEvent");
    const commitDates: Date[] = [];
    const commitsByDay: Record<string, number> = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
      Thursday: 0, Friday: 0, Saturday: 0
    };
    const commitsByHour: Record<number, number> = {};

    pushEvents.forEach((event) => {
      const date = new Date(event.created_at || "");
      commitDates.push(date);
      const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
      commitsByDay[day] = (commitsByDay[day] || 0) + 1;
      const hour = date.getHours();
      commitsByHour[hour] = (commitsByHour[hour] || 0) + 1;
    });

    const mostActiveDay = Object.entries(commitsByDay)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

    const mostActiveHour = Object.entries(commitsByHour)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "12";

    // Analyze PR activity
    const prEvents = events.filter((e) => e.type === "PullRequestEvent");
    const openedPRs = prEvents.filter((e) => (e.payload as { action?: string }).action === "opened");
    const mergedPRs = prEvents.filter((e) => (e.payload as { action?: string }).action === "closed");

    const recentPRs = prEvents.slice(0, 5).map((e) => {
      const payload = e.payload as {
        pull_request?: {
          title?: string;
          state?: string;
          created_at?: string;
          merged_at?: string;
        };
      };
      return {
        title: payload.pull_request?.title || "Unknown",
        repo: e.repo.name,
        state: payload.pull_request?.state || "unknown",
        createdAt: payload.pull_request?.created_at || "",
        mergedAt: payload.pull_request?.merged_at,
      };
    });

    // Analyze code review activity
    const reviewEvents = events.filter((e) => e.type === "PullRequestReviewEvent");
    const commentEvents = events.filter((e) =>
      e.type === "IssueCommentEvent" || e.type === "PullRequestReviewCommentEvent"
    );

    // Analyze contribution patterns
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = events.filter((e) => new Date(e.created_at || "") > thirtyDaysAgo);

    let consistency: 'high' | 'moderate' | 'sporadic' = 'sporadic';
    if (recentEvents.length > 50) consistency = 'high';
    else if (recentEvents.length > 20) consistency = 'moderate';

    // Analyze collaboration style
    const ownedRepos = repos.filter((r) => !r.fork);
    const forkedRepos = repos.filter((r) => r.fork);
    const teamRepos = repos.filter((r) => (r.forks_count || 0) > 5 || (r.stargazers_count || 0) > 10);

    let style: 'solo' | 'collaborative' | 'balanced' = 'balanced';
    if (forkedRepos.length > ownedRepos.length * 0.5) style = 'collaborative';
    else if (forkedRepos.length < ownedRepos.length * 0.1) style = 'solo';

    // Analyze languages
    const languageMap = new Map<string, { count: number; repos: number }>();
    repos.forEach((repo) => {
      if (repo.language) {
        const existing = languageMap.get(repo.language) || { count: 0, repos: 0 };
        languageMap.set(repo.language, {
          count: existing.count + (repo.size || 0),
          repos: existing.repos + 1,
        });
      }
    });

    const totalSize = Array.from(languageMap.values()).reduce((sum, l) => sum + l.count, 0);
    const topLanguages = Array.from(languageMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        percentage: totalSize > 0 ? Math.round((data.count / totalSize) * 100) : 0,
        repoCount: data.repos,
      }));

    return {
      commitActivity: {
        totalCommits: pushEvents.length * 3, // Estimate (events contain multiple commits)
        avgCommitsPerWeek: Math.round((pushEvents.length * 3) / 4), // Estimate for ~1 month of events
        mostActiveDay,
        mostActiveHour: parseInt(mostActiveHour),
        commitsByDay,
        recentCommitDates: commitDates.slice(0, 10).map((d) => d.toISOString()),
      },
      pullRequests: {
        totalOpened: openedPRs.length,
        totalMerged: mergedPRs.length,
        avgMergeTime: "~2 days", // Would need more data for accurate calculation
        recentPRs,
      },
      codeReview: {
        reviewsGiven: reviewEvents.length,
        commentsGiven: commentEvents.length,
        avgResponseTime: "~4 hours", // Would need more data for accurate calculation
      },
      contributionPatterns: {
        consistency,
        streak: recentEvents.length > 0 ? 7 : 0, // Simplified
        longestStreak: Math.min(recentEvents.length, 30),
        activeMonths: 12, // Would need more historical data
      },
      collaborationStyle: {
        soloProjects: ownedRepos.length - teamRepos.length,
        teamProjects: teamRepos.length,
        opensourceContributions: forkedRepos.length,
        style,
      },
      topLanguages,
    };
  } catch (error) {
    console.error("GitHub deep analysis error:", error);
    return null;
  }
}

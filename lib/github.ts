import { Octokit } from "@octokit/rest";
import { extractLocation } from "./search/locationNormalizer";
import { extractSkill, getGitHubLanguage } from "./search/skillNormalizer";
import { parseExperience, type ExperienceInfo } from "./search/experienceParser";
import { filterStopWords } from "./search/constants";

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

// Parsed query result with enhanced search intelligence
export interface ParsedSearchQuery {
  keywords: string[];
  language: string | null;
  location: string | null;
  experience: ExperienceInfo;
  frameworkKeyword: string | null; // e.g., "react" to include in search
}

// Parse natural language query into GitHub search qualifiers
// Supports multiple languages (Danish, Swedish, German, etc.) and unicode normalization
function parseSearchQuery(query: string): ParsedSearchQuery {
  let remaining = query;

  // 1. Extract experience info first (before removing words)
  const experience = parseExperience(remaining);

  // 2. Extract and normalize location (handles København → copenhagen, etc.)
  const { location, remainingQuery: afterLocation } = extractLocation(remaining);
  remaining = afterLocation;

  // 3. Extract programming language/skill (handles c++ → cpp, react → javascript, etc.)
  const { skill, githubLanguage, keyword: frameworkKeyword, remainingQuery: afterSkill } = extractSkill(remaining);
  remaining = afterSkill;

  // 4. Filter stop words from all supported languages
  const words = remaining.split(/\s+/).filter(w => w.length > 0);
  let filteredWords = filterStopWords(words);

  // 5. Remove any remaining numeric patterns (like "5+", "10")
  filteredWords = filteredWords.filter(word => !/^\d+\+?$/.test(word));

  // 6. Add framework keyword to search terms if detected (e.g., "react")
  const keywords = frameworkKeyword
    ? [frameworkKeyword, ...filteredWords.filter(w => w !== frameworkKeyword)]
    : filteredWords;

  console.log('[parseSearchQuery] Input:', query);
  console.log('[parseSearchQuery] Parsed:', {
    keywords,
    language: githubLanguage,
    location,
    experience,
    frameworkKeyword,
  });

  return {
    keywords,
    language: githubLanguage,
    location,
    experience,
    frameworkKeyword,
  };
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

// ============================================================================
// BEHAVIORAL INSIGHTS - Phase 1
// ============================================================================

/**
 * Activity signals that indicate a candidate might be "open to work"
 */
export interface ActivitySignals {
  openToWork: boolean;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
  lastProfileUpdate: string | null;
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  recentActivityCount: number;
}

/**
 * Engagement scoring to predict likelihood of response
 */
export interface EngagementScore {
  score: number; // 0-100
  factors: {
    activityRecency: number;    // 0-30 points
    contactability: number;     // 0-25 points
    signalStrength: number;     // 0-25 points
    responsiveness: number;     // 0-20 points
  };
  bestOutreachTime: string | null;
  timezone: string | null;
}

// Keywords in bio that suggest openness to opportunities
const OPEN_TO_WORK_KEYWORDS = [
  'open to', 'looking for', 'seeking', 'available for',
  'exploring', 'interested in', 'freelance', 'contractor',
  'consultant', 'hire me', 'available', 'job', 'opportunity',
  'opportunities', 'new role', 'career', 'transition',
  // Danish
  'søger job', 'ledig', 'til rådighed', 'freelancer',
  // Swedish
  'söker jobb', 'tillgänglig', 'frilans',
  // German
  'offen für', 'suche', 'verfügbar', 'freiberuflich',
];

// Keywords that suggest NOT looking for work
const NOT_LOOKING_KEYWORDS = [
  'not looking', 'not seeking', 'happily employed',
  'not available', 'not open to', 'no recruiters',
  'hiring', 'we are hiring', "we're hiring",
];

/**
 * Detect "open to work" signals from GitHub activity
 */
export async function detectActivitySignals(
  username: string,
  accessToken?: string
): Promise<ActivitySignals> {
  const octokit = createOctokit(accessToken);

  const result: ActivitySignals = {
    openToWork: false,
    confidence: 'low',
    signals: [],
    lastProfileUpdate: null,
    activityTrend: 'stable',
    recentActivityCount: 0,
  };

  try {
    // Fetch user profile and events
    const [userResponse, eventsResponse, reposResponse] = await Promise.all([
      octokit.users.getByUsername({ username }),
      octokit.activity.listPublicEventsForUser({ username, per_page: 100 }),
      octokit.repos.listForUser({ username, sort: 'created', per_page: 10 }),
    ]);

    const user = userResponse.data;
    const events = eventsResponse.data;
    const recentRepos = reposResponse.data;

    // 1. Check bio for "open to work" keywords
    const bio = (user.bio || '').toLowerCase();
    for (const keyword of OPEN_TO_WORK_KEYWORDS) {
      if (bio.includes(keyword.toLowerCase())) {
        result.signals.push(`Bio contains "${keyword}"`);
        result.openToWork = true;
      }
    }

    // Check for "not looking" signals
    for (const keyword of NOT_LOOKING_KEYWORDS) {
      if (bio.includes(keyword.toLowerCase())) {
        result.signals = result.signals.filter(s => !s.startsWith('Bio contains'));
        result.openToWork = false;
        result.signals.push(`Bio indicates not looking ("${keyword}")`);
        break;
      }
    }

    // 2. Check company field (empty or changed)
    if (!user.company || user.company.trim() === '') {
      result.signals.push('No company listed');
    } else if (user.company.toLowerCase().includes('freelance') ||
               user.company.toLowerCase().includes('self-employed') ||
               user.company.toLowerCase().includes('independent')) {
      result.signals.push('Listed as freelance/independent');
      result.openToWork = true;
    }

    // 3. Analyze activity patterns
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEvents = events.filter(e =>
      new Date(e.created_at || '') > sevenDaysAgo
    );
    const monthEvents = events.filter(e =>
      new Date(e.created_at || '') > thirtyDaysAgo
    );

    result.recentActivityCount = recentEvents.length;

    // Activity trend analysis
    if (events.length >= 10) {
      const firstHalf = events.slice(0, Math.floor(events.length / 2));
      const secondHalf = events.slice(Math.floor(events.length / 2));

      // Compare timestamps to determine trend
      const firstHalfAvgAge = firstHalf.reduce((sum, e) =>
        sum + (now.getTime() - new Date(e.created_at || '').getTime()), 0) / firstHalf.length;
      const secondHalfAvgAge = secondHalf.reduce((sum, e) =>
        sum + (now.getTime() - new Date(e.created_at || '').getTime()), 0) / secondHalf.length;

      if (firstHalfAvgAge < secondHalfAvgAge * 0.7) {
        result.activityTrend = 'increasing';
        result.signals.push('Activity increasing recently');
      } else if (firstHalfAvgAge > secondHalfAvgAge * 1.5) {
        result.activityTrend = 'decreasing';
      }
    }

    // 4. Check for recent portfolio activity (new public repos)
    const recentNewRepos = recentRepos.filter(repo => {
      const created = new Date(repo.created_at || '');
      return created > thirtyDaysAgo && !repo.fork;
    });

    if (recentNewRepos.length >= 2) {
      result.signals.push(`Created ${recentNewRepos.length} new repos recently (portfolio building?)`);
      result.openToWork = true;
    }

    // 5. High activity recently
    if (recentEvents.length > 20) {
      result.signals.push('Very active in last 7 days');
    } else if (recentEvents.length > 10) {
      result.signals.push('Active in last 7 days');
    }

    // 6. Check if email is public (more contactable)
    if (user.email) {
      result.signals.push('Public email available');
    }

    // 7. Check Twitter/social presence
    if (user.twitter_username) {
      result.signals.push('Twitter/X profile linked');
    }

    // Determine confidence level
    const signalCount = result.signals.filter(s =>
      !s.includes('not looking') &&
      !s.includes('No company')
    ).length;

    if (result.openToWork && signalCount >= 3) {
      result.confidence = 'high';
    } else if (result.openToWork && signalCount >= 2) {
      result.confidence = 'medium';
    } else if (signalCount >= 1) {
      result.confidence = 'low';
    }

    // Record profile update time
    result.lastProfileUpdate = user.updated_at || null;

  } catch (error) {
    console.error('Error detecting activity signals:', error);
  }

  return result;
}

/**
 * Calculate engagement score to predict response likelihood
 */
export async function calculateEngagementScore(
  username: string,
  accessToken?: string,
  targetLocation?: string
): Promise<EngagementScore> {
  const octokit = createOctokit(accessToken);

  const result: EngagementScore = {
    score: 0,
    factors: {
      activityRecency: 0,
      contactability: 0,
      signalStrength: 0,
      responsiveness: 0,
    },
    bestOutreachTime: null,
    timezone: null,
  };

  try {
    const [userResponse, eventsResponse] = await Promise.all([
      octokit.users.getByUsername({ username }),
      octokit.activity.listPublicEventsForUser({ username, per_page: 100 }),
    ]);

    const user = userResponse.data;
    const events = eventsResponse.data;

    // 1. Activity Recency (0-30 points)
    const now = new Date();
    if (events.length > 0) {
      const lastEvent = new Date(events[0].created_at || '');
      const daysSinceActivity = (now.getTime() - lastEvent.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceActivity <= 1) {
        result.factors.activityRecency = 30;
      } else if (daysSinceActivity <= 3) {
        result.factors.activityRecency = 25;
      } else if (daysSinceActivity <= 7) {
        result.factors.activityRecency = 20;
      } else if (daysSinceActivity <= 14) {
        result.factors.activityRecency = 15;
      } else if (daysSinceActivity <= 30) {
        result.factors.activityRecency = 10;
      } else {
        result.factors.activityRecency = 5;
      }
    }

    // 2. Contactability (0-25 points)
    if (user.email) {
      result.factors.contactability += 15;
    }
    if (user.twitter_username) {
      result.factors.contactability += 5;
    }
    if (user.blog) {
      result.factors.contactability += 5;
    }

    // 3. Signal Strength (0-25 points)
    const signals = await detectActivitySignals(username, accessToken);
    if (signals.openToWork) {
      if (signals.confidence === 'high') {
        result.factors.signalStrength = 25;
      } else if (signals.confidence === 'medium') {
        result.factors.signalStrength = 18;
      } else {
        result.factors.signalStrength = 10;
      }
    } else if (signals.signals.length > 0) {
      result.factors.signalStrength = 5;
    }

    // 4. Responsiveness (0-20 points) - based on issue/PR engagement
    const issueEvents = events.filter(e =>
      e.type === 'IssueCommentEvent' ||
      e.type === 'IssuesEvent' ||
      e.type === 'PullRequestReviewEvent' ||
      e.type === 'PullRequestReviewCommentEvent'
    );

    if (issueEvents.length > 20) {
      result.factors.responsiveness = 20;
    } else if (issueEvents.length > 10) {
      result.factors.responsiveness = 15;
    } else if (issueEvents.length > 5) {
      result.factors.responsiveness = 10;
    } else if (issueEvents.length > 0) {
      result.factors.responsiveness = 5;
    }

    // Calculate total score
    result.score = Object.values(result.factors).reduce((a, b) => a + b, 0);

    // Determine best outreach time based on activity patterns
    const eventHours = events.map(e => new Date(e.created_at || '').getUTCHours());
    if (eventHours.length > 0) {
      // Find most common hour
      const hourCounts = new Map<number, number>();
      eventHours.forEach(h => hourCounts.set(h, (hourCounts.get(h) || 0) + 1));
      const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 10;

      // Suggest outreach 1-2 hours before peak activity
      const suggestedHour = (peakHour - 1 + 24) % 24;
      result.bestOutreachTime = `${suggestedHour}:00 UTC`;

      // Try to infer timezone from location
      result.timezone = inferTimezone(user.location || '');
    }

  } catch (error) {
    console.error('Error calculating engagement score:', error);
  }

  return result;
}

/**
 * Infer timezone from location string
 */
function inferTimezone(location: string): string | null {
  const loc = location.toLowerCase();

  // Europe
  if (/copenhagen|denmark|århus|aarhus/i.test(loc)) return 'Europe/Copenhagen';
  if (/stockholm|sweden|göteborg|malmö/i.test(loc)) return 'Europe/Stockholm';
  if (/oslo|norway|bergen|trondheim/i.test(loc)) return 'Europe/Oslo';
  if (/helsinki|finland/i.test(loc)) return 'Europe/Helsinki';
  if (/berlin|munich|germany|frankfurt|hamburg/i.test(loc)) return 'Europe/Berlin';
  if (/amsterdam|netherlands|holland/i.test(loc)) return 'Europe/Amsterdam';
  if (/london|uk|united kingdom|england|manchester/i.test(loc)) return 'Europe/London';
  if (/paris|france|lyon/i.test(loc)) return 'Europe/Paris';
  if (/madrid|spain|barcelona/i.test(loc)) return 'Europe/Madrid';
  if (/zurich|switzerland|geneva/i.test(loc)) return 'Europe/Zurich';

  // US
  if (/new york|nyc|boston|philadelphia/i.test(loc)) return 'America/New_York';
  if (/chicago|illinois/i.test(loc)) return 'America/Chicago';
  if (/denver|colorado/i.test(loc)) return 'America/Denver';
  if (/san francisco|sf|los angeles|la|seattle|california/i.test(loc)) return 'America/Los_Angeles';

  // Other
  if (/toronto|montreal|canada/i.test(loc)) return 'America/Toronto';
  if (/tokyo|japan/i.test(loc)) return 'Asia/Tokyo';
  if (/singapore/i.test(loc)) return 'Asia/Singapore';
  if (/sydney|melbourne|australia/i.test(loc)) return 'Australia/Sydney';
  if (/bangalore|mumbai|india/i.test(loc)) return 'Asia/Kolkata';
  if (/tel aviv|israel/i.test(loc)) return 'Asia/Tel_Aviv';

  return null;
}

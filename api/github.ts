/* eslint-disable no-console */
/**
 * GitHub API Proxy
 *
 * Serverless function that fetches GitHub profile data for candidate enrichment.
 * Extracts valuable signals: languages, contribution patterns, open source involvement.
 *
 * Actions:
 * - user: Get user profile
 * - repos: Get user's repositories
 * - languages: Get aggregated language stats across all repos
 * - activity: Get recent activity (commits, PRs, issues)
 * - full: Get complete profile with all data (user + repos + languages)
 *
 * @see api/lib/schemas.ts for schemas
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  ErrorCode,
  GitHubUserSchema,
  GitHubRepoSchema,
} from './lib/schemas';
import {
  handleCors,
  applyCors,
  rawSuccess,
  error,
  validationError,
  authError,
  externalError,
  internalError,
  logRequest,
} from './lib/responses';

// ============================================================
// CONSTANTS
// ============================================================

const GITHUB_API_BASE = 'https://api.github.com';
const FETCH_TIMEOUT = 15000;

// ============================================================
// INPUT SCHEMAS
// ============================================================

const UsernameParamSchema = z.object({
  username: z.string().min(1, 'username is required').max(39),
});

// ============================================================
// HELPERS
// ============================================================

/**
 * Fetch with timeout and auth
 */
async function githubFetch(
  path: string,
  token?: string,
  timeoutMs = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'RecruitOS/1.0',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get API token from headers or env
 */
function getToken(req: VercelRequest): string | undefined {
  return (
    (req.headers['x-github-token'] as string) ||
    process.env.GITHUB_TOKEN ||
    undefined
  );
}

/**
 * Extract username from GitHub URL
 */
function extractUsername(input: string): string {
  // If it's a URL, extract the username
  if (input.includes('github.com/')) {
    const match = input.match(/github\.com\/([^/\s?]+)/);
    if (match) return match[1];
  }
  // Otherwise assume it's already a username
  return input;
}

// ============================================================
// ACTION HANDLERS
// ============================================================

/**
 * Get user profile
 */
async function handleUser(
  req: VercelRequest,
  res: VercelResponse,
  token?: string
): Promise<VercelResponse> {
  const rawUsername = (req.query.username as string) || '';
  const username = extractUsername(rawUsername);

  const parseResult = UsernameParamSchema.safeParse({ username });
  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  try {
    const response = await githubFetch(`/users/${username}`, token);

    if (response.status === 404) {
      return error(res, `GitHub user not found: ${username}`, 404);
    }

    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        return error(res, 'GitHub API rate limit exceeded', 429, {
          code: ErrorCode.RATE_LIMITED,
        });
      }
    }

    if (!response.ok) {
      return externalError(res, 'GitHub', await response.text());
    }

    const data = await response.json();
    return rawSuccess(res, data);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'GitHub API timeout', 504);
    }
    return internalError(res, err);
  }
}

/**
 * Get user's repositories
 */
async function handleRepos(
  req: VercelRequest,
  res: VercelResponse,
  token?: string
): Promise<VercelResponse> {
  const rawUsername = (req.query.username as string) || '';
  const username = extractUsername(rawUsername);

  const parseResult = UsernameParamSchema.safeParse({ username });
  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  try {
    // Get up to 100 repos, sorted by last update
    const response = await githubFetch(
      `/users/${username}/repos?per_page=100&sort=updated&direction=desc`,
      token
    );

    if (response.status === 404) {
      return error(res, `GitHub user not found: ${username}`, 404);
    }

    if (!response.ok) {
      return externalError(res, 'GitHub', await response.text());
    }

    const repos = await response.json();

    // Filter out forks and sort by stars
    const originalRepos = repos
      .filter((r: { fork: boolean }) => !r.fork)
      .sort((a: { stargazers_count: number }, b: { stargazers_count: number }) =>
        b.stargazers_count - a.stargazers_count
      );

    return rawSuccess(res, {
      total: repos.length,
      original: originalRepos.length,
      repos: originalRepos,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'GitHub API timeout', 504);
    }
    return internalError(res, err);
  }
}

/**
 * Get aggregated language statistics
 */
async function handleLanguages(
  req: VercelRequest,
  res: VercelResponse,
  token?: string
): Promise<VercelResponse> {
  const rawUsername = (req.query.username as string) || '';
  const username = extractUsername(rawUsername);

  const parseResult = UsernameParamSchema.safeParse({ username });
  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  try {
    // Get repos first
    const reposResponse = await githubFetch(
      `/users/${username}/repos?per_page=100&sort=updated`,
      token
    );

    if (reposResponse.status === 404) {
      return error(res, `GitHub user not found: ${username}`, 404);
    }

    if (!reposResponse.ok) {
      return externalError(res, 'GitHub', await reposResponse.text());
    }

    const repos = await reposResponse.json();

    // Aggregate languages from repo metadata
    const languageCounts: Record<string, number> = {};
    const languageBytes: Record<string, number> = {};

    for (const repo of repos) {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    }

    // Sort by count
    const sortedLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([language, count]) => ({
        language,
        repoCount: count,
        percentage: Math.round((count / repos.length) * 100),
      }));

    return rawSuccess(res, {
      totalRepos: repos.length,
      languages: sortedLanguages,
      topLanguage: sortedLanguages[0]?.language || null,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'GitHub API timeout', 504);
    }
    return internalError(res, err);
  }
}

/**
 * Get recent activity summary
 */
async function handleActivity(
  req: VercelRequest,
  res: VercelResponse,
  token?: string
): Promise<VercelResponse> {
  const rawUsername = (req.query.username as string) || '';
  const username = extractUsername(rawUsername);

  const parseResult = UsernameParamSchema.safeParse({ username });
  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  try {
    // Get public events (last 90 days)
    const response = await githubFetch(
      `/users/${username}/events/public?per_page=100`,
      token
    );

    if (response.status === 404) {
      return error(res, `GitHub user not found: ${username}`, 404);
    }

    if (!response.ok) {
      return externalError(res, 'GitHub', await response.text());
    }

    const events = await response.json();

    // Aggregate event types
    const eventCounts: Record<string, number> = {};
    const recentRepos = new Set<string>();

    for (const event of events) {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      if (event.repo?.name) {
        recentRepos.add(event.repo.name);
      }
    }

    // Calculate activity trend
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const lastWeekEvents = events.filter(
      (e: { created_at: string }) => new Date(e.created_at).getTime() > oneWeekAgo
    ).length;

    const prevWeekEvents = events.filter(
      (e: { created_at: string }) => {
        const time = new Date(e.created_at).getTime();
        return time > twoWeeksAgo && time <= oneWeekAgo;
      }
    ).length;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (lastWeekEvents > prevWeekEvents * 1.5) trend = 'increasing';
    else if (lastWeekEvents < prevWeekEvents * 0.5) trend = 'decreasing';

    return rawSuccess(res, {
      totalEvents: events.length,
      eventTypes: eventCounts,
      recentRepos: Array.from(recentRepos).slice(0, 10),
      lastWeekEvents,
      activityTrend: trend,
      mostCommonEvent: Object.entries(eventCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'GitHub API timeout', 504);
    }
    return internalError(res, err);
  }
}

/**
 * Get full profile with all data
 */
async function handleFull(
  req: VercelRequest,
  res: VercelResponse,
  token?: string
): Promise<VercelResponse> {
  const rawUsername = (req.query.username as string) || '';
  const username = extractUsername(rawUsername);

  const parseResult = UsernameParamSchema.safeParse({ username });
  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  const requestId = logRequest('GITHUB_FULL', username);

  try {
    // Fetch user and repos in parallel
    const [userResponse, reposResponse, eventsResponse] = await Promise.all([
      githubFetch(`/users/${username}`, token),
      githubFetch(`/users/${username}/repos?per_page=100&sort=updated`, token),
      githubFetch(`/users/${username}/events/public?per_page=50`, token),
    ]);

    if (userResponse.status === 404) {
      return error(res, `GitHub user not found: ${username}`, 404);
    }

    if (!userResponse.ok || !reposResponse.ok) {
      return externalError(res, 'GitHub', 'Failed to fetch profile data');
    }

    const [user, repos, events] = await Promise.all([
      userResponse.json(),
      reposResponse.json(),
      eventsResponse.ok ? eventsResponse.json() : [],
    ]);

    // Process repos
    const originalRepos = repos.filter((r: { fork: boolean }) => !r.fork);
    const topRepos = originalRepos
      .sort((a: { stargazers_count: number }, b: { stargazers_count: number }) =>
        b.stargazers_count - a.stargazers_count
      )
      .slice(0, 10);

    // Aggregate languages
    const languageCounts: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    }

    const topLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([language, count]) => ({
        language,
        repoCount: count,
        percentage: Math.round((count / repos.length) * 100),
      }));

    // Calculate activity metrics
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const lastWeekEvents = events.filter(
      (e: { created_at: string }) => new Date(e.created_at).getTime() > oneWeekAgo
    ).length;

    // Aggregate topics/skills from repos
    const allTopics = new Set<string>();
    for (const repo of repos) {
      for (const topic of repo.topics || []) {
        allTopics.add(topic);
      }
    }

    // Calculate profile quality score (0-100)
    let qualityScore = 0;
    if (user.bio) qualityScore += 15;
    if (user.company) qualityScore += 10;
    if (user.location) qualityScore += 10;
    if (user.blog) qualityScore += 5;
    if (user.hireable) qualityScore += 10;
    if (originalRepos.length > 0) qualityScore += 15;
    if (originalRepos.length > 5) qualityScore += 10;
    if (user.followers > 10) qualityScore += 10;
    if (topLanguages.length > 2) qualityScore += 10;
    if (lastWeekEvents > 0) qualityScore += 5;

    console.log(`[${requestId}] Full profile fetched: ${username}, quality: ${qualityScore}`);

    return rawSuccess(res, {
      user: {
        login: user.login,
        name: user.name,
        bio: user.bio,
        company: user.company,
        location: user.location,
        blog: user.blog,
        email: user.email,
        hireable: user.hireable,
        followers: user.followers,
        following: user.following,
        publicRepos: user.public_repos,
        createdAt: user.created_at,
        avatarUrl: user.avatar_url,
      },
      repos: {
        total: repos.length,
        original: originalRepos.length,
        topRepos: topRepos.map((r: {
          name: string;
          description: string | null;
          language: string | null;
          stargazers_count: number;
          forks_count: number;
          topics: string[];
          html_url: string;
        }) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          topics: r.topics || [],
          url: r.html_url,
        })),
      },
      languages: topLanguages,
      topics: Array.from(allTopics).slice(0, 20),
      activity: {
        totalRecentEvents: events.length,
        lastWeekEvents,
        trend: lastWeekEvents > 10 ? 'high' : lastWeekEvents > 3 ? 'moderate' : 'low',
      },
      qualityScore,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'GitHub API timeout', 504);
    }
    return internalError(res, err);
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCors(res);
  }

  applyCors(res);

  const { action } = req.query;
  const token = getToken(req);

  // Validate action
  const validActions = ['user', 'repos', 'languages', 'activity', 'full'];
  if (!action || !validActions.includes(action as string)) {
    return error(res, `Invalid action. Use: ${validActions.join(', ')}`, 400, {
      code: ErrorCode.INVALID_ACTION,
    });
  }

  try {
    switch (action) {
      case 'user':
        return await handleUser(req, res, token);

      case 'repos':
        return await handleRepos(req, res, token);

      case 'languages':
        return await handleLanguages(req, res, token);

      case 'activity':
        return await handleActivity(req, res, token);

      case 'full':
        return await handleFull(req, res, token);

      default:
        return error(res, `Unknown action: ${action}`, 400, {
          code: ErrorCode.INVALID_ACTION,
        });
    }
  } catch (err) {
    console.error('GitHub API handler error:', err);
    return internalError(res, err);
  }
}

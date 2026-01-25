 
/**
 * Behavioral Signals Service - Real-time Activity Tracking
 *
 * Tracks candidate's recent activity to assess:
 * 1. GitHub contributions and coding activity
 * 2. Conference speaking engagements
 * 3. Job change patterns (LinkedIn activity)
 * 4. Content creation (articles, posts)
 * 5. Overall approach readiness
 */

import type {
  BehavioralSignals,
  GitHubActivity,
  ConferenceSpeaking,
  JobChangeSignal,
  ContentActivity,
} from '../types';

// Helper to safely get env vars
const getEnv = (key: string): string | undefined => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

const getBrightDataKey = (): string | null => {
  return localStorage.getItem('BRIGHTDATA_API_KEY') || getEnv('BRIGHTDATA_API_KEY') || null;
};

/**
 * Extract GitHub username from various URL formats
 */
function extractGitHubUsername(url: string): string | null {
  const patterns = [
    /github\.com\/([a-zA-Z0-9_-]+)\/?$/,
    /github\.com\/([a-zA-Z0-9_-]+)\/[^/]+/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && !['orgs', 'settings', 'notifications'].includes(match[1])) {
      return match[1];
    }
  }
  return null;
}

/**
 * Fetch GitHub activity via public API (no auth needed for public profiles)
 */
async function fetchGitHubActivity(username: string): Promise<GitHubActivity | null> {
  try {
    // Fetch user profile
    const profileResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (!profileResponse.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[BehavioralSignals] GitHub profile not found:', username);
      }
      return null;
    }

    const profile = await profileResponse.json();

    // Fetch recent repos
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );

    const repos = reposResponse.ok ? await reposResponse.json() : [];

    // Fetch recent events (contributions)
    const eventsResponse = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=100`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );

    const events = eventsResponse.ok ? await eventsResponse.json() : [];

    // Calculate activity metrics
    const pushEvents = events.filter((e: { type: string }) => e.type === 'PushEvent');
    const prEvents = events.filter((e: { type: string }) => e.type === 'PullRequestEvent');
    const issueEvents = events.filter((e: { type: string }) => e.type === 'IssuesEvent');

    // Calculate contribution streak
    const eventDates = events.map((e: { created_at: string }) =>
      new Date(e.created_at).toDateString()
    );
    const uniqueDates = [...new Set(eventDates)] as string[];
    const streak = calculateStreak(uniqueDates);

    // Determine activity trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEvents = events.filter(
      (e: { created_at: string }) => new Date(e.created_at) > thirtyDaysAgo
    );

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const olderEvents = events.filter(
      (e: { created_at: string }) =>
        new Date(e.created_at) > sixtyDaysAgo &&
        new Date(e.created_at) <= thirtyDaysAgo
    );

    let activityTrend: 'increasing' | 'stable' | 'declining' = 'stable';
    if (recentEvents.length > olderEvents.length * 1.2) {
      activityTrend = 'increasing';
    } else if (recentEvents.length < olderEvents.length * 0.8) {
      activityTrend = 'declining';
    }

    // Calculate top languages
    const languageCounts: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    }

    const totalLangCount = Object.values(languageCounts).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        percentage: Math.round((count / totalLangCount) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Find open source contributions (repos not owned by user)
    const openSourceContributions: Array<{
      repo: string;
      type: 'commit' | 'pr' | 'issue' | 'review';
      count: number;
    }> = [];

    const externalPRs = prEvents.filter(
      (e: { repo?: { name?: string } }) =>
        e.repo?.name && !e.repo.name.startsWith(`${username}/`)
    );

    if (externalPRs.length > 0) {
      const prByRepo: Record<string, number> = {};
      for (const pr of externalPRs) {
        const repoName = pr.repo?.name || 'unknown';
        prByRepo[repoName] = (prByRepo[repoName] || 0) + 1;
      }

      for (const [repo, count] of Object.entries(prByRepo)) {
        openSourceContributions.push({ repo, type: 'pr', count });
      }
    }

    return {
      username,
      profileUrl: profile.html_url,
      totalContributions: pushEvents.length + prEvents.length + issueEvents.length,
      contributionStreak: streak,
      topLanguages,
      recentRepos: repos.slice(0, 5).map((repo: {
        name: string;
        description: string | null;
        stargazers_count: number;
        pushed_at: string;
        fork: boolean;
      }) => ({
        name: repo.name,
        description: repo.description || '',
        stars: repo.stargazers_count,
        lastCommit: repo.pushed_at,
        isOriginal: !repo.fork,
      })),
      openSourceContributions,
      activityTrend,
      lastActiveDate: events[0]?.created_at || profile.updated_at,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[BehavioralSignals] GitHub fetch error:', error);
    }
    return null;
  }
}

/**
 * Calculate contribution streak from unique activity dates
 */
function calculateStreak(uniqueDates: string[]): number {
  if (uniqueDates.length === 0) return 0;

  const sortedDates = uniqueDates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = today;

  for (const date of sortedDates) {
    const daysDiff = Math.floor(
      (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 1) {
      streak++;
      currentDate = date;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Search for conference speaking engagements via SERP
 */
async function searchSpeakingEngagements(
  name: string
): Promise<ConferenceSpeaking[]> {
  const brightDataKey = getBrightDataKey();
  if (!brightDataKey) return [];

  const speakingEvents: ConferenceSpeaking[] = [];

  try {
    // Search for conference talks
    const queries = [
      `"${name}" speaker conference talk`,
      `"${name}" keynote presentation`,
      `"${name}" tech talk meetup`,
    ];

    for (const query of queries) {
      const response = await fetch('/api/brightdata?action=serp-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BrightData-Key': brightDataKey,
        },
        body: JSON.stringify({ keyword: query }),
      });

      if (!response.ok) continue;

      const { snapshot_id } = await response.json();
      if (!snapshot_id) continue;

      // Poll for results
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const snapshotResponse = await fetch(
        `/api/brightdata?action=snapshot&snapshot_id=${snapshot_id}`,
        { headers: { 'X-BrightData-Key': brightDataKey } }
      );

      if (!snapshotResponse.ok) continue;

      const serpData = await snapshotResponse.json();

      for (const item of serpData) {
        if (item.organic_results) {
          for (const result of item.organic_results) {
            // Filter for likely conference/speaking results
            const isConference =
              /conference|summit|meetup|talk|keynote|speaker/i.test(
                result.title + ' ' + (result.snippet || '')
              );

            if (isConference && result.url) {
              // Extract event details from snippet
              const dateMatch = (result.snippet || '').match(
                /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|([A-Z][a-z]+ \d{1,2},? \d{4})/
              );

              speakingEvents.push({
                eventName: result.title?.replace(/[|–-].*/g, '').trim() || 'Conference',
                date: dateMatch ? dateMatch[0] : 'Unknown',
                topic: result.snippet?.slice(0, 100) || '',
                role: /keynote/i.test(result.title || '') ? 'keynote' : 'speaker',
                eventUrl: result.url,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[BehavioralSignals] Speaking search error:', error);
    }
  }

  // Deduplicate by event URL
  const seen = new Set<string>();
  return speakingEvents.filter((e) => {
    if (seen.has(e.eventUrl || '')) return false;
    seen.add(e.eventUrl || '');
    return true;
  }).slice(0, 10); // Limit to 10 results
}

/**
 * Detect job change signals from LinkedIn activity
 */
async function detectJobChangeSignals(
  linkedinUrl: string,
  previousProfileData?: { title?: string; company?: string; location?: string }
): Promise<JobChangeSignal[]> {
  const brightDataKey = getBrightDataKey();
  if (!brightDataKey) return [];

  const signals: JobChangeSignal[] = [];

  try {
    // Fetch current LinkedIn data
    const response = await fetch('/api/brightdata?action=trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BrightData-Key': brightDataKey,
      },
      body: JSON.stringify({ url: linkedinUrl }),
    });

    if (!response.ok) return signals;

    const { snapshot_id } = await response.json();
    if (!snapshot_id) return signals;

    // Poll for results
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const snapshotResponse = await fetch(
      `/api/brightdata?action=snapshot&snapshot_id=${snapshot_id}`,
      { headers: { 'X-BrightData-Key': brightDataKey } }
    );

    if (!snapshotResponse.ok) return signals;

    const data = await snapshotResponse.json();
    const profile = Array.isArray(data) ? data[0] : data;

    const currentTitle = profile.title || profile.headline;
    const currentCompany = profile.company || profile.current_company;
    const currentLocation = profile.location;

    // Compare with previous data if available
    if (previousProfileData) {
      if (
        previousProfileData.title &&
        currentTitle &&
        previousProfileData.title !== currentTitle
      ) {
        signals.push({
          type: 'title_change',
          detectedAt: new Date().toISOString(),
          previousValue: previousProfileData.title,
          newValue: currentTitle,
          significance: 'high',
          interpretation: currentTitle.toLowerCase().includes('senior') ||
            currentTitle.toLowerCase().includes('lead') ||
            currentTitle.toLowerCase().includes('director')
            ? 'Recently promoted - may be satisfied in current role'
            : 'Title changed - could indicate role transition',
        });
      }

      if (
        previousProfileData.company &&
        currentCompany &&
        previousProfileData.company !== currentCompany
      ) {
        signals.push({
          type: 'company_change',
          detectedAt: new Date().toISOString(),
          previousValue: previousProfileData.company,
          newValue: currentCompany,
          significance: 'high',
          interpretation: 'Recently changed companies - unlikely to be looking soon',
        });
      }

      if (
        previousProfileData.location &&
        currentLocation &&
        previousProfileData.location !== currentLocation
      ) {
        signals.push({
          type: 'location_change',
          detectedAt: new Date().toISOString(),
          previousValue: previousProfileData.location,
          newValue: currentLocation,
          significance: 'medium',
          interpretation: 'Relocated - may indicate life change or new opportunity',
        });
      }
    }

    // Check for "Open to Work" signal
    if (profile.open_to_work || profile.looking_for_opportunities) {
      signals.push({
        type: 'profile_update',
        detectedAt: new Date().toISOString(),
        newValue: 'Open to Work enabled',
        significance: 'high',
        interpretation: 'Actively looking for new opportunities - high approach readiness',
      });
    }

    // Check for recent profile updates
    const lastUpdated = profile.last_updated || profile.updated_at;
    if (lastUpdated) {
      const updateDate = new Date(lastUpdated);
      const daysSinceUpdate = Math.floor(
        (Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate <= 7) {
        signals.push({
          type: 'profile_update',
          detectedAt: new Date().toISOString(),
          newValue: `Profile updated ${daysSinceUpdate} days ago`,
          significance: 'medium',
          interpretation: 'Recent profile activity - may be exploring options',
        });
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[BehavioralSignals] Job change detection error:', error);
    }
  }

  return signals;
}

/**
 * Search for content activity (articles, posts)
 */
async function searchContentActivity(name: string): Promise<ContentActivity[]> {
  const brightDataKey = getBrightDataKey();
  if (!brightDataKey) return [];

  const activities: ContentActivity[] = [];

  try {
    const platforms = [
      { name: 'medium', query: `site:medium.com "@${name}"` },
      { name: 'dev_to', query: `site:dev.to "${name}"` },
      { name: 'linkedin', query: `site:linkedin.com/pulse "${name}"` },
    ];

    for (const platform of platforms) {
      const response = await fetch('/api/brightdata?action=serp-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BrightData-Key': brightDataKey,
        },
        body: JSON.stringify({ keyword: platform.query }),
      });

      if (!response.ok) continue;

      const { snapshot_id } = await response.json();
      if (!snapshot_id) continue;

      // Poll for results
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const snapshotResponse = await fetch(
        `/api/brightdata?action=snapshot&snapshot_id=${snapshot_id}`,
        { headers: { 'X-BrightData-Key': brightDataKey } }
      );

      if (!snapshotResponse.ok) continue;

      const serpData = await snapshotResponse.json();

      for (const item of serpData) {
        if (item.organic_results) {
          for (const result of item.organic_results.slice(0, 5)) {
            // Extract date if available
            const dateMatch = (result.snippet || '').match(
              /([A-Z][a-z]+ \d{1,2},? \d{4})|(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/
            );

            activities.push({
              platform: platform.name as ContentActivity['platform'],
              type: 'article',
              date: dateMatch ? dateMatch[0] : 'Unknown',
              topic: result.title,
              url: result.url,
            });
          }
        }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[BehavioralSignals] Content search error:', error);
    }
  }

  return activities.slice(0, 15); // Limit results
}

/**
 * Calculate overall engagement recency
 */
function calculateEngagementRecency(
  github: GitHubActivity | null | undefined,
  contentActivity: ContentActivity[],
  jobSignals: JobChangeSignal[]
): 'active' | 'moderate' | 'dormant' {
  let activityScore = 0;

  // GitHub activity
  if (github) {
    if (github.activityTrend === 'increasing') activityScore += 3;
    else if (github.activityTrend === 'stable') activityScore += 2;
    else activityScore += 1;

    if (github.contributionStreak > 7) activityScore += 2;
    else if (github.contributionStreak > 0) activityScore += 1;
  }

  // Content activity
  const recentContent = contentActivity.filter((c) => {
    if (c.date === 'Unknown') return false;
    const date = new Date(c.date);
    const monthsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 6;
  });

  if (recentContent.length >= 3) activityScore += 3;
  else if (recentContent.length >= 1) activityScore += 2;

  // Job change signals
  const recentSignals = jobSignals.filter((s) => {
    const date = new Date(s.detectedAt);
    const monthsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 3;
  });

  if (recentSignals.length > 0) activityScore += 2;

  // Determine recency level
  if (activityScore >= 6) return 'active';
  if (activityScore >= 3) return 'moderate';
  return 'dormant';
}

/**
 * Determine approach readiness based on all signals
 */
function determineApproachReadiness(
  jobSignals: JobChangeSignal[],
  engagementRecency: 'active' | 'moderate' | 'dormant',
  openToWork: boolean
): 'ready' | 'neutral' | 'not_ready' {
  // Open to work is the strongest signal
  if (openToWork) return 'ready';

  // Recent company change = not ready
  const recentCompanyChange = jobSignals.find(
    (s) =>
      s.type === 'company_change' &&
      new Date(s.detectedAt).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
  );
  if (recentCompanyChange) return 'not_ready';

  // Recent promotion = likely not ready
  const recentPromotion = jobSignals.find(
    (s) =>
      s.type === 'title_change' &&
      s.interpretation?.includes('promoted') &&
      new Date(s.detectedAt).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
  );
  if (recentPromotion) return 'not_ready';

  // Active engagement + recent profile update = likely ready
  const recentProfileUpdate = jobSignals.find(
    (s) =>
      s.type === 'profile_update' &&
      new Date(s.detectedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
  );

  if (engagementRecency === 'active' && recentProfileUpdate) return 'ready';
  if (engagementRecency === 'active') return 'neutral';
  if (engagementRecency === 'dormant') return 'neutral';

  return 'neutral';
}

/**
 * Infer best time to reach based on activity patterns
 */
function inferBestTimeToReach(
  github: GitHubActivity | null | undefined,
  contentActivity: ContentActivity[]
): string {
  // This is a simplified heuristic - in production would analyze timestamps more deeply

  if (github?.activityTrend === 'increasing') {
    return 'Currently very active - reach out soon while engaged';
  }

  if (github?.contributionStreak && github.contributionStreak > 30) {
    return 'Highly consistent activity - any weekday morning should work';
  }

  const recentContent = contentActivity.filter((c) => c.date !== 'Unknown').length;

  if (recentContent > 3) {
    return 'Active content creator - reach out after they publish new content';
  }

  if (github?.activityTrend === 'declining') {
    return 'Activity declining - may be good time as they could be looking for change';
  }

  return 'Standard timing - Tuesday/Wednesday mid-morning typically best';
}

/**
 * Main function: Collect all behavioral signals for a candidate
 */
export async function collectBehavioralSignals(
  candidateId: string,
  name: string,
  linkedinUrl?: string,
  githubUrl?: string,
  previousData?: { title?: string; company?: string; location?: string }
): Promise<BehavioralSignals> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[BehavioralSignals] Collecting signals for:', name);
    console.log('[BehavioralSignals] GitHub:', githubUrl || 'none');
    console.log('[BehavioralSignals] LinkedIn:', linkedinUrl || 'none');
  }

  // Collect GitHub activity
  let github: GitHubActivity | undefined;
  if (githubUrl) {
    const username = extractGitHubUsername(githubUrl);
    if (username) {
      github = (await fetchGitHubActivity(username)) || undefined;
    }
  }

  // Collect other signals in parallel
  const [speakingEngagements, jobChangeSignals, contentActivity] = await Promise.all([
    searchSpeakingEngagements(name),
    linkedinUrl ? detectJobChangeSignals(linkedinUrl, previousData) : Promise.resolve([]),
    searchContentActivity(name),
  ]);

  // Check for Open to Work signal
  const openToWorkSignal = jobChangeSignals.some(
    (s) => s.newValue?.includes('Open to Work')
  );

  // Count recent profile updates
  const recentProfileUpdates = jobChangeSignals.filter(
    (s) => s.type === 'profile_update'
  ).length;

  // Calculate engagement metrics
  const engagementRecency = calculateEngagementRecency(
    github,
    contentActivity,
    jobChangeSignals
  );

  const approachReadiness = determineApproachReadiness(
    jobChangeSignals,
    engagementRecency,
    openToWorkSignal
  );

  const bestTimeToReach = inferBestTimeToReach(github, contentActivity);

  const signals: BehavioralSignals = {
    candidateId,
    github,
    speakingEngagements,
    jobChangeSignals,
    contentActivity,
    openToWorkSignal: openToWorkSignal || undefined,
    recentProfileUpdates,
    engagementRecency,
    bestTimeToReach,
    approachReadiness,
    generatedAt: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[BehavioralSignals] ✅ Signals collected:', {
      hasGitHub: !!github,
      speakingEvents: speakingEngagements.length,
      jobSignals: jobChangeSignals.length,
      contentItems: contentActivity.length,
      approachReadiness,
    });
  }

  return signals;
}

/**
 * Quick behavioral check - GitHub only (faster, no SERP calls)
 */
export async function quickBehavioralCheck(
  candidateId: string,
  githubUrl?: string
): Promise<Partial<BehavioralSignals> | null> {
  if (!githubUrl) return null;

  const username = extractGitHubUsername(githubUrl);
  if (!username) return null;

  const github = await fetchGitHubActivity(username);
  if (!github) return null;

  const engagementRecency = calculateEngagementRecency(github, [], []);

  return {
    candidateId,
    github,
    engagementRecency,
    approachReadiness: engagementRecency === 'active' ? 'neutral' : 'neutral',
    generatedAt: new Date().toISOString(),
  };
}

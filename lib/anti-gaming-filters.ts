/**
 * Anti-Gaming Filters for RecruitOS
 * 
 * Detects and down-weights low-signal GitHub profiles that may be gaming the system:
 * - Tutorial-only repos
 * - Fork-heavy profiles without substantial contributions
 * - Commit timing anomalies (burst patterns)
 * - Low-substance diffs
 * 
 * Weights toward:
 * - Substantive diffs
 * - PR reviews given/received
 * - Maintained projects
 * - Issue discussions
 */

import { Octokit } from "@octokit/rest";

export interface QualitySignals {
  isTutorialRepo: boolean;
  forkRatio: number; // 0-1, percentage of repos that are forks
  hasSustantiveContributions: boolean;
  hasCommitBursts: boolean;
  substantiveDiffScore: number; // 0-100
  reviewParticipation: number; // 0-100
  maintenanceScore: number; // 0-100
  issueDiscussionScore: number; // 0-100
  overallQualityScore: number; // 0-100
  flags: string[]; // Human-readable quality flags
}

export interface RepositoryQuality {
  name: string;
  isTutorial: boolean;
  isFork: boolean;
  hasSubstantiveCommits: boolean;
  maintenanceLevel: 'active' | 'maintained' | 'stale';
  qualityScore: number; // 0-100
}

// Common tutorial repo patterns
const TUTORIAL_PATTERNS = [
  /tutorial/i,
  /learn(ing)?/i,
  /course/i,
  /practice/i,
  /exercise/i,
  /sample/i,
  /demo/i,
  /example/i,
  /test(ing)?-?repo/i,
  /hello-?world/i,
  /getting-?started/i,
  /udemy/i,
  /coursera/i,
  /bootcamp/i,
  /freecodecamp/i,
  /codecademy/i,
  /playground/i,
  /sandbox/i,
  /kata/i,
  /challenge/i,
  /starter(-?template)?/i,
  /boilerplate/i,
];

// Common boilerplate project names
const BOILERPLATE_NAMES = [
  'my-first-repo',
  'first-repo',
  'test-repo',
  'test',
  'hello-world',
  'untitled',
  'new-project',
  'my-project',
  'project-1',
  'practice',
  'experiments',
  'scratch',
];

/**
 * Detect if a repository is likely a tutorial or learning project
 */
export function isTutorialRepository(repo: {
  name: string;
  description?: string | null;
  size?: number;
  stargazers_count?: number;
  forks_count?: number;
  topics?: string[];
}): boolean {
  const name = repo.name.toLowerCase();
  const description = (repo.description || '').toLowerCase();
  const topics = (repo.topics || []).map(t => t.toLowerCase());
  
  // Check name patterns
  for (const pattern of TUTORIAL_PATTERNS) {
    if (pattern.test(name) || pattern.test(description)) {
      return true;
    }
  }
  
  // Check exact boilerplate names
  if (BOILERPLATE_NAMES.includes(name)) {
    return true;
  }
  
  // Check topics for tutorial indicators
  const tutorialTopics = ['tutorial', 'learning', 'education', 'course', 'practice'];
  if (topics.some(t => tutorialTopics.includes(t))) {
    return true;
  }
  
  // Very small repos with no stars are often test repos
  if ((repo.size || 0) < 100 && (repo.stargazers_count || 0) === 0) {
    if (name.includes('test') || name.includes('temp') || name.includes('tmp')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analyze commit patterns for suspicious bursts
 */
export async function detectCommitBursts(
  events: Array<{ type: string; created_at?: string; payload?: any }>
): Promise<{ hasBursts: boolean; burstDays: number; details: string[] }> {
  const pushEvents = events.filter(e => e.type === 'PushEvent');
  
  if (pushEvents.length === 0) {
    return { hasBursts: false, burstDays: 0, details: [] };
  }
  
  // Group commits by day
  const commitsByDay = new Map<string, number>();
  pushEvents.forEach(event => {
    const date = new Date(event.created_at || '');
    const dayKey = date.toISOString().split('T')[0];
    const commitCount = event.payload?.commits?.length || 1;
    commitsByDay.set(dayKey, (commitsByDay.get(dayKey) || 0) + commitCount);
  });
  
  // Detect anomalies
  const dailyCounts = Array.from(commitsByDay.values());
  const avgCommitsPerDay = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
  const maxCommitsInDay = Math.max(...dailyCounts);
  
  const details: string[] = [];
  let burstDays = 0;
  
  // Flag days with >5x average activity
  commitsByDay.forEach((count, day) => {
    if (count > avgCommitsPerDay * 5 && count > 20) {
      burstDays++;
      details.push(`${count} commits on ${day} (${Math.round(count / avgCommitsPerDay)}x average)`);
    }
  });
  
  const hasBursts = burstDays >= 2 || maxCommitsInDay > 100;
  
  if (hasBursts) {
    details.unshift(`Detected ${burstDays} suspicious burst days`);
  }
  
  return { hasBursts, burstDays, details };
}

/**
 * Analyze repository quality and maintenance level
 */
export async function analyzeRepositoryQuality(
  repo: any,
  octokit: Octokit,
  username: string
): Promise<RepositoryQuality> {
  const isTutorial = isTutorialRepository(repo);
  const isFork = repo.fork || false;
  
  let hasSubstantiveCommits = false;
  let maintenanceLevel: 'active' | 'maintained' | 'stale' = 'stale';
  
  try {
    // Check recent activity
    const updatedAt = new Date(repo.updated_at || repo.pushed_at || '');
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 30) {
      maintenanceLevel = 'active';
    } else if (daysSinceUpdate < 180) {
      maintenanceLevel = 'maintained';
    }
    
    // For owned repos, check commit substance
    if (!isFork) {
      const commits = await octokit.repos.listCommits({
        owner: username,
        repo: repo.name,
        per_page: 10,
      }).catch(() => ({ data: [] }));
      
      // Check for substantial commits (not just README updates)
      hasSubstantiveCommits = commits.data.some(commit => {
        const message = (commit.commit?.message || '').toLowerCase();
        return !message.includes('initial commit') &&
               !message.includes('update readme') &&
               !message.includes('fix typo') &&
               message.length > 20;
      });
    }
  } catch (error) {
    // Ignore errors for private/deleted repos
  }
  
  // Calculate quality score
  let qualityScore = 50;
  
  if (isTutorial) qualityScore -= 40;
  if (isFork && !hasSubstantiveCommits) qualityScore -= 20;
  if (hasSubstantiveCommits) qualityScore += 30;
  if (maintenanceLevel === 'active') qualityScore += 20;
  else if (maintenanceLevel === 'maintained') qualityScore += 10;
  
  // Boost for stars/forks (indicators of impact)
  if ((repo.stargazers_count || 0) > 50) qualityScore += 15;
  else if ((repo.stargazers_count || 0) > 10) qualityScore += 10;
  else if ((repo.stargazers_count || 0) > 5) qualityScore += 5;
  
  qualityScore = Math.max(0, Math.min(100, qualityScore));
  
  return {
    name: repo.name,
    isTutorial,
    isFork,
    hasSubstantiveCommits,
    maintenanceLevel,
    qualityScore,
  };
}

/**
 * Calculate comprehensive quality signals for a GitHub profile
 */
export async function calculateQualitySignals(
  username: string,
  octokit: Octokit
): Promise<QualitySignals> {
  const result: QualitySignals = {
    isTutorialRepo: false,
    forkRatio: 0,
    hasSustantiveContributions: false,
    hasCommitBursts: false,
    substantiveDiffScore: 0,
    reviewParticipation: 0,
    maintenanceScore: 0,
    issueDiscussionScore: 0,
    overallQualityScore: 50,
    flags: [],
  };
  
  try {
    // Fetch repos and events
    const [reposResponse, eventsResponse] = await Promise.all([
      octokit.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 100,
      }),
      octokit.activity.listPublicEventsForUser({
        username,
        per_page: 100,
      }),
    ]);
    
    const repos = reposResponse.data;
    const events = eventsResponse.data;
    
    // 1. Analyze fork ratio
    const forks = repos.filter(r => r.fork);
    const owned = repos.filter(r => !r.fork);
    result.forkRatio = repos.length > 0 ? forks.length / repos.length : 0;
    
    if (result.forkRatio > 0.8) {
      result.flags.push(`Fork-heavy profile (${Math.round(result.forkRatio * 100)}% forks)`);
    }
    
    // 2. Check for tutorial repos in top 10
    const top10Repos = repos.slice(0, 10);
    const tutorialRepos = top10Repos.filter(isTutorialRepository);
    result.isTutorialRepo = tutorialRepos.length > 0;
    
    if (tutorialRepos.length >= 5) {
      result.flags.push(`${tutorialRepos.length}/10 top repos are tutorials`);
    } else if (tutorialRepos.length >= 3) {
      result.flags.push(`${tutorialRepos.length}/10 top repos are tutorials`);
    }
    
    // 3. Check commit patterns
    const filteredEvents = events
      .filter(e => e.type !== null)
      .map(e => ({ 
        type: e.type as string, 
        created_at: e.created_at ?? undefined,
        payload: e.payload 
      }));
    const burstAnalysis = await detectCommitBursts(filteredEvents);
    result.hasCommitBursts = burstAnalysis.hasBursts;
    
    if (burstAnalysis.hasBursts) {
      result.flags.push(...burstAnalysis.details);
    }
    
    // 4. Analyze repository quality (sample top repos)
    const repoQualities: RepositoryQuality[] = [];
    for (const repo of top10Repos.slice(0, 5)) {
      const quality = await analyzeRepositoryQuality(repo, octokit, username);
      repoQualities.push(quality);
    }
    
    const avgRepoQuality = repoQualities.length > 0
      ? repoQualities.reduce((sum, q) => sum + q.qualityScore, 0) / repoQualities.length
      : 50;
    
    result.substantiveDiffScore = avgRepoQuality;
    
    const substantiveRepos = repoQualities.filter(q => q.hasSubstantiveCommits);
    result.hasSustantiveContributions = substantiveRepos.length >= 2;
    
    if (!result.hasSustantiveContributions && owned.length > 5) {
      result.flags.push('Few substantive commits in owned repos');
    }
    
    // 5. Check PR review participation
    const reviewEvents = events.filter(e =>
      e.type === 'PullRequestReviewEvent' ||
      e.type === 'PullRequestReviewCommentEvent'
    );
    
    result.reviewParticipation = Math.min(100, reviewEvents.length * 5);
    
    if (reviewEvents.length > 10) {
      result.flags.push(`Active code reviewer (${reviewEvents.length} reviews)`);
    }
    
    // 6. Check issue discussion participation
    const issueEvents = events.filter(e =>
      e.type === 'IssueCommentEvent' ||
      e.type === 'IssuesEvent'
    );
    
    result.issueDiscussionScore = Math.min(100, issueEvents.length * 3);
    
    if (issueEvents.length > 15) {
      result.flags.push(`Active in discussions (${issueEvents.length} issue interactions)`);
    }
    
    // 7. Calculate maintenance score
    const activeRepos = repoQualities.filter(q => q.maintenanceLevel === 'active');
    const maintainedRepos = repoQualities.filter(q =>
      q.maintenanceLevel === 'active' || q.maintenanceLevel === 'maintained'
    );
    
    result.maintenanceScore = repoQualities.length > 0
      ? (maintainedRepos.length / repoQualities.length) * 100
      : 0;
    
    if (activeRepos.length === 0 && owned.length > 3) {
      result.flags.push('No actively maintained projects');
    }
    
    // 8. Calculate overall quality score
    let qualityScore = 50;
    
    // Penalties
    if (result.forkRatio > 0.8) qualityScore -= 20;
    else if (result.forkRatio > 0.6) qualityScore -= 10;
    
    if (tutorialRepos.length >= 5) qualityScore -= 25;
    else if (tutorialRepos.length >= 3) qualityScore -= 15;
    
    if (result.hasCommitBursts) qualityScore -= 15;
    
    if (!result.hasSustantiveContributions) qualityScore -= 10;
    
    // Bonuses
    qualityScore += result.substantiveDiffScore * 0.3;
    qualityScore += result.reviewParticipation * 0.15;
    qualityScore += result.maintenanceScore * 0.15;
    qualityScore += result.issueDiscussionScore * 0.1;
    
    result.overallQualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));
    
    // Add quality tier flag
    if (result.overallQualityScore >= 80) {
      result.flags.push('✓ High-quality profile');
    } else if (result.overallQualityScore >= 60) {
      result.flags.push('⚠ Moderate quality profile');
    } else if (result.overallQualityScore < 40) {
      result.flags.push('⚠ Low-quality signals detected');
    }
    
  } catch (error) {
    console.error('Error calculating quality signals:', error);
    result.flags.push('Error analyzing profile quality');
  }
  
  return result;
}

/**
 * Adjust a candidate's score based on quality signals
 */
export function applyQualityAdjustment(
  baseScore: number,
  qualitySignals: QualitySignals
): { adjustedScore: number; adjustment: number; reason: string } {
  // Center around 50: quality=50 → no change, >50 → boost, <50 → reduce
  // Max adjustment is ±25% of baseScore
  const qualityDelta = (qualitySignals.overallQualityScore - 50) / 50; // -1 to +1
  const adjustment = baseScore * qualityDelta * 0.25;
  const adjustedScore = Math.max(0, Math.min(99, Math.round(baseScore + adjustment)));

  let reason = '';
  if (adjustment < -10) {
    reason = 'Score reduced due to low-quality signals';
  } else if (adjustment > 10) {
    reason = 'Score boosted for high-quality contributions';
  } else {
    reason = 'No significant quality adjustment';
  }

  return { adjustedScore, adjustment: Math.round(adjustment), reason };
}

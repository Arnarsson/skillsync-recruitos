/**
 * Buildprint Service
 *
 * Computes the 5-metric "fingerprint" of how a developer builds:
 * - Impact: PRs that mattered (merged PRs, stars, forks)
 * - Collaboration: Review patterns (reviews given, comments, team projects)
 * - Consistency: Streak and regularity (commit frequency, active months)
 * - Complexity: Technical breadth (languages, repo size, topics)
 * - Ownership: Maintainer vs contributor (owned repos, solo projects)
 *
 * All data comes from existing GitHub APIs - no new API calls needed.
 */

export interface BuildprintMetric {
  value: number; // 0-100 normalized score
  label: string;
  icon: string; // Lucide icon name
  receipts: BuildprintReceipt[];
}

export interface BuildprintReceipt {
  label: string;
  value: string | number;
  url?: string;
  type: 'repo' | 'pr' | 'commit' | 'profile' | 'stat';
}

export interface Buildprint {
  impact: BuildprintMetric;
  collaboration: BuildprintMetric;
  consistency: BuildprintMetric;
  complexity: BuildprintMetric;
  ownership: BuildprintMetric;
  overallScore: number;
  generatedAt: string;
}

export interface GitHubDeepAnalysisInput {
  commitActivity?: {
    totalCommits?: number;
    averagePerWeek?: number;
    mostActiveDay?: string;
    recentCommits?: string[];
  };
  pullRequests?: {
    totalOpened?: number;
    totalMerged?: number;
    recentPRs?: Array<{
      title: string;
      repo: string;
      state: string;
      url?: string;
      html_url?: string;
      created_at?: string;
      merged_at?: string | null;
    }>;
  };
  codeReview?: {
    reviewsGiven?: number;
    commentsGiven?: number;
  };
  contributionPatterns?: {
    consistency?: 'high' | 'moderate' | 'sporadic';
    currentStreak?: number;
    longestStreak?: number;
    activeMonths?: number;
  };
  collaborationStyle?: {
    soloProjects?: number;
    teamProjects?: number;
    openSourceContributions?: number;
    style?: string;
  };
  languages?: Array<{
    name: string;
    percentage: number;
    repoCount?: number;
    bytes?: number;
  }>;
  topRepos?: Array<{
    name: string;
    url?: string;
    html_url?: string;
    stars?: number;
    stargazers_count?: number;
    forks?: number;
    forks_count?: number;
    language?: string;
    topics?: string[];
    size?: number;
    description?: string;
  }>;
}

export interface UserProfileInput {
  login?: string;
  html_url?: string;
  public_repos?: number;
  followers?: number;
  totalStars?: number;
}

/**
 * Compute Buildprint from GitHub deep analysis data
 */
export function computeBuildprint(
  githubAnalysis: GitHubDeepAnalysisInput | null,
  userProfile: UserProfileInput | null
): Buildprint | null {
  if (!githubAnalysis && !userProfile) {
    return null;
  }

  const analysis = githubAnalysis || {};
  const profile = userProfile || {};

  // Calculate Impact (stars, merged PRs, forks)
  const impact = computeImpact(analysis, profile);

  // Calculate Collaboration (reviews, comments, team projects)
  const collaboration = computeCollaboration(analysis);

  // Calculate Consistency (streak, frequency, active months)
  const consistency = computeConsistency(analysis);

  // Calculate Complexity (languages, repo size, topics)
  const complexity = computeComplexity(analysis);

  // Calculate Ownership (owned repos, solo projects)
  const ownership = computeOwnership(analysis, profile);

  // Overall score is weighted average
  const overallScore = Math.round(
    impact.value * 0.25 +
    collaboration.value * 0.20 +
    consistency.value * 0.20 +
    complexity.value * 0.15 +
    ownership.value * 0.20
  );

  return {
    impact,
    collaboration,
    consistency,
    complexity,
    ownership,
    overallScore,
    generatedAt: new Date().toISOString(),
  };
}

function computeImpact(
  analysis: GitHubDeepAnalysisInput,
  profile: UserProfileInput
): BuildprintMetric {
  const totalStars = profile.totalStars || 0;
  const mergedPRs = analysis.pullRequests?.totalMerged || 0;
  const topRepos = analysis.topRepos || [];
  const totalForks = topRepos.reduce((sum, r) => sum + (r.forks || r.forks_count || 0), 0);

  // Normalize: stars (max 1000), PRs merged (max 100), forks (max 500)
  const starsScore = Math.min(totalStars / 1000, 1) * 40;
  const prsScore = Math.min(mergedPRs / 100, 1) * 40;
  const forksScore = Math.min(totalForks / 500, 1) * 20;

  const value = Math.round(starsScore + prsScore + forksScore);

  // Build receipts
  const receipts: BuildprintReceipt[] = [];

  if (totalStars > 0) {
    receipts.push({
      label: 'Total Stars',
      value: totalStars,
      type: 'stat',
    });
  }

  if (mergedPRs > 0) {
    receipts.push({
      label: 'PRs Merged',
      value: mergedPRs,
      type: 'stat',
    });
  }

  // Add top repos as receipts
  topRepos.slice(0, 3).forEach((repo) => {
    if ((repo.stars || repo.stargazers_count || 0) > 0) {
      receipts.push({
        label: repo.name,
        value: `★ ${repo.stars || repo.stargazers_count}`,
        url: repo.url || repo.html_url,
        type: 'repo',
      });
    }
  });

  return {
    value,
    label: 'Impact',
    icon: 'Zap',
    receipts,
  };
}

function computeCollaboration(analysis: GitHubDeepAnalysisInput): BuildprintMetric {
  const reviewsGiven = analysis.codeReview?.reviewsGiven || 0;
  const commentsGiven = analysis.codeReview?.commentsGiven || 0;
  const teamProjects = analysis.collaborationStyle?.teamProjects || 0;
  const openSourceContribs = analysis.collaborationStyle?.openSourceContributions || 0;

  // Normalize: reviews (max 100), comments (max 200), team projects (max 20)
  const reviewsScore = Math.min(reviewsGiven / 100, 1) * 35;
  const commentsScore = Math.min(commentsGiven / 200, 1) * 25;
  const teamScore = Math.min(teamProjects / 20, 1) * 20;
  const ossScore = Math.min(openSourceContribs / 50, 1) * 20;

  const value = Math.round(reviewsScore + commentsScore + teamScore + ossScore);

  const receipts: BuildprintReceipt[] = [];

  if (reviewsGiven > 0) {
    receipts.push({
      label: 'Code Reviews',
      value: reviewsGiven,
      type: 'stat',
    });
  }

  if (commentsGiven > 0) {
    receipts.push({
      label: 'Comments',
      value: commentsGiven,
      type: 'stat',
    });
  }

  if (teamProjects > 0) {
    receipts.push({
      label: 'Team Projects',
      value: teamProjects,
      type: 'stat',
    });
  }

  if (openSourceContribs > 0) {
    receipts.push({
      label: 'OSS Contributions',
      value: openSourceContribs,
      type: 'stat',
    });
  }

  return {
    value,
    label: 'Collaboration',
    icon: 'Users',
    receipts,
  };
}

function computeConsistency(analysis: GitHubDeepAnalysisInput): BuildprintMetric {
  const currentStreak = analysis.contributionPatterns?.currentStreak || 0;
  const longestStreak = analysis.contributionPatterns?.longestStreak || 0;
  const activeMonths = analysis.contributionPatterns?.activeMonths || 0;
  const commitsPerWeek = analysis.commitActivity?.averagePerWeek || 0;
  const consistencyLevel = analysis.contributionPatterns?.consistency;

  // Normalize: streak (max 90 days), active months (max 12), commits/week (max 20)
  const streakScore = Math.min(currentStreak / 90, 1) * 30;
  const monthsScore = Math.min(activeMonths / 12, 1) * 30;
  const frequencyScore = Math.min(commitsPerWeek / 20, 1) * 25;

  // Bonus for high consistency
  const consistencyBonus = consistencyLevel === 'high' ? 15 :
                           consistencyLevel === 'moderate' ? 8 : 0;

  const value = Math.round(streakScore + monthsScore + frequencyScore + consistencyBonus);

  const receipts: BuildprintReceipt[] = [];

  if (currentStreak > 0) {
    receipts.push({
      label: 'Current Streak',
      value: `${currentStreak} days`,
      type: 'stat',
    });
  }

  if (longestStreak > 0) {
    receipts.push({
      label: 'Longest Streak',
      value: `${longestStreak} days`,
      type: 'stat',
    });
  }

  if (activeMonths > 0) {
    receipts.push({
      label: 'Active Months',
      value: `${activeMonths}/12`,
      type: 'stat',
    });
  }

  if (commitsPerWeek > 0) {
    receipts.push({
      label: 'Commits/Week',
      value: commitsPerWeek.toFixed(1),
      type: 'stat',
    });
  }

  return {
    value,
    label: 'Consistency',
    icon: 'TrendingUp',
    receipts,
  };
}

function computeComplexity(analysis: GitHubDeepAnalysisInput): BuildprintMetric {
  const languages = analysis.languages || [];
  const topRepos = analysis.topRepos || [];

  const languageCount = languages.length;
  const avgRepoSize = topRepos.length > 0
    ? topRepos.reduce((sum, r) => sum + (r.size || 0), 0) / topRepos.length
    : 0;
  const topicsCount = new Set(topRepos.flatMap(r => r.topics || [])).size;

  // Normalize: languages (max 10), repo size (max 50MB), topics (max 30)
  const langScore = Math.min(languageCount / 10, 1) * 35;
  const sizeScore = Math.min(avgRepoSize / 50000, 1) * 30; // 50MB in KB
  const topicsScore = Math.min(topicsCount / 30, 1) * 35;

  const value = Math.round(langScore + sizeScore + topicsScore);

  const receipts: BuildprintReceipt[] = [];

  if (languageCount > 0) {
    receipts.push({
      label: 'Languages',
      value: languageCount,
      type: 'stat',
    });

    // Add top 3 languages as receipts
    languages.slice(0, 3).forEach((lang) => {
      receipts.push({
        label: lang.name,
        value: `${lang.percentage}%`,
        type: 'stat',
      });
    });
  }

  if (topicsCount > 0) {
    receipts.push({
      label: 'Topics/Domains',
      value: topicsCount,
      type: 'stat',
    });
  }

  return {
    value,
    label: 'Complexity',
    icon: 'GitBranch',
    receipts,
  };
}

function computeOwnership(
  analysis: GitHubDeepAnalysisInput,
  profile: UserProfileInput
): BuildprintMetric {
  const soloProjects = analysis.collaborationStyle?.soloProjects || 0;
  const teamProjects = analysis.collaborationStyle?.teamProjects || 0;
  const totalRepos = profile.public_repos || (soloProjects + teamProjects) || 1;
  const topRepos = analysis.topRepos || [];

  // Count repos where user is likely the primary owner (non-forks with significant commits)
  const ownedRepos = topRepos.filter(r =>
    (r.stars || r.stargazers_count || 0) > 0 ||
    (r.size || 0) > 1000
  ).length;

  // Normalize: ownership ratio, solo projects (max 30)
  const ownershipRatio = Math.min(ownedRepos / Math.max(totalRepos, 1), 1) * 50;
  const soloScore = Math.min(soloProjects / 30, 1) * 50;

  const value = Math.round(ownershipRatio + soloScore);

  const receipts: BuildprintReceipt[] = [];

  if (ownedRepos > 0) {
    receipts.push({
      label: 'Owned Repos',
      value: ownedRepos,
      type: 'stat',
    });
  }

  if (soloProjects > 0) {
    receipts.push({
      label: 'Solo Projects',
      value: soloProjects,
      type: 'stat',
    });
  }

  // Add top owned repos as receipts
  topRepos.slice(0, 2).forEach((repo) => {
    receipts.push({
      label: repo.name,
      value: repo.description?.slice(0, 30) || 'Repository',
      url: repo.url || repo.html_url,
      type: 'repo',
    });
  });

  return {
    value,
    label: 'Ownership',
    icon: 'Crown',
    receipts,
  };
}

/**
 * Get color class for a metric value
 */
export function getBuildprintColor(value: number): string {
  if (value >= 70) return 'text-green-500';
  if (value >= 40) return 'text-yellow-500';
  return 'text-muted-foreground';
}

/**
 * Get background color class for a metric value
 */
export function getBuildprintBgColor(value: number): string {
  if (value >= 70) return 'bg-green-500';
  if (value >= 40) return 'bg-yellow-500';
  return 'bg-muted';
}

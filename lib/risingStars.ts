/**
 * Rising Stars Detection
 * 
 * Identifies developers showing rapid growth signals BEFORE they become famous.
 * Uses REAL GitHub data - no mocks.
 * 
 * Signals we detect:
 * 1. Rapid follower growth (comparing account age to followers)
 * 2. High star-to-repo ratio (quality over quantity)
 * 3. Recent first major contribution to a popular project
 * 4. Trending repos (repos created recently with good traction)
 */

import { Octokit } from "@octokit/rest";

export interface RisingStarSignal {
  type: "follower_velocity" | "star_ratio" | "quality_repos" | "trending_repo" | "first_major_pr";
  label: string;
  value: string;
  score: number; // 0-100 contribution to "rising" score
  evidence?: string;
}

export interface RisingStarAnalysis {
  isRisingStar: boolean;
  score: number; // 0-100
  signals: RisingStarSignal[];
  summary: string;
}

/**
 * Calculate follower velocity (followers per month of account age)
 */
function calculateFollowerVelocity(followers: number, createdAt: string): number {
  const accountAge = Date.now() - new Date(createdAt).getTime();
  const monthsOld = accountAge / (30 * 24 * 60 * 60 * 1000);
  if (monthsOld < 1) return followers; // New account
  return followers / monthsOld;
}

/**
 * Calculate star-to-repo ratio (total stars / number of repos)
 */
function calculateStarRatio(totalStars: number, repoCount: number): number {
  if (repoCount === 0) return 0;
  return totalStars / repoCount;
}

/**
 * Analyze a developer for "rising star" signals
 * Uses REAL GitHub data
 */
export async function analyzeRisingStar(
  username: string,
  userData: {
    followers: number;
    following: number;
    publicRepos: number;
    createdAt: string;
  },
  repos: Array<{
    name: string;
    stars: number;
    forks: number;
    createdAt: string;
    description?: string;
  }>,
  accessToken?: string
): Promise<RisingStarAnalysis> {
  const signals: RisingStarSignal[] = [];
  let totalScore = 0;

  // 1. Follower velocity
  const followerVelocity = calculateFollowerVelocity(userData.followers, userData.createdAt);
  if (followerVelocity > 50) {
    const velocityScore = Math.min(30, Math.floor(followerVelocity / 10) * 5);
    signals.push({
      type: "follower_velocity",
      label: "Rapid follower growth",
      value: `${Math.round(followerVelocity)} followers/month`,
      score: velocityScore,
      evidence: `Account is ${getAccountAge(userData.createdAt)} old with ${userData.followers.toLocaleString()} followers`,
    });
    totalScore += velocityScore;
  }

  // 2. Star ratio (total stars / repos)
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  const starRatio = calculateStarRatio(totalStars, userData.publicRepos);
  if (starRatio > 100) {
    const ratioScore = Math.min(25, Math.floor(starRatio / 50) * 5);
    signals.push({
      type: "star_ratio",
      label: "High-quality repos",
      value: `${Math.round(starRatio)} avg stars/repo`,
      score: ratioScore,
      evidence: `${totalStars.toLocaleString()} total stars across ${userData.publicRepos} repos`,
    });
    totalScore += ratioScore;
  }

  // 3. Recently created repos with traction
  const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
  const trendingRepos = repos.filter(r => {
    const createdAt = new Date(r.createdAt).getTime();
    return createdAt > sixMonthsAgo && r.stars > 50;
  });

  if (trendingRepos.length > 0) {
    const topTrending = trendingRepos.sort((a, b) => b.stars - a.stars)[0];
    const trendingScore = Math.min(25, trendingRepos.length * 10);
    signals.push({
      type: "trending_repo",
      label: "Trending new project",
      value: topTrending.name,
      score: trendingScore,
      evidence: `${topTrending.stars.toLocaleString()} stars in ${getRepoAge(topTrending.createdAt)}`,
    });
    totalScore += trendingScore;
  }

  // 4. High-star repos (viral potential)
  const highStarRepos = repos.filter(r => r.stars > 1000);
  if (highStarRepos.length > 0 && userData.followers < 10000) {
    // Has viral repo but not yet famous = rising
    const viralScore = Math.min(20, highStarRepos.length * 10);
    signals.push({
      type: "quality_repos",
      label: "Viral project creator",
      value: `${highStarRepos.length} repo(s) with 1K+ stars`,
      score: viralScore,
      evidence: highStarRepos.map(r => `${r.name} (${r.stars.toLocaleString()}⭐)`).join(", "),
    });
    totalScore += viralScore;
  }

  // Calculate final score (cap at 100)
  const finalScore = Math.min(100, totalScore);
  const isRisingStar = finalScore >= 40;

  // Generate summary
  let summary = "";
  if (finalScore >= 70) {
    summary = "🚀 Hot rising talent — growing fast with proven impact";
  } else if (finalScore >= 50) {
    summary = "📈 Rising developer — showing strong growth signals";
  } else if (finalScore >= 30) {
    summary = "💫 Emerging talent — early signs of momentum";
  } else {
    summary = "Established developer — consistent but not rapid growth";
  }

  return {
    isRisingStar,
    score: finalScore,
    signals,
    summary,
  };
}

function getAccountAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const years = Math.floor(ms / (365 * 24 * 60 * 60 * 1000));
  const months = Math.floor((ms % (365 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000));
  
  if (years > 0) {
    return `${years}y ${months}mo`;
  }
  return `${months}mo`;
}

function getRepoAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}

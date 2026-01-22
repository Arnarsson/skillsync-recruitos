/**
 * GitHub Connection Path Service
 *
 * Analyzes the connection path between a recruiter and a candidate
 * through GitHub's social graph (follows, starred repos, orgs, etc.)
 */

import { Octokit } from "@octokit/rest";

// Types for the connection analysis

export interface MutualConnection {
  username: string;
  avatarUrl: string;
  name: string | null;
  bio: string | null;
}

// Bridge connection = someone who can introduce you to the candidate
export interface BridgeConnection {
  username: string;
  avatarUrl: string;
  name: string | null;
  bio: string | null;
  connectionType: 'you_follow_they_follow_candidate' | 'candidate_follows_they_follow_you';
  // "you_follow_they_follow_candidate" = You follow this person, and they follow the candidate
  // "candidate_follows_they_follow_you" = The candidate follows this person, and they follow you
}

export interface SharedRepo {
  name: string;
  fullName: string;
  stars: number;
  description: string | null;
  url: string;
}

export interface SharedOrg {
  login: string;
  avatarUrl: string;
  name: string | null;
  description: string | null;
}

export interface ContributorOverlap {
  username: string;
  avatarUrl: string;
  name: string | null;
  sharedRepos: string[]; // List of repo names they both contributed to
}

export interface DirectConnection {
  recruiterFollowsCandidate: boolean;
  candidateFollowsRecruiter: boolean;
}

export interface GitHubConnectionPath {
  connectionDegree: 1 | 2 | 3 | null; // 1st = direct, 2nd = through bridge, 3rd = distant/shared interest
  directConnection: DirectConnection;
  bridgeConnections: BridgeConnection[]; // People who can introduce you (2nd degree)
  mutualConnections: MutualConnection[]; // People you both follow (shared interests)
  sharedRepos: SharedRepo[];
  sharedOrgs: SharedOrg[];
  contributorOverlap: ContributorOverlap[];
  shortestPath: string; // "Direct" | "Via @username" | "Via repo/name" | "No connection found"
  totalBridgeConnections: number;
  totalMutualFollows: number;
  totalSharedRepos: number;
  totalSharedOrgs: number;
  analyzedAt: string;
}

// Helper to create Octokit instance
function createOctokit(accessToken?: string): Octokit {
  return new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN,
  });
}

// Fetch all following for a user (handles pagination)
async function getAllFollowing(
  octokit: Octokit,
  username: string,
  maxPages: number = 5
): Promise<Set<string>> {
  const following = new Set<string>();

  try {
    for (let page = 1; page <= maxPages; page++) {
      const { data } = await octokit.users.listFollowingForUser({
        username,
        per_page: 100,
        page,
      });

      if (data.length === 0) break;

      data.forEach(user => following.add(user.login));

      if (data.length < 100) break;
    }
  } catch (error) {
    console.error(`Error fetching following for ${username}:`, error);
  }

  return following;
}

// Fetch all followers for a user (handles pagination)
async function getAllFollowers(
  octokit: Octokit,
  username: string,
  maxPages: number = 5
): Promise<Set<string>> {
  const followers = new Set<string>();

  try {
    for (let page = 1; page <= maxPages; page++) {
      const { data } = await octokit.users.listFollowersForUser({
        username,
        per_page: 100,
        page,
      });

      if (data.length === 0) break;

      data.forEach(user => followers.add(user.login));

      if (data.length < 100) break;
    }
  } catch (error) {
    console.error(`Error fetching followers for ${username}:`, error);
  }

  return followers;
}

// Fetch starred repos for a user
async function getStarredRepos(
  octokit: Octokit,
  username: string,
  maxPages: number = 3
): Promise<Map<string, { name: string; fullName: string; stars: number; description: string | null; url: string }>> {
  const starred = new Map<string, { name: string; fullName: string; stars: number; description: string | null; url: string }>();

  try {
    for (let page = 1; page <= maxPages; page++) {
      const { data } = await octokit.activity.listReposStarredByUser({
        username,
        per_page: 100,
        page,
      });

      if (data.length === 0) break;

      data.forEach((repo) => {
        const repoData = repo as {
          full_name: string;
          name: string;
          stargazers_count?: number;
          description?: string | null;
          html_url: string;
        };
        starred.set(repoData.full_name, {
          name: repoData.name,
          fullName: repoData.full_name,
          stars: repoData.stargazers_count || 0,
          description: repoData.description || null,
          url: repoData.html_url,
        });
      });

      if (data.length < 100) break;
    }
  } catch (error) {
    console.error(`Error fetching starred repos for ${username}:`, error);
  }

  return starred;
}

// Fetch orgs for a user
async function getUserOrgs(
  octokit: Octokit,
  username: string
): Promise<Map<string, { login: string; avatarUrl: string; name: string | null; description: string | null }>> {
  const orgs = new Map<string, { login: string; avatarUrl: string; name: string | null; description: string | null }>();

  try {
    const { data } = await octokit.orgs.listForUser({
      username,
      per_page: 100,
    });

    data.forEach(org => {
      const orgData = org as {
        login: string;
        avatar_url: string;
        name?: string | null;
        description?: string | null;
      };
      orgs.set(orgData.login, {
        login: orgData.login,
        avatarUrl: orgData.avatar_url,
        name: orgData.name || null,
        description: orgData.description || null,
      });
    });
  } catch (error) {
    console.error(`Error fetching orgs for ${username}:`, error);
  }

  return orgs;
}

// Fetch user details for mutual connections
async function getUserDetails(
  octokit: Octokit,
  usernames: string[],
  limit: number = 10
): Promise<MutualConnection[]> {
  const connections: MutualConnection[] = [];

  // Limit to avoid rate limiting
  const toFetch = usernames.slice(0, limit);

  await Promise.all(
    toFetch.map(async (username) => {
      try {
        const { data } = await octokit.users.getByUsername({ username });
        connections.push({
          username: data.login,
          avatarUrl: data.avatar_url,
          name: data.name,
          bio: data.bio,
        });
      } catch (error) {
        // Skip users that can't be fetched
        console.error(`Error fetching user ${username}:`, error);
      }
    })
  );

  return connections;
}

// Get repos the user owns or has contributed to
async function getUserRepos(
  octokit: Octokit,
  username: string,
  maxPages: number = 2
): Promise<Set<string>> {
  const repos = new Set<string>();

  try {
    for (let page = 1; page <= maxPages; page++) {
      const { data } = await octokit.repos.listForUser({
        username,
        per_page: 100,
        page,
        type: 'all',
      });

      if (data.length === 0) break;

      data.forEach(repo => repos.add(repo.full_name));

      if (data.length < 100) break;
    }
  } catch (error) {
    console.error(`Error fetching repos for ${username}:`, error);
  }

  return repos;
}

// Check if recruiter follows candidate directly
async function checkDirectFollow(
  octokit: Octokit,
  recruiterUsername: string,
  candidateUsername: string
): Promise<boolean> {
  try {
    await octokit.users.checkFollowingForUser({
      username: recruiterUsername,
      target_user: candidateUsername,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Main function to analyze the connection path between two GitHub users
 */
export async function analyzeConnectionPath(
  recruiterUsername: string,
  candidateUsername: string,
  accessToken?: string
): Promise<GitHubConnectionPath> {
  const octokit = createOctokit(accessToken);

  // Fetch data in parallel for efficiency
  const [
    recruiterFollowing,
    recruiterFollowers,
    candidateFollowing,
    candidateFollowers,
    recruiterStarred,
    candidateStarred,
    recruiterOrgs,
    candidateOrgs,
    recruiterRepos,
    candidateRepos,
  ] = await Promise.all([
    getAllFollowing(octokit, recruiterUsername),
    getAllFollowers(octokit, recruiterUsername),
    getAllFollowing(octokit, candidateUsername),
    getAllFollowers(octokit, candidateUsername),
    getStarredRepos(octokit, recruiterUsername),
    getStarredRepos(octokit, candidateUsername),
    getUserOrgs(octokit, recruiterUsername),
    getUserOrgs(octokit, candidateUsername),
    getUserRepos(octokit, recruiterUsername),
    getUserRepos(octokit, candidateUsername),
  ]);

  // Check direct connection
  const recruiterFollowsCandidate = recruiterFollowing.has(candidateUsername);
  const candidateFollowsRecruiter = candidateFollowers.has(recruiterUsername);

  const directConnection: DirectConnection = {
    recruiterFollowsCandidate,
    candidateFollowsRecruiter,
  };

  // ===== BRIDGE CONNECTIONS (2nd degree - people who can introduce you) =====
  // Type 1: You follow someone who follows the candidate
  // recruiterFollowing ∩ candidateFollowers = people you follow who also follow the candidate
  const bridgeType1Usernames: string[] = [];
  recruiterFollowing.forEach(user => {
    if (candidateFollowers.has(user)) {
      bridgeType1Usernames.push(user);
    }
  });

  // Type 2: Someone follows you who the candidate also follows
  // recruiterFollowers ∩ candidateFollowing = people who follow you and whom the candidate follows
  const bridgeType2Usernames: string[] = [];
  recruiterFollowers.forEach(user => {
    if (candidateFollowing.has(user)) {
      bridgeType2Usernames.push(user);
    }
  });

  // Get details for bridge connections (prioritize type 1 - more actionable)
  const bridgeType1Details = await getUserDetails(octokit, bridgeType1Usernames, 5);
  const bridgeType2Details = await getUserDetails(octokit, bridgeType2Usernames, 5);

  const bridgeConnections: BridgeConnection[] = [
    ...bridgeType1Details.map(user => ({
      ...user,
      connectionType: 'you_follow_they_follow_candidate' as const,
    })),
    ...bridgeType2Details.map(user => ({
      ...user,
      connectionType: 'candidate_follows_they_follow_you' as const,
    })),
  ];

  // ===== MUTUAL CONNECTIONS (shared interests - people you both follow) =====
  const mutualFollowUsernames: string[] = [];
  recruiterFollowing.forEach(user => {
    if (candidateFollowing.has(user)) {
      mutualFollowUsernames.push(user);
    }
  });

  // Also check people who follow both
  const mutualFollowerUsernames: string[] = [];
  recruiterFollowers.forEach(user => {
    if (candidateFollowers.has(user)) {
      mutualFollowerUsernames.push(user);
    }
  });

  // Combine and dedupe mutual connections
  const allMutualUsernames = [...new Set([...mutualFollowUsernames, ...mutualFollowerUsernames])];

  // Get details for top mutual connections
  const mutualConnections = await getUserDetails(octokit, allMutualUsernames, 10);

  // Find shared starred repos
  const sharedRepos: SharedRepo[] = [];
  recruiterStarred.forEach((repoData, repoFullName) => {
    if (candidateStarred.has(repoFullName)) {
      sharedRepos.push(repoData);
    }
  });

  // Sort by stars and take top results
  sharedRepos.sort((a, b) => b.stars - a.stars);
  const topSharedRepos = sharedRepos.slice(0, 10);

  // Find shared orgs
  const sharedOrgs: SharedOrg[] = [];
  recruiterOrgs.forEach((orgData, orgLogin) => {
    if (candidateOrgs.has(orgLogin)) {
      sharedOrgs.push(orgData);
    }
  });

  // Find shared repos (both own/contributed to)
  const commonRepos: string[] = [];
  recruiterRepos.forEach(repo => {
    if (candidateRepos.has(repo)) {
      commonRepos.push(repo);
    }
  });

  // Determine connection degree and shortest path
  let connectionDegree: 1 | 2 | 3 | null = null;
  let shortestPath = "No connection found";

  if (recruiterFollowsCandidate || candidateFollowsRecruiter) {
    // 1st degree: Direct connection
    connectionDegree = 1;
    if (recruiterFollowsCandidate && candidateFollowsRecruiter) {
      shortestPath = "Direct (mutual follow)";
    } else if (recruiterFollowsCandidate) {
      shortestPath = "Direct (you follow them)";
    } else {
      shortestPath = "Direct (they follow you)";
    }
  } else if (bridgeConnections.length > 0) {
    // 2nd degree: Connected through a bridge person who can introduce you
    connectionDegree = 2;
    const bridge = bridgeConnections[0];
    if (bridge.connectionType === 'you_follow_they_follow_candidate') {
      shortestPath = `Ask @${bridge.username} (you follow them, they follow candidate)`;
    } else {
      shortestPath = `Via @${bridge.username} (candidate follows them, they follow you)`;
    }
  } else if (sharedOrgs.length > 0) {
    // 2nd degree: Same organization
    connectionDegree = 2;
    shortestPath = `Via ${sharedOrgs[0].name || sharedOrgs[0].login} (shared org)`;
  } else if (topSharedRepos.length > 0) {
    // 3rd degree: Share interest in same repos (no direct path)
    connectionDegree = 3;
    shortestPath = `Via ${topSharedRepos[0].fullName} (shared interest only)`;
  } else if (commonRepos.length > 0) {
    // 3rd degree: Both contribute to same repos
    connectionDegree = 3;
    shortestPath = `Via ${commonRepos[0]} (both contribute)`;
  }

  return {
    connectionDegree,
    directConnection,
    bridgeConnections,
    mutualConnections,
    sharedRepos: topSharedRepos,
    sharedOrgs,
    contributorOverlap: [], // Would require additional API calls to analyze contributors
    shortestPath,
    totalBridgeConnections: bridgeConnections.length,
    totalMutualFollows: allMutualUsernames.length,
    totalSharedRepos: sharedRepos.length,
    totalSharedOrgs: sharedOrgs.length,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Light version that only checks direct connections
 * Useful for quick checks without heavy API usage
 */
export async function checkDirectConnection(
  recruiterUsername: string,
  candidateUsername: string,
  accessToken?: string
): Promise<DirectConnection> {
  const octokit = createOctokit(accessToken);

  const [recruiterFollowsCandidate, candidateFollowsRecruiter] = await Promise.all([
    checkDirectFollow(octokit, recruiterUsername, candidateUsername),
    checkDirectFollow(octokit, candidateUsername, recruiterUsername),
  ]);

  return {
    recruiterFollowsCandidate,
    candidateFollowsRecruiter,
  };
}

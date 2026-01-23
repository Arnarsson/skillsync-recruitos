/**
 * Social Matrix Service (Facade)
 *
 * Unified service that combines LinkedIn, GitHub, and network analysis
 * to build a "6 Degrees of Kevin Bacon" style connection graph.
 *
 * This is a FACADE that imports and orchestrates existing services:
 * - linkedInConnectionService.ts
 * - githubConnectionService.ts
 * - networkAnalysisService.ts
 */

// DISABLED: LinkedIn connection path (keeping GitHub connection path only)
// import {
//   getLinkedInConnectionPath,
//   getCachedRecruiterProfile,
//   getRecruiterLinkedInUrl,
//   type LinkedInConnectionPath,
// } from './linkedInConnectionService';

import {
  analyzeConnectionPath as analyzeGitHubConnectionPath,
  checkDirectConnection as checkGitHubDirectConnection,
  type GitHubConnectionPath,
} from './githubConnectionService';

import { buildNetworkGraph } from './networkAnalysisService';
import type { NetworkGraph } from '@/types';

import type {
  SocialMatrix,
  MatrixNode,
  MatrixEdge,
  ConnectionPath,
  ConnectionDegreeResult,
  MatrixNodeSource,
  MatrixEdgeType,
  VerificationStatus,
} from '@/types/socialMatrix';

// ===== CACHE CONSTANTS =====

const CACHE_KEY_PREFIX = 'recruitos_social_matrix_';
const CACHE_TTL_HOURS = 24;

// ===== HELPER FUNCTIONS =====

function getCacheKey(recruiterId: string, candidateId: string): string {
  return `${CACHE_KEY_PREFIX}${recruiterId}_${candidateId}`;
}

function loadCachedMatrix(recruiterId: string, candidateId: string): SocialMatrix | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(getCacheKey(recruiterId, candidateId));
    if (!cached) return null;

    const data: SocialMatrix = JSON.parse(cached);

    // Check if cache is stale
    const lastUpdated = new Date(data.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate > CACHE_TTL_HOURS) {
      data.dataFreshness = 'stale';
    }

    return data;
  } catch {
    return null;
  }
}

function saveCachedMatrix(matrix: SocialMatrix): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      getCacheKey(matrix.recruiterId, matrix.candidateId),
      JSON.stringify(matrix)
    );
  } catch (error) {
    console.error('[SocialMatrix] Failed to cache matrix:', error);
  }
}

// DISABLED: LinkedIn connection path (keeping GitHub connection path only)
// /**
//  * Convert LinkedIn connection data to MatrixNodes and MatrixEdges
//  */
// function linkedInToMatrix(
//   linkedInPath: LinkedInConnectionPath,
//   recruiterId: string,
//   candidateId: string
// ): { nodes: MatrixNode[]; edges: MatrixEdge[] } {
//   const nodes: MatrixNode[] = [];
//   const edges: MatrixEdge[] = [];
//
//   // Add recruiter node
//   nodes.push({
//     id: recruiterId,
//     type: 'person',
//     name: linkedInPath.recruiterProfile.name,
//     source: 'linkedin',
//     profileUrl: linkedInPath.recruiterProfile.profileUrl,
//     imageUrl: linkedInPath.recruiterProfile.profileImage,
//     metadata: {
//       headline: linkedInPath.recruiterProfile.headline,
//       connections: linkedInPath.recruiterProfile.connections,
//     },
//   });
//
//   // Add candidate node
//   nodes.push({
//     id: candidateId,
//     type: 'person',
//     name: linkedInPath.candidateProfile.name,
//     source: 'linkedin',
//     profileUrl: linkedInPath.candidateProfile.profileUrl,
//     imageUrl: linkedInPath.candidateProfile.profileImage,
//     metadata: {
//       headline: linkedInPath.candidateProfile.headline,
//       connections: linkedInPath.candidateProfile.connections,
//     },
//   });
//
//   // Add mutual connections as nodes and edges
//   linkedInPath.mutualConnections.forEach((mutual, index) => {
//     const mutualId = `mutual-linkedin-${index}`;
//
//     nodes.push({
//       id: mutualId,
//       type: 'person',
//       name: mutual.name,
//       source: 'linkedin',
//       profileUrl: mutual.profileUrl,
//       imageUrl: mutual.profileImage,
//       metadata: {
//         headline: mutual.headline,
//       },
//     });
//
//     // Edge from recruiter to mutual
//     edges.push({
//       source: recruiterId,
//       target: mutualId,
//       type: 'mutual_connection',
//       weight: 0.8,
//       confidence: 0.9,
//       status: 'verified',
//       sources: [mutual.profileUrl],
//     });
//
//     // Edge from mutual to candidate
//     edges.push({
//       source: mutualId,
//       target: candidateId,
//       type: 'mutual_connection',
//       weight: 0.8,
//       confidence: 0.9,
//       status: 'verified',
//       sources: [mutual.profileUrl],
//     });
//   });
//
//   // Direct connection edge if 1st degree
//   if (linkedInPath.connectionDegree === 1) {
//     edges.push({
//       source: recruiterId,
//       target: candidateId,
//       type: 'follows',
//       weight: 1.0,
//       confidence: 1.0,
//       status: 'verified',
//       sources: [linkedInPath.recruiterProfile.profileUrl],
//     });
//   }
//
//   return { nodes, edges };
// }

/**
 * Convert GitHub connection data to MatrixNodes and MatrixEdges
 */
function gitHubToMatrix(
  gitHubPath: GitHubConnectionPath,
  recruiterId: string,
  candidateId: string
): { nodes: MatrixNode[]; edges: MatrixEdge[] } {
  const nodes: MatrixNode[] = [];
  const edges: MatrixEdge[] = [];

  // Add mutual connections
  gitHubPath.mutualConnections.forEach((mutual, index) => {
    const mutualId = `mutual-github-${index}`;

    nodes.push({
      id: mutualId,
      type: 'person',
      name: mutual.name || mutual.username,
      source: 'github',
      profileUrl: `https://github.com/${mutual.username}`,
      imageUrl: mutual.avatarUrl,
      metadata: {
        username: mutual.username,
        bio: mutual.bio,
      },
    });

    edges.push({
      source: recruiterId,
      target: mutualId,
      type: 'follows',
      weight: 0.6,
      confidence: 1.0,
      status: 'verified',
      sources: [`https://github.com/${mutual.username}`],
    });

    edges.push({
      source: mutualId,
      target: candidateId,
      type: 'follows',
      weight: 0.6,
      confidence: 1.0,
      status: 'verified',
      sources: [`https://github.com/${mutual.username}`],
    });
  });

  // Add shared repos as nodes
  gitHubPath.sharedRepos.forEach((repo, index) => {
    const repoId = `repo-${index}-${repo.fullName.replace('/', '-')}`;

    nodes.push({
      id: repoId,
      type: 'repo',
      name: repo.name,
      source: 'github',
      profileUrl: repo.url,
      metadata: {
        fullName: repo.fullName,
        stars: repo.stars,
        description: repo.description,
      },
    });

    // Both starred this repo
    edges.push({
      source: recruiterId,
      target: repoId,
      type: 'contributed_to',
      weight: 0.4,
      confidence: 1.0,
      status: 'verified',
      sources: [repo.url],
    });

    edges.push({
      source: candidateId,
      target: repoId,
      type: 'contributed_to',
      weight: 0.4,
      confidence: 1.0,
      status: 'verified',
      sources: [repo.url],
    });
  });

  // Add shared orgs
  gitHubPath.sharedOrgs.forEach((org, index) => {
    const orgId = `org-${index}-${org.login}`;

    nodes.push({
      id: orgId,
      type: 'org',
      name: org.name || org.login,
      source: 'github',
      profileUrl: `https://github.com/${org.login}`,
      imageUrl: org.avatarUrl,
      metadata: {
        login: org.login,
        description: org.description,
      },
    });

    edges.push({
      source: recruiterId,
      target: orgId,
      type: 'member_of',
      weight: 0.7,
      confidence: 1.0,
      status: 'verified',
      sources: [`https://github.com/${org.login}`],
    });

    edges.push({
      source: candidateId,
      target: orgId,
      type: 'member_of',
      weight: 0.7,
      confidence: 1.0,
      status: 'verified',
      sources: [`https://github.com/${org.login}`],
    });
  });

  // Direct connection edges
  if (gitHubPath.directConnection.recruiterFollowsCandidate) {
    edges.push({
      source: recruiterId,
      target: candidateId,
      type: 'follows',
      weight: 1.0,
      confidence: 1.0,
      status: 'verified',
      sources: [],
    });
  }

  if (gitHubPath.directConnection.candidateFollowsRecruiter) {
    edges.push({
      source: candidateId,
      target: recruiterId,
      type: 'follows',
      weight: 1.0,
      confidence: 1.0,
      status: 'verified',
      sources: [],
    });
  }

  return { nodes, edges };
}

/**
 * Merge nodes and edges from multiple sources, deduplicating
 */
function mergeGraphData(
  sources: Array<{ nodes: MatrixNode[]; edges: MatrixEdge[] }>
): { nodes: MatrixNode[]; edges: MatrixEdge[] } {
  const nodeMap = new Map<string, MatrixNode>();
  const edgeMap = new Map<string, MatrixEdge>();

  for (const source of sources) {
    for (const node of source.nodes) {
      // Prefer existing node if it has more metadata
      const existing = nodeMap.get(node.id);
      if (!existing || Object.keys(node.metadata).length > Object.keys(existing.metadata).length) {
        nodeMap.set(node.id, node);
      }
    }

    for (const edge of source.edges) {
      const edgeKey = `${edge.source}-${edge.target}-${edge.type}`;
      const existing = edgeMap.get(edgeKey);

      if (!existing || edge.weight > existing.weight) {
        edgeMap.set(edgeKey, edge);
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}

/**
 * BFS path finding on the graph
 */
function findPaths(
  nodes: MatrixNode[],
  edges: MatrixEdge[],
  sourceId: string,
  targetId: string,
  maxHops: number = 3
): ConnectionPath[] {
  const paths: ConnectionPath[] = [];
  const adjacencyList = new Map<string, MatrixEdge[]>();

  // Build adjacency list
  for (const edge of edges) {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge);

    // Treat as undirected for path finding
    if (!adjacencyList.has(edge.target)) {
      adjacencyList.set(edge.target, []);
    }
    adjacencyList.get(edge.target)!.push({
      ...edge,
      source: edge.target,
      target: edge.source,
    });
  }

  // BFS
  const queue: Array<{ nodeId: string; path: string[]; edgePath: MatrixEdge[] }> = [
    { nodeId: sourceId, path: [sourceId], edgePath: [] },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { nodeId, path, edgePath } = queue.shift()!;

    if (nodeId === targetId) {
      // Found a path
      const pathNodes = path.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
      const totalWeight = edgePath.reduce((sum, e) => sum + e.weight, 0) / Math.max(edgePath.length, 1);
      const minConfidence = edgePath.reduce((min, e) => Math.min(min, e.confidence), 1);

      paths.push({
        nodes: pathNodes,
        edges: edgePath,
        totalWeight,
        degree: path.length - 1,
        explanation: generatePathExplanation(pathNodes, edgePath),
        verificationStatus: minConfidence >= 0.8 ? 'verified' : minConfidence >= 0.5 ? 'plausible' : 'unverified',
        pathType: determinePathType(edgePath),
      });

      continue;
    }

    if (path.length > maxHops + 1) continue;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const edge of neighbors) {
      if (!path.includes(edge.target)) {
        queue.push({
          nodeId: edge.target,
          path: [...path, edge.target],
          edgePath: [...edgePath, edge],
        });
      }
    }
  }

  // Sort by total weight (higher is better)
  paths.sort((a, b) => b.totalWeight - a.totalWeight);

  return paths;
}

function generatePathExplanation(nodes: MatrixNode[], edges: MatrixEdge[]): string {
  if (nodes.length === 2) {
    return `Direct connection to ${nodes[1].name}`;
  }

  if (nodes.length === 3) {
    const middle = nodes[1];
    if (middle.type === 'person') {
      return `Connected via ${middle.name}`;
    }
    if (middle.type === 'company') {
      return `Both worked at ${middle.name}`;
    }
    if (middle.type === 'school') {
      return `Both attended ${middle.name}`;
    }
    if (middle.type === 'org') {
      return `Both members of ${middle.name}`;
    }
    if (middle.type === 'repo') {
      return `Both contributed to ${middle.name}`;
    }
  }

  const intermediates = nodes.slice(1, -1).map(n => n.name).join(' → ');
  return `Path: ${intermediates}`;
}

function determinePathType(edges: MatrixEdge[]): ConnectionPath['pathType'] {
  if (edges.length === 1 && edges[0].type === 'follows') {
    return 'direct';
  }

  const types = new Set(edges.map(e => e.type));

  if (types.has('mutual_connection') || types.has('follows')) {
    return 'mutual';
  }
  if (types.has('worked_at')) {
    return 'company';
  }
  if (types.has('studied_at')) {
    return 'school';
  }
  if (types.has('spoke_at') || types.has('co_appeared_with')) {
    return 'event';
  }

  return 'research';
}

// ===== MAIN SERVICE FUNCTIONS =====

/**
 * Quick check for connection degree (uses cache first)
 */
export async function getConnectionDegree(
  recruiterId: string,
  candidateId: string,
  recruiterGitHubUsername?: string,
  candidateGitHubUsername?: string
): Promise<ConnectionDegreeResult> {
  // Check cache first
  const cached = loadCachedMatrix(recruiterId, candidateId);
  if (cached && cached.dataFreshness !== 'stale') {
    return {
      degree: cached.connectionDegree,
      source: 'cache',
      path: cached.bestPath?.explanation,
      lastChecked: cached.lastUpdated,
      isStale: false,
    };
  }

  // If both have GitHub, do a quick check
  if (recruiterGitHubUsername && candidateGitHubUsername) {
    try {
      const directConnection = await checkGitHubDirectConnection(
        recruiterGitHubUsername,
        candidateGitHubUsername
      );

      if (directConnection.recruiterFollowsCandidate || directConnection.candidateFollowsRecruiter) {
        return {
          degree: 1,
          source: 'github',
          path: directConnection.recruiterFollowsCandidate
            ? 'You follow them on GitHub'
            : 'They follow you on GitHub',
          lastChecked: new Date().toISOString(),
          isStale: false,
        };
      }
    } catch (error) {
      console.warn('[SocialMatrix] GitHub quick check failed:', error);
    }
  }

  // DISABLED: LinkedIn connection path (keeping GitHub connection path only)
  // const recruiterCache = getCachedRecruiterProfile();
  // if (recruiterCache) {
  //   // We have recruiter data, can provide quick estimate
  //   return {
  //     degree: 2, // Assume 2nd degree if we have some data
  //     source: 'linkedin',
  //     path: 'Potential connection via LinkedIn network',
  //     lastChecked: recruiterCache.lastSynced,
  //     isStale: true, // Mark as stale to trigger full analysis
  //   };
  // }

  return {
    degree: null,
    source: 'combined',
    lastChecked: new Date().toISOString(),
    isStale: true,
  };
}

/**
 * Build unified graph combining all data sources
 */
export async function buildUnifiedGraph(
  recruiterId: string,
  candidateId: string,
  options: {
    recruiterLinkedInUrl?: string;
    candidateLinkedInUrl?: string;
    recruiterGitHubUsername?: string;
    candidateGitHubUsername?: string;
    teamLinkedInUrls?: string[];
    forceRefresh?: boolean;
  }
): Promise<SocialMatrix> {
  // Check cache unless force refresh
  if (!options.forceRefresh) {
    const cached = loadCachedMatrix(recruiterId, candidateId);
    if (cached && cached.dataFreshness !== 'stale') {
      console.log('[SocialMatrix] Returning cached matrix');
      return cached;
    }
  }

  const graphSources: Array<{ nodes: MatrixNode[]; edges: MatrixEdge[] }> = [];

  // DISABLED: LinkedIn connection path (keeping GitHub connection path only)
  // if (options.recruiterLinkedInUrl && options.candidateLinkedInUrl) {
  //   try {
  //     console.log('[SocialMatrix] Fetching LinkedIn connection path...');
  //     const linkedInPath = await getLinkedInConnectionPath(
  //       options.recruiterLinkedInUrl,
  //       options.candidateLinkedInUrl
  //     );
  //     graphSources.push(linkedInToMatrix(linkedInPath, recruiterId, candidateId));
  //   } catch (error) {
  //     console.warn('[SocialMatrix] LinkedIn fetch failed:', error);
  //   }
  // }

  // Fetch GitHub data
  if (options.recruiterGitHubUsername && options.candidateGitHubUsername) {
    try {
      console.log('[SocialMatrix] Fetching GitHub connection path...');
      const gitHubPath = await analyzeGitHubConnectionPath(
        options.recruiterGitHubUsername,
        options.candidateGitHubUsername
      );
      graphSources.push(gitHubToMatrix(gitHubPath, recruiterId, candidateId));
    } catch (error) {
      console.warn('[SocialMatrix] GitHub fetch failed:', error);
    }
  }

  // Merge all graph data
  const { nodes, edges } = mergeGraphData(graphSources);

  // Find paths
  const paths = findPaths(nodes, edges, recruiterId, candidateId);

  // Determine best path and connection degree
  const bestPath = paths[0];
  let connectionDegree: 1 | 2 | 3 | null = null;

  if (bestPath) {
    connectionDegree = Math.min(bestPath.degree, 3) as 1 | 2 | 3;
  }

  const matrix: SocialMatrix = {
    recruiterId,
    candidateId,
    nodes,
    edges,
    paths,
    bestPath,
    connectionDegree,
    lastUpdated: new Date().toISOString(),
    dataFreshness: 'live',
  };

  // Cache the result
  saveCachedMatrix(matrix);

  return matrix;
}

/**
 * Rank paths by quality for warm intro
 */
export function rankPaths(paths: ConnectionPath[]): ConnectionPath[] {
  return [...paths].sort((a, b) => {
    // Prefer shorter paths
    if (a.degree !== b.degree) {
      return a.degree - b.degree;
    }

    // Prefer verified paths
    const statusOrder = { verified: 0, plausible: 1, unverified: 2, rejected: 3 };
    if (a.verificationStatus !== b.verificationStatus) {
      return statusOrder[a.verificationStatus] - statusOrder[b.verificationStatus];
    }

    // Prefer higher weight
    return b.totalWeight - a.totalWeight;
  });
}

/**
 * Get warm intro paths with suggested messages
 */
export function getWarmIntroPaths(matrix: SocialMatrix): Array<{
  path: ConnectionPath;
  connector?: MatrixNode;
  introQuality: 'hot' | 'warm' | 'cold';
  suggestedApproach: string;
}> {
  const warmPaths = matrix.paths
    .filter(p => p.degree <= 2 && p.verificationStatus !== 'rejected')
    .map(path => {
      const connector = path.nodes.length > 2 ? path.nodes[1] : undefined;

      let introQuality: 'hot' | 'warm' | 'cold';
      if (path.degree === 1) {
        introQuality = 'hot';
      } else if (path.verificationStatus === 'verified') {
        introQuality = 'warm';
      } else {
        introQuality = 'cold';
      }

      let suggestedApproach: string;
      if (path.degree === 1) {
        suggestedApproach = 'Reach out directly - you have a direct connection';
      } else if (connector) {
        suggestedApproach = `Ask ${connector.name} for an introduction`;
      } else {
        suggestedApproach = 'Mention shared interests or experiences';
      }

      return {
        path,
        connector,
        introQuality,
        suggestedApproach,
      };
    });

  // Sort by quality
  warmPaths.sort((a, b) => {
    const qualityOrder = { hot: 0, warm: 1, cold: 2 };
    return qualityOrder[a.introQuality] - qualityOrder[b.introQuality];
  });

  return warmPaths;
}

/**
 * Clear cached matrix for a recruiter-candidate pair
 */
export function clearCachedMatrix(recruiterId: string, candidateId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getCacheKey(recruiterId, candidateId));
}

/**
 * Get all cached matrices for a recruiter
 */
export function getCachedMatricesForRecruiter(recruiterId: string): SocialMatrix[] {
  if (typeof window === 'undefined') return [];

  const matrices: SocialMatrix[] = [];
  const prefix = `${CACHE_KEY_PREFIX}${recruiterId}_`;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '');
        matrices.push(data);
      } catch {
        // Skip invalid entries
      }
    }
  }

  return matrices;
}

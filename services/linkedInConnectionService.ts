/**
 * LinkedIn Connection Path Service
 *
 * Discovers connection paths between a recruiter and a candidate using BrightData.
 * Shows mutual connections, connection degree, and warm introduction paths.
 */

import { brightDataService, LinkedInProfile } from '@/lib/brightdata';

// ===== TYPES =====

export interface MutualConnection {
  name: string;
  headline: string;
  profileUrl: string;
  profileImage?: string;
}

export interface LinkedInConnectionPath {
  connectionDegree: 1 | 2 | 3 | null;
  mutualConnections: MutualConnection[];
  shortestPath: string;
  recruiterProfile: {
    name: string;
    headline: string;
    profileUrl: string;
    profileImage?: string;
    connections: number;
  };
  candidateProfile: {
    name: string;
    headline: string;
    profileUrl: string;
    profileImage?: string;
    connections: number;
  };
  lastUpdated: string;
}

export interface RecruiterLinkedInCache {
  profile: LinkedInProfile;
  connectionUrls: Set<string>; // For fast lookup
  lastSynced: string;
  expiresAt: string;
}

// ===== CONSTANTS =====

const CACHE_KEY_RECRUITER_PROFILE = 'recruitos_recruiter_linkedin_cache';
const CACHE_KEY_RECRUITER_URL = 'recruitos_recruiter_linkedin';
const CACHE_DURATION_DAYS = 7; // Refresh connections weekly

// ===== HELPER FUNCTIONS =====

/**
 * Normalize LinkedIn URL to consistent format for comparison
 */
function normalizeLinkedInUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Extract just the /in/username part
    const match = urlObj.pathname.match(/\/in\/([^/]+)/);
    if (match) {
      return `https://www.linkedin.com/in/${match[1].toLowerCase()}`;
    }
    return url.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}


/**
 * Load recruiter profile cache from localStorage
 */
function loadRecruiterCache(): RecruiterLinkedInCache | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY_RECRUITER_PROFILE);
    if (!cached) return null;

    const data = JSON.parse(cached);

    // Check if cache is expired
    if (new Date(data.expiresAt) < new Date()) {
      console.log('[ConnectionService] Recruiter cache expired');
      return null;
    }

    // Reconstruct the Set from array
    return {
      ...data,
      connectionUrls: new Set(data.connectionUrls || []),
    };
  } catch (error) {
    console.error('[ConnectionService] Failed to load cache:', error);
    return null;
  }
}

/**
 * Save recruiter profile cache to localStorage
 */
function saveRecruiterCache(cache: RecruiterLinkedInCache): void {
  if (typeof window === 'undefined') return;

  try {
    // Convert Set to array for JSON serialization
    const serializable = {
      ...cache,
      connectionUrls: Array.from(cache.connectionUrls),
    };

    localStorage.setItem(CACHE_KEY_RECRUITER_PROFILE, JSON.stringify(serializable));
  } catch (error) {
    console.error('[ConnectionService] Failed to save cache:', error);
  }
}

/**
 * Clear recruiter profile cache
 */
export function clearRecruiterCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY_RECRUITER_PROFILE);
}

// ===== MAIN SERVICE FUNCTIONS =====

/**
 * Get the stored recruiter LinkedIn URL
 */
export function getRecruiterLinkedInUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CACHE_KEY_RECRUITER_URL);
}

/**
 * Set the recruiter LinkedIn URL (triggers cache invalidation)
 */
export function setRecruiterLinkedInUrl(url: string): void {
  if (typeof window === 'undefined') return;

  const currentUrl = getRecruiterLinkedInUrl();
  const normalizedNew = normalizeLinkedInUrl(url);
  const normalizedCurrent = currentUrl ? normalizeLinkedInUrl(currentUrl) : null;

  // If URL changed, clear the cache
  if (normalizedNew !== normalizedCurrent) {
    clearRecruiterCache();
  }

  localStorage.setItem(CACHE_KEY_RECRUITER_URL, url);
}

/**
 * Get cached recruiter profile data (if available and not expired)
 */
export function getCachedRecruiterProfile(): RecruiterLinkedInCache | null {
  return loadRecruiterCache();
}

/**
 * Scrape and cache the recruiter's LinkedIn profile and connections
 * This is an expensive operation - call sparingly
 */
export async function syncRecruiterProfile(
  linkedInUrl: string
): Promise<RecruiterLinkedInCache | null> {
  if (!brightDataService.isConfigured()) {
    throw new Error('BrightData API key not configured');
  }

  console.log('[ConnectionService] Syncing recruiter profile:', linkedInUrl);

  try {
    // Scrape the recruiter's LinkedIn profile
    const profile = await brightDataService.scrapeLinkedInProfile(linkedInUrl);

    if (!profile) {
      throw new Error('Failed to scrape recruiter LinkedIn profile');
    }

    // Build a Set of connection URLs for fast lookup
    const connectionUrls = new Set<string>();

    // Add "people also viewed" as potential connections
    // Note: BrightData returns these as visible connections from the profile
    profile.connections.forEach((conn) => {
      if (conn.profileUrl) {
        connectionUrls.add(normalizeLinkedInUrl(conn.profileUrl));
      }
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const cache: RecruiterLinkedInCache = {
      profile,
      connectionUrls,
      lastSynced: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Save to localStorage
    setRecruiterLinkedInUrl(linkedInUrl);
    saveRecruiterCache(cache);

    console.log('[ConnectionService] Synced recruiter profile with', connectionUrls.size, 'visible connections');

    return cache;
  } catch (error) {
    console.error('[ConnectionService] Failed to sync recruiter profile:', error);
    throw error;
  }
}

/**
 * Find the connection path between recruiter and candidate
 */
export async function getLinkedInConnectionPath(
  recruiterLinkedInUrl: string,
  candidateLinkedInUrl: string
): Promise<LinkedInConnectionPath> {
  console.log('[ConnectionService] Finding connection path');
  console.log('[ConnectionService] Recruiter:', recruiterLinkedInUrl);
  console.log('[ConnectionService] Candidate:', candidateLinkedInUrl);

  // Check if BrightData is configured
  if (!brightDataService.isConfigured()) {
    throw new Error('BrightData API key not configured. Please add your API key in Settings.');
  }

  // Step 1: Get or sync recruiter profile
  let recruiterCache = loadRecruiterCache();

  if (!recruiterCache) {
    console.log('[ConnectionService] No recruiter cache, syncing...');
    recruiterCache = await syncRecruiterProfile(recruiterLinkedInUrl);

    if (!recruiterCache) {
      throw new Error('Failed to load recruiter profile');
    }
  }

  // Step 2: Scrape candidate profile
  console.log('[ConnectionService] Scraping candidate profile...');
  const candidateProfile = await brightDataService.scrapeLinkedInProfile(candidateLinkedInUrl);

  if (!candidateProfile) {
    throw new Error('Failed to scrape candidate LinkedIn profile');
  }

  // Step 3: Determine connection degree
  const normalizedCandidateUrl = normalizeLinkedInUrl(candidateLinkedInUrl);
  let connectionDegree: 1 | 2 | 3 | null = null;
  const mutualConnections: MutualConnection[] = [];

  // Check if candidate is a 1st degree connection
  if (recruiterCache.connectionUrls.has(normalizedCandidateUrl)) {
    connectionDegree = 1;
    console.log('[ConnectionService] Candidate is 1st degree connection');
  } else {
    // Check for mutual connections (2nd degree)
    // Compare recruiter's connections with candidate's "people also viewed"
    const candidateConnectionUrls = new Set(
      candidateProfile.connections.map((c) => normalizeLinkedInUrl(c.profileUrl))
    );

    // Find mutual connections
    for (const conn of recruiterCache.profile.connections) {
      const normalizedConnUrl = normalizeLinkedInUrl(conn.profileUrl);
      if (candidateConnectionUrls.has(normalizedConnUrl)) {
        mutualConnections.push({
          name: conn.name,
          headline: conn.headline,
          profileUrl: conn.profileUrl,
          profileImage: conn.profileImage,
        });
      }
    }

    // Also check the other direction
    for (const conn of candidateProfile.connections) {
      const normalizedConnUrl = normalizeLinkedInUrl(conn.profileUrl);
      if (recruiterCache.connectionUrls.has(normalizedConnUrl)) {
        // Avoid duplicates
        if (!mutualConnections.some((m) => normalizeLinkedInUrl(m.profileUrl) === normalizedConnUrl)) {
          mutualConnections.push({
            name: conn.name,
            headline: conn.headline,
            profileUrl: conn.profileUrl,
            profileImage: conn.profileImage,
          });
        }
      }
    }

    if (mutualConnections.length > 0) {
      connectionDegree = 2;
      console.log('[ConnectionService] Found', mutualConnections.length, 'mutual connections');
    } else {
      connectionDegree = 3;
      console.log('[ConnectionService] No mutual connections found (3rd+ degree)');
    }
  }

  // Step 4: Build the shortest path description
  let shortestPath: string;

  if (connectionDegree === 1) {
    shortestPath = `You are directly connected to ${candidateProfile.name}`;
  } else if (connectionDegree === 2 && mutualConnections.length > 0) {
    const topMutual = mutualConnections[0];
    shortestPath = `Connect via ${topMutual.name} (${topMutual.headline})`;
  } else {
    shortestPath = `No direct connection path found. Consider reaching out cold or finding shared communities.`;
  }

  // Step 5: Build and return the result
  const result: LinkedInConnectionPath = {
    connectionDegree,
    mutualConnections: mutualConnections.slice(0, 10), // Limit to top 10
    shortestPath,
    recruiterProfile: {
      name: recruiterCache.profile.name,
      headline: recruiterCache.profile.headline,
      profileUrl: recruiterCache.profile.profileUrl,
      profileImage: recruiterCache.profile.profileImage,
      connections: recruiterCache.profile.connectionCount,
    },
    candidateProfile: {
      name: candidateProfile.name,
      headline: candidateProfile.headline,
      profileUrl: candidateProfile.profileUrl,
      profileImage: candidateProfile.profileImage,
      connections: candidateProfile.connectionCount,
    },
    lastUpdated: new Date().toISOString(),
  };

  return result;
}

/**
 * Quick check if connection path data might be available
 * (doesn't make API calls, just checks local state)
 */
export function canCheckConnectionPath(): {
  hasRecruiterUrl: boolean;
  hasCachedProfile: boolean;
  hasBrightDataKey: boolean;
  cacheExpiresAt: string | null;
} {
  const recruiterUrl = getRecruiterLinkedInUrl();
  const cache = loadRecruiterCache();
  const hasBrightDataKey = brightDataService.isConfigured();

  return {
    hasRecruiterUrl: !!recruiterUrl,
    hasCachedProfile: !!cache,
    hasBrightDataKey,
    cacheExpiresAt: cache?.expiresAt || null,
  };
}

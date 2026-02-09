import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';

// BrightData API base URL
const BRIGHTDATA_BASE_URL = 'https://api.brightdata.com/datasets/v3';

interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  about: string;
  currentCompany: string;
  currentRole: string;
  profileUrl: string;
  profileImage: string;
  connectionCount: number;
  connections: Array<{
    name: string;
    headline: string;
    profileUrl: string;
    profileImage?: string;
    connectionDegree: number;
  }>;
}

interface MutualConnection {
  name: string;
  headline: string;
  profileUrl: string;
  profileImage?: string;
}

interface ConnectionPathResponse {
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

/**
 * Normalize LinkedIn URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
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
 * Scrape a LinkedIn profile using BrightData Dataset API
 */
async function scrapeLinkedInProfile(
  linkedInUrl: string,
  apiKey: string
): Promise<LinkedInProfile | null> {
  const dataset = 'gd_l1viktl72bvl7bjuj0'; // LinkedIn profile dataset

  try {
    // Trigger the scrape
    const triggerResponse = await fetch(
      `${BRIGHTDATA_BASE_URL}/trigger?dataset_id=${dataset}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ url: linkedInUrl }]),
      }
    );

    if (!triggerResponse.ok) {
      const error = await triggerResponse.text();
      console.error('[LinkedInConnection] Trigger failed:', error);
      return null;
    }

    const triggerData = await triggerResponse.json();
    const snapshotId = triggerData.snapshot_id;

    if (!snapshotId) {
      console.error('[LinkedInConnection] No snapshot ID returned');
      return null;
    }

    // Poll for completion (max 60 seconds)
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const progressResponse = await fetch(
        `${BRIGHTDATA_BASE_URL}/progress/${snapshotId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!progressResponse.ok) continue;

      const progress = await progressResponse.json();

      if (progress.status === 'ready') {
        // Get the snapshot data
        const snapshotResponse = await fetch(
          `${BRIGHTDATA_BASE_URL}/snapshot/${snapshotId}?format=json`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (!snapshotResponse.ok) {
          console.error('[LinkedInConnection] Snapshot fetch failed');
          return null;
        }

        const rawData = await snapshotResponse.json();
        const profileData = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!profileData) return null;

        // Parse the profile data
        return parseLinkedInData(profileData, linkedInUrl);
      }

      if (progress.status === 'failed') {
        console.error('[LinkedInConnection] Scrape failed');
        return null;
      }
    }

    console.error('[LinkedInConnection] Scrape timed out');
    return null;
  } catch (error) {
    console.error('[LinkedInConnection] Error scraping profile:', error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrightDataRawProfile = Record<string, any>;

/**
 * Parse raw BrightData response into LinkedInProfile
 */
function parseLinkedInData(rawData: BrightDataRawProfile, originalUrl: string): LinkedInProfile {
  const toArray = (data: unknown): unknown[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.values(data);
    return [];
  };

  return {
    name: rawData.name || rawData.full_name || '',
    headline: rawData.headline || rawData.title || '',
    location: rawData.location || '',
    about: rawData.about || rawData.summary || '',
    currentCompany: rawData.current_company?.name || rawData.company || '',
    currentRole: rawData.current_company?.title || rawData.title || '',
    profileUrl: rawData.url || rawData.profile_url || originalUrl,
    profileImage: rawData.profile_pic_url || rawData.avatar || '',
    connectionCount:
      typeof rawData.connections_count === 'number'
        ? rawData.connections_count
        : typeof rawData.connections === 'number'
          ? rawData.connections
          : 0,
    connections: toArray(rawData.people_also_viewed).map((conn) => {
      const c = conn as BrightDataRawProfile;
      return {
        name: c.name || c.full_name || '',
        headline: c.headline || c.title || '',
        profileUrl: c.url || c.profile_url || '',
        profileImage: c.profile_pic_url || '',
        connectionDegree: c.degree || 2,
      };
    }),
  };
}

/**
 * POST /api/linkedin-connection
 * Find connection path between recruiter and candidate
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { recruiterLinkedInUrl, candidateLinkedInUrl } = body;

    // Validate inputs
    if (!recruiterLinkedInUrl || !candidateLinkedInUrl) {
      return NextResponse.json(
        { error: 'Both recruiter and candidate LinkedIn URLs are required' },
        { status: 400 }
      );
    }

    // Use server-side API key only (no client-side keys - security fix)
    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'BrightData API key not configured on server' },
        { status: 500 }
      );
    }

    console.log('[LinkedInConnection] Finding path between:');
    console.log('[LinkedInConnection] Recruiter:', recruiterLinkedInUrl);
    console.log('[LinkedInConnection] Candidate:', candidateLinkedInUrl);

    // Scrape both profiles
    const [recruiterProfile, candidateProfile] = await Promise.all([
      scrapeLinkedInProfile(recruiterLinkedInUrl, apiKey),
      scrapeLinkedInProfile(candidateLinkedInUrl, apiKey),
    ]);

    if (!recruiterProfile) {
      return NextResponse.json(
        { error: 'Failed to scrape recruiter LinkedIn profile' },
        { status: 500 }
      );
    }

    if (!candidateProfile) {
      return NextResponse.json(
        { error: 'Failed to scrape candidate LinkedIn profile' },
        { status: 500 }
      );
    }

    // Build sets of connection URLs for comparison
    const recruiterConnectionUrls = new Set(
      recruiterProfile.connections.map((c) => normalizeUrl(c.profileUrl))
    );
    const candidateConnectionUrls = new Set(
      candidateProfile.connections.map((c) => normalizeUrl(c.profileUrl))
    );

    // Check connection degree
    let connectionDegree: 1 | 2 | 3 | null = null;
    const mutualConnections: MutualConnection[] = [];
    const normalizedCandidateUrl = normalizeUrl(candidateLinkedInUrl);

    // Check if candidate is 1st degree connection
    if (recruiterConnectionUrls.has(normalizedCandidateUrl)) {
      connectionDegree = 1;
    } else {
      // Find mutual connections (2nd degree)
      for (const conn of recruiterProfile.connections) {
        const normalizedConnUrl = normalizeUrl(conn.profileUrl);
        if (candidateConnectionUrls.has(normalizedConnUrl)) {
          mutualConnections.push({
            name: conn.name,
            headline: conn.headline,
            profileUrl: conn.profileUrl,
            profileImage: conn.profileImage,
          });
        }
      }

      // Check the other direction too
      for (const conn of candidateProfile.connections) {
        const normalizedConnUrl = normalizeUrl(conn.profileUrl);
        if (
          recruiterConnectionUrls.has(normalizedConnUrl) &&
          !mutualConnections.some(
            (m) => normalizeUrl(m.profileUrl) === normalizedConnUrl
          )
        ) {
          mutualConnections.push({
            name: conn.name,
            headline: conn.headline,
            profileUrl: conn.profileUrl,
            profileImage: conn.profileImage,
          });
        }
      }

      connectionDegree = mutualConnections.length > 0 ? 2 : 3;
    }

    // Build shortest path description
    let shortestPath: string;
    if (connectionDegree === 1) {
      shortestPath = `You are directly connected to ${candidateProfile.name}`;
    } else if (connectionDegree === 2 && mutualConnections.length > 0) {
      const topMutual = mutualConnections[0];
      shortestPath = `Connect via ${topMutual.name} (${topMutual.headline})`;
    } else {
      shortestPath = `No direct connection path found. Consider reaching out cold or finding shared communities.`;
    }

    const response: ConnectionPathResponse = {
      connectionDegree,
      mutualConnections: mutualConnections.slice(0, 10),
      shortestPath,
      recruiterProfile: {
        name: recruiterProfile.name,
        headline: recruiterProfile.headline,
        profileUrl: recruiterProfile.profileUrl,
        profileImage: recruiterProfile.profileImage,
        connections: recruiterProfile.connectionCount,
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('[LinkedInConnection] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/linkedin-connection?recruiter=...&candidate=...
 * Quick check using cached recruiter data (if available)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const recruiterUrl = searchParams.get('recruiter');
  const candidateUrl = searchParams.get('candidate');

  if (!recruiterUrl || !candidateUrl) {
    return NextResponse.json(
      { error: 'Both recruiter and candidate URLs are required' },
      { status: 400 }
    );
  }

  // For GET requests, we just return basic info about what's needed
  // The actual connection path requires POST with API key
  return NextResponse.json({
    message: 'Use POST to get connection path',
    requiredFields: ['recruiterLinkedInUrl', 'candidateLinkedInUrl', 'apiKey'],
  });
}

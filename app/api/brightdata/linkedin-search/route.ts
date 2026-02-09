import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// Bright Data dataset IDs
const LINKEDIN_PEOPLE_SEARCH_DATASET = "gd_l1viktl72bvl7bjuj0"; // LinkedIn People Search
const BRIGHTDATA_BASE_URL = "https://api.brightdata.com/datasets/v3";

export interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  profileUrl: string;
  imageUrl?: string;
  currentCompany?: string;
  connectionDegree?: string;
}

export interface LinkedInSearchResponse {
  profiles: LinkedInProfile[];
  total: number;
  snapshotId?: string;
  status: "pending" | "ready" | "error";
}

/**
 * Search LinkedIn People via Bright Data
 * Uses the same pattern as: linkedin.com/search/results/people/?keywords=X
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { keywords, location, page = 1 } = body;

    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "BRIGHTDATA_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!keywords) {
      return NextResponse.json(
        { error: "Search keywords are required" },
        { status: 400 }
      );
    }

    // Build LinkedIn search URL
    const searchUrl = buildLinkedInSearchUrl(keywords, location, page);
    console.log("[LinkedIn Search] URL:", searchUrl);

    // Trigger Bright Data to scrape the search results
    const response = await fetch(
      `${BRIGHTDATA_BASE_URL}/trigger?dataset_id=${LINKEDIN_PEOPLE_SEARCH_DATASET}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ url: searchUrl }]),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LinkedIn Search] Trigger error:", errorText);
      return NextResponse.json(
        { error: `LinkedIn search trigger failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      snapshotId: data.snapshot_id,
      status: "pending",
      message: "LinkedIn search initiated. Poll /api/brightdata/linkedin-search/status for results.",
    });
  } catch (error) {
    console.error("[LinkedIn Search] API error:", error);
    return NextResponse.json(
      { error: "LinkedIn search failed" },
      { status: 500 }
    );
  }
}

/**
 * Check status of LinkedIn search
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const snapshotId = searchParams.get("snapshotId");

    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "BRIGHTDATA_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!snapshotId) {
      return NextResponse.json(
        { error: "snapshotId is required" },
        { status: 400 }
      );
    }

    // Check progress
    const progressResponse = await fetch(
      `${BRIGHTDATA_BASE_URL}/progress/${snapshotId}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );

    if (!progressResponse.ok) {
      return NextResponse.json(
        { error: "Failed to check progress" },
        { status: progressResponse.status }
      );
    }

    const progress = await progressResponse.json();

    if (progress.status !== "ready") {
      return NextResponse.json({
        status: progress.status,
        progress: progress.progress || 0,
      });
    }

    // Fetch the results
    const snapshotResponse = await fetch(
      `${BRIGHTDATA_BASE_URL}/snapshot/${snapshotId}?format=json`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );

    if (!snapshotResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: snapshotResponse.status }
      );
    }

    const data = await snapshotResponse.json();
    const profiles = parseLinkedInProfiles(data);

    return NextResponse.json({
      status: "ready",
      profiles,
      total: profiles.length,
    });
  } catch (error) {
    console.error("[LinkedIn Search] Status error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

/**
 * Build LinkedIn People Search URL
 */
function buildLinkedInSearchUrl(keywords: string, location?: string, page: number = 1): string {
  const params = new URLSearchParams();

  let searchKeywords = keywords;
  if (location) {
    searchKeywords += ` ${location}`;
  }

  params.set("keywords", searchKeywords);
  params.set("origin", "SWITCH_SEARCH_VERTICAL");

  if (page > 1) {
    params.set("page", page.toString());
  }

  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

/**
 * Parse Bright Data LinkedIn response into normalized profiles
 */
function parseLinkedInProfiles(data: any): LinkedInProfile[] {
  if (!data || !Array.isArray(data)) {
    // Handle single object response
    if (data && typeof data === "object") {
      data = [data];
    } else {
      return [];
    }
  }

  return data
    .filter((item: any) => item && (item.name || item.full_name))
    .map((item: any) => ({
      name: item.name || item.full_name || "",
      headline: item.headline || item.title || "",
      location: item.location || "",
      profileUrl: item.url || item.profile_url || item.linkedin_url || "",
      imageUrl: item.image_url || item.profile_image || item.photo_url || "",
      currentCompany: item.company || item.current_company || "",
      connectionDegree: item.connection_degree || item.degree || "",
    }));
}

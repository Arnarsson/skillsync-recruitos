import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// Bright Data SERP API endpoint (new format)
const BRIGHTDATA_SERP_URL = "https://api.brightdata.com/request";

export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerpResponse {
  results: SerpResult[];
  total: number;
  query: string;
}

/**
 * Search Google via Bright Data SERP API
 * Useful for finding developers beyond GitHub
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { query, location, num = 10 } = body;

    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "BRIGHTDATA_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Build search query for finding developers
    // Append site filters to focus on relevant platforms
    const searchQuery = buildDeveloperSearchQuery(query, location);
    const countryCode = location ? getCountryCode(location) : "us";

    // Build Google search URL with parameters
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=en&gl=${countryCode}&num=${num}`;

    console.log("[SERP] Searching:", googleSearchUrl);

    // Get SERP zone (optional, uses default if not set)
    const serpZone = process.env.BRIGHTDATA_SERP_ZONE || "serp_api1";

    const response = await fetch(BRIGHTDATA_SERP_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone: serpZone,
        url: googleSearchUrl,
        format: "raw",
        data_format: "parsed_light", // Get parsed JSON results
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SERP] Error:", errorText);
      return NextResponse.json(
        { error: `SERP search failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Parse and normalize the results
    const results = parseSerpResults(data);

    return NextResponse.json({
      results,
      total: results.length,
      query: searchQuery,
    });
  } catch (error) {
    console.error("[SERP] API error:", error);
    return NextResponse.json(
      { error: "SERP search failed" },
      { status: 500 }
    );
  }
}

/**
 * Build an optimized search query for finding developers
 */
function buildDeveloperSearchQuery(query: string, location?: string): string {
  // Add site filters to focus on developer platforms
  const sites = [
    "site:github.com",
    "site:linkedin.com/in",
    "site:stackoverflow.com/users",
  ].join(" OR ");

  let searchQuery = `(${sites}) ${query}`;

  if (location) {
    searchQuery += ` "${location}"`;
  }

  return searchQuery;
}

/**
 * Map location names to country codes
 */
function getCountryCode(location: string): string {
  const locationLower = location.toLowerCase();

  const countryMap: Record<string, string> = {
    denmark: "dk",
    copenhagen: "dk",
    københavn: "dk",
    sweden: "se",
    stockholm: "se",
    norway: "no",
    oslo: "no",
    finland: "fi",
    helsinki: "fi",
    germany: "de",
    berlin: "de",
    munich: "de",
    netherlands: "nl",
    amsterdam: "nl",
    uk: "gb",
    london: "gb",
    france: "fr",
    paris: "fr",
    spain: "es",
    madrid: "es",
    barcelona: "es",
    italy: "it",
    usa: "us",
    "united states": "us",
  };

  for (const [key, code] of Object.entries(countryMap)) {
    if (locationLower.includes(key)) {
      return code;
    }
  }

  return "us"; // Default
}

/**
 * Parse Bright Data SERP response into normalized results
 * Handles multiple possible response formats
 */
function parseSerpResults(data: any): SerpResult[] {
  // Handle different response structures
  let organic = data?.organic || data?.results?.organic || data?.results || [];

  // If data is the array directly
  if (Array.isArray(data)) {
    organic = data;
  }

  if (!Array.isArray(organic)) {
    console.log("[SERP] Unexpected response structure:", JSON.stringify(data).slice(0, 500));
    return [];
  }

  return organic
    .filter((item: any) => item && (item.title || item.link || item.url))
    .map((item: any, index: number) => ({
      title: item.title || "",
      link: item.link || item.url || item.href || "",
      snippet: item.snippet || item.description || item.text || "",
      position: index + 1,
    }));
}

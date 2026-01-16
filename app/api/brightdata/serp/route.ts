import { NextRequest, NextResponse } from "next/server";

// Bright Data SERP API endpoint
const BRIGHTDATA_SERP_URL = "https://api.brightdata.com/serp/req";

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

    console.log("[SERP] Searching:", searchQuery);

    const response = await fetch(BRIGHTDATA_SERP_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        search_engine: "google",
        country: location ? getCountryCode(location) : "us",
        num_results: num,
        parse: true,
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
 */
function parseSerpResults(data: any): SerpResult[] {
  if (!data || !data.organic) {
    return [];
  }

  return data.organic.map((item: any, index: number) => ({
    title: item.title || "",
    link: item.link || item.url || "",
    snippet: item.snippet || item.description || "",
    position: index + 1,
  }));
}

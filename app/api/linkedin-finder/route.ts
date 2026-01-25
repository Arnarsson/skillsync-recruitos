import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const LINKEDIN_PEOPLE_SEARCH_DATASET = "gd_l1viktl72bvl7bjuj0";
const BRIGHTDATA_BASE_URL = "https://api.brightdata.com/datasets/v3";

interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog?: string;
  twitter_username?: string;
}

interface LinkedInMatch {
  name: string;
  headline: string;
  location: string;
  profileUrl: string;
  imageUrl?: string;
  currentCompany?: string;
  confidence: number;
  matchReasons: string[];
}

interface MatchAnalysis {
  confidence: number;
  matchReasons: string[];
  isLikelyMatch: boolean;
}

/**
 * Use OpenRouter to generate optimal LinkedIn search query from GitHub data
 */
async function generateSearchQuery(
  profile: GitHubProfile,
  apiKey: string
): Promise<{ keywords: string; location?: string }> {
  const prompt = `Given this GitHub developer profile, generate the optimal LinkedIn search query to find their profile.

GitHub Profile:
- Username: ${profile.login}
- Name: ${profile.name || "Unknown"}
- Bio: ${profile.bio || "None"}
- Location: ${profile.location || "Unknown"}
- Company: ${profile.company || "Unknown"}
- Website: ${profile.blog || "None"}
- Twitter: ${profile.twitter_username || "None"}

Generate a search query that will find this person on LinkedIn. Focus on:
1. Their real name (if available)
2. Current company (if available)
3. Key role/title indicators from bio

Return JSON only:
{
  "keywords": "search terms here",
  "location": "city or country if known, or null"
}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch {
    // Fallback: use name or username
    return {
      keywords: profile.name || profile.login,
      location: profile.location || undefined,
    };
  }
}

/**
 * Search LinkedIn using BrightData
 */
async function searchLinkedIn(
  keywords: string,
  location: string | undefined,
  apiKey: string
): Promise<any[]> {
  // Build search URL
  const params = new URLSearchParams();
  let searchKeywords = keywords;
  if (location) {
    searchKeywords += ` ${location}`;
  }
  params.set("keywords", searchKeywords);
  params.set("origin", "SWITCH_SEARCH_VERTICAL");
  const searchUrl = `https://www.linkedin.com/search/results/people/?${params.toString()}`;

  console.log("[LinkedIn Finder] Searching:", searchUrl);

  // Trigger scrape
  const triggerResponse = await fetch(
    `${BRIGHTDATA_BASE_URL}/trigger?dataset_id=${LINKEDIN_PEOPLE_SEARCH_DATASET}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ url: searchUrl }]),
    }
  );

  if (!triggerResponse.ok) {
    throw new Error(`BrightData trigger failed: ${triggerResponse.status}`);
  }

  const triggerData = await triggerResponse.json();
  const snapshotId = triggerData.snapshot_id;

  // Poll for completion (max 60 seconds)
  const startTime = Date.now();
  const timeout = 60000;

  while (Date.now() - startTime < timeout) {
    await new Promise((r) => setTimeout(r, 2000));

    const progressResponse = await fetch(
      `${BRIGHTDATA_BASE_URL}/progress/${snapshotId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    const progress = await progressResponse.json();

    if (progress.status === "ready") {
      // Fetch results
      const snapshotResponse = await fetch(
        `${BRIGHTDATA_BASE_URL}/snapshot/${snapshotId}?format=json`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      const data = await snapshotResponse.json();
      return Array.isArray(data) ? data : [data];
    }

    if (progress.status === "failed") {
      throw new Error("LinkedIn search failed");
    }
  }

  throw new Error("LinkedIn search timed out");
}

/**
 * Use OpenRouter to analyze and score LinkedIn matches against GitHub profile
 */
async function analyzeMatches(
  githubProfile: GitHubProfile,
  linkedInProfiles: any[],
  apiKey: string
): Promise<LinkedInMatch[]> {
  if (!linkedInProfiles.length) return [];

  // Limit to first 10 profiles
  const profilesToAnalyze = linkedInProfiles.slice(0, 10);

  const prompt = `Analyze these LinkedIn profiles to find which one most likely belongs to this GitHub user.

GitHub Profile:
- Username: ${githubProfile.login}
- Name: ${githubProfile.name || "Unknown"}
- Bio: ${githubProfile.bio || "None"}
- Location: ${githubProfile.location || "Unknown"}
- Company: ${githubProfile.company || "Unknown"}
- Website: ${githubProfile.blog || "None"}

LinkedIn Candidates:
${profilesToAnalyze
  .map(
    (p, i) => `
${i + 1}. Name: ${p.name || p.full_name || "Unknown"}
   Headline: ${p.headline || p.title || "None"}
   Location: ${p.location || "Unknown"}
   Company: ${p.company || p.current_company || "Unknown"}
`
  )
  .join("")}

For each LinkedIn profile, return a confidence score (0-100) and reasons why it matches or doesn't match.
Consider:
- Name similarity
- Location match
- Company match
- Role/headline alignment with GitHub bio
- Overall likelihood this is the same person

Return JSON array:
[
  {
    "index": 0,
    "confidence": 85,
    "matchReasons": ["Name matches exactly", "Same location"],
    "isLikelyMatch": true
  }
]

Only include profiles with confidence > 30. Sort by confidence descending.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter analysis error: ${response.status}`);
  }

  const data = await response.json();
  let analyses: MatchAnalysis[] = [];

  try {
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    analyses = Array.isArray(parsed) ? parsed : parsed.matches || parsed.results || [];
  } catch (e) {
    console.error("[LinkedIn Finder] Parse error:", e);
    return [];
  }

  // Map analyses back to LinkedIn profiles
  return analyses
    .filter((a) => a.confidence > 30)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((analysis) => {
      const profile = profilesToAnalyze[analysis.index] || profilesToAnalyze[0];
      return {
        name: profile.name || profile.full_name || "",
        headline: profile.headline || profile.title || "",
        location: profile.location || "",
        profileUrl: profile.url || profile.profile_url || profile.linkedin_url || "",
        imageUrl: profile.image_url || profile.profile_image || "",
        currentCompany: profile.company || profile.current_company || "",
        confidence: analysis.confidence,
        matchReasons: analysis.matchReasons || [],
      };
    });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubProfile } = body;

    if (!githubProfile || !githubProfile.login) {
      return NextResponse.json(
        { error: "GitHub profile with login is required" },
        { status: 400 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const brightDataKey = process.env.BRIGHTDATA_API_KEY;

    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!brightDataKey) {
      return NextResponse.json(
        { error: "BRIGHTDATA_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("[LinkedIn Finder] Starting for:", githubProfile.login);

    // Step 1: Generate search query using AI
    const { keywords, location } = await generateSearchQuery(
      githubProfile,
      openRouterKey
    );
    console.log("[LinkedIn Finder] Search query:", { keywords, location });

    // Step 2: Search LinkedIn
    const linkedInProfiles = await searchLinkedIn(
      keywords,
      location,
      brightDataKey
    );
    console.log("[LinkedIn Finder] Found", linkedInProfiles.length, "profiles");

    if (!linkedInProfiles.length) {
      return NextResponse.json({
        matches: [],
        message: "No LinkedIn profiles found",
      });
    }

    // Step 3: Analyze and rank matches using AI
    const matches = await analyzeMatches(
      githubProfile,
      linkedInProfiles,
      openRouterKey
    );
    console.log("[LinkedIn Finder] Analyzed matches:", matches.length);

    return NextResponse.json({
      matches,
      searchQuery: { keywords, location },
    });
  } catch (error) {
    console.error("[LinkedIn Finder] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "LinkedIn finder failed" },
      { status: 500 }
    );
  }
}

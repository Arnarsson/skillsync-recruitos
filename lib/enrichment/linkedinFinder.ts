/**
 * LinkedIn Finder - Hybrid Google → BrightData search
 * Uses AI to rank matches by confidence
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const BRIGHTDATA_BASE_URL = "https://api.brightdata.com/datasets/v3";
const LINKEDIN_PEOPLE_SEARCH_DATASET = "gd_l1viktl72bvl7bjuj0";

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
  profileUrl: string;
  name: string;
  headline: string;
  location: string;
  company: string;
  imageUrl?: string;
  confidence: number;
  reasons: string[];
  autoAccepted: boolean;
}

interface FinderResult {
  matches: LinkedInMatch[];
  searchMethod: "google" | "brightdata" | "none";
  searchQuery: string;
}

/**
 * Search Google for LinkedIn profiles via Firecrawl
 */
async function searchViaGoogle(
  name: string,
  company: string | null,
  location: string | null,
  firecrawlKey: string
): Promise<{ url: string; title: string; snippet: string }[]> {
  // Build search query
  const parts = [`site:linkedin.com/in`];
  if (name) parts.push(`"${name}"`);
  if (company) parts.push(`"${company}"`);
  if (location) parts.push(location);

  const query = parts.join(" ");
  console.log("[LinkedIn Finder] Google query:", query);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 10,
      }),
    });

    if (!response.ok) {
      console.error("[LinkedIn Finder] Firecrawl error:", response.status);
      return [];
    }

    const data = await response.json();

    // Extract LinkedIn URLs from results
    const results = (data.data || data.results || [])
      .filter((r: any) => r.url?.includes("linkedin.com/in/"))
      .map((r: any) => ({
        url: r.url,
        title: r.title || r.metadata?.title || "",
        snippet: r.description || r.snippet || r.metadata?.description || "",
      }));

    console.log("[LinkedIn Finder] Google found:", results.length, "profiles");
    return results;
  } catch (error) {
    console.error("[LinkedIn Finder] Google search failed:", error);
    return [];
  }
}

/**
 * Search LinkedIn directly via BrightData (fallback)
 */
async function searchViaBrightData(
  name: string,
  location: string | null,
  brightdataKey: string
): Promise<any[]> {
  const params = new URLSearchParams();
  let searchKeywords = name;
  if (location) searchKeywords += ` ${location}`;
  params.set("keywords", searchKeywords);
  params.set("origin", "SWITCH_SEARCH_VERTICAL");

  const searchUrl = `https://www.linkedin.com/search/results/people/?${params.toString()}`;
  console.log("[LinkedIn Finder] BrightData search:", searchUrl);

  try {
    // Trigger scrape
    const triggerResponse = await fetch(
      `${BRIGHTDATA_BASE_URL}/trigger?dataset_id=${LINKEDIN_PEOPLE_SEARCH_DATASET}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${brightdataKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ url: searchUrl }]),
      }
    );

    if (!triggerResponse.ok) {
      throw new Error(`Trigger failed: ${triggerResponse.status}`);
    }

    const triggerData = await triggerResponse.json();
    const snapshotId = triggerData.snapshot_id;

    // Poll for completion (max 45 seconds)
    const startTime = Date.now();
    const timeout = 45000;

    while (Date.now() - startTime < timeout) {
      await new Promise((r) => setTimeout(r, 2000));

      const progressResponse = await fetch(
        `${BRIGHTDATA_BASE_URL}/progress/${snapshotId}`,
        { headers: { Authorization: `Bearer ${brightdataKey}` } }
      );

      const progress = await progressResponse.json();

      if (progress.status === "ready") {
        const snapshotResponse = await fetch(
          `${BRIGHTDATA_BASE_URL}/snapshot/${snapshotId}?format=json`,
          { headers: { Authorization: `Bearer ${brightdataKey}` } }
        );

        const data = await snapshotResponse.json();
        console.log("[LinkedIn Finder] BrightData found:", Array.isArray(data) ? data.length : 1, "profiles");
        return Array.isArray(data) ? data : [data];
      }

      if (progress.status === "failed") {
        throw new Error("BrightData search failed");
      }
    }

    console.warn("[LinkedIn Finder] BrightData timeout");
    return [];
  } catch (error) {
    console.error("[LinkedIn Finder] BrightData error:", error);
    return [];
  }
}

/**
 * Use AI to rank LinkedIn matches against GitHub profile
 */
async function rankMatches(
  githubProfile: GitHubProfile,
  candidates: { name: string; headline: string; location: string; company: string; url: string }[],
  openrouterKey: string
): Promise<LinkedInMatch[]> {
  if (!candidates.length) return [];

  const prompt = `Match these LinkedIn profiles to a GitHub user. Return confidence scores.

GitHub Profile:
- Username: ${githubProfile.login}
- Name: ${githubProfile.name || "Unknown"}
- Bio: ${githubProfile.bio || "None"}
- Location: ${githubProfile.location || "Unknown"}
- Company: ${githubProfile.company || "Unknown"}

LinkedIn Candidates:
${candidates.slice(0, 10).map((c, i) => `${i + 1}. ${c.name} | ${c.headline} | ${c.location} | ${c.company}`).join("\n")}

For each, score 0-100 confidence this is the same person. Consider:
- Name similarity (exact match = high, partial = medium)
- Location match
- Company match
- Role alignment with GitHub bio

Return JSON array (only profiles with confidence > 30):
[{"index": 0, "confidence": 85, "reasons": ["Exact name match", "Same company"]}]`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
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

    let rankings: { index: number; confidence: number; reasons: string[] }[];
    try {
      const parsed = JSON.parse(content);
      rankings = Array.isArray(parsed) ? parsed : parsed.matches || parsed.results || [];
    } catch {
      console.error("[LinkedIn Finder] Failed to parse AI response");
      return [];
    }

    // Map rankings to matches
    return rankings
      .filter((r) => r.confidence > 30)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((ranking) => {
        const candidate = candidates[ranking.index];
        return {
          profileUrl: candidate.url,
          name: candidate.name,
          headline: candidate.headline,
          location: candidate.location,
          company: candidate.company,
          confidence: ranking.confidence,
          reasons: ranking.reasons || [],
          autoAccepted: ranking.confidence >= 90,
        };
      });
  } catch (error) {
    console.error("[LinkedIn Finder] AI ranking failed:", error);
    return [];
  }
}

/**
 * Main finder function - hybrid Google → BrightData search
 */
export async function findLinkedInProfile(
  githubProfile: GitHubProfile,
  options: {
    firecrawlKey?: string;
    brightdataKey?: string;
    openrouterKey?: string;
  }
): Promise<FinderResult> {
  const firecrawlKey = options.firecrawlKey || process.env.FIRECRAWL_API_KEY;
  const brightdataKey = options.brightdataKey || process.env.BRIGHTDATA_API_KEY;
  const openrouterKey = options.openrouterKey || process.env.OPENROUTER_API_KEY;

  if (!openrouterKey) {
    throw new Error("OPENROUTER_API_KEY required for LinkedIn matching");
  }

  const name = githubProfile.name || githubProfile.login;
  const searchQuery = `${name} ${githubProfile.company || ""} ${githubProfile.location || ""}`.trim();

  console.log("[LinkedIn Finder] Starting for:", name);

  // Step 1: Try Google search first (faster, cheaper)
  let candidates: { name: string; headline: string; location: string; company: string; url: string }[] = [];
  let searchMethod: FinderResult["searchMethod"] = "none";

  if (firecrawlKey) {
    const googleResults = await searchViaGoogle(
      name,
      githubProfile.company,
      githubProfile.location,
      firecrawlKey
    );

    if (googleResults.length >= 1) {
      candidates = googleResults.map((r) => {
        // Parse name from title (usually "Name - Title | LinkedIn")
        const titleParts = r.title.split(" - ");
        const parsedName = titleParts[0] || "";
        const headline = titleParts[1]?.replace(" | LinkedIn", "") || "";

        return {
          name: parsedName,
          headline,
          location: "", // Not available from Google search
          company: "", // Extract from headline if possible
          url: r.url,
        };
      });
      searchMethod = "google";
    }
  }

  // Step 2: Fallback to BrightData if Google didn't find enough
  if (candidates.length < 3 && brightdataKey) {
    console.log("[LinkedIn Finder] Falling back to BrightData");
    const bdResults = await searchViaBrightData(name, githubProfile.location, brightdataKey);

    const bdCandidates = bdResults
      .filter((r) => r && (r.name || r.full_name))
      .map((r) => ({
        name: r.name || r.full_name || "",
        headline: r.headline || r.title || "",
        location: r.location || "",
        company: r.company || r.current_company || "",
        url: r.url || r.profile_url || r.linkedin_url || "",
      }));

    if (bdCandidates.length > candidates.length) {
      candidates = bdCandidates;
      searchMethod = "brightdata";
    }
  }

  if (!candidates.length) {
    console.log("[LinkedIn Finder] No candidates found");
    return { matches: [], searchMethod: "none", searchQuery };
  }

  // Step 3: Rank matches using AI
  const matches = await rankMatches(githubProfile, candidates, openrouterKey);

  console.log("[LinkedIn Finder] Complete:", {
    method: searchMethod,
    candidatesFound: candidates.length,
    matchesRanked: matches.length,
    topConfidence: matches[0]?.confidence || 0,
  });

  return { matches, searchMethod, searchQuery };
}

export type { LinkedInMatch, FinderResult, GitHubProfile };

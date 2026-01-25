/**
 * Talks Enrichment - Find conference talks and YouTube videos
 */

interface Talk {
  title: string;
  url: string;
  platform: "youtube" | "vimeo" | "conference" | "other";
  description?: string;
  date?: string;
}

interface TalksEnrichment {
  talks: Talk[];
  hasTalks: boolean;
  platforms: string[];
}

/**
 * Search for conference talks and videos via Google
 */
export async function enrichFromTalks(
  name: string,
  company: string | null,
  firecrawlKey?: string
): Promise<TalksEnrichment> {
  const apiKey = firecrawlKey || process.env.FIRECRAWL_API_KEY;

  if (!apiKey || !name) {
    return { talks: [], hasTalks: false, platforms: [] };
  }

  // Build search queries
  const queries = [
    `"${name}" conference talk`,
    `"${name}" tech talk youtube`,
  ];

  if (company) {
    queries.push(`"${name}" ${company} presentation`);
  }

  console.log("[Talks Enrichment] Searching for:", name);

  const allTalks: Talk[] = [];

  try {
    // Search with first query (most specific)
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: queries[0],
        limit: 10,
      }),
    });

    if (!response.ok) {
      console.error("[Talks Enrichment] Search failed:", response.status);
      return { talks: [], hasTalks: false, platforms: [] };
    }

    const data = await response.json();
    const results = data.data || data.results || [];

    for (const result of results) {
      const url = result.url || "";
      const title = result.title || result.metadata?.title || "";

      // Determine platform
      let platform: Talk["platform"] = "other";
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        platform = "youtube";
      } else if (url.includes("vimeo.com")) {
        platform = "vimeo";
      } else if (
        url.includes("conference") ||
        url.includes("conf") ||
        url.includes("summit") ||
        url.includes("meetup") ||
        title.toLowerCase().includes("conference") ||
        title.toLowerCase().includes("talk")
      ) {
        platform = "conference";
      }

      // Filter out irrelevant results
      const titleLower = title.toLowerCase();
      const isRelevant =
        platform !== "other" ||
        titleLower.includes("talk") ||
        titleLower.includes("presentation") ||
        titleLower.includes("keynote") ||
        titleLower.includes("conference");

      if (isRelevant && url) {
        allTalks.push({
          title,
          url,
          platform,
          description: result.description || result.snippet || "",
        });
      }
    }

    // Dedupe by URL
    const uniqueTalks = allTalks.filter(
      (talk, index, self) => index === self.findIndex((t) => t.url === talk.url)
    );

    const platforms = [...new Set(uniqueTalks.map((t) => t.platform))];

    console.log("[Talks Enrichment] Found:", uniqueTalks.length, "talks");

    return {
      talks: uniqueTalks.slice(0, 10),
      hasTalks: uniqueTalks.length > 0,
      platforms,
    };
  } catch (error) {
    console.error("[Talks Enrichment] Error:", error);
    return { talks: [], hasTalks: false, platforms: [] };
  }
}

export type { Talk, TalksEnrichment };

/**
 * Combined Search Service
 *
 * Searches multiple sources (GitHub, LinkedIn, SERP) and combines results
 */

export interface CombinedSearchResult {
  id: string;
  source: "github" | "linkedin" | "serp";
  name: string;
  headline?: string;
  avatar?: string;
  location?: string;
  profileUrl: string;
  skills?: string[];
  company?: string;
  score?: number;
  // GitHub-specific
  username?: string;
  repos?: number;
  stars?: number;
  followers?: number;
  // LinkedIn-specific
  connectionDegree?: string;
  // SERP-specific
  snippet?: string;
  sourceType?: 'linkedin' | 'github' | 'academic' | 'company' | 'blog' | 'other';
}

export interface CombinedSearchResponse {
  results: CombinedSearchResult[];
  total: number;
  sources: {
    github: { count: number; status: "ready" | "error" };
    linkedin: { count: number; status: "ready" | "pending" | "error"; snapshotId?: string };
    serp: { count: number; status: "ready" | "pending" | "error" };
  };
  interpretation: {
    language: string | null;
    location: string | null;
    keywords: string[];
  };
}

/**
 * Trigger a combined search across GitHub, LinkedIn, and SERP
 */
export async function triggerCombinedSearch(
  query: string,
  options: {
    includeLinkedIn?: boolean;
    linkedInApiKey?: string;
    includeSERP?: boolean;
  } = {}
): Promise<{
  githubResults: CombinedSearchResult[];
  linkedInSnapshotId?: string;
  serpResults?: CombinedSearchResult[];
  interpretation: any;
}> {
  const results: CombinedSearchResult[] = [];
  let linkedInSnapshotId: string | undefined;
  let serpResults: CombinedSearchResult[] | undefined;
  let interpretation: any = null;

  // 1. Search GitHub (fast, synchronous)
  try {
    const githubResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (githubResponse.ok) {
      const data = await githubResponse.json();
      interpretation = data.interpretation;

      // Convert GitHub results to combined format
      for (const user of data.users || []) {
        results.push({
          id: `github-${user.username}`,
          source: "github",
          name: user.name || user.username,
          headline: user.bio,
          avatar: user.avatar,
          location: user.location,
          profileUrl: `https://github.com/${user.username}`,
          skills: user.skills,
          company: user.company,
          score: user.score,
          username: user.username,
          repos: user.repos,
          stars: user.stars,
          followers: user.followers,
        });
      }
    }
  } catch (error) {
    console.error("[CombinedSearch] GitHub error:", error);
  }

  // 2. Trigger LinkedIn search (async, returns snapshot ID)
  if (options.includeLinkedIn) {
    try {
      const location = interpretation?.location || null;
      const keywords = interpretation?.keywords?.join(" ") || query;

      const linkedInResponse = await fetch("/api/brightdata/linkedin-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          location,
        }),
      });

      if (linkedInResponse.ok) {
        const data = await linkedInResponse.json();
        linkedInSnapshotId = data.snapshotId;
      }
    } catch (error) {
      console.error("[CombinedSearch] LinkedIn trigger error:", error);
    }
  }

  // 3. Trigger SERP search for niche/specialized queries (if enabled)
  if (options.includeSERP) {
    try {
      // Dynamic import to avoid bundling issues
      const { searchTalentViaSERP, shouldUseSerpSearch } = await import(
        "@/services/serpTalentSearch"
      );

      // Only use SERP search for specialized queries
      if (shouldUseSerpSearch(query)) {
        const location = interpretation?.location || undefined;
        const serpTalents = await searchTalentViaSERP(query, {
          location,
          maxResults: 10,
        });

        // Convert to combined format
        serpResults = serpTalents.map((talent) => ({
          id: talent.id,
          source: "serp" as const,
          name: talent.name,
          headline: talent.headline,
          location: talent.location,
          profileUrl: talent.profileUrl,
          skills: talent.skills,
          company: talent.company,
          score: talent.relevanceScore,
          snippet: talent.snippet,
          sourceType: talent.sourceType,
        }));
      }
    } catch (error) {
      console.error("[CombinedSearch] SERP search error:", error);
    }
  }

  return {
    githubResults: results,
    linkedInSnapshotId,
    serpResults,
    interpretation,
  };
}

/**
 * Poll for LinkedIn search results
 */
export async function pollLinkedInResults(
  snapshotId: string
): Promise<{
  status: "pending" | "ready" | "error";
  profiles?: CombinedSearchResult[];
  progress?: number;
}> {
  try {
    const response = await fetch(
      `/api/brightdata/linkedin-search?snapshotId=${snapshotId}`
    );

    if (!response.ok) {
      return { status: "error" };
    }

    const data = await response.json();

    if (data.status !== "ready") {
      return {
        status: data.status,
        progress: data.progress,
      };
    }

    // Convert LinkedIn profiles to combined format
    const profiles: CombinedSearchResult[] = (data.profiles || []).map(
      (profile: any, index: number) => ({
        id: `linkedin-${index}-${profile.profileUrl || index}`,
        source: "linkedin" as const,
        name: profile.name,
        headline: profile.headline,
        avatar: profile.imageUrl,
        location: profile.location,
        profileUrl: profile.profileUrl,
        company: profile.currentCompany,
        connectionDegree: profile.connectionDegree,
      })
    );

    return {
      status: "ready",
      profiles,
    };
  } catch (error) {
    console.error("[CombinedSearch] Poll error:", error);
    return { status: "error" };
  }
}

/**
 * Deduplicate results across sources (by name + location similarity)
 */
export function deduplicateResults(
  results: CombinedSearchResult[]
): CombinedSearchResult[] {
  const seen = new Map<string, CombinedSearchResult>();

  for (const result of results) {
    // Create a dedup key from normalized name + location
    const key = `${normalizeString(result.name)}-${normalizeString(result.location || "")}`;

    if (!seen.has(key)) {
      seen.set(key, result);
    } else {
      // Prefer GitHub results (more data), but merge LinkedIn data
      const existing = seen.get(key)!;
      if (result.source === "linkedin" && existing.source === "github") {
        // Add LinkedIn URL to GitHub result
        existing.connectionDegree = result.connectionDegree;
      } else if (result.source === "github" && existing.source === "linkedin") {
        // Replace LinkedIn with GitHub (more data)
        seen.set(key, {
          ...result,
          connectionDegree: existing.connectionDegree,
        });
      }
    }
  }

  return Array.from(seen.values());
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

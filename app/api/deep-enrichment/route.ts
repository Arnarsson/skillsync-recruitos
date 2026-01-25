import { NextRequest, NextResponse } from "next/server";
import {
  enrichFromGitHub,
  findLinkedInProfile,
  enrichFromWebsite,
  enrichFromTalks,
} from "@/lib/enrichment";

interface DeepEnrichmentRequest {
  username: string;
  githubProfile: {
    login: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    company: string | null;
    blog?: string;
    twitter_username?: string;
  };
  linkedInUrl?: string; // If already known
}

/**
 * Deep Enrichment API - Parallel fetch from all sources
 * Returns comprehensive profile data for deep analysis
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: DeepEnrichmentRequest = await request.json();
    const { username, githubProfile, linkedInUrl } = body;

    if (!username || !githubProfile) {
      return NextResponse.json(
        { error: "username and githubProfile are required" },
        { status: 400 }
      );
    }

    console.log("[Deep Enrichment] Starting for:", username);

    // Launch all enrichments in parallel
    const [githubResult, linkedInResult, websiteResult, talksResult] =
      await Promise.allSettled([
        // GitHub enrichment (README, PRs to others, contribution patterns)
        enrichFromGitHub(username),

        // LinkedIn finder (skip if URL already provided)
        linkedInUrl
          ? Promise.resolve({
              matches: [
                {
                  profileUrl: linkedInUrl,
                  name: githubProfile.name || "",
                  headline: "",
                  location: "",
                  company: "",
                  confidence: 100,
                  reasons: ["URL provided by user"],
                  autoAccepted: true,
                },
              ],
              searchMethod: "provided" as const,
              searchQuery: "",
            })
          : findLinkedInProfile(githubProfile, {}),

        // Website enrichment (if blog URL exists)
        githubProfile.blog
          ? enrichFromWebsite(githubProfile.blog)
          : Promise.resolve(null),

        // Talks enrichment
        enrichFromTalks(
          githubProfile.name || username,
          githubProfile.company
        ),
      ]);

    // Extract results (handle rejected promises gracefully)
    const github =
      githubResult.status === "fulfilled" ? githubResult.value : null;
    const linkedin =
      linkedInResult.status === "fulfilled" ? linkedInResult.value : null;
    const website =
      websiteResult.status === "fulfilled" ? websiteResult.value : null;
    const talks =
      talksResult.status === "fulfilled" ? talksResult.value : null;

    // Log any errors
    if (githubResult.status === "rejected") {
      console.error("[Deep Enrichment] GitHub failed:", githubResult.reason);
    }
    if (linkedInResult.status === "rejected") {
      console.error("[Deep Enrichment] LinkedIn failed:", linkedInResult.reason);
    }
    if (websiteResult.status === "rejected") {
      console.error("[Deep Enrichment] Website failed:", websiteResult.reason);
    }
    if (talksResult.status === "rejected") {
      console.error("[Deep Enrichment] Talks failed:", talksResult.reason);
    }

    const duration = Date.now() - startTime;
    console.log("[Deep Enrichment] Complete in", duration, "ms");

    // Determine status
    const hasAnyData = github || linkedin?.matches?.length || website || talks?.hasTalks;
    const allComplete =
      githubResult.status === "fulfilled" &&
      linkedInResult.status === "fulfilled" &&
      websiteResult.status === "fulfilled" &&
      talksResult.status === "fulfilled";

    return NextResponse.json({
      github: github
        ? {
            readme: github.readme,
            prsToOthers: github.prsToOthers,
            contributionPattern: github.contributionPattern,
            topics: github.topics,
          }
        : null,

      linkedin: linkedin
        ? {
            matches: linkedin.matches,
            searchMethod: linkedin.searchMethod,
            bestMatch: linkedin.matches?.[0] || null,
            autoAccepted: linkedin.matches?.[0]?.autoAccepted || false,
          }
        : null,

      website: website
        ? {
            url: website.url,
            title: website.title,
            topics: website.topics,
            hasProjects: website.hasProjects,
            hasBlog: website.hasBlog,
            socialLinks: website.socialLinks,
          }
        : null,

      talks: talks
        ? {
            talks: talks.talks,
            hasTalks: talks.hasTalks,
            platforms: talks.platforms,
          }
        : null,

      meta: {
        status: allComplete ? "complete" : "partial",
        duration,
        sources: {
          github: githubResult.status === "fulfilled",
          linkedin: linkedInResult.status === "fulfilled",
          website: websiteResult.status === "fulfilled",
          talks: talksResult.status === "fulfilled",
        },
      },
    });
  } catch (error) {
    console.error("[Deep Enrichment] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Deep enrichment failed" },
      { status: 500 }
    );
  }
}

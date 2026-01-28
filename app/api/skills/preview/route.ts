import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOctokit } from "@/lib/github";
import { normalizeSkill, getGitHubLanguage, FRAMEWORK_TO_LANGUAGE } from "@/lib/search/skillNormalizer";
import type { HardRequirementsConfig } from "@/types";

type SkillTier = "must-have" | "nice-to-have" | "bonus";

interface SkillInput {
  name: string;
  tier: SkillTier;
}

interface SkillInsight {
  count: number;
  isLimiting: boolean;
  potentialGain?: number;
}

interface SkillSuggestion {
  skill: string;
  currentTier: SkillTier;
  suggestedTier: SkillTier;
  impact: string;
}

interface PreviewResponse {
  totalCandidates: number;
  perSkill: Record<string, SkillInsight>;
  suggestions: SkillSuggestion[];
  cached: boolean;
}

// Cache for GitHub search results (skill -> count)
// Simple in-memory cache with TTL
const searchCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Search GitHub for candidates with a specific skill
 * Returns the total_count from the search API
 */
async function getSkillCandidateCount(
  skill: string,
  octokit: ReturnType<typeof createOctokit>,
  location?: string
): Promise<number> {
  // Check cache first
  const cacheKey = `${skill}:${location || "global"}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.count;
  }

  try {
    // Normalize the skill to get GitHub-compatible search terms
    const normalized = normalizeSkill(skill) || skill.toLowerCase();
    const githubLang = getGitHubLanguage(normalized);

    // Build search query
    const queryParts: string[] = [];

    // Add language qualifier if we have a GitHub language
    if (githubLang) {
      queryParts.push(`language:${githubLang}`);
    }

    // For frameworks/tools without a direct language mapping, search as keyword
    const isFramework = FRAMEWORK_TO_LANGUAGE[normalized] !== undefined;
    if (isFramework || !githubLang) {
      // Search for the skill name in user profiles
      queryParts.push(skill.toLowerCase());
    }

    // Add location if provided
    if (location) {
      queryParts.push(`location:${location}`);
    }

    const searchQuery = queryParts.length > 0 ? queryParts.join(" ") : "type:user";

    // GitHub user search
    const { data } = await octokit.search.users({
      q: searchQuery,
      per_page: 1, // We only need the count
    });

    const count = data.total_count;

    // Cache the result
    searchCache.set(cacheKey, { count, timestamp: Date.now() });

    return count;
  } catch (error) {
    console.error(`Error searching for skill "${skill}":`, error);
    return 0;
  }
}

/**
 * POST /api/skills/preview
 *
 * Returns candidate counts for each skill and suggestions for limiting skills.
 *
 * Request body:
 * {
 *   skills: [{ name: "React", tier: "must-have" }, ...],
 *   location?: "copenhagen",
 *   hardRequirements?: HardRequirementsConfig
 * }
 *
 * Response:
 * {
 *   totalCandidates: 3,
 *   perSkill: { "React": { count: 45, isLimiting: false }, ... },
 *   suggestions: [{ skill: "Data Science", currentTier: "must-have", ... }],
 *   cached: false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skills, location, hardRequirements } = body as {
      skills: SkillInput[];
      location?: string;
      hardRequirements?: HardRequirementsConfig;
    };

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: "Skills array is required" },
        { status: 400 }
      );
    }

    // Get session for authenticated requests (higher rate limits)
    const session = await getServerSession(authOptions);
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;
    const octokit = createOctokit(accessToken);

    // Fetch candidate counts for each skill in parallel
    const skillCounts = await Promise.all(
      skills.map(async (skill) => {
        const count = await getSkillCandidateCount(skill.name, octokit, location);
        return { name: skill.name, tier: skill.tier, count };
      })
    );

    // Determine which skills are limiting (< 20 candidates for must-haves)
    const LIMITING_THRESHOLD = 20;
    const perSkill: Record<string, SkillInsight> = {};
    const suggestions: SkillSuggestion[] = [];

    // Get must-have skills for display
    const mustHaveSkills = skillCounts.filter((s) => s.tier === "must-have");
    const mustHaveCounts = mustHaveSkills.map((s) => s.count).filter((c) => c > 0);

    // Total candidates = the PRIMARY skill's count (first must-have with results)
    // This represents "candidates we'll search from" - the actual search will
    // find these candidates and RANK them by how many skills they match.
    // We don't try to estimate intersection (impossible with GitHub API).
    let totalCandidates: number;
    if (mustHaveCounts.length > 0) {
      // Use the largest must-have pool - this is who we're searching from
      // The ranking algorithm will prioritize those matching more skills
      totalCandidates = Math.max(...mustHaveCounts);
    } else {
      // No must-haves, use max of all skills
      totalCandidates = skillCounts.reduce((max, s) => Math.max(max, s.count), 0);
    }

    // Apply hard requirements filtering (approximate impact)
    if (hardRequirements?.enabled && hardRequirements.requirements.length > 0) {
      const enabledHardReqs = hardRequirements.requirements.filter(r => r.enabled && r.isMustHave);
      
      // Apply multipliers for each must-have hard requirement
      enabledHardReqs.forEach(req => {
        if (req.type === 'location' && req.value) {
          // Location typically reduces pool by 70-90% depending on specificity
          const locationMultiplier = req.value === 'remote' ? 0.9 : 0.3;
          totalCandidates = Math.floor(totalCandidates * locationMultiplier);
        } else if (req.type === 'experience' && typeof req.value === 'number') {
          // Experience requirements reduce pool progressively
          const expMultipliers: Record<number, number> = {
            0: 1.0,
            1: 0.9,
            2: 0.8,
            3: 0.7,
            5: 0.5,
            7: 0.35,
            10: 0.2,
            15: 0.1,
          };
          const multiplier = expMultipliers[req.value] || 0.1;
          totalCandidates = Math.floor(totalCandidates * multiplier);
        } else if (req.type === 'language' && req.value) {
          // Language requirements reduce pool by ~40-60% depending on rarity
          const commonLanguages = ['english'];
          const multiplier = commonLanguages.includes(String(req.value).toLowerCase()) ? 0.8 : 0.5;
          totalCandidates = Math.floor(totalCandidates * multiplier);
        }
      });

      // Ensure we don't go below 0
      totalCandidates = Math.max(0, totalCandidates);
    }

    // Process each skill
    for (const skill of skillCounts) {
      // A skill is "limiting" if:
      // 1. It's a must-have with very few results (niche skill)
      // 2. It returns 0 (bad search term or extremely rare)
      // This warns users that requiring this skill might exclude good candidates
      const isLimiting = skill.tier === "must-have" &&
        (skill.count < LIMITING_THRESHOLD || skill.count === 0);

      // For limiting skills, show how this compares to other must-haves
      // This helps users understand relative scarcity
      let potentialGain: number | undefined;
      if (isLimiting && mustHaveCounts.length > 0) {
        const maxPool = Math.max(...mustHaveCounts);
        if (skill.count < maxPool) {
          // Show how many more candidates they'd search from
          // if this skill wasn't penalizing scores
          potentialGain = maxPool - skill.count;
        }
      }

      perSkill[skill.name] = {
        count: skill.count,
        isLimiting,
        potentialGain: potentialGain && potentialGain > 0 ? potentialGain : undefined,
      };

      // Generate suggestion for limiting skills
      if (isLimiting && potentialGain && potentialGain > 0) {
        suggestions.push({
          skill: skill.name,
          currentTier: skill.tier,
          suggestedTier: "nice-to-have",
          impact: `+${potentialGain.toLocaleString()} candidates`,
        });
      }
    }

    // Check if results came from cache
    const allCached = skills.every((skill) => {
      const cacheKey = `${skill.name}:${location || "global"}`;
      const cached = searchCache.get(cacheKey);
      return cached && Date.now() - cached.timestamp < CACHE_TTL_MS;
    });

    const response: PreviewResponse = {
      totalCandidates,
      perSkill,
      suggestions,
      cached: allCached,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Skills preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill previews" },
      { status: 500 }
    );
  }
}

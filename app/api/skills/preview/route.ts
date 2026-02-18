import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOctokit } from "@/lib/github";
import { normalizeSkill, getGitHubLanguage, FRAMEWORK_TO_LANGUAGE, META_SKILLS } from "@/lib/search/skillNormalizer";
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
  fallback?: boolean;
}

interface SkillSuggestion {
  skill: string;
  currentTier: SkillTier;
  suggestedTier: SkillTier;
  impact: string;
}

interface PreviewResponse {
  totalCandidates: number;
  estimateMin?: number;
  estimateMax?: number;
  perSkill: Record<string, SkillInsight>;
  suggestions: SkillSuggestion[];
  cached: boolean;
  estimateMode?: "strict" | "broad";
  confidence?: "high" | "medium" | "low";
  note?: string;
}

// Cache for GitHub search results (skill -> count)
// Simple in-memory cache with TTL
const searchCache = new Map<string, { count: number; timestamp: number; fallback: boolean; apiFallback: boolean }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const fallbackWarningCache = new Set<string>();

function getFallbackSkillCount(skill: string): number {
  const normalized = normalizeSkill(skill) || skill.toLowerCase();
  const heuristicCounts: Record<string, number> = {
    javascript: 250000,
    typescript: 180000,
    python: 320000,
    java: 280000,
    react: 90000,
    "node.js": 120000,
    nodejs: 120000,
    "c#": 110000,
    go: 85000,
    rust: 45000,
    aws: 70000,
    kubernetes: 60000,
    postgresql: 80000,
    redis: 75000,
  };

  return heuristicCounts[normalized] ?? 30000;
}

/** Demo-mode hardcoded counts — realistic GitHub volumes without any API calls */
const DEMO_SKILL_COUNTS: Record<string, number> = {
  javascript: 250000,
  typescript: 180000,
  python: 320000,
  java: 280000,
  react: 90000,
  "node.js": 120000,
  nodejs: 120000,
  "c#": 110000,
  go: 85000,
  rust: 45000,
  aws: 70000,
  kubernetes: 60000,
  postgresql: 80000,
  redis: 75000,
  testing: 50000,
};

function getDemoCount(skill: string): number {
  const key = skill.toLowerCase().trim();
  return DEMO_SKILL_COUNTS[key] ?? DEMO_SKILL_COUNTS[normalizeSkill(skill) ?? ""] ?? 40000;
}

/**
 * Search GitHub for candidates with a specific skill
 * Returns the total_count from the search API
 *
 * fallback: true when the count is an estimate (not live GitHub data).
 * apiFallback: true ONLY when GitHub API returned an error (rate-limit etc.).
 *   Meta-skill bypasses and demo-mode counts set fallback=true but apiFallback=false,
 *   so the total-candidates cap / low-confidence path is not triggered by them.
 */
async function getSkillCandidateCount(
  skill: string,
  octokit: ReturnType<typeof createOctokit>,
  location?: string
): Promise<{ count: number; fallback: boolean; apiFallback: boolean }> {
  // Demo mode: skip GitHub API entirely and return realistic hardcoded counts
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (isDemoMode) {
    const count = getDemoCount(skill);
    return { count, fallback: true, apiFallback: false };
  }

  // Meta-skills (e.g. "Open Source") don't map to GitHub languages.
  // OSS contributors are ubiquitous on GitHub — use a very high estimate.
  // apiFallback is false: this is an intentional bypass, not an API error.
  if (META_SKILLS.includes(skill.toLowerCase().trim())) {
    const count = 500000;
    const cacheKey = `${skill}:${location || "global"}`;
    searchCache.set(cacheKey, { count, timestamp: Date.now(), fallback: true, apiFallback: false });
    return { count, fallback: true, apiFallback: false };
  }

  // Check cache first
  const cacheKey = `${skill}:${location || "global"}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { count: cached.count, fallback: cached.fallback, apiFallback: cached.apiFallback };
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
    searchCache.set(cacheKey, { count, timestamp: Date.now(), fallback: false, apiFallback: false });
    return { count, fallback: false, apiFallback: false };
  } catch (error) {
    const status =
      (error as { status?: number })?.status ??
      (error as { response?: { status?: number } })?.response?.status;

    // Graceful degradation: avoid breaking the UI when GitHub search is throttled.
    if (status === 403 || status === 429) {
      const fallback = getFallbackSkillCount(skill);
      searchCache.set(cacheKey, { count: fallback, timestamp: Date.now(), fallback: true, apiFallback: true });

      if (!fallbackWarningCache.has(cacheKey)) {
        fallbackWarningCache.add(cacheKey);
        console.warn(
          `[SkillsPreview] GitHub rate limit hit for "${skill}", using fallback estimate`
        );
      }
      return { count: fallback, fallback: true, apiFallback: true };
    }

    console.warn(`Error searching for skill "${skill}"`, error);
    const fallback = getFallbackSkillCount(skill);
    searchCache.set(cacheKey, { count: fallback, timestamp: Date.now(), fallback: true, apiFallback: true });
    return { count: fallback, fallback: true, apiFallback: true };
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
        const result = await getSkillCandidateCount(skill.name, octokit, location);
        return {
          name: skill.name,
          tier: skill.tier,
          count: result.count,
          usedFallback: result.fallback,
          // apiFallback is true only when GitHub returned an error (rate-limit etc.).
          // Meta-skill and demo bypasses set fallback=true but apiFallback=false,
          // so they don't trigger the conservative 5k cap or low-confidence label.
          usedApiFallback: result.apiFallback,
        };
      })
    );
    // usedFallback: any estimate label is shown (includes meta-skills, demo, API errors)
    const usedFallback = skillCounts.some((s) => s.usedFallback);
    // usedApiFallback: only true when real GitHub API errors occurred
    const usedApiFallback = skillCounts.some((s) => s.usedApiFallback);

    // Determine which skills are limiting (< 20 candidates for must-haves)
    const LIMITING_THRESHOLD = 20;
    const perSkill: Record<string, SkillInsight> = {};
    const suggestions: SkillSuggestion[] = [];

    // Get must-have skills for display
    const mustHaveSkills = skillCounts.filter((s) => s.tier === "must-have");
    const mustHaveCounts = mustHaveSkills.map((s) => s.count).filter((c) => c > 0);

    // Total candidates should reflect strict must-have matching as a conservative estimate.
    // We use minimum must-have pool and apply overlap decay as must-have count increases.
    let totalCandidates: number;
    let estimateMode: "strict" | "broad" = "broad";
    let confidence: "high" | "medium" | "low" = "high";
    let note = "Estimate based on live GitHub query volumes.";
    if (mustHaveCounts.length > 0) {
      estimateMode = "strict";
      const minMustHavePool = Math.min(...mustHaveCounts);
      const mustHaveCount = mustHaveSkills.length;
      if (mustHaveCount <= 1) {
        totalCandidates = minMustHavePool;
      } else {
        const overlapDecay = Math.pow(0.45, mustHaveCount - 1);
        totalCandidates = Math.floor(minMustHavePool * overlapDecay);
      }
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

    let estimateMin: number | undefined;
    let estimateMax: number | undefined;

    const isDemoModeResponse = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (usedApiFallback && !isDemoModeResponse) {
      // When GitHub API returned errors (rate-limit / auth), keep estimate conservative.
      // Note: meta-skill bypasses (Open Source → 500k) do NOT set usedApiFallback,
      // so they won't trigger this cap even though they set usedFallback=true.
      totalCandidates = Math.min(totalCandidates, 5000);
      confidence = "low";
      note = "Approximate estimate (GitHub rate-limited). Pipeline results are the source of truth.";
      estimateMin = Math.max(0, Math.floor(totalCandidates * 0.25));
      estimateMax = totalCandidates;
    } else if (isDemoModeResponse) {
      // Demo mode: hardcoded counts are realistic — show medium confidence
      confidence = "medium";
      note = "Demo mode estimates. Real counts will vary by job location and requirements.";
    } else if (estimateMode === "strict") {
      confidence = "medium";
      note = "Conservative estimate for candidates matching all must-have skills.";
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
        fallback: skill.usedFallback,
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
      estimateMin,
      estimateMax,
      perSkill,
      suggestions,
      cached: allCached,
      estimateMode,
      confidence,
      note,
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

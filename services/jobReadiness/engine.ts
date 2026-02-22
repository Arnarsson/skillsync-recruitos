import type {
  ReadinessScore,
  ReadinessInput,
  PillarResult,
  PillarName,
  ExternalFetchers,
} from './types';
import { PILLAR_NAMES, PILLAR_WEIGHTS, getReadinessLevel } from './types';
import { computeNetworkIntelligence } from './pillar1-network';
import { computeEngagementDecay } from './pillar2-engagement';
import { computeSkillDiversification } from './pillar3-skills';
import { computeCompanyHealth } from './pillar4-company';
import { computeTenureRisk } from './pillar5-tenure';
import { computeProfileOptimization } from './pillar6-profile';
import { computeSentimentShift } from './pillar7-sentiment';

const PILLAR_FUNCTIONS: Record<
  PillarName,
  (input: ReadinessInput, fetchers?: ExternalFetchers) => Promise<PillarResult>
> = {
  networkIntelligence: computeNetworkIntelligence,
  engagementDecay: computeEngagementDecay,
  skillDiversification: computeSkillDiversification,
  companyHealth: computeCompanyHealth,
  tenureRisk: computeTenureRisk,
  profileOptimization: computeProfileOptimization,
  sentimentShift: computeSentimentShift,
};

/**
 * Compute the full Job Readiness Score for a candidate.
 * Runs all 7 pillars concurrently, handles null results with dynamic re-weighting.
 *
 * Pre-processing:
 * - Enriches input with LinkedIn data if URL provided but profile missing
 *
 * Post-processing:
 * - Degrades confidence on GitHub-sourced signals when profile data is stale
 */
export async function computeReadinessScore(
  input: ReadinessInput,
  fetchers?: ExternalFetchers
): Promise<ReadinessScore> {
  // === Pre-processing: enrich input with LinkedIn data ===
  let enrichedInput = input;
  if (input.linkedinUrl && !input.linkedinProfile && fetchers?.fetchLinkedInProfile) {
    try {
      const linkedinProfile = await fetchers.fetchLinkedInProfile(input.linkedinUrl);
      if (linkedinProfile) {
        enrichedInput = { ...input, linkedinProfile };
      }
    } catch {
      // LinkedIn fetch failed — continue without it
    }
  }

  // Run all pillars concurrently
  const pillarEntries = await Promise.all(
    PILLAR_NAMES.map(async (name) => {
      try {
        const result = await PILLAR_FUNCTIONS[name](enrichedInput, fetchers);
        return [name, result] as const;
      } catch (error) {
        return [name, {
          pillar: name,
          score: null,
          confidence: 0,
          signals: [],
          primarySource: 'github' as const,
          fallbacksUsed: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        } satisfies PillarResult] as const;
      }
    })
  );

  // === Post-processing: staleness confidence degradation ===
  const stalenessFactor = computeStalenessFactor(enrichedInput);
  const processedEntries = pillarEntries.map(([name, result]) => {
    if (result.score === null || stalenessFactor >= 1) return [name, result] as const;

    // Degrade confidence of GitHub-only pillars when data is stale
    const isGitHubOnly = result.primarySource === 'github' &&
      result.signals.every(s => s.source === 'github');

    if (isGitHubOnly && stalenessFactor < 1) {
      return [name, {
        ...result,
        confidence: result.confidence * stalenessFactor,
        signals: result.signals.map(s => ({
          ...s,
          confidence: s.confidence * stalenessFactor,
        })),
      }] as const;
    }

    return [name, result] as const;
  });

  const pillars = Object.fromEntries(processedEntries) as Record<PillarName, PillarResult>;

  // Dynamic re-weighting: redistribute null-pillar weights proportionally
  const activePillars = processedEntries.filter(([_, r]) => r.score !== null);
  const totalActiveWeight = activePillars.reduce(
    (sum, [name]) => sum + PILLAR_WEIGHTS[name],
    0
  );

  let overall = 0;
  let totalConfidence = 0;

  if (totalActiveWeight > 0) {
    for (const [name, result] of activePillars) {
      const reWeight = PILLAR_WEIGHTS[name] / totalActiveWeight;
      overall += result.score! * reWeight;
      totalConfidence += result.confidence * reWeight;
    }
  }

  overall = Math.round(Math.min(100, Math.max(0, overall)));

  const allSources = new Set(
    processedEntries.flatMap(([_, r]) => [r.primarySource, ...r.fallbacksUsed])
  );

  return {
    overall,
    confidence: totalConfidence,
    level: getReadinessLevel(overall),
    pillars,
    computedAt: new Date().toISOString(),
    candidateId: input.candidateId,
    dataSourcesSummary: [...allSources],
  };
}

/**
 * Compute a staleness factor (0-1) based on how fresh the GitHub data is.
 * 1.0 = fresh (< 30 days), degrades toward 0.3 for very stale data (1+ year).
 *
 * Used to reduce confidence on GitHub-only signals when the profile
 * hasn't been updated recently — prevents false negatives like scoring
 * someone "cold" based on a 2-year-old GitHub profile.
 */
function computeStalenessFactor(input: ReadinessInput): number {
  // If we have LinkedIn data, GitHub staleness matters less
  if (input.linkedinProfile) return 1;

  const updatedAt = input.githubProfile?.updated_at;
  if (!updatedAt) return 1; // No data to judge — assume fresh

  const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / 86400000;

  if (daysSinceUpdate < 30) return 1;       // Fresh
  if (daysSinceUpdate < 90) return 0.9;     // Slightly stale
  if (daysSinceUpdate < 180) return 0.7;    // Stale
  if (daysSinceUpdate < 365) return 0.5;    // Very stale
  return 0.3;                                // Ancient
}

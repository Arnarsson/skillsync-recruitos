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
 */
export async function computeReadinessScore(
  input: ReadinessInput,
  fetchers?: ExternalFetchers
): Promise<ReadinessScore> {
  // Run all pillars concurrently
  const pillarEntries = await Promise.all(
    PILLAR_NAMES.map(async (name) => {
      try {
        const result = await PILLAR_FUNCTIONS[name](input, fetchers);
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

  const pillars = Object.fromEntries(pillarEntries) as Record<PillarName, PillarResult>;

  // Dynamic re-weighting: redistribute null-pillar weights proportionally
  const activePillars = pillarEntries.filter(([_, r]) => r.score !== null);
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
    pillarEntries.flatMap(([_, r]) => [r.primarySource, ...r.fallbacksUsed])
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

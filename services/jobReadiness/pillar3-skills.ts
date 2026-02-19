import type { PillarResult, ReadinessInput, Signal } from './types';

/**
 * Pillar 3: Skill Diversification (15%)
 *
 * Detects new tech adoption — candidates learning new languages/frameworks
 * are in growth mode, often preparing for a role change.
 *
 * Key signals:
 * - New languages appearing in recent repos vs older repos
 * - Topic/framework diversity increasing over time
 * - First-time language usage
 *
 * Fallback: GitHub repos/languages → LinkedIn skills → null
 */
export async function computeSkillDiversification(
  input: ReadinessInput
): Promise<PillarResult> {
  const signals: Signal[] = [];

  if (!input.githubRepos || input.githubRepos.length === 0) {
    // Fallback: LinkedIn skills
    if (input.linkedinProfile?.skills && input.linkedinProfile.skills.length > 0) {
      return computeFromLinkedIn(input);
    }
    return {
      pillar: 'skillDiversification',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  const now = Date.now();
  const repos = input.githubRepos;
  const sixMonthsMs = 180 * 86400000;

  // Split repos into recent (last 6 months) and older
  const recentRepos = repos.filter(r => now - new Date(r.pushed_at).getTime() < sixMonthsMs);
  const olderRepos = repos.filter(r => now - new Date(r.pushed_at).getTime() >= sixMonthsMs);

  // Signal 1: New languages in recent repos
  const olderLanguages = new Set(
    olderRepos.map(r => r.language).filter((l): l is string => l !== null)
  );
  const recentLanguages = new Set(
    recentRepos.map(r => r.language).filter((l): l is string => l !== null)
  );
  const newLanguages = [...recentLanguages].filter(l => !olderLanguages.has(l));

  const newLangNormalized = Math.min(100, (newLanguages.length / 3) * 100);
  signals.push({
    name: 'new_languages',
    value: newLanguages.length,
    normalizedValue: newLangNormalized,
    source: 'github',
    confidence: olderRepos.length > 0 ? 0.8 : 0.4,
    detail: newLanguages.length > 0
      ? `New languages: ${newLanguages.join(', ')}`
      : 'No new languages detected',
  });

  // Signal 2: Language diversity trend
  const totalLanguages = new Set(
    repos.map(r => r.language).filter((l): l is string => l !== null)
  );
  const diversityNormalized = Math.min(100, (totalLanguages.size / 8) * 100);
  signals.push({
    name: 'language_diversity',
    value: totalLanguages.size,
    normalizedValue: diversityNormalized,
    source: 'github',
    confidence: 0.6,
    detail: `${totalLanguages.size} unique languages across all repos`,
  });

  // Signal 3: Topic expansion (new topics in recent repos)
  const olderTopics = new Set(olderRepos.flatMap(r => r.topics));
  const recentTopics = new Set(recentRepos.flatMap(r => r.topics));
  const newTopics = [...recentTopics].filter(t => !olderTopics.has(t));

  if (recentTopics.size > 0 || olderTopics.size > 0) {
    const topicNormalized = Math.min(100, (newTopics.length / 5) * 100);
    signals.push({
      name: 'topic_expansion',
      value: newTopics.length,
      normalizedValue: topicNormalized,
      source: 'github',
      confidence: 0.5,
      detail: newTopics.length > 0
        ? `New topics: ${newTopics.slice(0, 5).join(', ')}`
        : 'No new topics detected',
    });
  }

  // Signal 4: Recent repo creation rate (creating new projects = exploring)
  const threeMonthsMs = 90 * 86400000;
  const recentCreations = repos.filter(
    r => !r.fork && now - new Date(r.created_at).getTime() < threeMonthsMs
  );
  const creationNormalized = Math.min(100, (recentCreations.length / 5) * 100);
  signals.push({
    name: 'recent_repo_creation',
    value: recentCreations.length,
    normalizedValue: creationNormalized,
    source: 'github',
    confidence: 0.65,
    detail: `${recentCreations.length} new repos created in last 90 days`,
  });

  const score = aggregateSignals(signals);

  return {
    pillar: 'skillDiversification',
    score,
    confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length,
    signals,
    primarySource: 'github',
    fallbacksUsed: [],
  };
}

function computeFromLinkedIn(input: ReadinessInput): PillarResult {
  const skills = input.linkedinProfile!.skills!;
  const diversityNormalized = Math.min(100, (skills.length / 15) * 100);

  return {
    pillar: 'skillDiversification',
    score: Math.round(diversityNormalized * 0.5), // lower score from LinkedIn-only
    confidence: 0.3,
    signals: [{
      name: 'linkedin_skill_count',
      value: skills.length,
      normalizedValue: diversityNormalized,
      source: 'linkedin',
      confidence: 0.3,
      detail: `${skills.length} skills listed on LinkedIn`,
    }],
    primarySource: 'linkedin',
    fallbacksUsed: [],
  };
}

function aggregateSignals(signals: Signal[]): number {
  if (signals.length === 0) return 0;
  const weightedSum = signals.reduce(
    (sum, s) => sum + s.normalizedValue * s.confidence,
    0
  );
  const weightSum = signals.reduce((sum, s) => sum + s.confidence, 0);
  return Math.min(100, Math.round(weightedSum / weightSum));
}

import type { PillarResult, ReadinessInput, Signal } from './types';

/**
 * Pillar 1: Network Intelligence (25%)
 *
 * Detects if the candidate is "orbiting" new companies:
 * - Starring/forking repos from specific orgs
 * - High following:followers ratio (exploring new connections)
 * - Engaging with repos outside their current employer's org
 * - Fork diversity (forking from many different orgs = exploring)
 *
 * Fallback chain: GitHub stars/follows → GitHub events → null
 */
export async function computeNetworkIntelligence(
  input: ReadinessInput
): Promise<PillarResult> {
  const signals: Signal[] = [];

  if (!input.githubProfile && !input.githubEvents) {
    return {
      pillar: 'networkIntelligence',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  // Signal 1: Following-to-Followers ratio
  // High ratio = actively seeking new connections (exploring the market)
  if (input.githubProfile) {
    const { following, followers } = input.githubProfile;
    const ratio = followers > 0 ? following / followers : following;
    // Normalize: ratio > 3 is high exploration, > 10 is very high
    const normalized = Math.min(100, (ratio / 10) * 100);
    signals.push({
      name: 'following_ratio',
      value: ratio,
      normalizedValue: normalized,
      source: 'github',
      confidence: 0.6,
      detail: `Following ${following}, Followers ${followers} (ratio: ${ratio.toFixed(1)})`,
    });
  }

  // Signal 2: Cross-org engagement (stars/forks outside current employer)
  if (input.githubEvents && input.githubEvents.length > 0) {
    const currentCompany = (input.currentCompany || input.githubProfile?.company || '').toLowerCase();
    const engagementEvents = input.githubEvents.filter(
      e => e.type === 'WatchEvent' || e.type === 'ForkEvent'
    );

    // Count unique orgs engaged with
    const orgsEngaged = new Set(
      engagementEvents
        .map(e => e.repo.name.split('/')[0].toLowerCase())
        .filter(org => org !== input.githubUsername?.toLowerCase() && org !== currentCompany)
    );

    const orgDiversity = orgsEngaged.size;
    const diversityNormalized = Math.min(100, (orgDiversity / 10) * 100);

    signals.push({
      name: 'org_diversity',
      value: orgDiversity,
      normalizedValue: diversityNormalized,
      source: 'github',
      confidence: 0.7,
      detail: `Engaged with ${orgDiversity} unique external orgs`,
    });

    // Signal 3: Recent engagement volume (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEngagements = engagementEvents.filter(
      e => new Date(e.created_at) > thirtyDaysAgo
    );
    const recentNormalized = Math.min(100, (recentEngagements.length / 20) * 100);

    signals.push({
      name: 'recent_engagement_volume',
      value: recentEngagements.length,
      normalizedValue: recentNormalized,
      source: 'github',
      confidence: 0.8,
      detail: `${recentEngagements.length} star/fork events in last 30 days`,
    });
  }

  // Signal 4: Fork activity (forking = deep exploration, stronger than starring)
  if (input.githubRepos) {
    const recentForks = input.githubRepos.filter(r => {
      if (!r.fork) return false;
      const age = Date.now() - new Date(r.pushed_at).getTime();
      return age < 90 * 86400000;
    });

    const forkNormalized = Math.min(100, (recentForks.length / 5) * 100);
    signals.push({
      name: 'recent_forks',
      value: recentForks.length,
      normalizedValue: forkNormalized,
      source: 'github',
      confidence: 0.75,
      detail: `${recentForks.length} repos forked in last 90 days`,
    });
  }

  const score = aggregateSignals(signals);

  return {
    pillar: 'networkIntelligence',
    score,
    confidence: signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0,
    signals,
    primarySource: 'github',
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

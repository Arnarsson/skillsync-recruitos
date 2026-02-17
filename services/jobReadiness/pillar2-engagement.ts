import type { PillarResult, ReadinessInput, Signal } from './types';

/**
 * Pillar 2: Engagement Decay (20%)
 *
 * Detects "activity cliffs" — sudden drops in contribution frequency
 * that often signal interview prep, burnout, or impending job change.
 *
 * Key signals:
 * - Activity cliff: significant drop between time periods
 * - Event type narrowing: used to do PRs+issues, now only commits
 * - Decay pattern: sudden vs gradual
 *
 * Fallback: GitHub events → GitHub repos pushed_at → null
 */
export async function computeEngagementDecay(
  input: ReadinessInput
): Promise<PillarResult> {
  const signals: Signal[] = [];

  if (!input.githubEvents || input.githubEvents.length === 0) {
    if (input.githubRepos && input.githubRepos.length > 0) {
      return computeFromRepos(input);
    }
    return {
      pillar: 'engagementDecay',
      score: null,
      confidence: 0,
      signals: [],
      primarySource: 'github',
      fallbacksUsed: [],
    };
  }

  const now = Date.now();
  const events = input.githubEvents;

  // Bucket events into 30-day periods
  const periods = [
    { label: 'last_30d', min: 0, max: 30 },
    { label: '30_60d', min: 30, max: 60 },
    { label: '60_90d', min: 60, max: 90 },
  ];

  const buckets = periods.map(p => {
    const minMs = p.min * 86400000;
    const maxMs = p.max * 86400000;
    return {
      ...p,
      events: events.filter(e => {
        const age = now - new Date(e.created_at).getTime();
        return age >= minMs && age < maxMs;
      }),
    };
  });

  const [recent, mid, old] = buckets;
  const recentCount = recent.events.length;
  const midCount = mid.events.length;
  const oldCount = old.events.length;

  // Signal 1: Activity cliff detection
  if (oldCount > 0 || recentCount > 0) {
    let cliffScore: number;
    if (oldCount === 0 && recentCount === 0) {
      cliffScore = 0;
    } else if (oldCount > 0 && recentCount === 0) {
      cliffScore = 100;
    } else if (oldCount === 0) {
      cliffScore = 0;
    } else {
      const decayRatio = 1 - (recentCount / oldCount);
      cliffScore = Math.max(0, Math.min(100, decayRatio * 100));
    }

    signals.push({
      name: 'activity_cliff',
      value: cliffScore,
      normalizedValue: cliffScore,
      source: 'github',
      confidence: Math.min(0.9, (oldCount + recentCount) / 20),
      detail: `Recent: ${recentCount} events, Older: ${oldCount} events (decay: ${cliffScore.toFixed(0)}%)`,
    });
  }

  // Signal 2: Decay pattern (sudden vs gradual)
  if (oldCount > 0) {
    const isGradual = midCount > 0 && midCount < oldCount && midCount > recentCount;
    const isSudden = midCount >= oldCount * 0.8 && recentCount < oldCount * 0.2;
    const trendScore = isSudden ? 80 : isGradual ? 50 : 20;

    signals.push({
      name: 'decay_pattern',
      value: trendScore,
      normalizedValue: trendScore,
      source: 'github',
      confidence: 0.6,
      detail: isSudden ? 'Sudden activity cliff' : isGradual ? 'Gradual decline' : 'Stable or increasing',
    });
  }

  // Signal 3: Event type diversity change
  const oldTypes = new Set(old.events.map(e => e.type));
  const recentTypes = new Set(recent.events.map(e => e.type));
  const typeDiversityDrop = Math.max(0, oldTypes.size - recentTypes.size);
  const diversityNormalized = Math.min(100, (typeDiversityDrop / 3) * 100);

  signals.push({
    name: 'event_type_diversity',
    value: typeDiversityDrop,
    normalizedValue: diversityNormalized,
    source: 'github',
    confidence: 0.5,
    detail: `Event types dropped from ${oldTypes.size} to ${recentTypes.size}`,
  });

  const score = aggregateSignals(signals);

  return {
    pillar: 'engagementDecay',
    score,
    confidence: signals.reduce((sum, s) => sum + s.confidence, 0) / Math.max(1, signals.length),
    signals,
    primarySource: 'github',
    fallbacksUsed: [],
  };
}

function computeFromRepos(input: ReadinessInput): PillarResult {
  const repos = input.githubRepos!;
  const now = Date.now();

  const recentPushes = repos.filter(r => {
    const age = now - new Date(r.pushed_at).getTime();
    return age < 30 * 86400000;
  }).length;

  const olderPushes = repos.filter(r => {
    const age = now - new Date(r.pushed_at).getTime();
    return age >= 60 * 86400000 && age < 90 * 86400000;
  }).length;

  const decayScore = olderPushes > 0 && recentPushes === 0
    ? 70
    : olderPushes > recentPushes
      ? 40
      : 10;

  return {
    pillar: 'engagementDecay',
    score: decayScore,
    confidence: 0.4,
    signals: [{
      name: 'repo_push_decay',
      value: decayScore,
      normalizedValue: decayScore,
      source: 'github',
      confidence: 0.4,
      detail: `Recent repos pushed: ${recentPushes}, Older: ${olderPushes}`,
    }],
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

# Job Readiness Engine - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an adaptive multi-source scoring system that complements the existing alignment score by answering "Is this person likely receptive to outreach right now?" via 7 weighted signal pillars with fallback data sources.

**Architecture:** Modular pillar-based engine under `services/jobReadiness/`. Each pillar is an independent pure-ish async function that takes candidate data + external fetchers and returns a normalized 0-100 score with confidence. An orchestrator aggregates pillar scores using configurable weights. Results stored as JSON on the Candidate model and exposed via API route + UI component.

**Tech Stack:** TypeScript, Vitest (unit + integration), Prisma (schema), Next.js API routes, GitHub REST API (Octokit), OpenRouter LLM (sentiment), Zod (validation)

---

## Architecture Overview

```
services/jobReadiness/
  types.ts           # Shared types, interfaces, weight config
  engine.ts          # Orchestrator: runs pillars, aggregates scores
  pillar1-network.ts        # Network Intelligence (25%)
  pillar2-engagement.ts     # Engagement Decay (20%)
  pillar3-skills.ts         # Skill Diversification (15%)
  pillar4-company.ts        # Company Health (15%)
  pillar5-tenure.ts         # Tenure Risk (10%)
  pillar6-profile.ts        # Profile Optimization (10%)
  pillar7-sentiment.ts      # Sentiment Shift (5%)
  index.ts           # Public API re-exports

tests/services/jobReadiness/
  types.test.ts
  engine.test.ts
  pillar1-network.test.ts
  pillar2-engagement.test.ts
  pillar3-skills.test.ts
  pillar4-company.test.ts
  pillar5-tenure.test.ts
  pillar6-profile.test.ts
  pillar7-sentiment.test.ts
  integration.test.ts

app/api/candidates/[id]/readiness/
  route.ts           # GET endpoint to compute/fetch readiness

components/
  JobReadinessScore.tsx  # UI badge + breakdown display
```

### Design Principles

1. **Each pillar is a pure function** with injected dependencies (fetchers) for testability
2. **Graceful degradation**: If a data source fails, the pillar returns `score: null, confidence: 0` and the engine re-weights remaining pillars
3. **No side effects in pillars**: All external I/O happens through injected fetcher functions
4. **DRY weight config**: Single source of truth in `types.ts`
5. **Consistent pillar interface**: Every pillar returns `PillarResult` with `score`, `confidence`, `signals`, `dataSource`

---

## Task 1: Foundation Types & Interfaces

**Files:**
- Create: `services/jobReadiness/types.ts`
- Test: `tests/services/jobReadiness/types.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/services/jobReadiness/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  PILLAR_WEIGHTS,
  type PillarResult,
  type ReadinessScore,
  type PillarName,
} from '../../services/jobReadiness/types';

describe('jobReadiness/types', () => {
  it('pillar weights sum to 1.0', () => {
    const sum = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('has all 7 pillars defined', () => {
    expect(Object.keys(PILLAR_WEIGHTS)).toHaveLength(7);
  });

  it('all weights are between 0 and 1', () => {
    for (const [name, weight] of Object.entries(PILLAR_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/jobReadiness/types.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// services/jobReadiness/types.ts

// ===== PILLAR NAMES =====
export const PILLAR_NAMES = [
  'networkIntelligence',
  'engagementDecay',
  'skillDiversification',
  'companyHealth',
  'tenureRisk',
  'profileOptimization',
  'sentimentShift',
] as const;

export type PillarName = (typeof PILLAR_NAMES)[number];

// ===== WEIGHTS (must sum to 1.0) =====
export const PILLAR_WEIGHTS: Record<PillarName, number> = {
  networkIntelligence: 0.25,
  engagementDecay: 0.20,
  skillDiversification: 0.15,
  companyHealth: 0.15,
  tenureRisk: 0.10,
  profileOptimization: 0.10,
  sentimentShift: 0.05,
};

// ===== DATA SOURCE TYPES =====
export type DataSource =
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'serp'
  | 'news_api'
  | 'layoffs_fyi'
  | 'glassdoor'
  | 'blog'
  | 'stackoverflow'
  | 'personal_website'
  | 'llm_inference';

// ===== SIGNAL: individual observation within a pillar =====
export interface Signal {
  name: string;          // e.g. "target_company_stars"
  value: number;         // raw value
  normalizedValue: number; // 0-100
  source: DataSource;
  confidence: number;    // 0-1
  detail?: string;       // human-readable explanation
}

// ===== PILLAR RESULT =====
export interface PillarResult {
  pillar: PillarName;
  score: number | null;     // 0-100, null if no data
  confidence: number;       // 0-1, how much data we had
  signals: Signal[];        // individual observations
  primarySource: DataSource;
  fallbacksUsed: DataSource[];
  error?: string;           // if computation failed
}

// ===== AGGREGATE READINESS SCORE =====
export interface ReadinessScore {
  overall: number;              // 0-100 weighted aggregate
  confidence: number;           // 0-1 overall data quality
  level: 'cold' | 'warming' | 'warm' | 'hot'; // bucketed label
  pillars: Record<PillarName, PillarResult>;
  computedAt: string;           // ISO timestamp
  candidateId: string;
  dataSourcesSummary: DataSource[];  // all sources used
}

// ===== READINESS LEVEL THRESHOLDS =====
export const READINESS_LEVELS = {
  hot:     { min: 75, label: 'Hot - Likely receptive now' },
  warm:    { min: 50, label: 'Warm - Some positive signals' },
  warming: { min: 25, label: 'Warming - Early indicators' },
  cold:    { min: 0,  label: 'Cold - No strong signals' },
} as const;

export function getReadinessLevel(score: number): ReadinessScore['level'] {
  if (score >= READINESS_LEVELS.hot.min) return 'hot';
  if (score >= READINESS_LEVELS.warm.min) return 'warm';
  if (score >= READINESS_LEVELS.warming.min) return 'warming';
  return 'cold';
}

// ===== CANDIDATE INPUT (what each pillar receives) =====
export interface ReadinessInput {
  candidateId: string;
  githubUsername?: string;
  linkedinUrl?: string;
  currentCompany?: string;
  currentRole?: string;
  yearsAtCompany?: number;
  skills?: string[];
  location?: string;
  // GitHub data (pre-fetched to avoid duplicate API calls)
  githubProfile?: {
    login: string;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    bio: string | null;
    company: string | null;
  };
  githubRepos?: Array<{
    name: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    pushed_at: string;
    created_at: string;
    topics: string[];
    fork: boolean;
  }>;
  githubEvents?: Array<{
    type: string;
    created_at: string;
    repo: { name: string };
  }>;
  // LinkedIn data (if available)
  linkedinProfile?: {
    headline?: string;
    experience?: Array<{
      title: string;
      company: string;
      startDate?: string;
      endDate?: string;
      current?: boolean;
    }>;
    skills?: string[];
    posts?: Array<{
      text: string;
      date: string;
      reactions: number;
    }>;
  };
}

// ===== FETCHER INTERFACES (dependency injection for testing) =====
export interface ExternalFetchers {
  fetchGitHubProfile?: (username: string) => Promise<ReadinessInput['githubProfile'] | null>;
  fetchGitHubRepos?: (username: string) => Promise<NonNullable<ReadinessInput['githubRepos']>>;
  fetchGitHubEvents?: (username: string) => Promise<NonNullable<ReadinessInput['githubEvents']>>;
  fetchLinkedInProfile?: (url: string) => Promise<ReadinessInput['linkedinProfile'] | null>;
  fetchCompanyNews?: (company: string) => Promise<Array<{ title: string; date: string; sentiment: number }> | null>;
  fetchLayoffsData?: (company: string) => Promise<{ hasLayoffs: boolean; date?: string; count?: number } | null>;
  analyzeSentiment?: (texts: string[]) => Promise<Array<{ text: string; sentiment: number; confidence: number }> | null>;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/jobReadiness/types.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add services/jobReadiness/types.ts tests/services/jobReadiness/types.test.ts
git commit -m "feat(readiness): add foundation types and weight config"
```

---

## Task 2: Pillar 1 - Network Intelligence (25%)

Detects if the candidate is orbiting target companies (starring repos, following employees, engaging with their OSS).

**Files:**
- Create: `services/jobReadiness/pillar1-network.ts`
- Test: `tests/services/jobReadiness/pillar1-network.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/services/jobReadiness/pillar1-network.test.ts
import { describe, it, expect, vi } from 'vitest';
import { computeNetworkIntelligence } from '../../services/jobReadiness/pillar1-network';
import type { ReadinessInput } from '../../services/jobReadiness/types';

const baseInput: ReadinessInput = {
  candidateId: 'test-1',
  githubUsername: 'testuser',
  githubProfile: {
    login: 'testuser',
    public_repos: 30,
    followers: 50,
    following: 100,
    created_at: '2020-01-01T00:00:00Z',
    bio: 'Software engineer',
    company: 'CurrentCo',
  },
  githubRepos: [],
  githubEvents: [],
};

describe('pillar1-network: computeNetworkIntelligence', () => {
  it('returns null score when no GitHub data available', async () => {
    const result = await computeNetworkIntelligence({
      candidateId: 'test-1',
    });
    expect(result.pillar).toBe('networkIntelligence');
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects target company repo starring', async () => {
    const input: ReadinessInput = {
      ...baseInput,
      githubRepos: [
        {
          name: 'target-oss',
          language: 'TypeScript',
          stargazers_count: 1000,
          forks_count: 200,
          pushed_at: new Date().toISOString(),
          created_at: '2024-01-01T00:00:00Z',
          topics: [],
          fork: true, // forked from target company
        },
      ],
      githubEvents: [
        {
          type: 'WatchEvent', // starring
          created_at: new Date().toISOString(),
          repo: { name: 'target-company/their-repo' },
        },
        {
          type: 'ForkEvent',
          created_at: new Date().toISOString(),
          repo: { name: 'target-company/another-repo' },
        },
      ],
    };
    const result = await computeNetworkIntelligence(input);
    expect(result.score).toBeGreaterThan(0);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('scores higher with more target company engagement', async () => {
    const lowEngagement: ReadinessInput = {
      ...baseInput,
      githubEvents: [
        { type: 'WatchEvent', created_at: new Date().toISOString(), repo: { name: 'random/repo' } },
      ],
    };
    const highEngagement: ReadinessInput = {
      ...baseInput,
      githubEvents: Array(10).fill(null).map((_, i) => ({
        type: i % 2 === 0 ? 'WatchEvent' : 'ForkEvent',
        created_at: new Date().toISOString(),
        repo: { name: `company-${i % 3}/repo-${i}` },
      })),
    };
    const low = await computeNetworkIntelligence(lowEngagement);
    const high = await computeNetworkIntelligence(highEngagement);
    expect(high.score!).toBeGreaterThanOrEqual(low.score!);
  });

  it('detects high following-to-followers ratio as exploration signal', async () => {
    const explorer: ReadinessInput = {
      ...baseInput,
      githubProfile: {
        ...baseInput.githubProfile!,
        following: 500,
        followers: 20,
      },
    };
    const result = await computeNetworkIntelligence(explorer);
    const followSignal = result.signals.find(s => s.name === 'following_ratio');
    expect(followSignal).toBeDefined();
    expect(followSignal!.normalizedValue).toBeGreaterThan(50);
  });

  it('caps score at 100', async () => {
    const maxInput: ReadinessInput = {
      ...baseInput,
      githubProfile: { ...baseInput.githubProfile!, following: 10000, followers: 1 },
      githubEvents: Array(100).fill(null).map((_, i) => ({
        type: 'ForkEvent',
        created_at: new Date().toISOString(),
        repo: { name: `company-${i}/repo-${i}` },
      })),
    };
    const result = await computeNetworkIntelligence(maxInput);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/jobReadiness/pillar1-network.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// services/jobReadiness/pillar1-network.ts
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
  const fallbacksUsed: string[] = [];

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
    // Normalize: 5+ unique orgs = strong signal, 10+ = very strong
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
    const forks = input.githubRepos.filter(r => r.fork);
    const recentForks = forks.filter(r => {
      const pushed = new Date(r.pushed_at);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return pushed > ninetyDaysAgo;
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

  // Aggregate: weighted average of signals
  const score = aggregateSignals(signals);

  return {
    pillar: 'networkIntelligence',
    score,
    confidence: signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0,
    signals,
    primarySource: 'github',
    fallbacksUsed: fallbacksUsed as any[],
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/jobReadiness/pillar1-network.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add services/jobReadiness/pillar1-network.ts tests/services/jobReadiness/pillar1-network.test.ts
git commit -m "feat(readiness): add Pillar 1 - Network Intelligence scoring"
```

---

## Task 3: Pillar 2 - Engagement Decay (20%)

Detects "activity cliffs" — sudden drops in contribution frequency that signal career transition.

**Files:**
- Create: `services/jobReadiness/pillar2-engagement.ts`
- Test: `tests/services/jobReadiness/pillar2-engagement.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/services/jobReadiness/pillar2-engagement.test.ts
import { describe, it, expect } from 'vitest';
import { computeEngagementDecay } from '../../services/jobReadiness/pillar2-engagement';
import type { ReadinessInput } from '../../services/jobReadiness/types';

function makeEvents(daysAgo: number[], type = 'PushEvent') {
  return daysAgo.map(d => ({
    type,
    created_at: new Date(Date.now() - d * 86400000).toISOString(),
    repo: { name: 'user/repo' },
  }));
}

describe('pillar2-engagement: computeEngagementDecay', () => {
  it('returns null score when no events available', async () => {
    const result = await computeEngagementDecay({ candidateId: 'test-1' });
    expect(result.score).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('detects activity cliff (high activity then silence)', async () => {
    // Active 60-90 days ago, silent last 30 days
    const events = [
      ...makeEvents([60, 62, 65, 68, 70, 72, 75, 78, 80, 85]),
      // nothing in last 30 days
    ];
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: events,
    });
    expect(result.score).toBeGreaterThan(50);
    const cliffSignal = result.signals.find(s => s.name === 'activity_cliff');
    expect(cliffSignal).toBeDefined();
  });

  it('scores low for steady consistent activity', async () => {
    // Consistent activity across all time periods
    const events = makeEvents([1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]);
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: events,
    });
    expect(result.score).toBeLessThan(30);
  });

  it('scores high when recent activity drops significantly', async () => {
    // Very active 60-90 days ago, barely active last 30
    const oldActivity = makeEvents([61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75]);
    const recentActivity = makeEvents([5]); // just one event
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: [...oldActivity, ...recentActivity],
    });
    expect(result.score).toBeGreaterThan(60);
  });

  it('considers event type variety in decay detection', async () => {
    const diverseOld = [
      ...makeEvents([70, 72, 74], 'PushEvent'),
      ...makeEvents([71, 73, 75], 'PullRequestEvent'),
      ...makeEvents([76, 77], 'IssuesEvent'),
    ];
    const result = await computeEngagementDecay({
      candidateId: 'test-1',
      githubEvents: diverseOld,
    });
    expect(result.signals.find(s => s.name === 'event_type_diversity')).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/jobReadiness/pillar2-engagement.test.ts`

**Step 3: Write implementation**

```typescript
// services/jobReadiness/pillar2-engagement.ts
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
 * - Weekend/evening shift: coding moving to personal time
 *
 * Fallback: GitHub events → GitHub repos pushed_at → null
 */
export async function computeEngagementDecay(
  input: ReadinessInput
): Promise<PillarResult> {
  const signals: Signal[] = [];

  if (!input.githubEvents || input.githubEvents.length === 0) {
    // Fallback: check repo pushed_at dates
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

  // Signal 1: Activity cliff detection
  // Compare recent (0-30d) vs older (60-90d) activity
  const recentCount = recent.events.length;
  const oldCount = old.events.length;

  if (oldCount > 0 || recentCount > 0) {
    // Decay ratio: how much activity dropped
    // High ratio = activity dropped = candidate may be transitioning
    let cliffScore: number;
    if (oldCount === 0 && recentCount === 0) {
      cliffScore = 0;
    } else if (oldCount > 0 && recentCount === 0) {
      cliffScore = 100; // complete silence after activity
    } else if (oldCount === 0) {
      cliffScore = 0; // new activity, no cliff
    } else {
      const decayRatio = 1 - (recentCount / oldCount);
      cliffScore = Math.max(0, Math.min(100, decayRatio * 100));
    }

    signals.push({
      name: 'activity_cliff',
      value: cliffScore,
      normalizedValue: cliffScore,
      source: 'github',
      confidence: Math.min(0.9, (oldCount + recentCount) / 20), // more data = higher confidence
      detail: `Recent: ${recentCount} events, Older: ${oldCount} events (decay: ${cliffScore.toFixed(0)}%)`,
    });
  }

  // Signal 2: Mid-period trend (is decay gradual or sudden?)
  const midCount = mid.events.length;
  if (oldCount > 0 && midCount >= 0) {
    const isGradual = midCount > 0 && midCount < oldCount && midCount > recentCount;
    const isSudden = midCount >= oldCount * 0.8 && recentCount < oldCount * 0.2;
    // Sudden cliff is a stronger signal than gradual decline
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

  // Check if repos have recent pushes
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
    confidence: 0.4, // lower confidence from repo data alone
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
```

**Step 4: Run tests, Step 5: Commit**

Same pattern as Task 2.

---

## Task 4: Pillar 3 - Skill Diversification (15%)

Detects new tech adoption — candidates learning new languages/frameworks = growth mode.

**Files:**
- Create: `services/jobReadiness/pillar3-skills.ts`
- Test: `tests/services/jobReadiness/pillar3-skills.test.ts`

**Key signals:**
- New languages appearing in recent repos vs older repos
- Topic/framework diversity increasing over time
- First-time language usage (repo created with a language never used before)

**Test cases:**
1. No repos → null score
2. All repos same language → low score
3. Recent repos with new languages → high score
4. Gradual language expansion → moderate score
5. Score capped at 100

---

## Task 5: Pillar 4 - Company Health (15%)

Detects employer flight risk from external signals.

**Files:**
- Create: `services/jobReadiness/pillar4-company.ts`
- Test: `tests/services/jobReadiness/pillar4-company.test.ts`

**Key signals:**
- Company name matched against known layoff data (via fetcher)
- News sentiment about employer (via fetcher)
- Fallback: GitHub org membership changes, company field changes

**Test cases:**
1. No company info → null score
2. Company with recent layoffs → high score
3. Company with negative news → moderate score
4. Healthy company → low score
5. All fetchers fail → graceful degradation to null

---

## Task 6: Pillar 5 - Tenure Risk (10%)

Career stage analysis — 2-3 years at current company = peak job-change probability.

**Files:**
- Create: `services/jobReadiness/pillar5-tenure.ts`
- Test: `tests/services/jobReadiness/pillar5-tenure.test.ts`

**Key signals:**
- Years at current company (bell curve: peak at 2-3 years)
- Career stage (mid-level more mobile than senior/junior)
- Historical tenure pattern from LinkedIn (if available)

**Test cases:**
1. No tenure data → null score
2. 2.5 years at company → high score (peak mobility)
3. 6 months → low score (too new)
4. 8 years → low score (settled)
5. Senior with 3 years → moderate (adjusted by seniority)

---

## Task 7: Pillar 6 - Profile Optimization (10%)

Detects "resume polishing" behavior — updating profiles = job seeking.

**Files:**
- Create: `services/jobReadiness/pillar6-profile.ts`
- Test: `tests/services/jobReadiness/pillar6-profile.test.ts`

**Key signals:**
- GitHub profile README recently updated
- Bio recently changed (compared to cached version)
- Personal website/blog updates (via repo push dates)
- Profile completeness improvements

**Test cases:**
1. No profile data → null score
2. README repo recently pushed → high score
3. Bio contains job-seeking keywords → high score
4. Stale profile → low score
5. Multiple optimization signals compound

---

## Task 8: Pillar 7 - Sentiment Shift (5%)

NLP-based tone analysis of recent public writing.

**Files:**
- Create: `services/jobReadiness/pillar7-sentiment.ts`
- Test: `tests/services/jobReadiness/pillar7-sentiment.test.ts`

**Key signals:**
- GitHub commit messages trending negative/frustrated
- LinkedIn posts (if available) with career-transition language
- LLM inference via OpenRouter for nuanced analysis

**Test cases:**
1. No text data → null score
2. Frustrated commit messages → high score
3. Positive/neutral messages → low score
4. LLM fetcher failure → graceful degradation
5. Mixed signals → moderate with lower confidence

---

## Task 9: Engine Orchestrator

Aggregates all pillar results with dynamic re-weighting.

**Files:**
- Create: `services/jobReadiness/engine.ts`
- Create: `services/jobReadiness/index.ts`
- Test: `tests/services/jobReadiness/engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/services/jobReadiness/engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { computeReadinessScore } from '../../services/jobReadiness/engine';
import type { ReadinessInput, PillarResult } from '../../services/jobReadiness/types';

describe('engine: computeReadinessScore', () => {
  it('returns overall score aggregated from all pillars', async () => {
    const result = await computeReadinessScore({
      candidateId: 'test-1',
      githubUsername: 'testuser',
      githubProfile: {
        login: 'testuser',
        public_repos: 30,
        followers: 50,
        following: 200,
        created_at: '2020-01-01T00:00:00Z',
        bio: 'Looking for new opportunities',
        company: 'CurrentCo',
      },
      githubRepos: [],
      githubEvents: [],
    });

    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.pillars).toBeDefined();
    expect(Object.keys(result.pillars)).toHaveLength(7);
    expect(result.level).toMatch(/^(cold|warming|warm|hot)$/);
    expect(result.computedAt).toBeDefined();
  });

  it('re-weights when pillars return null', async () => {
    // With minimal data, some pillars will be null
    // Engine should re-weight remaining pillars to still sum to 1.0
    const result = await computeReadinessScore({
      candidateId: 'test-1',
    });

    // With no data at all, should still return valid structure
    expect(result.overall).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.level).toBe('cold');
  });

  it('all pillar results are present in output', async () => {
    const result = await computeReadinessScore({
      candidateId: 'test-1',
      githubUsername: 'test',
      githubEvents: [
        { type: 'PushEvent', created_at: new Date().toISOString(), repo: { name: 'test/repo' } },
      ],
    });

    const pillarNames = Object.keys(result.pillars);
    expect(pillarNames).toContain('networkIntelligence');
    expect(pillarNames).toContain('engagementDecay');
    expect(pillarNames).toContain('skillDiversification');
    expect(pillarNames).toContain('companyHealth');
    expect(pillarNames).toContain('tenureRisk');
    expect(pillarNames).toContain('profileOptimization');
    expect(pillarNames).toContain('sentimentShift');
  });

  it('returns correct readiness level based on score', async () => {
    // This is a unit test on the level mapping
    // We can't easily control the exact score, but we verify structure
    const result = await computeReadinessScore({ candidateId: 'test-1' });
    expect(['cold', 'warming', 'warm', 'hot']).toContain(result.level);
  });
});
```

**Step 3: Write implementation**

```typescript
// services/jobReadiness/engine.ts
import type {
  ReadinessScore,
  ReadinessInput,
  PillarResult,
  PillarName,
  PILLAR_WEIGHTS,
  ExternalFetchers,
} from './types';
import { PILLAR_NAMES, getReadinessLevel } from './types';
import { PILLAR_WEIGHTS as weights } from './types';
import { computeNetworkIntelligence } from './pillar1-network';
import { computeEngagementDecay } from './pillar2-engagement';
import { computeSkillDiversification } from './pillar3-skills';
import { computeCompanyHealth } from './pillar4-company';
import { computeTenureRisk } from './pillar5-tenure';
import { computeProfileOptimization } from './pillar6-profile';
import { computeSentimentShift } from './pillar7-sentiment';

const PILLAR_FUNCTIONS: Record<PillarName, (input: ReadinessInput, fetchers?: ExternalFetchers) => Promise<PillarResult>> = {
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
 * Runs all 7 pillars, handles null results with dynamic re-weighting.
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
        }] as const;
      }
    })
  );

  const pillars = Object.fromEntries(pillarEntries) as Record<PillarName, PillarResult>;

  // Dynamic re-weighting: redistribute null-pillar weights proportionally
  const activePillars = pillarEntries.filter(([_, r]) => r.score !== null);
  const totalActiveWeight = activePillars.reduce(
    (sum, [name]) => sum + weights[name],
    0
  );

  let overall = 0;
  let totalConfidence = 0;

  if (totalActiveWeight > 0) {
    for (const [name, result] of activePillars) {
      const reWeight = weights[name] / totalActiveWeight;
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
```

---

## Task 10: Prisma Schema + API Route

**Files:**
- Modify: `prisma/schema.prisma` (add `jobReadiness Json?` to Candidate)
- Create: `app/api/candidates/[id]/readiness/route.ts`
- Modify: `lib/validation/apiSchemas.ts` (add readiness field)
- Test: `tests/services/jobReadiness/integration.test.ts`

**Schema change:**
```prisma
// Add to Candidate model
jobReadiness     Json?     // ReadinessScore object
```

**API Route:**
```typescript
// app/api/candidates/[id]/readiness/route.ts
// GET - compute or return cached readiness score
// POST - force recompute
```

---

## Task 11: UI Component

**Files:**
- Create: `components/JobReadinessScore.tsx`
- Modify: `components/pipeline/CandidatePipelineItem.tsx` (add badge)
- Modify: `app/profile/[username]/page.tsx` (add score display)

**Component design:**
- Badge mode: colored pill showing level (Hot/Warm/Warming/Cold) with score
- Expanded mode: pillar breakdown with individual scores and confidence bars
- Uses existing shadcn/ui patterns (Card, Badge, Progress)

---

## Task 12: Integration Tests

**Files:**
- Create: `tests/services/jobReadiness/integration.test.ts`

**Test cases:**
1. Full pipeline: input → all pillars → aggregated score
2. Partial data: only GitHub data → appropriate pillars fire
3. All fetchers fail → graceful degradation, score = 0
4. Re-weight verification: null pillars don't affect total
5. Edge: empty candidate → valid structure returned

---

## Execution

Total: 12 tasks, ~80+ test cases across all pillars.

**Parallelization strategy for agent team:**
- **Wave 1** (foundation): Task 1 (types) — must complete first
- **Wave 2** (pillars, parallel): Tasks 2-8 (all 7 pillars) — independent of each other
- **Wave 3** (orchestration): Task 9 (engine) — depends on all pillars
- **Wave 4** (integration, parallel): Tasks 10-11 (API + UI) — depend on engine
- **Wave 5** (verification): Task 12 (integration tests) — depends on everything

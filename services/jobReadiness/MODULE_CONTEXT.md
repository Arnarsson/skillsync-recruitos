# Job Readiness Engine — Module Context

> Owner: services/jobReadiness/ | Public API: index.ts
> Purpose: Score how likely a candidate is to be receptive to outreach (0-100)

## What This Module Does

Computes a **Job Readiness Score** by analyzing 7 behavioral pillars from GitHub, LinkedIn, and web signals. Higher score = candidate is more likely open to new opportunities right now.

The engine runs all 7 pillars concurrently, handles null results via dynamic re-weighting (if a pillar has no data, its weight is redistributed proportionally), and returns a composite score with confidence and per-pillar breakdowns.

## Architecture

```
engine.ts              — orchestrator: runs pillars, aggregates scores
types.ts               — all interfaces: ReadinessInput, PillarResult, Signal, etc.
index.ts               — public API re-exports (this is the only import path)
fetchers.ts            — live API wiring (BrightData, Firecrawl, OpenRouter)
pillar1-network.ts     — following ratio, cross-org engagement, fork activity
pillar2-engagement.ts  — commit recency, push frequency, contribution decay
pillar3-skills.ts      — language diversification, new tech adoption, topic breadth
pillar4-company.ts     — company news, layoffs data, Glassdoor signals
pillar5-tenure.ts      — time at current company, role duration patterns
pillar6-profile.ts     — bio keywords ("open to work"), profile freshness, hireable flag
pillar7-sentiment.ts   — LinkedIn post sentiment, blog tone, public communication shift
```

## Pillar Weights (must sum to 1.0)

| Pillar | Weight | Primary Source |
|--------|--------|----------------|
| Network Intelligence | 25% | GitHub stars/follows/events |
| Engagement Decay | 20% | GitHub commits/pushes |
| Skill Diversification | 15% | GitHub repos/languages |
| Company Health | 15% | BrightData SERP, layoffs.fyi |
| Tenure Risk | 10% | LinkedIn experience timeline |
| Profile Optimization | 10% | GitHub/LinkedIn bio keywords |
| Sentiment Shift | 5% | OpenRouter LLM sentiment analysis |

## Reference Pattern (pillar1-network.ts)

Every pillar must follow this exact shape:

```typescript
export async function compute*Pillar*(input: ReadinessInput): Promise<PillarResult> {
  // 1. Early null return if no data
  if (!input.githubProfile) return { pillar: '...', score: null, ... };

  // 2. Build signals array
  const signals: Signal[] = [];
  signals.push({
    name: 'signal_name',
    value: rawValue,
    normalizedValue: Math.min(100, ...),  // always 0-100
    source: 'github',
    confidence: 0.7,  // 0-1
    detail: 'Human-readable explanation',
  });

  // 3. Aggregate by weighted confidence
  const score = aggregateSignals(signals);  // weighted avg, capped at 100

  // 4. Return PillarResult
  return { pillar: '...', score, confidence: avgConfidence, signals, ... };
}
```

## Key Types

```typescript
interface ReadinessInput {
  candidateId: string;
  githubUsername?: string;
  linkedinUrl?: string;
  currentCompany?: string;
  githubProfile?: { login, public_repos, followers, following, bio, company, ... };
  githubRepos?: Array<{ name, language, stargazers_count, pushed_at, fork, topics, ... }>;
  githubEvents?: Array<{ type, created_at, repo: { name } }>;
  linkedinProfile?: { headline, experience[], skills[], posts[] };
}

interface ExternalFetchers {  // dependency injection for testing
  fetchCompanyNews?: (company: string) => Promise<NewsArticle[] | null>;
  fetchLayoffsData?: (company: string) => Promise<LayoffsData | null>;
  analyzeSentiment?: (texts: string[]) => Promise<SentimentResult[] | null>;
}

interface ReadinessScore {
  overall: number;        // 0-100 weighted aggregate
  confidence: number;     // 0-1
  level: 'cold' | 'warming' | 'warm' | 'hot';
  pillars: Record<PillarName, PillarResult>;
  computedAt: string;
  candidateId: string;
}
```

## How to Use

```typescript
import { computeReadinessScore } from '@/services/jobReadiness';
import { createExternalFetchers } from '@/services/jobReadiness/fetchers';

const score = await computeReadinessScore(input, createExternalFetchers());
// score.overall = 72, score.level = 'warm'
```

For tests — pass mock fetchers or omit entirely (pillars gracefully return null):

```typescript
const score = await computeReadinessScore(input); // no fetchers = no external calls
```

## Consumers

- `app/api/candidates/[id]/readiness/route.ts` — API endpoint (canonical consumer)
- `services/unifiedEnrichment.ts` — background enrichment pipeline
- `components/JobReadinessScore.tsx` — UI display component
- `components/pipeline/CandidatePipelineItem.tsx` — inline readiness in pipeline

## Rules

- No shared state, no DB writes, no side effects inside pillars
- Every signal has `normalizedValue` (0-100) and `confidence` (0-1)
- `aggregateSignals()` = weighted average by confidence, not flat average
- `Math.min(100, ...)` normalization on all values
- Early `score: null` return if no data — never fake a score
- Fetchers are injected, never imported globally inside pillars

## Tests

```bash
npx vitest run tests/services/jobReadiness/
```

10 test files: engine, integration, types, and one per pillar.
Integration test runs all 7 pillars with fixed mock input and asserts score range.

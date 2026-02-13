# RecruitOS 10x Scaling Plan

> **Status**: Active — created 2026-02-07
> **Branch**: `claude/plan-app-scaling-H4X9I`
> **Baseline**: Codebase audit score 5.3/10 (MVP-stage with tech debt)

---

## Executive Summary

RecruitOS has strong domain logic (search intelligence, AI scoring, psychometric profiling) but is architecturally fragile. The 10x plan has two tracks running in parallel:

1. **Harden** — fix the foundation so new features don't collapse under load
2. **Ship** — build the 6 gap-analysis features on solid ground

**Timeline**: 8 weeks to production-grade 10x product
**New API cost**: €0/mo (all free tiers initially)

---

## Current Reality vs Gap Analysis

| Claim | Reality | Impact |
|-------|---------|--------|
| "Prisma + PostgreSQL" | Candidates live in `localStorage` only. No `Candidate` model in Prisma schema. | **Critical** — data loss on browser clear |
| "90% ready" (Analyzer) | AI pipeline uses `Promise.all()` — one failure crashes entire flow. No timeouts on BrightData polling. | **High** — unreliable in production |
| "Team collaboration" | Email invitations not implemented (`app/api/team/[teamId]/members/route.ts:320`). Returns mock data when Supabase unavailable. | **Medium** — team features are non-functional |
| "Outreach ready" | Messages generate but cannot be sent — no email integration. | **High** — value chain is broken |
| "Testing in place" | Vitest config renamed to `.bak`. No test scripts in package.json. Playwright configured but no CI integration. | **Critical** — no safety net |
| "8 APIs configured" | API keys read from `localStorage` first — XSS vulnerability. 154 unguarded `JSON.parse()` calls. | **High** — security risk |

---

## Phase 0: Foundation Hardening (Week 1)

> **Goal**: Make what exists actually reliable before building new features.

### 0.1 — Move Candidates to Database

**Why**: localStorage caps at ~5MB, blocks UI at 1000+ candidates, data lost on browser clear.

**Files to modify**:
- `prisma/schema.prisma` — Add `Candidate` model + `CandidateAnalysis` model
- `services/candidateService.ts` — Replace localStorage with Prisma queries
- `app/api/candidates/route.ts` — **NEW** — CRUD API for candidates
- `app/api/candidates/[id]/route.ts` — **NEW** — Single candidate operations

**Prisma schema additions**:
```prisma
model Candidate {
  id                String    @id @default(cuid())
  userId            String
  githubUsername    String
  name              String
  currentRole       String?
  company           String?
  location          String?
  yearsExperience   Int?
  avatar            String?
  sourceUrl         String?
  linkedinUrl       String?

  // Scoring
  alignmentScore    Float?
  scoreBreakdown    Json?
  scoreConfidence   String?

  // Analysis data (stored as JSON to match existing Candidate interface)
  persona           Json?
  personaV2         Json?
  deepAnalysis      String?
  companyMatch      Json?
  indicators        Json?
  interviewGuide    Json?
  networkDossier    Json?
  advancedProfile   Json?
  behavioralSignals Json?

  // Pipeline state
  pipelineStage     String    @default("sourced")
  unlockedSteps     Int[]     @default([])
  shortlistSummary  String?
  keyEvidence       String[]  @default([])
  risks             String[]  @default([])

  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([githubUsername])
  @@index([alignmentScore])
}
```

**Migration path**: Keep localStorage read as fallback during transition. New candidates go to DB. Add a one-time migration button in admin mode to push localStorage candidates to DB.

---

### 0.2 — Error Isolation in AI Pipeline

**Why**: `Promise.all()` means one failed API call kills all analysis. BrightData polling has no timeout.

**Files to modify**:
- `services/geminiService.ts`
  - Line ~39: `callOpenRouter()` — add per-request timeout (30s default)
  - Replace all `Promise.all()` with `Promise.allSettled()` in analysis flows
  - Add circuit breaker pattern for repeated failures
- `services/enrichmentServiceV2.ts`
  - Add `AbortController` timeout to BrightData polling (max 60s)
  - Add `Promise.allSettled()` for multi-source enrichment
- `services/behavioralSignalsService.ts`
  - Add timeout to BrightData activity scanning
  - Graceful degradation: return partial data instead of failing entirely
- `services/networkAnalysisService.ts`
  - Add exponential backoff for GitHub API 429 responses
  - Cap pagination at configurable limit (default 3 pages)

**Pattern to apply everywhere**:
```typescript
// BEFORE (fragile)
const [persona, score, profile] = await Promise.all([
  generatePersona(candidate),
  scoreAlignment(candidate),
  fetchProfile(candidate),
]);

// AFTER (resilient)
const results = await Promise.allSettled([
  withTimeout(generatePersona(candidate), 30_000),
  withTimeout(scoreAlignment(candidate), 30_000),
  withTimeout(fetchProfile(candidate), 30_000),
]);
const persona = results[0].status === 'fulfilled' ? results[0].value : null;
const score = results[1].status === 'fulfilled' ? results[1].value : null;
const profile = results[2].status === 'fulfilled' ? results[2].value : null;
```

---

### 0.3 — Re-enable Testing

**Why**: No automated safety net. Vitest config exists but is disabled.

**Files to modify**:
- `vitest.config.ts.bak` → rename to `vitest.config.ts`
- `package.json` — Add scripts:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```
- `package.json` devDependencies — Add:
  ```json
  "vitest": "^3.x",
  "@vitejs/plugin-react": "^4.x",
  "@vitest/coverage-v8": "^3.x"
  ```
- `.github/workflows/ci.yml` — Add test step before build

**Priority test files to fix/create**:
- `tests/services/candidateService.test.ts` — CRUD operations
- `tests/services/geminiService.test.ts` — Mock OpenRouter responses
- `tests/api/search.test.ts` — Search endpoint validation
- `tests/lib/search/*.test.ts` — Search intelligence (these likely work already)

---

### 0.4 — Server-Side API Key Proxy

**Why**: `geminiService.ts:23` reads API keys from `localStorage` — XSS can steal them.

**Files to modify**:
- `services/geminiService.ts` — Remove all `localStorage.getItem()` calls for API keys
- `app/api/ai/route.ts` — **NEW** — Server-side proxy for AI calls
- `app/api/ai/analyze/route.ts` — **NEW** — Candidate analysis endpoint
- `app/api/ai/persona/route.ts` — **NEW** — Persona generation endpoint
- `app/api/ai/outreach/route.ts` — **NEW** — Outreach message endpoint

**Pattern**: All AI calls go through server-side API routes that read keys from `process.env` only. Client components call `/api/ai/*` instead of directly hitting OpenRouter/Gemini.

---

### 0.5 — Guard JSON.parse() Calls

**Why**: 154 instances of `JSON.parse()` without try-catch. Silent data corruption.

**Files to modify**: Create a utility function, use it everywhere:
- `lib/utils.ts` — Add `safeParse<T>(json: string, fallback: T): T`
- Global find-and-replace `JSON.parse(` with `safeParse(` across all service files

---

## Phase 1: Battle Cards 2.0 (Week 2)

> **New APIs needed**: None — 100% ready
> **Key insight**: This is purely UI/UX + AI prompt engineering

### What to build

Side-by-side candidate comparison with AI-generated differential analysis.

### Files to create/modify

- `app/compare/page.tsx` — **EXISTS** but needs major upgrade:
  - Split-screen layout with 2-4 candidate columns
  - Per-dimension comparison rows (skills, experience, culture, risk)
  - AI-generated "hire recommendation" narrative
- `services/geminiService.ts` — Add `generateBattleCard()` function:
  - Input: 2-4 `Candidate` objects + `JobContext`
  - Output: Structured comparison with winner per dimension + overall verdict
  - Use OpenRouter with JSON schema for structured output
- `components/compare/BattleCard.tsx` — **NEW** — Single candidate column
- `components/compare/ComparisonRow.tsx` — **NEW** — Dimension comparison
- `components/compare/VerdictPanel.tsx` — **NEW** — AI recommendation
- `app/api/ai/compare/route.ts` — **NEW** — Server-side comparison endpoint

### Data flow
```
Pipeline (select 2-4 candidates) → /compare page
  → POST /api/ai/compare { candidates, jobContext }
  → OpenRouter generates structured comparison
  → Render interactive Battle Card UI
```

---

## Phase 2: Deep Work Analyzer (Week 3)

> **New APIs needed**: Supabase (for caching) — already in deps
> **Gap analysis verdict**: 90% ready

### What to build

Analyze a candidate's actual code quality, architecture patterns, and shipped work.

### Files to create/modify

- `services/deepWorkAnalyzer.ts` — **NEW** — Core analysis engine:
  - `analyzeRepositories(username)` — Fetch top repos, analyze code patterns
  - `analyzeCodeQuality(repoData)` — OpenRouter analysis of code style/complexity
  - `analyzeShippedWork(username)` — Firecrawl deployed apps + portfolio
  - `calculateProofOfWork(allData)` — Composite score
- `app/api/analyzer/[username]/route.ts` — **NEW** — Analysis endpoint
- `app/profile/[username]/work/page.tsx` — **NEW** — Work analysis view
- `components/analyzer/CodeQualityRadar.tsx` — **NEW** — Recharts radar chart
- `components/analyzer/RepoTimeline.tsx` — **NEW** — Contribution timeline
- `components/analyzer/ShippedWorkGallery.tsx` — **NEW** — Portfolio screenshots

### API usage
| API | Purpose |
|-----|---------|
| `GITHUB_TOKEN` | Fetch repos, commits, PRs, languages, code frequency |
| `OPENROUTER_API_KEY` | Analyze code quality, architecture patterns |
| `FIRECRAWL_API_KEY` | Crawl deployed apps, portfolio sites, blogs |
| `BRIGHTDATA_API_KEY` | npm packages, Stack Overflow, Kaggle profiles |

### Caching strategy
```
First request:  GitHub API → OpenRouter analysis → store in Candidate.advancedProfile (DB)
Repeat request: Read from DB (< 7 days old) or re-analyze
```

---

## Phase 3: Calibration AI (Week 4)

> **New APIs needed**: None (BrightData covers market intelligence)
> **Gap analysis verdict**: 80% ready

### What to build

Conversational AI that transforms vague job descriptions into precision hiring specifications.

### Files to create/modify

- `app/intake/page.tsx` — **MAJOR REWRITE** — Replace form with chat-style interface:
  - Conversational flow: AI asks clarifying questions
  - Real-time skill extraction and validation
  - Market reality checks ("only 47 engineers match this in Copenhagen")
- `services/calibrationService.ts` — **NEW** — Conversation engine:
  - `startCalibration(jobDescription)` — Parse initial JD, generate questions
  - `processAnswer(conversationState, answer)` — Refine spec iteratively
  - `generateSpec(conversationState)` — Output final hiring spec
  - `getMarketIntelligence(spec)` — BrightData salary/supply data
- `app/api/calibration/route.ts` — **EXISTS** — Enhance with conversation state
- `types.ts` — Add `CalibrationConversation`, `HiringSpec` interfaces
- `components/calibration/ChatInterface.tsx` — **NEW** — Chat-style UI
- `components/calibration/SpecPreview.tsx` — **NEW** — Live spec preview

### Conversation flow
```
User: "We need a senior React developer"
AI: "What's the team size? Do they need to lead, or IC?"
User: "IC, team of 6"
AI: "Backend involvement? Node, Python, or purely frontend?"
User: "Some Node. We use GraphQL."
AI: → Generates spec: Senior React Engineer, IC, Node+GraphQL, team of 6
    → Market check: "~180 matches on GitHub in your region.
       Avg salary: 650k-850k DKK. Consider 'Next.js' to narrow to 43."
```

---

## Phase 4: Outreach Agent (Week 5-6)

> **New APIs needed**: Resend (free 3k emails/mo)
> **Gap analysis verdict**: 75% ready

### What to build

AI writes hyper-personalized outreach based on candidate's actual work, then sends it.

### Files to create/modify

- `services/outreachAgent.ts` — **NEW** — Full outreach pipeline:
  - `generateOutreach(candidate, jobContext, channel)` — AI message generation
  - `personalizeFromWork(candidate)` — Pull hooks from code/blog/portfolio
  - `sendEmail(to, subject, body)` — Resend integration
  - `trackOutreach(candidateId, messageId)` — Open/click tracking
- `app/api/outreach/route.ts` — **EXISTS** — Enhance with sending + tracking
- `app/api/outreach/track/route.ts` — **NEW** — Webhook for open/click events
- `app/api/outreach/templates/route.ts` — **NEW** — Template CRUD
- `components/outreach/OutreachComposer.tsx` — **NEW** — Replace `OutreachModal.tsx`:
  - Message preview with personalization highlights
  - Channel selector (email, LinkedIn draft)
  - Send button with confirmation
  - Tracking dashboard (opens, clicks, replies)
- `lib/resend.ts` — **NEW** — Resend client wrapper

### Environment additions
```env
RESEND_API_KEY=          # Free: 3,000 emails/mo
RESEND_FROM_DOMAIN=      # e.g., outreach@yourdomain.com
```

### Package additions
```bash
npm install resend
```

---

## Phase 5: Talent Graph (Week 6-7)

> **New APIs needed**: None (BrightData LinkedIn dataset covers it)
> **Gap analysis verdict**: 70% ready

### What to build

Map hidden connections between your hiring team and any candidate.

### Files to create/modify

- `services/networkAnalysisService.ts` — **EXISTS** — Major enhancement:
  - Add BrightData LinkedIn People Dataset integration
  - Build 2-hop connection graph (you → mutual → candidate)
  - Add company alumni detection
  - Add shared community/event detection
- `components/NetworkMap.tsx` — **EXISTS** — Upgrade with @xyflow/react (already in deps):
  - Interactive node graph with zoom/pan
  - Connection strength visualization (edge thickness)
  - Click-to-expand node details
  - Warm intro suggestion cards
- `app/profile/[username]/network/page.tsx` — **NEW** — Network view
- `app/api/network/[username]/route.ts` — **NEW** — Network analysis endpoint

### Data model (already defined in `types.ts`)
The `NetworkGraph`, `NetworkNode`, `NetworkEdge`, `WarmIntroPath` interfaces already exist — they just need implementation backing them.

### Storage
Start with Prisma JSON fields on `Candidate.advancedProfile.networkGraph`. Move to dedicated `NetworkNode`/`NetworkEdge` tables if query performance demands it. Skip Neo4j until >10k nodes.

---

## Phase 6: Pipeline Analytics (Week 7-8)

> **New APIs needed**: PostHog (free 1M events/mo)
> **Gap analysis verdict**: 85% ready

### What to build

Dashboard showing hiring velocity, conversion rates, time-to-hire, and AI-generated insights.

### Files to create/modify

- `app/dashboard/page.tsx` — **EXISTS** — Major upgrade:
  - Funnel visualization (Sourced → Shortlisted → Analyzed → Outreached → Hired)
  - Time-to-hire metrics per pipeline
  - Score distribution charts
  - AI-generated pipeline health summary
- `services/analyticsService.ts` — **NEW** — Analytics engine:
  - `getPipelineMetrics(userId, dateRange)` — Funnel conversion rates
  - `getHiringVelocity(userId)` — Candidates per stage per week
  - `getScoreDistribution(userId)` — Score histogram
  - `generateInsights(metrics)` — OpenRouter analysis of pipeline health
- `app/api/analytics/route.ts` — **NEW** — Analytics data endpoint
- `components/analytics/FunnelChart.tsx` — **NEW** — Recharts funnel
- `components/analytics/VelocityChart.tsx` — **NEW** — Time series
- `components/analytics/InsightCards.tsx` — **NEW** — AI insights

### PostHog integration (product analytics, separate from pipeline analytics)
- `lib/posthog.ts` — **NEW** — PostHog client
- `app/layout.tsx` — Add PostHog provider
- Track: page views, feature usage, search queries, conversion events

### Environment additions
```env
NEXT_PUBLIC_POSTHOG_KEY=   # Free: 1M events/mo
POSTHOG_HOST=              # https://app.posthog.com (or self-hosted)
```

---

## Cross-Cutting Concerns

### Rate Limiting (add Upstash Redis in Phase 2+)

**Why**: GitHub API (5k/hr), OpenRouter, BrightData all have rate limits.

```env
UPSTASH_REDIS_URL=         # Free: 10k commands/day
UPSTASH_REDIS_TOKEN=
```

**Files**:
- `lib/rateLimit.ts` — **NEW** — Token bucket rate limiter
- `lib/cache.ts` — **NEW** — Redis caching wrapper
- Apply to all API routes via middleware

### Large Component Decomposition

These files are too large and should be broken down:
- `app/pipeline/page.tsx` (49KB) → Extract into:
  - `components/pipeline/PipelineHeader.tsx`
  - `components/pipeline/PipelineFilters.tsx`
  - `components/pipeline/PipelineGrid.tsx`
  - `components/pipeline/PipelineActions.tsx`
- `app/profile/[username]/deep/page.tsx` (93KB) → Extract into:
  - `components/profile/DeepProfileHeader.tsx`
  - `components/profile/AnalysisSection.tsx`
  - `components/profile/InterviewGuide.tsx`
  - `components/profile/NetworkSection.tsx`

### Structured Logging

Replace 170+ `console.log()` with structured logger:
- `services/logger.ts` — **EXISTS** — Enhance:
  - Add log levels (debug, info, warn, error)
  - Add structured context (userId, candidateId, operation)
  - Add request ID tracking

---

## Priority Add List (Environment Variables)

| Priority | Service | Env Var | Cost | Unlocks |
|----------|---------|---------|------|---------|
| 1 | Supabase | `SUPABASE_URL` + `SUPABASE_ANON_KEY` | Free (500MB) | DB persistence, real-time, caching |
| 2 | Resend | `RESEND_API_KEY` | Free (3k emails/mo) | Outreach Agent email delivery |
| 3 | PostHog | `NEXT_PUBLIC_POSTHOG_KEY` | Free (1M events/mo) | Product analytics, feature flags |
| 4 | Upstash Redis | `UPSTASH_REDIS_URL` | Free (10k/day) | Rate limiting, caching, job queues |

**Total new cost: €0/mo** (all free tiers)

---

## Ship Order (Fastest to Value)

```
Week 1:  Phase 0 — Foundation hardening (DB, errors, tests, security)
Week 2:  Phase 1 — Battle Cards 2.0 (0 new APIs, pure UI/AI)
Week 3:  Phase 2 — Deep Work Analyzer MVP (add Supabase for caching)
Week 4:  Phase 3 — Calibration AI (conversational UX rewrite)
Week 5-6: Phase 4 — Outreach Agent (add Resend)
Week 6-7: Phase 5 — Talent Graph (BrightData LinkedIn dataset)
Week 7-8: Phase 6 — Analytics dashboard (add PostHog)
```

---

## Files Changed Summary

### New files to create (~25 files)
```
app/api/candidates/route.ts
app/api/candidates/[id]/route.ts
app/api/ai/route.ts
app/api/ai/analyze/route.ts
app/api/ai/persona/route.ts
app/api/ai/outreach/route.ts
app/api/ai/compare/route.ts
app/api/analyzer/[username]/route.ts
app/api/outreach/track/route.ts
app/api/outreach/templates/route.ts
app/api/network/[username]/route.ts
app/api/analytics/route.ts
app/profile/[username]/work/page.tsx
app/profile/[username]/network/page.tsx
services/deepWorkAnalyzer.ts
services/calibrationService.ts
services/outreachAgent.ts
services/analyticsService.ts
lib/resend.ts
lib/rateLimit.ts
lib/cache.ts
lib/posthog.ts
components/compare/BattleCard.tsx
components/compare/ComparisonRow.tsx
components/compare/VerdictPanel.tsx
components/analyzer/CodeQualityRadar.tsx
components/analyzer/RepoTimeline.tsx
components/calibration/ChatInterface.tsx
components/calibration/SpecPreview.tsx
components/outreach/OutreachComposer.tsx
components/analytics/FunnelChart.tsx
components/analytics/VelocityChart.tsx
components/analytics/InsightCards.tsx
```

### Existing files to modify (~15 files)
```
prisma/schema.prisma              — Add Candidate model
services/candidateService.ts      — DB-backed persistence
services/geminiService.ts         — Error isolation, server-only keys
services/enrichmentServiceV2.ts   — Timeouts, Promise.allSettled
services/behavioralSignalsService.ts — Timeouts
services/networkAnalysisService.ts — Rate limiting, BrightData LinkedIn
services/logger.ts                — Structured logging
app/intake/page.tsx               — Conversational calibration UX
app/compare/page.tsx              — Battle Cards upgrade
app/dashboard/page.tsx            — Analytics dashboard
app/pipeline/page.tsx             — Component decomposition
app/api/outreach/route.ts        — Add sending + tracking
app/api/calibration/route.ts     — Conversation state
app/layout.tsx                    — PostHog provider
lib/utils.ts                     — safeParse utility
package.json                     — New deps + test scripts
vitest.config.ts.bak → vitest.config.ts — Re-enable testing
types.ts                         — New interfaces
```

---

## Success Metrics

| Metric | Current | Target (8 weeks) |
|--------|---------|-------------------|
| Data persistence | localStorage (5MB cap) | PostgreSQL (unlimited) |
| Error recovery | Cascade failure | Graceful degradation |
| Test coverage | 0% (disabled) | >60% on services |
| API key security | localStorage (XSS risk) | Server-side only |
| Candidate comparison | Manual side-by-side | AI-powered Battle Cards |
| Code analysis | None | Proof-of-work scoring |
| Outreach | Generate only | Generate + send + track |
| Intake | Static form | Conversational AI |
| Network mapping | Basic followers | 2-hop graph with warm intros |
| Analytics | None | Funnel + velocity + AI insights |

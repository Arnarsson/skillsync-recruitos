# RecruitOS — Module Map
> Written: 2026-02-19 | Auditor: Mason (subagent)
> Purpose: Define 7 self-contained modules for safe parallel AI-agent work

---

## Overview

The codebase has a clear functional boundary between these domains:

```
┌─────────────────────────────────────────────────────────────────┐
│  MODULE 1       │  MODULE 2       │  MODULE 3                   │
│  Search &       │  Candidate      │  AI Analysis &              │
│  Discovery      │  Pipeline       │  Scoring                    │
├─────────────────┼─────────────────┼─────────────────────────────┤
│  MODULE 4       │  MODULE 5       │  MODULE 6                   │
│  Credit &       │  Job Readiness  │  Integrations               │
│  Payments       │  Engine         │  (TT, BrightData, Resend)   │
├─────────────────┴─────────────────┴─────────────────────────────┤
│  MODULE 7: Auth & Data Access (cross-cutting foundation)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module 1: Search & Discovery

**Purpose:** Find developers on GitHub (and SERP) via natural-language queries and return structured results.

### Files Owned
```
lib/github.ts                        ← Octokit wrapper + query parser
lib/search/
  ├── constants.ts                   ← Multi-language stop words
  ├── combinedSearch.ts              ← Multi-source orchestration
  ├── experienceParser.ts            ← "5 års erfaring" → {minYears: 5}
  ├── locationNormalizer.ts          ← "København" → "copenhagen"
  ├── skillNormalizer.ts             ← "react" → {github: "javascript"}
  └── index.ts
lib/anti-gaming-filters.ts           ← Filter out fake/inflated profiles
lib/advancedFilters.ts               ← Additional filter predicates
app/api/search/route.ts              ← GET /api/search
app/api/search/serp/route.ts         ← SERP-backed search fallback
app/api/github/
  ├── user/route.ts
  ├── deep/route.ts
  ├── quality/route.ts
  ├── signals/route.ts               ← "Open to work" detection
  └── connection-path/route.ts
app/api/skills/preview/route.ts      ← Skill candidate count estimates
app/search/page.tsx                  ← Search results UI
app/skills-review/page.tsx           ← Skills kanban UI
app/intake/page.tsx                  ← Job context input form
components/search/SearchFilters.tsx
```

### Inputs
- User search query (natural language string)
- Job context from intake form
- Optional: GitHub OAuth token for higher rate limits

### Outputs
- `SearchResult[]` — normalized developer objects
- Skill candidate counts (heuristic + live)
- GitHub behavioral signals (openToWork, activity)

### External Dependencies
- **GitHub Search API** via Octokit (rate: 30/min auth, 10/min unauth)
- **BrightData SERP** (optional, `app/api/search/serp`)
- No database writes in the hot path

### Isolation Difficulty: **LOW**
This module has almost no inbound coupling. It reads GitHub, returns results. The only shared dependency is `lib/github.ts` → `lib/search/*`.

### Fresh AI Session Context
- `lib/github.ts`: Octokit wrapper. `searchDevelopers(query, token, page, perPage)` is the main entry. Query parsing is inline via `parseSearchQuery()`.
- `lib/search/skillNormalizer.ts`: `normalizeSkill()` — bug: returns error for meta-skills like "Open Source" (see BUG_BRIEF).
- `app/api/skills/preview/route.ts`: Returns per-skill candidate counts. Bug: 0-count fallback not applied consistently (see BUG_BRIEF Bug 2).
- Rate limiting: `lib/rate-limit.ts` used in API routes.
- Anti-gaming: `lib/anti-gaming-filters.ts` — 13 tests pass, safe to rely on.

---

## Module 2: Candidate Pipeline

**Purpose:** Manage the recruiter's pipeline — save, stage, filter, and display candidates.

### Files Owned
```
app/api/candidates/
  ├── route.ts                       ← GET (list) + POST (create)
  ├── [id]/route.ts                  ← GET + PATCH + DELETE
  ├── [id]/notes/route.ts            ← Notes CRUD
  ├── [id]/work-analysis/route.ts    ← Work history analysis
  ├── [id]/readiness/route.ts        ← Job readiness trigger
  ├── graph/route.ts                 ← Network graph data
  └── import/route.ts                ← Bulk import
app/pipeline/page.tsx                ← 2254 lines — GOD FILE
app/linkedin-pipeline/page.tsx
app/shortlist/page.tsx
app/compare/page.tsx
app/graph/page.tsx
app/candidates/[id]/work-analysis/page.tsx
components/pipeline/CandidatePipelineItem.tsx
components/pipeline/SidePanel.tsx    ← If exists
services/candidateService.ts         ← API-backed CRUD client (fetch-based)
hooks/useCandidates.ts               ← React hook with optimistic updates
lib/pipelineUrlState.ts              ← URL ↔ filter state sync
lib/demoData.ts                      ← Demo seed data
```

### Inputs
- `SearchResult[]` from Module 1 (converted to Candidates)
- LinkedIn data from Chrome Extension → `POST /api/linkedin/candidate`
- Manual candidate creation

### Outputs
- `Candidate[]` stored in PostgreSQL
- Pipeline stage updates (sourced → reviewed → shortlisted → contacted)
- Notes per candidate

### External Dependencies
- **Prisma/PostgreSQL** — all persistence
- Module 3 (AI Analysis) for scoring display
- Module 5 (Job Readiness) for readiness scores

### Isolation Difficulty: **MEDIUM**
`app/pipeline/page.tsx` at 2254 lines is the biggest problem — it embeds filtering, scoring display, location logic, hard requirements, and UI all in one file. Safe to work on API routes independently; page.tsx requires careful scoping.

### Fresh AI Session Context
- `services/candidateService.ts`: Pure fetch wrapper around `/api/candidates`. Import this, not direct fetch.
- `hooks/useCandidates.ts`: React hook. Use this in page components.
- `app/api/candidates/route.ts`: `requireOptionalAuth()` — unauthenticated users get synthetic demo candidates (not persisted).
- Unique constraints: `@@unique([githubUsername, userId])` — use `findFirst + create/update`, never upsert on this.
- Pipeline stages (string enum, not DB enum): `sourced`, `reviewed`, `shortlisted`, `contacted`, `rejected`.
- Location filtering bug: Hard requirement filter in `pipeline/page.tsx` ~line 1044 is a stub — see BUG_BRIEF Bug 4.

---

## Module 3: AI Analysis & Scoring

**Purpose:** Score candidates against job criteria, generate psychometric profiles, and produce outreach messages.

### Files Owned
```
services/geminiService.ts            ← 949 lines — unified AI client (LARGE)
services/ai/
  ├── client.ts                      ← Gemini + OpenRouter init (duplicate of geminiService init)
  ├── scoring.ts                     ← Scoring-specific AI calls
  ├── profiling.ts                   ← Persona generation
  ├── outreach.ts                    ← Outreach message generation
  └── schemas.ts                     ← Zod/JSON schemas for AI responses
lib/criteria.ts                      ← Pure token-match scoring (no AI)
lib/psychometrics.ts                 ← Psychometric profile types
lib/explainability.ts                ← Score explanation utilities
lib/interview-engine.ts              ← Interview question generation
lib/interviewPrep.ts                 ← Interview prep data
lib/techStackMatching.ts             ← Stack compatibility scoring
lib/teamFit.ts                       ← Team fit analysis
lib/salaryEstimator.ts               ← Salary range estimation
lib/skillClaims.ts                   ← Skill verification logic
services/calibrationService.ts       ← AI calibration/feedback
services/personalityService.ts       ← Personality type analysis
services/citedEvidenceService.ts     ← Evidence citation
app/api/profile/
  ├── analyze/route.ts               ← Main AI scoring endpoint
  └── psychometric/route.ts          ← Persona generation endpoint
app/api/criteria/
  ├── route.ts                       ← CriteriaSet CRUD
  ├── [id]/route.ts
  ├── score/route.ts                 ← Evaluate candidate vs criteria
  └── interview/route.ts             ← Interview question generation
app/api/ai/
  ├── route.ts                       ← General AI endpoint
  └── compare/route.ts               ← Side-by-side comparison
app/api/calibration/
  ├── route.ts
  └── chat/route.ts
app/api/outreach/
  ├── route.ts                       ← Message generation
  └── send/route.ts                  ← Resend delivery
app/api/deep-research/route.ts
app/api/deep-enrichment/route.ts
app/profile/[username]/deep/page.tsx ← 2386 lines — LARGEST FILE
app/analyse/page.tsx
app/criteria/page.tsx
app/compare/page.tsx
lib/services/gemini/
  ├── index.ts
  └── comparativeAnalysis.ts
```

### Inputs
- `Candidate` object with GitHub data + LinkedIn data
- `CriteriaSet` (job requirements)
- `jobContext` string (from intake)

### Outputs
- `alignmentScore` (0–100) + `scoreBreakdown`
- `Persona` object (psychometric profile)
- `interviewGuide` (questions + rubric)
- Outreach message (plaintext or HTML)

### External Dependencies
- **Google Gemini SDK** (`GEMINI_API_KEY`)
- **OpenRouter** fallback (`OPENROUTER_API_KEY`) → `google/gemini-3-flash-preview`
- **Resend** for outreach delivery

### Isolation Difficulty: **HIGH**
`services/geminiService.ts` and `services/ai/client.ts` are near-duplicates — both define `getAiClient()` and `callOpenRouter()`. The `lib/services/gemini/` also partially duplicates. Untangling requires understanding which callers use which. Scoring is split between pure token-match (`lib/criteria.ts`) and AI-powered (`services/ai/scoring.ts`).

### Fresh AI Session Context
- AI failover: `services/geminiService.ts` → Gemini direct first, then OpenRouter
- OpenRouter models: primary `google/gemini-3-flash-preview`, fallback `google/gemini-2.5-flash`
- `services/ai/client.ts` has an OLDER model (`google/gemini-2.0-flash-001`) — may be stale
- Scoring bug: All scores return 46–50 (see GODMODE_BRIEF) — scoring likely using default/fallback
- `lib/criteria.ts`: Pure token-match, no AI. Always returns a score. Used by `/api/criteria/score`.
- `app/profile/[username]/deep/page.tsx` is 2386 lines — avoid bulk editing, scope precisely.

---

## Module 4: Credit & Payments

**Purpose:** Gate AI operations behind a credit economy; handle Stripe checkout and subscriptions.

### Files Owned
```
lib/credits.ts                       ← Core credit business logic (Prisma)
lib/pricing.ts                       ← Credit pricing constants
lib/pricing-catalog.ts               ← Product catalog
lib/credit-packages.ts               ← Package definitions
lib/stripe.ts                        ← Stripe client init
lib/stripe-webhook.ts                ← Webhook processing + idempotency
lib/useCredits.ts                    ← Client-side credit hook
app/api/credits/
  ├── route.ts                       ← GET balance
  ├── balance/route.ts               ← Balance endpoint
  └── consume/route.ts               ← Consume 1 credit
app/api/stripe/checkout/route.ts
app/api/checkout/
  ├── route.ts
  └── credits/route.ts
app/api/webhooks/stripe/route.ts
app/credits/page.tsx
app/pricing/page.tsx
components/PricingCard.tsx
components/PricingToggle.tsx
```

### Inputs
- `userId` from session
- Stripe webhook events (`checkout.session.completed`, `invoice.paid`)
- Credit package selection

### Outputs
- `CreditLedger` entries (double-entry accounting)
- Updated `User.credits` balance
- Stripe payment records

### External Dependencies
- **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- **Prisma/PostgreSQL** — all persistence
- No AI dependencies

### Isolation Difficulty: **LOW**
Clean boundaries. Credit logic is pure DB operations. Stripe integration is well-separated. Can be worked on independently as long as `lib/db.ts` is available.

### Fresh AI Session Context
- `lib/credits.ts`: All DB ops use Prisma transactions for atomicity.
- Annual plan = `User.plan = "ANNUAL"` → unlimited credits (delta=0 still logged).
- Signup bonus: 3 credits (schema default), overridden to 5 in `getOrCreateUser()`.
- Idempotency: `StripeEvent` table tracks processed Stripe event IDs to prevent double-processing.
- Currency: DKK (Danish Krone) — `"dkk"` default in Payment model.
- There are TWO checkout routes: `/api/stripe/checkout` and `/api/checkout/credits` — likely redundant.

---

## Module 5: Job Readiness Engine

**Purpose:** Compute a multi-signal readiness score indicating how likely a candidate is to be open to new opportunities.

### Files Owned
```
services/jobReadiness/
  ├── engine.ts                      ← Orchestrator — runs 7 pillars concurrently
  ├── fetchers.ts                    ← GitHub/LinkedIn data fetchers
  ├── index.ts
  ├── types.ts                       ← ReadinessScore, PillarResult, ExternalFetchers
  ├── pillar1-network.ts             ← Network intelligence
  ├── pillar2-engagement.ts          ← Engagement decay
  ├── pillar3-skills.ts              ← Skill diversification
  ├── pillar4-company.ts             ← Company health
  ├── pillar5-tenure.ts              ← Tenure risk
  ├── pillar6-profile.ts             ← Profile optimization
  └── pillar7-sentiment.ts           ← Sentiment shift
app/api/candidates/[id]/readiness/route.ts
```

### Inputs
- `ReadinessInput` — candidate data (GitHub profile, repos, events, LinkedIn signals)
- Optional `ExternalFetchers` (injected for testability)

### Outputs
- `ReadinessScore` object → stored in `Candidate.jobReadiness (Json)`
- `confidence` per pillar + overall
- `signals[]` per pillar with evidence

### External Dependencies
- **GitHub API** (via `services/jobReadiness/fetchers.ts`)
- No AI calls — pure signal analysis
- Writes back to Prisma via the readiness API route

### Isolation Difficulty: **LOW**
Beautifully isolated. 7 pillar files + engine + fetchers + types. Completely self-contained. The only integration point is `Candidate.jobReadiness` field and the API route.

### Fresh AI Session Context
- Engine runs all 7 pillars with `Promise.all()` — failures are caught per-pillar and null-result pillars have their weight redistributed.
- `ExternalFetchers` interface allows mocking GitHub in tests.
- `getReadinessLevel()` converts score to `"actively-looking" | "open" | "passive" | "not-looking"`.
- Recent bug fixed: pipeline crash when `candidate.jobReadiness` is null → readiness level fallback added (recent commit).

---

## Module 6: External Integrations

**Purpose:** Bridge RecruitOS to external recruitment platforms and data sources.

### Files Owned
```
lib/teamtailor.ts                    ← Teamtailor API client
services/teamTailorService.ts        ← Business logic wrapper
app/api/teamtailor/
  ├── export/route.ts
  └── test/route.ts
lib/brightdata.ts                    ← BrightData client
services/scrapingService.ts          ← Firecrawl + BrightData orchestration
app/api/brightdata/
  ├── route.ts
  ├── trigger/route.ts               ← Async scraping trigger
  ├── progress/route.ts              ← Polling endpoint
  ├── snapshot/route.ts
  ├── linkedin-search/route.ts
  └── serp/route.ts
app/api/linkedin/
  ├── candidate/route.ts             ← Chrome Extension ingest
  ├── enrich/route.ts
  ├── messages/route.ts
  ├── network/route.ts
  ├── notifications/route.ts
  └── verify-email/route.ts
app/api/linkedin-finder/route.ts
app/api/linkedin-connection/route.ts
services/linkedInConnectionService.ts
lib/linkedin-parser/
  ├── index.ts
  ├── network-intelligence.ts
  └── sample-data.ts
lib/resend.ts                        ← Email client
app/api/outreach/send/route.ts
lib/shared-profiles.ts               ← Shareable profile links
app/api/shared-profile/
  ├── route.ts
  └── [id]/route.ts
app/api/embed/widget/route.ts        ← Embeddable profile widget
```

### Inputs
- Candidate profiles to export
- Raw LinkedIn HTML from Chrome Extension
- BrightData scraping results

### Outputs
- Teamtailor candidate records (via TT API)
- Enriched LinkedIn data → `Candidate.rawProfileText`, LinkedIn-specific fields
- Resend email sends
- Shareable profile URLs

### External Dependencies
- **BrightData** (`BRIGHTDATA_API_KEY`)
- **Teamtailor** (`TEAMTAILOR_API_KEY`)
- **Firecrawl** (`FIRECRAWL_API_KEY`)
- **Resend** (`RESEND_API_KEY`)

### Isolation Difficulty: **MEDIUM**
Each integration is self-contained but they share the `Candidate` model for writes. LinkedIn enrichment writes to many Candidate fields, creating coupling with Module 2.

### Fresh AI Session Context
- `lib/teamtailor.ts`: REST client. Converts `RecruitOSProfile` → `TeamTailorCandidate`. One-way export only.
- BrightData LinkedIn scraping is async: trigger → poll progress → fetch snapshot (3-step pattern).
- `app/api/linkedin/candidate/route.ts`: Entry point for Chrome Extension. Uses `findFirst + create/update` (not upsert) to avoid null compound-key issue.
- `lib/storage.ts`: DEPRECATED Vercel KV storage. Still imported by 1 API route — do not extend.

---

## Module 7: Auth & Data Access (Cross-cutting Foundation)

**Purpose:** Authentication, database access, session management, and validation primitives used by all other modules.

### Files Owned
```
lib/auth.ts                          ← NextAuth options (GitHub OAuth + Credentials)
lib/auth-guard.ts                    ← requireAuth(), requireOptionalAuth(), withAuth()
lib/password.ts                      ← bcrypt password hashing
lib/extension-auth.ts                ← Chrome Extension auth tokens
lib/db.ts                            ← Prisma singleton
lib/validation/
  ├── apiSchemas.ts                  ← Zod schemas for all API inputs
  └── withValidation.ts              ← Validation HOF
lib/rate-limit.ts                    ← Request rate limiting
lib/env.ts                           ← Environment variable access helpers
lib/utils.ts                         ← cn() + misc utilities
app/api/auth/
  ├── [...nextauth]/route.ts
  └── signup/route.ts
app/login/page.tsx
app/signup/page.tsx
```

### Inputs
- HTTP requests (auth headers, cookies)
- Database credentials via environment

### Outputs
- `AuthResult { session, user }` — passed to all authenticated handlers
- Validated request bodies
- `prisma` singleton — used by all DB-touching code

### External Dependencies
- **PostgreSQL** via Prisma
- **NextAuth v4** (JWT strategy)
- GitHub OAuth

### Isolation Difficulty: **LOW** (as a dependency, HIGH to change)
Every other module depends on this. Safe to read; risky to modify. Auth-guard pattern is consistent: always use `requireAuth()` or `requireOptionalAuth()`.

### Fresh AI Session Context
- `lib/db.ts`: Exports `prisma` singleton. Import as `import prisma from "@/lib/db"` or `import { prisma } from "@/lib/db"` (both work).
- `lib/auth-guard.ts`: Most-imported file (30 uses). Never bypass with direct `getServerSession()` in new code.
- `lib/validation/apiSchemas.ts`: 16 imports. All incoming API data must be validated with these Zod schemas.
- Session user ID type: `string | undefined`. The `(session.user as any).id` cast is known tech debt.
- Demo mode: `requireOptionalAuth()` returns `null` → code must handle `userId = null` gracefully.

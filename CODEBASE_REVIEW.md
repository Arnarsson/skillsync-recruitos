# Codebase Review — RecruitOS (skillsync-recruitos)

**Date:** 2026-02-22
**Scope:** Full codebase review — architecture, security, code quality, testing, CI/CD
**Codebase size:** ~100K lines of TypeScript/TSX across 400+ files

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Critical Security Issues](#3-critical-security-issues)
4. [High-Priority Issues](#4-high-priority-issues)
5. [Core Services Review](#5-core-services-review)
6. [API Routes Review](#6-api-routes-review)
7. [Frontend & Components Review](#7-frontend--components-review)
8. [Types & Utilities Review](#8-types--utilities-review)
9. [Testing Review](#9-testing-review)
10. [CI/CD Review](#10-cicd-review)
11. [Recommendations](#11-recommendations)

---

## 1. Executive Summary

RecruitOS is a mature, well-structured Next.js 16 application with React 19, TypeScript 5 in strict mode, and a robust AI-powered recruitment pipeline. The architecture follows solid patterns — App Router, service layer separation, dual-mode persistence, and a 7-pillar readiness scoring engine.

**Strengths:**
- Clean separation of concerns across services, API routes, and components
- Comprehensive type system with strong TypeScript interfaces
- Well-designed job readiness engine with individually-testable pillars
- Good race condition handling in async effects (cancellation tokens)
- Solid CI/CD with 4 GitHub Actions workflows
- 330 passing unit tests covering core services

**Areas of Concern:**
- **Security:** 5 critical authentication gaps on API routes, prompt injection risk in AI services, client API key acceptance in BrightData routes
- **Authorization:** Team service lacks role-based permission checks — any authenticated user can modify any team
- **Test Coverage:** Only 15 of 69 API routes have tests; credit system, outreach, and LinkedIn integration are untested
- **Type Safety:** `as any` casts in auth, GitHub, and scraping services bypass TypeScript's safety net
- **CI Gaps:** ESLint broken in CI, security scans non-blocking, no E2E tests in pipeline, no coverage thresholds

### Risk Heat Map

| Area | Severity | Confidence |
|------|----------|------------|
| API Authentication Gaps | CRITICAL | High |
| Prompt Injection in AI | CRITICAL | High |
| Team Authorization | CRITICAL | High |
| Client API Key Acceptance | HIGH | High |
| Test Coverage Gaps | HIGH | High |
| Type Safety (`as any`) | MEDIUM | High |
| CI/CD Gaps | MEDIUM | High |
| Accessibility | MEDIUM | Medium |
| Performance | LOW | Medium |

---

## 2. Architecture Overview

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.2 |
| UI | React | 19.2.3 |
| Language | TypeScript (strict) | 5 |
| Styling | Tailwind CSS | 4 |
| Database | PostgreSQL via Prisma + Supabase | Prisma 6.19 |
| Auth | NextAuth (GitHub OAuth) | 4.24 |
| AI | Google Gemini (@google/genai) | 1.36 |
| Testing | Vitest + Playwright | Vitest 4, Playwright 1.58 |
| Deployment | Vercel | via GitHub Actions |
| Monitoring | Sentry | Integrated |

### Architecture Diagram
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Next.js     │────▶│  API Routes  │────▶│  Services Layer │
│  Pages/App   │     │  (69 routes) │     │  (14 services)  │
└──────┬───────┘     └──────┬───────┘     └────────┬────────┘
       │                    │                      │
       ▼                    ▼                      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ localStorage │     │  Middleware   │     │ External APIs   │
│ (primary)    │     │  (CORS/Auth/ │     │ Gemini, GitHub, │
│              │     │   CSP/Rate)  │     │ BrightData,     │
│ Supabase     │     └──────────────┘     │ Firecrawl,      │
│ (sync)       │                          │ Stripe, OpenRouter│
└──────────────┘                          └─────────────────┘
```

### Key Design Decisions
- **Client-first persistence**: localStorage is source of truth, Supabase sync is best-effort
- **Credit economy**: All AI operations metered (278-741 credits per operation)
- **Failover AI**: Gemini primary → OpenRouter fallback
- **Multi-language search**: Danish, Swedish, German, Norwegian, English query parsing
- **EU AI Act compliance**: Immutable audit logs for profiling decisions

---

## 3. Critical Security Issues

### 3.1 Unauthenticated AI Endpoints (CRITICAL)

**Files:** `app/api/ai/compare/route.ts`, `app/api/calibration/route.ts`

Both endpoints accept POST requests without any authentication check, allowing anyone to:
- Consume expensive AI API credits (Gemini/OpenRouter)
- Trigger web scraping operations (Firecrawl)
- Access AI-powered candidate analysis

**Impact:** Unmetered financial exposure via API abuse.

**Fix:** Add `requireAuth()` guard at the start of each handler.

### 3.2 Prompt Injection in AI Services (CRITICAL)

**File:** `services/geminiService.ts:816-819`

`generateOutreach()` directly interpolates candidate data into AI prompts without sanitization:
```typescript
const prompt = `
  Generate a personalized outreach message.
  Candidate: ${candidate.name} (${candidate.currentRole} at ${candidate.company})
```

If `candidate.name` or other fields contain prompt-breaking text (`*/\nIgnore previous instructions...`), an attacker could inject arbitrary instructions into the AI prompt.

**Impact:** AI output manipulation, potential data exfiltration via crafted responses.

**Fix:** Sanitize all user-supplied data before prompt interpolation. Use delimiter-based prompt structure (e.g., XML tags) to separate instructions from data.

### 3.3 Team Service Missing Authorization (CRITICAL)

**File:** `services/teamService.ts:195-359`

Team mutation functions (invite member, update stage, access pipeline) verify the user is authenticated but never check if the user has the appropriate role in the target team:
```typescript
// Any authenticated user can add members to ANY team
const { error: memberError } = await supabase
  .from('team_members')
  .insert({ team_id: input.teamId, ... });
```

**Impact:** Cross-team data access and modification. Any authenticated user can read candidates from any team's pipeline if they know the pipeline ID.

**Fix:** Add explicit ownership/role checks before every mutation, or enforce via Supabase Row-Level Security (RLS) policies.

### 3.4 Client API Key Acceptance in BrightData Routes (HIGH)

**Files:** `app/api/brightdata/route.ts`, `trigger/route.ts`, `progress/route.ts`, `snapshot/route.ts`

All BrightData proxy routes accept API keys from the client request body as a fallback:
```typescript
const apiKey = process.env.BRIGHTDATA_API_KEY || clientApiKey;
```

**Impact:** Clients can supply arbitrary API keys, potentially using the server as an open proxy to BrightData.

**Fix:** Remove all client API key fallbacks. Only use server-side environment variables.

### 3.5 Demo Mode Header Bypass (HIGH)

**File:** `app/api/outreach/route.ts:162-166`

The outreach endpoint checks for a client-controlled header to enable demo mode:
```typescript
request.headers.get("x-demo-mode") === "true"
```

**Impact:** Any client can set this header to bypass authentication and generate outreach messages for free.

**Fix:** Remove client-side demo mode header check. Only use server-side session state.

---

## 4. High-Priority Issues

### 4.1 Stripe Environment Variable Non-null Assertion

**File:** `lib/stripe.ts:148`
```typescript
process.env.STRIPE_WEBHOOK_SECRET!
```
If the env var is undefined, this throws at runtime with no descriptive error. Should validate upfront with a clear message.

### 4.2 Unsafe Type Casts in Auth

**File:** `lib/auth.ts:89-90`
```typescript
(session.user as any).id = token.id;
(session as any).accessToken = token.accessToken;
```
Bypasses TypeScript entirely. Should extend NextAuth's Session type using module augmentation.

### 4.3 Silent Null Returns from Supabase Clients

**Files:** `lib/supabase/client.ts`, `lib/supabase/server.ts`

Both return `null` if environment variables are missing, with no logging. Callers that don't check for null will get runtime errors.

**Fix:** Log which env var is missing. Consider throwing at startup instead of returning null.

### 4.4 Unvalidated Deep Profile Query Parameter

**File:** `app/api/developers/[username]/route.ts:64`

The `?deep=true` parameter returns email and social contact info without authentication.

**Fix:** Require auth for the `deep=true` parameter.

### 4.5 Dev-Only Endpoint Exposed in Production

**File:** `app/api/readiness-test/route.ts`

Marked as "DEV-ONLY" in comments but has no auth guard or environment check. Anyone can fetch live GitHub data for any username.

### 4.6 Shared Profiles Without Access Controls

**File:** `app/api/shared-profile/[id]/route.ts`

Public endpoint returns full candidate profile data (alignment scores, risks, interview guides) with no authentication, expiration, or one-time token validation.

### 4.7 Missing Rate Limiting on Expensive Endpoints

None of the AI, search, or BrightData routes implement per-user rate limiting. The middleware has rate limiting infrastructure, but it's not applied uniformly across all cost-sensitive endpoints.

---

## 5. Core Services Review

### Quality Summary

| Service | Lines | Code Quality | Security | Type Safety | Error Handling |
|---------|-------|-------------|----------|-------------|----------------|
| geminiService.ts | 950 | Good | **Critical** (prompt injection) | Excellent | Good (retry/failover) |
| candidateService.ts | 163 | Good | Good | Excellent | Good |
| scrapingService.ts | 1,140 | Fair | **High** (`as any` casts) | Fair | Weak |
| enrichmentServiceV2.ts | 901 | Excellent | Good | Excellent | Excellent |
| unifiedEnrichment.ts | 217 | Good | Good | Weak (`any` params) | Excellent |
| networkAnalysisService.ts | 740 | Good | Good | Fair | Good |
| behavioralSignalsService.ts | 746 | Good | Good | Fair | Good |
| teamService.ts | 973 | Good | **Critical** (authz) | Excellent | Excellent |
| logger.ts | 110 | Excellent | Good | Excellent | Excellent |
| jobReadiness/ (all) | 1,528 | Excellent | Good | Excellent | Excellent |

### Notable Service Issues

**geminiService.ts**
- Prompt injection risk in `generateOutreach()` (see §3.2)
- `parseJsonSafe()` second JSON.parse can throw uncaught
- `generatePersona()` fallback uses raw `JSON.parse()` instead of `parseJsonSafe()`
- Memory-inefficient string concatenation in `buildPersonaWithGemini()`

**scrapingService.ts**
- Potential infinite loop in `callOpenRouter()` retry with model failover (`i--` + `continue`)
- Tier 4 BrightData polling doesn't validate snapshot data structure
- `as any` type casts bypass safety in 3 locations

**behavioralSignalsService.ts**
- Dead code at line 730: both branches of ternary return `'neutral'`
- Fragile date parsing regex doesn't handle ISO dates
- Hardcoded time thresholds (30/90/180 days) without named constants

**enrichmentServiceV2.ts**
- Polling loop lacks AbortController for cancellation
- Magic number `0.5` discount multiplier should be a named constant
- Evidence threshold (1000 chars) is arbitrary and undocumented

**Job Readiness Engine** — Excellent overall:
- Clean pillar-per-file architecture
- Proper fallback chains and dynamic re-weighting
- Minor: staleness factor ignores LinkedIn profile age; bell curve coefficients undocumented

---

## 6. API Routes Review

### Authentication Coverage

| Route | Auth Status | Risk |
|-------|------------|------|
| `/api/ai/compare` | **MISSING** | CRITICAL |
| `/api/calibration` | **MISSING** | CRITICAL |
| `/api/brightdata/*` | Weak (client keys) | HIGH |
| `/api/outreach` | Demo bypass via header | HIGH |
| `/api/readiness-test` | **MISSING** | MEDIUM |
| `/api/shared-profile/[id]` | Public (by design?) | MEDIUM |
| `/api/developers/[user]?deep` | Partial | MEDIUM |
| `/api/candidates` POST | Optional auth | MEDIUM |
| All other routes | Properly guarded | Good |

### Input Validation Consistency

Routes with proper Zod validation:
- `/api/auth/signup` — `signupSchema`
- `/api/candidates` POST — `candidateCreateSchema`
- `/api/outreach` POST — `outreachGenerateSchema`

Routes **missing** schema validation:
- `/api/ai/compare` — no schema
- `/api/calibration` — no schema
- `/api/brightdata/route` — only checks `action` string
- `/api/credits` POST — weak enum check

### Other Route Issues
- Error responses in multiple routes leak implementation details
- Team routes return mock data instead of 503 when Supabase is unavailable
- No consistent timeout enforcement (`maxDuration` missing from some routes)
- Missing CSRF protection beyond Next.js defaults

---

## 7. Frontend & Components Review

### Positive Findings
- Excellent race condition handling with cancellation tokens in async effects
- No XSS vulnerabilities found — proper use of `JSON.stringify()` for dynamic content
- Good responsive design with mobile-first breakpoints
- Comprehensive `useCallback` usage with proper dependency arrays

### Accessibility Issues (HIGH)

**Header.tsx**
- Language toggle buttons lack `aria-label`
- Mobile menu toggle missing `aria-expanded`
- Dropdown triggers missing `aria-haspopup="menu"`

**CandidatePipelineItem.tsx**
- Expandable cards don't manage focus on expand/collapse
- Screen reader users can't navigate expanded content predictably

**Root Layout (layout.tsx)**
- Missing "Skip to main content" link

### State Management Issues

**AdminContext (`lib/adminContext.tsx`)**
- Two independent `useState` initializers both parse URL params separately
- Potential hydration mismatch despite mounted gate

**BehavioralBadges.tsx**
- Effect dependency on derived `insights` state creates potential stale closure
- Cache updates may not trigger re-render if `username` stays constant

**SearchBar.tsx**
- `onBlur` uses arbitrary 200ms `setTimeout` — fragile on slow devices
- Should use `relatedTarget` check instead

### Minor Component Issues
- `ScoreBadge.tsx`: Dead `effectiveScore` variable (always equals `score`)
- `SearchFilters.tsx`: Default max experience (20) hardcoded in both filter logic and UI separately
- `CandidatePipelineItem.tsx:92-93`: `readinessInput` intentionally omitted from effect deps — could cause stale data

---

## 8. Types & Utilities Review

### types.ts
- Well-organized with clear interface hierarchy
- Overlapping `Persona` vs `PersonaV2` types without clear deprecation path
- `AuditEvent.metadata` uses `Record<string, unknown>` — should be stricter
- `WorkstyleIndicator.category` is `string` — should be a union type
- Enum value inconsistency: `SOURCING_RUN = 'sourcing_run'` uses snake_case while others use SCREAMING_SNAKE

### lib/github.ts
- Silently drops errors (returns `null`) — callers can't distinguish "no results" from "API error"
- Uses `as any` for repo type casting (3 locations)
- Over-fetches repos (requests 100, uses 6)
- `Promise.all` should be `Promise.allSettled` for resilience

### lib/stripe.ts
- Non-null assertion on `STRIPE_WEBHOOK_SECRET` (see §4.1)
- No idempotency keys on checkout sessions — duplicate charges possible on retry
- `session.url!` assertion could fail if Stripe returns undefined

### lib/search/
- `locationNormalizer.ts`: Regex compiled on every call instead of cached — performance issue on hot path
- `skillNormalizer.ts`: "tf" alias claimed by both Terraform and TensorFlow
- `combinedSearch.ts`: Multiple `any` types, silent error swallowing, no fetch timeouts

### Hooks
- `useCandidates.ts`: Missing AbortController for async cleanup — potential memory leak on unmount
- `useModalHistory.ts`: `modalKeysRef` never updated when modals prop changes; unreliable ref-based navigation flag

---

## 9. Testing Review

### Coverage Summary

| Category | Files | Tests | Quality | Gaps |
|----------|-------|-------|---------|------|
| Services | 7 | ~180 | High | BrightData polling skipped |
| Job Readiness | 9 | ~80 | High | No all-pillars integration test |
| API Routes | 4 | ~50 | Medium | **25+ routes untested** |
| E2E | 6 | ~20 | Medium | Not in CI pipeline |
| Hooks/Utils | 5 | ~20 | Good | — |
| **Total** | **36** | **330** | — | — |

### Critical Untested Paths

1. **Revenue-critical:** `/api/outreach` (paid message generation) — zero tests
2. **Credit system:** `/api/credits/consume`, `/api/checkout` — zero tests
3. **AI scoring:** `/api/profile/analyze`, `/api/ai/compare` — zero tests
4. **Candidate CRUD:** `/api/candidates/[id]` (GET/PUT/PATCH/DELETE) — zero tests
5. **LinkedIn integration:** All 8 `/api/linkedin/*` routes — zero tests
6. **BrightData proxy:** All 6 `/api/brightdata/*` routes — zero tests
7. **Team collaboration:** All 4 `/api/team/*` routes — zero tests

### Test Anti-Patterns Found
- **Over-mocking:** Auth is globally mocked as "no session" — no positive auth tests
- **Missing error paths:** Happy path coverage is good, but timeout/abort/malformed responses are rarely tested
- **Database mocks hide schema drift:** candidateService tests mock Supabase — schema changes pass tests silently
- **E2E tests use localStorage fixtures:** Pipeline E2E loads data from localStorage, never hitting real API

### Skipped Tests
8 tests actively skipped (BrightData polling timeouts). These represent dead coverage that won't warn on regressions.

---

## 10. CI/CD Review

### Pipeline Summary

| Workflow | Trigger | Status | Issues |
|----------|---------|--------|--------|
| `ci.yml` | Push/PR to main | Running | ESLint broken, no coverage threshold |
| `deploy.yml` | Push to merge-recruitos | Running | No tests before production deploy |
| `claude.yml` | @claude mentions | Running | Ad-hoc, non-blocking |
| `claude-code-review.yml` | PR events | Running | Optional, non-blocking |

### CI Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| ESLint package not found in CI | CRITICAL | Linting disabled, style regressions pass |
| No coverage thresholds | HIGH | Untested code added indefinitely |
| Security scans use `continue-on-error: true` | HIGH | Vulnerabilities don't block merge |
| No E2E tests in CI | HIGH | Browser flows break silently |
| No environment secrets validation | MEDIUM | Missing API keys only fail at runtime |
| Skipped tests not reported | MEDIUM | Dead coverage stays hidden |
| No test results posted to PRs | LOW | Developers don't see failures easily |

### Recommended vitest.config.ts Update
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    lines: 70,
    branches: 65,
    functions: 70,
    statements: 70,
  },
}
```

---

## 11. Recommendations

### Immediate (Deploy Blockers)

| # | Action | Files | Effort |
|---|--------|-------|--------|
| 1 | Add `requireAuth()` to `/api/ai/compare` and `/api/calibration` | 2 files | 30 min |
| 2 | Sanitize candidate data before AI prompt interpolation | `geminiService.ts` | 2 hrs |
| 3 | Add authorization checks to team service mutations | `teamService.ts` | 4 hrs |
| 4 | Remove client API key fallbacks from BrightData routes | 4 files | 1 hr |
| 5 | Remove `x-demo-mode` header bypass from outreach | 1 file | 15 min |
| 6 | Add auth guard to `/api/developers/[username]?deep=true` | 1 file | 30 min |
| 7 | Fix Stripe env var non-null assertion | `lib/stripe.ts` | 15 min |

### High Priority (Next Sprint)

| # | Action | Effort |
|---|--------|--------|
| 8 | Add tests for 20+ untested API routes (focus: outreach, credits, AI scoring) | 3 days |
| 9 | Fix ESLint in CI pipeline | 1 hr |
| 10 | Enable coverage thresholds in vitest config | 30 min |
| 11 | Make security scans blocking in CI | 30 min |
| 12 | Add rate limiting to all AI/search/BrightData endpoints | 1 day |
| 13 | Replace `as any` casts with proper types in auth, GitHub, scraping services | 1 day |
| 14 | Add accessibility attributes to Header navigation | 2 hrs |
| 15 | Validate environment variables at startup (fail-fast) | 2 hrs |

### Medium Priority (Backlog)

| # | Action | Effort |
|---|--------|--------|
| 16 | Add E2E tests to CI pipeline | 4 hrs |
| 17 | Add AbortController to async hooks (useCandidates, enrichment polling) | 2 hrs |
| 18 | Implement Stripe idempotency keys | 2 hrs |
| 19 | Replace team mock data with 503 errors when Supabase unavailable | 1 hr |
| 20 | Create named constants for all magic numbers across services | 4 hrs |
| 21 | Add "Skip to content" accessibility link to root layout | 30 min |
| 22 | Consolidate Persona/PersonaV2 types with clear migration path | 2 hrs |
| 23 | Cache compiled regexes in locationNormalizer for performance | 1 hr |
| 24 | Add integration test for full scoring flow (search → analyze → outreach) | 1 day |
| 25 | Document test patterns (mocking Gemini, GitHub, BrightData) in CLAUDE.md | 2 hrs |

### Low Priority (Nice to Have)

| # | Action |
|---|--------|
| 26 | Implement structured JSON logging with request ID propagation |
| 27 | Add Redis-backed rate limiting for external API calls |
| 28 | Post test coverage reports to PRs via Codecov |
| 29 | Unskip BrightData/LinkedIn tests with proper async mocks |
| 30 | Resolve "tf" alias conflict between Terraform and TensorFlow in skillNormalizer |

---

## Appendix: Files Reviewed

**Services (14 files):** geminiService.ts, candidateService.ts, scrapingService.ts, enrichmentServiceV2.ts, unifiedEnrichment.ts, networkAnalysisService.ts, behavioralSignalsService.ts, teamService.ts, logger.ts, jobReadiness/{engine,fetchers,types,index,pillar1-7}.ts

**API Routes (69 routes across 40+ files):** All routes under `app/api/`

**Frontend (30+ files):** All page.tsx files, layout.tsx, adminContext.tsx, Header.tsx, AdminDock.tsx, BehavioralBadges.tsx, SearchBar.tsx, ScoreBadge.tsx, CandidatePipelineItem.tsx, SearchFilters.tsx

**Types & Utilities (15+ files):** types.ts, lib/auth.ts, lib/github.ts, lib/pricing.ts, lib/stripe.ts, lib/utils.ts, lib/services/gemini/index.ts, lib/supabase/{client,server}.ts, lib/search/{locationNormalizer,constants,experienceParser,skillNormalizer,combinedSearch}.ts

**Hooks (5 files):** usePersistedState, useCandidates, useModalHistory, and others

**Tests (36 files):** All test files under tests/

**Config (10+ files):** package.json, tsconfig.json, next.config.ts, .eslintrc.json, vitest.config.ts, middleware.ts, .env.example, CI workflows

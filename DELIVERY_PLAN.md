# RecruitOS — Delivery Plan
Date: 2026-02-18
Branch: feature/recruitos-rethink-2026
Goal: Ship a demo-ready, production-stable product

---

## Codebase Map Summary

```
app/                    → 30 pages + 69 API routes (Next.js App Router)
  api/candidates/       → Core CRUD + import (requireOptionalAuth ✅)
  api/analytics/        → Pipeline analytics (pipelineStage in schema ✅)
  api/skills/preview/   → GitHub skill search + fallback heuristics
  api/criteria/         → Scoring criteria (requireOptionalAuth ✅)
  api/linkedin/         → Extension sync, messages, enrichment
  api/profile/          → Gemini AI profiling (requireAuth — locked)
components/             → ~80 components; pipeline/ and profile/ are largest
services/               → Business logic (candidateService, geminiService, jobReadiness/*)
lib/                    → Auth, GitHub, search intelligence, Supabase, Stripe
  lib/search/           → Multi-lang NLP (skills, location, experience normalizers)
  lib/auth-guard.ts     → requireAuth / requireOptionalAuth
prisma/schema.prisma    → PostgreSQL via Vercel (pipelineStage column ✅ exists)
tests/                  → 322 unit/integration tests (315 pass, 7 skipped, 0 fail)
linkedin-extension/     → Chrome extension for LinkedIn profile capture
middleware.ts           → CORS, rate limiting, security headers, auth redirect (DISABLED)
```

Key observations:
- **pipeline/page.tsx is 2,233 lines** — largest single-component in codebase
- **profile/[username]/deep/page.tsx is 2,386 lines** — needs code splitting
- **168 localStorage usages** — primary state store (architectural debt)
- **Vitest fully configured** (vitest.config.ts present) — CLAUDE.md was outdated on this
- **Rate limiting is in-memory** — ineffective on Vercel serverless

---

## Current State

### ✅ What Works
- TypeScript: **clean compile** (0 errors)
- Tests: **315/322 passing** (7 skipped, 0 failed), 29 test files
- Live URL: **recruitos.xyz UP** (HTTP 200 on /intake and /pipeline)
- Health endpoint: `/api/health` → `{"status":"ok","database":true}`
- Core auth flow (NextAuth + GitHub OAuth)
- Prisma schema has all required columns (pipelineStage ✅, linkedinMessages ✅, criteriaSet ✅)
- All 6 bugs from BUG_BRIEF_2026-02-18.md have **code fixes committed**

### 🚨 What's Broken
- **`/api/analytics/pipeline` returns 500 in production** — the code fix exists in commit `405f530` but is NOT deployed (see P0 below)
- **All BUG_BRIEF fixes undeployed** — 30+ commits on `feature/recruitos-rethink-2026` are ahead of the deploy branch (`merge-recruitos`) and not live
- **Auth middleware disabled** — `middleware.ts:124` has commented-out redirect block for protected routes (intentional for demo, but no expiry)

### 🧪 Test Coverage
- Unit/integration: 315 tests passing (Vitest)
- E2E: Playwright configured (`playwright.config.ts`), tests in `tests/e2e/`
- API tests: `tests/api/` — linkedin, psychometric, search, skills-preview
- No test runner in CI matching the current test commands (CI uses lint + type-check + build only)

---

## P0 — Ship Blockers (fix before anything else)

### P0.1 — DEPLOY THE FIX BRANCH ⚡ (most critical)
**Problem:** 30+ commits of bug fixes are on `feature/recruitos-rethink-2026` but Vercel deploys from `merge-recruitos`. Production is running stale code with all known bugs still live.

**Root cause:** `deploy.yml` triggers on push to `merge-recruitos`, but all work happened on `feature/recruitos-rethink-2026`. No merge or cherry-pick has happened.

**Exact fix:**
```bash
cd /home/sven/Documents/2026/Active/skillsync-recruitos
git checkout merge-recruitos
git merge feature/recruitos-rethink-2026 --no-ff -m "merge: deploy recruitos rethink 2026"
git push origin merge-recruitos
# Vercel auto-deploys via GitHub Actions
```

**Verify:** After deploy, hit:
- `curl https://recruitos.xyz/api/analytics/pipeline` → should return JSON with funnel data, not 500
- `curl -X POST https://recruitos.xyz/api/candidates -H 'Content-Type: application/json' -d '{"name":"test","sourceType":"GITHUB"}'` → should return 201 not 401

**Files:** `.github/workflows/deploy.yml`, git branch strategy
**Time estimate:** 15 minutes

---

### P0.2 — Verify GITHUB_TOKEN in Vercel production env
**Problem:** Even with code-level fallbacks, if `GITHUB_TOKEN` is expired or missing in Vercel production env, skills preview falls back to heuristics silently. The test from BUG_BRIEF showed "0 matches" for all skills — heuristic fallback wasn't wiring through correctly to all UI call sites.

**Root cause:** Multiple fixes were needed:
1. `94bc56a` — show fallback heuristic counts
2. `e3d8fca` — distinguish meta-skill fallback from API error fallback
Both are on the undeployed branch (fixed by P0.1), BUT a bad/missing token still degrades the experience.

**Exact fix:**
1. Go to: https://vercel.com/arnarssons-projects/recruit2.0/settings/environment-variables
2. Verify `GITHUB_TOKEN` is set and not expired (GitHub tokens expire if rotated/revoked)
3. If missing: generate new token at github.com/settings/tokens (read:user + public_repo scopes)
4. After P0.1 deploy, hit `curl https://recruitos.xyz/api/skills/preview?skills=javascript` → should return `{"totalCandidates": >0}`

**Files:** Vercel dashboard (no code change required if token is valid)
**Time estimate:** 5 minutes

---

## P1 — Demo Quality (fix before showing to clients)

### P1.1 — Verify demo user flow end-to-end post-deploy
**Problem:** After P0.1 deploys, the 6 bugs from BUG_BRIEF should be fixed. But they need verification. The specific flows to test:
1. Click "Try Demo →" on homepage → sets `recruitos_demo` cookie
2. Navigate to `/skills-review` → should show skill counts > 0
3. Navigate to `/pipeline` → should show demo candidates (not "No Candidates Yet")
4. DevTools → Console: should have zero 401 errors on POST /api/candidates
5. Analytics at `/analytics` → should load without 500

**Root cause:** All code fixes exist; this is a verification step.

**Files:** No code changes needed — this is QA
**Time estimate:** 30 minutes

---

### P1.2 — Replace `analyse` page stub with redirect
**Problem:** `/app/analyse/page.tsx` appears to be a dead-end stub page. Users navigating there get a broken experience. Same for `/app/batch`, `/app/graph`, `/app/metrics`, `/app/network-intelligence`, `/app/network-map` — likely unused or early-stage pages.

**Root cause:** Feature scope expanded rapidly; many pages were stubs that never matured.

**Exact fix:** Add redirects for dead pages or remove from navigation/sitemap. Audit each:
```bash
wc -l app/analyse/page.tsx app/batch/page.tsx app/graph/page.tsx app/metrics/page.tsx \
       app/network-intelligence/page.tsx app/network-map/page.tsx app/shortlist/page.tsx
```
For any stub (<100 lines or navigation links), redirect to `/pipeline` or remove.

**Files:** `app/analyse/page.tsx`, `app/batch/page.tsx`, potentially others
**Time estimate:** 1 hour

---

### P1.3 — Fix misleading "15 found / 0 of 11" counter inconsistency
**Problem:** Three different numbers displayed simultaneously: GitHub search count, DB candidate count, and visible list count. Post-deploy (P0.1 fixes this in code), verify the counter fix is live and correct.

**Root cause:** Commit `38634fc` unified counters + `a4bba57` added location filter. Should be fixed after deploy.

**Exact fix:** If still wrong after deploy, check `app/pipeline/page.tsx` header section for counter sources. Single source of truth: display only the count of candidates actually visible in the current filtered view.

**Files:** `app/pipeline/page.tsx` (header ~lines 1-50)
**Time estimate:** 30 minutes (if needed after P0.1)

---

### P1.4 — Validate demo mode cookie path (Demo Button → cookie → bypass)
**Problem:** Auth middleware bypass for demo mode relies on `recruitos_demo` cookie being set. The auth redirect is currently disabled entirely (for all users). Need to verify the cookie-based demo path works before re-enabling auth for production.

**Root cause:** `middleware.ts:124` has `/* DISABLED FOR DEMO */` comment blocking the auth redirect for ALL users, not just demo users. The cookie check exists but the entire block is commented out.

**Exact fix:** Re-enable the auth block but keep the demo mode bypass active:
```typescript
// In middleware.ts, uncomment and ensure isDemoMode check stays:
if (
  !isAuthenticated &&
  !isDemoMode &&  // ← This line is the demo bypass — keep it
  protectedRoutes.some((route) => pathname.startsWith(route))
) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}
```
Then verify the "Try Demo" button sets the cookie correctly before merging.

**Files:** `middleware.ts:124-133`
**Time estimate:** 45 minutes (test cookie set → bypass → auth user redirect)

---

## P2 — Production Quality (fix before wide launch)

### P2.1 — Split giant page components
**Problem:** `pipeline/page.tsx` (2,233 lines) and `profile/[username]/deep/page.tsx` (2,386 lines) are monolithic and cause slow initial load.

**Root cause:** Rapid feature addition without component extraction discipline.

**Exact fix:**
```typescript
// app/pipeline/page.tsx — extract these:
const FunnelAnalyticsPanel = dynamic(() => import('@/components/pipeline/FunnelAnalyticsPanel'), { ssr: false });
const PipelineKanban = dynamic(() => import('@/components/pipeline/PipelineKanban'), { ssr: false });
const CandidateComparison = dynamic(() => import('@/components/pipeline/CandidateComparison'), { ssr: false });
```

**Files:** `app/pipeline/page.tsx`, `app/profile/[username]/deep/page.tsx`
**Time estimate:** 3-4 hours

---

### P2.2 — Upgrade rate limiting to distributed (Upstash Redis)
**Problem:** `lib/rate-limit.ts` uses in-memory `Map`. On Vercel serverless, each function invocation is isolated → rate limit is effectively per-instance, not global. A malicious user could bypass by hitting different instances.

**Root cause:** Code review finding SEC-006 — never addressed.

**Exact fix:**
```bash
npm install @upstash/ratelimit @upstash/redis
```
```typescript
// lib/rate-limit.ts — replace store with:
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```
Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars.

**Files:** `lib/rate-limit.ts`
**Time estimate:** 2 hours

---

### P2.3 — localStorage → Supabase as primary state
**Problem:** 168 localStorage usages. Candidates, credits, job context, and audit logs all live in browser storage first. If a user clears their browser or uses a different device, all data is lost. This is described as intentional in CLAUDE.md but creates data loss risk.

**Root cause:** Architectural decision to make localStorage primary + Supabase optional sync. Wrong direction for production.

**Exact fix:** Invert the pattern in `services/candidateService.ts`:
- Supabase writes are primary (async)
- localStorage is a cache (fallback when offline)
- `usePersistedState` should hydrate from Supabase on mount

**Files:** `services/candidateService.ts`, `hooks/usePersistedState.ts`, `lib/storage.ts`
**Time estimate:** 1-2 days (significant refactor, do last)

---

### P2.4 — Remove console.log from production builds
**Problem:** 176 console.log/console.error statements in production. Performance noise + potential data leakage.

**Root cause:** No build-time stripping configured.

**Exact fix:**
```typescript
// next.config.ts
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' 
    ? { exclude: ['error', 'warn'] }
    : false,
}
```

**Files:** `next.config.ts`
**Time estimate:** 30 minutes

---

### P2.5 — Fix CORS to exclude localhost in production
**Problem:** `middleware.ts:7-8` allows `http://localhost:3000` and `http://localhost:3001` as CORS origins in production. Minor security issue.

**Root cause:** Code review finding SEC-008 — never addressed.

**Exact fix:**
```typescript
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? new Set(["https://recruitos.app", "https://recruitos.xyz"])
  : new Set(["http://localhost:3000", "http://localhost:3001"]);
```

**Files:** `middleware.ts:7-12`
**Time estimate:** 15 minutes

---

### P2.6 — Add bundle analyzer + verify bundle size
**Problem:** Build artifacts known to be large (1.1GB .next). No visibility into what's bloating the bundle.

**Root cause:** Never configured during rapid development.

**Exact fix:**
```bash
npm install @next/bundle-analyzer
```
```typescript
// next.config.ts — wrap with analyzer
import withBundleAnalyzer from '@next/bundle-analyzer';
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(nextConfig);
```
Run: `ANALYZE=true npm run build` → review output

**Files:** `next.config.ts`, `package.json`
**Time estimate:** 1 hour (setup + review)

---

### P2.7 — Restore and verify test CI pipeline
**Problem:** GitHub Actions CI (`ci.yml`) does lint + type-check + build but does NOT run `npm test`. 315 tests pass but they're never run in CI — regressions won't be caught.

**Root cause:** Tests were set up but CI was not updated to include the test step.

**Exact fix:** Add to `.github/workflows/ci.yml`:
```yaml
- name: Run unit tests
  run: npm run test:run
```

**Files:** `.github/workflows/ci.yml`
**Time estimate:** 30 minutes

---

## P3 — Nice to Have

1. **Add Upstash KV caching** for GitHub API responses (5-min TTL) to reduce rate limit hits
2. **JSDoc comments** on all public service APIs (geminiService, candidateService, etc.)
3. **Centralized API error handler** — replace repetitive try/catch patterns with `handleApiError(error, 'operation')`
4. **Application-level GitHub token encryption** — tokens in User table are plaintext (SEC-009)
5. **CSRF tokens** on state-changing routes (SEC-007)
6. **Zod validation** on remaining unvalidated routes (brightdata/progress, brightdata/snapshot)
7. **`any` type cleanup** — 40+ instances, start with external API parsers
8. **Naming convention enforcement** — ESLint rule for consistent file naming

---

## Architecture Decisions Needed (requires Sven input)

### Decision 1: Demo mode strategy
**Question:** Should unauthenticated users have full access forever (current), or should demo mode expire/require a demo login?

The auth redirect in `middleware.ts` is disabled entirely. This means anyone who finds the URL can use the full product without signing up. Is this intentional for the current phase, or should we re-enable auth after the next demo?

**Options:**
- A) Keep disabled — fully open for now (current state)
- B) Re-enable auth redirect + keep demo cookie bypass
- C) Add a demo login (fixed credentials) that auto-sets the cookie

---

### Decision 2: Branch and deploy strategy
**Question:** Should `feature/recruitos-rethink-2026` become the new `main`/`merge-recruitos`?

Currently Vercel deploys from `merge-recruitos`. All active development is on `feature/recruitos-rethink-2026`. This has caused the deployment gap (P0.1). Going forward:

**Options:**
- A) Merge feature branch → merge-recruitos on each release (manual process)
- B) Change Vercel deploy target to `feature/recruitos-rethink-2026`
- C) Rename `feature/recruitos-rethink-2026` → `main` and update deploy.yml

---

### Decision 3: localStorage primary state
**Question:** Is the "localStorage primary, Supabase optional sync" architecture intentional long-term, or is it a temporary shortcut?

168 usages of localStorage mean user data is lost if they clear their browser. For a recruitment tool used by paying customers, this is unacceptable. But refactoring this is P2.3 — a significant investment.

**Options:**
- A) Keep as-is for demo phase, fix before launch
- B) Prioritize this now (2-day refactor)
- C) Add a clear "import/export data" feature as stopgap

---

### Decision 4: Which pages are demo-essential?
**Question:** There are 30 page routes. Which are actually part of the demo flow?

Likely dead pages: `/analyse`, `/batch`, `/graph`, `/metrics`, `/network-intelligence`, `/network-map`, `/shortlist`

These should either be redirected, removed, or explicitly included in the demo script. Sven needs to decide what's in scope for the demo vs what's pre-production noise.

---

## Recommended Build Order

### Week 1: Demo-Ready (P0 + P1)
**Day 1 (2-3h):**
- [ ] P0.1: Merge feature branch → merge-recruitos → deploy
- [ ] P0.2: Verify GITHUB_TOKEN in Vercel env
- [ ] P1.1: Run end-to-end demo flow verification (all 6 bug checks)

**Day 2 (3-4h):**
- [ ] P1.4: Re-enable auth middleware with demo cookie bypass
- [ ] P1.3: Verify/fix counter display post-deploy
- [ ] P1.2: Audit and redirect/remove dead pages
- [ ] Quick smoke test: full demo script from DEMO_SCRIPT_5MIN.md

**Day 3 (buffer + polish):**
- [ ] Test on mobile (AdminDock + pipeline card scaling)
- [ ] Verify analytics dashboard loads correctly
- [ ] Confirm credits display works correctly

**→ DEMO READY by end of Week 1**

---

### Week 2: Production Quality (P2.1-P2.7)
**Days 4-5 (code splitting):**
- [ ] P2.1: Extract pipeline components (FunnelAnalytics, Kanban, Comparison)
- [ ] P2.4: Add console.log removal from prod builds
- [ ] P2.5: Fix CORS localhost in production
- [ ] P2.7: Add tests to CI pipeline

**Days 6-7 (hardening):**
- [ ] P2.2: Upgrade rate limiting to Upstash Redis
- [ ] P2.6: Bundle analyzer + implement code splitting
- [ ] Architecture decision: confirm localStorage strategy (P2.3 scope)

---

### Week 3: Architecture (P2.3 + P3)
- [ ] P2.3: Invert localStorage ↔ Supabase (if decision made)
- [ ] P3 items (prioritize caching and error handler)
- [ ] Add bundle analyzer results + optimize top 3 offenders

---

## What to NOT Build Right Now

**Cut/defer the following:**

1. **LinkedIn Chrome extension improvements** — the extension (linkedin-extension/) has auth issues and localhost coupling. Don't build new features on top of a broken foundation until P0-P1 is stable.

2. **New AI features (deep research, batch analysis)** — `app/deep-research`, `app/batch` are stub pages. Don't expand AI surface area until the core flow (search → skills-review → pipeline → analytics) is demo-reliable.

3. **TeamTailor integration** — `services/teamTailorService.ts`, `app/api/teamtailor/` exist but are not in the demo script. Defer.

4. **Social Matrix / Network Map** — `components/SocialMatrix/`, `app/network-map/` — complex feature, not part of core demo. Defer.

5. **i18n (Danish)** — `locales/da.json` exists, but English is the priority for demos. Don't invest in translation until the English product is stable.

6. **SERP talent search** — `services/serpTalentSearch.ts`, `app/api/search/serp/` — secondary search path. Don't expand until GitHub search is rock-solid.

7. **Pricing/Stripe** — `app/credits/`, `app/pricing/`, `app/api/checkout/` exist but demos shouldn't require payment. Don't tune these until you have paying customers.

8. **Wizard flow** — `app/wizard/` — if this duplicates intake → skills-review → pipeline flow, consolidate rather than maintain two entry points.

---

## Issue Log (create in Eureka Issues)

| Priority | Title | Estimate |
|----------|-------|----------|
| P0 | Deploy feature branch to production | 15m |
| P0 | Verify GITHUB_TOKEN in Vercel | 5m |
| P1 | End-to-end demo verification | 30m |
| P1 | Re-enable auth middleware + cookie bypass | 45m |
| P1 | Audit + remove dead pages | 1h |
| P1 | Verify/fix pipeline counters post-deploy | 30m |
| P2 | Code-split pipeline + deep profile pages | 4h |
| P2 | Add console.log removal in prod build | 30m |
| P2 | Fix CORS localhost in production | 15m |
| P2 | Add tests to CI pipeline | 30m |
| P2 | Upgrade rate limiting to Upstash | 2h |
| P2 | Bundle analyzer setup + optimization | 1h |
| P2 | localStorage → Supabase primary (pending decision) | 2d |
| P3 | Centralized API error handler | 2h |
| P3 | Upstash KV caching for GitHub API | 2h |
| P3 | JSDoc on service APIs | 3h |

---

*Plan written: 2026-02-18 by Mason*
*Based on: BUG_BRIEF_2026-02-18.md, CODE_REVIEW_REPORT.md, MASTER_GAP_AUDIT_EXECUTION_PLAN.md, live codebase audit, 30+ git commits reviewed*

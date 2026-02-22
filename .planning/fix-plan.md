# Fix Plan — RecruitOS (Codebase Review + Eureka QA Audit)
Date: 2026-02-22

## Overview

This plan fixes all issues from:
- `CODEBASE_REVIEW.md` (full codebase security/quality/testing audit)
- The Eureka QA audit (5-flow UX test on recruitos.xyz demo)

Issues are grouped into 6 phases by urgency. Each item lists the exact file(s), the problem, and the precise fix.

---

## Phase 1 — P0: Demo Blockers (Day 1, ~4h total)

These break the live demo end-to-end. Fix before any other work.

### 1.1 Outreach returns 401 in demo mode
**File:** `app/api/outreach/route.ts`
**Problem:** The route handler checks `x-demo-mode` header and `?demo=true` param, but the Eureka audit confirms both fail. Root cause: the frontend outreach modal doesn't forward demo mode to the API call.
**Fix (two parts):**

Part A — Find the outreach API call in the frontend (likely in `components/outreach/` or similar) and add the demo param:
```typescript
// When building the fetch call to /api/outreach, detect demo mode and add param
const isDemoMode = localStorage.getItem('recruitos_demo') === 'true'
  || window.location.hostname === 'recruitos.xyz'; // or env flag
const url = isDemoMode ? '/api/outreach?demo=true' : '/api/outreach';
```

Part B — In the route handler, also check the NextAuth demo user email + add a synthetic demo response so we don't need real AI credits:
```typescript
// app/api/outreach/route.ts — after demo mode detection
if (isDemoMode) {
  return NextResponse.json({
    message: `Hi ${parsed.data.candidateName},\n\nI came across your work on GitHub and was genuinely impressed...`,
    demo: true,
  });
}
```

### 1.2 Outreach button has zero loading state
**File:** Find the outreach trigger component (pipeline page or outreach modal)
**Problem:** Button stays green with no spinner, no disabled state, no error shown after 401.
**Fix:**
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [outreachError, setOutreachError] = useState<string | null>(null);

const handleGenerate = async () => {
  setIsGenerating(true);
  setOutreachError(null);
  try {
    const res = await fetch('/api/outreach', { ... });
    if (!res.ok) throw new Error(await res.text());
    // ...
  } catch (e) {
    setOutreachError('Failed to generate — please try again');
  } finally {
    setIsGenerating(false);
  }
};

// In JSX:
<Button onClick={handleGenerate} disabled={isGenerating}>
  {isGenerating ? <Spinner /> : 'Generate Message'}
</Button>
{outreachError && <p className="text-destructive text-sm">{outreachError}</p>}
```

### 1.3 /analyse ignores shortlist data
**File:** `app/analyse/page.tsx`
**Problem:** The page already reads `apex_shortlist_data` (lines 62-73), but the Eureka audit confirmed that even with valid data injected, it shows "No Candidates Selected". Most likely cause: the page reads localStorage in a `useEffect` but the initial render checks empty state — the condition rendering "No Candidates Selected" fires before the effect runs.
**Fix:** Move the localStorage read into the initial `useState` initializer (runs synchronously before first render):
```typescript
// Replace useState([]) with lazy initializer
const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>(() => {
  if (typeof window === 'undefined') return [];
  try {
    const shortlistData = localStorage.getItem('apex_shortlist_data');
    const shortlistIds = localStorage.getItem('apex_shortlist');
    if (!shortlistData) return [];
    const saved = JSON.parse(shortlistData) as Candidate[];
    const ids: string[] = shortlistIds ? JSON.parse(shortlistIds) : saved.map(c => c.id);
    return saved.filter(c => ids.includes(c.id));
  } catch {
    return [];
  }
});
```

### 1.4 Readiness engine returns 0/empty pillars for demo candidates
**File:** `app/api/candidates/[id]/readiness/route.ts`
**Problem:** Demo candidates (e.g., "andersbll") aren't in the DB. The route falls back to live GitHub fetch, which may rate-limit or fail in the demo environment. Returns `overall: 0, pillars: {}`.
**Fix:** Add a demo seed map for known demo usernames, returning realistic synthetic data:
```typescript
// app/api/candidates/[id]/readiness/route.ts
const DEMO_READINESS: Record<string, ReadinessScore> = {
  'andersbll': {
    overall: 72,
    confidence: 0.65,
    level: 'warm',
    pillars: {
      networkIntelligence: { score: 80, signals: ['Growing follower base (+12% 90d)'], weight: 0.15 },
      engagementDecay: { score: 65, signals: ['Active last 14 days'], weight: 0.20 },
      skillDiversification: { score: 78, signals: ['Added Rust to portfolio'], weight: 0.15 },
      companyHealth: { score: 60, signals: ['No layoff signals'], weight: 0.15 },
      tenureRisk: { score: 70, signals: ['2.5yr current tenure'], weight: 0.15 },
      profileOptimization: { score: 82, signals: ['Bio updated recently'], weight: 0.10 },
      sentimentShift: { score: 55, signals: ['Neutral commit tone'], weight: 0.10 },
    },
    computedAt: new Date().toISOString(),
    dataSourcesSummary: ['github'],
    demo: true,
  },
  // Add 4 more demo candidates here
};

// At top of GET handler:
const demoData = DEMO_READINESS[id];
if (demoData) {
  return NextResponse.json({ candidateId: id, ...demoData });
}
```

### 1.5 Skill normalization: Airflow, dbt return 0 matches
**File:** `lib/search/skillNormalizer.ts`
**Problem:** Gemini returns "Apache Airflow", "dbt" verbatim. These don't match any alias in `SKILL_ALIASES`, so GitHub search returns 0 results.
**Fix:** Add aliases to the `SKILL_ALIASES` map:
```typescript
// In SKILL_ALIASES object:
'airflow': ['apache airflow', 'airflow', 'apache-airflow'],
'dbt': ['dbt', 'dbt-core', 'data build tool'],
'kafka': ['apache kafka', 'kafka', 'confluent kafka'],
'spark': ['apache spark', 'spark', 'pyspark'],
'flink': ['apache flink', 'flink'],
'bigquery': ['google bigquery', 'bigquery', 'bq'],
'redshift': ['amazon redshift', 'redshift', 'aws redshift'],
'snowflake': ['snowflake', 'snowflakedb'],
'databricks': ['databricks', 'delta lake'],
'elasticsearch': ['elasticsearch', 'elastic search', 'opensearch', 'elk'],
```
Also update `GITHUB_LANGUAGE_MAP` if any of these map to a GitHub-searchable language.

---

## Phase 2 — P1: Product Quality Issues (Day 1-2, ~5h)

### 2.1 Deep profile Match Score shows 0
**File:** Pipeline page — wherever the "deep profile" link is constructed
**Problem:** `/profile/[username]/deep` page receives no alignment score context.
**Fix:** Pass `alignmentScore` as a URL param when navigating to deep profile:
```typescript
router.push(`/profile/${username}/deep?alignmentScore=${candidate.alignmentScore}`);
```
And in the deep profile page, read it:
```typescript
const alignmentScore = parseInt(searchParams.get('alignmentScore') || '0');
```

### 2.2 Readiness badge buried on collapsed pipeline rows
**File:** `components/pipeline/CandidatePipelineItem.tsx` (collapsed view)
**Problem:** Readiness level ("cold/warm/hot") is buried in the "Outreach Timing" button text. Not visible as a distinct badge.
**Fix:** Add a small colored pill badge on the collapsed row next to the alignment score:
```typescript
// In collapsed row render, next to ScoreBadge:
{readinessScore && (
  <span className={cn(
    'text-xs px-2 py-0.5 rounded-full font-medium',
    readinessScore.level === 'hot' && 'bg-red-100 text-red-700',
    readinessScore.level === 'warm' && 'bg-orange-100 text-orange-700',
    readinessScore.level === 'warming' && 'bg-yellow-100 text-yellow-700',
    readinessScore.level === 'cold' && 'bg-slate-100 text-slate-600',
  )}>
    {readinessScore.level}
  </span>
)}
```

### 2.3 Pipeline demo log fires 3× per page load
**File:** `app/pipeline/page.tsx` — find the `useEffect` containing `"[Pipeline] Demo mode - loading real demo profiles"`
**Problem:** Effect runs multiple times due to missing or incorrect dependency array, or React StrictMode double-invoke.
**Fix:** Wrap the effect in a ref guard so it only executes once:
```typescript
const demoLoadedRef = useRef(false);
useEffect(() => {
  if (demoLoadedRef.current) return;
  demoLoadedRef.current = true;
  console.log('[Pipeline] Demo mode - loading real demo profiles');
  // ... rest of demo load logic
}, []); // Empty deps = run once
```

### 2.4 CSS preload warning ×15 per page
**File:** `app/layout.tsx` or wherever Sentry/Next.js generates `<link rel="preload">` for CSS
**Problem:** A CSS file is preloaded but not used within a few seconds, causing console warnings.
**Fix:** Search for the errant preload link:
```bash
grep -r 'rel="preload"' app/ public/ --include="*.tsx" --include="*.html"
```
Remove the specific `<link rel="preload" as="style" ...>` that generates the warning. If it's Sentry-generated, add `disableLogger: true` (already set) and check Sentry config.

### 2.5 Language state leaks to English UI
**File:** `lib/adminContext.tsx` or wherever `recruitos_lang` is read
**Problem:** Language persists from a previous session. First-time users may see Danish UI.
**Fix:** Set language default based on browser locale, not just localStorage:
```typescript
const [lang, setLang] = useState<'en' | 'da'>(() => {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('recruitos_lang');
  if (stored === 'en' || stored === 'da') return stored;
  // Default: browser preference, fallback to English
  return navigator.language.startsWith('da') ? 'da' : 'en';
});
```

---

## Phase 3 — Critical Security (Day 2-3, ~6h)

### 3.1 Add auth guard to unauthenticated AI endpoints
**Files:** `app/api/ai/compare/route.ts`, `app/api/calibration/route.ts`
**Fix:** Add `requireAuth()` at the start of each POST handler:
```typescript
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  // ... rest of handler
}
```

### 3.2 Sanitize candidate data before AI prompt interpolation
**File:** `services/geminiService.ts` and `services/ai/outreach.ts`
**Problem:** Candidate name, role, company are interpolated directly into prompts — prompt injection risk.
**Fix:** Add a sanitization helper:
```typescript
function sanitizeForPrompt(value: string | undefined, maxLen = 200): string {
  if (!value) return 'Unknown';
  return value
    .replace(/[\r\n]+/g, ' ')     // No newlines (key injection vector)
    .replace(/[<>{}[\]`]/g, '')    // No template-breaking chars
    .trim()
    .slice(0, maxLen);
}
```
Apply to all candidate field interpolations in `generateOutreach()`, `generateDeepProfile()`, `analyzeCandidateProfile()`.

### 3.3 Team service authorization — add role checks
**File:** `services/teamService.ts`
**Problem:** `inviteMember()`, `addCandidateToPipeline()`, `updateCandidateStage()`, `getPipelineCandidates()` don't verify the caller has access to the target team.
**Fix:** Add ownership check before mutations:
```typescript
async function verifyTeamMembership(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  requiredRole?: 'admin' | 'recruiter' | 'viewer'
): Promise<boolean> {
  const { data } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single();
  if (!data) return false;
  if (requiredRole === 'admin') return data.role === 'admin';
  if (requiredRole === 'recruiter') return ['admin', 'recruiter'].includes(data.role);
  return true; // any member
}

// Call at start of each mutation:
const isMember = await verifyTeamMembership(supabase, input.teamId, userId, 'recruiter');
if (!isMember) return { success: false, error: 'Forbidden' };
```

### 3.4 Remove client API key acceptance from BrightData routes
**Files:** `app/api/brightdata/route.ts`, `trigger/route.ts`, `progress/route.ts`, `snapshot/route.ts`
**Fix:** In each file, remove the client key fallback:
```typescript
// BEFORE (WRONG):
const apiKey = process.env.BRIGHTDATA_API_KEY || clientApiKey;

// AFTER (CORRECT):
const apiKey = process.env.BRIGHTDATA_API_KEY;
if (!apiKey) {
  return NextResponse.json({ error: 'BrightData not configured' }, { status: 503 });
}
// Also: do not destructure or use clientApiKey from request body
```

### 3.5 Rework demo mode to use trusted server-side check
**Context:** The `x-demo-mode: true` header is client-controlled, making it a security bypass. However, the outreach demo flow NEEDS demo mode. The correct solution is to use a trusted signal.
**Fix:** Replace header check with session email OR env-based demo flag:
```typescript
// lib/demo.ts — shared helper
export function isDemoRequest(
  session: Session | null,
  searchParams?: URLSearchParams
): boolean {
  // Trusted: server-set demo user email
  if (session?.user?.email === process.env.DEMO_USER_EMAIL) return true;
  // Trusted: server-side env flag (for test/staging envs only)
  if (process.env.ENABLE_DEMO_MODE === 'true' &&
      searchParams?.get('demo') === process.env.DEMO_SECRET_TOKEN) return true;
  return false;
}
```
Remove the `request.headers.get('x-demo-mode') === 'true'` check from all routes.

### 3.6 Auth guard for ?deep=true parameter
**File:** `app/api/developers/[username]/route.ts`
**Fix:**
```typescript
const isDeepRequest = request.nextUrl.searchParams.get('deep') === 'true';
if (isDeepRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required for deep profile' }, { status: 401 });
  }
}
```

### 3.7 Disable dev-only readiness test endpoint in production
**File:** `app/api/readiness-test/route.ts`
**Fix:**
```typescript
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  // ... existing handler
}
```

### 3.8 Add expiration to shared profiles
**File:** `app/api/shared-profile/[id]/route.ts` and the POST route that creates them
**Fix:** Add `expires_at` column (24h TTL) to shared profiles, check in GET handler:
```typescript
// In GET handler:
if (profile.expires_at && new Date(profile.expires_at) < new Date()) {
  return NextResponse.json({ error: 'Link expired' }, { status: 410 });
}
// In POST handler (create):
expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
```

---

## Phase 4 — Type Safety & Code Quality (Day 3-4, ~5h)

### 4.1 Fix Stripe env var non-null assertion
**File:** `lib/stripe.ts:148`
**Fix:**
```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}
// Use webhookSecret (not process.env...) below
```

### 4.2 Fix unsafe auth session type casts
**File:** `lib/auth.ts`
**Fix:** Use NextAuth module augmentation instead of `as any`:
```typescript
// types/next-auth.d.ts (create this file)
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken?: string;
  }
}
```
Then in `lib/auth.ts`, remove the `(session.user as any).id = ...` casts — TypeScript will now accept `session.user.id`.

### 4.3 Fix Supabase silent null returns
**Files:** `lib/supabase/client.ts`, `lib/supabase/server.ts`
**Fix:** Log which env var is missing:
```typescript
if (!supabaseUrl || !supabaseKey) {
  const missing = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean);
  console.warn(`[Supabase] Not initialized — missing: ${missing.join(', ')}`);
  return null;
}
```

### 4.4 Remove `as any` in GitHub and scraping services
**Files:** `lib/github.ts`, `services/scrapingService.ts`, `services/unifiedEnrichment.ts`
**Fix (github.ts):** Replace `extractSkills(repos.data as any)` — define proper type for the repos response using Octokit's response types.
**Fix (scrapingService.ts):** Replace `(finalProfile as any).enrichmentSources = ...` — extend the `BrightDataProfile` interface to include `enrichmentSources?: string[]` and `enrichmentUrls?: string[]`.
**Fix (unifiedEnrichment.ts):** Type `computeBuildprint` parameter with the actual GitHub data shape instead of `any`.

### 4.5 Fix behavioralSignalsService dead code
**File:** `services/behavioralSignalsService.ts:730`
**Problem:** Both branches of a ternary return `'neutral'`.
**Fix:** Implement the actual readiness classification:
```typescript
// BEFORE (dead code):
approachReadiness: engagementRecency === 'active' ? 'neutral' : 'neutral',

// AFTER (actual logic):
approachReadiness: engagementRecency === 'active' && activityScore > 60
  ? 'ready'
  : engagementRecency === 'dormant'
  ? 'not_ready'
  : 'neutral',
```

### 4.6 Fix geminiService JSON parsing gaps
**File:** `services/geminiService.ts`
**Fix:**
1. Wrap second `JSON.parse` in `parseJsonSafe` fallback at line 510 (use `parseJsonSafe()` instead of `JSON.parse()`)
2. Add outer try-catch to `parseJsonSafe()` so second parse failure is caught
3. Add null check in `calculateScore()` before accessing `breakdown` fields

### 4.7 Validate environment variables at startup
**File:** Create `lib/env.ts`
**Fix:**
```typescript
const REQUIRED_ENV = ['NEXTAUTH_SECRET', 'GEMINI_API_KEY', 'FIRECRAWL_API_KEY'] as const;
const OPTIONAL_ENV = ['BRIGHTDATA_API_KEY', 'OPENROUTER_API_KEY', 'STRIPE_SECRET_KEY'] as const;

export function validateEnv() {
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  const missingOptional = OPTIONAL_ENV.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`[Env] Optional vars not set (features may be disabled): ${missingOptional.join(', ')}`);
  }
}
```
Call from `app/api/health/route.ts` and a Next.js instrumentation file.

---

## Phase 5 — Tests & CI (Day 4-6, ~8h)

### 5.1 Fix ESLint in CI pipeline
**File:** `.github/workflows/ci.yml`
**Problem:** `eslint` package not found.
**Fix:** Ensure `npm ci` installs eslint and use the project's configured eslint:
```yaml
- name: Lint
  run: npm run lint
  # Remove any custom eslint installation step that may conflict
```
Also verify `eslint.config.js` or `.eslintrc.json` is correct for ESLint 9.

### 5.2 Make security scans blocking
**File:** `.github/workflows/ci.yml`
**Fix:** Remove `continue-on-error: true` from security scan steps, OR add a threshold:
```yaml
- name: Security audit
  run: npm audit --audit-level=high
  # Remove continue-on-error
- name: Secret scanning
  run: trufflehog git file://. --since-commit HEAD --fail
  # Remove continue-on-error
```

### 5.3 Add coverage thresholds
**File:** `vitest.config.ts`
**Fix:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'tests/', '*.config.ts', '*.config.js'],
  thresholds: {
    lines: 70,
    branches: 65,
    functions: 70,
    statements: 70,
  },
},
```

### 5.4 Add tests for 10 highest-risk untested API routes
**Files to create in `tests/api/`:**

Priority order:
1. `outreach.test.ts` — test auth, demo mode, message generation, credit deduction
2. `credits.test.ts` — test deduct, consume, balance operations
3. `profile-analyze.test.ts` — test scoring, credit charging, error paths
4. `ai-compare.test.ts` — test auth guard (added in Phase 3), comparison logic
5. `candidates-crud.test.ts` — test GET/PATCH/DELETE /api/candidates/[id]
6. `calibration.test.ts` — test auth guard, Firecrawl mock, Gemini mock
7. `shared-profile.test.ts` — test create, get, expiration
8. `brightdata.test.ts` — test that client API keys are rejected (regression for Phase 3 fix)
9. `team.test.ts` — test role authorization (regression for Phase 3 fix)
10. `checkout.test.ts` — test Stripe session creation, webhook handling

Each test file should follow the pattern in `tests/api/search.test.ts`:
- Mock external dependencies (Gemini, Stripe, GitHub)
- Test happy path + auth failure + validation failure + external service failure
- Use `vi.mock()` for all external calls

### 5.5 Add integration test for scoring flow
**File:** `tests/integration/scoring-flow.test.ts`
Test the full: Job intake → Gemini extraction → GitHub search → Profile analyze → Credit deduction flow with all services mocked.

### 5.6 Report coverage in CI
**File:** `.github/workflows/ci.yml`
Add coverage upload to the test job:
```yaml
- name: Run tests with coverage
  run: npx vitest run --coverage
- name: Upload coverage
  uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
```

---

## Phase 6 — Accessibility & Polish (Day 6-7, ~4h)

### 6.1 Header navigation accessibility
**File:** `components/Header.tsx`
**Fix:**
```typescript
// Language toggle buttons — add aria-label and aria-pressed:
<button onClick={() => setLang('en')} aria-label="Switch to English" aria-pressed={lang === 'en'}>
<button onClick={() => setLang('da')} aria-label="Skift til dansk" aria-pressed={lang === 'da'}>

// Mobile menu toggle — add aria-label and aria-expanded:
<button
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
  aria-expanded={isMenuOpen}
>

// Dropdown triggers — add aria-haspopup:
<button aria-haspopup="menu" aria-expanded={isDropdownOpen}>
```

### 6.2 Skip to main content link
**File:** `app/layout.tsx`
**Fix:** Add before `<Header>`:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2
             bg-background text-foreground px-4 py-2 rounded-md z-50"
>
  Skip to main content
</a>
```
Add `id="main-content"` to the `<main>` element.

### 6.3 Focus management in expandable cards
**File:** `components/pipeline/CandidatePipelineItem.tsx`
**Fix:** When card expands, move focus to the content:
```typescript
const contentRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (isExpanded && contentRef.current) {
    contentRef.current.focus();
  }
}, [isExpanded]);

// In JSX:
<div ref={contentRef} tabIndex={-1} className="focus:outline-none">
  {/* expanded content */}
</div>
```

### 6.4 Rate limiting on AI endpoints
**File:** `middleware.ts` (already has rate limiting infrastructure)
**Fix:** Ensure `getRateLimitForPath()` applies stricter limits to AI routes:
```typescript
function getRateLimitForPath(path: string): { limit: number; window: number } {
  if (path.startsWith('/api/outreach')) return { limit: 10, window: 60 }; // 10/min
  if (path.startsWith('/api/profile/analyze')) return { limit: 20, window: 60 };
  if (path.startsWith('/api/ai')) return { limit: 15, window: 60 };
  if (path.startsWith('/api/brightdata')) return { limit: 5, window: 60 };
  if (path.startsWith('/api/search')) return { limit: 30, window: 60 };
  return { limit: 100, window: 60 }; // default
}
```

### 6.5 AbortController in async hooks
**File:** `hooks/useCandidates.ts`
**Fix:**
```typescript
const backgroundRefresh = useCallback(async () => {
  const controller = new AbortController();
  try {
    const result = await candidateService.fetchAll(filtersRef.current, { signal: controller.signal });
    if (!isMountedRef.current) return;
    // ... update state
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return;
    // ... handle error
  }
  return () => controller.abort();
}, [filtersKey]);
```

### 6.6 Stripe idempotency keys
**File:** `lib/stripe.ts`
**Fix:** Add idempotency key to checkout session creation:
```typescript
import { createHash } from 'crypto';

const idempotencyKey = createHash('sha256')
  .update(`${userId}-${priceId}-${Date.now().toString().slice(0, -3)}`) // per-minute bucket
  .digest('hex');

const session = await stripe.checkout.sessions.create({
  // ... existing params
}, { idempotencyKey });
```

---

## Execution Order (Gantt Summary)

```
Day 1: Phase 1 (P0 Demo fixes) + Phase 2 (P1 Product issues)
Day 2: Phase 3 (Security: auth guards, prompt sanitization, team authz)
Day 3: Phase 3 continued (BrightData, demo mode, shared profiles) + Phase 4 start
Day 4: Phase 4 (Type safety, code quality)
Day 5: Phase 5 (CI fixes + first 5 API route tests)
Day 6: Phase 5 continued (remaining 5 route tests + integration test)
Day 7: Phase 6 (Accessibility, rate limiting, polish)
```

## Files Changed Summary

| Phase | Files Modified | Files Created |
|-------|--------------|---------------|
| 1 (Demo P0) | `app/api/outreach/route.ts`, `app/api/candidates/[id]/readiness/route.ts`, `app/analyse/page.tsx`, `lib/search/skillNormalizer.ts` + outreach frontend component | None |
| 2 (P1 Product) | `components/pipeline/CandidatePipelineItem.tsx`, `app/pipeline/page.tsx`, `app/profile/[username]/deep/page.tsx`, lang context | None |
| 3 (Security) | `app/api/ai/compare/route.ts`, `app/api/calibration/route.ts`, `services/teamService.ts`, `app/api/brightdata/*.ts` (4 files), `app/api/outreach/route.ts`, `app/api/developers/[username]/route.ts`, `app/api/readiness-test/route.ts`, `app/api/shared-profile/[id]/route.ts` | `lib/demo.ts` |
| 4 (Type safety) | `lib/stripe.ts`, `lib/auth.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/github.ts`, `services/scrapingService.ts`, `services/unifiedEnrichment.ts`, `services/behavioralSignalsService.ts`, `services/geminiService.ts` | `types/next-auth.d.ts`, `lib/env.ts` |
| 5 (Tests) | `.github/workflows/ci.yml`, `vitest.config.ts` | 11 test files |
| 6 (Polish) | `components/Header.tsx`, `app/layout.tsx`, `components/pipeline/CandidatePipelineItem.tsx`, `middleware.ts`, `hooks/useCandidates.ts`, `lib/stripe.ts` | None |

**Total: ~35 files modified, ~13 files created**

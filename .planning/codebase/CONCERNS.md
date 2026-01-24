# Codebase Concerns

**Analysis Date:** 2026-01-24

## Tech Debt

**Disabled Testing Infrastructure:**
- Issue: Vitest configuration backed up as `vitest.config.ts.bak` - test infrastructure not active
- Files: `vitest.config.ts.bak`, `package.json` (no test scripts)
- Tests exist in `tests/` directory but cannot run
- Impact: No automated test safety net; regressions go undetected; 170+ console.log statements in services make debugging difficult
- Fix approach: Restore vitest config, add test scripts to package.json, implement CI test runs in GitHub Actions

**Excessive Console Logging:**
- Issue: 170+ `console.log()` calls across services for debugging; no structured logging framework
- Files: `services/geminiService.ts`, `services/scrapingService.ts`, `services/enrichmentServiceV2.ts`, etc.
- Impact: Production logs polluted with debug output; difficult to identify real issues; security risk (sensitive data may leak in logs)
- Fix approach: Implement structured logging service (`logger.ts` exists but minimal), replace console.log with logger calls, remove dev-only logs

**Large Component Files:**
- Issue: Pages exceed acceptable size for maintainability
- Files: `app/profile/[username]/deep/page.tsx` (93KB), `app/pipeline/page.tsx` (49KB)
- Impact: Components difficult to test, reason about, and modify; high cognitive load
- Fix approach: Break into smaller composed components (separate search form, results grid, detail panels)

**Unmodeled API Key Handling:**
- Issue: API keys loaded from localStorage in client-side services; duplicated across multiple services
- Files: `services/geminiService.ts`, `services/behavioralSignalsService.ts`, `services/enrichmentServiceLegacy.ts`, `services/networkAnalysisService.ts`
- Each service implements identical: `localStorage.getItem('KEY_NAME') || process.env.KEY_NAME`
- Impact: Code duplication; security vulnerability (XSS can steal keys from localStorage); keys exposed in client bundles
- Fix approach: Create centralized `services/config.ts` for all API key retrieval; migrate to server-side proxies for sensitive operations

## Known Bugs

**Incomplete Team Features:**
- Issue: Email invitations not implemented
- Files: `app/api/team/[teamId]/members/route.ts` (line 320)
- Symptoms: Team member invitations silently fail; no email sent to invited users
- Trigger: User invites team member via API
- Workaround: None - feature incomplete
- Fix approach: Implement email sending (via SendGrid/Resend), store invitation tokens, create /api/team/invite/[token] endpoint

**Unhandled JSON Parsing Errors:**
- Issue: 154 instances of `JSON.parse()` without try-catch in critical paths
- Files: `services/citedEvidenceService.ts`, `services/enrichmentServiceLegacy.ts`, `services/ai/profiling.ts`, `candidateService.ts`
- Symptoms: Silent failures when API returns malformed JSON; app state corruption
- Trigger: API returns invalid JSON (truncated response, API error as HTML)
- Workaround: Manual browser refresh
- Fix approach: Wrap all JSON.parse in try-catch; validate response schemas before parsing using Zod

**Missing Input Validation on Page Parameters:**
- Issue: Dynamic route parameters not validated
- Files: `app/profile/[username]/page.tsx`, `app/profile/[username]/deep/page.tsx`
- Symptoms: Invalid usernames accepted; 404 pages with confusing error states
- Trigger: Direct URL with special characters (e.g., `/profile/<script>`)
- Workaround: None
- Fix approach: Add Zod validation in route handlers; sanitize username parameter before API calls

**Integer Parsing Without Validation:**
- Issue: `parseInt()` without validation or bounds checking
- Files: `app/api/search/route.ts` (lines 9-10), `app/api/team/[teamId]/pipelines/route.ts` (lines 47-48)
- Symptoms: Invalid page/limit values accepted (NaN, negative); potential DoS via large `perPage` values
- Trigger: Malicious query params: `?page=abc` or `?limit=999999999`
- Workaround: None
- Fix approach: Use Zod schema validation: `z.string().pipe(z.coerce.number().int().positive().max(1000))`

## Security Considerations

**API Key Exposure via localStorage:**
- Risk: localStorage keys vulnerable to XSS; client-side code can steal user API keys
- Files: `services/geminiService.ts` (line 23), `services/scrapingService.ts`, multiple service files
- Current mitigation: .env.example notes the risk
- Recommendations:
  1. Move API calls to server-side endpoints only
  2. Use Stripe-style proxy: client → backend → external API
  3. Implement CSRF tokens for state-changing operations
  4. Add Content-Security-Policy headers to block inline scripts

**GitHub OAuth Token Handling:**
- Risk: `session.accessToken` cast as `any` without verification
- Files: `app/api/search/route.ts` (line 22), `app/api/team/[teamId]/members/route.ts` (line 65)
- Current mitigation: None
- Recommendations:
  1. Type-safe session extraction: `session satisfies { accessToken: string }`
  2. Validate token exists before use
  3. Implement token refresh mechanism for expired tokens
  4. Store tokens in httpOnly cookies, never in localStorage

**Unauthenticated API Endpoints:**
- Risk: Some endpoints missing authentication checks
- Files: `app/api/developers/[username]/route.ts` (public profile access), `app/api/search/route.ts` (no auth required)
- Current mitigation: Partial - `/search` checks for higher rate limits with auth, but allows unauthenticated access
- Recommendations:
  1. Implement rate limiting middleware for unauthenticated routes
  2. Add opt-in rate limiting per endpoint
  3. Return 429 when limits exceeded, with Retry-After header

**Supabase Row-Level Security Disabled:**
- Risk: Mock data returned when Supabase unavailable; no RLS validation
- Files: `app/api/team/[teamId]/members/route.ts` (lines 6-34)
- Current mitigation: Limited - checks team membership but returns mock data
- Recommendations:
  1. Enforce RLS policies in Supabase
  2. Return 503 instead of mock data when DB unavailable
  3. Implement request signing to verify Supabase access

## Performance Bottlenecks

**Unoptimized GitHub API Calls:**
- Problem: Multiple sequential GitHub API calls in connection path analysis
- Files: `services/githubConnectionService.ts` (lines 81-300+)
- Cause: Pagination loops (lines 84-99) and multiple user/repo fetches without batch querying
- Improvement path:
  1. Use GitHub GraphQL for batch queries instead of REST pagination
  2. Cache follower lists (invalidate weekly)
  3. Implement early termination when connection found (currently exhausts all data)

**Blocking Promise.all() Without Error Isolation:**
- Problem: Promise.all fails entirely if one promise rejects
- Files: `app/api/profile/analyze/route.ts` (line 38), `app/api/outreach/route.ts` (line 197)
- Cause: Network failures in parallel requests fail entire operation
- Improvement path:
  1. Use Promise.allSettled instead
  2. Implement partial success handling
  3. Return 202 with status tracking for async operations

**Large localStorage Serialization:**
- Problem: Entire candidate list serialized to JSON on every update
- Files: `services/candidateService.ts` (lines 21-28)
- Cause: `JSON.stringify()` on full array without pagination
- Impact: localStorage quota exceeded at 1000+ candidates; synchronous operation blocks UI
- Improvement path:
  1. Use IndexedDB for local storage instead of localStorage
  2. Implement incremental sync (only dirty records)
  3. Lazy-load candidate details on demand

**No Query Result Pagination:**
- Problem: Search results unbounded; all results fetched at once
- Files: `app/api/search/route.ts` returns full GitHub search result set
- Impact: Large result sets timeout; UI renders thousands of candidates
- Improvement path:
  1. Default limit to 50, add explicit pagination
  2. Implement cursor-based pagination for GitHub API
  3. Add virtual scrolling to UI for large lists

## Fragile Areas

**Deep Profile Generation (Stage 3):**
- Files: `app/api/profile/analyze/route.ts`, `app/profile/[username]/deep/page.tsx`
- Why fragile: Complex multi-step analysis (persona → candidate analysis → deep profile → network dossier); any step failure crashes entire profile view
- Symptoms: Missing interview guides, incomplete evidence tracking, no fallback UI
- Safe modification: Implement circuit breaker pattern; return partial results on non-critical failures; add error boundaries in UI
- Test coverage: Gaps - no tests for dossier generation failure scenarios

**GitHub Connection Path Analysis:**
- Files: `services/githubConnectionService.ts`, `app/api/github/connection-path/route.ts`
- Why fragile: Pagination loops with hardcoded `maxPages=5`; rate limit handling insufficient
- Symptoms: Incomplete connections found (if user has >500 followers); rate limit 429 crashes request
- Safe modification: Use exponential backoff with jitter; implement queue-based rate limiting; return best-effort partial results
- Test coverage: No tests for rate limit scenarios or pagination edge cases

**Behavioral Signals Service:**
- Files: `services/behavioralSignalsService.ts`
- Why fragile: Async polling for BrightData with no timeout mechanism
- Symptoms: Requests hang indefinitely; no maximum wait time
- Test coverage: TODOs in tests (lines 98, 102) - polling mocks not implemented
- Safe modification: Add 30s timeout; implement exponential backoff; graceful degradation if BrightData unavailable

**Team Collaboration Feature:**
- Files: `app/api/team/*`, `services/teamService.ts`
- Why fragile: Returns mock data when Supabase unavailable; no fallback state management
- Symptoms: Users unaware if data is real or mocked; team changes lost after refresh
- Safe modification: Distinguish mock state clearly; disable team features if DB unavailable; implement conflict-free replicated data type (CRDT) for offline support
- Test coverage: Gaps - no Supabase integration tests

## Scaling Limits

**Gemini API Quota:**
- Current capacity: Default free tier ~15 requests/day
- Limit: Hits after 15 concurrent profile analyses
- Scaling path: Implement queue-based request batching; use OpenRouter fallback; add per-user rate limits

**localStorage Size Quota:**
- Current capacity: ~5-10MB browser limit
- Limit: Exceeded at ~1000 candidates with full analysis data
- Scaling path: Migrate to IndexedDB (quota 50MB+); implement lazy-loading of candidate details

**GitHub API Rate Limits:**
- Current capacity: 60 req/hour unauthenticated, 5000 req/hour authenticated
- Limit: Exceeded during connection path analysis for >200 follower users
- Scaling path: Implement request caching; use GraphQL batching; queue bulk requests with exponential backoff

**Firecrawl Concurrency:**
- Current capacity: Default tier ~30 requests/hour
- Limit: Job description scraping blocks on rate limit (no queue)
- Scaling path: Implement job queue (Bull/RabbitMQ); add per-user daily limits; cache job descriptions by URL

## Dependencies at Risk

**@google/genai Package:**
- Risk: Versioned at `^1.36.0`; Gemini API evolving rapidly; breaking changes expected
- Impact: Response schemas may change; structured output format may break
- Migration plan: Pin version to `1.36.0` in production; implement response schema validation layer; fallback to OpenRouter if Gemini unavailable

**next-auth v4:**
- Risk: v5 released; v4 enters maintenance mode; GitHub OAuth may need updates
- Impact: Security patches backported only to v5; OAuth token refresh may break
- Migration plan: Plan upgrade to next-auth v5 (breaking changes to session types); add feature flags for gradual rollout

**@octokit/rest:**
- Risk: REST API deprecated in favor of GraphQL; endpoints may be removed
- Impact: GitHub API calls may fail with 404
- Migration plan: Implement GraphQL client alongside REST; batch queries for follower/repo data

**recharts:**
- Risk: SVG rendering performance degrades with >1000 data points
- Impact: Dashboard charts freeze on large result sets
- Migration plan: Use canvas-based chart library (nivo/visx); implement data sampling for large datasets

## Missing Critical Features

**Audit Logging (EU AI Act Compliance):**
- Problem: No immutable audit log for profiling decisions; required by EU AI Act
- Blocks: Cannot demonstrate decision justification; compliance violations
- Impact: Legal liability; cannot defend algorithmic bias claims
- Fix approach: Implement immutable event store (`schema: audit_events`); log all profile analyses with evidence

**Transparent Data Handling:**
- Problem: No data retention policy; unclear how long candidate data stored
- Blocks: GDPR compliance; users cannot request data deletion
- Impact: Data protection violations; user trust erosion
- Fix approach: Add GDPR-compliant data export/deletion endpoints; implement 90-day retention policy

**Error Recovery (Retry Logic):**
- Problem: Failed API calls not retried; user must manually re-trigger
- Blocks: Large-scale usage; poor UX on flaky networks
- Impact: High failure rate for bulk operations
- Fix approach: Implement exponential backoff in critical paths; add retry UI prompts; use job queue for async operations

**Rate Limit Headers:**
- Problem: No X-RateLimit-Remaining/Reset headers returned to client
- Blocks: Client cannot proactively delay requests; users hit limits unexpectedly
- Impact: User frustration; poor API experience
- Fix approach: Proxy rate limit headers from GitHub/Gemini to client; implement client-side rate limit awareness

## Test Coverage Gaps

**Profile Analysis Pipeline:**
- What's not tested: Error scenarios when Gemini returns invalid JSON; partial failures in multi-step analysis; timeout handling
- Files: `app/api/profile/analyze/route.ts`, no corresponding test file
- Risk: Silent failures cascade through system; users see empty profiles without error indication
- Priority: High - critical user-facing feature

**GitHub Connection Path Service:**
- What's not tested: Rate limit 429 responses; pagination edge cases (users with exactly 500 followers); circular following relationships
- Files: `services/githubConnectionService.ts`, test file exists but TODOs indicate incomplete mocks
- Risk: Incomplete connection data serves silently; bridge connections missed
- Priority: High - feature presented as reliable connection mapping

**Behavioral Signals Service:**
- What's not tested: Async polling timeout; BrightData API errors; LinkedIn profile parsing edge cases
- Files: `services/behavioralSignalsService.ts` (test file has TODO comments on lines 98, 102)
- Risk: Async operations hang; signals marked present when data unavailable
- Priority: Medium - affects signal quality but not critical

**Input Validation:**
- What's not tested: SQL injection patterns in dynamic query building; XSS in user-provided content; integer overflow in pagination
- Files: `app/api/search/route.ts`, `app/api/team/[teamId]/pipelines/route.ts`
- Risk: Security vulnerabilities; unexpected app behavior with adversarial input
- Priority: High - public-facing API endpoints

**Team Feature:**
- What's not tested: Permission checks; row-level security bypasses; concurrent updates to shared pipelines
- Files: `app/api/team/*`, mock data returned when DB unavailable
- Risk: Unauthorized access to team data; data corruption during concurrent edits
- Priority: Medium - feature incomplete (missing email invitations)

---

*Concerns audit: 2026-01-24*

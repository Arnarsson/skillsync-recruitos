# Codebase Concerns

**Analysis Date:** 2026-02-16

## Tech Debt

**Large Page Components:**
- Issue: Monolithic component files without decomposition causing bundle bloat and maintenance burden
- Files:
  - `app/profile/[username]/deep/page.tsx` (2348 lines)
  - `app/pipeline/page.tsx` (2175 lines)
  - `app/profile/[username]/page.tsx` (1284 lines)
  - `app/search/page.tsx` (1231 lines)
- Impact: Slow initial page load, poor mobile performance, increased Time to Interactive (TTI), difficult to test individual features
- Fix approach: Extract components using React.lazy() and dynamic imports, split into smaller feature-specific modules

**Incomplete Analytics Implementation:**
- Issue: EventTracker and MetricsService have TODO comments indicating Prisma schema models are missing
- Files:
  - `lib/analytics/eventTracker.ts` (lines 50, 63, 79)
  - `lib/analytics/metricsService.ts` (lines 5, 34, 78, 106, 133)
- Impact: Event tracking logs to console only, no persistence, funnel analytics unavailable
- Fix approach: Add FunnelEvent and CandidateStatus models to Prisma schema and run migrations

**Excessive `any` Type Usage:**
- Issue: 98+ instances of `: any` type annotations bypass TypeScript safety
- Files:
  - `lib/brightdata.ts` (9 instances)
  - `app/profile/[username]/deep/page.tsx` (3 instances)
  - `lib/github.ts`, API routes, services (multiple)
- Impact: Runtime errors from undefined properties, poor IDE autocomplete, difficult refactoring
- Fix approach: Define proper interfaces for external API responses (BrightData, GitHub), use `unknown` for error handling instead of `any`

**Unused Imports and Variables:**
- Issue: 55+ unused imports/variables left in code
- Files: Multiple across codebase
- Impact: Code bloat, potential for accidental use
- Fix approach: Run `eslint --fix` to auto-remove (can be automated)

**API Keys in localStorage - XSS Risk:**
- Issue: API keys retrieved from localStorage as fallback, confirmed XSS exposure vector
- Files: Multiple AI service client initialization patterns
- Impact: If XSS occurs, attacker gains full access to Gemini API, OpenRouter, and other services
- Fix approach: Move all API keys to server-side only (Phase 0.2 priority), never store in client-side storage

## Known Bugs

**React useState in useEffect (9 instances):**
- Symptoms: Cascading renders, potential state reset issues, performance degradation
- Files:
  - `app/dashboard/page.tsx:67`
  - `app/profile/[username]/page.tsx:72,278`
  - `components/OnboardingWrapper.tsx:18`
  - `components/pipeline/CandidatePipelineItem.tsx:118`
  - `lib/adminContext.tsx:21`
  - `lib/i18n/LanguageContext.tsx:58`
- Trigger: Components mount with effects calling setState
- Workaround: Use lazy initializer pattern with localStorage reads instead of effect-based initialization
- Status: Documented in Phase 2 research, awaiting fix

**Components Created During Render (4 instances):**
- Symptoms: State loss on re-render, infinite re-render loops possible, poor performance
- Files:
  - `components/search/SearchFilters.tsx:162,538,571` (FilterContent component defined inside render)
- Trigger: Parent component re-renders
- Workaround: Move component definition outside parent
- Status: Documented in Phase 2 research

**Immutability Violations (3 instances):**
- Symptoms: ESLint errors, poor practice patterns
- Files: `app/pricing/page.tsx:37,43,63` (window.location.href assignments)
- Trigger: Navigation from component
- Workaround: Use Next.js useRouter instead of direct window.location assignment
- Status: Partially fixed in Phase 2

**Ref Access During Render:**
- Symptoms: Potential issues with React concurrent features and strict mode
- Files: `hooks/usePersistedState.ts:8`
- Trigger: Reading ref.current in useState initializer
- Status: Documented in Phase 2 research

## Security Considerations

**Exposed Credentials in Version Control:**
- Risk: Database compromise, service impersonation, financial loss
- Files: `.env` (if previously committed to git history)
- Current mitigation: `.gitignore` correctly excludes `.env*`
- Recommendations:
  1. Verify no secrets in git history: `git log --all -- .env`
  2. Rotate all exposed credentials (POSTGRES_PASSWORD, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY)
  3. Move secrets to Vercel Environment Variables only
  4. Implement env validation at runtime using `@t3-oss/env-nextjs`

**Authentication Bypass in Demo Mode:**
- Risk: Unauthenticated access to `/pipeline`, `/settings`, `/team` routes
- Files: `middleware.ts:133-142`
- Current mitigation: Only enabled for demo period
- Recommendations: Re-enable authentication checks immediately after demo, use feature flags instead of comments, implement time-based expiration

**XSS via dangerouslySetInnerHTML:**
- Risk: If user-generated content (candidate notes, LinkedIn text) is rendered with dangerouslySetInnerHTML, XSS becomes possible
- Files: `app/layout.tsx:75`, `app/guides/technical-recruiting/page.tsx:49` (currently safe with JSON-LD schema)
- Current mitigation: Currently used only for JSON-LD (safe data)
- Recommendations:
  1. Install DOMPurify: `npm install dompurify isomorphic-dompurify`
  2. Create sanitization utility and ban raw dangerouslySetInnerHTML in ESLint
  3. Audit all instances of `rawProfileText`, `content` fields from database

**Weak Session Secret:**
- Risk: Compromised JWT session tokens
- Files: `lib/auth.ts:95`
- Current mitigation: Uses environment variable
- Recommendations: Validate NEXTAUTH_SECRET is 32+ characters at startup, throw error if invalid

**Rate Limiting Only In-Memory:**
- Risk: Ineffective under distributed load on Vercel (each invocation isolated)
- Files: `lib/rate-limit.ts:12-25`
- Current mitigation: In-memory Map (works for single-instance dev)
- Recommendations: Use Upstash Redis for distributed rate limiting

**Missing CSRF Protection:**
- Risk: State-changing API routes lack explicit CSRF token validation
- Files: All POST/PATCH/DELETE routes in `app/api/`
- Current mitigation: SameSite cookies configured via middleware
- Recommendations: Add explicit CSRF token validation for critical operations

**GitHub Token Stored in Plain Text:**
- Risk: Database breach exposes OAuth tokens
- Files: `prisma/schema.prisma:14` (User.githubToken)
- Current mitigation: Encrypted at rest by database provider
- Recommendations: Implement application-level encryption for defense in depth

## Performance Bottlenecks

**Large Bundle Size (2.3GB total):**
- Problem: `.next/` directory 1.1GB, `node_modules/` 1.2GB. Pages bundle all UI logic without code splitting
- Files:
  - `app/profile/[username]/deep/page.tsx` (2348 lines)
  - `app/pipeline/page.tsx` (2175 lines)
  - `app/search/page.tsx` (1231 lines)
- Cause: Monolithic page components, no lazy loading of charts/visualizations
- Improvement path:
  1. Use React.lazy() for components: `const PipelineKanban = React.lazy(() => import('@/components/pipeline/PipelineKanban'))`
  2. Dynamic imports for recharts: `dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })`
  3. Analyze bundle with `@next/bundle-analyzer`

**Inefficient React Hook Dependencies:**
- Problem: Complex dependency arrays cause unnecessary re-renders and API calls
- Files: `app/search/page.tsx:142-178`, `app/pipeline/page.tsx:150-300`
- Cause: 309 React hooks across codebase, many with overly broad dependencies
- Improvement path:
  1. Use useMemo for expensive computed values
  2. Implement debouncing on search inputs
  3. Consider React Query for API state management (eliminates manual useEffect)

**No API Response Caching:**
- Problem: Every request hits database or external APIs without caching
- Files: All routes in `app/api/`
- Cause: No cache headers or Vercel KV caching implemented
- Improvement path:
  1. Add cache headers to GET routes: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
  2. Implement Vercel KV caching for frequently accessed data (candidates, GitHub profiles)

**Missing Query Optimizations (N+1 Risk):**
- Problem: Some Prisma queries don't include relationships, may trigger N+1 when accessed in loops
- Files: `app/api/candidates/[id]/route.ts`, `app/api/candidates/route.ts`
- Cause: Missing eager loading with `include` for related data
- Improvement path:
  1. Add pagination to notes: `take: 50, skip: offset`
  2. Implement result caching for frequently accessed candidates
  3. Verify all queries use proper `include` statements

## Fragile Areas

**LinkedIn Extension Integration:**
- Files:
  - `linkedin-extension/content.js` (562 lines)
  - `linkedin-extension/popup.js` (123 lines)
  - `app/api/linkedin/candidate/route.ts`
  - `services/socialMatrixService.ts` (758 lines)
- Why fragile:
  1. CSS selectors in content.js may break if LinkedIn redesigns UI
  2. DOM parsing depends on specific LinkedIn HTML structure
  3. No robust error handling for LinkedIn page load variations
  4. innerHTML manipulation prone to breaking changes
- Safe modification: Version extension separately, add feature detection for CSS selectors, implement fallback parsing strategies
- Test coverage: No E2E tests for LinkedIn integration, manual testing only

**Behavioral Signals Service:**
- Files: `services/behavioralSignalsService.ts` (745 lines)
- Why fragile:
  1. Detects "open to work" via bio keywords - easily spoofed
  2. Activity pattern detection depends on GitHub API consistency
  3. Async polling mechanism (noted with TODO comment in tests) may have race conditions
- Safe modification: Add comprehensive test coverage for edge cases, add timeout protection for polling
- Test coverage: 98-102 lines are TODOs for async polling mocks

**GitHub Connection Path Analysis:**
- Files:
  - `lib/linkedin-parser/network-intelligence.ts` (907 lines)
  - `services/networkAnalysisService.ts` (900 lines)
  - `services/citedEvidenceService.ts`
- Why fragile:
  1. Regex pattern matching for connection detection (line 522 in network-intelligence.ts)
  2. Assumes specific GitHub profile structure
  3. No validation of pattern match results before use
- Safe modification: Add input validation before regex, use defensive parsing
- Test coverage: Tests exist but may not cover all LinkedIn profile variations

**Gemini AI Service with Fallover Chain:**
- Files:
  - `lib/services/gemini/index.ts` (928 lines)
  - `services/geminiService.ts` (921 lines)
  - `services/ai/client.ts`, `services/ai/scoring.ts`, `services/ai/profiling.ts`
- Why fragile:
  1. Failover chain: Gemini direct → OpenRouter → retry (potential cascading failures)
  2. Structured JSON responses require exact schema matching
  3. Rate limiting on external APIs may cause unpredictable failures
  4. No timeout protection documented
- Safe modification:
  1. Add explicit timeout constants for each service
  2. Implement circuit breaker pattern for Gemini API failures
  3. Add detailed logging for schema mismatch errors
  4. Implement exponential backoff for retries
- Test coverage: Tests exist but mocking may not cover all error paths

## Scaling Limits

**Credit System Scale:**
- Current capacity: Designed for per-user credit consumption
- Limit: As user base grows, credit ledger table (`CreditLedger` in Prisma) may become very large
- Scaling path:
  1. Implement ledger archival/partitioning strategy
  2. Add database indexes on userId, createdAt for query performance
  3. Consider time-series database for historical analytics

**Candidate Database:**
- Current capacity: SQLite in dev, PostgreSQL in production, no sharding
- Limit: Millions of candidates may require query optimization or read replicas
- Scaling path:
  1. Implement read replicas for candidate search queries
  2. Add caching layer (Redis) for frequently accessed profiles
  3. Consider separate search index (Elasticsearch) if full-text search becomes bottleneck

**LinkedIn Extension Polling:**
- Current capacity: Single-instance processing
- Limit: If many users run extension simultaneously, polling queue may back up
- Scaling path:
  1. Implement message queue (Bull.js or AWS SQS) for async processing
  2. Add rate limiting per user to prevent abuse

**API Rate Limits:**
- Current capacity: In-memory rate limiting works for single instance
- Limit: Distributed/serverless deployments bypass in-memory limits
- Scaling path: Implement Upstash Redis for distributed rate limiting

## Dependencies at Risk

**Vercel KV - Deprecated Pattern:**
- Risk: Project uses `@vercel/kv` (v3.0.0) which is the old Redis integration
- Impact: May be deprecated in favor of other solutions
- Migration plan: Monitor Vercel announcements, migrate to Upstash if needed

**Prisma SQLite (dev) vs PostgreSQL (production):**
- Risk: Differences in SQL dialects may cause development/production parity issues
  - SQLite doesn't support `String[]`, `Int[]` → uses `Json`
  - SQLite doesn't support `mode: "insensitive"` → LIKE already case-insensitive
  - Prisma can't upsert on compound unique with null
- Impact: Tests pass locally but fail in production
- Migration plan: Run all tests against PostgreSQL before deploying, avoid dev/prod database divergence

**Google Gemini API Changes:**
- Risk: API versioning, model availability changes
- Impact: Failover to OpenRouter may not work if Gemini becomes unavailable
- Migration plan: Monitor Google announcements, test failover regularly

**LinkedIn API/Scraping Changes:**
- Risk: LinkedIn actively blocks scrapers, API changes frequently
- Impact: Extension may break, LinkedIn finder routes may stop working
- Migration plan: Maintain multiple parsing strategies, implement graceful degradation

## Test Coverage Gaps

**API Route Unit Tests:**
- What's not tested: All `app/api/` route handlers lack unit tests
- Files: 40+ API routes have no corresponding test files
- Risk: Refactoring API routes is risky without tests, regression detection difficult
- Priority: HIGH - Critical paths need test coverage

**Error Path Testing:**
- What's not tested: API error states, timeouts, malformed requests
- Files: Playwright E2E tests mock all APIs successfully
- Risk: Real failure scenarios not validated before production
- Priority: HIGH - Error handling is critical in recruitment context

**LinkedIn Integration Testing:**
- What's not tested: Extension behavior with different LinkedIn page structures, LinkedIn profile variations
- Files: No E2E tests for LinkedIn flows
- Risk: Extension may break with LinkedIn redesigns
- Priority: MEDIUM - Behavioral signals depend on this working

**Behavioral Signals Service:**
- What's not tested: Async polling behavior, race conditions, timeout scenarios
- Files: `tests/services/behavioralSignalsService.test.ts:98-102` has TODO comments
- Risk: Polling may hang or return stale data
- Priority: MEDIUM - Affects candidate insights quality

**Anti-Gaming Filters:**
- What's not tested: Some edge cases, tutorial repo detection variations
- Files: `tests/anti-gaming-filters.test.ts` has 3 pre-existing test failures
- Risk: Fake/tutorial profiles may be incorrectly scored
- Priority: MEDIUM - Affects alignment scoring accuracy

**Credit System Edge Cases:**
- What's not tested: Credit exhaustion, concurrent consumption, insufficient balance
- Files: No explicit tests for edge cases in credit consumption
- Risk: Users may get into negative credit balance states
- Priority: MEDIUM - Financial correctness important

---

*Concerns audit: 2026-02-16*

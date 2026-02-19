# RecruitOS — Refactor Plan
> Written: 2026-02-19 | Auditor: Mason (subagent)
> Strategy: Strangler fig — extract cleanest modules first, never big-bang rewrite

---

## Guiding Principle

**Fix bugs first. Then extract.** The current state has P0 bugs (BUG_BRIEF). No refactor is worth anything until the core user flow is stable. Refactoring should follow in the order below, with each step independently shippable.

---

## Recommended Extraction Order

### Phase 0 (NOW): Stabilize — Before Any Refactor
> Duration: 1–2 days | Blocker for everything else

Fix the P0/P1 bugs from BUG_BRIEF first:
1. Confirm `requireOptionalAuth()` is used in POST /api/candidates ✓ (already fixed per code read)
2. Verify `GITHUB_TOKEN` in Vercel production env vars
3. Fix `skillNormalizer.ts` — add null return for meta-skills ("Open Source")
4. Fix skills preview 0-count fallback path
5. Fix location filtering logic in `pipeline/page.tsx` ~line 1044

Only proceed to Phase 1 after sim-sven checklist passes (all 10 items).

---

### Phase 1 (FIRST EXTRACT): Job Readiness Engine
> Duration: 1 day | Isolation difficulty: LOW | Confidence: HIGH

**Why first:** Self-contained, no shared state, already well-structured with 7 pillar files.

**What to do:**
1. Ensure `services/jobReadiness/` is the single canonical location (no duplicates)
2. Add integration tests using `ExternalFetchers` mock
3. Add a clear public API: `computeReadinessScore(input, fetchers)` → `ReadinessScore`
4. Move `app/api/candidates/[id]/readiness/route.ts` to call ONLY `services/jobReadiness/engine.ts`
5. Document the 7 pillars and their weight ranges in `services/jobReadiness/README.md`

**Success criterion:** Can run the entire readiness computation in a test without a real GitHub token.

---

### Phase 2: Credit & Payments Module
> Duration: 1 day | Isolation difficulty: LOW | Confidence: HIGH

**Why second:** No AI, no search, pure DB + Stripe. Already clean; just needs a few fixes.

**What to do:**
1. Consolidate the two checkout routes (`/api/stripe/checkout` and `/api/checkout/credits`) into one
2. Add unit tests for `lib/credits.ts` (Prisma mock)
3. Verify idempotency is working for all Stripe event types
4. Remove duplicate credit endpoints if any

**Success criterion:** Can verify credit purchase + deduction in isolation without touching any other module.

---

### Phase 3: AI Analysis — Split geminiService.ts
> Duration: 2–3 days | Isolation difficulty: HIGH | Confidence: MEDIUM

**Why third:** The AI module is the most functionally important but internally messy. Fix the duplication before adding more AI features.

**What to do:**
1. **Consolidate AI clients** — pick ONE entry point. Recommendation: `services/ai/client.ts` (cleaner). Remove duplicate `getAiClient()` from `services/geminiService.ts` and `lib/services/gemini/index.ts`.
2. **Split geminiService.ts** into logical files:
   - `services/ai/scoring.ts` — alignment scoring (already exists, expand)
   - `services/ai/profiling.ts` — persona + deep profile (already exists, expand)
   - `services/ai/outreach.ts` — outreach messages (already exists, expand)
   - `services/ai/interview.ts` — interview guide generation (new split)
3. Keep `services/geminiService.ts` as a re-export facade for backward compat during migration
4. Fix model version drift: standardize on `google/gemini-3-flash-preview` everywhere

**Success criterion:** `services/geminiService.ts` is < 100 lines (just re-exports). Each AI operation is in its own file with its own schema.

**Risk:** Prompt changes can alter output quality. All changes need A/B testing on known candidate samples.

---

### Phase 4: Search & Discovery — Stabilize and Harden
> Duration: 2 days | Isolation difficulty: LOW | Confidence: HIGH

**Why fourth:** The search module is clean but has known bugs. After fixing bugs in Phase 0, consolidate.

**What to do:**
1. Fix `lib/search/skillNormalizer.ts` — null return for meta-skills (Phase 0 item)
2. Add tests for all normalizers (`locationNormalizer`, `experienceParser`, `skillNormalizer`)
3. Consolidate search paths: `lib/search/combinedSearch.ts` should be THE entry point
4. Ensure `app/api/search/serp/route.ts` has graceful fallback when BrightData is unavailable
5. Add rate limit documentation — GitHub 30/min auth, 10/min unauth

**Success criterion:** Full test suite on `lib/search/*` without external API calls.

---

### Phase 5: pipeline/page.tsx — Decompose the God File
> Duration: 3–5 days | Isolation difficulty: HIGH | Confidence: MEDIUM

**Why fifth:** Highest impact but highest risk. Only attempt after all bugs are stable.

**What to do:**
1. **Extract filter logic** → `hooks/usePipelineFilters.ts` (hard requirements, location, score)
2. **Extract candidate list** → `components/pipeline/CandidateList.tsx`
3. **Extract stage management** → `hooks/usePipelineStages.ts` (drag-and-drop state)
4. **Extract demo seeding** → `lib/demoData.ts` (already exists, ensure it's the only source)
5. **Move location filtering** from client-side stub → API query parameter (already supported in GET /api/candidates)
6. Target: `pipeline/page.tsx` < 400 lines (orchestration only)

**Migration strategy:** Create new components alongside old code. Switch imports one at a time. Don't delete old code until all tests pass.

**Risk:** HIGH — any change to pipeline breaks the main user flow. Use feature flags or parallel implementations.

---

### Phase 6: Candidate Module — API Cleanup
> Duration: 1 day | Isolation difficulty: MEDIUM | Confidence: HIGH

**What to do:**
1. Deprecate `services/enrichmentServiceLegacy.ts` — verify it's not called anywhere
2. Ensure `services/unifiedEnrichment.ts` is the only enrichment entry point
3. Remove `lib/storage.ts` (Vercel KV) after verifying no active imports
4. Clean up `services/supabase.ts` if Prisma migration is complete

**Success criterion:** Zero imports of deprecated files.

---

## Module #1 Pick and Justification

**Recommended: Module 5 — Job Readiness Engine**

**Why:**
- Already has a clean 7-file structure with clear separation of concerns
- Zero shared state — pure input/output
- The `ExternalFetchers` interface was designed for testability
- No database writes except the final `Candidate.jobReadiness` update
- No AI calls — pure signal analysis
- Can add tests immediately without mocking 5 different systems
- Working on this module cannot break the core pipeline flow
- Demonstrates good patterns (concurrent pillars, null re-weighting) that can be applied elsewhere

**Confidence: HIGH**

**Starter task:** Add integration test in `tests/jobReadiness/engine.test.ts` using mock fetchers. Run all 7 pillars against a fixed input and assert score range. This forces discovery of any hidden dependencies and validates the isolation claim.

---

## Effort Estimates

| Module | Extract Effort | Risk | Value |
|---|---|---|---|
| M7 Auth/Data | DO NOT EXTRACT (foundation) | — | — |
| M5 Job Readiness | 1 day | LOW | HIGH |
| M4 Payments | 1 day | LOW | MEDIUM |
| M3 AI Analysis | 2–3 days | HIGH | HIGH |
| M1 Search | 2 days | LOW | MEDIUM |
| M2 Pipeline (API only) | 1 day | LOW | HIGH |
| M2 Pipeline (page.tsx) | 3–5 days | VERY HIGH | HIGH |
| M6 Integrations | 1 day | LOW | LOW |

Total realistic clean-up effort (after bug fixes): **~2 weeks** for a single focused developer. With parallel AI agents on independent modules: **~1 week**.

---

## Migration Strategy: Strangler Fig

```
1. New code lives alongside old code (never delete first)
2. New entry point created (e.g., services/ai/scoring.ts)
3. Old entry point updated to re-export from new (backward compat)
4. One caller at a time migrated to use new path
5. When all callers migrated, old entry point deleted
6. Tests added at each step before moving to next caller
```

**Anti-patterns to avoid:**
- Big bang rewrite of pipeline/page.tsx
- Changing AI prompts without A/B testing on known candidates
- Modifying Prisma schema without checking all query sites
- Removing `requireOptionalAuth()` demo paths without verifying demo flow still works

---

## Risks and Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| `pipeline/page.tsx` decomposition breaks demo flow | VERY HIGH | Freeze page.tsx, fix bugs via API layer first |
| AI prompt changes alter scoring distribution | HIGH | Keep baseline test candidates with known expected scores |
| Prisma schema migration on production | HIGH | Always test migration on preview environment first; use `directUrl` for migrations |
| `lib/storage.ts` (Vercel KV) has hidden callers | MEDIUM | `grep -r "from.*lib/storage"` before deleting |
| `services/ai/client.ts` model version drift | MEDIUM | Audit both clients before any AI work; pin model versions |
| Auth session type safety (`as any` cast) | LOW | Tracked; fix with NextAuth v5 upgrade when stable |
| Supabase not fully deprecated | MEDIUM | `grep -r "supabase"` to find all active callers before removing |
| Two checkout routes may have diverged behavior | MEDIUM | Test both before consolidating |

---

## Pre-Refactor Checklist

Before any Phase 1+ work begins, verify:
- [ ] `npm run build` passes clean
- [ ] `npm test` — 315+ passing
- [ ] `GITHUB_TOKEN` set in Vercel production
- [ ] sim-sven checklist: all 10 items pass
- [ ] `docs/ARCHITECTURE.md` updated (currently references Next.js 14 — completely stale)

# RecruitOS — Definition of Done
> Agreed: 2026-02-19 | Owner: Sven Arnarsson
> 
> Every gate is a shell command or browser check.
> Mason runs them automatically and only pings Sven if something fails.
> No milestone is "done" until ALL gates pass.

---

## M0 — Stop the Bleeding

**Goal:** Stable foundation. No P0 bugs. Build is clean.

- [ ] `npm run build` → zero errors
- [ ] `normalizeSkill("Open Source")` → returns `null`, not throws
- [ ] `GET /api/search?q=react&location=Copenhagen` → actually filters by location (not stub)
- [ ] One checkout route exists (`/api/checkout/credits`) — `/api/stripe/checkout` removed or consolidated
- [ ] `GITHUB_TOKEN` verified live in Vercel prod via `/api/health` endpoint
- [ ] `npm test` doesn't regress from current baseline (315+ passing)

**Verification command:**
```bash
npm run build && npm test
grep -r "in a real app" app/pipeline/page.tsx | wc -l  # must be 0
curl https://recruitos.xyz/api/health | jq '.github_token'  # must be "ok"
```

---

## Reference Implementation

`services/jobReadiness/pillar1-network.ts` is the gold standard for the Job Readiness Engine.
Every pillar must follow this exact pattern:
- Single exported `compute*()` async function: `(input: ReadinessInput) => Promise<PillarResult>`
- Explicit early return with `score: null` if no data available
- Each signal has: `name, value, normalizedValue (0-100), source, confidence, detail`
- `aggregateSignals()` = weighted average by confidence
- `Math.min(100, ...)` normalization on all values
- No shared state, no DB writes, no side effects
- JSDoc header documents the fallback chain

---

## M1 — Prove the Model

**Goal:** Two clean modules extracted. Methodology proven.

- [ ] `computeReadinessScore()` runs in test with mock fetchers — zero real API calls required
- [ ] `services/jobReadiness/MODULE_CONTEXT.md` exists — fresh AI productive in 15 min
- [ ] `lib/credits/MODULE_CONTEXT.md` (or `lib/credits.ts` with header block) exists
- [ ] Zero cross-imports between extracted modules and rest of codebase except via defined interfaces
- [ ] Job Readiness has integration test: all 7 pillars run against fixed input, score range asserted
- [ ] `npm run build` still clean
- [ ] `npm test` — new tests passing

**Verification command:**
```bash
npm run build && npm test
grep -r "from.*jobReadiness" app/ --include="*.ts" | grep -v "route.ts"  # must be empty (only API route consumes it)
cat services/jobReadiness/MODULE_CONTEXT.md  # must exist and be non-empty
```

---

## M2 — Fix the Brain

**Goal:** One AI client. Pinned model versions. AI layer is auditable.

- [ ] `grep -r "getAiClient" --include="*.ts" .` → exactly **1 result** (the definition)
- [ ] All AI routes use same model version string — `grep -r "gemini" --include="*.ts" . | grep "model"` shows consistent version
- [ ] `services/geminiService.ts` < 100 lines (re-exports only, no logic)
- [ ] `npm test` covers all 3 normalizers: `skillNormalizer`, `locationNormalizer`, `experienceParser`
- [ ] Zero `"in a real app"` comments anywhere in codebase
- [ ] Search module has `MODULE_CONTEXT.md`
- [ ] `npm run build` still clean

**Verification command:**
```bash
npm run build && npm test
grep -rn "getAiClient" --include="*.ts" . | wc -l  # must be 1
grep -rn "in a real app" . --include="*.ts" --include="*.tsx" | wc -l  # must be 0
wc -l services/geminiService.ts  # must be < 100
```

---

## M3 — Kill the God Files

**Goal:** Pipeline page is decomposed. No single file owns too much.

- [ ] `wc -l app/pipeline/page.tsx` → **< 400 lines**
- [ ] `hooks/usePipelineFilters.ts` exists with unit tests
- [ ] `components/pipeline/CandidateList.tsx` exists as standalone component
- [ ] `hooks/usePipelineStages.ts` exists (drag-and-drop state extracted)
- [ ] Browser screenshot: search → add to pipeline → score renders → no crash
- [ ] Demo flow works end-to-end without errors in browser console
- [ ] `npm run build` still clean
- [ ] `npm test` — no regressions

**Verification command:**
```bash
npm run build && npm test
wc -l app/pipeline/page.tsx  # must be < 400
ls hooks/usePipelineFilters.ts hooks/usePipelineStages.ts components/pipeline/CandidateList.tsx  # must all exist
```

---

## M4 — Production Ready

**Goal:** Clean slate. AI-operable. Deployed. Demonstrable.

- [ ] `grep -r "lib/storage" --include="*.ts" .` → **zero results** (Vercel KV fully removed)
- [ ] `grep -r "supabase" --include="*.ts" .` → **zero results** (fully deprecated out)
- [ ] All 7 modules have `MODULE_CONTEXT.md`:
  - `lib/search/MODULE_CONTEXT.md`
  - `services/jobReadiness/MODULE_CONTEXT.md`
  - `app/api/candidates/MODULE_CONTEXT.md`
  - `services/ai/MODULE_CONTEXT.md`
  - `lib/credits/MODULE_CONTEXT.md`
  - `lib/integrations/MODULE_CONTEXT.md` (Teamtailor, BrightData, Resend)
  - `lib/auth/MODULE_CONTEXT.md`
- [ ] `docs/ARCHITECTURE.md` references correct stack (Next.js 16+, not 14)
- [ ] Full demo flow verified via browser: search → add candidate → pipeline → readiness score → outreach message
- [ ] Production URL `recruitos.xyz` responding with 200
- [ ] `npm run build` clean
- [ ] `npm test` — full suite passing

**Verification command:**
```bash
npm run build && npm test
grep -r "lib/storage" --include="*.ts" . | wc -l  # must be 0
grep -r "supabase" --include="*.ts" . | wc -l  # must be 0
curl -s -o /dev/null -w "%{http_code}" https://recruitos.xyz/api/health  # must be 200
for f in lib/search lib/auth services/jobReadiness services/ai app/api/candidates; do ls $f/MODULE_CONTEXT.md; done
```

---

## How Mason Uses This

1. Complete milestone work
2. Run verification commands above
3. If ALL pass → notify Sven with receipt (paste command output)
4. If ANY fail → fix and re-run (max 2 attempts per item per circuit breaker rules)
5. After 2 failed attempts on same item → escalate to Sven with diagnosis

**Sven's only job:** Review the receipt, tap 👍, unlock next milestone.

---

## Global Rules (apply to all milestones)

- `npm run build` must pass before declaring ANY milestone done
- No mock data, no fake fallbacks
- Strangler fig only — never delete before replacement is live
- Each extracted module must have `MODULE_CONTEXT.md` before work starts on next module
- Backup before any delete operation (see AGENTS.md)

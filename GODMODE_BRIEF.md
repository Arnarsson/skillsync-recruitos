# RecruitOS GodMode Brief — Demo-Ready by Morning
## Branch: `recruitos-godmode-fix`
## Deadline: Meeting tomorrow (Feb 19, 2026)

---

## MISSION

Fix RecruitOS so it is demo-ready for a client meeting tomorrow morning.
This is a POC demo. Zero tolerance for: errors, mock data, wrong-market candidates.

**Success = sim-sven (Danish recruiter persona) runs the full flow and reports PASS.**

---

## THE PROBLEMS (in priority order)

### P0 — Location filtering broken
Candidates shown are NOT from Denmark/Copenhagen. The job is a Danish Backend/Data Engineer role.
- Fix: All candidate searches/results must filter to Denmark/Copenhagen by default
- Where to look: `/app/api/search`, `/app/api/candidates`, `lib/search*`, `components/pipeline*`
- The intake form should default location to "Denmark" or "Copenhagen"

### P0 — APIs not firing / returning errors
- `/api/candidates` — must return real candidate data, no 500s
- `/api/skills/preview` — must show real skill tags
- `/api/analytics/pipeline` — fixed (already deployed) but verify still works on this branch
- `/api/criteria/score` — must score candidates against the job criteria
- Any API returning 500 → fix it or add a graceful fallback (never show raw error to user)

### P1 — Candidate scores are all 46-50 (not differentiated)
- Scoring looks stuck/placeholder. Real scoring should differentiate candidates.
- Check: `/app/api/criteria/score`, `lib/scoring*`, job readiness engine
- Fix or seed enough data that scores vary meaningfully (50-95 range)

### P1 — UI errors visible to user
- No error states should be raw/ugly
- Loading states must work
- Empty states must have helpful copy (not blank screens)

### P2 — Demo flow must work end-to-end
Full flow:
1. Open recruitos.xyz → Login or skip if demo mode exists
2. See existing job: "Backend/Data Engineer"
3. See candidates list → ALL Danish/Copenhagen profiles
4. Top match shows score 75+ with real-looking profile
5. Click candidate → see profile with skills, score breakdown, contact info
6. No errors, no 500s, no blank screens at any step

---

## SIM-SVEN: YOUR QA GATE

After EVERY fix, you MUST run the sim-sven validation loop.

**Sim-Sven persona:** Danish tech recruiter at a Copenhagen scale-up. Hiring Backend/Data Engineer.
She is NOT technical. She just wants: right candidates, right location, right scores, no errors.

**sim-sven checklist (ALL must pass before you're done):**

```
[ ] 1. Open recruitos.xyz — no errors on load
[ ] 2. See "Backend/Data Engineer" job in pipeline
[ ] 3. Open candidates list — ALL candidates are from Denmark/Copenhagen
[ ] 4. At least 3 candidates with score > 60
[ ] 5. Top candidate has score > 75
[ ] 6. Click top candidate — full profile loads (no blank, no 500)
[ ] 7. Skills are real and relevant (Python, SQL, data engineering keywords)
[ ] 8. No console 500 errors anywhere in the flow
[ ] 9. Location shows "Copenhagen" or "Denmark" on candidate profiles
[ ] 10. Analytics page loads without error
```

Run this after EACH fix iteration. Only stop when ALL 10 pass.

---

## AGENT WORKFLOW

Use cc-godmode workflow:

```
@architect → reads codebase, maps the location filter and scoring code
     ↓
@api-guardian → audits all firing APIs, finds 500s and missing data
     ↓
@builder → fixes location filter, fixes API errors, fixes scoring display
     ↓
@validator + @tester (PARALLEL) → tester runs sim-sven checklist
     ↓
If any sim-sven item FAILS → back to @builder
     ↓
When all 10 sim-sven items PASS → @scribe updates CHANGELOG → done
```

---

## CONSTRAINTS (non-negotiable)

1. **NO MOCK DATA** — If an API needs real data to work, fix the API. Never add fake candidates or fake scores.
2. **Branch: `recruitos-godmode-fix`** — All work on this branch. Do NOT push to `merge-recruitos` or `main`.
3. **Build must pass** — `npm run build` must succeed before any deploy attempt
4. **Tests** — 315/322 tests must still pass (7 are already skipped, that's fine)
5. **Deploy** — When ready: `vercel --prod --yes` from repo root, then `vercel alias <url> recruitos.xyz`
6. **DO NOT commit .env files**

---

## KEY FILES TO UNDERSTAND FIRST

Read these before touching anything:
- `prisma/schema.prisma` — candidate data model (location field)
- `app/api/search/route.ts` — main search/filter logic
- `app/api/candidates/route.ts` — candidate listing
- `lib/scoring/` or similar — job readiness scoring engine
- `components/pipeline/` — the candidate list UI
- `.env` — API keys (BrightData for LinkedIn scraping, OpenAI for scoring)

---

## DONE CRITERIA

You are done when:
1. sim-sven checklist: all 10 items pass
2. `npm run build` passes
3. `npm test` — 315+ passing
4. Deployed to recruitos.xyz via `vercel --prod --yes` + alias
5. CHANGELOG.md updated

Report back with:
- What was broken
- What you fixed (file + line)
- sim-sven checklist results (all 10)
- Vercel deploy URL
- recruitos.xyz confirmed live

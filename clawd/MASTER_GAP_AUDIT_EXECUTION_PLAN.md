# RecruitOS Master Gap Audit + Execution Plan

**Date:** 2026-02-10  
**Objective:** One execution plan that covers reliability, product positioning, feature roadmap, and full QA gates.

## 1) Canonical Inputs Audited

- `clawd/recruitos-audit-report.md`
- `clawd/recruitos-demo-fix-plan.md`
- `clawd/recruitos-xyz-ui-audit.md`
- `clawd/andreas-meeting-analysis.md`
- `tests/FAILURES.md`
- `docs/FEATURE_TEST_REPORT.md`
- `docs/SECURITY.md`
- `docs/STATUS.md`
- Live code paths in:
  - `linkedin-extension/background.js`
  - `app/api/linkedin/candidate/route.ts`
  - `app/api/linkedin/messages/route.ts`
  - `middleware.ts`
  - `lib/auth.ts`
  - `.env.example`

## 2) Gap Audit Summary (What Is Actually Blocking)

### P0 blockers (must fix first)

1. **Extension auth contract mismatch**  
   Extension sends bearer API key, LinkedIn routes require NextAuth session.  
   Result: extension traffic can fail auth in production usage.

2. **LinkedIn messages are not persisted**  
   Messages endpoint has TODO storage/retrieval, so synced data does not become reliable product value.

3. **Hardcoded localhost notification sync**  
   `linkedin-extension/background.js` targets `http://localhost:8001/...`, which breaks non-local demo/prod flows.

4. **Missing `/api/events` endpoint**  
   Known 404 spam in logs/console from `docs/FEATURE_TEST_REPORT.md`.

5. **Documentation/config drift**  
   OAuth env naming mismatch (`GITHUB_ID/SECRET` vs `GITHUB_CLIENT_ID/SECRET`) and stale status docs create operational confusion.

### P1 product/trust gaps

6. **Positioning risk: “personality” framing**  
   Must be replaced by evidence-based behavioral signals to match transcript and stakeholder expectations.

7. **No universal explainability contract**  
   Candidate conclusions are not consistently shown as evidence + confidence + gaps.

8. **Criteria-first hiring flow missing as the main decision frame**  
   Need Criteria Builder + Scorecard + interview rubric as primary path.

### P2 quality/compliance gaps

9. **Audit/compliance posture incomplete in UX**  
   Need explicit provenance/audit access, data handling transparency, and human-in-the-loop controls in capture workflows.

10. **QA evidence is fragmented across many docs**  
   No single release gate proving “demo-safe + production-safe” in one runbook.

## 3) One Plan To Rule Them All (Execution Program)

## Phase A - Reliability Hardening (P0)

### A1. Unify extension ingestion auth
- Introduce a shared auth strategy for extension endpoints (`/api/linkedin/*`), separate from browser session auth.
- Keep strict validation + rate limiting.
- Add explicit auth failure telemetry.

**Done when**
- Extension capture works without NextAuth cookie dependency.
- Unauthorized requests are denied with consistent 401 shape.

### A2. Implement persistent LinkedIn message pipeline
- Add DB model + migration for LinkedIn messages.
- Implement POST persistence and GET retrieval.
- Add dedupe key and idempotent behavior.

**Done when**
- Message sync survives reload and appears in UI/API fetch.
- Duplicate retries do not create duplicate rows.

### A3. Remove localhost coupling from extension
- Move notification endpoint/base URL to config.
- Add environment-safe defaults for dev/staging/prod.
- Surface endpoint/connectivity state in popup.

**Done when**
- Same extension build works in local and production with config only.

### A4. Fix `/api/events` gap
- Implement minimal endpoint or remove callers.
- Stop 404 flood.

**Done when**
- No recurring `/api/events` 404 in logs.

### A5. Resolve env/doc drift
- Standardize env variable names in code + `.env.example` + deployment docs.
- Add startup validation checklist for required vars.

**Done when**
- Setup docs and runtime expectations are consistent.

## Phase B - Product Reframe + Core Feature Shift (P0/P1)

### B1. Terminology migration
- Replace “personality test/profile” with:
  - Behavioral Signals
  - Evidence-Based Candidate Brief
  - Interview Decision Support
- Add global disclaimer: decision support, not deterministic truth.

**Done when**
- No user-facing personality prediction claims remain in key flows.

### B2. Criteria Builder (primary workflow)
- Role template -> define 6-10 criteria -> set weights -> scoring rubric.
- Criteria locked before candidate evaluation for bias reduction.

**Done when**
- Hiring manager can create and save criteria sets and score against them.

### B3. Evidence Panel + Interview Engine
- For each criterion: show artifacts (PRs/issues/commits/signals), why it matters, and interview prompts.
- Include confidence and missing evidence.

**Done when**
- Every candidate recommendation has linked evidence + interview prompts.

### B4. Explainability contract (safe transparency)
- Public explanation output:
  - conclusion
  - top factors
  - evidence rows
  - confidence band
  - data gaps
  - interview checks
- Private internals remain hidden:
  - raw weights
  - prompts
  - anti-gaming logic
  - provider routing

**Done when**
- Users can see “how we concluded” without exposing secret internals.

## Phase C - Compliance + Trust Packaging (P1/P2)

### C1. Audit trail UX
- Expose provenance timeline (who captured what, when, source).
- Add export path for audit evidence package.

### C2. Capture governance controls
- Human-in-the-loop controls, rate limits, and source constraints visible in UI.
- “Public-data-only” + GDPR-aligned messaging where relevant.

### C3. Team context comparison (descriptive only)
- Compare work-style signals (review-heavy, cadence, ownership breadth/depth).
- No deterministic “fit prediction” claims.

## 4) QA-Everything Master Gate

No external demo or release unless all gates pass.

### Gate 1: Build & static checks
- `npm run lint`
- `npm run type-check`
- `npm run build`

### Gate 2: Automated tests
- `npm run test:run`
- `npm run test:coverage` (track baseline)
- API contract tests for `/api/linkedin/*`, `/api/events`, auth failure paths, and explainability payloads.

### Gate 3: Database reliability
- Migrations on clean DB and existing DB snapshot.
- Message dedupe/idempotency verification.

### Gate 4: Extension end-to-end
- Fresh Chrome profile install.
- Capture 3 LinkedIn profiles (3 runs).
- Verify persistence in app.
- Queue/retry behavior under network interruption.

### Gate 5: Product behavior
- Criteria Builder flow from setup to candidate brief export.
- Evidence + interview prompt generation per criterion.
- Explainability panel visible for all candidate conclusions.

### Gate 6: Security/compliance
- Authz checks for protected APIs.
- CORS/header validation.
- No sensitive internals leaked in explanation responses.
- Logging redaction sanity check.

### Gate 7: Demo reliability
- 3x3 scripted pre-demo protocol passes.
- Backup demo dataset and video available.

## 5) Execution Backlog (Trackable IDs)

### Reliability
- `REL-001` Extension auth unification
- `REL-002` LinkedIn message persistence
- `REL-003` Extension endpoint configurability
- `REL-004` `/api/events` implementation/removal
- `REL-005` Env naming + setup parity

### Product
- `PROD-001` Personality -> behavioral terminology migration
- `PROD-002` Criteria Builder
- `PROD-003` Evidence Panel
- `PROD-004` Interview Engine
- `PROD-005` Explainability contract

### Trust/Compliance
- `TRUST-001` Audit trail UX
- `TRUST-002` Capture governance controls
- `TRUST-003` Team Context Comparison (descriptive)

### QA program
- `QA-001` Master release checklist automation
- `QA-002` API contract/regression suite
- `QA-003` Extension E2E harness + repeatable script
- `QA-004` Demo gate runbook + evidence pack

## 6) Uncovered/Assumption Register

These require explicit confirmation during execution:

1. **Exact extension auth mechanism** (signed key vs short-lived token) is not yet finalized.
2. **Canonical owner/team mapping** is not present in source docs (needs assignment).
3. **Final legal wording for GDPR/compliance claims** should be reviewed before marketing publication.
4. **Source-of-truth for historic docs** is unclear; older status docs conflict with current code reality.

## 7) Immediate Next 5 Actions

1. Implement `REL-001` auth bridge for extension endpoints.
2. Implement `REL-002` message persistence with migration + tests.
3. Fix `REL-004` `/api/events` 404 path.
4. Run QA Gate 1-4 and publish evidence.
5. Start `PROD-001` terminology migration and define `PROD-005` explainability schema.

---

This file is the canonical execution plan until replaced by a newer dated version.

## 8) Progress Log

### Completed in this execution pass (2026-02-10)

- `REL-001` **In progress / core shipped**
  - Added `lib/extension-auth.ts` with session-or-extension-key auth.
  - Wired `/api/linkedin/candidate` and `/api/linkedin/messages` to shared auth.
  - Added `RECRUITOS_EXTENSION_API_KEY` support (with `demo` fallback in non-production).

- `REL-002` **Core shipped**
  - Added `LinkedinMessage` Prisma model.
  - Added migration: `prisma/migrations/20260210173000_add_linkedin_messages/migration.sql`.
  - Implemented message persistence + dedupe (`dedupeKey`) in `/api/linkedin/messages`.
  - Implemented message retrieval with filters.

- `REL-003` **Core shipped**
  - Removed hardcoded localhost notification endpoint in extension background worker.
  - Notifications endpoint now configurable and defaults to `${apiUrl}/linkedin/notifications`.
  - Added `/api/linkedin/notifications` ingestion endpoint (ack now, persistence later).
  - Added popup-level configuration controls for `apiUrl` and `notificationsApiUrl`.
  - Added popup API health ping/status indicator.

- `REL-004` **Shipped**
  - Added `/api/events` route to stop recurring 404 event noise.

- `REL-005` **Partial**
  - Added env documentation for extension key and GitHub variable aliases in `.env.example`.
  - Added GitHub var alias support in `lib/auth.ts`.

- `PROD-001` **Partial**
  - High-visibility wording shifted from personality framing in pricing/report/privacy surfaces.

- `PROD-005` **Initial implementation shipped**
  - Added explainability schema and response object in `/api/profile/analyze`.
  - Includes public-safe rationale fields + explicit non-deterministic disclaimer.

- `PROD-002` **Initial implementation shipped**
  - Added persistent Criteria Builder backend (`/api/criteria`, `/api/criteria/[id]`).
  - Added scoring endpoint (`/api/criteria/score`) with weighted criteria evaluation.
  - Added Criteria Builder UI at `/criteria` and dashboard entry point.

- `PROD-003` **Initial implementation shipped**
  - `profile/analyze` now can return `criteriaScorecard` when criteria are provided.
  - Enables evidence-to-scorecard handoff for decision support.

- `PROD-004` **Initial implementation shipped**
  - Added report UI panel for explanation + interview checks + criteria breakdown.
  - Provides direct decision-support visibility in candidate report workflow.

- `PROD-004` **Extended**
  - Added criteria-driven interview engine utility and endpoint (`/api/criteria/interview`).
  - Criteria Builder UI now generates interview questions from predefined criteria.
  - `profile/analyze` now returns `criteriaInterviewGuide` when criteria are supplied.

### Validation run

- ✅ `npx prisma generate`
- ✅ `npm run type-check`
- ⚠️ `npm run lint` fails due large pre-existing repo-wide lint debt (not introduced by this pass).

### Additional completed items (2026-02-10, QA closure pass)

- `REL-006` Graph API/public page mismatch resolved:
  - `/graph` no longer fails with `Failed to load graph data` for unauthenticated users.
- `REL-007` Runtime resilience under GitHub API throttling:
  - skills preview now degrades gracefully with fallback estimates.
  - profile API now falls back to captured candidate data.
- `REL-008` Pipeline offline/demo fallback:
  - localStorage candidate cache reintroduced as fallback when API data is unavailable.
- `QA-002` Expanded E2E verification completed:
  - full Playwright suite passes (`30/30`) after selector alignment and runtime fixes.

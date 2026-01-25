# Roadmap: RecruitOS Pilot Prep

## Overview

Prepare RecruitOS for pilot customer demo in 2-3 weeks by establishing E2E test coverage for critical flows, fixing surfaced bugs, hardening error handling for demo resilience, securing API keys and endpoints, and enriching persona generation with real GitHub/LinkedIn data to deliver the "insane" evidence-backed candidate insights that define our core value.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: E2E Testing** - Playwright tests for all critical user flows
- [ ] **Phase 2: Bug Fixes** - Fix issues surfaced by E2E tests
- [ ] **Phase 3: Error Hardening** - Loading states, fallbacks, and edge case handling
- [ ] **Phase 4: Security** - Move API keys server-side, validate inputs, rate limiting
- [ ] **Phase 5: Persona Enhancement** - Rich data collection for evidence-backed personas

## Phase Details

### Phase 1: E2E Testing
**Goal**: All critical user flows have automated E2E tests that pass without flakiness
**Depends on**: Nothing (first phase)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07
**Success Criteria** (what must be TRUE):
  1. User can complete Intake → Search → Pipeline → Profile → Outreach flow end-to-end without manual intervention
  2. Social Matrix connection path visualization loads and displays 6-degrees paths
  3. All 6 Playwright test suites (Intake, Search, Pipeline, Profile, Outreach, Social Matrix) pass on every run
  4. Test suite runs in under 5 minutes with zero flaky tests
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — E2E Testing Infrastructure and Critical Flow Tests (7 tasks) ✓

### Phase 2: Bug Fixes
**Goal**: Demo flows work without crashes or blocking errors
**Depends on**: Phase 1
**Requirements**: BUGS-01, BUGS-02
**Success Criteria** (what must be TRUE):
  1. All bugs identified by E2E tests are fixed and verified
  2. User can complete any critical flow without encountering crashes or unhandled exceptions
  3. E2E test suite passes with 100% success rate after bug fixes
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Fix component creation during render and window.location mutation bugs
- [ ] 02-02-PLAN.md — Fix state initialization patterns in context providers and hooks
- [ ] 02-03-PLAN.md — Fix remaining setState-in-useEffect anti-patterns in UI components
- [ ] 02-04-PLAN.md — Final verification and cleanup of bug fixes

### Phase 3: Error Hardening
**Goal**: Application degrades gracefully when external services fail or edge cases occur
**Depends on**: Phase 2
**Requirements**: HARD-01, HARD-02, HARD-03, HARD-04
**Success Criteria** (what must be TRUE):
  1. User sees loading spinners during all async operations (search, profile analysis, outreach generation)
  2. User sees helpful error messages (not stack traces) when GitHub API, Gemini, or BrightData fails
  3. User can recover from errors without refreshing the page or losing work
  4. Application handles empty search results, missing candidate data, and API timeouts without breaking
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 4: Security
**Goal**: API keys secured server-side, inputs validated, endpoints protected from abuse
**Depends on**: Phase 3
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. No API keys visible in localStorage, browser DevTools Network tab, or client-side source code
  2. All dynamic route parameters ([username], [id]) validated server-side with rejection of malformed input
  3. Application handles malformed JSON gracefully without crashes (all JSON.parse wrapped in try-catch)
  4. Public endpoints (/api/search, /api/github/*) have rate limiting that prevents abuse during demo
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 5: Persona Enhancement
**Goal**: Personas generated with rich GitHub + optional LinkedIn data, no mock content
**Depends on**: Phase 4
**Requirements**: PERS-01, PERS-02, PERS-03, PERS-04, PERS-05, PERS-06
**Success Criteria** (what must be TRUE):
  1. Persona generator receives repos, commit patterns, PR descriptions, READMEs from GitHub (not 6-line stub)
  2. User can optionally provide LinkedIn URL on profile page to trigger BrightData enrichment
  3. Bulk import CSV supports LinkedIn URL column for batch enrichment
  4. Generated personas cite specific evidence (repo names, commit messages, LinkedIn experience) with no generic filler text
  5. LinkedIn data (when available) includes work history, skills, and summary that flow into persona generation
**Plans**: TBD

Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. E2E Testing | 1/1 | ✓ Complete | 2026-01-24 |
| 2. Bug Fixes | 0/4 | Planned | - |
| 3. Error Hardening | 0/TBD | Not started | - |
| 4. Security | 0/TBD | Not started | - |
| 5. Persona Enhancement | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-24*
*Phase 1 planned: 2026-01-24*
*Phase 1 complete: 2026-01-24*
*Phase 2 planned: 2026-01-25*

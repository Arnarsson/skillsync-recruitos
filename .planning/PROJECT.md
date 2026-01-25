# RecruitOS Pilot Prep

## What This Is

AI-powered recruitment decision-support system that searches GitHub for software engineers, scores them via Gemini AI, generates psychometric profiles, and creates personalized outreach. Currently preparing for pilot customer demo in 2-3 weeks.

## Core Value

Recruiters see "insane" candidate personas with real evidence — career trajectory, risk signals, interview ammunition — not generic AI fluff. Every claim backed by GitHub/LinkedIn data.

## Requirements

### Validated

Existing capabilities from the codebase:

- ✓ GitHub developer search with multi-language query parsing — existing
- ✓ Candidate evaluation funnel (Intake → Shortlist → Deep Profile → Outreach) — existing
- ✓ AI-powered profile analysis (persona, scoring, deep profile) — existing
- ✓ Credit metering for paid operations — existing
- ✓ Social Matrix connection path visualization — existing
- ✓ Personalized outreach message generation — existing
- ✓ BrightData LinkedIn scraping infrastructure — existing
- ✓ Team collaboration with shared pipelines — existing
- ✓ NextAuth GitHub OAuth — existing

### Active

Pilot prep requirements:

**E2E Testing**
- [ ] Playwright E2E tests for Search → Results flow
- [ ] Playwright E2E tests for Profile Analysis flow
- [ ] Playwright E2E tests for Outreach Generation flow
- [ ] Playwright E2E tests for Social Matrix flow
- [ ] All critical paths pass without flakiness

**Bug Fixes**
- [ ] Fix all bugs surfaced by E2E tests
- [ ] Graceful error handling (no crashes during demo)

**Error Hardening**
- [ ] Loading states for all async operations
- [ ] Graceful fallbacks when APIs fail
- [ ] Clear error messages for user-facing failures
- [ ] Edge case handling (empty results, missing data)

**Security Fixes**
- [ ] Move API keys from localStorage to server-side
- [ ] Input validation on dynamic route parameters
- [ ] Wrap JSON.parse calls in try-catch
- [ ] Rate limiting on public endpoints

**Persona Enhancement**
- [ ] Rich GitHub data collection (repos, stars, commit patterns, PR descriptions, READMEs)
- [ ] LinkedIn integration via BrightData (optional, triggered by URL input)
- [ ] Combined data fed to persona generator (not 6-line stub)
- [ ] LinkedIn URL input on profile page
- [ ] LinkedIn column support in bulk import
- [ ] No mock data in persona generation

### Out of Scope

- New features beyond persona enhancement — focus on stability for pilot
- Unit test restoration (Vitest) — E2E is the priority
- Performance optimization — unless it blocks the demo
- Mobile optimization — desktop-first for pilot
- Additional OAuth providers — GitHub sufficient

## Context

**Pilot Timeline:** 2-3 weeks
**Audience:** Real recruiters testing with real searches
**Critical Flows:** Search, Profile Analysis, Outreach, Social Matrix — all must work flawlessly

**Current State:**
- Vitest disabled (config backed up)
- Playwright exists but minimal E2E coverage
- BrightData wired up but not integrated into profile analysis
- Persona generator receives thin data (6 lines), produces generic output
- 170+ console.log calls polluting logs
- API keys exposed in localStorage

**Codebase Mapped:** `.planning/codebase/` contains full analysis

## Constraints

- **Timeline**: 2-3 weeks to pilot demo
- **Tech Stack**: Next.js 16, React 19, Gemini AI, BrightData — no migrations
- **Data Sources**: GitHub (required), LinkedIn via BrightData (optional)
- **Budget**: BrightData API calls cost money — only scrape when user provides URL

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| E2E over unit tests | Pilot needs end-to-end confidence, unit tests can come later | — Pending |
| LinkedIn optional | Not all candidates have LinkedIn; GitHub must work standalone | — Pending |
| Rich GitHub depth | Repos + commits + PRs + READMEs gives AI real evidence | — Pending |
| Server-side API keys | Security fix required before pilot with real customers | — Pending |

---
*Last updated: 2026-01-24 after initialization*

# Requirements: RecruitOS Pilot Prep

**Defined:** 2026-01-24
**Core Value:** Recruiters see "insane" candidate personas with real evidence — every claim backed by GitHub/LinkedIn data.

## v1 Requirements

Requirements for pilot demo in 2-3 weeks.

### E2E Testing

- [x] **TEST-01**: Playwright E2E test for Intake flow (job context collection)
- [x] **TEST-02**: Playwright E2E test for Search → Results flow
- [x] **TEST-03**: Playwright E2E test for Pipeline management flow
- [x] **TEST-04**: Playwright E2E test for Profile Analysis flow
- [x] **TEST-05**: Playwright E2E test for Outreach Generation flow
- [x] **TEST-06**: Playwright E2E test for Social Matrix flow
- [x] **TEST-07**: All critical paths pass without flakiness

### Bug Fixes

- [ ] **BUGS-01**: Fix all bugs surfaced by E2E tests
- [ ] **BUGS-02**: No crashes during demo flows

### Error Hardening

- [ ] **HARD-01**: Loading states for all async operations
- [ ] **HARD-02**: Graceful fallbacks when APIs fail
- [ ] **HARD-03**: Clear error messages for user-facing failures
- [ ] **HARD-04**: Edge case handling (empty results, missing data)

### Security

- [ ] **SEC-01**: Move API keys from localStorage to server-side
- [ ] **SEC-02**: Input validation on dynamic route parameters
- [ ] **SEC-03**: Wrap JSON.parse calls in try-catch
- [ ] **SEC-04**: Rate limiting on public endpoints

### Persona Enhancement

- [ ] **PERS-01**: Rich GitHub data collection (repos, stars, commits, PRs, READMEs)
- [ ] **PERS-02**: LinkedIn integration via BrightData (optional, URL-triggered)
- [ ] **PERS-03**: Combined data fed to persona generator
- [ ] **PERS-04**: LinkedIn URL input on profile page
- [ ] **PERS-05**: LinkedIn column support in bulk import
- [ ] **PERS-06**: No mock data in persona generation

## v2 Requirements

Deferred to post-pilot.

### Testing Infrastructure

- **UNIT-01**: Restore Vitest configuration
- **UNIT-02**: Unit tests for core services
- **UNIT-03**: Test coverage reporting

### Performance

- **PERF-01**: Optimize GitHub API calls (GraphQL batching)
- **PERF-02**: Implement caching layer
- **PERF-03**: Lazy-load candidate details

### Compliance

- **COMP-01**: EU AI Act audit logging
- **COMP-02**: GDPR data export/deletion endpoints

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features beyond persona | Focus on stability for pilot |
| Mobile optimization | Desktop-first for pilot customers |
| Additional OAuth providers | GitHub sufficient for demo |
| Vitest restoration | E2E is the priority for pilot confidence |
| Performance optimization | Unless it blocks the demo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 1 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 1 | Complete |
| TEST-04 | Phase 1 | Complete |
| TEST-05 | Phase 1 | Complete |
| TEST-06 | Phase 1 | Complete |
| TEST-07 | Phase 1 | Complete |
| BUGS-01 | Phase 2 | Pending |
| BUGS-02 | Phase 2 | Pending |
| HARD-01 | Phase 3 | Pending |
| HARD-02 | Phase 3 | Pending |
| HARD-03 | Phase 3 | Pending |
| HARD-04 | Phase 3 | Pending |
| SEC-01 | Phase 4 | Pending |
| SEC-02 | Phase 4 | Pending |
| SEC-03 | Phase 4 | Pending |
| SEC-04 | Phase 4 | Pending |
| PERS-01 | Phase 5 | Pending |
| PERS-02 | Phase 5 | Pending |
| PERS-03 | Phase 5 | Pending |
| PERS-04 | Phase 5 | Pending |
| PERS-05 | Phase 5 | Pending |
| PERS-06 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 after initial definition*

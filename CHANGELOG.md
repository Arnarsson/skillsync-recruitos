# Changelog

## [0.3.0] - 2026-02-18

### Added
- 5 real Danish developer profiles for demo mode (MarcSkovMadsen, leondz, fnielsen, thomasahle, jchristgit)
- Centralized `DEMO_JOB` config: "Backend / Data Engineer" at Copenhagen Scale-Up
- Location filter support on `GET /api/candidates?location=`
- `isDemoProfile()` and `getDemoProfile()` helpers for demo candidate detection
- Graceful fallbacks for demo profiles in readiness and work-analysis APIs

### Changed
- Demo job context: "Staff Frontend Infrastructure Engineer" -> "Backend / Data Engineer"
- Demo required skills: JavaScript/TypeScript/Node.js -> Python/SQL/Data Pipelines/ML
- Score cap raised from 70 -> 95 for meaningful differentiation
- ScoreBadge no longer caps at 50 for unverified profiles
- Demo candidates sorted by buildprint score (71-88 range)
- Pipeline loads demo candidates directly without reranking in demo mode

### Fixed
- Analytics pipeline API: returns empty data on error instead of 500
- Analytics funnel API: returns empty data on error instead of 500
- GitHub signals API: returns empty insights on error instead of 500
- Criteria API: returns empty list for unauthenticated users instead of 401
- Readiness API: accepts GitHub username as fallback lookup key
- Work-analysis API: returns demo fallback data for demo profiles instead of 500
- Candidates API: triggers background enrichment for GitHub candidates on create
- Removed noisy `[Pipeline] Init` and `shouldAutoSearch` console.log statements
- Pipeline falls back to demo candidates for unauthenticated users with no data

## [0.2.0] - 2026-02-17

### Added
- Job Readiness Engine (7-pillar outreach timing)
- Receptivity badge on candidate cards
- Evidence-based developer archetypes (6 types)
- Unified enrichment service for background data fetching
- Anti-gaming filters for scoring integrity

### Fixed
- Vercel env var quoting issue (silent DB failures)
- Search-time score inflation (cap at 60 without GitHub evidence)
- Bio-inferred vs GitHub-verified skill tracking

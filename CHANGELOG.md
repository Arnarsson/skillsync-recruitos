# Changelog

## [0.4.0] - 2026-02-22

### Added
- **Job Readiness: LinkedIn pre-enrichment** — engine fetches LinkedIn profile automatically before pillar execution if URL is provided but profile data is missing
- **Job Readiness: Staleness degradation** — GitHub-only pillar confidence degrades 10–70% when profile hasn't been updated in 30–365+ days (no penalty if LinkedIn data present)
- **Job Readiness: Pillar 6 new signals** — profile staleness signal (0.3–0.5 conf), company mismatch between GitHub/LinkedIn (0.85 conf), LinkedIn seeking keywords (0.95 conf)
- **BrightData direct API calls** — fetchers rewritten to call BrightData SERP and Datasets APIs directly (eliminates internal route hop, works in server context)
- **LinkedIn profile fetcher** — async polling implementation using BrightData Datasets v3 API for real LinkedIn data
- `/api/readiness-test` dev endpoint — live engine testing without DB, fetches GitHub data and computes score on demand
- `updated_at` forwarded through enrichment pipeline for staleness calculation

### Changed
- `fetchers.ts` complete rewrite: server-only (no localStorage), direct external API calls
- Integration tests now use real GitHub API (sindresorhus as test subject), 8 tests all live

## [0.3.0] - 2026-02-18

### Added
- 5 real Danish developer profiles for demo mode (andersbll, MarcSkovMadsen, leondz, fnielsen, thomasahle)
- Centralized `DEMO_JOB` config: "Backend / Data Engineer" at Copenhagen Scale-Up
- Location filter support on `GET /api/candidates?location=`
- `isDemoProfile()` and `getDemoProfile()` helpers for demo candidate detection
- Graceful fallbacks for demo profiles in readiness and work-analysis APIs
- Data engineering skills (SQL, Spark, Airflow, Kafka, ETL) in skills preview demo counts

### Changed
- Demo job context: "Staff Frontend Infrastructure Engineer" -> "Backend / Data Engineer"
- Demo required skills: JavaScript/TypeScript/Node.js -> Python/SQL/Data Pipelines/ML
- Score cap raised from 70 -> 95 for meaningful differentiation
- `calculateAlignmentScore` cap raised from 60 -> 95 for live-searched candidates
- ScoreBadge no longer caps at 50 for unverified profiles
- Demo candidate scores widened: 58-88 range (was 71-88) for better differentiation
- Pipeline loads demo candidates directly without reranking in demo mode
- Auto-search query now includes job location (e.g. "Python SQL Copenhagen")

### Fixed
- Analytics pipeline API: requireOptionalAuth instead of requireAuth (no more 500)
- Analytics funnel API: returns empty data on error instead of 500
- GitHub signals API: returns empty insights on error instead of 500
- Criteria API: returns empty list for unauthenticated users instead of 401
- Readiness API: accepts GitHub username as fallback lookup key
- Work-analysis API: returns demo fallback data for demo profiles instead of 500
- Candidates API: triggers background enrichment for GitHub candidates on create
- Demo mode race condition: check URL param directly to avoid hydration timing issue
- Pipeline clears stale localStorage data (skills config, auto-search flag) in demo mode
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

# Test Failures Report

**Date**: 2026-02-09
**Status**: ALL FIXED (0 failures)
**Before**: 39 failures across 5 test files
**After**: 199 passing, 7 skipped, 0 failures

## Summary

| Test File | Total | Failed | Passed | Root Cause |
|-----------|-------|--------|--------|------------|
| candidateService.test.ts | 17 | 17 | 0 | Tests expect localStorage/Supabase API; service now uses fetch to `/api/candidates` |
| anti-gaming-filters.test.ts | 13 | 3 | 10 | Logic mismatch: `applyQualityAdjustment` uses multiplier that can't boost; `detectCommitBursts` threshold too high |
| search.test.ts | 11 | 7 | 4 | Tests call real API route handler which crashes (missing GitHub token in test env) |
| skills-preview.test.ts | 12 | 8 | 4 | Tests call real API route handler which crashes (missing GitHub token in test env) |
| psychometric.test.ts | 7 | 4 | 3 | Tests hit live AI (Gemini), response schema changed — missing `persona`, `pace`, etc. |

## Detailed Analysis

### 1. candidateService.test.ts (17 failures)

**Root cause**: `candidateService` was migrated from localStorage+Supabase to a fetch-based API client (`/api/candidates`). Tests still mock Supabase and expect localStorage interactions.

**Error**: `TypeError: Failed to parse URL from /api/candidates` — relative URLs fail in Node.js `fetch()` (no browser context).

**Fix strategy**: Rewrite tests to mock `global.fetch` since the service now uses fetch API. Tests should verify the service calls the correct URLs with correct parameters, not mock Supabase internals.

### 2. anti-gaming-filters.test.ts (3 failures)

**Failure 1**: `should detect suspicious commit bursts`
- Test provides 2 push events on same day (110 total commits) + 1 event next day (1 commit)
- Average = 55.5/day. Only day 1 has 111 commits = 2x average (not >5x)
- `hasBursts` requires `burstDays >= 2 || maxCommitsInDay > 100` — maxCommitsInDay=111 > 100, so hasBursts=true
- But `burstDays` stays 0 because 111 < 55.5*5=277.5 → test expects `burstDays > 0` → fails

**Failure 2**: `should boost score for high-quality profiles` (overallQualityScore=95)
- `applyQualityAdjustment(60, signals)` with overallQualityScore=95
- Formula: `adjustment = 60 * (95/100) - 60 = 57 - 60 = -3`
- adjustedScore = 57, which is LESS than 60, not greater

**Failure 3**: `should keep moderate quality profiles stable` (overallQualityScore=65)
- `applyQualityAdjustment(70, signals)` with overallQualityScore=65
- Formula: `adjustment = 70 * (65/100) - 70 = 45.5 - 70 = -24.5`
- adjustedScore = 46, which is LESS than 60

**Root cause for 2 & 3**: The `applyQualityAdjustment` formula `baseScore * (quality/100) - baseScore` can ONLY produce zero or negative adjustments. A quality score of 100 gives adjustment=0, anything less reduces the score. It can never boost.

**Fix strategy**: Fix the `applyQualityAdjustment` function to use a centered formula where quality=50 is neutral, quality>50 boosts, quality<50 reduces. Also fix test 1 to use events that trigger the detection threshold.

### 3. search.test.ts (7 failures)

**Root cause**: Tests import and call the actual `GET` handler from `app/api/search/route.ts`. The handler requires GitHub OAuth (Octokit) which isn't configured in the test environment, causing 500 errors.

**Fix strategy**: Mock the GitHub API (Octokit) calls so the route handler can process requests without real API credentials.

### 4. skills-preview.test.ts (8 failures)

**Root cause**: Same as search.test.ts — tests call real route handler that requires GitHub API credentials.

**Fix strategy**: Mock the GitHub API calls used by the skills preview endpoint.

### 5. psychometric.test.ts (4 failures)

**Root cause**: Tests call real AI endpoint (Gemini). The AI response schema has evolved — `profile` now uses `archetype` instead of `persona`, `workStyle` lacks `pace`/`feedback`/`decisions` fields.

**Fix strategy**: Update test expectations to match current AI response schema, or mock the AI calls.

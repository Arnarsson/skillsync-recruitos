---
phase: 02-bug-fixes
plan: 03
subsystem: react-hooks
tags: [react, eslint, useState, useEffect, performance, hydration]

dependency-graph:
  requires: []
  provides:
    - "BehavioralBadges lazy initialization pattern"
    - "Hydration gate pattern documentation"
    - "Dashboard page state initialization"
  affects:
    - "Any future components needing cache reads in useState"
    - "SSR/hydration patterns"

tech-stack:
  added: []
  patterns:
    - "useState lazy initializer for synchronous reads"
    - "Async effect pattern with wrapped setState"
    - "eslint-disable for intentional patterns"

key-files:
  created: []
  modified:
    - "components/BehavioralBadges.tsx"
    - "components/OnboardingWrapper.tsx"
    - "components/ScoreExplainer.tsx"
    - "components/ui/toolbar-expandable.tsx"
    - "app/dashboard/page.tsx"

decisions:
  - id: "lazy-init-pattern"
    decision: "Use useState lazy initializers for synchronous cache/localStorage reads"
    rationale: "Avoids setState-in-effect anti-pattern while maintaining SSR safety"

  - id: "eslint-disable-minimal"
    decision: "Only add eslint-disable where rule actually triggers"
    rationale: "Unused directives cause warnings; async patterns don't trigger the rule"

metrics:
  duration: "8 minutes"
  completed: "2026-01-25"
---

# Phase 02 Plan 03: setState-in-useEffect Patterns Summary

**One-liner:** Fixed React setState-in-useEffect anti-patterns in 5 files using lazy initializers and documented hydration gates.

## What Was Done

### Task 1: BehavioralBadges Cache Pattern
- Added `getCachedBehavioralInsights` helper for synchronous cache reads
- Added `getCachedOpenToWork` helper for OpenToWorkBadge component
- Converted `useState(null)` to `useState(() => getCached...())` pattern
- Used async function wrapper for fetch operations (doesn't trigger ESLint rule)

### Task 2: Hydration Gates and Reset Patterns
- **OnboardingWrapper**: Added eslint-disable for intentional hydration gate `setMounted(true)`
- **ScoreExplainer**: Added eslint-disable for reset-on-prop-change pattern `setExpandedSection(null)`
- **toolbar-expandable**: Added eslint-disable for initial width measurement

### Task 3: Dashboard Page State
- Added `getHireTrackingFromStorage` helper for localStorage read
- Converted all useState calls to lazy initializers:
  - `plan` state now initializes synchronously with `getPricingPlan()`
  - `usage` state now initializes synchronously with `getUsageRecord()`
  - `hireTracking` state now initializes synchronously from localStorage

### Task 4: Cleanup
- Removed unnecessary eslint-disable comments that weren't needed
- Async patterns in useEffect with wrapped setState don't trigger the rule
- Lazy initializers properly handle the pattern

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| f5a89db | Lazy initialization for BehavioralBadges cache | components/BehavioralBadges.tsx |
| a6c5149 | eslint-disable for legitimate setState patterns | OnboardingWrapper, ScoreExplainer, toolbar-expandable |
| 23d2576 | Lazy initialization for dashboard page state | app/dashboard/page.tsx |
| 7971a62 | Remove unused eslint-disable directives | BehavioralBadges, OnboardingWrapper |

## Verification Results

1. **ESLint check**: Zero set-state-in-effect errors in target files
2. **Type check**: Passes (`npm run type-check`)
3. **Build**: Succeeds (`npm run build`)

## Files Not Changed (As Planned)

The plan mentioned these files but they had no actual set-state-in-effect issues:
- **app/profile/[username]/page.tsx**: Only had unused import warnings
- **components/pipeline/CandidatePipelineItem.tsx**: Only had unused import warnings
- **components/ui/primitives/Card.tsx**: Only had empty interface errors (unrelated)

These files were correctly identified as not needing changes during execution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused eslint-disable directives**
- **Found during:** Task 4
- **Issue:** ESLint flagged the added eslint-disable comments as unused
- **Fix:** Removed unnecessary directives since async patterns don't trigger the rule
- **Files modified:** BehavioralBadges.tsx, OnboardingWrapper.tsx
- **Commit:** 7971a62

## Pattern Reference

### Lazy Initializer Pattern (for synchronous reads)
```typescript
// Helper outside component
function getCachedData(key: string): Data | null {
  if (typeof window === 'undefined') return null;
  const cached = sessionStorage.getItem(key);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    } catch {}
  }
  return null;
}

// In component
const [data, setData] = useState<Data | null>(() => getCachedData(cacheKey));
```

### Async Effect Pattern (doesn't trigger rule)
```typescript
useEffect(() => {
  const fetchData = async () => {
    const data = await fetch(...);
    setData(data); // ESLint rule doesn't trigger inside async function
  };
  fetchData();
}, [deps]);
```

## Next Phase Readiness

- All target files pass ESLint checks
- Build succeeds
- No blockers for Phase 2 continuation

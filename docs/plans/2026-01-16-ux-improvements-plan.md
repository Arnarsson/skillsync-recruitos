# RecruitOS UX Improvements Plan

## Overview
Address feedback from screencast review to reduce friction and improve user experience.

---

## Phase 1: Quick Wins (High Impact, Low Effort)

### 1.1 Remove Onboarding Wizard Friction
**Problem:** 6-8 screens of "Next" clicking before seeing value.

**Solution:**
- Replace multi-step wizard with single welcome modal
- Show key features as tooltips on first use instead
- Add "Skip" button that's prominent
- Store `onboarding_completed` in localStorage

**Files:** `components/Onboarding.tsx`, `components/OnboardingWrapper.tsx`

**Estimate:** 30 min

---

### 1.2 Add Score Context & Color Coding
**Problem:** Score "60" has no context - is it good?

**Solution:**
- Add color-coded badges:
  - 80-100: Green "Excellent Match"
  - 60-79: Yellow "Good Match"
  - 40-59: Orange "Moderate Match"
  - 0-39: Red "Low Match"
- Add tooltip explaining scoring methodology
- Show as circular progress ring with color

**Files:** `app/pipeline/page.tsx`, `app/search/page.tsx`, `components/ScoreBadge.tsx` (new)

**Estimate:** 45 min

---

### 1.3 Add Skeleton Loaders
**Problem:** Static screen during search feels slow.

**Solution:**
- Replace spinner with skeleton cards during search
- Animate with subtle pulse effect
- Already have `Skeleton` component from shadcn

**Files:** `app/search/page.tsx`, `app/pipeline/page.tsx`

**Estimate:** 20 min

---

## Phase 2: Core UX Improvements (Medium Effort)

### 2.1 Auto-Run AI Analysis on Profile Open
**Problem:** User must manually click "Run AI Analysis" and wait.

**Solution:**
- Trigger analysis automatically when profile opens
- Show loading state with progress indicator
- Cache results in localStorage to avoid re-running
- Add background pre-fetch for pipeline candidates

**Files:** `app/profile/[username]/deep/page.tsx`, `app/api/profile/analyze/route.ts`

**Estimate:** 1 hour

---

### 2.2 Add "Why?" Source Transparency
**Problem:** AI claims like "Risk Averse" feel unsubstantiated.

**Solution:**
- Add info icon next to each AI insight
- Hover/click shows evidence: "Based on: 5+ years at enterprise companies"
- Store reasoning in analysis response
- Update AI prompts to include evidence citations

**Files:** `lib/services/gemini/index.ts`, `app/profile/[username]/deep/page.tsx`

**Estimate:** 1.5 hours

---

### 2.3 Improve Deep Profile Data Visualization
**Problem:** Wall of text, hard to scan.

**Solution:**
- Replace text lists with:
  - Radar chart for skills (already have)
  - Horizontal bars for psychometric traits
  - Icon badges for green/red flags
  - Timeline for career trajectory
- Collapse sections by default, expand on click

**Files:** `app/profile/[username]/deep/page.tsx`, `components/PsychometricCard.tsx`

**Estimate:** 2 hours

---

## Phase 3: Feature Enhancements

### 3.1 Enhanced Candidate Comparison
**Problem:** Comparison exists but could be better.

**Solution:**
- Side-by-side radar charts
- Highlight differences in skills
- Show salary expectation comparison (if available)
- Add "Winner" indicators per category

**Files:** `app/pipeline/page.tsx` (comparison modal section)

**Estimate:** 1.5 hours

---

### 3.2 Background Pre-fetch for Pipeline
**Problem:** Analysis only runs when user clicks.

**Solution:**
- When candidates are added to pipeline, queue background analysis
- Use Web Workers or server-side queue
- Show "Analysis ready" badge when complete
- Prioritize top-scored candidates

**Files:** `app/pipeline/page.tsx`, new `lib/services/analysisQueue.ts`

**Estimate:** 2 hours

---

## Implementation Order

| Priority | Task | Time | Impact |
|----------|------|------|--------|
| 1 | Remove onboarding friction | 30m | High |
| 2 | Score context + colors | 45m | High |
| 3 | Skeleton loaders | 20m | Medium |
| 4 | Auto-run AI analysis | 1h | High |
| 5 | "Why?" transparency | 1.5h | Medium |
| 6 | Data visualization | 2h | Medium |
| 7 | Enhanced comparison | 1.5h | Low |
| 8 | Background pre-fetch | 2h | Medium |

**Total estimated time:** ~9.5 hours

---

## Files to Modify

```
components/
├── Onboarding.tsx          # Simplify to single modal
├── OnboardingWrapper.tsx   # Add skip logic
├── ScoreBadge.tsx          # NEW - reusable score display
├── PsychometricCard.tsx    # Add visualizations
└── EvidenceTooltip.tsx     # NEW - "Why?" hovers

app/
├── search/page.tsx         # Skeleton loaders, score badges
├── pipeline/page.tsx       # Score badges, comparison, pre-fetch
└── profile/[username]/
    └── deep/page.tsx       # Auto-run, visualizations, evidence

lib/services/
├── gemini/index.ts         # Add evidence to AI responses
└── analysisQueue.ts        # NEW - background processing
```

---

## Success Metrics

- Time to first value: < 30 seconds (currently ~2 min with onboarding)
- Clicks to see candidate analysis: 2 (currently 4+)
- User understands score meaning: Yes (color + label)
- AI insights feel trustworthy: Yes (evidence shown)

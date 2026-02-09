# Funnel Simplification - Issue 7-274

## Problem
Too many options, non-linear flow confusing users.

## Solution
Implemented Christopher's ideal 4-stage linear flow with gated progression.

## The 4 Stages

### Stage 1: SØGNING (Search) - `/search`
- **Purpose**: Define skills + hard requirements
- **What users do**: Search for candidates using skills and requirements
- **Output**: List of matching candidates
- **Navigation**: Can proceed to Stage 2 (List)

### Stage 2: LISTE (List) - `/pipeline`
- **Purpose**: See results → Select candidates with checkboxes
- **What users do**: 
  - Review candidate list
  - Select candidates using checkboxes
  - Compare up to 4 candidates side-by-side
- **Output**: Selected candidates saved to localStorage
- **Navigation**: 
  - "Continue to Analysis" button appears when candidates selected
  - Can go back to Stage 1 (Search)
  - **Cannot** skip to Stage 3 without making selections

### Stage 3: ANALYSE (Deep Dive) - `/analyse` ⭐ NEW
- **Purpose**: Deep data only on selected candidates
- **What users do**:
  - Review summary stats of selections
  - Click into individual deep profiles
  - Verify candidates before outreach
- **Output**: Confirmed selections for outreach
- **Navigation**:
  - "Continue to Outreach" button to proceed
  - Can go back to Stage 2 (List) to modify selections
  - **Gated**: Shows warning and redirects if no selections made in Stage 2
  - **Cannot** skip to Stage 4 without accessing this page

### Stage 4: HANDLING (Outreach) - `/shortlist`
- **Purpose**: Generate messages for final selections
- **What users do**:
  - Generate personalized outreach for each candidate
  - Copy messages or export
- **Output**: Ready-to-send outreach messages
- **Navigation**:
  - Can go back to Stage 3 (Analysis)
  - This is the final stage

## Gated Progression Implementation

### Visual Indicators
- ✅ **Completed stages**: Green checkmark, can click to go back
- 🔵 **Current stage**: Highlighted in blue, pulsing ring effect
- 🔒 **Future stages**: Grayed out, locked, not clickable

### Code Implementation
```typescript
// In PhaseIndicator.tsx
const canAccessPhase = (phaseId: number) => {
  return phaseId <= currentPhase;
};
```

### Stage-Specific Validation

#### Stage 3 (Analysis) Validation
- Checks `localStorage.getItem("apex_shortlist")`
- If empty → Shows warning + "Back to List" button
- If has selections → Shows selected candidates

#### Navigation Flow
```
Stage 1 (Search) → auto-load candidates → Stage 2 (List)
Stage 2 (List) → select candidates → Stage 3 (Analysis)
Stage 3 (Analysis) → review → Stage 4 (Outreach)
Stage 4 (Outreach) → generate messages → Done
```

## Key Changes

### 1. PhaseIndicator Component
- Updated to 4 stages with Danish labels
- Added gated progression logic
- Visual indicators for completed/locked stages
- Tooltip on locked stages: "Complete previous stages first"

### 2. New /analyse Page
- Created `app/analyse/page.tsx`
- Shows only candidates selected in Stage 2
- Summary statistics (count, avg alignment, strong matches)
- Individual deep profile links
- "Continue to Outreach" CTA

### 3. Pipeline Page Updates
- Updated navigation from `/shortlist` to `/analyse`
- ShortlistPanel button text: "Continue to Analysis"

### 4. ShortlistPanel Component
- Updated button text and styling
- Gradient effect on CTA button for emphasis

## Testing Checklist

### Flow Testing
- [x] Can start at Stage 1 (Search)
- [x] Search returns candidates → auto-navigates to Stage 2
- [x] Stage 2 allows checkbox selection
- [x] "Continue to Analysis" appears when selections made
- [x] Stage 3 only shows selected candidates
- [x] Stage 3 redirects if no selections
- [x] Stage 4 receives selections correctly

### Gated Progression
- [x] Cannot skip Stage 2 → directly to Stage 3
- [x] Cannot skip Stage 3 → directly to Stage 4
- [x] Can go back to previous stages
- [x] Locked stages show proper visual indicators

### Visual Validation
- [x] PhaseIndicator visible on all pages
- [x] Current stage highlighted correctly
- [x] Completed stages show checkmark
- [x] Future stages grayed out
- [x] Danish labels + English descriptions

## Files Changed
- ✅ `components/PhaseIndicator.tsx` - Updated with 4 stages + gating
- ✅ `app/analyse/page.tsx` - NEW Stage 3 page
- ✅ `app/pipeline/page.tsx` - Updated navigation
- ✅ `components/pipeline/ShortlistPanel.tsx` - Updated CTA text

## Definition of Done
- ✅ Stepper visible and working
- ✅ Gated progression works
- ✅ Full flow tested end-to-end
- ✅ PR committed (commit ec4ded8)

## Future Enhancements (Not in Scope)
- [ ] Persist stage progress across sessions
- [ ] Add "Skip this stage" for power users
- [ ] Stage completion percentage indicators
- [ ] Undo/redo for stage navigation

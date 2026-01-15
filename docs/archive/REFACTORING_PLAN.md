# Code Quality Complexity Refactoring Plan

**Branch:** `refactor/cq-complexity`
**Created:** 2026-01-08
**Goal:** Reduce complexity in 3 large files by 40-45% through systematic component and module extraction

---
---

## UI/UX Standards

All new and refactored components must adhere to the **Professional Minimalism** standards provided by the `ui-ux-pro-max-skill`.

- **Style:** **Subtle Minimalism**
  - **Surfaces:** Flat or ultra-subtle depth using `bg-apex-800/20` and `border-white/5`.
  - **Dividers:** Clean, thin lines using `border-slate-800`.
  - **Negative Space:** Increased padding for a more spacious, breathable layout.
- **Color Palette:** **Muted & Neutral**
  - **Primary Accents:** Use low-opacity colors (e.g., `bg-emerald-500/10` for success states).
  - **Text:** `slate-100` (Primary), `slate-400` (Secondary), `slate-500` (Muted).
- **Typography:** **Refined Professional**
  - **Headings:** `Poppins` (Sans-serif, light/medium weight) -> [Import Link](https://fonts.google.com/share?selection.family=Poppins:wght@400;500;600)
  - **Body:** `Open Sans` -> [Import Link](https://fonts.google.com/share?selection.family=Open+Sans:wght@300;400;500;600)
- **Guidelines:** 
  - **Micro-interactions:** Limit to subtle opacity/border transitions. No multi-color glows.
  - **Spill Control:** Avoid heavy drop shadows; use thin, crisp borders instead.
  - **Standardized Icons:** Strictly FontAwesome 6 (Regular weight). No emojis.

---

## Current State

| File | Lines | Main Issues |
|------|-------|-------------|
| `components/BattleCardCockpit.tsx` | 1,051 | Single massive component, inline PDF generation, mixed concerns |
| `components/TalentHeatMap.tsx` | 922 | Large modals inline, complex candidate cards, mixed state management |
| `services/geminiService.ts` | 1,243 | Inline prompts, duplicated error handling, mixed responsibilities |
| **TOTAL** | **3,216** | **Low testability, hard to maintain** |

---

## Target State

| File | Target Lines | Extraction Count | Reduction |
|------|--------------|------------------|-----------|
| `BattleCardCockpit.tsx` | ~650 | 6-8 components | 35-40% |
| `TalentHeatMap.tsx` | ~550 | 10-12 components + 4 hooks | 40-45% |
| `geminiService.ts` | ~650 | 8-10 modules | 45-50% |
| **TOTAL** | **~1,850** | **24-30 modules** | **~40%** |

---

## Implementation Phases

### **Phase 1: High-Impact Extractions** (Priority: URGENT)

#### 1.1 Extract CandidateGridRow from TalentHeatMap
- **Lines:** 711-897 (187 lines)
- **Impact:** 18% reduction in TalentHeatMap
- **Location:** `components/TalentHeatMap/CandidateGridRow.tsx`
- **Props:**
  ```typescript
  interface CandidateGridRowProps {
    candidate: Candidate;
    isSelected: boolean;
    isProcessing: boolean;
    isDeepProfileUnlocked: boolean;
    dataQuality: { score: number; label: string; color: string };
    onSelect: (id: string) => void;
    onUnlock: (candidate: Candidate) => void;
    onDelete: (id: string) => void;
  }
  ```

#### 1.2 Extract ImportModal from TalentHeatMap
- **Lines:** 437-557 (121 lines)
- **Impact:** 13% reduction in TalentHeatMap
- **Location:** `components/TalentHeatMap/ImportModal.tsx`
- **Props:**
  ```typescript
  interface ImportModalProps {
    showImport: boolean;
    onClose: () => void;
    onImport: (text: string) => void;
    isImporting: boolean;
    importText: string;
    onImportTextChange: (text: string) => void;
  }
  ```

#### 1.3 Extract Prompt Templates from geminiService
- **Lines:** ~500+ lines across multiple functions
- **Impact:** 40% reduction in geminiService
- **Locations:**
  - `prompts/personaGenPrompt.ts` (lines 176-271, 284-368)
  - `prompts/analyzeProfilePrompt.ts` (lines 273-278, 709-730)
  - `prompts/deepProfilePrompt.ts` (lines 851-872)
  - `prompts/outreachPrompt.ts` (lines 999-1040)
  - `prompts/networkDossierPrompt.ts` (lines 1080-1130)
- **Structure:**
  ```typescript
  export const PERSONA_SYSTEM_PROMPT = `...`;
  export const PERSONA_RESPONSE_SCHEMA = { ... };
  ```

#### 1.4 Create Unified AI Fallover Pattern
- **Current:** 150+ lines duplicated across 5 functions
- **Target:** Single reusable function
- **Location:** `services/aiCallWithFallover.ts`
- **Interface:**
  ```typescript
  export async function callAIWithFallover<T>(
    geminiFn: () => Promise<T>,
    openrouterFn: (prompt: string) => Promise<T>,
    context: string
  ): Promise<T>
  ```

**Expected Impact:** Removes ~958 lines, adds ~350 lines = **net -608 lines (19%)**

---

### **Phase 2: Medium-Impact Extractions** (Priority: HIGH)

#### 2.1 Extract Custom Hooks
- `hooks/useProfileActions.ts` (BattleCardCockpit lines 36-97)
- `hooks/useCandidateFiltering.ts` (TalentHeatMap lines 49-70)
- `hooks/useMultiSelect.ts` (TalentHeatMap lines 66-68)
- `hooks/useRadarChartData.ts` (BattleCardCockpit lines 302-334)

#### 2.2 Extract Service Utilities
- `services/scoreCalculation.ts` (geminiService lines 154-166, 544-570)
- `services/profileQualityGate.ts` (geminiService lines 633-699)
- `services/enrichmentMapper.ts` (geminiService lines 524-587)
- `services/openrouterClient.ts` (geminiService lines 33-77)
- `services/apiRetry.ts` (geminiService lines 79-119)

#### 2.3 Extract BattleCard Sub-Components
- `components/BattleCard/BattleCardHeader.tsx` (lines 341-433)
- `components/BattleCard/InsightsGrid.tsx` (lines 438-583)
- `components/BattleCard/ScoreBreakdownSection.tsx` (lines 585-773)
- `components/BattleCard/OutreachUnlockSection.tsx` (lines 1001-1044)

**Expected Impact:** Removes ~600 lines, adds ~200 lines = **net -400 lines (12%)**

---

### **Phase 3: Nice-to-Have Extractions** (Priority: MEDIUM)

#### 3.1 Small UI Components
- `components/TalentHeatMap/CandidateBadges.tsx` (lines 775-815)
- `components/TalentHeatMap/CandidateSummarySection.tsx` (lines 831-867)
- `components/TalentHeatMap/CandidateActionButton.tsx` (lines 869-894)
- `components/TalentHeatMap/SourcingConsole.tsx` (lines 392-435)
- `components/TalentHeatMap/CandidateFilterBar.tsx` (lines 579-670)

#### 3.2 Utility Functions
- `utils/profilePdfTemplate.ts` (BattleCardCockpit lines 99-300)
- `utils/linkedinUrlParsing.ts` (geminiService lines 489-519)
- `utils/candidateDataQuality.ts` (TalentHeatMap lines 272-287)

**Expected Impact:** Removes ~450 lines, adds ~150 lines = **net -300 lines (9%)**

---

## Total Projected Impact

| Phase | Net Reduction | Cumulative |
|-------|---------------|------------|
| Phase 1 | -608 lines | 19% |
| Phase 2 | -400 lines | 31% |
| Phase 3 | -300 lines | 40% |

**Final State:** 3,216 → ~1,900 lines = **41% reduction** ✅

---

## Implementation Order

1. ✅ Analysis complete
2. ✅ Phase 1.1: Extract & Upgrade CandidateListElement (UI Skills Applied)
3. ⬜ Phase 1.2: Extract ImportModal
4. ⬜ Phase 1.3: Extract Prompt Templates
5. ⬜ Phase 1.4: Create AI Fallover Pattern
6. ⬜ Run tests after Phase 1
7. ⬜ Phase 2: Extract hooks and utilities
8. ⬜ Run tests after Phase 2
9. ⬜ Phase 3: Extract remaining components
10. ⬜ Final validation & testing
11. ⬜ Update documentation
12. ⬜ Create PR

---

## Testing Strategy

After each phase:
1. Run `npm run type-check` to verify TypeScript
2. Run `npm test` to verify functionality
3. Run `npm run lint` to verify code quality
4. Manual smoke test in browser

---

## Rollback Plan

Each extraction will be a separate commit with format:
```
refactor(component-name): extract SubComponent from MainComponent

- Reduces MainComponent from X to Y lines
- Improves testability of SubComponent
- No functionality changes
```

If issues arise, we can `git revert` individual commits.

---

## Success Metrics

- ✅ All files < 700 lines
- ✅ Test coverage maintained or improved
- ✅ No functionality regressions
- ✅ Build passes
- ✅ Lint passes
- ✅ TypeScript strict mode passes

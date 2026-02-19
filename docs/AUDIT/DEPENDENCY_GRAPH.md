# RecruitOS — Dependency Graph
> Written: 2026-02-19 | Auditor: Mason (subagent)

---

## Module Dependency Matrix

```
                    ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
                    │  M1 │  M2 │  M3 │  M4 │  M5 │  M6 │  M7 │
                    │Srch │Pipe │ AI  │Pay  │Ready│Intg │Auth │
┌───────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ M1 Search         │  —  │ OUT │     │     │     │     │ IN  │
│ M2 Pipeline       │ IN  │  —  │ IN  │     │ IN  │ IN  │ IN  │
│ M3 AI Analysis    │     │ IN  │  —  │     │     │     │ IN  │
│ M4 Payments       │     │     │     │  —  │     │     │ IN  │
│ M5 Job Readiness  │ IN  │     │     │     │  —  │     │ IN  │
│ M6 Integrations   │     │ OUT │     │     │     │  —  │ IN  │
│ M7 Auth/Data      │  —  │  —  │  —  │  —  │  —  │  —  │  —  │
└───────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

IN  = depends on that module's output
OUT = produces output consumed by that module
```

**Key observation:** M7 (Auth/Data) is the only universal dependency. M2 (Pipeline) is the central hub — it receives from M1, delegates to M3, M5, M6, and reads M7.

---

## Coupling Analysis

### Tightly Coupled Pairs (Hard to Split)

#### M2 ↔ M3: Pipeline ↔ AI Analysis
**Coupling score: VERY HIGH**
- `app/pipeline/page.tsx` imports AI scoring inline and renders `alignmentScore`
- `Candidate` model carries 20+ AI-generated fields (`persona`, `deepAnalysis`, `scoreBreakdown`, etc.)
- Score display, filtering by score, and sorting all live inside `pipeline/page.tsx`
- Cannot cleanly separate "show candidate" from "show AI score" without a major refactor

#### M2 ↔ M6: Pipeline ↔ LinkedIn Integration
**Coupling score: HIGH**
- LinkedIn enrichment writes directly to `Candidate.*` fields (LinkedIn-specific section in schema)
- `app/api/linkedin/candidate/route.ts` creates/updates Candidate records
- `Candidate.sourceType` determines which enrichment paths are active
- The Chrome Extension flow bypasses the normal M1→M2 flow entirely

#### M3 ↔ M3 (Internal): geminiService vs services/ai/*
**Coupling score: HIGH (internal duplication)**
- `services/geminiService.ts` and `services/ai/client.ts` both define `getAiClient()` and `callOpenRouter()`
- `lib/services/gemini/index.ts` is a third AI client entry point
- Callers are inconsistent — some import `geminiService`, some import `services/ai/client`
- Risk: OpenRouter model version drift between the two clients (`gemini-2.0-flash-001` vs `gemini-3-flash-preview`)

### Clean Pairs (Safe to Extract First)

#### M5: Job Readiness Engine
**Coupling score: VERY LOW**
- 7 pillar files are each ~100 lines and independently testable
- Engine only touches `Candidate.jobReadiness (Json)` — well-defined write point
- `ExternalFetchers` interface enables dependency injection for testing
- **Safest module to work on in isolation**

#### M4: Credit & Payments
**Coupling score: LOW**
- `lib/credits.ts` only imports `lib/db.ts` — one dependency
- Stripe webhook processing is self-contained
- No AI dependencies, no search dependencies
- Only coupling: credit checks gated on `requireAuth()` in M7

#### M1: Search & Discovery
**Coupling score: LOW**
- `lib/github.ts` has no DB writes
- `lib/search/*` are pure functions (no side effects)
- Outputs flow to M2 but M1 doesn't hold references to M2
- Anti-gaming filters (`lib/anti-gaming-filters.ts`) are pure, well-tested

---

## Cross-cutting Concerns

These touch every module. Any change here has blast radius across the entire codebase.

| Concern | Files | Risk of Change |
|---|---|---|
| **Auth** | `lib/auth.ts`, `lib/auth-guard.ts` | VERY HIGH — 30+ API routes import auth-guard |
| **Database** | `lib/db.ts`, `prisma/schema.prisma` | VERY HIGH — schema change = migration + all query sites |
| **Candidate model** | `types.ts` (729 lines), Prisma schema | HIGH — model has 40+ fields used everywhere |
| **Validation** | `lib/validation/apiSchemas.ts` | HIGH — 16 API routes depend on Zod schemas |
| **Logging** | `services/logger.ts` | LOW — easy to swap out |
| **Demo mode** | `lib/demoData.ts`, `requireOptionalAuth()` | MEDIUM — demo path touches auth + pipeline |

---

## Top 5 God Files

Files that do too much and resist modular extraction:

### 1. `app/pipeline/page.tsx` — 2254 lines
**Why it's a god file:**
- Renders the candidate list UI
- Implements hard requirements filtering (location, skill, language)
- Manages pipeline stage drag-and-drop
- Displays AI scores and readiness badges
- Handles demo mode seeding
- Contains search query parsing that belongs in M1
- Location filtering logic that belongs in the API layer

**Risk of touching:** HIGH — any change can break the main user flow

### 2. `app/profile/[username]/deep/page.tsx` — 2386 lines (largest file)
**Why it's a god file:**
- Renders the full deep profile view
- Fetches and displays AI analysis, psychometric profile, interview guide
- Manages credit gating UI inline
- Contains the "buildprint" visualization
- Has its own data fetching, loading states, and error handling all in one component

**Risk of touching:** MEDIUM — mostly read-only display, but huge cognitive load

### 3. `services/geminiService.ts` — 949 lines
**Why it's a god file:**
- AI client initialization (duplicated in `services/ai/client.ts`)
- Scoring function
- Persona generation
- Deep profile generation
- Outreach message generation
- Comparative analysis
- Interview guide generation
- Network dossier generation
- Each of these should be a separate file in `services/ai/`

**Risk of touching:** HIGH — AI prompt changes affect output quality and downstream parsing

### 4. `types.ts` — 729 lines
**Why it's a god file:**
- Defines ALL TypeScript interfaces for the entire app
- Mixes: Candidate model, AI response schemas, enrichment types, score types, funnel stages, persona types, network types
- Monolithic import — `import { Candidate } from '../types'` pulls in 729 lines of definitions

**Risk of touching:** MEDIUM — adding types is safe; changing existing interfaces breaks callers

### 5. `lib/validation/apiSchemas.ts` — 16 imports across API routes
**Why it's a concern (not lines, but blast radius):**
- Single Zod schema file for all API endpoints
- `candidateCreateSchema` is particularly large (40+ fields)
- A schema change breaks ALL consumers simultaneously
- No versioning or backward compat strategy

**Risk of touching:** MEDIUM — schema widening is safe; narrowing breaks existing clients

---

## Dead Code / Technical Debt Hotspots

| File | Issue |
|---|---|
| `lib/storage.ts` | Vercel KV — deprecated, still imported by 1 API route |
| `services/enrichmentServiceLegacy.ts` | Name says "legacy" — verify if still used |
| `services/supabase.ts` | Supabase-backed service — being replaced by Prisma |
| `lib/supabase/` | Supabase client files — check if any API routes still use these |
| `services/ai/client.ts` | Duplicates `services/geminiService.ts` AI init |
| `lib/services/gemini/index.ts` | Third AI client entry point — unclear vs others |
| `app/batch/page.tsx` | "Batch" page — unclear purpose, may be abandoned |
| `app/wizard/page.tsx` | Wizard UI — unclear if in main flow |
| `app/metrics/page.tsx` | May overlap with `app/analytics/page.tsx` |
| `app/network-intelligence/page.tsx` | Network analysis — unclear if active feature |
| `docs/ARCHITECTURE.md` | References Next.js 14 + "mock data" — completely outdated |

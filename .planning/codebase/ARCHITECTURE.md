# Architecture

**Analysis Date:** 2026-01-24

## Pattern Overview

**Overall:** Layered Next.js application with client-side state management and opt-in server persistence

**Key Characteristics:**
- Client-first state (localStorage as primary store)
- Server-side API routes with NextAuth authentication
- Multi-stage candidate evaluation funnel (INTAKE → SHORTLIST → DEEP_PROFILE → OUTREACH)
- AI-driven enrichment pipeline with graceful degradation
- Credit metering for all paid operations

## Layers

**Presentation Layer (Components):**
- Purpose: React components for UI rendering with framer-motion animations
- Location: `components/`, `app/*/page.tsx`
- Contains: Page components, feature components (SearchBar, CandidatePipelineItem, OutreachModal), UI primitives (shadcn/ui), Cult UI components (Dock, Expandable)
- Depends on: Services, hooks, utilities, types
- Used by: Next.js App Router for rendering pages
- Notable pattern: Inline insights via Expandable components to eliminate "pogo-sticking" (click → new page → back)

**API Layer (Server):**
- Purpose: RESTful API routes with NextAuth session handling
- Location: `app/api/[endpoint]/route.ts`
- Contains: HTTP handlers (GET, POST), request validation, session verification, integration calls
- Depends on: Services, database clients, external APIs
- Used by: Client-side fetch calls, external webhooks
- Routes organized by feature: `/search`, `/profile/analyze`, `/github/`, `/brightdata/`, `/team/`, `/outreach/`, `/credits/`, `/developers/`

**Service Layer (Business Logic):**
- Purpose: Reusable business logic and external API integration
- Location: `services/`
- Contains: AI operations, data fetching, enrichment pipelines, scoring algorithms, team collaboration
- Key services:
  - `geminiService.ts` - Google Gemini AI calls with retry logic (responseMimeType, JSON schemas)
  - `enrichmentServiceV2.ts` - Multi-source evidence collection and persona building
  - `candidateService.ts` - Dual-mode persistence (localStorage + Supabase)
  - `scrapingService.ts` - Firecrawl and BrightData integration
  - `behavioralSignalsService.ts` - Job-seeking signal detection
  - `networkAnalysisService.ts` - Relationship and network mapping
  - `socialMatrixService.ts` - Connection path analysis (6-degrees)
  - `githubConnectionService.ts` - GitHub graph traversal
  - `linkedInConnectionService.ts` - LinkedIn connection mapping
  - `teamService.ts` - Multi-user workspace management

**Library/Utility Layer (Helpers):**
- Purpose: Reusable utilities, search intelligence, type definitions
- Location: `lib/`, `types.ts`
- Contains:
  - Auth config (`lib/auth.ts` - NextAuth with GitHub OAuth)
  - GitHub API wrapper (`lib/github.ts` - Octokit with search parsing)
  - Search intelligence (`lib/search/` - multi-language parsing for location, experience, skills)
  - Database clients (`lib/supabase/`)
  - Payment integration (`lib/stripe.ts`, `lib/pricing.ts`)
  - Admin context (`lib/adminContext.tsx` - Ctrl+Shift+A toggle)
  - Type definitions (`types.ts` - Candidate, Persona, ScoreBreakdown, FunnelStage enums)

**Data Layer (Persistence):**
- Purpose: Data persistence and synchronization
- Location: Dual-layer via `candidateService.ts`
- Mechanisms:
  - Primary: localStorage (synchronous, always available)
  - Secondary: Supabase PostgreSQL (async, optional)
  - Pattern: Write to localStorage first, then attempt Supabase sync without blocking
  - Graceful degradation: Falls back to localStorage if Supabase unavailable

## Data Flow

**Candidate Search Flow:**

1. User enters query on `/` (home page)
   - Query stored in localStorage as `recruitos_pending_search`
   - Redirect to `/intake`

2. Intake page (`app/intake/page.tsx`)
   - Job context collected (required vs preferred skills, location)
   - Triggers `/api/search` with job context

3. Search API (`app/api/search/route.ts`)
   - Query parsed via `lib/github.ts`:
     - Multi-language experience extraction ("5 års erfaring" → 5 years)
     - Location normalization (København → copenhagen)
     - Skill/framework mapping (react → javascript)
     - Stop word filtering (DA, SV, DE, NO, EN)
   - GitHub API search executed with parsed qualifiers
   - Results returned to `/search` page

4. Search page (`app/search/page.tsx`)
   - Displays 10-50 developers per page
   - Behavioral signals fetched async (`/api/github/signals`)
   - Connection badges loaded (`/api/github/connection-path`)

5. User clicks candidate → adds to pipeline
   - Candidate created via `candidateService.create()`
   - Stored in localStorage + Supabase
   - Moved to `/pipeline`

**Candidate Evaluation Flow:**

6. Pipeline page (`app/pipeline/page.tsx`)
   - Candidates grouped by FunnelStage (INTAKE, SHORTLIST, DEEP_PROFILE, OUTREACH)
   - Inline expansion via Expandable component
   - Deep profile fetched on expand (`/api/profile/analyze`)

7. Profile Analysis API (`app/api/profile/analyze/route.ts`)
   - Calls Gemini in parallel:
     - `generatePersona()` - Psychometric profiling
     - `analyzeCandidateProfile()` - Alignment scoring (0-100)
     - `generateDeepProfile()` - Evidence-based analysis
     - `generateNetworkDossier()` - Only for shortlisted candidates (Stage 3)
   - Returns: persona, scoreBreakdown, keyEvidence, risks, interviewGuide

8. Candidate moves to SHORTLIST
   - Gemini generates detailed analysis
   - Deep profile component displays interviewGuide, companyMatch
   - Cost metered via credit system (278-741 credits per operation)

9. Candidate moves to DEEP_PROFILE
   - Optional: User generates outreach message
   - Calls `/api/outreach` with message template
   - Calls `generateOutreach()` from geminiService

10. Candidate moves to OUTREACH
    - Message finalized
    - Credits deducted from user balance (`apex_credits` in localStorage)

**State Management:**

Persisted state in localStorage:
- `apex_credits` - Credit balance (integer)
- `apex_logs` - Audit event history (JSON array, EU AI Act compliance)
- `apex_job_context` - Current job description
- `apex_candidates` - All candidates (via candidateService)
- `recruitos_search_count` - Free search limit tracking
- `recruitos_admin_mode` - Admin toggle state
- `recruitos_pending_search` - Queued search query

Client-side session:
- Obtained via `useSession()` hook from NextAuth
- Contains GitHub OAuth token for authenticated API requests (higher rate limits)

## Key Abstractions

**Candidate Interface:**
- Purpose: Unified representation of evaluated developer
- Examples: `types.ts` line 150+
- Pattern: TypeScript interface with optional deep profile fields
- Core properties: `id`, `name`, `currentRole`, `company`, `location`, `alignmentScore` (0-100)
- Nested objects: `scoreBreakdown` (5 weighted components), `persona`, `interviewGuide`, `companyMatch`, `indicators` (workstyle traits)
- Funnel tracking: `unlockedSteps` array tracks which stages are completed

**FunnelStage Enum:**
- Purpose: Track candidate progress through evaluation pipeline
- Values: INTAKE (1), SHORTLIST (2), DEEP_PROFILE (3), OUTREACH (4)
- Location: `types.ts` line 2-7
- Usage: Candidates stored with `unlockedSteps` to prevent regression

**ScoreBreakdown:**
- Purpose: Explain alignment score components
- Components: skills (0-100), experience (0-100), industry (0-100), seniority (0-100), location (0-100)
- Each component has: `value`, `max` (100), `percentage`, optional `reasoning`
- Location: `types.ts` line 123-129

**Persona (CandidatePersona):**
- Purpose: AI-generated psychometric profile of candidate
- Attributes: currentRole, pastRoles, skills, domains, seniority level, location, evidence with sources
- Generated by: `generatePersona()` in `services/geminiService.ts`
- Used in: Interview preparation, culture fit assessment

**EvidenceSource:**
- Purpose: Track data sources for enrichment pipeline
- Properties: `url`, `title`, `snippet`, `rawText`
- Collected from: LinkedIn (BrightData), SERP results, resume text, GitHub profile
- Location: `types.ts` line 23-28

## Entry Points

**Browser Entry:**
- Location: `app/page.tsx` (homepage)
- Triggers: Search query input → redirect to `/intake`
- Responsibilities: Hero section, search box, feature explanations, pricing CTA

**Authenticated Entry:**
- Location: `app/login/page.tsx` (NextAuth GitHub OAuth)
- Triggers: User clicks "Sign in with GitHub"
- Responsibilities: OAuth redirect handling via NextAuth

**Admin Entry:**
- Location: Keyboard shortcut (Ctrl+Shift+A)
- Hook: `useAdmin()` from `lib/adminContext.tsx`
- Triggers: Toggles `recruitos_admin_mode` in localStorage
- UI: Bottom-center Mac-style dock (`components/AdminDock.tsx`)

**API Entry Points:**
- `/api/search` - GitHub developer search (public, no auth required)
- `/api/profile/analyze` - AI profile analysis (requires credits)
- `/api/github/signals` - Behavioral signal detection (no auth required)
- `/api/github/connection-path` - Social matrix connection paths
- `/api/team/*` - Team collaboration endpoints (requires auth)
- `/api/outreach` - Message generation (requires credits)

## Error Handling

**Strategy:** Try-catch with console logging and graceful degradation

**Patterns:**

1. **Supabase Fallback** (`services/candidateService.ts`):
```typescript
const supabase = getSupabase(); // Returns null if not configured
if (!supabase) {
  console.warn('Supabase not connected. Using localStorage persistence.');
  return loadFromLocalStorage();
}
try {
  const { data, error } = await supabase.from('candidates').select();
  if (error) {
    console.error('Supabase error:', error);
    return loadFromLocalStorage(); // Fallback
  }
} catch (err) {
  console.error('Supabase connection error:', err);
  return loadFromLocalStorage();
}
```

2. **Gemini Retry Logic** (`services/geminiService.ts`):
- Exponential backoff for 503/429 errors
- Attempts up to 3 retries with delay: `Math.pow(2, i) * 1000 + Math.random() * 1000`
- Falls back to secondary model (google/gemini-2.5-flash) if primary fails

3. **Non-Critical Failures** (`app/api/profile/analyze/route.ts`):
```typescript
// Network dossier is optional, don't fail entire request
if (isShortlisted) {
  try {
    networkDossier = await generateNetworkDossier(...);
  } catch (dossierError) {
    console.error("Network dossier generation failed (non-critical)");
    // Request still succeeds without it
  }
}
```

4. **Logging Service** (`services/logger.ts`):
- Environment-aware: debug/info suppressed in production, only warn/error logged
- Structured with context: service, operation, metadata
- Methods: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`, `logger.apiCall()`, `logger.dbOperation()`

## Cross-Cutting Concerns

**Logging:**
- Pattern: Centralized logger (`services/logger.ts`) with environment awareness
- Usage: API calls log via `logger.apiCall(service, operation, success, duration)`
- Database operations log via `logger.dbOperation(operation, table, success, error)`

**Validation:**
- Pattern: Type safety via TypeScript interfaces
- Zod schemas used in some API routes for request validation
- GitHub API response parsing validates expected shape

**Authentication:**
- Pattern: NextAuth with GitHub OAuth strategy
- Session obtained via `getServerSession(authOptions)` in API routes
- Access token from session used to increase GitHub API rate limits
- Optional: Some endpoints work anonymously (search, signals)

**Authorization:**
- Pattern: Session presence checked in sensitive operations
- Team endpoints enforce ownership via team_members table
- Role-based permissions stored in Supabase row-level security policies

**Credit Metering:**
- Pattern: All AI operations charged via PRICING constants in `types.ts`
- Examples: DEEP_PROFILE (278 credits), OUTREACH (463 credits), FULL_ANALYSIS (741 credits)
- UI: CreditGate component (`components/CreditGate.tsx`) prevents operations when balance < cost
- Conversion: CREDITS_TO_EUR = 0.54 for pricing display

**Request Context:**
- Job context stored in localStorage (`apex_job_context`) and passed to all AI operations
- Context used by Gemini for personalized scoring and outreach generation
- Falls back to default job context if not provided

---

*Architecture analysis: 2026-01-24*

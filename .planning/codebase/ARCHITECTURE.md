# Architecture

**Analysis Date:** 2026-02-16

## Pattern Overview

**Overall:** Next.js 16 App Router with layered service architecture

**Key Characteristics:**
- API-driven backend with Prisma ORM + PostgreSQL for persistence
- Client-side component architecture with next-auth OAuth integration
- Multi-stage candidate funnel with AI-powered scoring pipeline
- Dual-mode operation: authenticated user workflows + public profiles
- Credit system metering all AI operations
- Middleware-enforced authentication and rate limiting

## Layers

**UI/Presentation Layer:**
- Purpose: React components for user interactions, form inputs, result displays
- Location: `components/` and page routes in `app/*/page.tsx`
- Contains: Functional React components with hooks, forms, dashboards, cards
- Depends on: Services layer (via fetch to `/api`), React hooks, Radix UI
- Used by: Next.js app router for page rendering

**API Layer:**
- Purpose: HTTP endpoints for client-server communication and webhooks
- Location: `app/api/*/route.ts` (Next.js API routes)
- Contains: Handlers for GET/POST/PUT/DELETE, request validation, authentication guards
- Depends on: Services layer, Prisma ORM, external APIs
- Used by: Client components (fetch), webhooks (Stripe, external services)

**Services Layer:**
- Purpose: Business logic, AI operations, data transformations
- Location: `services/` directory (26 service files)
- Contains: Gemini AI analysis, enrichment pipelines, scraping, analytics
- Depends on: Prisma, external APIs (Google Gemini, Firecrawl, BrightData)
- Used by: API routes, server-side utilities

**Data Layer:**
- Purpose: Type-safe database operations and ORM
- Location: `prisma/schema.prisma`, `lib/db.ts`, Prisma generated client
- Contains: 11 data models (User, Candidate, Payment, CreditLedger, etc.)
- Depends on: PostgreSQL database
- Used by: Services and API routes via Prisma client singleton

**Utilities/Shared:**
- Purpose: Reusable functions, constants, helpers
- Location: `lib/` directory (60+ utility files)
- Contains: Auth config, search intelligence, pricing, GitHub API wrappers
- Depends on: External SDKs, types
- Used by: Everywhere (components, services, API routes)

## Data Flow

**Search to Analysis Pipeline:**

1. User enters search query on `/search` page
2. Client form submission calls `POST /api/search/serp`
3. API route calls `lib/github.ts` (Octokit wrapper) to fetch GitHub results
4. Results streamed back to client, displayed as candidate cards
5. User clicks candidate → calls `POST /api/github/deep` for deep analysis
6. Service calls `geminiService.analyzeCandidateProfile()` + external scrapers
7. Response stored in Prisma `Candidate` model
8. Results displayed in `/profile/[username]` with AI insights

**Candidate Funnel:**

1. **Sourcing**: GitHub search or LinkedIn extension captures candidate
2. **Shortlisting**: User reviews alignment score (0-100), adds notes via `/api/candidates/[id]/notes`
3. **Deep Profile**: Calls `geminiService.generateDeepProfile()` for psychometric analysis
4. **Interview Prep**: `geminiService.generateOutreach()` for personalized messages
5. **Outreach**: Email/LinkedIn integration to contact candidate

**Credit Flow:**

1. Each AI operation consumes predefined credits (`PRICING` in `types.ts`)
2. `POST /api/credits/consume` deducts credits from `User.credits`
3. Transaction recorded in `CreditLedger` model (audit trail)
4. `POST /api/checkout/credits` triggers Stripe session for credit purchase
5. Webhook at `POST /api/webhooks/stripe` updates `Payment` and `User.credits`

**State Management:**

- **Server state**: Persisted in PostgreSQL via Prisma
- **Client state**: Component-level via React hooks (`useState`), some localStorage for admin mode (`recruitos_admin_mode`)
- **Session state**: NextAuth JWT tokens in cookies
- **URL state**: Pagination, filters via `searchParams` in Next.js

## Key Abstractions

**Candidate (Domain Model):**
- Purpose: Unified representation of a person being evaluated
- Examples: `types.ts` interface, `Candidate` Prisma model, `/api/candidates` CRUD
- Pattern: Fields for identity (name, location), GitHub/LinkedIn sources, AI scores, analysis results, pipeline stage

**EnrichmentPipeline:**
- Purpose: Orchestrate multi-step candidate data gathering and AI analysis
- Examples: `services/enrichmentServiceV2.ts` (primary), `services/advancedEnrichmentService.ts`
- Pattern: Fetch external data → call AI → structure results → store in Prisma

**AuditLog (EU AI Act Compliance):**
- Purpose: Immutable record of profiling decisions for transparency
- Examples: `services/auditService.ts`, `CreditLedger` model
- Pattern: Every AI operation logged with timestamp, user, inputs, outputs, credits consumed

**SearchIntelligence:**
- Purpose: Multi-language query parsing for natural recruitment searches
- Examples: `lib/search/` (locationNormalizer, experienceParser, skillNormalizer, combinedSearch)
- Pattern: Regex/heuristic parsing to extract intent from unstructured queries

**BehavioralSignals:**
- Purpose: Detect job-seeking indicators from GitHub/LinkedIn profiles
- Examples: `services/behavioralSignalsService.ts`, `components/BehavioralBadges.tsx`
- Pattern: Analyze profile metadata, activity, bio keywords → engagement score

## Entry Points

**Web Application:**
- Location: `app/layout.tsx` (root), `app/page.tsx` (homepage)
- Triggers: Browser request to `https://recruitos.dk` or `/[route]`
- Responsibilities: Provide global layout with Header, Footer, AdminDock; wrap with Providers (NextAuth, Calibration); route to page components

**Authentication:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: NextAuth OAuth flow (GitHub login)
- Responsibilities: Handle GitHub OAuth callback, create/update User, set JWT cookie

**Search Endpoint:**
- Location: `app/api/search/serp/route.ts`
- Triggers: Client form submission from `/search` page
- Responsibilities: Parse query, call GitHub API, validate results, return JSON

**Profile Analysis:**
- Location: `app/api/github/deep/route.ts`
- Triggers: User clicks "Analyze" on candidate card
- Responsibilities: Fetch candidate profile, call Gemini AI, store results in Prisma, return analysis

**Candidate CRUD:**
- Location: `app/api/candidates/route.ts` + `app/api/candidates/[id]/route.ts`
- Triggers: Pipeline view CRUD operations, LinkedIn extension POST
- Responsibilities: Create/read/update/delete Candidate records with userId scoping

**Credit Consumption:**
- Location: `app/api/credits/consume/route.ts`
- Triggers: AI operations before execution
- Responsibilities: Check balance, deduct credits, log transaction, return success/failure

**Webhook Handlers:**
- Location: `app/api/webhooks/stripe/route.ts`, `app/api/linkedin/notifications/route.ts`
- Triggers: Stripe events, LinkedIn extension notifications
- Responsibilities: Verify signature, update database, trigger side effects

## Error Handling

**Strategy:** Layered try-catch with explicit error types, fallback values, and detailed logging

**Patterns:**

1. **API Route Level** (`app/api/*/route.ts`):
   - Catch all exceptions, validate request schema with zod
   - Return `{ error: string, status: number }` JSON responses
   - Log to Sentry for production monitoring
   - Example: `app/api/candidates/route.ts` validates `candidateCreateSchema`

2. **Service Level** (`services/*.ts`):
   - Retry logic for transient failures (503, 429 from Gemini)
   - Graceful degradation if external APIs fail
   - Example: `geminiService.ts` has 3-retry fallback to OpenRouter

3. **Component Level** (`components/`, `app/*/page.tsx`):
   - Show toast notifications via `sonner` library
   - Disable buttons/show spinners during async operations
   - Fall back to cached data or empty states if API fails

4. **Type Safety:**
   - TypeScript strict mode enforces type checking at compile time
   - Zod schemas for runtime validation of API inputs
   - Prisma types prevent SQL injection and data mismatches

## Cross-Cutting Concerns

**Logging:**
- Centralized: `services/logger.ts` for structured logging
- Usage: Service functions log operations with context (userId, candidateId, creditCost)
- Transport: Console in dev, Sentry in production

**Validation:**
- Input: Zod schemas in `lib/validation/apiSchemas.ts` for API requests
- Database: Prisma schema enforces field types and relations
- Business rules: Service functions validate before mutations

**Authentication:**
- Method: NextAuth with GitHub OAuth
- Token: JWT stored in httpOnly cookie
- Protection: Middleware at `middleware.ts` protects routes, API routes call `requireAuth()` or `requireOptionalAuth()`

**Authorization:**
- User-scoped data: All CRUD operations filter by `userId` (e.g., `where: { userId }`)
- Row-level: Candidates, notes, payments owned by user
- Public profiles: `/api/developers/[username]` and `SharedProfile` model allow unauthenticated read access

**Rate Limiting:**
- Library: `lib/rate-limit.ts`
- Applied at: Middleware (per-route limits) and API routes
- Strategy: Token bucket with configurable thresholds per endpoint
- Example: Search limited to prevent abuse

**Credits System:**
- Metering: `lib/credits.ts` defines operation costs
- Enforcement: `lib/useCredits.ts` hook checks balance before AI calls
- Accounting: `CreditLedger` model tracks every transaction for audit
- Refunds: Auto-refund if enrichment fails (manual_required outcome)

---

*Architecture analysis: 2026-02-16*

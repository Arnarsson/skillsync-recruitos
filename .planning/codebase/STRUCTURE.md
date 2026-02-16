# Codebase Structure

**Analysis Date:** 2026-02-16

## Directory Layout

```
skillsync-recruitos/
├── app/                        # Next.js App Router (all routes)
│   ├── api/                   # API endpoints (Next.js routes)
│   │   ├── auth/              # Authentication (NextAuth)
│   │   ├── candidates/        # Candidate CRUD
│   │   ├── credits/           # Credit management & consumption
│   │   ├── github/            # GitHub data & analysis
│   │   ├── linkedin/          # LinkedIn profile & enrichment
│   │   ├── profile/           # AI profile analysis
│   │   ├── search/            # Search endpoints
│   │   ├── webhooks/          # External webhooks (Stripe, LinkedIn)
│   │   ├── outreach/          # Message generation
│   │   └── [other features]/  # Team, calibration, analytics, etc.
│   ├── analyse/               # Analysis dashboard page
│   ├── analytics/             # Analytics & reporting page
│   ├── batch/                 # Batch operations page
│   ├── candidates/            # Candidate management page
│   ├── compare/               # Candidate comparison page
│   ├── dashboard/             # Main dashboard
│   ├── intake/                # Job context input form
│   ├── linkedin-captures/     # LinkedIn capture viewing
│   ├── pipeline/              # Main candidate pipeline page (1881 lines)
│   ├── profile/[username]/    # Individual candidate profile pages
│   ├── search/                # Search results page
│   ├── shortlist/             # Shortlist management page
│   ├── settings/              # User settings page
│   ├── team/                  # Team collaboration page
│   ├── login/, signup/        # Auth pages
│   ├── pricing/, privacy/, terms/ # Static pages
│   ├── page.tsx               # Homepage
│   └── layout.tsx             # Root layout wrapper
│
├── services/                  # Business logic layer (26 files)
│   ├── geminiService.ts       # Unified AI service (Gemini + OpenRouter)
│   ├── enrichmentServiceV2.ts # Primary enrichment pipeline
│   ├── enrichmentServiceLegacy.ts # Deprecated enrichment
│   ├── behavioralSignalsService.ts # Job-seeking signal detection
│   ├── scrapingService.ts     # Firecrawl & BrightData integration
│   ├── networkAnalysisService.ts # LinkedIn network mapping
│   ├── socialMatrixService.ts # Social relationship analysis
│   ├── personalityService.ts  # Psychometric analysis
│   ├── deepResearchService.ts # Extended candidate research
│   ├── calibrationService.ts  # AI calibration & feedback
│   ├── teamService.ts         # Team collaboration features
│   ├── teamTailorService.ts   # TeamTailor ATS integration
│   ├── auditService.ts        # EU AI Act compliance logging
│   ├── logger.ts              # Structured logging utility
│   ├── candidateService.ts    # Candidate persistence (API-backed)
│   ├── jobService.ts          # Job context management
│   └── [other services]/      # GitHub connections, verification, etc.
│
├── lib/                       # Shared utilities & helpers (60+ files)
│   ├── db.ts                  # Prisma singleton
│   ├── auth.ts                # NextAuth configuration
│   ├── auth-guard.ts          # Authentication middleware guards
│   ├── adminContext.tsx       # Admin mode context provider
│   ├── github.ts              # Octokit GitHub API wrapper + search parsing
│   ├── credits.ts             # Credit system utilities
│   ├── pricing.ts             # Pricing models & calculations
│   ├── stripe.ts              # Stripe API wrapper
│   ├── rate-limit.ts          # Rate limiting implementation
│   ├── psychometrics.ts       # Personality assessment tools
│   ├── techStackMatching.ts   # Technology requirements matching
│   ├── skillClaims.ts         # Skill verification logic
│   ├── interviewPrep.ts       # Interview preparation generation
│   ├── teamFit.ts             # Team compatibility analysis
│   ├── salaryEstimator.ts     # Compensation prediction
│   ├── timezone.ts            # Timezone utilities
│   ├── candidate-identity.ts  # Candidate deduplication logic
│   ├── i18n/                  # Internationalization (Danish, English, etc.)
│   ├── search/                # Multi-language search parsing
│   │   ├── locationNormalizer.ts  # City name normalization
│   │   ├── experienceParser.ts    # "5 years" → structured data
│   │   ├── skillNormalizer.ts     # "React" → ["javascript", "react"]
│   │   └── constants.ts           # Stop words for multiple languages
│   ├── enrichment/            # Enrichment pipeline utilities
│   ├── supabase/              # Supabase client (deprecated, Prisma primary)
│   ├── validation/            # Zod schemas for API validation
│   └── [other utilities]/     # Prompts, linkedin-parser, brightdata, etc.
│
├── components/                # React components (60+ files)
│   ├── ui/                    # shadcn/ui + Radix + Cult UI primitives
│   │   ├── button.tsx, card.tsx, input.tsx, etc.
│   │   ├── dock.tsx           # Mac-style dock (Cult UI, modified)
│   │   └── expandable.tsx     # Expandable cards with animations (Cult UI)
│   ├── calibration/           # Calibration widget components
│   ├── linkedin/              # LinkedIn-specific components
│   ├── network-intelligence/  # Network analysis UI
│   ├── outreach/              # Message composition UI
│   ├── pipeline/              # Pipeline-specific components
│   ├── profile/               # Profile detail components
│   ├── search/                # Search result components
│   ├── skills/                # Skill-related components
│   ├── wizard/                # Setup wizard components
│   ├── Header.tsx             # Global header
│   ├── Footer.tsx             # Global footer
│   ├── AdminDock.tsx          # Admin mode dock navigation
│   ├── GlobalBreadcrumbs.tsx  # Breadcrumb navigation
│   ├── BehavioralBadges.tsx   # Job-seeking signal indicators
│   ├── CreditGate.tsx         # Credit availability guard
│   ├── Providers.tsx          # Root context providers
│   └── [feature components]/  # Domain-specific components
│
├── prisma/                    # Prisma ORM
│   ├── schema.prisma          # Database schema (11 models)
│   └── migrations/            # Database migration history
│
├── tests/                     # Test suite
│   ├── api/                   # API route tests
│   ├── auth/                  # Authentication tests
│   ├── e2e/                   # End-to-end Playwright tests
│   ├── hooks/                 # Hook tests
│   ├── lib/                   # Utility function tests
│   └── services/              # Service layer tests
│
├── public/                    # Static assets
├── locales/                   # i18n translation files
├── docs/                      # Documentation & guides
├── scripts/                   # Build & utility scripts
├── hooks/                     # React hooks (useCandidates, etc.)
│
├── types.ts                   # Global TypeScript types & interfaces
├── constants.ts               # Global constants
├── middleware.ts              # Next.js middleware (auth, CORS, rate limit)
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
└── vitest.config.ts           # Vitest test runner config
```

## Directory Purposes

**app/api/**
- Purpose: HTTP endpoints for all backend functionality
- Contains: Route handlers exporting GET/POST/PUT/DELETE functions
- Key files: `candidates/route.ts` (CRUD), `github/deep/route.ts` (analysis), `webhooks/stripe/route.ts` (payments)

**services/**
- Purpose: Business logic extracted from API routes for reusability
- Contains: AI operations, data transformations, external API integrations
- Key files: `geminiService.ts` (Gemini + OpenRouter), `enrichmentServiceV2.ts` (candidate analysis), `scrapingService.ts` (web scraping)

**lib/search/**
- Purpose: Multi-language query parsing for natural recruitment searches
- Contains: Location normalization, experience extraction, skill mapping
- Example: "c++ 5 års erfaring i København" → `{ skill: 'cpp', location: 'copenhagen', experience: { min: 5, max: 5 } }`

**lib/validation/**
- Purpose: Zod schemas for API input validation
- Contains: Request body schemas, query parameter validation
- Example: `candidateCreateSchema` enforces required fields on POST /api/candidates

**components/ui/**
- Purpose: Reusable design system components (Radix UI + shadcn)
- Contains: Button, Card, Input, Dialog, etc.
- Cult UI imports: `dock.tsx` (modified for custom icons), `expandable.tsx` (requires `react-use-measure`)

**prisma/migrations/**
- Purpose: Version control for database schema changes
- Contains: Timestamped SQL migration files
- Usage: Run via `prisma migrate deploy` during deployment

**tests/**
- Purpose: Test coverage (unit, integration, E2E)
- Config: Vitest for unit tests, Playwright for E2E
- Status: 17 candidateService tests fail (localStorage API deprecated), 3 anti-gaming-filters tests pre-existing

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Homepage with hero, quick search, how-it-works
- `app/layout.tsx`: Root layout with Header, Footer, AdminDock, Providers
- `app/api/auth/[...nextauth]/route.ts`: OAuth entry point
- `middleware.ts`: Request routing, auth protection, rate limiting

**Configuration:**
- `types.ts`: Global TypeScript interfaces (Candidate, Score, Persona, etc.)
- `constants.ts`: Global constants (AI models, credit costs)
- `prisma/schema.prisma`: Database schema definition
- `lib/db.ts`: Prisma singleton for database access
- `tailwind.config.ts`: Tailwind CSS design tokens

**Core Logic:**
- `lib/github.ts`: GitHub API wrapper with search intelligence
- `lib/auth.ts`: NextAuth configuration (GitHub OAuth provider)
- `services/geminiService.ts`: Unified AI service (Gemini direct + OpenRouter fallback)
- `services/enrichmentServiceV2.ts`: Primary enrichment pipeline orchestrator
- `lib/credits.ts`: Credit system definitions and utilities

**Testing:**
- `vitest.config.ts`: Vitest configuration
- `tests/services/candidateService.test.ts`: Service layer tests
- `playwright.config.ts`: E2E test configuration

## Naming Conventions

**Files:**
- PascalCase for React components: `Header.tsx`, `CreditGate.tsx`
- camelCase for utilities/services: `geminiService.ts`, `behavioralSignalsService.ts`
- kebab-case for directories organizing features: `network-intelligence/`, `linkedin-captures/`
- Index files: `route.ts` for API endpoints, `page.tsx` for page routes

**Directories:**
- Feature-based: `pipeline/`, `search/`, `profile/` (group related pages)
- Domain-based: `components/linkedin/`, `services/ai/`, `lib/search/`
- Utility groups: `lib/validation/`, `lib/supabase/`, `lib/enrichment/`

**Components:**
- Exported as default: `export default function ComponentName() {}`
- Props interface: `interface ComponentNameProps { ... }`
- Hooks with "use" prefix: `useCandidates`, `useCredits`, `useLanguage`

**Services:**
- Function exports: `export async function analyzeCandidateProfile() {}`
- Type-safe responses: Return union types or Result wrappers
- Logging: All services log operations via `logger.ts`

**Database Models:**
- PascalCase: `User`, `Candidate`, `CreditLedger`, `SharedProfile`
- Relations: `@relation()` and foreign key fields named as `[ModelNameSingular]Id` (e.g., `userId`, `candidateId`)

## Where to Add New Code

**New Feature (e.g., "resume import"):**
- Primary code: `app/api/candidates/import/route.ts` (or new directory `app/api/candidates/import/`)
- Service layer: `services/resumeImportService.ts` for business logic
- Tests: `tests/api/candidates/import.test.ts` or `tests/services/resumeImportService.test.ts`
- Components: `components/profile/ResumeUpload.tsx` for UI
- Page: Route to feature via page route in `app/[feature]/page.tsx` if it needs a dedicated page

**New Component/Module:**
- If UI-only: `components/[feature]/ComponentName.tsx`
- If business logic: Create service in `services/[feature]Service.ts` + export hook in `lib/useFeature.ts` if client-side
- If utility: Place in `lib/[domain]/utility.ts` (e.g., `lib/enrichment/parseProfile.ts`)

**Database Migration (schema change):**
- Edit `prisma/schema.prisma`
- Run `npx prisma migrate dev --name [description]`
- This creates `prisma/migrations/[timestamp]_[name]/migration.sql`
- Commit both schema.prisma and migration file

**New API Endpoint:**
- Create `app/api/[resource]/route.ts` or `app/api/[resource]/[id]/route.ts`
- Export HTTP handlers: `export async function GET()`, `export async function POST()`, etc.
- Use `lib/auth-guard.ts`: `const auth = await requireAuth()` to protect routes
- Validate input with Zod: `const schema = z.object({...}); const validated = schema.parse(req.json())`
- Return JSON with consistent shape: `{ error?, data?, status }`
- Log operations: `logger.info('operation', { userId, ...context })`

**Utilities & Helpers:**
- Shared helpers: `lib/utils.ts` for general-purpose functions
- Domain-specific: `lib/[domain]/helper.ts` (e.g., `lib/search/locationNormalizer.ts`)
- Service-level helpers: Within the service file or separate `services/[domain]Helpers.ts`

**New i18n String:**
- Add to `locales/[lang].json`
- Usage in components: `const { t } = useLanguage(); t('key.path')`

## Special Directories

**prisma/migrations/**
- Purpose: Version-controlled SQL migrations
- Generated: Automatically by `prisma migrate dev`
- Committed: Yes (critical for production deployments)

**.planning/codebase/**
- Purpose: GSD codebase documentation
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md
- Committed: Yes (guides future development)

**node_modules/, .next/**
- Purpose: Build artifacts and dependencies
- Generated: Yes
- Committed: No (.gitignore)

**tests/**
- Purpose: Automated test suites
- Status: Vitest config operational, 20 tests failing (known issues)
- Run: `npm run test:run` or `npm run test:coverage`

**.data/**
- Purpose: Demo data and shared profile storage
- Contains: `demo-profiles/`, `shared-profiles/`
- Generated: Populated during demo mode
- Committed: Some seeded data, dynamic data not committed

---

*Structure analysis: 2026-02-16*

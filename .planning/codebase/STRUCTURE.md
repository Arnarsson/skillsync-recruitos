# Codebase Structure

**Analysis Date:** 2026-01-24

## Directory Layout

```
skillsync-recruitos/
├── app/                           # Next.js App Router
│   ├── api/                       # Server API routes
│   │   ├── auth/[...nextauth]/    # OAuth handler
│   │   ├── brightdata/            # LinkedIn scraping proxy (trigger, progress, snapshot, etc.)
│   │   ├── calibration/           # Score calibration endpoint
│   │   ├── checkout/              # Stripe payment initiation
│   │   ├── credits/               # Credit balance management
│   │   ├── deep-research/         # Alternative research endpoint
│   │   ├── developers/[username]/ # Public profile endpoint
│   │   ├── github/                # GitHub integration (search, signals, connection-path, deep)
│   │   ├── linkedin-connection/   # LinkedIn relationship mapping
│   │   ├── outreach/              # Message generation
│   │   ├── profile/analyze/       # AI profile analysis (persona, scoring, deep profile)
│   │   ├── search/                # Developer search with GitHub API
│   │   ├── skills/preview/        # Skill preview endpoint
│   │   ├── team/                  # Team CRUD and pipeline sharing
│   │   └── webhooks/stripe/       # Stripe payment notifications
│   ├── dashboard/                 # User dashboard
│   ├── intake/                    # Job context input form
│   ├── login/                     # GitHub OAuth entry point
│   ├── pipeline/                  # Candidate evaluation funnel
│   ├── pricing/                   # Pricing and credit information
│   ├── profile/[username]/        # Developer profile display
│   ├── privacy/                   # Privacy policy page
│   ├── search/                    # Search results and filtering
│   ├── settings/                  # User settings
│   ├── shortlist/                 # Shortlisted candidates view
│   ├── skills-review/             # Skills assessment page
│   ├── team/                      # Team management UI
│   ├── terms/                     # Terms of service page
│   ├── globals.css                # Global styles (Tailwind)
│   ├── layout.tsx                 # Root layout with Header, Footer, AdminDock
│   ├── favicon.ico                # App icon
│   └── page.tsx                   # Homepage
├── components/                    # React components
│   ├── ui/                        # shadcn/ui + Cult UI primitives
│   │   ├── card.tsx, badge.tsx, button.tsx, etc. (shadcn/ui)
│   │   ├── dock.tsx               # Mac-style dock (Cult UI, modified for custom icons)
│   │   ├── expandable.tsx         # Expandable cards (Cult UI, requires react-use-measure)
│   │   └── loading-scramble.tsx   # Animated loading placeholder
│   ├── pipeline/                  # Pipeline-specific components
│   │   ├── CandidatePipelineItem.tsx  # Expandable candidate card with inline analysis
│   │   ├── PipelineSplitView.tsx      # Split-view for pipeline management
│   │   ├── PipelineLoadingScramble.tsx
│   │   ├── ShortlistPanel.tsx         # Shortlist management UI
│   │   └── BuildprintStrip.tsx        # Candidate activity visualization
│   ├── search/                    # Search-specific components
│   │   ├── SearchFilters.tsx      # Faceted filtering (location, experience, skills)
│   │   ├── SkillsCombobox.tsx     # Skill selection with autocomplete
│   │   └── SearchBar.tsx          # Search input with suggestions
│   ├── SocialMatrix/              # Connection path visualization
│   │   ├── GitHubConnectionPath.tsx   # GitHub graph traversal UI
│   │   └── [other connection components]
│   ├── AdminDock.tsx              # Bottom dock for admin features
│   ├── BehavioralBadges.tsx       # OpenToWorkBadge, engagement indicators
│   ├── Header.tsx                 # Top navigation
│   ├── Footer.tsx                 # Footer
│   ├── Providers.tsx              # Client-side providers (NextAuth, context)
│   ├── OutreachModal.tsx          # Message composition modal
│   ├── ScoreBadge.tsx             # Alignment score visualization
│   ├── ScoreExplainer.tsx         # Score breakdown explanation
│   ├── ScoreLegend.tsx            # Score legend
│   ├── PsychometricCard.tsx       # Persona/workstyle visualization
│   ├── PricingCard.tsx, PricingSection.tsx, PricingToggle.tsx
│   ├── NetworkMap.tsx             # Network visualization
│   ├── HowItWorksSection.tsx      # Feature explanation section
│   ├── Onboarding.tsx             # First-time user setup
│   ├── GitHubConnectionPath.tsx   # Social matrix for candidates
│   ├── LinkedInConnectionPath.tsx # LinkedIn relationship path
│   └── [feature components]
├── services/                      # Business logic and integrations
│   ├── geminiService.ts           # Google Gemini AI (scoring, personas, deep profiles)
│   ├── enrichmentServiceV2.ts     # Multi-source evidence collection pipeline
│   ├── advancedEnrichmentService.ts
│   ├── enrichmentServiceLegacy.ts
│   ├── candidateService.ts        # Dual-mode persistence (localStorage + Supabase)
│   ├── scrapingService.ts         # Firecrawl and BrightData integration
│   ├── behavioralSignalsService.ts # Job-seeking signal detection
│   ├── networkAnalysisService.ts  # Network relationship mapping
│   ├── socialMatrixService.ts     # 6-degrees connection path analysis
│   ├── githubConnectionService.ts # GitHub graph traversal
│   ├── linkedInConnectionService.ts # LinkedIn connection mapping
│   ├── teamService.ts             # Team collaboration
│   ├── logger.ts                  # Centralized logging
│   ├── citedEvidenceService.ts    # Evidence citation tracking
│   ├── verificationService.ts     # Data verification
│   ├── deepResearchService.ts     # Extended research capability
│   ├── buildprintService.ts       # Candidate activity analysis
│   ├── jobService.ts              # Job context management
│   ├── supabase.ts                # Supabase client initialization
│   └── ai/                        # AI-specific helpers
├── lib/                           # Utilities and helpers
│   ├── auth.ts                    # NextAuth configuration (GitHub OAuth)
│   ├── github.ts                  # Octokit wrapper with search parsing
│   ├── stripe.ts                  # Stripe payment integration
│   ├── pricing.ts                 # Pricing tiers and credit calculations
│   ├── psychometrics.ts           # Workstyle indicator utilities
│   ├── adminContext.tsx           # Admin mode toggle (Ctrl+Shift+A)
│   ├── brightdata.ts              # BrightData API wrapper
│   ├── db.ts                      # Database utilities
│   ├── urlNormalizer.ts           # URL/LinkedIn validation and normalization
│   ├── pipelineUrlState.ts        # Pipeline state serialization for URL sharing
│   ├── search/                    # Multi-language search intelligence
│   │   ├── locationNormalizer.ts  # City name normalization (København → copenhagen)
│   │   ├── constants.ts           # Stop words (DA, SV, DE, NO, EN)
│   │   ├── experienceParser.ts    # Experience extraction ("5 års erfaring" → 5 years)
│   │   ├── skillNormalizer.ts     # Skill mapping (c++ → cpp, react → javascript)
│   │   ├── combinedSearch.ts      # Multi-source search orchestration
│   │   └── index.ts               # Search module exports
│   ├── supabase/                  # Database clients
│   │   ├── client.ts              # Client-side Supabase
│   │   └── server.ts              # Server-side Supabase
│   ├── services/                  # gemini/ subdirectory
│   │   └── gemini/                # Gemini-specific clients
│   ├── prompts/                   # AI prompt templates
│   ├── i18n/                      # Internationalization
│   └── utils.ts                   # General utilities
├── types.ts                       # Global TypeScript types
│   ├── Candidate interface
│   ├── FunnelStage enum
│   ├── Persona, ScoreBreakdown, etc.
│   ├── PRICING constants
│   └── Audit event types
├── types/                         # Type-specific modules
│   ├── global.d.ts                # Global type declarations
│   └── socialMatrix.ts            # Connection path types
├── hooks/                         # Custom React hooks
├── locales/                       # i18n translations
├── public/                        # Static assets
├── supabase/                      # Database migrations and configuration
├── prisma/                        # Prisma ORM config (if used)
├── tests/                         # Test files (Vitest backed up)
├── prompts/                       # AI prompt templates
├── .github/                       # CI/CD workflows
├── .vercel/                       # Vercel deployment configuration
├── .next/                         # Build artifacts (gitignored)
├── node_modules/                 # Dependencies (gitignored)
├── .env.example                   # Environment variables template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration (@ alias)
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
└── CLAUDE.md                      # Claude development guidance
```

## Directory Purposes

**app/**
- Purpose: Next.js App Router structure
- Contains: Page routes, API routes, layout files
- Key files: `layout.tsx` (root layout), `page.tsx` (homepage), `globals.css` (Tailwind)

**app/api/**
- Purpose: Server-side API endpoints
- Contains: Route handlers for search, analysis, payments, team collaboration
- Key files: `search/route.ts`, `profile/analyze/route.ts`, `github/signals/route.ts`

**components/**
- Purpose: Reusable React components
- Contains: UI primitives, feature components, layout components
- Key files: `CandidatePipelineItem.tsx` (inline analysis), `ScoreBadge.tsx` (score display)

**services/**
- Purpose: Business logic and external integrations
- Contains: AI calls, data fetching, enrichment pipelines
- Key files: `geminiService.ts`, `candidateService.ts`, `scrapingService.ts`

**lib/**
- Purpose: Utility functions and helpers
- Contains: Auth config, API wrappers, search parsing, database clients
- Key files: `github.ts`, `auth.ts`, `search/*.ts` (multi-language parsing)

**types.ts**
- Purpose: Global TypeScript type definitions
- Contains: Candidate interface, FunnelStage enum, scoring types, pricing constants
- Key definitions: `FunnelStage` (INTAKE=1, SHORTLIST=2, DEEP_PROFILE=3, OUTREACH=4), `PRICING` object

## Key File Locations

**Entry Points:**
- `app/page.tsx` - Homepage with search box
- `app/layout.tsx` - Root layout (Header, Footer, AdminDock, Providers)
- `app/login/page.tsx` - GitHub OAuth login

**Configuration:**
- `.env.example` - Required environment variables (GEMINI_API_KEY, FIRECRAWL_API_KEY, SUPABASE_*, STRIPE_*)
- `tsconfig.json` - Path aliases (@/* → project root)
- `next.config.js` - Next.js build configuration
- `lib/auth.ts` - NextAuth with GitHub OAuth strategy

**Core Logic:**
- `services/geminiService.ts` - AI analysis and scoring (1000+ lines)
- `services/candidateService.ts` - Persistence abstraction
- `app/api/profile/analyze/route.ts` - Main analysis pipeline
- `lib/github.ts` - GitHub search with multi-language parsing

**Testing:**
- `tests/` - Test directory structure (Vitest config backed up as vitest.config.ts.bak)
- No test command configured in package.json

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: PascalCase (`CandidatePipelineItem.tsx`, `ScoreBadge.tsx`)
- Services: camelCase with suffix (geminiService.ts, candidateService.ts)
- Utilities: camelCase (urlNormalizer.ts, pipelineUrlState.ts)
- Hooks: `use*` prefix (`useAdmin()`, `useLanguage()`, `useSession()`)

**Directories:**
- Feature pages: lowercase (`intake/`, `pipeline/`, `search/`)
- Shared components: `components/` with subdirs by feature (`pipeline/`, `search/`, `ui/`)
- Business logic: `services/` flat structure
- Utilities: `lib/` with feature subdirs (`lib/search/`, `lib/supabase/`)

**Variables:**
- Constants: UPPERCASE (PRICING, AI_MODELS, CANDIDATES_STORAGE_KEY)
- State: camelCase (alignmentScore, currentRole, unlockedSteps)
- Types: PascalCase interfaces (Candidate, CandidatePersona, ScoreBreakdown)

**Functions:**
- Service methods: camelCase (analyzeCandidateProfile, generatePersona, fetchAll)
- React hooks: use* pattern (useAdmin, useLanguage, useSession)
- Event handlers: handle* prefix (handleSearch, handleClick, onExpandStart)

## Where to Add New Code

**New Feature:**
- Primary code: `services/[featureName]Service.ts`
- API routes: `app/api/[feature]/route.ts`
- Components: `components/[Feature]Component.tsx`
- Tests: `tests/[feature].spec.ts` (if test infrastructure enabled)

**New Component/Module:**
- Feature-specific: `components/[Feature]/[Component].tsx`
- Shared UI: `components/ui/[component].tsx` (for shadcn/ui additions)
- Page: `app/[feature]/page.tsx`

**Utilities:**
- Shared helpers: `lib/[utility].ts` (for general utilities)
- Feature-specific: `lib/[feature]/[utility].ts` (for feature-scoped utilities)
- Search utilities: `lib/search/[parser].ts` (multi-language parsers)

**Type Definitions:**
- Global types: `types.ts` (Candidate, Persona, ScoreBreakdown, FunnelStage)
- Feature-specific: `types/[feature].ts` (e.g., `types/socialMatrix.ts`)
- Component local: Inline in component file for local props interfaces

**Configuration:**
- Environment: `.env` (based on `.env.example`)
- Build: `next.config.js`, `tsconfig.json`, `tailwind.config.ts`
- Auth: `lib/auth.ts` (NextAuth strategy)

## Special Directories

**lib/search/**
- Purpose: Multi-language search intelligence and parsing
- Generated: No
- Committed: Yes
- Contents:
  - `locationNormalizer.ts` - City alias resolution (København → copenhagen)
  - `experienceParser.ts` - Experience extraction ("5 år" → 5 years)
  - `skillNormalizer.ts` - Skill mapping (c++ → cpp, react → javascript)
  - `constants.ts` - Stop words for DA, SV, DE, NO, EN
  - `combinedSearch.ts` - Multi-source search orchestration

**.next/**
- Purpose: Next.js build artifacts
- Generated: Yes (during `npm run build`)
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: npm dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

**supabase/migrations/**
- Purpose: Database schema migrations
- Generated: Manual
- Committed: Yes
- Notable: Contains team collaboration tables and RLS policies

**types/**
- Purpose: Type-specific modules and global declarations
- Contents:
  - `global.d.ts` - Global type augmentations
  - `socialMatrix.ts` - Connection path types

**prompts/**
- Purpose: AI prompt templates
- Generated: No
- Committed: Yes
- Usage: Imported by `services/geminiService.ts` for consistent prompting

**locales/**
- Purpose: i18n translation files
- Generated: No
- Committed: Yes
- Supported languages: English, Danish, and others

**public/**
- Purpose: Static assets served at `/`
- Generated: No
- Committed: Yes
- Contains: Favicon, images, static files

---

*Structure analysis: 2026-01-24*

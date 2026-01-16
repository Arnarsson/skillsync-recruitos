# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RecruitOS** (package: skillsync-recruitos) is an AI-powered recruitment decision-support system built with Next.js 16 App Router and React 19. The system searches for software engineers on GitHub, scores them via Google Gemini AI (0-100 alignment scale), generates psychometric profiles, and creates personalized outreach messages.

Key Architectural Principles:
- **Next.js App Router**: All routes under `/app`, API routes under `/app/api`
- **Client-side state**: Primary data in `localStorage`, optional Supabase sync
- **Credit economy**: Internal currency tracks AI operation costs
- **EU AI Act compliance**: Immutable audit logs for profiling decisions

## Development Commands

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

**Note**: Test commands (`npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run validate`) are not configured in package.json. Test files exist in `/tests` but Vitest config is backed up (`vitest.config.ts.bak`).

## Environment Configuration

Copy `.env.example` to `.env` before starting:

```bash
GEMINI_API_KEY=         # Required - Google Gemini AI
FIRECRAWL_API_KEY=      # Required - Job description scraping
BRIGHTDATA_API_KEY=     # Optional - LinkedIn extraction
NEXT_PUBLIC_SUPABASE_URL=     # Optional - Database
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENROUTER_API_KEY=     # Optional - Alternative AI
STRIPE_*               # Optional - Payment processing
NEXTAUTH_*             # Required for auth
```

## Architecture

### Directory Structure

```
app/                        # Next.js App Router
├── api/                   # API routes
│   ├── auth/[...nextauth]/ # NextAuth OAuth
│   ├── search/            # GitHub developer search
│   ├── profile/analyze/   # Gemini AI analysis
│   ├── checkout/          # Stripe payments
│   ├── credits/           # Credit management
│   ├── outreach/          # Message generation
│   ├── brightdata/        # LinkedIn scraping proxy
│   └── developers/[username]/ # Public profiles
├── intake/                # Job context input
├── search/                # Search results
├── pipeline/              # Candidate management
├── profile/[username]/    # Developer profiles
├── login/, signup/        # Auth pages
├── page.tsx               # Homepage
└── layout.tsx             # Root layout

services/                   # Business logic
├── geminiService.ts       # AI analysis (scoring, personas, profiles)
├── scrapingService.ts     # Firecrawl/BrightData integration
├── candidateService.ts    # Data persistence (localStorage + Supabase)
├── enrichmentServiceV2.ts # Profile enrichment pipeline
├── networkAnalysisService.ts # Relationship mapping
├── behavioralSignalsService.ts # "Open to work" detection, activity signals
├── teamService.ts         # Team collaboration & shared pipelines
└── logger.ts              # Centralized logging

lib/                       # Utilities
├── services/gemini/       # Gemini client
├── supabase/              # Supabase clients (client/server)
├── search/                # Search intelligence (multi-language support)
│   ├── locationNormalizer.ts  # København → copenhagen, city aliases
│   ├── constants.ts       # Stop words (DA, SV, DE, NO, EN)
│   ├── experienceParser.ts # "5 års erfaring", "3-5 years" parsing
│   ├── skillNormalizer.ts # c++ → cpp, react → javascript
│   └── combinedSearch.ts  # Multi-source search orchestration
├── auth.ts                # NextAuth config (GitHub OAuth)
├── github.ts              # Octokit wrapper + search intelligence integration
├── pricing.ts             # Pricing tiers and credit calculations
├── stripe.ts              # Stripe integration
└── utils.ts               # Helper functions

components/                # React components
├── ui/                    # shadcn/ui + Radix primitives + Cult UI
│   ├── dock.tsx           # Mac-style dock navigation (Cult UI, modified)
│   └── expandable.tsx     # Expandable cards with animations (Cult UI)
├── search/                # Search-related components
│   └── SearchFilters.tsx  # Faceted filtering panel (location, language, experience)
├── pipeline/              # Pipeline-specific components
│   └── CandidatePipelineItem.tsx  # Expandable candidate cards with inline insights
├── AdminDock.tsx          # Mac-style bottom dock navigation (uses ui/dock.tsx)
├── BehavioralBadges.tsx   # OpenToWorkBadge, engagement indicators
└── [feature components]   # Header, Footer, SearchBar, ScoreBadge, etc.
```

### State Management

**Persisted State** (localStorage via `usePersistedState` hook):
- `apex_credits`: Credit balance
- `apex_logs`: Audit event history
- `apex_job_context`: Job description text
- `recruitos_search_count`: Free search tracking
- `recruitos_admin_mode`: Admin mode toggle state

**API Keys**: Retrieved from `localStorage` first, then `process.env`

### Admin Mode

**Context-based admin mode** (`lib/adminContext.tsx`):
- Toggle via `Ctrl+Shift+A` keyboard shortcut (works on Linux/Windows/Mac)
- State persisted in localStorage (`recruitos_admin_mode`)
- Access via `useAdmin()` hook: `{ isAdmin, toggleAdmin }`

**AdminDock** (`components/AdminDock.tsx`):
- Mac-style dock at bottom center when admin mode enabled
- Navigation: Home, Intake, Search, Pipeline + Power toggle
- Uses Cult UI Dock component with custom icon support
- Responsive: scales to 90% on mobile, hidden keyboard hint

```typescript
// Usage in components
const { isAdmin } = useAdmin();
if (isAdmin) {
  // Show admin-only features
}
```

### Core Services

**geminiService.ts** - AI operations:
- `analyzeCandidateProfile()`: Alignment scoring (0-100)
- `generatePersona()`: Psychometric profiling
- `generateDeepProfile()`: Evidence-based analysis
- `generateOutreach()`: Personalized messages
- Uses structured JSON via `responseMimeType` + `responseSchema`
- Retry logic for 503/429 errors

**candidateService.ts** - Dual-mode persistence:
- Always updates localStorage first (synchronous)
- Attempts Supabase sync (async, best-effort)
- Graceful degradation if DB unavailable

**scrapingService.ts** - External data:
- Firecrawl for job descriptions
- BrightData for LinkedIn profiles

### Search Intelligence (`lib/search/`)

Multi-language search parsing for natural queries like "c++ 5 års erfaring i københavn":

**locationNormalizer.ts** - Location alias resolution:
- City name normalization (København → copenhagen, München → munich)
- Country/region detection
- Returns `{ location, remainingQuery }`

**constants.ts** - Multi-language stop words:
- Danish: "i", "og", "med", "for", "til", etc.
- Swedish, German, Norwegian, English variants
- `filterStopWords(words)` removes noise from queries

**experienceParser.ts** - Experience extraction:
- Patterns: "5 years", "5 års erfaring", "3-5 years", "senior"
- Returns `ExperienceInfo { minYears, maxYears, level }`
- `removeExperienceTerms(query)` cleans query after extraction

**skillNormalizer.ts** - Programming language/framework mapping:
- `c++` → `cpp`, `c#` → `csharp` for GitHub API
- Framework → Language: `react` → `javascript`
- Returns `{ skill, githubLanguage, keyword, remainingQuery }`

**Integration in `lib/github.ts`**:
```typescript
function parseSearchQuery(query: string): ParsedSearchQuery {
  const experience = parseExperience(remaining);
  remaining = removeExperienceTerms(remaining);
  const { location, remainingQuery } = extractLocation(remaining);
  const { skill, githubLanguage, keyword } = extractSkill(remaining);
  const keywords = filterStopWords(words);
  return { keywords, language: githubLanguage, location, experience, frameworkKeyword };
}
```

### Behavioral Insights

**behavioralSignalsService.ts** - Detects job-seeking signals:
- Bio keywords: "open to work", "looking for opportunities", "available"
- Activity patterns: Recent commits, profile updates
- Returns engagement scores and activity trends

**BehavioralBadges.tsx** - UI components:
- `OpenToWorkBadge` - Green indicator for candidates showing job-seeking signals
- Displayed on search results and profile pages
- Async fetch from `/api/github/signals` endpoint

### Team Collaboration

**teamService.ts** - Multi-user workspace:
- Team creation and management
- Shared candidate pipelines
- Role-based permissions

**Database schema** (`supabase/migrations/001_team_collaboration.sql`):
- `teams`, `team_members`, `team_pipelines` tables
- Row-level security policies

**API routes** (`app/api/team/`):
- `POST /api/team` - Create team
- `GET/PUT/DELETE /api/team/[teamId]` - Team CRUD
- `POST/DELETE /api/team/[teamId]/members` - Member management
- `GET/POST /api/team/[teamId]/pipelines` - Shared pipelines

### Credit System

All AI operations are metered via `PRICING` constants in `types.ts`:
- `DEEP_PROFILE`: 278 credits
- `OUTREACH`: 463 credits
- `FULL_ANALYSIS`: 741 credits

Credits displayed with EUR conversion (`CREDITS_TO_EUR = 0.54`).

## Data Model

**Candidate Interface** (`types.ts`):
- Core: `name`, `currentRole`, `company`, `location`, `yearsExperience`
- Scoring: `alignmentScore` (0-100), `scoreBreakdown` (5 components)
- Deep Profile: `indicators`, `interviewGuide`, `companyMatch`
- Persona: Optional psychometric analysis
- State: `unlockedSteps` array for funnel progress

**Score Breakdown**: 5 weighted components: `skills`, `experience`, `industry`, `seniority`, `location`

## Path Aliases

`@/*` resolves to project root (configured in `tsconfig.json`):
```typescript
import { Candidate } from '@/types';
import { geminiService } from '@/services/geminiService';
```

## Adding New Features

### New AI Operation
1. Add function to `services/geminiService.ts` with JSON schema
2. Update `AuditEventType` enum in `types.ts`
3. Add pricing to `PRICING` constant
4. Use `useCallback`/`useMemo` for performance

### New API Route
1. Create route file in `app/api/[endpoint]/route.ts`
2. Export HTTP method handlers (`GET`, `POST`, etc.)
3. Handle auth via NextAuth session if needed

### Extending Candidate Model
1. Update `Candidate` interface in `types.ts`
2. Update Supabase mapping in `candidateService.ts`
3. Update Gemini response schemas

## External Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| Google Gemini | AI analysis | `GEMINI_API_KEY` |
| GitHub API (Octokit) | Developer search | OAuth token |
| Firecrawl | Web scraping | `FIRECRAWL_API_KEY` |
| BrightData | LinkedIn extraction | `BRIGHTDATA_API_KEY` |
| Supabase | PostgreSQL database | `NEXT_PUBLIC_SUPABASE_*` |
| Stripe | Payments | `STRIPE_*` |
| NextAuth | OAuth sessions | `NEXTAUTH_*` |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
- Lint & Type Check
- Build verification
- Security scan (npm audit, TruffleHog)

## UI Patterns

### Cult UI Components

Components from [cult-ui.com](https://cult-ui.com) installed via shadcn CLI:

**Dock** (`components/ui/dock.tsx`):
- Mac-style dock with spring animations
- Modified to support custom icon content (not just images)
- Props: `onClick`, `className` added to `DockCardInner`
- Install: `npx shadcn@latest add https://cult-ui.com/r/dock.json`

**Expandable** (`components/ui/expandable.tsx`):
- Cards that expand in place with smooth animations
- `onExpandStart` callback for lazy-loading content
- Animation presets: `blur-md`, `scale-up`, `fade`, `slide-up`, `slide-down`
- Install: `npx shadcn@latest add https://cult-ui.com/r/expandable.json`
- Requires: `npm install react-use-measure`

### Inline Insights Pattern

Eliminates "pogo-sticking" (click → new page → back) for candidate analysis:

```typescript
// CandidatePipelineItem.tsx pattern
<Expandable
  onExpandStart={() => fetchDeepProfile(candidate.id)}
  expandDirection="vertical"
  animationPreset="blur-md"
>
  {/* Collapsed: avatar, name, score */}
  {/* Expanded: AI analysis, psychometric profile, interview guide */}
</Expandable>
```

### Responsive Design Patterns

Standard responsive classes used throughout:
- **Container padding**: `px-3 sm:px-4` (tighter on mobile)
- **Top padding**: `pt-20 sm:pt-24` (account for header)
- **Bottom padding**: `pb-24 sm:pb-16` (account for dock on mobile)
- **Text scaling**: `text-base sm:text-lg`, `text-xl sm:text-2xl md:text-3xl`
- **Flex direction**: `flex-col sm:flex-row` (stack on mobile)
- **Hidden elements**: `hidden sm:inline`, `hidden sm:flex` (show on desktop only)
- **Truncation**: `truncate max-w-[100px] sm:max-w-none`

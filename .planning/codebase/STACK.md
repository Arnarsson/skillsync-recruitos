# Technology Stack

**Analysis Date:** 2026-01-24

## Languages

**Primary:**
- TypeScript 5 - All application code, strict mode enabled
- JavaScript - Configuration files (postcss, next.config)

**Styling:**
- CSS - Via Tailwind CSS v4 with PostCSS

## Runtime

**Environment:**
- Node.js (LTS) - Development and production

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.2 - App Router (all routes in `/app`), server and client components
- React 19.2.3 - UI rendering with latest features
- React DOM 19.2.3 - DOM rendering

**Authentication:**
- NextAuth 4.24.13 - OAuth with GitHub provider
- @auth/core 0.34.3 - Underlying auth logic

**UI Components:**
- Radix UI v1 - Primitives for accessible components
  - `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-select`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`
  - `@radix-ui/react-scroll-area`, `@radix-ui/react-progress`, `@radix-ui/react-slider`
  - `@radix-ui/react-switch`, `@radix-ui/react-collapsible`, `@radix-ui/react-separator`
- shadcn/ui - Pre-built component library on Radix UI
- Cult UI - Community components (dock, expandable)
  - `components/ui/dock.tsx` - Mac-style dock with spring animations (modified for custom icons)
  - `components/ui/expandable.tsx` - Expandable cards with blur/fade/slide animations

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind
- class-variance-authority 0.7.1 - Variant utilities for component styling
- tailwind-merge 3.4.0 - Merge Tailwind classes without conflicts

**Animation & Motion:**
- Framer Motion 12.26.2 - Spring/easing animations
- Motion 12.26.2 - Animation utility library

**UI Utilities:**
- Lucide React 0.562.0 - Icon library
- cmdk 1.1.1 - Command palette / search UI
- Sonner 2.0.7 - Toast notifications
- clsx 2.1.1 - Conditional className binding
- react-use-measure 2.1.7 - Measure DOM elements (required for Expandable)

**Charts & Visualization:**
- Recharts 2.15.1 - Chart components (line, bar, etc.)
- @xyflow/react 12.10.0 - Node-link diagram library for network graphs

## Data & ORM

**Database:**
- Prisma 7.2.0 - ORM for PostgreSQL
- @prisma/client 7.2.0 - Query client

**Database Provider:**
- PostgreSQL - Primary database (configured in `prisma/schema.prisma`)

**Supabase:**
- @supabase/supabase-js 2.90.1 - Supabase client (optional, for persistent storage)

## API & External Services

**AI/ML:**
- @google/genai 1.36.0 - Google Gemini API client

**Web Scraping:**
- Firecrawl - Job description scraping (configured via `FIRECRAWL_API_KEY`)
- BrightData - LinkedIn profile extraction (configured via `BRIGHTDATA_API_KEY`)

**GitHub Integration:**
- @octokit/rest 22.0.1 - GitHub API client for developer search and profile analysis

**Payments:**
- Stripe 20.1.2 - Payment processing (server-side)
- @stripe/stripe-js 8.6.1 - Stripe client (client-side for checkout)

**Alternative AI:**
- OpenRouter API - Optional fallback for Gemini models (via HTTP, OpenAI-compatible format)

## Validation & Data

**Schema & Validation:**
- Zod 4.3.5 - TypeScript-first schema validation

## Development Tools

**Linting:**
- ESLint 9 - Code quality enforcement
- eslint-config-next 16.1.2 - Next.js-specific ESLint rules

**Formatting:**
- Prettier 3.1.1 - Code formatter (configured via `.prettierrc`)

**Build:**
- TypeScript 5 - Type checking with `npm run type-check`
- ESLint - Code linting with `npm run lint`
- Prettier - Formatting with `npm run format`

**Testing:** (Configured but disabled)
- Vitest - Test runner (config: `vitest.config.ts.bak`)
- Playwright - E2E testing (config: `playwright.config.ts.bak`)

## Configuration

**TypeScript:**
- `tsconfig.json` - Strict mode, ES2022 target, JSX React
- Path aliases: `@/*` resolves to project root

**Next.js:**
- `next.config.ts` - Standalone output mode, GitHub avatars image domain
- `/.next` - Built output directory (gitignored)

**Environment:**
- `.env` - Local development (not committed)
- `.env.example` - Template with all required/optional variables
- `.env.vercel` - Vercel deployment secrets

**Database:**
- `prisma/schema.prisma` - Data model and migrations
- Provider: PostgreSQL

**CSS:**
- `postcss.config.mjs` - PostCSS with Tailwind plugin
- Tailwind config embedded in PostCSS

## Platform Requirements

**Development:**
- Node.js LTS
- npm 10+
- PostgreSQL database (local or Supabase)

**Production:**
- Next.js standalone server (standalone output mode)
- PostgreSQL database
- Environment variables for all external services

**Deployment Targets:**
- Vercel (native Next.js support)
- Any Node.js hosting (Docker compatible via standalone mode)

## Key Dependencies Summary

| Dependency | Version | Purpose |
|-----------|---------|---------|
| next | 16.1.2 | Web framework |
| react | 19.2.3 | UI library |
| typescript | 5 | Type safety |
| @google/genai | 1.36.0 | AI analysis |
| stripe | 20.1.2 | Payments |
| @supabase/supabase-js | 2.90.1 | Database (optional) |
| @octokit/rest | 22.0.1 | GitHub API |
| tailwindcss | 4 | Styling |
| prisma | 7.2.0 | ORM |
| next-auth | 4.24.13 | Authentication |

---

*Stack analysis: 2026-01-24*

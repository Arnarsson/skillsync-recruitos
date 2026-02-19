# Technology Stack

**Analysis Date:** 2026-02-16

## Languages

**Primary:**
- TypeScript 5.x - Full application codebase (frontend, backend, utilities)

**Secondary:**
- JavaScript - Node.js build scripts (`scripts/i18n-audit.cjs`)
- SQL - PostgreSQL via Prisma ORM

## Runtime

**Environment:**
- Node.js 22.x

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- Next.js 16.1.2 - Full-stack React framework with App Router
- React 19.2.3 - UI component library
- React DOM 19.2.3 - DOM rendering

**Build & Development:**
- Tailwind CSS 4 - Utility-first CSS framework with PostCSS 4
- TypeScript - Static type checking

**Testing:**
- Vitest 4.0.18 - Unit and integration test runner
- @vitest/ui - Visual test UI
- @vitest/coverage-v8 - Code coverage reporting
- @testing-library/react 16.3.2 - React component testing
- @testing-library/jest-dom 6.9.1 - DOM matchers
- Playwright 1.58.0 - End-to-end testing
- jsdom 28.0.0 - DOM environment for Node tests

**Development Tools:**
- ESLint 9 - Code linting (Next.js extended config)
- Prettier 3.1.1 - Code formatting (100 char line width, 2-space tabs)
- Husky 9.1.7 - Git hooks (pre-commit runs Vitest)
- TypeScript 5.x - Type checking (`npm run type-check`)

## Key Dependencies

**Critical Infrastructure:**
- @prisma/client 6.19.2 - PostgreSQL ORM and query builder
- prisma 6.19.2 - Prisma CLI for migrations

**Authentication & Authorization:**
- next-auth 4.24.13 - OAuth/session management with GitHub provider
- @auth/core 0.34.3 - NextAuth core library

**AI & LLM Integration:**
- @google/genai 1.36.0 - Google Gemini API client (primary AI)
- Stripe 20.1.2 - Payment processing and webhooks

**UI Components & Utilities:**
- @radix-ui/* (multiple) - Headless UI component library (avatar, checkbox, collapsible, dialog, dropdown, label, popover, progress, scroll-area, select, separator, slider, slot, switch, tabs, tooltip)
- Lucide React 0.562.0 - SVG icon library
- cmdk 1.1.1 - Command palette component
- Framer Motion 12.26.2 - Animation library
- motion 12.26.2 - Animation utilities
- clsx 2.1.1 - Conditional className utility
- class-variance-authority 0.7.1 - Variant CSS utility
- tailwind-merge 3.4.0 - Merge Tailwind class utilities
- Sonner 2.0.7 - Toast notification library
- recharts 2.15.1 - React charting library
- Resend 6.9.1 - Email sending service

**Data Drag & Drop:**
- @dnd-kit/core 6.3.1 - Drag and drop library
- @dnd-kit/sortable 10.0.0 - Sortable items extension
- @dnd-kit/utilities 3.2.2 - DnD utilities

**Graph Visualization:**
- @xyflow/react 12.10.0 - Node and edge graph visualization

**File Upload:**
- react-dropzone 14.3.8 - Drop zone component
- react-use-measure 2.1.7 - DOM measurement hook

**Data Validation & Parsing:**
- zod 4.3.5 - TypeScript-first schema validation

**Error Tracking & Monitoring:**
- @sentry/nextjs 10.38.0 - Error tracking and performance monitoring
- Sentry integrations for client, server, and edge runtimes

**Storage & Caching (Legacy):**
- @vercel/kv 3.0.0 - Vercel KV (deprecated, replaced by Prisma)

**Database:**
- @supabase/supabase-js 2.90.1 - Supabase client (optional, for legacy features)

**API Clients:**
- @octokit/rest 22.0.1 - GitHub API wrapper
- @stripe/stripe-js 8.6.1 - Stripe.js client

## Configuration

**Environment Variables:**

*Critical (required for operation):*
- `GEMINI_API_KEY` - Google Gemini AI access
- `FIRECRAWL_API_KEY` - Job description web scraping
- `NEXTAUTH_SECRET` - NextAuth session signing (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - NextAuth callback URL
- `GITHUB_ID`, `GITHUB_SECRET` - GitHub OAuth credentials (or `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
- `DATABASE_URL` - PostgreSQL pooled connection (Prisma)
- `DIRECT_DATABASE_URL` - PostgreSQL direct connection (migrations only)

*Payment & Credits (required for paid features):*
- `STRIPE_SECRET_KEY` - Stripe API secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing

*Optional Features:*
- `OPENROUTER_API_KEY` - Alternative AI inference (fallback to Gemini 3-Flash)
- `BRIGHTDATA_API_KEY` - LinkedIn profile extraction
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` - Team features
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` - Email outreach
- `TEAMTAILOR_API_TOKEN` - ATS integration (Danish market)
- `RECRUITOS_EXTENSION_API_KEY` - LinkedIn extension ingestion
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- `SENTRY_AUTH_TOKEN` - Source map uploads

**TypeScript Configuration** (`tsconfig.json`):
- Path aliases: `@/*` resolves to project root
- Strict mode enabled
- Target: ES2020, Module: ESNext

**Build Configuration** (`next.config.ts`):
- Sentry integration for error tracking
- GitHub avatar image optimization (`avatars.githubusercontent.com`)
- Source map uploads during build (Sentry)

**Format Configuration** (`.prettierrc`):
- 100 character line width
- 2-space indentation
- Single quotes for JS (not JSX)
- Trailing commas (ES5 compatible)
- Semicolons required

**Linting Configuration** (`.eslintrc.json`):
- Base: ESLint recommended + TypeScript recommended
- React and React Hooks plugins required
- No explicit `any` types allowed
- Unused variable warning with underscore prefix exception
- Console usage restricted to warn/error/info
- Const preference, no `var`

## Platform Requirements

**Development:**
- Node.js 22.x (specified in `package.json` engines)
- PostgreSQL 12+ for local development
- Git (for Husky pre-commit hooks)

**Production:**
- Node.js 22.x LTS
- PostgreSQL 12+ (Cloud hosted via Supabase, AWS RDS, or similar)
- Environment variables configured
- Sentry account (optional but recommended)

**Deployment Targets:**
- Vercel (Next.js native platform, includes Sentry integration)
- Self-hosted Node.js compatible servers
- Docker containers

---

*Stack analysis: 2026-02-16*

# External Integrations

**Analysis Date:** 2026-02-16

## APIs & External Services

**AI & Large Language Models:**
- Google Gemini API (v1) - Primary AI model for candidate analysis, scoring, persona generation
  - SDK: `@google/genai`
  - Auth: `GEMINI_API_KEY`
  - Service: `services/geminiService.ts`
  - Capabilities: alignment scoring (0-100), psychometric profiles, evidence extraction

- OpenRouter - Fallback AI inference (Google Gemini via OpenRouter)
  - SDK: HTTP client (OpenAI-compatible format)
  - Auth: `OPENROUTER_API_KEY`
  - Fallback models: `google/gemini-3-flash-preview` (primary), `google/gemini-2.5-flash` (secondary)
  - Used by: `services/deepResearchService.ts`, `services/enrichmentServiceV2.ts`
  - Retry logic: 3 attempts with exponential backoff

**Web Scraping & Data Extraction:**
- Firecrawl - Job description and website content scraping
  - Auth: `FIRECRAWL_API_KEY`
  - Service: `services/scrapingService.ts`
  - Purpose: Extract job details, requirements, responsibilities from URLs

- BrightData - LinkedIn profile extraction (premium feature)
  - Auth: `BRIGHTDATA_API_KEY`
  - Service: `services/scrapingService.ts`
  - Purpose: Profile enrichment, experience/education parsing from LinkedIn
  - Feature flag: Optional in `.env.example`

**Developer Search & Profiles:**
- GitHub API (Octokit REST) - Developer search and profile data
  - SDK: `@octokit/rest`
  - Auth: OAuth token from NextAuth session
  - Service: `lib/github.ts`
  - Capabilities: Search by language/location/experience, fetch profiles, public repos
  - Search intelligence: Multi-language parsing in `lib/search/`

## Data Storage

**Primary Database:**
- PostgreSQL 12+ via Prisma ORM
  - Connection: `DATABASE_URL` (pooled via PgBouncer or similar)
  - Migrations: `DIRECT_DATABASE_URL` (direct connection)
  - Client: `@prisma/client`
  - Schema: `prisma/schema.prisma`
  - Singleton: `lib/db.ts`
  - Tables: users, candidates, payments, credit ledger, shared profiles, LinkedIn messages, criteria sets

**Optional Legacy Storage:**
- Supabase PostgreSQL - Team collaboration features (optional)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
  - Client: `@supabase/supabase-js`
  - Deprecated in favor of Prisma for new features

**Legacy In-Memory Storage (Deprecated):**
- Vercel KV - Cached in `@vercel/kv` (no longer primary)
  - Status: Replaced by Prisma (v0.2+)

**File Storage:**
- GitHub Avatars - Remote image hosting
  - Domain: `avatars.githubusercontent.com` (configured in `next.config.ts`)
  - Purpose: User and candidate profile pictures

**Caching:**
- No explicit caching layer (relies on database query performance)

## Authentication & Identity

**Auth Provider:**
- NextAuth.js v4 with GitHub OAuth
  - Config: `lib/auth.ts`
  - Provider: GitHub OAuth via `next-auth/providers/github`
  - Scope: `read:user user:email`
  - Credentials backup: Email/password auth with bcrypt hashing

**Session Management:**
- NextAuth JWT strategy
  - Token stored in secure, httpOnly cookie
  - Payload includes: user ID, GitHub access token, email
  - Secret: `NEXTAUTH_SECRET` (required)

**Callback URL:**
- Standard: `/api/auth/callback/github`
- Configured in `NEXTAUTH_URL`

## Payment Processing

**Stripe Integration:**
- Card payments and subscriptions
  - SDK: `stripe` (server-side), `@stripe/stripe-js` (client-side)
  - Auth: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - Webhook: `STRIPE_WEBHOOK_SECRET`
  - Service: `lib/stripe.ts`

**Payment Operations:**
- One-time credit packages (10, 25, 50, 100+ credits)
- Annual subscription (unlimited credits)
- Currency: Danish Krone (DKK)
- Checkout: `createCreditPackageCheckout()`, `createSubscriptionCheckout()`
- Billing portal: `createPortalSession()`

**Webhook Handling:**
- Endpoint: `app/api/stripe/webhook` (listener for checkout.session.completed, etc.)
- Idempotency: Event deduplication via `StripeEvent` table
- Persistence: Updates user credits and subscription in Prisma

**Credit System:**
- Cost tracking via `CreditLedger` table
- Operations: DEEP_PROFILE (278), OUTREACH (463), FULL_ANALYSIS (741) credits
- EUR conversion: 0.54 per credit (historical)

## Monitoring & Observability

**Error Tracking & Performance:**
- Sentry (Next.js integration via `@sentry/nextjs`)
  - DSN: `SENTRY_DSN` (server), `NEXT_PUBLIC_SENTRY_DSN` (client)
  - Config files:
    - `sentry.client.config.ts` - Client-side tracking
    - `sentry.server.config.ts` - Server-side tracking
    - `sentry.edge.config.ts` - Edge runtime tracking
  - Features: Performance monitoring (100% trace rate), session replay (10% normal, 100% on error)
  - Enabled: Production only
  - Auth token: `SENTRY_AUTH_TOKEN` for source map uploads during build

**Logging:**
- Console-based (allowed: warn, error, info)
- Service: `services/logger.ts` for structured logging
- Audit logs: `apex_logs` persisted in Prisma

**Analytics:**
- None configured (placeholder: `app/api/analytics`)

## CI/CD & Deployment

**Hosting:**
- Vercel (native Next.js platform - recommended)
- Self-hosted Node.js (Docker, traditional servers)

**Build Pipeline:**
- `npm run build` - Runs `prisma generate` then `next build`
- Type checking: `npm run type-check`
- Linting: `npm run lint`
- Testing: `npm run test:run` (Vitest)

**Pre-commit Hooks:**
- Husky integration (`prepare: husky` in package.json)
- Pre-commit hook runs Vitest

**Source Map Uploads:**
- Sentry auth token required for build-time upload
- Configuration in `next.config.ts` with Sentry wrapping

## Email Service

**Resend - Email Sending:**
- SDK: `resend`
- Auth: `RESEND_API_KEY`
- From address: `RESEND_FROM_EMAIL` (must be verified domain or use `onboarding@resend.dev`)
- Service: `lib/resend.ts`
- Function: `sendOutreachEmail()` for outreach messaging
- Pricing: 3,000 free emails/month (no credit card required)
- API: `https://api.resend.com`

## ATS Integration

**Team Tailor (Danish Market):**
- Purpose: Export RecruitOS candidates to Team Tailor ATS
- API: Team Tailor REST API v1
- Auth: `TEAMTAILOR_API_TOKEN` (API token from Team Tailor settings)
- Base URL: `https://api.teamtailor.com` (configurable via env)
- Service: `services/teamTailorService.ts`
- Candidate export: Convert Candidate model → Team Tailor candidate format
- Features:
  - First name / last name mapping
  - Email and phone fields
  - LinkedIn URL export
  - Resume text / pitch export
  - Tags and custom fields
  - Job relationship linking
  - Retry logic: 3 attempts with exponential backoff
- Market: Critical for Danish recruitment workflow

## Webhooks & Callbacks

**Incoming Webhooks:**
- Stripe: `app/api/stripe/webhook` (payment events)
  - Types: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.deleted`
  - Idempotency: Stripe event ID deduplication

- LinkedIn Extension: `app/api/linkedin/*` (extension ingestion)
  - Message sync: `app/api/linkedin/message`
  - Candidate import: `app/api/linkedin/candidate`
  - Auth: `RECRUITOS_EXTENSION_API_KEY` header validation

**Outgoing Webhooks:**
- None configured

## External Configuration

**Required Environment Variables (Summary):**

*Tier: Critical (app non-functional without)*
```
GEMINI_API_KEY=
FIRECRAWL_API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GITHUB_ID= (or GITHUB_CLIENT_ID)
GITHUB_SECRET= (or GITHUB_CLIENT_SECRET)
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

*Tier: Important (specific features unavailable without)*
```
OPENROUTER_API_KEY=         # Fallback AI
BRIGHTDATA_API_KEY=         # LinkedIn extraction
RESEND_API_KEY=             # Email outreach
TEAMTAILOR_API_TOKEN=       # ATS export
RECRUITOS_EXTENSION_API_KEY= # Extension sync
```

*Tier: Optional (monitoring & debugging)*
```
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=    # Legacy features
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

**Secrets Location:**
- Development: `.env` (git-ignored)
- Production: Platform environment variables (Vercel, Docker secrets, etc.)
- Never commit secrets to version control

---

*Integration audit: 2026-02-16*

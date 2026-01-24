# External Integrations

**Analysis Date:** 2026-01-24

## APIs & External Services

**AI/ML - Google Gemini:**
- Service: Google Gemini API
- What it's used for: Candidate alignment scoring (0-100), psychometric profiling, deep profile generation, personalized outreach message generation
- SDK/Client: `@google/genai` v1.36.0
- Auth: `GEMINI_API_KEY` environment variable
- Get key: https://aistudio.google.com/apikey
- Implementation: `services/geminiService.ts`, `lib/services/gemini/index.ts`
- Fallback: OpenRouter API wrapper for reliability

**AI/ML - OpenRouter (Fallback):**
- Service: OpenRouter API
- What it's used for: Alternative inference for Gemini models with fallback retry logic
- SDK/Client: HTTP fetch wrapper with OpenAI-compatible format
- Auth: `OPENROUTER_API_KEY` environment variable (optional)
- Get key: https://openrouter.ai
- Implementation: `services/geminiService.ts` - `callOpenRouter()` function
- Models: Primary: `google/gemini-3-flash-preview`, Secondary: `google/gemini-2.5-flash`

**Web Scraping - Firecrawl:**
- Service: Firecrawl API
- What it's used for: Scraping and extracting structured data from job descriptions and websites
- SDK/Client: HTTP fetch wrapper
- Auth: `FIRECRAWL_API_KEY` environment variable (required)
- Get key: https://firecrawl.dev
- Implementation: `services/scrapingService.ts` - `FirecrawlResponse` interface
- Response format: Markdown and metadata extraction

**Web Scraping - BrightData:**
- Service: BrightData Web Scraper API
- What it's used for: LinkedIn profile extraction and network analysis
- SDK/Client: Custom wrapper in `lib/brightdata.ts`
- Auth: `BRIGHTDATA_API_KEY` environment variable (optional)
- Get key: https://brightdata.com
- Implementation: `lib/brightdata.ts` - `BrightDataService` class
- Proxy endpoint: `/api/brightdata/trigger`, `/api/brightdata/progress`, `/api/brightdata/snapshot`
- Features:
  - `triggerLinkedInScrape()` - Initiate LinkedIn profile scrape
  - `checkProgress()` - Poll scrape status (max 180 seconds)
  - `getSnapshot()` - Retrieve completed scrape data
  - `scrapeLinkedInProfile()` - Full flow with polling
  - Network graph building for relationship mapping

**Developer Search - GitHub API:**
- Service: GitHub REST API via Octokit
- What it's used for: Developer/engineer search, profile data retrieval, repository analysis
- SDK/Client: `@octokit/rest` v22.0.1
- Auth: `GITHUB_TOKEN` or OAuth session access token
- Implementation: `lib/github.ts` with integrated search intelligence
- Features:
  - Multi-language search parsing (Danish, Swedish, German, Norwegian, English)
  - Location normalization (København → copenhagen)
  - Experience level extraction (5 år erfaring → 5-year minimum)
  - Skill mapping (c++ → cpp for GitHub API)
  - Stop word filtering across languages

**GitHub OAuth (Authentication):**
- Service: GitHub OAuth 2.0
- What it's used for: User login and authorization
- Auth provider: NextAuth with GitHub provider
- SDK/Client: NextAuth GitHub provider
- Configuration: `lib/auth.ts` - GitHub OAuth with read:user and user:email scopes
- Credentials:
  - `GITHUB_CLIENT_ID` - OAuth app client ID
  - `GITHUB_CLIENT_SECRET` - OAuth app secret
- Pages: `/login` (sign in), `/` (sign out)
- Session strategy: JWT (stateless)

## Data Storage

**Databases:**

**Primary - PostgreSQL:**
- Type: Relational database
- Provider: PostgreSQL (self-managed or Supabase)
- Client: Prisma ORM v7.2.0
- Schema file: `prisma/schema.prisma`
- Models:
  - `User` - Account with GitHub ID, credits, plan, Stripe subscription
  - `ProfileView` - Track candidate profile views and credit usage
  - `Search` - Log search queries
  - `Payment` - Payment transaction history
- Configured via: `DATABASE_URL` environment variable (Prisma datasource)

**Secondary - Supabase (Optional):**
- Type: PostgreSQL-based backend-as-a-service
- Provider: Supabase
- Client: `@supabase/supabase-js` v2.90.1
- Configuration:
  - Client-side: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Server-side: `SUPABASE_SERVICE_KEY`
- Implementation: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Usage: Optional persistent storage for candidates, profiles, teams
- Graceful degradation: App functions with localStorage if Supabase unavailable

**Client-side State:**
- LocalStorage key prefix: `apex_` and `recruitos_`
- Persisted state:
  - `apex_credits` - Credit balance
  - `apex_logs` - Audit event history
  - `apex_job_context` - Job description text
  - `recruitos_search_count` - Free search tracking
  - `recruitos_admin_mode` - Admin mode toggle
  - API keys (localStorage fallback for client-side keys)

**File Storage:**
- Local filesystem only (no cloud storage integration)
- Image delivery: GitHub avatars via `avatars.githubusercontent.com` (configured in Next.js)

**Caching:**
- Client-side: localStorage for state and API keys
- No server-side caching layer configured

## Authentication & Identity

**Auth Provider:**
- Provider: NextAuth with GitHub OAuth
- Implementation: `lib/auth.ts` - `authOptions` configuration
- Strategy: JWT (stateless sessions)
- Scopes: `read:user user:email` (basic profile access)
- Session callbacks: Attach GitHub access token and user ID to session

**User Account:**
- GitHub username/ID as primary identifier
- NextAuth session stores:
  - User name, email, avatar
  - GitHub access token
  - User ID (GitHub)

## Payments & Subscriptions

**Payment Processor - Stripe:**
- Service: Stripe
- What it's used for: Credit purchases, subscription management
- SDK: `stripe` v20.1.2 (server), `@stripe/stripe-js` v8.6.1 (client)
- Configuration: `lib/stripe.ts`
- Credentials:
  - `STRIPE_SECRET_KEY` (server-side only)
  - `STRIPE_PRO_MONTHLY_PRICE_ID`
  - `STRIPE_PRO_YEARLY_PRICE_ID`
- Subscription plans:
  - PRO_MONTHLY: $499/month → 50 credits
  - PRO_YEARLY: $4790/year → 600 credits
- Credit packs: 10, 25, 50, 100 credits at $99, $199, $349, $599
- Webhooks: `/api/webhooks/stripe` for subscription events
- Customer tracking: `User.stripeCustomerId`, `User.stripeSubscriptionId`

## Monitoring & Observability

**Error Tracking:**
- Custom implementation: `services/logger.ts`
- Audit logging: Immutable logs in localStorage (`apex_logs`) for EU AI Act compliance
- Console logging for development

**Logs:**
- localStorage-based event logging
- AuditEventType enum tracks: DEEP_PROFILE, OUTREACH, etc.
- Candidate-level audit trail

## CI/CD & Deployment

**Hosting:**
- Vercel (recommended for Next.js)
- Alternative: Docker via standalone mode (`output: "standalone"` in next.config.ts)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Checks: ESLint, TypeScript type checking, build verification, security scan (npm audit, TruffleHog)

**Deployment:**
- Next.js standalone mode (no Node.js required on server)
- Environment variables injected at runtime

## Environment Configuration

**Required environment variables:**
- `GEMINI_API_KEY` - Google Gemini API (required for AI)
- `FIRECRAWL_API_KEY` - Firecrawl API (required for job scraping)
- `NEXTAUTH_SECRET` - NextAuth JWT signing secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `STRIPE_SECRET_KEY` - Stripe secret key (for payments)

**Optional environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (for persistent storage)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `BRIGHTDATA_API_KEY` - BrightData API (for LinkedIn extraction)
- `OPENROUTER_API_KEY` - OpenRouter fallback API
- `STRIPE_PRO_MONTHLY_PRICE_ID` - Stripe monthly price ID
- `STRIPE_PRO_YEARLY_PRICE_ID` - Stripe yearly price ID
- `DATABASE_URL` - Prisma database connection string

**Secrets location:**
- `.env` file (local development, not committed)
- Vercel Secrets (production)
- Environment variable injection at build/runtime

**Client-accessible secrets:**
- Prefixed with `NEXT_PUBLIC_` for client-side consumption
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Webhooks & Callbacks

**Incoming Webhooks:**
- `/api/webhooks/stripe` - Stripe subscription/payment events
  - Triggers: subscription creation, update, deletion, payment success

**Outgoing Webhooks:**
- None configured

**OAuth Callbacks:**
- `/api/auth/[...nextauth]` - NextAuth OAuth flow
- Redirect URIs: Configured in GitHub OAuth app settings

## API Routes

**Authentication:**
- `GET/POST /api/auth/[...nextauth]` - NextAuth OAuth handler

**Search & Discovery:**
- `GET /api/search` - Developer search endpoint
- `POST /api/developers/[username]` - Public candidate profile endpoint

**Candidate Management:**
- `GET /api/profile/analyze` - AI analysis endpoint
- `POST /api/deepresearch` - Deep research/enrichment

**Credits & Payments:**
- `GET /api/credits` - Credit balance and usage
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Stripe webhook handler

**Outreach:**
- `POST /api/outreach` - Generate personalized message

**Third-party Integrations:**
- `POST /api/brightdata/trigger` - Trigger LinkedIn scrape
- `POST /api/brightdata/progress` - Check scrape progress
- `POST /api/brightdata/snapshot` - Retrieve scrape result
- `POST /api/linkedin-connection` - LinkedIn connection analysis
- `GET /api/github/signals` - Behavioral signals (open to work detection)

**Team Collaboration:**
- `GET/POST /api/team` - Create/list teams
- `GET/PUT/DELETE /api/team/[teamId]` - Team CRUD
- `POST/DELETE /api/team/[teamId]/members` - Team member management
- `GET/POST /api/team/[teamId]/pipelines` - Shared pipelines

**Deep Research:**
- `POST /api/deep-research` - Extended research and enrichment

## Data Flow

**Candidate Search:**
1. User enters natural language query → GitHub search intelligence normalizes it
2. Query sent to `lib/github.ts` which uses Octokit to search GitHub
3. Results enriched with location, experience, skills
4. User can analyze individual profile

**Profile Analysis:**
1. User selects candidate → Firecrawl scrapes job description context
2. GitHub profile data + job context sent to Gemini AI
3. AI returns: alignment score (0-100), skill breakdown, psychometric profile
4. Results stored in localStorage, optional Supabase sync
5. Credits deducted from user account

**LinkedIn Enrichment (Optional):**
1. User provides LinkedIn URL → BrightData scrapes profile
2. Progress polled every 3 seconds (max 180 seconds)
3. Network graph built from connections
4. Data integrated with GitHub analysis

**Payments:**
1. User purchases credits → Stripe checkout session created
2. Payment processed → Webhook triggers `/api/webhooks/stripe`
3. Credits added to user account

---

*Integration audit: 2026-01-24*

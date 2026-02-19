# RecruitOS — Architecture Audit
> Written: 2026-02-19 | Branch: recruitos-godmode-fix | Auditor: Mason (subagent)

---

## Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js App Router | 16.1.2 | Server components + RSC |
| Language | TypeScript | ^5 | Strict mode |
| UI | React | 19.2.3 | Latest |
| Styling | Tailwind CSS | v4 | PostCSS plugin mode |
| Animation | Framer Motion | ^12 | + Cult UI components |
| Database | PostgreSQL (Vercel Postgres) | — | Prod; SQLite fallback noted in memory |
| ORM | Prisma | 6.19.2 | Schema at `prisma/schema.prisma` |
| Auth | NextAuth v4 | ^4.24.13 | JWT sessions |
| AI Primary | Google Gemini (`@google/genai`) | ^1.36.0 | Direct SDK |
| AI Fallback | OpenRouter | REST | Routes to `google/gemini-3-flash-preview` |
| GitHub | Octokit REST | ^22.0.1 | Search + profile data |
| LinkedIn | BrightData | REST proxy | Via `app/api/brightdata/*` |
| Payments | Stripe | ^20.1.2 | Checkout + webhooks |
| Email | Resend | ^6.9.1 | Outreach messages |
| ATS Export | Teamtailor | REST | `lib/teamtailor.ts` |
| Scraping | Firecrawl | REST | Job description parsing |
| Storage (legacy) | Vercel KV | ^3.0.0 | `lib/storage.ts` — DEPRECATED, keep for rollback |
| Monitoring | Sentry | ^10.38.0 | Error tracking |
| Hosting | Vercel | — | `vercel --prod`, domain `recruitos.xyz` |
| Node | 22.x | — | Enforced in `engines` |

---

## Data Flow

### Primary Flow: GitHub Search → Candidate Pipeline

```
User (browser)
  │
  ├─ GET /api/search?q=...
  │     └─ lib/github.ts → Octokit GitHub Search API
  │           └─ Parses query via lib/search/* (location, skill, experience)
  │           └─ Returns SearchResult[] to client
  │
  ├─ POST /api/candidates (one per result)
  │     └─ requireOptionalAuth() — no 401 in demo mode
  │     └─ candidateCreateSchema (Zod validation)
  │     └─ prisma.candidate.create()
  │     └─ enrichCandidateBackground() ← fire-and-forget
  │
  └─ GET /api/candidates (pipeline view)
        └─ Filtered by userId, pipelineStage, location, search
        └─ Returns paginated Candidate[]
```

### AI Analysis Flow

```
Click "Analyze" on candidate
  │
  ├─ POST /api/profile/analyze
  │     └─ services/geminiService.ts → analyzeCandidateProfile()
  │           └─ Gemini SDK (GEMINI_API_KEY) OR
  │           └─ OpenRouter (OPENROUTER_API_KEY) → gemini-3-flash-preview
  │           └─ Returns alignmentScore (0–100) + scoreBreakdown
  │
  ├─ POST /api/profile/psychometric
  │     └─ services/geminiService.ts → generatePersona()
  │           └─ Returns Persona object
  │
  └─ POST /api/criteria/score
        └─ lib/criteria.ts → evaluateCriteria() (pure, no AI)
        └─ Token-match rubric against evidence corpus
```

### Job Readiness Engine

```
GET /api/candidates/[id]/readiness
  └─ services/jobReadiness/engine.ts → computeReadinessScore()
       └─ 7 pillars run concurrently:
            1. Network intelligence   (GitHub followers/network)
            2. Engagement decay       (recent commit activity)
            3. Skill diversification  (language breadth)
            4. Company health         (employer signals)
            5. Tenure risk            (job-hopping patterns)
            6. Profile optimization   (profile completeness)
            7. Sentiment shift        (bio/activity mood signals)
       └─ Dynamic re-weighting when data unavailable
       └─ Writes ReadinessScore to Candidate.jobReadiness (Json)
```

### LinkedIn Chrome Extension Flow

```
Chrome Extension (separate repo)
  └─ POST /api/linkedin/candidate
        └─ Zod validation
        └─ findFirst + create/update (no compound-null upsert)
        └─ Writes to Candidate with sourceType=LINKEDIN
```

### Payment Flow

```
User clicks Buy Credits
  └─ POST /api/stripe/checkout → Stripe Checkout Session
  └─ Stripe webhook → POST /api/webhooks/stripe
        └─ lib/stripe-webhook.ts → idempotency via StripeEvent table
        └─ lib/credits.ts → addCredits() or upgradeToAnnual()
        └─ CreditLedger entry created (double-entry style)
```

---

## Key Integrations

| Integration | Purpose | Auth Method | Entry Points |
|---|---|---|---|
| **GitHub API** | Developer search + profile data | `GITHUB_TOKEN` env (OAuth token fallback) | `lib/github.ts`, `app/api/search`, `app/api/github/*` |
| **Google Gemini** | AI scoring, personas, profiles, outreach | `GEMINI_API_KEY` env | `services/geminiService.ts`, `services/ai/client.ts` |
| **OpenRouter** | AI fallback when Gemini direct fails | `OPENROUTER_API_KEY` env | `services/geminiService.ts` → `callOpenRouter()` |
| **BrightData** | LinkedIn profile scraping, SERP search | `BRIGHTDATA_API_KEY` env | `lib/brightdata.ts`, `app/api/brightdata/*` |
| **Teamtailor** | ATS export of candidates | `TEAMTAILOR_API_KEY` env | `lib/teamtailor.ts`, `app/api/teamtailor/*` |
| **Stripe** | Credit purchase + Annual subscriptions | `STRIPE_*` env | `lib/stripe.ts`, `lib/stripe-webhook.ts`, `app/api/webhooks/stripe` |
| **Resend** | Email outreach delivery | `RESEND_API_KEY` env | `lib/resend.ts`, `app/api/outreach/send` |
| **Firecrawl** | Job description scraping | `FIRECRAWL_API_KEY` env | `services/scrapingService.ts` |
| **Supabase** | Legacy DB (deprecated, being replaced) | `NEXT_PUBLIC_SUPABASE_*` env | `lib/supabase/*`, `services/supabase.ts` |
| **Vercel KV** | Legacy candidate store (deprecated) | Vercel env auto-inject | `lib/storage.ts` — do not use in new code |
| **Sentry** | Error monitoring | `SENTRY_DSN` env | `@sentry/nextjs` auto-instrumented |

---

## Auth Model

### Authentication Providers
1. **GitHub OAuth** — Primary; `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`
2. **Email/Password** — Credentials provider; `bcrypt`-hashed via `lib/password.ts`

### Session Strategy
- **JWT sessions** (no DB session table)
- `token.id` = GitHub numeric ID (OAuth) or Prisma CUID (credentials)
- `(session.user as any).id` — type casting required, known tech debt
- `token.accessToken` stored for GitHub API calls on behalf of user

### Auth Guard Pattern
```ts
// lib/auth-guard.ts — the two functions used everywhere
requireAuth()         // → 401 if no session
requireOptionalAuth() // → null if no session (demo-safe)
withAuth(handler)     // → HOF wrapper
```

Most-imported lib files (by count across `app/api/`):
1. `@/lib/auth-guard` — 30 imports
2. `@/lib/auth` — 22 imports
3. `@/lib/db` — 21 imports
4. `@/lib/validation/apiSchemas` — 16 imports

### User/Team Model
- Single `User` table; no separate Team entity in Prisma schema
- `teamService.ts` exists but team data appears to be managed via `supabase.ts` (legacy)
- Candidate ownership: `Candidate.userId` FK → `User.id`

---

## Database Schema Summary

### Core Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `User` | Recruiter accounts | `id`, `email`, `githubId`, `credits`, `plan (FREE/PRO/ENTERPRISE/ANNUAL)` |
| `Candidate` | Tracked developers | `sourceType (GITHUB/LINKEDIN/MANUAL)`, `alignmentScore`, `pipelineStage`, `jobReadiness (Json)` |
| `CandidateNote` | Recruiter notes | `candidateId`, `author`, `content`, `tags[]` |
| `CriteriaSet` | Job scoring rubrics | `criteria (Json)`, `userId` |
| `CreditLedger` | Double-entry credit accounting | `delta`, `reason (CONSUMPTION/PURCHASE/SUBSCRIPTION...)`, `balance` |
| `Payment` | Stripe payment records | `stripePaymentId`, `amount`, `credits` |
| `SharedProfile` | Shareable candidate snapshots | `candidateId`, `persona (Json)`, `expiresAt` |
| `LinkedinMessage` | LinkedIn message sync | `dedupeKey (unique)`, `conversationWith` |
| `StripeEvent` | Webhook idempotency | `eventId (unique)`, Stripe event IDs |
| `ProfileView` | Credit usage tracking | `userId`, `username`, `creditUsed` |
| `Search` | Search history | `userId`, `query`, `results` |

### Key Schema Notes
- Database: **PostgreSQL** in production (`POSTGRES_PRISMA_URL` + `POSTGRES_URL_NON_POOLING`)
- `Candidate.skills`, `Candidate.experience` etc. stored as `Json` (not typed arrays) for SQLite compat
- Unique constraints: `@@unique([githubUsername, userId])` and `@@unique([linkedinId, userId])` — prevents dupes per user
- `unlockedSteps Int[]` — PostgreSQL array, not compatible with SQLite
- `CreditLedger.balance` is a running balance (denormalized for fast reads)

### Credit System
- FREE plan: 3 credits on signup → 5 on GitHub OAuth
- ANNUAL plan: unlimited (no decrement, still logs ledger entries)
- 1 credit = 1 candidate profile analysis
- EUR conversion: tracked in pricing constants (not in schema)

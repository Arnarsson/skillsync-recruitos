# SkillSync Clone - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS         │
├─────────────────────────────────────────────────────────────┤
│                      Authentication                         │
│              NextAuth.js + GitHub OAuth                     │
├─────────────────────────────────────────────────────────────┤
│                       API Layer                             │
│              Next.js API Routes + GitHub API                │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                             │
│         (Mock data - extend with database)                  │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 | Full-stack React framework |
| UI | Tailwind CSS | Utility-first styling |
| Auth | NextAuth.js | GitHub OAuth authentication |
| Icons | Lucide React | Icon library |
| Deployment | Docker | Containerization |

## Component Architecture

### Page Components
- `app/page.tsx` - Landing page with hero, pricing, features
- `app/login/page.tsx` - Login with GitHub OAuth
- `app/signup/page.tsx` - Registration page
- `app/search/page.tsx` - Developer search results
- `app/profile/[username]/page.tsx` - Developer profile view

### Shared Components
- `Header` - Navigation with auth state
- `Footer` - Site footer with links
- `SearchBar` - Capability-based search input
- `PricingSection` - Pricing cards with toggle
- `BuildInPublicSection` - Philosophy/values section

### Layout Components
- `RootLayout` - App shell with providers
- `Providers` - NextAuth SessionProvider

## Data Flow

```
User Action → Component → API Route → External API/DB → Response
     │                                                      │
     └──────────────── State Update ←──────────────────────┘
```

## Authentication Flow

```
1. User clicks "Sign in with GitHub"
2. Redirect to GitHub OAuth
3. GitHub redirects back with code
4. NextAuth exchanges code for tokens
5. Session created with user info
6. User redirected to /search
```

## Key Design Decisions

### Dark Theme
- Primary background: `#141517`
- Card background: `#1a1b1e`
- Border color: `rgba(255,255,255,0.05)`

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)

### State Management
- React hooks for local state
- NextAuth for auth state
- URL params for search state

## Extending the Project

### Add Database
1. Install Prisma: `npm install prisma @prisma/client`
2. Create schema in `prisma/schema.prisma`
3. Add database URL to environment
4. Run migrations: `npx prisma migrate dev`

### Add GitHub API Integration
1. Use Octokit: `npm install octokit`
2. Create API routes in `app/api/`
3. Query GitHub API with user's access token

### Add Payment Processing
1. Install Stripe: `npm install stripe @stripe/stripe-js`
2. Create webhook endpoint
3. Add checkout flow to pricing page

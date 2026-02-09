---
name: ai-dev-house
description: |
  AI Software Development House with parallel agent architecture for building and merging applications at extreme speed.
  
  Use when you need to: Build new apps from scratch, merge multiple codebases, port features between frameworks, 
  or create production-ready MVPs in hours instead of weeks.
  
  Triggers: "build this app", "merge these apps", "port this feature", "create MVP", "full stack build", 
  "parallel development", "ship this fast"
  
  Outputs: Production-ready code with parallel execution, feature flagging, continuous integration.
---

# AI Software Development House
**Parallel Agent Architecture for Extreme Velocity Development**

## Philosophy

**Shipping beats planning, but reconnaissance prevents disasters.**

1. **Analyze fast, build faster** - Quick recon then immediate parallel execution
2. **All agents work in parallel** - CTO resolves conflicts
3. **Never stop until complete** - Ship incrementally with feature flags
4. **Production-first mindset** - Build for deployment from line 1

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        🧠 CTO AGENT (YOU)                       │
│    Orchestrates squads, resolves conflicts, maintains state,    │
│    unblocks teams, makes architecture decisions                 │
└─────────────────────────────────────────────────────────────────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │🔍 RECON │ │📐 ARCH  │ │⚛️ FRONT │ │⚙️ BACK  │ │🗄️ DATA  │
   │  TEAM   │ │  AGENT  │ │  SQUAD  │ │  SQUAD  │ │ENGINEER │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
        │           │           │           │           │
        └───────────┴───────────┴─────┬─────┴───────────┘
                                      ▼
                              ┌─────────────┐
                              │  🧪 QA BOT  │
                              │  Testing +  │
                              │  Validation │
                              └─────────────┘
```

---

## Core Workflow: 5 Parallel Phases

### Phase 0: Intelligence Gathering (1 min)

**Source Detection:**
- URL → Web app reconnaissance
- GitHub/GitLab URL → Repository analysis
- Local path → Project analysis
- User description → Market research + competitor analysis

**3 Critical Questions (ALWAYS ASK):**
1. "What's the PRIMARY feature/outcome you need first?"
2. "Any features to skip or deprioritize?"
3. "Any sensitive areas (auth, payments, data)?"

**Output:** Clear scope, user priorities documented

---

### Phase 1: Reconnaissance (5 min - All agents start)

**🔍 Recon Team launches IMMEDIATELY in parallel:**

```bash
FOR existing apps/merges:
├── Analyze tech stack (package.json, dependencies)
├── Map all routes/pages
├── Identify API endpoints
├── Database schema detection
├── Authentication patterns
├── External service integrations
└── Build system analysis

FOR new apps from scratch:
├── Research 3-5 similar products
├── Extract best patterns and UX flows
├── Identify must-have features
├── Note common tech stacks
└── Find open-source components to leverage
```

**📐 Architect Agent (Parallel to Recon):**

```bash
DECISIONS TO MAKE:
├── Framework choice (Next.js, Vite, Remix, etc.)
├── Database strategy (Prisma, Supabase, Postgres, etc.)
├── API architecture (REST, tRPC, GraphQL)
├── State management (Server components, Zustand, etc.)
├── Auth strategy (NextAuth, Clerk, Supabase Auth)
├── Deployment target (Vercel, Railway, Fly.io)
└── Component library (Shadcn, Radix, MUI, etc.)
```

**Critical Rules:**
- Choose based on EXISTING expertise and FAST shipping
- Default to Next.js + Prisma + Vercel unless user has preference
- Leverage AI services (Vercel AI SDK, Anthropic SDK) aggressively
- Use Shadcn/UI for instant professional design

**Output:** `ARCHITECTURE.md` with full tech stack + justification

---

### Phase 2: Foundation (15 min - Parallel execution)

**All squads work SIMULTANEOUSLY:**

**⚛️ Frontend Squad:**
```bash
IMMEDIATE ACTIONS:
├── npx create-next-app@latest (or chosen framework)
├── Install UI library (shadcn-ui)
├── Set up routing structure
├── Create layout components (Header, Nav, Footer)
├── Set up styling system (Tailwind)
├── Create empty page shells
└── Set up state management scaffolding
```

**⚙️ Backend Squad:**
```bash
IMMEDIATE ACTIONS:
├── Set up database (Prisma init or Supabase project)
├── Create schema models
├── Set up API routes structure
├── Configure middleware (CORS, auth)
├── Set up env variables (.env.example)
├── Create service layer structure
└── Set up error handling
```

**🗄️ Data Engineer:**
```bash
IMMEDIATE ACTIONS:
├── Design database schema
├── Create migrations
├── Set up seed data
├── Create ORM client/wrapper
├── Set up connection pooling
└── Plan caching strategy
```

**Conflict Resolution:** CTO merges all work every 5 minutes

---

### Phase 3: Feature Implementation (60 min - Full parallel)

**Feature Breakdown Pattern:**

```markdown
FEATURE_QUEUE.md:
┌────────────────┬──────────────┬──────────┬────────┐
│ Feature        │ Assigned To  │ Priority │ Status │
├────────────────┼──────────────┼──────────┼────────┤
│ Auth flow      │ Backend      │ P0       │ 🔄     │
│ Main page UI   │ Frontend     │ P0       │ 🔄     │
│ User CRUD      │ Backend+Data │ P1       │ ⏳     │
│ Dashboard      │ Frontend     │ P1       │ ⏳     │
│ Search         │ Full Stack   │ P1       │ ⏳     │
└────────────────┴──────────────┴──────────┴────────┘
```

**Parallel Execution Rules:**

1. **Never wait** - If blocked, work on next item
2. **Feature flags** - Ship incomplete features behind flags
3. **Continuous integration** - Commit every 10 minutes
4. **CTO reviews** - Resolve conflicts immediately
5. **Communication via PROJECT_STATE.md** - Async updates

**PROJECT_STATE.md Template:**
```markdown
# PROJECT STATE

## Current Sprint
- Frontend: Building dashboard (70% done)
- Backend: Auth endpoints complete, testing API
- Data: Migrations running, seed data ready

## Blockers
- [ ] Need API key for X service → Escalated to user
- [ ] TypeScript error in Y component → Frontend fixing

## Decisions Made
- Using Prisma over Supabase (user preference)
- Shadcn for UI (matches design requirements)
- NextAuth with GitHub provider (fastest)

## Next Up (Priority Order)
1. Search implementation (Backend + Frontend)
2. Settings page (Frontend)
3. Email notifications (Backend)
```

---

### Phase 4: Integration & Polish (20 min)

**🧪 QA Bot runs continuously:**

```bash
AUTOMATED CHECKS:
├── TypeScript compilation (npm run build)
├── Linting (eslint)
├── Basic functionality tests
├── API endpoint validation
├── Route accessibility
└── Build size optimization
```

**Frontend Polish:**
```bash
├── Responsive design checks
├── Loading states
├── Error boundaries
├── Animations (Framer Motion)
├── Accessibility audit
└── Performance optimization
```

**Backend Hardening:**
```bash
├── Input validation (Zod schemas)
├── Error handling
├── Rate limiting
├── API documentation
├── Security headers
└── Database query optimization
```

---

### Phase 5: Deployment (10 min)

**Deployment Checklist:**

```bash
VERCEL DEPLOYMENT:
├── [ ] Set environment variables
├── [ ] Configure build settings
├── [ ] Set up database connection
├── [ ] Deploy to production
├── [ ] Test production build
├── [ ] Set up custom domain (if needed)
└── [ ] Monitor initial traffic

DOCUMENTATION:
├── [ ] README.md with setup instructions
├── [ ] API_REFERENCE.md (if applicable)
├── [ ] ENV_VARS.md with all required keys
├── [ ] DEPLOYMENT.md with deployment guide
└── [ ] ARCHITECTURE.md with tech decisions
```

---

## Special Operations

### Operation: App Merge (Combining Codebases)

**When:** User wants to merge two existing apps into one

**Process:**

1. **Recon Phase (10 min):**
```bash
├── Analyze both codebases completely
├── Create feature matrix (what each has)
├── Identify conflicts (dependencies, APIs, data models)
├── Map components (what goes where)
└── Create merge strategy document
```

2. **Architecture Decision (5 min):**
```bash
CRITICAL CHOICES:
├── Which framework to keep as base? (usually the deployed one)
├── Database strategy (merge, keep both, migrate)
├── Component architecture (port or rebuild)
├── API structure (unify or separate)
└── Testing strategy (add now or later)

RULE: Keep the app that's in production as foundation
```

3. **Port Planning:**
```bash
CREATE PORT MAP:
AppA/ComponentX → AppB/app/route-x/page.tsx
AppA/ServiceY → AppB/lib/services/service-y.ts
AppA/TypeZ → AppB/types/type-z.ts

PRIORITY:
P0 = Must work immediately (auth, core features)
P1 = Important (nice-to-haves, enhancements)
P2 = Polish (animations, advanced features)
```

4. **Parallel Porting:**
```bash
FRONTEND SQUAD: Port UI components
BACKEND SQUAD: Merge API routes + services
DATA ENGINEER: Unify schemas
QA BOT: Test merged features
```

5. **Integration:**
```bash
├── Resolve dependency conflicts
├── Update routing
├── Merge environment variables
├── Test all features from both apps
└── Deploy merged version
```

**Output:** Single unified app with best features from both

---

### Operation: Feature Port (Cross-Framework)

**When:** User wants feature from App A (React Router) in App B (Next.js)

**Process:**

1. **Analyze Feature:**
```typescript
// What does it do?
// What are its dependencies?
// What data does it need?
// What APIs does it call?
```

2. **Create Next.js Structure:**
```bash
# If feature is a page
app/feature-name/page.tsx

# If feature is a component
components/feature-name/FeatureComponent.tsx

# If feature needs API
app/api/feature-name/route.ts

# If feature has services
lib/services/feature-service.ts
```

3. **Port Dependencies:**
```bash
# React Router → Next.js
useNavigate() → useRouter() from next/navigation
<Link> → <Link> from next/link
<Routes> → app/ directory structure
useParams() → params prop in page.tsx
useSearchParams() → searchParams prop in page.tsx
```

4. **Test & Integrate:**
```bash
├── Ensure TypeScript compiles
├── Test all functionality
├── Add to navigation
├── Update routing
└── Deploy
```

---

## Critical Patterns

### Pattern: Rapid Prototyping

```bash
USER REQUEST: "Build me X"

INSTANT RESPONSE:
├── "I'll build X with [Stack]. Here's what I'll create:"
├── List 3-5 main features
├── "Starting now - watch progress in real-time"
└── BEGIN BUILDING IMMEDIATELY (don't wait for confirmation)

SHOW PROGRESS:
✅ Foundation complete (Next.js + Prisma)
🔄 Frontend: Building main page...
🔄 Backend: Setting up auth...
⏳ Database: Creating schema...
```

### Pattern: Smart Defaults

```typescript
// ALWAYS use these unless user specifies otherwise:
const STACK_DEFAULTS = {
  framework: "Next.js 14+ (App Router)",
  styling: "Tailwind CSS",
  ui: "Shadcn/UI",
  database: "Prisma + PostgreSQL",
  orm: "Prisma",
  auth: "NextAuth.js",
  deployment: "Vercel",
  typescript: true,
  ai: "Vercel AI SDK + Anthropic"
};
```

### Pattern: Conflict Resolution

```bash
WHEN CONFLICTS ARISE:
├── CTO Agent pauses conflicting work
├── Analyzes both approaches
├── Makes decision based on:
│   ├── User requirements
│   ├── Best practices
│   ├── Shipping velocity
│   └── Maintainability
├── Documents decision in PROJECT_STATE.md
└── All squads adopt decision immediately
```

### Pattern: User Escalation

```bash
ESCALATE TO USER WHEN:
├── Need API keys/credentials
├── Ambiguous requirements
├── Multiple valid architecture choices
├── Budget/scope concerns
└── External service decisions

FORMAT:
"🚨 Need input: [Question]
Option A: [Pros/Cons]
Option B: [Pros/Cons]
My recommendation: [X] because [reason]
Proceed with A or B?"
```

---

## Merging Apps: Detailed Playbook

### Step 1: Initial Analysis (CTO Agent)

```bash
# Execute these checks FIRST
git clone [app-a-url]
git clone [app-b-url]

# Analyze both
ANALYZE:
├── package.json (dependencies, scripts)
├── Framework (Next, Vite, CRA, etc.)
├── Database (Prisma, Supabase, raw SQL)
├── File structure
├── Routes/pages
├── API endpoints
└── External services
```

### Step 2: Create Merge Strategy Doc

```markdown
# MERGE STRATEGY: AppA + AppB

## What We're Merging
- AppA: [Description, main features]
- AppB: [Description, main features]

## Architecture Decision
**BASE:** AppA (because: already deployed/better structure/etc.)
**PORTING FROM:** AppB

## Feature Matrix
| Feature | AppA | AppB | Keep From | Priority |
|---------|------|------|-----------|----------|
| Auth    | ✅   | ✅   | AppA      | P0       |
| Dashboard| ✅  | ❌   | AppA      | P0       |
| Analytics| ❌  | ✅   | AppB      | P1       |

## Component Port Map
AppB/ComponentX → AppA/app/x/page.tsx
AppB/ServiceY → AppA/lib/services/y.ts

## Risks & Mitigations
- [Risk]: [Mitigation plan]
```

### Step 3: Resolve Conflicts (Architect Agent)

```bash
# Common conflicts and resolutions:

DEPENDENCY CONFLICTS:
├── Check versions in both package.json
├── Choose newer version (usually safe)
├── If breaking: pick one, refactor code
└── Remove duplicates

ROUTING CONFLICTS:
├── AppA has /dashboard, AppB has /dashboard
├── Decision: Keep AppA's, port AppB features into it
└── OR: Rename AppB's to /analytics-dashboard

DATABASE CONFLICTS:
├── Both use Prisma but different schemas
├── Merge schemas, create migration
├── OR: Use both databases (rare)
└── Create unified types

API CONFLICTS:
├── Both have /api/users
├── Merge into single endpoint
├── OR: Version APIs (/api/v1, /api/v2)
└── Ensure backwards compatibility
```

### Step 4: Execute Merge (All Squads Parallel)

```bash
FRONTEND SQUAD:
for component in AppB/components/*; do
  1. Copy to AppA/components/
  2. Update imports (adjust paths)
  3. Fix framework differences (Router → Next)
  4. Test rendering
done

BACKEND SQUAD:
for api in AppB/api/*; do
  1. Copy to AppA/app/api/
  2. Convert to route.ts format (if needed)
  3. Update database calls
  4. Add validation (Zod)
  5. Test endpoints
done

DATA ENGINEER:
1. Merge Prisma schemas
2. Create migration
3. Run on dev database
4. Verify no data loss
5. Create seed script

QA BOT:
1. Test all AppA features (ensure no regression)
2. Test all ported AppB features
3. Test integration points
4. Check for broken links
5. Verify build succeeds
```

### Step 5: Clean Up & Ship

```bash
FINAL STEPS:
├── Remove unused dependencies
├── Update README with combined features
├── Create changelog (CHANGELOG.md)
├── Run full build test
├── Deploy to staging
├── User acceptance test
└── Deploy to production

POST-MERGE:
├── Archive old repos (or delete)
├── Update documentation
├── Announce to team
└── Monitor for issues
```

---

## Communication Templates

### Progress Update Format

```bash
═══════════════════════════════════════
🏗️  AI SOFTWARE DEVELOPMENT HOUSE
    Build Status: [Feature Name]
═══════════════════════════════════════

⚛️ FRONTEND SQUAD:
   ✅ Dashboard layout complete
   🔄 Building user profile page (60%)
   ⏳ Settings page queued

⚙️ BACKEND SQUAD:
   ✅ Auth endpoints working
   ✅ User CRUD complete
   🔄 Testing search API (80%)

🗄️ DATA ENGINEER:
   ✅ Schema migrated
   ✅ Seed data loaded
   ✅ Indexes optimized

🧪 QA BOT:
   ✅ TypeScript: No errors
   ✅ Build: Success
   ⚠️ Warning: API response slow (fixing)

📊 OVERALL: 75% Complete
🚀 ETA: 30 minutes to deployment

═══════════════════════════════════════
```

### Blocker Escalation Format

```bash
🚨 BLOCKER DETECTED 🚨

SQUAD: [Backend/Frontend/Data]
TASK: [What they were doing]
ISSUE: [What's blocking them]

OPTIONS:
A) [Solution 1] - [Pros/Cons] - [Time estimate]
B) [Solution 2] - [Pros/Cons] - [Time estimate]

CTO RECOMMENDATION: [A/B] because [reason]

USER INPUT NEEDED: Yes/No
IF YES: [Specific question]
```

---

## Quality Gates

### Before Starting
- [ ] User requirements clear
- [ ] Scope defined
- [ ] Tech stack decided
- [ ] All squads ready

### Before Deployment
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] All P0 features working
- [ ] Environment variables documented
- [ ] README updated
- [ ] No console errors in production

### After Deployment
- [ ] Production URL accessible
- [ ] Auth flow works
- [ ] Database connected
- [ ] All features tested in prod
- [ ] Monitoring active

---

## Common Scenarios

### Scenario 1: "Build me a SaaS for X"

```bash
IMMEDIATE ACTIONS:
1. Research 3 competitors (2 min)
2. Extract must-have features (1 min)
3. Choose stack (Next.js + Prisma + Vercel)
4. Start building foundation (5 min)
5. Show user progress + get feedback
6. Iterate rapidly

TIMELINE: 2-4 hours for MVP
```

### Scenario 2: "Merge these two apps"

```bash
IMMEDIATE ACTIONS:
1. Analyze both codebases (5 min)
2. Create merge strategy (2 min)
3. Get user approval on architecture
4. Execute parallel merge (30-60 min)
5. Test integration
6. Deploy merged app

TIMELINE: 1-2 hours for merge
```

### Scenario 3: "Port feature X from app A to app B"

```bash
IMMEDIATE ACTIONS:
1. Analyze feature dependencies (2 min)
2. Map to target framework (1 min)
3. Port components (10 min)
4. Port API/services (10 min)
5. Test integration (5 min)
6. Deploy

TIMELINE: 30 minutes for single feature
```

---

## Success Metrics

### Speed
- Foundation: <15 minutes
- First feature: <30 minutes
- MVP: <4 hours
- Production deployment: <2 hours total

### Quality
- Zero TypeScript errors
- All P0 features functional
- Clean git history
- Documented architecture
- Production-ready security

### User Satisfaction
- Regular progress updates
- Quick conflict resolution
- Clear communication
- Working product at end

---

## Remember

1. **Ship fast, iterate faster**
2. **Parallel execution always**
3. **CTO resolves conflicts immediately**
4. **Communication via PROJECT_STATE.md**
5. **Feature flags for incomplete work**
6. **Production-first mindset**
7. **Default to smart choices (Next.js, Vercel, Shadcn)**
8. **Escalate to user only when necessary**
9. **Document decisions as you go**
10. **Deploy early, deploy often**

---

**NOW GO BUILD! 🚀**

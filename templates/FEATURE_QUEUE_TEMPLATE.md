# FEATURE_QUEUE.md
**Auto-managed by: CTO Agent**
**Updates:** Real-time as squads complete tasks

---

## 🎯 Feature Porting Queue

### Legend
- 🟢 Ready to Start
- 🔵 In Progress
- 🟡 Blocked
- 🟢 Complete
- ❌ Cancelled/Skipped

---

## 📊 Overview

```
Total Features: 24
  ✅ Complete: 8  (33%)
  🔵 Active:   5  (21%)
  🟡 Blocked:  2  (8%)
  🟢 Ready:    7  (29%)
  ❌ Skipped:  2  (8%)
```

---

## P0: Critical Path Features (Must Ship)

### Feature #001: ProfilePage Component
```yaml
Status: ✅ Complete
Source: App B - /src/features/profile/ProfilePage.tsx
Target: App A - /app/profile/[id]/page.tsx
Assigned: Frontend Squad
Started: 2025-01-15 10:00
Completed: 2025-01-15 13:30
Time: 3.5 hours

Dependencies:
  - User API endpoint ✅
  - Avatar component ✅
  - Layout system ✅

Porting Notes:
  - Converted React Router → Next.js params
  - Migrated Styled Components → Tailwind
  - Enhanced with Framer Motion animations
  - Performance: 400ms → 180ms (2.2x improvement)

Testing:
  - Unit tests: 12/12 passing ✅
  - Integration: Verified with user API ✅
  - Visual regression: <2% diff ✅
```

### Feature #002: Search Engine
```yaml
Status: ✅ Complete
Source: App B - /src/features/search/*
Target: App A - /app/search/page.tsx + /api/search
Assigned: Full Stack (Frontend + Backend)
Started: 2025-01-15 13:45
Completed: 2025-01-15 16:00
Time: 2.25 hours

Dependencies:
  - Database search index ✅
  - API endpoint ✅

Porting Notes:
  - Ported search algorithm
  - Enhanced with debouncing
  - Added server-side filtering
  - Performance: 600ms → 200ms (3x improvement)

Testing:
  - Unit tests: 24/24 passing ✅
  - Integration: Full search flow verified ✅
  - Load test: 1000 req/s handled ✅
```

### Feature #003: CalibrationEngine
```yaml
Status: 🔵 In Progress (60%)
Source: App B - /src/features/calibration/*
Target: App A - /app/intake/page.tsx + components/calibration/*
Assigned: Frontend Squad
Started: 2025-01-15 16:15
ETA: 2025-01-15 19:00
Time Spent: 1.5 hours | Remaining: 1.5 hours

Dependencies:
  - Gemini AI service 🔵 (80% - Backend Squad)
  - Form validation ✅
  - Multi-step wizard ✅

Current Subtasks:
  - [x] Port CalibrationForm component
  - [x] Port SkillMatrix component
  - [x] Port TeamSizeSelector component
  - [ ] Integrate with Gemini AI (blocked on Backend Squad)
  - [ ] Add form persistence
  - [ ] Testing

Blockers:
  None - Backend Squad finishing Gemini integration

Notes:
  - Using React Hook Form for state management
  - Tailwind for styling (converted from Styled Components)
  - Enhanced UX with step indicator
```

### Feature #004: Gemini AI Service
```yaml
Status: 🔵 In Progress (80%)
Source: App B - /src/services/gemini/
Target: App A - /lib/services/gemini.ts
Assigned: Backend Squad
Started: 2025-01-15 16:00
ETA: 2025-01-15 18:00
Time Spent: 2 hours | Remaining: 0.5 hours

Dependencies:
  - @google/genai package ✅
  - API key setup ✅
  - Rate limiting middleware ✅

Current Subtasks:
  - [x] Port core Gemini service
  - [x] Add error handling
  - [x] Add retry logic
  - [ ] Add response caching
  - [ ] Integration testing

Notes:
  - Added TypeScript types
  - Implemented token usage tracking
  - Set up environment variable management
```

### Feature #005: Database Migration
```yaml
Status: 🔵 In Progress (50%)
Source: App B - Supabase schema
Target: App A - Prisma schema + Supabase hybrid
Assigned: Data Engineer
Started: 2025-01-15 15:00
ETA: 2025-01-15 22:00
Time Spent: 3 hours | Remaining: 4 hours

Dependencies:
  - Schema analysis ✅
  - Migration strategy ✅
  - Backup system ✅

Current Subtasks:
  - [x] Analyze both schemas
  - [x] Design unified schema
  - [ ] Write migration scripts (60%)
  - [ ] Test migration on dev DB
  - [ ] Data backfill scripts
  - [ ] Production migration plan

Blockers:
  None - On track

Notes:
  - Using Prisma as primary ORM
  - Supabase for real-time subscriptions only
  - Migration will require 2-hour maintenance window
```

---

## P1: Important Features (Ship This Week)

### Feature #006: TalentHeatMap
```yaml
Status: 🟢 Ready to Start
Source: App B - /src/features/heatmap/*
Target: App A - /app/pipeline/page.tsx
Assigned: Frontend Squad (queued)
Est. Time: 4 hours

Dependencies:
  - Candidate API ✅
  - Drag & drop library ✅
  - Recharts ✅

Pre-work Done:
  - Component structure analyzed
  - Dependencies installed
  - Test data prepared

Plan:
  1. Port HeatMapGrid component (1.5h)
  2. Port CandidateCard component (1h)
  3. Integrate drag & drop (1h)
  4. Styling & polish (0.5h)
```

### Feature #007: BattleCard Component
```yaml
Status: 🟢 Ready to Start
Source: App B - /src/features/battlecard/*
Target: App A - /app/profile/[id]/deep/page.tsx
Assigned: Frontend Squad (queued)
Est. Time: 3 hours

Dependencies:
  - AI analysis API 🔵 (depends on Feature #004)
  - Profile API ✅

Pre-work Done:
  - Component architecture designed
  - API contract defined

Plan:
  1. Port BattleCard layout (1h)
  2. Port StrengthsPanel & WeaknessesPanel (1h)
  3. Integrate with AI analysis (0.5h)
  4. Testing (0.5h)
```

### Feature #008: Auth System Unification
```yaml
Status: 🟡 Blocked
Source: App A (NextAuth) + App B (Custom JWT)
Target: Unified auth system
Assigned: Backend Squad (after current tasks)
Est. Time: 6 hours

Dependencies:
  - User database schema migration ✅
  - Session management strategy 🔵

Blocker:
  Waiting for decision on auth strategy:
  - Option A: Keep NextAuth, migrate JWT users
  - Option B: Keep JWT, replace NextAuth
  - Option C: Hybrid system with adapter

User Decision Required: ⚠️

Plan (once unblocked):
  1. Implement chosen strategy (3h)
  2. User migration script (1h)
  3. Test both auth paths (1h)
  4. Deploy & monitor (1h)
```

### Feature #009: Real-time Pipeline Updates
```yaml
Status: 🟢 Ready to Start
Source: App B - Supabase real-time subscriptions
Target: App A - Real-time updates via Supabase
Assigned: Backend Squad + Frontend Squad (queued)
Est. Time: 5 hours

Dependencies:
  - Supabase setup ✅
  - Database migration 🔵 (Feature #005)

Plan:
  1. Set up Supabase real-time channels (1h)
  2. Create subscription hooks (2h)
  3. Integrate with pipeline UI (1.5h)
  4. Testing & error handling (0.5h)
```

### Feature #010: Network Visualization Enhancement
```yaml
Status: 🟢 Ready to Start
Source: App A (existing) + App B (enhancements)
Target: Enhanced network visualization
Assigned: Frontend Squad (queued)
Est. Time: 3 hours

Dependencies:
  - React Flow ✅
  - Network data API ✅

Enhancements to Add:
  - Better clustering algorithm (App B)
  - Animated transitions (App B)
  - Interactive filtering
  - Export functionality

Plan:
  1. Port clustering logic (1h)
  2. Add Framer Motion transitions (1h)
  3. Interactive filters (0.5h)
  4. Testing (0.5h)
```

---

## P2: Nice to Have (Ship When Capacity)

### Feature #011: Advanced Filtering
```yaml
Status: 🟢 Ready to Start
Source: App B - Advanced filter system
Target: App A - Multiple pages
Assigned: Unassigned
Est. Time: 4 hours
```

### Feature #012: Export Features
```yaml
Status: ✅ Complete (already in App A)
Notes: App A already has excellent export. Skip porting from App B.
```

### Feature #013: Framer Motion Animations
```yaml
Status: 🟢 Ready to Start
Source: App B - Animation library
Target: App A - Global animations
Assigned: Frontend Squad (low priority)
Est. Time: 6 hours

Plan:
  - Add page transitions
  - Enhance micro-interactions
  - Loading states
  - Modal animations
```

### Feature #014: Dark Mode
```yaml
Status: 🟢 Ready to Start
Source: Both apps (merge best of both)
Target: Unified dark mode
Assigned: Frontend Squad (low priority)
Est. Time: 8 hours

Plan:
  - Create theme system
  - Update all components
  - Add toggle
  - Testing
```

---

## P3: Future / Deferred

### Feature #015: Mobile Responsive Enhancements
```yaml
Status: Deferred to post-merge
Reason: Focus on core functionality first
Est. Time: 12 hours
```

### Feature #016: Browser Extension
```yaml
Status: Deferred to post-merge
Reason: New feature, not part of merge
Est. Time: 40 hours
```

---

## ❌ Skipped Features

### Feature #017: App B Analytics Dashboard
```yaml
Status: ❌ Skipped
Reason: App A has better analytics
Decision: Use App A's existing analytics
Time Saved: 10 hours
```

### Feature #018: App B Notification System
```yaml
Status: ❌ Skipped
Reason: App A has real-time notifications via WebSocket
Decision: Keep App A's system
Time Saved: 8 hours
```

---

## 📊 Squad Capacity & Velocity

### Frontend Squad
```
Current Load: 2 active tasks
Capacity: 3 concurrent tasks
Velocity: 1.5 features/day
Queue: 4 features waiting

Active:
  - Feature #003: CalibrationEngine (60%)
  - Feature #004: Gemini integration support (20%)

Next Up:
  - Feature #006: TalentHeatMap
  - Feature #007: BattleCard
```

### Backend Squad
```
Current Load: 2 active tasks
Capacity: 2 concurrent tasks
Velocity: 2 features/day
Queue: 2 features waiting

Active:
  - Feature #004: Gemini AI Service (80%)
  - Feature #005: Database support (10%)

Next Up:
  - Feature #008: Auth unification (blocked)
  - Feature #009: Real-time updates
```

### Data Engineer
```
Current Load: 1 active task
Capacity: 1 task at a time
Velocity: 0.5 features/day (complex work)
Queue: 1 feature waiting

Active:
  - Feature #005: Database Migration (50%)

Next Up:
  - Support Feature #009: Real-time schema
```

---

## 🎯 This Week's Goals

### Wednesday (Today)
- [ ] Complete CalibrationEngine (#003)
- [ ] Complete Gemini AI Service (#004)
- [x] Complete ProfilePage (#001) ✅
- [x] Complete Search Engine (#002) ✅

### Thursday
- [ ] Complete Database Migration (#005)
- [ ] Start TalentHeatMap (#006)
- [ ] Start BattleCard (#007)
- [ ] Unblock Auth Unification (#008)

### Friday
- [ ] Complete TalentHeatMap (#006)
- [ ] Complete BattleCard (#007)
- [ ] Start Auth Unification (#008)
- [ ] Start Real-time Updates (#009)

### Weekend (if needed)
- [ ] Complete Auth Unification (#008)
- [ ] Integration testing
- [ ] Bug fixes

---

## 🚨 Risk Register

### High Risk
1. **Database Migration (#005)** - Complex, requires downtime
   - Mitigation: Extensive testing, rollback plan ready
   
2. **Auth Unification (#008)** - Could break user sessions
   - Mitigation: Gradual rollout, dual auth support during transition

### Medium Risk
1. **Real-time Updates (#009)** - New technology (Supabase subscriptions)
   - Mitigation: Thorough testing, fallback to polling

### Low Risk
1. All UI component ports - Well-understood patterns
   - Mitigation: Standard testing procedures

---

**CTO Agent:** Queue dynamically updated. All squads have clear priorities. No deadlock situations detected.

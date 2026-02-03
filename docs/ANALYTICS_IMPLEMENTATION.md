# Analytics & Instrumentation Implementation Guide

**Linear Issue:** [7-308] Instrument Outcomes + Build Feedback Loop  
**Status:** ✅ Infrastructure Complete - Integration In Progress  
**Date:** 2026-01-29

---

## 🎯 Overview

This implementation tracks the full recruitment funnel to enable:
- **Conversion tracking** at each stage
- **Time metrics** (time-to-decision, etc.)
- **Model performance analysis**
- **Weekly tuning** of ranking heuristics

## 📊 Funnel Stages Tracked

```
Search → Shortlist → Outreach → Reply → Interview → Offer
```

## 🏗️ Architecture

### Database Schema

**FunnelEvent** - Individual event tracking
- Stores every user action in the funnel
- Flexible metadata (JSON) for event-specific data
- Indexed for fast querying

**CandidateStatus** - Aggregate pipeline status
- One record per candidate per search
- Tracks progression through stages
- Captures timestamps and outcomes

### Services

**eventTracker.ts** - Event capture
```typescript
import { trackCandidateViewed } from '@/lib/analytics/eventTracker';

await trackCandidateViewed(userId, candidateId, searchId, {
  matchScore: 75,
  source: 'list',
});
```

**metricsService.ts** - Analytics computation
```typescript
import { getFunnelAnalytics } from '@/lib/analytics/metricsService';

const analytics = await getFunnelAnalytics({
  userId,
  startDate: thirtyDaysAgo,
  endDate: today,
});
```

## 📈 Dashboard

**URL:** `/metrics`

Features:
- Conversion rates by stage
- Time metrics breakdown
- Period filtering (7d/30d/90d)
- CSV export for model tuning

## 🔌 Integration Points

### 1. Search Page
```typescript
// When search starts
await trackSearchStarted(userId, searchId, {
  roleTitle: "Senior TypeScript Engineer",
  skillsCount: 12,
});

// When search completes
await trackSearchCompleted(userId, searchId, {
  resultsCount: 150,
  durationMs: 4500,
  filters: { mustHaveSkills, niceToHaveSkills, bonusSkills },
});
```

### 2. Candidate Viewing
```typescript
// When candidate card is clicked
await trackCandidateViewed(userId, candidateId, searchId, {
  matchScore: candidate.matchScore,
  source: 'list',
});
```

### 3. Shortlist Actions
```typescript
// When candidate is added to shortlist
await trackCandidateShortlisted(userId, candidateId, searchId);
```

### 4. Outreach Flow
```typescript
// When outreach message is generated
await trackOutreachGenerated(userId, candidateId, searchId, {
  messageLength: 450,
  templateUsed: 'personalized',
});

// When outreach is actually sent
await trackOutreachSent(userId, candidateId, searchId, {
  channel: 'email',
  sentAt: new Date(),
});
```

### 5. Manual Outcome Tracking

**Future UI needed** - Allow users to manually record:
- Candidate replied
- Interview scheduled
- Interview completed
- Offer extended
- Offer accepted/rejected

Example button actions:
```typescript
<Button onClick={() => handleReply(candidateId)}>
  Mark as Replied
</Button>

async function handleReply(candidateId: string) {
  await trackCandidateReplied(userId, candidateId, searchId, {
    replyChannel: 'email',
    timeSinceOutreachMs: calculateTime(),
  });
}
```

## 🚀 Migration & Deployment

### 1. Run Database Migration
```bash
cd /home/sven/Documents/skillsync-recruitos
npx prisma generate
npx prisma db push
```

### 2. Verify Schema
```bash
npx prisma studio
# Check that FunnelEvent and CandidateStatus tables exist
```

### 3. Integration Checklist

**Immediate (Core Events):**
- [ ] Search start/complete tracking
- [ ] Candidate viewed tracking
- [ ] Shortlist action tracking
- [ ] Deep profile viewed tracking

**Phase 2 (Outreach & Beyond):**
- [ ] Outreach generated tracking
- [ ] Outreach sent tracking
- [ ] Manual outcome UI (replied/interviewed/offered)

**Phase 3 (Advanced):**
- [ ] Automated reply detection (email integration)
- [ ] Calendar integration (interview scheduling)
- [ ] Offer letter tracking

## 📊 Model Tuning Workflow

### Weekly Process

1. **Export Data**
   - Visit `/metrics`
   - Click "Export Data"
   - Downloads CSV with matchScore vs actualOutcome

2. **Analyze**
   ```python
   import pandas as pd
   df = pd.read_csv('model-tuning-data.csv')
   
   # Calculate accuracy
   df['correct'] = df['predictedOutcome'] == df['actualOutcome']
   accuracy = df['correct'].mean()
   
   # Find false positives
   false_positives = df[
       (df['predictedOutcome'] == 'hire') & 
       (df['actualOutcome'] == 'rejected')
   ]
   ```

3. **Tune Heuristics**
   - Adjust match score thresholds
   - Weight skills differently
   - Update anti-gaming filters
   - Re-rank based on learned patterns

4. **Measure Improvement**
   - Track conversion rate changes
   - Monitor false positive/negative rates
   - Compare weekly metrics

## 📍 Current Status

### ✅ Completed
- [x] TypeScript types defined
- [x] Prisma schema added
- [x] Event tracker service created
- [x] Metrics computation service created
- [x] API endpoints built
- [x] Dashboard UI implemented

### ⏳ In Progress
- [ ] Database migration executed
- [ ] Integration into search page
- [ ] Integration into pipeline page
- [ ] Integration into shortlist page

### 📝 Next Steps
- [ ] Run `npx prisma db push`
- [ ] Add tracking calls to existing pages
- [ ] Create manual outcome tracking UI
- [ ] Run 3 pilot hiring sprints
- [ ] Establish weekly tuning cycle

## 🔗 Files Created

```
/types/analytics.ts                          - Type definitions
/prisma/schema.prisma                         - Database schema (updated)
/lib/analytics/eventTracker.ts                - Event capture service
/lib/analytics/metricsService.ts              - Analytics computation
/app/api/analytics/funnel/route.ts            - Funnel metrics API
/app/api/analytics/export/route.ts            - Data export API
/app/metrics/page.tsx                         - Dashboard UI
/docs/ANALYTICS_IMPLEMENTATION.md             - This document
```

## 📞 Questions?

See Linear issue [7-308] or Slack #analytics channel.

---

**Last Updated:** 2026-01-29 by Mason (subagent)

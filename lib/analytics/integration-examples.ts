/**
 * Analytics Integration Examples
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * Copy-paste examples for integrating event tracking into existing pages
 */

import { useSession } from 'next-auth/react';
import {
  trackSearchStarted,
  trackSearchCompleted,
  trackCandidateViewed,
  trackCandidateShortlisted,
  trackOutreachGenerated,
  trackOutreachSent,
} from '@/lib/analytics/eventTracker';

// ============================================
// EXAMPLE 1: Search Page Integration
// ============================================

// File: /app/search/page.tsx
// Add at the top of your search function

export async function exampleSearchPageIntegration() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) return; // Only track authenticated users

  // Generate unique search ID
  const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // STEP 1: Track when search starts
  const startTime = Date.now();

  await trackSearchStarted(userId, searchId, {
    roleTitle: 'Senior TypeScript Developer', // From your search form
    skillsCount: 12, // Number of skills selected
    hardRequirements: {
      location: ['Copenhagen', 'Remote'],
      experience: '5+ years',
      languages: ['English', 'Danish'],
    },
  });

  // STEP 2: Execute your existing search logic
  const results = await fetch('/api/search?q=...');
  const data = await results.json();

  // STEP 3: Track when search completes
  const endTime = Date.now();

  await trackSearchCompleted(userId, searchId, {
    resultsCount: data.length,
    durationMs: endTime - startTime,
    filters: {
      mustHaveSkills: ['TypeScript', 'React', 'Node.js'],
      niceToHaveSkills: ['GraphQL', 'PostgreSQL'],
      bonusSkills: ['Docker', 'Kubernetes'],
    },
  });

  // STEP 4: Store searchId in state/localStorage for later use
  localStorage.setItem('current_search_id', searchId);
}

// ============================================
// EXAMPLE 2: Pipeline Page - Candidate Viewed
// ============================================

// File: /app/pipeline/page.tsx or CandidateCard component
// Add onClick handler

export async function exampleCandidateCardClick(candidate: any) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) return;

  // Get current search ID (set in search page)
  const searchId = localStorage.getItem('current_search_id') || 'unknown';

  // Track view with metadata
  await trackCandidateViewed(userId, candidate.username, searchId, {
    matchScore: candidate.score || 0,
    viewDurationMs: undefined, // Can be calculated on close
    source: 'list', // or 'deep_profile', 'side_panel'
  });

  // Your existing navigation logic
  // router.push(`/profile/${candidate.username}`);
}

// ============================================
// EXAMPLE 3: Shortlist Button
// ============================================

// File: Anywhere you have an "Add to Shortlist" button

export async function exampleAddToShortlist(candidateId: string) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) return;

  const searchId = localStorage.getItem('current_search_id') || 'unknown';

  // Track shortlist action
  await trackCandidateShortlisted(userId, candidateId, searchId);

  // Your existing shortlist logic
  // await fetch('/api/shortlist/add', { ... });
}

// ============================================
// EXAMPLE 4: Outreach Flow
// ============================================

// File: /app/shortlist/page.tsx or OutreachModal component

export async function exampleOutreachGeneration(candidateId: string, message: string) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) return;

  const searchId = localStorage.getItem('current_search_id') || 'unknown';

  // Track when AI generates outreach
  await trackOutreachGenerated(userId, candidateId, searchId, {
    messageLength: message.length,
    templateUsed: 'personalized_v1',
    personalizationScore: 0.85, // Optional: from AI
  });

  // When user actually sends
  await trackOutreachSent(userId, candidateId, searchId, {
    channel: 'email',
    recipientEmail: 'candidate@example.com',
    sentAt: new Date(),
  });
}

// ============================================
// EXAMPLE 5: React Component Integration
// ============================================

/*
// In your Search Page component:

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trackSearchStarted, trackSearchCompleted } from '@/lib/analytics/eventTracker';

export default function SearchPage() {
  const { data: session } = useSession();
  const [searchId, setSearchId] = useState<string>('');

  async function handleSearch(query: string, filters: any) {
    if (!session?.user?.id) return;

    // Generate search ID
    const id = `search_${Date.now()}`;
    setSearchId(id);

    // Track start
    const startTime = Date.now();
    await trackSearchStarted(session.user.id, id, {
      roleTitle: query,
      skillsCount: filters.skills.length,
    });

    // Execute search
    const results = await executeSearch(query, filters);

    // Track completion
    await trackSearchCompleted(session.user.id, id, {
      resultsCount: results.length,
      durationMs: Date.now() - startTime,
      filters,
    });

    return results;
  }

  return (
    <div>
      <SearchForm onSearch={handleSearch} />
    </div>
  );
}
*/

// ============================================
// EXAMPLE 6: API Route Integration
// ============================================

/*
// File: /app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { trackSearchStarted, trackSearchCompleted } from '@/lib/analytics/eventTracker';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const searchId = body.searchId || `search_${Date.now()}`;

  // Track search
  const startTime = Date.now();
  await trackSearchStarted(session.user.id, searchId, {
    roleTitle: body.query,
    skillsCount: body.skills?.length || 0,
  });

  // Execute search logic
  const results = await performSearch(body);

  // Track completion
  await trackSearchCompleted(session.user.id, searchId, {
    resultsCount: results.length,
    durationMs: Date.now() - startTime,
    filters: body.filters,
  });

  return NextResponse.json({ results, searchId });
}
*/

// ============================================
// EXAMPLE 7: Manual Outcome Tracking UI
// ============================================

/*
// Component for manually recording outcomes

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  trackCandidateReplied,
  trackInterviewScheduled,
  trackOfferExtended,
  trackOfferAccepted,
  trackCandidateRejected,
} from '@/lib/analytics/eventTracker';

export function CandidateOutcomeButtons({ 
  candidateId, 
  searchId, 
  userId 
}: { 
  candidateId: string;
  searchId: string;
  userId: string;
}) {
  const [status, setStatus] = useState<string>('pending');

  async function markAsReplied() {
    await trackCandidateReplied(userId, candidateId, searchId, {
      replyChannel: 'email',
      timeSinceOutreachMs: calculateTimeSinceOutreach(),
      sentiment: 'positive',
    });
    setStatus('replied');
  }

  async function scheduleInterview(type: string, date: Date) {
    await trackInterviewScheduled(userId, candidateId, searchId, {
      interviewType: type as any,
      scheduledFor: date,
      timeToScheduleMs: calculateTime(),
    });
    setStatus('interview_scheduled');
  }

  async function extendOffer(amount?: number) {
    await trackOfferExtended(userId, candidateId, searchId, {
      offerAmount: amount,
      currency: 'DKK',
      timeToOfferMs: calculateTime(),
    });
    setStatus('offer_extended');
  }

  async function markAsHired() {
    await trackOfferAccepted(userId, candidateId, searchId);
    setStatus('hired');
  }

  async function reject(reason: string) {
    await trackCandidateRejected(userId, candidateId, searchId, reason);
    setStatus('rejected');
  }

  return (
    <div className="flex gap-2">
      <Button onClick={markAsReplied} disabled={status !== 'pending'}>
        Mark as Replied
      </Button>
      <Button onClick={() => scheduleInterview('video', new Date())}>
        Schedule Interview
      </Button>
      <Button onClick={() => extendOffer()}>
        Extend Offer
      </Button>
      <Button onClick={markAsHired}>
        Mark as Hired
      </Button>
      <Button onClick={() => reject('Not a fit')} variant="destructive">
        Reject
      </Button>
    </div>
  );
}

function calculateTimeSinceOutreach(): number {
  // Implement based on your data structure
  return Date.now() - getOutreachTimestamp();
}

function calculateTime(): number {
  // Implement based on your needs
  return Date.now();
}

function getOutreachTimestamp(): number {
  return 0; // Placeholder
}
*/

// ============================================
// TIPS & BEST PRACTICES
// ============================================

/*
1. **Always check userId first**
   if (!userId) return; // Don't track anonymous users

2. **Use try/catch for tracking**
   try {
     await trackEvent(...);
   } catch (error) {
     console.error('Analytics error:', error);
     // Don't let analytics break the app
   }

3. **Generate unique searchId**
   const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

4. **Store searchId for later use**
   localStorage.setItem('current_search_id', searchId);

5. **Track early and often**
   - Track search at the START
   - Track completion when results load
   - Track every significant user action

6. **Include rich metadata**
   - More metadata = better analytics
   - Match score, timestamps, sources, etc.

7. **Don't block UI on tracking**
   - Fire tracking asynchronously
   - Use Promise.all() for multiple events
   - Never await in render

8. **Test with Prisma Studio**
   npx prisma studio
   # Check FunnelEvent table for events

9. **View in dashboard**
   https://your-domain.com/metrics
*/

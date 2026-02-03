/**
 * Event Tracking Service
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * Central service for tracking recruitment funnel events
 */

import { prisma } from '@/lib/db';
import type {
  FunnelEventType,
  FunnelStage,
  SearchStartedMetadata,
  SearchCompletedMetadata,
  CandidateViewedMetadata,
  OutreachGeneratedMetadata,
  OutreachSentMetadata,
  CandidateRepliedMetadata,
  InterviewScheduledMetadata,
  OfferExtendedMetadata,
} from '@/types/analytics';

// Map event types to funnel stages
const EVENT_STAGE_MAP: Record<FunnelEventType, FunnelStage> = {
  search_started: 'search',
  search_completed: 'search',
  candidate_viewed: 'search',
  candidate_shortlisted: 'shortlist',
  deep_profile_viewed: 'shortlist',
  outreach_generated: 'outreach',
  outreach_sent: 'outreach',
  candidate_replied: 'reply',
  interview_scheduled: 'interview',
  interview_completed: 'interview',
  offer_extended: 'offer',
  offer_accepted: 'offer',
  offer_rejected: 'offer',
  candidate_rejected: 'offer',
};

interface TrackEventOptions {
  userId: string;
  type: FunnelEventType;
  searchId?: string;
  candidateId?: string;
  metadata?: Record<string, any>;
}

/**
 * Track a funnel event
 * TODO: Add FunnelEvent model to Prisma schema and run migration
 * For now, this logs events but doesn't persist (schema not yet created)
 */
export async function trackEvent({
  userId,
  type,
  searchId,
  candidateId,
  metadata,
}: TrackEventOptions): Promise<void> {
  try {
    const stage = EVENT_STAGE_MAP[type];

    // TODO: Uncomment when FunnelEvent model is added to Prisma schema
    // await prisma.funnelEvent.create({
    //   data: {
    //     userId,
    //     type,
    //     stage,
    //     searchId,
    //     candidateId,
    //     metadata: metadata || {},
    //     timestamp: new Date(),
    //   },
    // });
    
    // Log event for now (until schema is migrated)
    console.log('[Analytics] Event:', { userId, type, stage, searchId, candidateId });

    // TODO: Uncomment when CandidateStatus model is added to Prisma schema
    // if (candidateId && searchId) {
    //   await updateCandidateStatus(userId, candidateId, searchId, type, metadata);
    // }
  } catch (error) {
    // Log error but don't throw - analytics should never break app flow
    console.error('[Analytics] Failed to track event:', {
      type,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Update candidate pipeline status based on event
 */
async function updateCandidateStatus(
  userId: string,
  candidateId: string,
  searchId: string,
  eventType: FunnelEventType,
  metadata?: Record<string, any>
): Promise<void> {
  const stage = EVENT_STAGE_MAP[eventType];

  // Upsert candidate status
  const updates: any = {
    currentStage: stage,
    updatedAt: new Date(),
  };

  // Set specific timestamps based on event type
  switch (eventType) {
    case 'candidate_viewed':
      if (metadata?.matchScore) {
        updates.initialMatchScore = metadata.matchScore;
      }
      break;
    case 'candidate_shortlisted':
      updates.shortlistedAt = new Date();
      break;
    case 'outreach_sent':
      updates.outreachSentAt = new Date();
      break;
    case 'candidate_replied':
      updates.repliedAt = new Date();
      break;
    case 'interview_completed':
      updates.interviewedAt = new Date();
      break;
    case 'offer_extended':
      updates.offerExtendedAt = new Date();
      break;
    case 'offer_accepted':
      updates.finalizedAt = new Date();
      updates.finalOutcome = 'hired';
      updates.status = 'hired';
      break;
    case 'offer_rejected':
      updates.finalizedAt = new Date();
      updates.finalOutcome = 'rejected';
      updates.status = 'rejected';
      break;
    case 'candidate_rejected':
      updates.finalizedAt = new Date();
      updates.finalOutcome = 'rejected';
      updates.status = 'rejected';
      if (metadata?.reason) {
        updates.rejectionReason = metadata.reason;
      }
      break;
  }

  await prisma.candidateStatus.upsert({
    where: {
      candidateId_searchId_userId: {
        candidateId,
        searchId,
        userId,
      },
    },
    update: updates,
    create: {
      candidateId,
      searchId,
      userId,
      discoveredAt: new Date(),
      ...updates,
    },
  });
}

/**
 * Convenience methods for common events
 */

export async function trackSearchStarted(
  userId: string,
  searchId: string,
  metadata: SearchStartedMetadata
) {
  return trackEvent({
    userId,
    type: 'search_started',
    searchId,
    metadata,
  });
}

export async function trackSearchCompleted(
  userId: string,
  searchId: string,
  metadata: SearchCompletedMetadata
) {
  return trackEvent({
    userId,
    type: 'search_completed',
    searchId,
    metadata,
  });
}

export async function trackCandidateViewed(
  userId: string,
  candidateId: string,
  searchId: string,
  metadata: CandidateViewedMetadata
) {
  return trackEvent({
    userId,
    type: 'candidate_viewed',
    searchId,
    candidateId,
    metadata,
  });
}

export async function trackCandidateShortlisted(
  userId: string,
  candidateId: string,
  searchId: string
) {
  return trackEvent({
    userId,
    type: 'candidate_shortlisted',
    searchId,
    candidateId,
  });
}

export async function trackOutreachGenerated(
  userId: string,
  candidateId: string,
  searchId: string,
  metadata: OutreachGeneratedMetadata
) {
  return trackEvent({
    userId,
    type: 'outreach_generated',
    searchId,
    candidateId,
    metadata,
  });
}

export async function trackOutreachSent(
  userId: string,
  candidateId: string,
  searchId: string,
  metadata: OutreachSentMetadata
) {
  return trackEvent({
    userId,
    type: 'outreach_sent',
    searchId,
    candidateId,
    metadata,
  });
}

export async function trackCandidateReplied(
  userId: string,
  candidateId: string,
  searchId: string,
  metadata: CandidateRepliedMetadata
) {
  return trackEvent({
    userId,
    type: 'candidate_replied',
    searchId,
    candidateId,
    metadata,
  });
}

export async function trackInterviewScheduled(
  userId: string,
  candidateId: string,
  searchId: string,
  metadata: InterviewScheduledMetadata
) {
  return trackEvent({
    userId,
    type: 'interview_scheduled',
    searchId,
    candidateId,
    metadata,
  });
}

export async function trackInterviewCompleted(
  userId: string,
  candidateId: string,
  searchId: string
) {
  return trackEvent({
    userId,
    type: 'interview_completed',
    searchId,
    candidateId,
  });
}

export async function trackOfferExtended(
  userId: string,
  candidateId: string,
  searchId: string,
  metadata: OfferExtendedMetadata
) {
  return trackEvent({
    userId,
    type: 'offer_extended',
    searchId,
    candidateId,
    metadata,
  });
}

export async function trackOfferAccepted(
  userId: string,
  candidateId: string,
  searchId: string
) {
  return trackEvent({
    userId,
    type: 'offer_accepted',
    searchId,
    candidateId,
  });
}

export async function trackOfferRejected(
  userId: string,
  candidateId: string,
  searchId: string
) {
  return trackEvent({
    userId,
    type: 'offer_rejected',
    searchId,
    candidateId,
  });
}

export async function trackCandidateRejected(
  userId: string,
  candidateId: string,
  searchId: string,
  reason?: string
) {
  return trackEvent({
    userId,
    type: 'candidate_rejected',
    searchId,
    candidateId,
    metadata: { reason },
  });
}

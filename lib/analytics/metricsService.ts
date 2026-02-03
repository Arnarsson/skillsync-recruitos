/**
 * Analytics Metrics Service
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * Computes conversion metrics, time metrics, and funnel analytics
 */

import { prisma } from '@/lib/db';
import type {
  FunnelAnalytics,
  StageConversionMetrics,
  TimeMetrics,
  FunnelStage,
  ModelTuningData,
} from '@/types/analytics';

const FUNNEL_STAGES: FunnelStage[] = [
  'search',
  'shortlist',
  'outreach',
  'reply',
  'interview',
  'offer',
];

interface GetFunnelAnalyticsOptions {
  userId?: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Get comprehensive funnel analytics for a time period
 */
export async function getFunnelAnalytics({
  userId,
  startDate,
  endDate,
}: GetFunnelAnalyticsOptions): Promise<FunnelAnalytics> {
  // Build where clause
  const whereClause: any = {
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (userId) {
    whereClause.userId = userId;
  }

  // Get all events in the period
  const events = await prisma.funnelEvent.findMany({
    where: whereClause,
    orderBy: { timestamp: 'asc' },
  });

  // Calculate total searches
  const totalSearches = await prisma.search.count({
    where: {
      ...(userId && { userId }),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Count unique candidates
  const uniqueCandidates = new Set(
    events.filter((e) => e.candidateId).map((e) => e.candidateId)
  );

  // Calculate stage conversions
  const stageConversions = await calculateStageConversions(whereClause);

  // Calculate time metrics
  const timeMetrics = await calculateTimeMetrics(whereClause);

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    totalSearches,
    totalCandidates: uniqueCandidates.size,
    stageConversions,
    timeMetrics,
  };
}

/**
 * Calculate conversion rates for each funnel stage
 */
async function calculateStageConversions(
  whereClause: any
): Promise<StageConversionMetrics[]> {
  const metrics: StageConversionMetrics[] = [];

  for (let i = 0; i < FUNNEL_STAGES.length; i++) {
    const currentStage = FUNNEL_STAGES[i];
    const nextStage = FUNNEL_STAGES[i + 1];

    // Count candidates who entered this stage
    const entered = await prisma.candidateStatus.count({
      where: {
        ...(whereClause.userId && { userId: whereClause.userId }),
        createdAt: whereClause.timestamp,
        currentStage: {
          in: FUNNEL_STAGES.slice(i),
        },
      },
    });

    // Count candidates who converted to next stage
    const converted = nextStage
      ? await prisma.candidateStatus.count({
          where: {
            ...(whereClause.userId && { userId: whereClause.userId }),
            createdAt: whereClause.timestamp,
            currentStage: {
              in: FUNNEL_STAGES.slice(i + 1),
            },
          },
        })
      : await prisma.candidateStatus.count({
          where: {
            ...(whereClause.userId && { userId: whereClause.userId }),
            createdAt: whereClause.timestamp,
            finalOutcome: 'hired',
          },
        });

    const conversionRate = entered > 0 ? (converted / entered) * 100 : 0;
    const dropoffRate = 100 - conversionRate;

    // Calculate average time to next stage
    const avgTime = await calculateAvgTimeToNextStage(
      currentStage,
      nextStage,
      whereClause
    );

    metrics.push({
      stage: currentStage,
      entered,
      converted,
      conversionRate: Number(conversionRate.toFixed(2)),
      avgTimeToNextStageMs: avgTime,
      dropoffRate: Number(dropoffRate.toFixed(2)),
    });
  }

  return metrics;
}

/**
 * Calculate average time from one stage to the next
 */
async function calculateAvgTimeToNextStage(
  currentStage: FunnelStage,
  nextStage: FunnelStage | undefined,
  whereClause: any
): Promise<number> {
  if (!nextStage) return 0;

  // Map stages to timestamp fields
  const stageTimestampMap: Record<FunnelStage, string> = {
    search: 'discoveredAt',
    shortlist: 'shortlistedAt',
    outreach: 'outreachSentAt',
    reply: 'repliedAt',
    interview: 'interviewedAt',
    offer: 'offerExtendedAt',
  };

  const currentField = stageTimestampMap[currentStage];
  const nextField = stageTimestampMap[nextStage];

  // Get candidates who progressed between these stages
  const candidates = await prisma.candidateStatus.findMany({
    where: {
      ...(whereClause.userId && { userId: whereClause.userId }),
      createdAt: whereClause.timestamp,
      [currentField]: { not: null },
      [nextField]: { not: null },
    },
    select: {
      [currentField]: true,
      [nextField]: true,
    },
  });

  if (candidates.length === 0) return 0;

  // Calculate time differences
  const timeDiffs = candidates.map((c: any) => {
    const start = new Date(c[currentField]).getTime();
    const end = new Date(c[nextField]).getTime();
    return end - start;
  });

  // Return average
  const sum = timeDiffs.reduce((a, b) => a + b, 0);
  return Math.round(sum / timeDiffs.length);
}

/**
 * Calculate time metrics across the entire funnel
 */
async function calculateTimeMetrics(whereClause: any): Promise<TimeMetrics> {
  const avgSearchToShortlist = await calculateAvgTimeToNextStage(
    'search',
    'shortlist',
    whereClause
  );
  const avgShortlistToOutreach = await calculateAvgTimeToNextStage(
    'shortlist',
    'outreach',
    whereClause
  );
  const avgOutreachToReply = await calculateAvgTimeToNextStage(
    'outreach',
    'reply',
    whereClause
  );
  const avgReplyToInterview = await calculateAvgTimeToNextStage(
    'reply',
    'interview',
    whereClause
  );
  const avgInterviewToOffer = await calculateAvgTimeToNextStage(
    'interview',
    'offer',
    whereClause
  );

  const totalAvg =
    avgSearchToShortlist +
    avgShortlistToOutreach +
    avgOutreachToReply +
    avgReplyToInterview +
    avgInterviewToOffer;

  return {
    avgSearchToShortlistMs: avgSearchToShortlist,
    avgShortlistToOutreachMs: avgShortlistToOutreach,
    avgOutreachToReplyMs: avgOutreachToReply,
    avgReplyToInterviewMs: avgReplyToInterview,
    avgInterviewToOfferMs: avgInterviewToOffer,
    totalAvgTimeToOfferMs: totalAvg,
  };
}

/**
 * Export data for model tuning
 * Compares predicted outcomes (match score) with actual outcomes (hired/rejected)
 */
export async function exportModelTuningData({
  userId,
  startDate,
  endDate,
}: GetFunnelAnalyticsOptions): Promise<ModelTuningData[]> {
  const candidates = await prisma.candidateStatus.findMany({
    where: {
      ...(userId && { userId }),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      finalOutcome: {
        in: ['hired', 'rejected'],
      },
    },
  });

  return candidates.map((c) => {
    // Determine predicted outcome based on match score
    let predictedOutcome: 'hire' | 'reject' | 'unknown' = 'unknown';
    if (c.initialMatchScore !== null) {
      predictedOutcome = c.initialMatchScore >= 70 ? 'hire' : 'reject';
    }

    return {
      candidateId: c.candidateId,
      searchId: c.searchId,
      matchScore: c.initialMatchScore || 0,
      predictedOutcome,
      actualOutcome: c.finalOutcome === 'hired' ? 'hired' : 'rejected',
      features: {
        skillsMatch: c.initialMatchScore || 0,
        experienceMatch: 0, // TODO: Extract from metadata
        locationMatch: true, // TODO: Extract from metadata
      },
      outcomeTimestamp: c.finalizedAt || c.updatedAt,
    };
  });
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(
  userId?: string,
  limit: number = 20
): Promise<any[]> {
  const events = await prisma.funnelEvent.findMany({
    where: userId ? { userId } : {},
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  return events.map((e) => ({
    id: e.id,
    type: e.type,
    stage: e.stage,
    candidateId: e.candidateId,
    timestamp: e.timestamp,
    metadata: e.metadata,
  }));
}

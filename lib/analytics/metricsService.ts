/**
 * Analytics Metrics Service
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * TODO: Re-enable when FunnelEvent and CandidateStatus models are added to Prisma schema
 * Currently returns empty/placeholder data to avoid build errors
 */

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
 * TODO: Implement when Prisma models are available
 */
export async function getFunnelAnalytics({
  userId,
  startDate,
  endDate,
}: GetFunnelAnalyticsOptions): Promise<FunnelAnalytics> {
  console.log('[Analytics] getFunnelAnalytics called (placeholder):', { userId, startDate, endDate });
  
  // Return empty analytics - models not yet in schema
  const emptyConversions: StageConversionMetrics[] = FUNNEL_STAGES.map((stage) => ({
    stage,
    entered: 0,
    converted: 0,
    conversionRate: 0,
    avgTimeToNextStageMs: 0,
    dropoffRate: 0,
  }));

  return {
    period: { start: startDate, end: endDate },
    totalSearches: 0,
    totalCandidates: 0,
    stageConversions: emptyConversions,
    timeMetrics: {
      avgSearchToShortlistMs: 0,
      avgShortlistToOutreachMs: 0,
      avgOutreachToReplyMs: 0,
      avgReplyToInterviewMs: 0,
      avgInterviewToOfferMs: 0,
      totalAvgTimeToOfferMs: 0,
    },
  };
}

interface GetStageConversionOptions {
  userId?: string;
  stage: FunnelStage;
  startDate: Date;
  endDate: Date;
}

/**
 * Get conversion metrics for a specific funnel stage
 * TODO: Implement when Prisma models are available
 */
export async function getStageConversion({
  userId,
  stage,
  startDate,
  endDate,
}: GetStageConversionOptions): Promise<StageConversionMetrics> {
  console.log('[Analytics] getStageConversion called (placeholder):', { userId, stage, startDate, endDate });
  
  return {
    stage,
    entered: 0,
    converted: 0,
    conversionRate: 0,
    avgTimeToNextStageMs: 0,
    dropoffRate: 0,
  };
}

interface GetTimeMetricsOptions {
  userId?: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Calculate time-based metrics across the funnel
 * TODO: Implement when Prisma models are available
 */
export async function getTimeMetrics({
  userId,
  startDate,
  endDate,
}: GetTimeMetricsOptions): Promise<TimeMetrics> {
  console.log('[Analytics] getTimeMetrics called (placeholder):', { userId, startDate, endDate });
  
  return {
    avgSearchToShortlistMs: 0,
    avgShortlistToOutreachMs: 0,
    avgOutreachToReplyMs: 0,
    avgReplyToInterviewMs: 0,
    avgInterviewToOfferMs: 0,
    totalAvgTimeToOfferMs: 0,
  };
}

interface ExportModelTuningDataOptions {
  userId?: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Export data for model tuning in a structured format
 * TODO: Implement when Prisma models are available
 */
export async function exportModelTuningData({
  userId,
  startDate,
  endDate,
}: ExportModelTuningDataOptions): Promise<ModelTuningData[]> {
  console.log('[Analytics] exportModelTuningData called (placeholder):', { userId, startDate, endDate });
  
  return [];
}

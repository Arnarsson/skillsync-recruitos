/**
 * Analytics & Instrumentation Types for RecruitOS
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * Tracks full recruitment funnel:
 * search → shortlist → outreach → reply → interview → offer
 */

// Event types for each stage of the funnel
export type FunnelEventType =
  | 'search_started'
  | 'search_completed'
  | 'candidate_viewed'
  | 'candidate_shortlisted'
  | 'deep_profile_viewed'
  | 'outreach_generated'
  | 'outreach_sent'
  | 'candidate_replied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_extended'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'candidate_rejected';

// Funnel stages for conversion tracking
export type FunnelStage =
  | 'search'
  | 'shortlist'
  | 'outreach'
  | 'reply'
  | 'interview'
  | 'offer';

// Base event interface
export interface FunnelEvent {
  id: string;
  type: FunnelEventType;
  stage: FunnelStage;
  userId: string;
  searchId?: string;
  candidateId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Event metadata by type
export interface SearchStartedMetadata {
  roleTitle: string;
  skillsCount: number;
  hardRequirements?: {
    location?: string[];
    experience?: string;
    languages?: string[];
  };
}

export interface SearchCompletedMetadata {
  resultsCount: number;
  durationMs: number;
  filters: {
    mustHaveSkills: string[];
    niceToHaveSkills: string[];
    bonusSkills: string[];
  };
}

export interface CandidateViewedMetadata {
  matchScore: number;
  viewDurationMs?: number;
  source: 'list' | 'deep_profile' | 'side_panel';
}

export interface OutreachGeneratedMetadata {
  messageLength: number;
  templateUsed?: string;
  personalizationScore?: number;
}

export interface OutreachSentMetadata {
  channel: 'email' | 'linkedin' | 'other';
  recipientEmail?: string;
  sentAt: Date;
}

export interface CandidateRepliedMetadata {
  replyChannel: 'email' | 'linkedin' | 'phone' | 'other';
  timeSinceOutreach Ms: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface InterviewScheduledMetadata {
  interviewType: 'phone' | 'video' | 'onsite' | 'technical';
  scheduledFor: Date;
  timeToScheduleMs: number;
}

export interface OfferExtendedMetadata {
  offerAmount?: number;
  currency?: string;
  timeToOfferMs: number;
}

// Conversion metrics
export interface StageConversionMetrics {
  stage: FunnelStage;
  entered: number;
  converted: number;
  conversionRate: number;
  avgTimeToNextStageMs: number;
  dropoffRate: number;
}

// Time metrics
export interface TimeMetrics {
  avgSearchToShortlistMs: number;
  avgShortlistToOutreachMs: number;
  avgOutreachToReplyMs: number;
  avgReplyToInterviewMs: number;
  avgInterviewToOfferMs: number;
  totalAvgTimeToOfferMs: number;
}

// Funnel analytics dashboard data
export interface FunnelAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalSearches: number;
  totalCandidates: number;
  stageConversions: StageConversionMetrics[];
  timeMetrics: TimeMetrics;
  modelPerformance?: {
    avgMatchScoreAccuracy?: number;
    falsePositiveRate?: number;
    falseNegativeRate?: number;
  };
}

// Model tuning data export
export interface ModelTuningData {
  candidateId: string;
  searchId: string;
  matchScore: number;
  predictedOutcome: 'hire' | 'reject' | 'unknown';
  actualOutcome: 'hired' | 'rejected' | 'pending';
  features: {
    skillsMatch: number;
    experienceMatch: number;
    locationMatch: boolean;
    [key: string]: any;
  };
  outcome Timestamp: Date;
}

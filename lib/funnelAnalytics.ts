/**
 * Funnel Analytics
 * 
 * Track stage conversions in the recruiting pipeline.
 * Uses REAL data from user actions - NO MOCK DATA.
 */

import { PipelineStage } from "@/components/pipeline/PipelineKanban";

export interface StageMetrics {
  stage: PipelineStage;
  label: string;
  count: number;
  percentage: number;  // Percentage of total
  conversionFromPrevious: number | null;  // null for first stage
  avgTimeInStage: number | null;  // Days (if tracking enabled)
  color: string;
}

export interface FunnelAnalytics {
  totalCandidates: number;
  stages: StageMetrics[];
  overallConversion: number;  // Sourced → Offer %
  bottleneck: PipelineStage | null;  // Stage with lowest conversion
  averageFunnelTime: number | null;  // Days from sourced to offer
  lastUpdated: string;
}

// Stage order for funnel
const STAGE_ORDER: PipelineStage[] = ['sourced', 'contacted', 'replied', 'interview', 'offer'];

const STAGE_LABELS: Record<PipelineStage, string> = {
  sourced: 'Sourced',
  contacted: 'Contacted',
  replied: 'Replied',
  interview: 'Interview',
  offer: 'Offer',
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  sourced: '#3b82f6',    // blue
  contacted: '#f59e0b',  // amber
  replied: '#a855f7',    // purple
  interview: '#06b6d4',  // cyan
  offer: '#22c55e',      // green
};

/**
 * Calculate funnel analytics from stage data
 * Uses REAL candidate stage assignments
 */
export function calculateFunnelAnalytics(
  candidateStages: Record<string, PipelineStage>,
  stageTimestamps?: Record<string, Record<PipelineStage, string>>  // Optional: stage entry timestamps
): FunnelAnalytics {
  const totalCandidates = Object.keys(candidateStages).length;
  
  if (totalCandidates === 0) {
    return {
      totalCandidates: 0,
      stages: STAGE_ORDER.map(stage => ({
        stage,
        label: STAGE_LABELS[stage],
        count: 0,
        percentage: 0,
        conversionFromPrevious: null,
        avgTimeInStage: null,
        color: STAGE_COLORS[stage],
      })),
      overallConversion: 0,
      bottleneck: null,
      averageFunnelTime: null,
      lastUpdated: new Date().toISOString(),
    };
  }
  
  // Count candidates at or past each stage
  // (If someone is at "interview", they've passed through sourced, contacted, replied)
  const stageIndices = Object.fromEntries(
    STAGE_ORDER.map((s, i) => [s, i])
  ) as Record<PipelineStage, number>;
  
  const stageCountsAtOrPast: Record<PipelineStage, number> = {
    sourced: 0,
    contacted: 0,
    replied: 0,
    interview: 0,
    offer: 0,
  };
  
  // Count how many candidates have reached each stage
  for (const candidateStage of Object.values(candidateStages)) {
    const candidateIndex = stageIndices[candidateStage];
    for (const stage of STAGE_ORDER) {
      if (stageIndices[stage] <= candidateIndex) {
        stageCountsAtOrPast[stage]++;
      }
    }
  }
  
  // Build stage metrics
  const stages: StageMetrics[] = [];
  let lowestConversion = 100;
  let bottleneck: PipelineStage | null = null;
  
  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const stage = STAGE_ORDER[i];
    const count = stageCountsAtOrPast[stage];
    const percentage = totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0;
    
    let conversionFromPrevious: number | null = null;
    if (i > 0) {
      const prevCount = stageCountsAtOrPast[STAGE_ORDER[i - 1]];
      conversionFromPrevious = prevCount > 0 
        ? Math.round((count / prevCount) * 100) 
        : 0;
        
      // Track bottleneck (lowest conversion that's not 0)
      if (conversionFromPrevious < lowestConversion && conversionFromPrevious > 0) {
        lowestConversion = conversionFromPrevious;
        bottleneck = stage;
      }
    }
    
    stages.push({
      stage,
      label: STAGE_LABELS[stage],
      count,
      percentage,
      conversionFromPrevious,
      avgTimeInStage: null,  // Would need timestamps
      color: STAGE_COLORS[stage],
    });
  }
  
  // Calculate overall conversion (sourced → offer)
  const overallConversion = stageCountsAtOrPast.sourced > 0
    ? Math.round((stageCountsAtOrPast.offer / stageCountsAtOrPast.sourced) * 100)
    : 0;
  
  return {
    totalCandidates,
    stages,
    overallConversion,
    bottleneck,
    averageFunnelTime: null,  // Would need timestamps
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get stage transition history for a candidate
 */
export interface StageTransition {
  from: PipelineStage;
  to: PipelineStage;
  timestamp: string;
  durationDays: number;
}

/**
 * Store stage change for analytics (call this when stage changes)
 */
export function recordStageChange(
  candidateId: string,
  newStage: PipelineStage
): void {
  const storageKey = `apex_stage_history_${candidateId}`;
  const now = new Date().toISOString();
  
  try {
    const existing = localStorage.getItem(storageKey);
    const history: Array<{ stage: PipelineStage; timestamp: string }> = existing 
      ? JSON.parse(existing) 
      : [];
    
    history.push({ stage: newStage, timestamp: now });
    localStorage.setItem(storageKey, JSON.stringify(history));
    
    // Also update global analytics cache
    updateAnalyticsCache();
  } catch (err) {
    console.error('Failed to record stage change:', err);
  }
}

/**
 * Update the analytics cache
 */
function updateAnalyticsCache(): void {
  const stagesStr = localStorage.getItem('apex_candidate_stages');
  if (!stagesStr) return;
  
  try {
    const stages = JSON.parse(stagesStr);
    const analytics = calculateFunnelAnalytics(stages);
    localStorage.setItem('apex_funnel_analytics', JSON.stringify(analytics));
  } catch (err) {
    console.error('Failed to update analytics cache:', err);
  }
}

/**
 * Get cached funnel analytics
 */
export function getCachedFunnelAnalytics(): FunnelAnalytics | null {
  try {
    const cached = localStorage.getItem('apex_funnel_analytics');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

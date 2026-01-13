/**
 * Advanced Enrichment Service - Orchestration Layer
 *
 * Coordinates all advanced enrichment services to build
 * comprehensive, 10x better candidate profiles:
 *
 * 1. Network Analysis (GraphRAG-style connections)
 * 2. Behavioral Signals (real-time activity tracking)
 * 3. Cited Evidence (AI extraction with sources)
 *
 * This service is the main entry point for advanced profile enrichment.
 */

import { buildNetworkGraph, quickNetworkScan } from './networkAnalysisService';
import { collectBehavioralSignals, quickBehavioralCheck } from './behavioralSignalsService';
import { buildCitedProfile } from './citedEvidenceService';
import type {
  AdvancedCandidateProfile,
  NetworkGraph,
  BehavioralSignals,
  CitedProfile,
  EvidenceSource,
  Candidate,
} from '../types';

export interface AdvancedEnrichmentInput {
  candidateId: string;
  candidateName: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeText?: string;
  evidenceSources?: EvidenceSource[];
  teamLinkedInUrls?: string[];
  previousProfileData?: {
    title?: string;
    company?: string;
    location?: string;
  };
}

export interface AdvancedEnrichmentOptions {
  includeNetworkAnalysis?: boolean;
  includeBehavioralSignals?: boolean;
  includeCitedEvidence?: boolean;
  quickMode?: boolean; // Faster but less comprehensive
}

const DEFAULT_OPTIONS: AdvancedEnrichmentOptions = {
  includeNetworkAnalysis: true,
  includeBehavioralSignals: true,
  includeCitedEvidence: true,
  quickMode: false,
};

/**
 * Calculate overall confidence score from all components
 */
function calculateOverallConfidence(
  network: NetworkGraph | undefined,
  behavioral: BehavioralSignals | undefined,
  cited: CitedProfile | undefined
): number {
  const scores: number[] = [];

  if (network) {
    // Network confidence based on data richness
    let networkScore = 50; // Base
    if (network.warmIntroPaths.length > 0) networkScore += 20;
    if (network.mutualConnections.length > 0) networkScore += 15;
    if (network.sharedEmployers.length > 0) networkScore += 10;
    if (network.industryInfluence.thoughtLeadershipScore > 50) networkScore += 5;
    scores.push(Math.min(networkScore, 100));
  }

  if (behavioral) {
    // Behavioral confidence based on signal quality
    let behavioralScore = 50; // Base
    if (behavioral.github) behavioralScore += 20;
    if (behavioral.speakingEngagements.length > 0) behavioralScore += 15;
    if (behavioral.contentActivity.length > 0) behavioralScore += 10;
    if (behavioral.approachReadiness !== 'neutral') behavioralScore += 5;
    scores.push(Math.min(behavioralScore, 100));
  }

  if (cited) {
    // Use the data quality score directly
    scores.push(cited.dataQualityScore);
  }

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate data completeness percentages
 */
function calculateDataCompleteness(
  network: NetworkGraph | undefined,
  behavioral: BehavioralSignals | undefined,
  cited: CitedProfile | undefined
): { network: number; behavioral: number; cited: number } {
  // Network completeness
  let networkComplete = 0;
  if (network) {
    if (network.nodes.length > 0) networkComplete += 20;
    if (network.edges.length > 0) networkComplete += 20;
    if (network.warmIntroPaths.length > 0) networkComplete += 20;
    if (network.sharedEmployers.length > 0) networkComplete += 20;
    if (network.industryInfluence.thoughtLeadershipScore > 0) networkComplete += 20;
  }

  // Behavioral completeness
  let behavioralComplete = 0;
  if (behavioral) {
    if (behavioral.github) behavioralComplete += 25;
    if (behavioral.speakingEngagements.length > 0) behavioralComplete += 25;
    if (behavioral.jobChangeSignals.length > 0) behavioralComplete += 25;
    if (behavioral.contentActivity.length > 0) behavioralComplete += 25;
  }

  // Cited completeness
  let citedComplete = 0;
  if (cited) {
    if (cited.name.verificationStatus === 'verified') citedComplete += 15;
    if (cited.headline) citedComplete += 10;
    if (cited.location) citedComplete += 10;
    if (cited.experiences.length > 0) citedComplete += 25;
    if (cited.skills.length > 0) citedComplete += 25;
    if (cited.education.length > 0) citedComplete += 15;
  }

  return {
    network: Math.min(networkComplete, 100),
    behavioral: Math.min(behavioralComplete, 100),
    cited: Math.min(citedComplete, 100),
  };
}

/**
 * Calculate when profile should be refreshed
 */
function calculateNextRefresh(
  behavioral: BehavioralSignals | undefined
): string {
  // If candidate is actively looking, refresh more frequently
  if (behavioral?.approachReadiness === 'ready') {
    const date = new Date();
    date.setDate(date.getDate() + 3); // 3 days
    return date.toISOString();
  }

  // If there are recent job signals, refresh soon
  if (behavioral?.jobChangeSignals.some(s => s.significance === 'high')) {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 1 week
    return date.toISOString();
  }

  // Standard refresh: 30 days
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

/**
 * Main function: Build a comprehensive advanced profile
 */
export async function buildAdvancedProfile(
  input: AdvancedEnrichmentInput,
  options: AdvancedEnrichmentOptions = DEFAULT_OPTIONS
): Promise<AdvancedCandidateProfile> {
  const {
    candidateId,
    candidateName,
    linkedinUrl,
    githubUrl,
    evidenceSources = [],
    teamLinkedInUrls = [],
    previousProfileData,
  } = input;

  const {
    includeNetworkAnalysis = true,
    includeBehavioralSignals = true,
    includeCitedEvidence = true,
    quickMode = false,
  } = options;

  if (process.env.NODE_ENV === 'development') {
    console.log('[AdvancedEnrichment] Starting advanced enrichment for:', candidateName);
    console.log('[AdvancedEnrichment] Options:', options);
    console.log('[AdvancedEnrichment] Evidence sources:', evidenceSources.length);
  }

  // Collect data in parallel where possible
  const promises: Promise<unknown>[] = [];

  let networkGraph: NetworkGraph | undefined;
  let behavioralSignals: BehavioralSignals | undefined;
  let citedProfile: CitedProfile | undefined;

  // Network Analysis
  if (includeNetworkAnalysis && linkedinUrl) {
    const networkPromise = quickMode
      ? quickNetworkScan(candidateId, linkedinUrl)
      : buildNetworkGraph(candidateId, linkedinUrl, teamLinkedInUrls);

    promises.push(
      networkPromise.then((result) => {
        if (result) {
          networkGraph = result as NetworkGraph;
        }
      }).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AdvancedEnrichment] Network analysis failed:', error);
        }
      })
    );
  }

  // Behavioral Signals
  if (includeBehavioralSignals) {
    const behavioralPromise = quickMode
      ? quickBehavioralCheck(candidateId, githubUrl)
      : collectBehavioralSignals(
          candidateId,
          candidateName,
          linkedinUrl,
          githubUrl,
          previousProfileData
        );

    promises.push(
      behavioralPromise.then((result) => {
        if (result) {
          behavioralSignals = result as BehavioralSignals;
        }
      }).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[AdvancedEnrichment] Behavioral signals failed:', error);
        }
      })
    );
  }

  // Cited Evidence
  if (includeCitedEvidence && evidenceSources.length > 0) {
    promises.push(
      buildCitedProfile(candidateId, candidateName, evidenceSources)
        .then((result) => {
          citedProfile = result;
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('[AdvancedEnrichment] Cited evidence failed:', error);
          }
        })
    );
  }

  // Wait for all promises to complete
  await Promise.all(promises);

  // Build the composite profile
  const advancedProfile: AdvancedCandidateProfile = {
    candidateId,
    networkGraph,
    behavioralSignals,
    citedProfile,
    overallConfidence: calculateOverallConfidence(
      networkGraph,
      behavioralSignals,
      citedProfile
    ),
    dataCompleteness: calculateDataCompleteness(
      networkGraph,
      behavioralSignals,
      citedProfile
    ),
    lastUpdated: new Date().toISOString(),
    nextRefreshRecommended: calculateNextRefresh(behavioralSignals),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[AdvancedEnrichment] ✅ Advanced profile complete:', {
      hasNetwork: !!networkGraph,
      hasBehavioral: !!behavioralSignals,
      hasCited: !!citedProfile,
      overallConfidence: advancedProfile.overallConfidence,
      dataCompleteness: advancedProfile.dataCompleteness,
    });
  }

  return advancedProfile;
}

/**
 * Quick enrichment - fast version for initial candidate screening
 */
export async function quickEnrichment(
  input: AdvancedEnrichmentInput
): Promise<AdvancedCandidateProfile> {
  return buildAdvancedProfile(input, {
    includeNetworkAnalysis: true,
    includeBehavioralSignals: true,
    includeCitedEvidence: false, // Skip heavy AI extraction
    quickMode: true,
  });
}

/**
 * Deep enrichment - comprehensive analysis for shortlisted candidates
 */
export async function deepEnrichment(
  input: AdvancedEnrichmentInput
): Promise<AdvancedCandidateProfile> {
  return buildAdvancedProfile(input, {
    includeNetworkAnalysis: true,
    includeBehavioralSignals: true,
    includeCitedEvidence: true,
    quickMode: false,
  });
}

/**
 * Merge advanced profile into existing candidate
 */
export function mergeAdvancedProfile(
  candidate: Candidate,
  advancedProfile: AdvancedCandidateProfile
): Candidate {
  // Create enhanced candidate with advanced data
  const enhanced: Candidate = {
    ...candidate,
  };

  // Enhance persona with behavioral signals
  if (advancedProfile.behavioralSignals && candidate.persona) {
    const github = advancedProfile.behavioralSignals.github;

    // Add GitHub insights to skill profile
    if (github && candidate.persona.skillProfile) {
      const githubSkills = github.topLanguages.map((l) => l.language);
      candidate.persona.skillProfile.coreSkills = [
        ...candidate.persona.skillProfile.coreSkills,
        ...githubSkills
          .filter(
            (s) =>
              !candidate.persona?.skillProfile?.coreSkills.some(
                (cs) => cs.name.toLowerCase() === s.toLowerCase()
              )
          )
          .map((s) => ({
            name: s,
            proficiency: 'advanced' as const,
            yearsActive: 2,
          })),
      ];
    }

    // Add activity trend to career trajectory
    if (github && candidate.persona.careerTrajectory) {
      // GitHub activity can indicate engagement level
      if (github.activityTrend === 'increasing') {
        candidate.persona.careerTrajectory.growthVelocity = 'rapid';
      }
    }
  }

  // Enhance network dossier with network graph
  if (advancedProfile.networkGraph && !candidate.networkDossier) {
    const network = advancedProfile.networkGraph;

    enhanced.networkDossier = {
      strategyContext: {
        industryPosition: `${network.industryInfluence.thoughtLeadershipScore > 70 ? 'Industry thought leader' : 'Active professional'}`,
        companyDynamics: '',
        marketTiming: '',
        competitiveIntel: '',
      },
      networkIntelligence: {
        inferredConnections: network.mutualConnections.map((c) => c.name),
        introductionPaths: network.warmIntroPaths.map((p) => p.suggestedApproach),
        professionalCommunities: network.industryInfluence.communityEngagement,
        thoughtLeadership: network.industryInfluence.speakingEngagements?.join(', ') || '',
      },
      culturalFit: {
        currentCultureProfile: '',
        targetCultureMatch: '',
        adaptationChallenges: [],
        motivationalDrivers: [],
      },
      engagementPlaybook: {
        primaryApproach: advancedProfile.behavioralSignals?.bestTimeToReach || '',
        conversationStarters: network.warmIntroPaths.flatMap((p) => p.commonGround),
        timingConsiderations: advancedProfile.behavioralSignals?.approachReadiness === 'ready'
          ? 'Candidate appears open to opportunities - reach out soon'
          : 'Standard timing recommended',
        objectionHandling: [],
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // Update connection path with warm intros
  if (advancedProfile.networkGraph?.warmIntroPaths.length) {
    const bestPath = advancedProfile.networkGraph.warmIntroPaths[0];
    enhanced.connectionPath = bestPath.suggestedApproach;
    enhanced.sharedContext = bestPath.commonGround;
  }

  return enhanced;
}

/**
 * Get approach readiness summary for UI display
 */
export function getApproachReadinessSummary(
  advancedProfile: AdvancedCandidateProfile
): {
  status: 'ready' | 'neutral' | 'not_ready';
  headline: string;
  details: string[];
  bestTimeToReach: string;
} {
  const behavioral = advancedProfile.behavioralSignals;

  if (!behavioral) {
    return {
      status: 'neutral',
      headline: 'Insufficient data for readiness assessment',
      details: ['No behavioral signals collected'],
      bestTimeToReach: 'Standard timing recommended',
    };
  }

  const details: string[] = [];

  // Add relevant signals
  if (behavioral.openToWorkSignal) {
    details.push('✅ "Open to Work" signal detected on LinkedIn');
  }

  if (behavioral.github?.activityTrend === 'increasing') {
    details.push('📈 GitHub activity increasing - technically engaged');
  }

  if (behavioral.speakingEngagements.length > 0) {
    details.push(`🎤 ${behavioral.speakingEngagements.length} speaking engagement(s) found`);
  }

  if (behavioral.jobChangeSignals.length > 0) {
    const highSignals = behavioral.jobChangeSignals.filter(
      (s) => s.significance === 'high'
    );
    if (highSignals.length > 0) {
      details.push(`⚠️ ${highSignals.length} significant job signal(s) detected`);
    }
  }

  if (behavioral.contentActivity.length > 3) {
    details.push('✍️ Active content creator - thought leader potential');
  }

  const headlines: Record<string, string> = {
    ready: 'High approach readiness - consider reaching out soon',
    neutral: 'Moderate approach readiness - standard outreach recommended',
    not_ready: 'Low approach readiness - consider timing carefully',
  };

  return {
    status: behavioral.approachReadiness,
    headline: headlines[behavioral.approachReadiness],
    details: details.length > 0 ? details : ['No specific signals detected'],
    bestTimeToReach: behavioral.bestTimeToReach,
  };
}

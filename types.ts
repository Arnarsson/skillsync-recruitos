
export enum FunnelStage {
  INTAKE = 1,
  SHORTLIST = 2,
  DEEP_PROFILE = 3,
  OUTREACH = 4
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface Evidence {
  text: string;
  source: string;
  confidence: ConfidenceLevel;
}

// ===== ENRICHMENT PIPELINE TYPES =====

export interface EvidenceSource {
  url: string;
  title?: string;
  snippet?: string;
  rawText: string;
}

export interface EnrichmentInput {
  fullName: string;
  linkedinUrl?: string;
  resumeText?: string;
  jobContext: string;
}

export interface CandidatePersona {
  name: string;
  headline: string | null;
  currentRole: {
    title: string | null;
    company: string | null;
    startYear: number | null;
    location: string | null;
  } | null;
  pastRoles: Array<{
    title: string;
    company: string;
    startYear: number | null;
    endYear: number | null;
  }>;
  skills: string[];
  domains: string[];
  seniority:
    | 'junior'
    | 'mid'
    | 'senior'
    | 'lead'
    | 'principal'
    | 'director'
    | 'vp'
    | 'cto'
    | 'founder'
    | null;
  location: string | null;
  evidence: Array<{
    sourceUrl: string;
    snippet: string;
  }>;
}

export interface AlignmentScore {
  score: number; // 0-100
  confidence: number; // 0-1
  factors: Record<string, number>; // e.g. { skills: 0.8, experience: 0.7, domain: 0.9 }
}

export type EnrichmentOutcome = 'auto_full' | 'auto_partial' | 'manual_only';

export interface EnrichmentMetadata {
  outcome: EnrichmentOutcome;
  evidenceSourcesUsed: number;
  creditCharge: number; // Actual credits charged (0 for manual_only)
  wasRefunded: boolean; // True if credits were refunded due to manual_required
  qualityScore: number; // 0-100, based on data completeness
}

export type EnrichmentResult =
  | {
      status: 'ok';
      persona: CandidatePersona;
      alignment: AlignmentScore;
      rawEvidence: EvidenceSource[];
      metadata: EnrichmentMetadata;
    }
  | {
      status: 'manual_required';
      reason: 'no_public_data' | 'insufficient_public_data';
      message: string;
      metadata: EnrichmentMetadata;
    };

export interface WorkstyleIndicator {
  category: string; // 'TRAJECTORY' | 'SKILLS' | 'COMMUNICATION' | 'COLLABORATION'
  label: string;
  observation: string; // "Structured & Technical"
  evidence: Evidence;
}

export interface InterviewQuestion {
  topic: string;
  question: string;
  reason: string;
}

export interface ScoreComponent {
  value: number;
  max: number;
  percentage: number;
  reasoning?: string; // NEW: Explanation of why this score was given
}

export interface ScoreBreakdown {
  skills: ScoreComponent;
  experience: ScoreComponent;
  industry: ScoreComponent;
  seniority: ScoreComponent;
  location: ScoreComponent;
}

// NEW: Enhanced persona sub-interfaces (Sprint 2)
export interface CareerTrajectory {
  growthVelocity: 'rapid' | 'steady' | 'slow';
  promotionFrequency: 'high' | 'moderate' | 'low';
  roleProgression: 'vertical' | 'lateral' | 'mixed';
  industryPivots: number;
  leadershipGrowth: 'ascending' | 'stable' | 'declining';
  averageTenure: string; // e.g., "2.5 years"
  tenurePattern: 'stable' | 'job-hopper' | 'long-term';
}

export interface CoreSkill {
  name: string;
  proficiency: 'expert' | 'advanced' | 'intermediate';
  yearsActive: number;
}

export interface SkillProfile {
  coreSkills: CoreSkill[];
  emergingSkills: string[]; // Recently added skills
  deprecatedSkills: string[]; // Outdated/declining skills
  skillGaps: string[]; // Missing for target role
  adjacentSkills: string[]; // Transferable skills
  depthVsBreadth: 'specialist' | 'generalist' | 't-shaped';
}

export interface RiskAssessment {
  attritionRisk: 'low' | 'moderate' | 'high';
  flightRiskFactors: string[]; // Overqualification, boredom signals
  skillObsolescenceRisk: 'low' | 'moderate' | 'high';
  geographicBarriers: string[];
  unexplainedGaps: boolean;
  compensationRiskLevel: 'low' | 'moderate' | 'high';
}

export interface CompensationIntelligence {
  impliedSalaryBand: { min: number; max: number; currency: string };
  compensationGrowthRate: 'aggressive' | 'steady' | 'flat';
  equityIndicators: boolean;
  likelySalaryExpectation: number;
}

export interface Persona {
  archetype: string;
  psychometric: {
    communicationStyle: string;
    primaryMotivator: string;
    riskTolerance: string;
    leadershipPotential: string;
  };
  softSkills: string[];
  redFlags: string[]; // Kept for backward compatibility
  greenFlags: string[]; // Kept for backward compatibility
  reasoning: string;

  // NEW: Enhanced persona data (Sprint 2 - 23 additional fields)
  careerTrajectory?: CareerTrajectory;
  skillProfile?: SkillProfile;
  riskAssessment?: RiskAssessment; // Enhanced version of redFlags
  compensationIntelligence?: CompensationIntelligence;
}

export interface CompanyMatch {
  score: number;
  analysis: string;
  strengths: string[];
  potentialFriction: string[];
}

export interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  yearsExperience: number;
  avatar: string;

  // Step 2: Shortlist Data
  alignmentScore: number; // 0-100
  scoreBreakdown?: ScoreBreakdown;
  shortlistSummary: string;
  keyEvidence: string[];
  risks: string[];
  unlockedSteps: FunnelStage[];

  // NEW: Enhanced Score Analysis
  scoreConfidence?: 'high' | 'moderate' | 'low'; // Based on data completeness
  scoreDrivers?: string[]; // Top 2 factors boosting score (e.g., ["skills", "experience"])
  scoreDrags?: string[]; // Factors pulling score down (e.g., ["location"])

  // New Sourcing / Persona Data
  sourceUrl?: string;
  rawProfileText?: string; // Original profile text from LinkedIn/resume
  persona?: Persona;

  // Step 3: Evidence Report Data 
  avgTenure?: string;
  progressionPace?: string;

  // New Fields for Deep Analysis & Company Match
  deepAnalysis?: string;
  cultureFit?: string; // Kept for backward compatibility or simple view
  companyMatch?: CompanyMatch; // Detailed analysis

  trajectoryEvidence?: string;
  indicators?: WorkstyleIndicator[];
  interviewGuide?: InterviewQuestion[];
  networkDossier?: NetworkDossier; // Strategic intelligence for engagement

  // Step 4: Outreach Data
  connectionPath?: string;
  sharedContext?: string[];
  outreachHook?: string;
}

export interface JobContext {
  title: string;
  description: string;
  teamUrls: string[];
}

// Network Pathfinding Dossier Types (Phase 3)
export interface StrategyContext {
  industryPosition: string; // Where the candidate's company sits in the ecosystem
  companyDynamics: string; // Current challenges/opportunities at their company
  marketTiming: string; // Is now a good time to approach them?
  competitiveIntel: string; // What do we know about their competitors/alternatives?
}

export interface NetworkIntelligence {
  inferredConnections: string[]; // Likely mutual connections based on industry/location
  introductionPaths: string[]; // Ranked pathways to reach them
  professionalCommunities: string[]; // Communities/groups they likely engage with
  thoughtLeadership: string; // Conference circuits, publications, speaking
}

export interface CulturalFitAnalysis {
  currentCultureProfile: string; // What's the culture like at their current company?
  targetCultureMatch: string; // How does target company culture align?
  adaptationChallenges: string[]; // Potential friction points
  motivationalDrivers: string[]; // What would make them consider moving?
}

export interface ObjectionResponse {
  objection: string;
  response: string;
}

export interface EngagementPlaybook {
  primaryApproach: string; // Best angle: technical challenge, growth, mission, etc.
  conversationStarters: string[]; // 3-5 evidence-backed openers
  timingConsiderations: string; // When to reach out (tenure, recent changes, events)
  objectionHandling: ObjectionResponse[]; // Common objections + strategic responses
}

export interface NetworkDossier {
  strategyContext: StrategyContext;
  networkIntelligence: NetworkIntelligence;
  culturalFit: CulturalFitAnalysis;
  engagementPlaybook: EngagementPlaybook;
  generatedAt: string; // Timestamp for cache invalidation
}

// Spec 13: Audit Types
export enum AuditEventType {
  JOB_CREATED = 'job_created',
  SCORE_GENERATED = 'score_generated',
  PROFILE_ENRICHED = 'profile_enriched',
  OUTREACH_GENERATED = 'outreach_generated',
  CREDIT_PURCHASE = 'credit_purchase',
  SOURCING_RUN = 'sourcing_run'
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string;
  description: string;
  cost: number;
  user: string;
  metadata?: Record<string, unknown>; // JSON payload for EU AI Act compliance
}

// 1 Credit = ~0.54 EUR (Based on 5000 credits = 20,000 DKK)
export const CREDITS_TO_EUR = 0.54;

export const PRICING = {
  SHORTLIST: 93,      // ~€50
  DEEP_PROFILE: 278,  // ~€150
  OUTREACH: 463,      // ~€250
  REFRESH: 1,         // Spec 10.4
  SOURCING_SCAN: 25   // New sourcing cost
};

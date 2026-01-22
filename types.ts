
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
  linkedinUrl?: string; // Direct LinkedIn profile URL

  // Advanced Enrichment Profile (10x better data)
  advancedProfile?: AdvancedCandidateProfile;
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
  SOURCING_SCAN: 25,  // New sourcing cost
  NETWORK_ANALYSIS: 50, // Network graph generation
  BEHAVIORAL_SCAN: 35   // Activity signal collection
};

// ===== ADVANCED ENRICHMENT: NETWORK GRAPH (GraphRAG-style) =====

export interface NetworkNode {
  id: string;
  type: 'candidate' | 'person' | 'company' | 'school' | 'event';
  name: string;
  role?: string;
  relationship?: string; // e.g., "Former colleague", "Alumni", "Speaker"
  connectionStrength: 'strong' | 'moderate' | 'weak';
  profileUrl?: string;
}

export interface NetworkEdge {
  source: string; // Node ID
  target: string; // Node ID
  type: 'worked_with' | 'studied_with' | 'mutual_connection' | 'followed_by' | 'endorsed_by' | 'spoke_at';
  weight: number; // 0-1, strength of connection
  context?: string; // "Both at Google 2019-2021"
  verifiedSource?: string; // URL proving this connection
}

export interface WarmIntroPath {
  targetPerson: string;
  pathNodes: string[]; // Ordered list of people in the path
  pathLength: number;
  introQuality: 'hot' | 'warm' | 'cold';
  suggestedApproach: string;
  commonGround: string[]; // Shared employers, schools, events
}

export interface IndustryInfluence {
  followerCount?: number;
  endorsementCount?: number;
  thoughtLeadershipScore: number; // 0-100, based on publications/speaking
  communityEngagement: string[]; // Groups, forums, Slack communities
  publicationCount?: number;
  speakingEngagements?: string[];
}

export interface NetworkGraph {
  candidateNodeId: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  warmIntroPaths: WarmIntroPath[];
  mutualConnections: NetworkNode[]; // Direct mutual connections with hiring team
  sharedEmployers: Array<{ company: string; overlap: string; people: string[] }>;
  sharedSchools: Array<{ school: string; years: string; people: string[] }>;
  industryInfluence: IndustryInfluence;
  generatedAt: string;
  dataFreshness: 'live' | 'cached' | 'stale';
}

// ===== ADVANCED ENRICHMENT: BEHAVIORAL SIGNALS (Real-time Activity) =====

export interface GitHubActivity {
  username: string;
  profileUrl: string;
  totalContributions: number;
  contributionStreak: number; // Current streak in days
  topLanguages: Array<{ language: string; percentage: number }>;
  recentRepos: Array<{
    name: string;
    description: string;
    stars: number;
    lastCommit: string;
    isOriginal: boolean; // vs forked
  }>;
  openSourceContributions: Array<{
    repo: string;
    type: 'commit' | 'pr' | 'issue' | 'review';
    count: number;
  }>;
  activityTrend: 'increasing' | 'stable' | 'declining';
  lastActiveDate: string;
}

export interface ConferenceSpeaking {
  eventName: string;
  date: string;
  topic: string;
  role: 'speaker' | 'panelist' | 'workshop_leader' | 'keynote';
  eventUrl?: string;
  videoUrl?: string;
  attendeeCount?: number;
}

export interface JobChangeSignal {
  type: 'title_change' | 'company_change' | 'location_change' | 'profile_update';
  detectedAt: string;
  previousValue?: string;
  newValue?: string;
  significance: 'high' | 'medium' | 'low';
  interpretation: string; // "Recently promoted - may not be looking"
}

export interface ContentActivity {
  platform: 'linkedin' | 'medium' | 'twitter' | 'dev_to' | 'substack';
  type: 'post' | 'article' | 'comment' | 'share';
  date: string;
  topic?: string;
  engagement?: { likes: number; comments: number; shares: number };
  url?: string;
}

export interface BehavioralSignals {
  candidateId: string;
  github?: GitHubActivity;
  speakingEngagements: ConferenceSpeaking[];
  jobChangeSignals: JobChangeSignal[];
  contentActivity: ContentActivity[];
  openToWorkSignal?: boolean; // LinkedIn "Open to Work" detected
  recentProfileUpdates: number; // Count in last 30 days
  engagementRecency: 'active' | 'moderate' | 'dormant'; // Overall activity level
  bestTimeToReach: string; // Inferred from activity patterns
  approachReadiness: 'ready' | 'neutral' | 'not_ready'; // Overall assessment
  generatedAt: string;
}

// ===== ADVANCED ENRICHMENT: CITED EVIDENCE (AI Extraction with Sources) =====

export interface CitedClaim {
  claim: string; // "Led team of 12 engineers at Google"
  sourceUrl: string;
  sourceType: 'linkedin' | 'github' | 'publication' | 'news' | 'company_page' | 'resume';
  extractedText: string; // Exact text from source
  confidence: number; // 0-1
  verificationStatus: 'verified' | 'unverified' | 'conflicting';
  corroboratingSources?: string[]; // Other URLs that confirm this
  conflictingSources?: Array<{ url: string; claim: string }>; // Contradictions
}

export interface SkillEvidence {
  skill: string;
  proficiencyLevel: 'expert' | 'advanced' | 'intermediate' | 'beginner';
  evidence: CitedClaim[];
  yearsOfEvidence: number; // How long have they demonstrated this skill
  recency: 'current' | 'recent' | 'historical'; // Last 6mo / 6mo-2y / 2y+
}

export interface ExperienceEvidence {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  evidence: CitedClaim[];
  keyAchievements: CitedClaim[];
  teamSize?: CitedClaim;
  responsibilities: string[];
}

export interface CitedProfile {
  candidateId: string;
  name: CitedClaim;
  headline: CitedClaim | null;
  location: CitedClaim | null;
  experiences: ExperienceEvidence[];
  skills: SkillEvidence[];
  education: Array<{
    institution: string;
    degree: string;
    year?: number;
    evidence: CitedClaim;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date?: string;
    evidence: CitedClaim;
  }>;
  uncitedClaims: string[]; // Claims we couldn't find evidence for
  dataQualityScore: number; // 0-100, based on citation coverage
  sourcesUsed: Array<{ url: string; type: string; reliability: number }>;
  generatedAt: string;
}

// ===== COMPOSITE ADVANCED PROFILE =====

export interface AdvancedCandidateProfile {
  candidateId: string;
  networkGraph?: NetworkGraph;
  behavioralSignals?: BehavioralSignals;
  citedProfile?: CitedProfile;
  overallConfidence: number; // 0-100
  dataCompleteness: {
    network: number; // % of network data available
    behavioral: number; // % of behavioral data available
    cited: number; // % of claims with citations
  };
  lastUpdated: string;
  nextRefreshRecommended: string;
}

// ===== CREDIT STAGE GATING =====

export enum CreditStage {
  SEARCH = 'search',      // Stage 1: Basic results
  DEEP_PROFILE = 'deep',  // Stage 2: AI analysis
  OUTREACH = 'outreach'   // Stage 3: Persona + guide
}

// Demo pricing (lower values for testing)
export const STAGE_PRICING = {
  SEARCH: { perCandidate: 5, description: 'Basic search results' },
  DEEP_PROFILE: { perCandidate: 25, description: 'AI-powered deep analysis' },
  OUTREACH: { perCandidate: 50, description: 'Persona + outreach generation' }
};

// Skills configuration for the skills review step
export interface SkillTier {
  name: string;
  tier: 'must-have' | 'nice-to-have' | 'bonus';
  weight: number; // 1.0 / 0.6 / 0.3
  order: number;
}

export interface SkillsConfig {
  skills: SkillTier[];
  customSkills: string[];
}

// Shortlist state for candidate selection
export interface ShortlistState {
  candidateIds: string[];
  stage: 'selection' | 'deep-dive' | 'outreach';
}

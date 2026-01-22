/**
 * Social Matrix Types
 *
 * Type definitions for the unified social graph that combines
 * LinkedIn, GitHub, CRM, and AI-discovered connections to show
 * "6 Degrees of Kevin Bacon" style connection paths.
 */

// ===== NODE TYPES =====

export type MatrixNodeType =
  | 'person'
  | 'company'
  | 'school'
  | 'event'
  | 'content'
  | 'repo'
  | 'org';

export type MatrixNodeSource =
  | 'linkedin'
  | 'github'
  | 'crm'
  | 'research';

export interface MatrixNode {
  id: string;
  type: MatrixNodeType;
  name: string;
  metadata: Record<string, unknown>;
  source: MatrixNodeSource;
  profileUrl?: string;
  imageUrl?: string;
}

// ===== EDGE TYPES =====

export type MatrixEdgeType =
  | 'worked_at'
  | 'studied_at'
  | 'follows'
  | 'contributed_to'
  | 'spoke_at'
  | 'co_appeared_with'
  | 'contacted'
  | 'referred'
  | 'member_of'
  | 'co_authored'
  | 'mutual_connection';

export type VerificationStatus =
  | 'verified'
  | 'plausible'
  | 'unverified'
  | 'rejected';

export interface EdgeMetadata {
  startDate?: string;
  endDate?: string;
  context?: string;
  role?: string;
  title?: string;
}

export interface MatrixEdge {
  source: string; // Node ID
  target: string; // Node ID
  type: MatrixEdgeType;
  weight: number; // 0-1, connection strength
  confidence: number; // 0-1, how sure we are this is real
  status: VerificationStatus;
  sources: string[]; // URLs or source identifiers proving this edge
  metadata?: EdgeMetadata;
}

// ===== PATH TYPES =====

export interface ConnectionPath {
  nodes: MatrixNode[];
  edges: MatrixEdge[];
  totalWeight: number;
  degree: number; // 1, 2, 3, etc.
  explanation: string;
  verificationStatus: VerificationStatus;
  pathType: 'direct' | 'mutual' | 'company' | 'school' | 'event' | 'research';
}

// ===== GRAPH TYPES =====

export interface SocialMatrix {
  recruiterId: string;
  candidateId: string;
  nodes: MatrixNode[];
  edges: MatrixEdge[];
  paths: ConnectionPath[];
  bestPath?: ConnectionPath;
  connectionDegree: 1 | 2 | 3 | null;
  lastUpdated: string;
  dataFreshness: 'live' | 'cached' | 'stale';
}

// ===== AI CLAIM TYPES (for deep research) =====

export interface AIClaimEntity {
  id: string;
  type: 'connection' | 'event' | 'content' | 'company' | 'school';
  claim: string;
  sourceUrl: string;
  sourceType: 'linkedin' | 'github' | 'serp' | 'conference' | 'podcast' | 'publication';
  extractedText: string;
  entities: {
    personA?: string;
    personB?: string;
    organization?: string;
    event?: string;
    date?: string;
  };
  confidence: number;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
}

// ===== VERIFICATION TYPES =====

export interface SourceVerification {
  url: string;
  verified: boolean;
  confidence: number;
  extractedNames: string[];
  matchesContext: boolean;
  errorReason?: string;
}

export interface VerificationResult {
  overallConfidence: number;
  verifiedSources: number;
  totalSources: number;
  status: VerificationStatus;
  sourceDetails: SourceVerification[];
  admissionPurpose?: 'warm_intro' | 'display' | 'exploratory';
}

// ===== DEEP RESEARCH TYPES =====

export interface DeepResearchQuery {
  personA: {
    name: string;
    linkedinUrl?: string;
    githubUsername?: string;
    company?: string;
  };
  personB: {
    name: string;
    linkedinUrl?: string;
    githubUsername?: string;
    company?: string;
  };
  searchDepth: 'quick' | 'standard' | 'deep';
}

export interface DeepResearchResult {
  discoveries: AIClaimEntity[];
  sources: string[];
  confidence: number;
  searchQueries: string[];
  processingTimeMs: number;
}

export interface DeepResearchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  query: DeepResearchQuery;
  result?: DeepResearchResult;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// ===== WARM INTRO TYPES =====

export interface WarmIntroPath {
  connector: MatrixNode;
  recruiterRelationship: string;
  candidateRelationship: string;
  introQuality: 'hot' | 'warm' | 'cold';
  suggestedMessage: string;
  commonGround: string[];
}

export interface WarmIntroRequest {
  path: ConnectionPath;
  connector: MatrixNode;
  messageTemplate: string;
  recruiterId: string;
  candidateId: string;
}

// ===== CONNECTION DEGREE QUICK CHECK =====

export interface ConnectionDegreeResult {
  degree: 1 | 2 | 3 | null;
  source: 'linkedin' | 'github' | 'combined' | 'cache';
  path?: string; // Brief description like "via John Smith at Google"
  lastChecked: string;
  isStale: boolean;
}

// ===== PRICING =====

export const SOCIAL_MATRIX_PRICING = {
  LINKEDIN_PROFILE_FETCH: 50,
  DEEP_RESEARCH: 100,
  AI_PATH_ANALYSIS: 150,
  FULL_GRAPH_BUILD: 300,
} as const;

// ===== ADMISSION THRESHOLDS =====

export const ADMISSION_THRESHOLDS = {
  warm_intro: { minConfidence: 0.8, minSources: 2 },
  display: { minConfidence: 0.5, minSources: 1 },
  exploratory: { minConfidence: 0.3, minSources: 0 },
} as const;

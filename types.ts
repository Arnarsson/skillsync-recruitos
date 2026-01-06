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
}

export interface ScoreBreakdown {
  skills: ScoreComponent;
  experience: ScoreComponent;
  industry: ScoreComponent;
  seniority: ScoreComponent;
  location: ScoreComponent;
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
  scoreBreakdown?: ScoreBreakdown; // New field for Spec 12.5
  shortlistSummary: string;
  keyEvidence: string[];
  risks: string[];
  unlockedSteps: FunnelStage[]; 
  
  // Step 3: Evidence Report Data 
  avgTenure?: string;
  progressionPace?: string;
  
  // New Fields for Deep Analysis & Company Match
  deepAnalysis?: string;
  cultureFit?: string;
  
  trajectoryEvidence?: string;
  indicators?: WorkstyleIndicator[];
  interviewGuide?: InterviewQuestion[];
  
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

// Spec 13: Audit Types
export enum AuditEventType {
  JOB_CREATED = 'job_created',
  SCORE_GENERATED = 'score_generated',
  PROFILE_ENRICHED = 'profile_enriched',
  OUTREACH_GENERATED = 'outreach_generated',
  CREDIT_PURCHASE = 'credit_purchase'
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string;
  description: string;
  cost: number;
  user: string;
  metadata?: any; // JSON payload for EU AI Act compliance
}

// 1 Credit = ~0.54 EUR (Based on 5000 credits = 20,000 DKK)
export const CREDITS_TO_EUR = 0.54;

export const PRICING = {
  SHORTLIST: 93,      // ~€50
  DEEP_PROFILE: 278,  // ~€150
  OUTREACH: 463,      // ~€250
  REFRESH: 1          // Spec 10.4
};
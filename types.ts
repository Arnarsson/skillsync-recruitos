export enum FunnelStage {
  INTAKE = 1,
  SHORTLIST = 2,
  EVIDENCE_REPORT = 3, // Renamed from DEEP_PROFILE per Spec 16.1
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
  observation: string;
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
  linkedinUrl?: string;
  
  // Step 2: Shortlist Data (renamed to "Match Score" per Spec 16.1)
  matchScore: number; // 0-100, renamed from alignmentScore
  scoreBreakdown?: ScoreBreakdown;
  shortlistSummary: string;
  keyEvidence: string[];
  risks: string[];
  confidence: ConfidenceLevel;
  unlockedSteps: FunnelStage[]; 
  
  // Step 3: Evidence Report Data (renamed from Deep Profile)
  avgTenure?: string;
  progressionPace?: string;
  deepAnalysis?: string;
  cultureFit?: string;
  trajectoryEvidence?: string;
  indicators?: WorkstyleIndicator[];
  interviewGuide?: InterviewQuestion[];
  
  // Step 4: Outreach Data
  connectionPath?: string;
  sharedContext?: string[];
  outreachHook?: string;
  outreachConfidence?: ConfidenceLevel; // Added per Spec 15.1
}

export interface JobContext {
  id?: string;
  title: string;
  description: string;
  companyUrl: string;
  managerUrl: string;
  benchmarkUrl: string;
  teamUrls: string[];
  createdAt?: Date;
}

export interface ShareLink {
  token: string;
  url: string;
  expiresAt: Date;
  viewCount: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Pricing per Spec 11.1 & 11.2
// 1 Credit = 4 DKK = ~€0.54
export const CREDITS_TO_EUR = 0.54;
export const CREDITS_TO_DKK = 4;

export const PRICING = {
  SHORTLIST: 93,        // Step 2: ~€50
  EVIDENCE_REPORT: 278, // Step 3: ~€150 (renamed from DEEP_PROFILE)
  OUTREACH: 463,        // Step 4: ~€250
  REFRESH: 1            // Spec 10.4
};

// Helper function for consistent price display (Spec 11.4)
export const formatPrice = (credits: number): string => {
  const eur = Math.round(credits * CREDITS_TO_EUR);
  return `${credits} Credits (~€${eur})`;
};

// Confidence badge colors
export const getConfidenceColor = (level: ConfidenceLevel): { bg: string; text: string; dot: string } => {
  switch (level) {
    case ConfidenceLevel.HIGH:
      return { bg: 'bg-emerald-900/30', text: 'text-emerald-400', dot: 'bg-emerald-500' };
    case ConfidenceLevel.MEDIUM:
      return { bg: 'bg-yellow-900/30', text: 'text-yellow-400', dot: 'bg-yellow-500' };
    case ConfidenceLevel.LOW:
      return { bg: 'bg-red-900/30', text: 'text-red-400', dot: 'bg-red-500' };
  }
};

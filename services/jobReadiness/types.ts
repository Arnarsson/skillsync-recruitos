// ===== PILLAR NAMES =====
export const PILLAR_NAMES = [
  'networkIntelligence',
  'engagementDecay',
  'skillDiversification',
  'companyHealth',
  'tenureRisk',
  'profileOptimization',
  'sentimentShift',
] as const;

export type PillarName = (typeof PILLAR_NAMES)[number];

// ===== WEIGHTS (must sum to 1.0) =====
export const PILLAR_WEIGHTS: Record<PillarName, number> = {
  networkIntelligence: 0.25,
  engagementDecay: 0.20,
  skillDiversification: 0.15,
  companyHealth: 0.15,
  tenureRisk: 0.10,
  profileOptimization: 0.10,
  sentimentShift: 0.05,
};

// ===== DATA SOURCE TYPES =====
export type DataSource =
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'serp'
  | 'news_api'
  | 'layoffs_fyi'
  | 'glassdoor'
  | 'blog'
  | 'stackoverflow'
  | 'personal_website'
  | 'llm_inference';

// ===== SIGNAL: individual observation within a pillar =====
export interface Signal {
  name: string;
  value: number;
  normalizedValue: number; // 0-100
  source: DataSource;
  confidence: number; // 0-1
  detail?: string;
}

// ===== PILLAR RESULT =====
export interface PillarResult {
  pillar: PillarName;
  score: number | null; // 0-100, null if no data
  confidence: number; // 0-1
  signals: Signal[];
  primarySource: DataSource;
  fallbacksUsed: DataSource[];
  error?: string;
}

// ===== AGGREGATE READINESS SCORE =====
export interface ReadinessScore {
  overall: number; // 0-100 weighted aggregate
  confidence: number; // 0-1 overall data quality
  level: 'cold' | 'warming' | 'warm' | 'hot';
  pillars: Record<PillarName, PillarResult>;
  computedAt: string; // ISO timestamp
  candidateId: string;
  dataSourcesSummary: DataSource[];
}

// ===== READINESS LEVEL THRESHOLDS =====
export const READINESS_LEVELS = {
  hot: { min: 75, label: 'Hot - Likely receptive now' },
  warm: { min: 50, label: 'Warm - Some positive signals' },
  warming: { min: 25, label: 'Warming - Early indicators' },
  cold: { min: 0, label: 'Cold - No strong signals' },
} as const;

export function getReadinessLevel(score: number): ReadinessScore['level'] {
  if (score >= READINESS_LEVELS.hot.min) return 'hot';
  if (score >= READINESS_LEVELS.warm.min) return 'warm';
  if (score >= READINESS_LEVELS.warming.min) return 'warming';
  return 'cold';
}

// ===== CANDIDATE INPUT (what each pillar receives) =====
export interface ReadinessInput {
  candidateId: string;
  githubUsername?: string;
  linkedinUrl?: string;
  currentCompany?: string;
  currentRole?: string;
  yearsAtCompany?: number;
  skills?: string[];
  location?: string;
  githubProfile?: {
    login: string;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    bio: string | null;
    company: string | null;
  };
  githubRepos?: Array<{
    name: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    pushed_at: string;
    created_at: string;
    topics: string[];
    fork: boolean;
  }>;
  githubEvents?: Array<{
    type: string;
    created_at: string;
    repo: { name: string };
  }>;
  linkedinProfile?: {
    headline?: string;
    experience?: Array<{
      title: string;
      company: string;
      startDate?: string;
      endDate?: string;
      current?: boolean;
    }>;
    skills?: string[];
    posts?: Array<{
      text: string;
      date: string;
      reactions: number;
    }>;
  };
}

// ===== FETCHER INTERFACES (dependency injection for testing) =====
export interface ExternalFetchers {
  fetchGitHubProfile?: (username: string) => Promise<ReadinessInput['githubProfile'] | null>;
  fetchGitHubRepos?: (username: string) => Promise<NonNullable<ReadinessInput['githubRepos']>>;
  fetchGitHubEvents?: (username: string) => Promise<NonNullable<ReadinessInput['githubEvents']>>;
  fetchLinkedInProfile?: (url: string) => Promise<ReadinessInput['linkedinProfile'] | null>;
  fetchCompanyNews?: (company: string) => Promise<Array<{ title: string; date: string; sentiment: number }> | null>;
  fetchLayoffsData?: (company: string) => Promise<{ hasLayoffs: boolean; date?: string; count?: number } | null>;
  analyzeSentiment?: (texts: string[]) => Promise<Array<{ text: string; sentiment: number; confidence: number }> | null>;
}

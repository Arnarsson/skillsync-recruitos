import { z } from 'zod';

// ============================================================
// Reusable primitives
// ============================================================

const nonEmptyString = z.string().min(1).trim();
const optionalString = z.string().optional();
const sourceTypeEnum = z.enum(['GITHUB', 'LINKEDIN', 'MANUAL']);
const criterionSchema = z.object({
  id: z.string().min(1),
  label: nonEmptyString,
  weight: z.number().min(0).max(1),
  description: z.string().optional(),
  rubric: z
    .array(
      z.object({
        score: z.number().int().min(1).max(5),
        description: nonEmptyString,
      })
    )
    .min(1)
    .optional(),
});

// ============================================================
// Candidate schemas
// ============================================================

export const candidateCreateSchema = z.object({
  name: nonEmptyString,
  headline: optionalString,
  currentRole: optionalString,
  company: optionalString,
  location: optionalString,
  avatar: z.string().url().optional().or(z.literal('')).optional(),

  sourceType: sourceTypeEnum,
  githubUsername: optionalString,
  linkedinId: optionalString,
  linkedinUrl: z.string().url().optional().or(z.literal('')).optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')).optional(),

  yearsExperience: z.number().int().nonnegative().optional().nullable(),
  experience: z.unknown().optional(),
  education: z.unknown().optional(),
  certifications: z.unknown().optional(),
  spokenLanguages: z.unknown().optional(),

  skills: z.unknown().optional(),
  codingLanguages: z.unknown().optional(),

  alignmentScore: z.number().min(0).max(100).optional().nullable(),
  scoreBreakdown: z.unknown().optional(),
  scoreConfidence: optionalString,
  scoreDrivers: z.array(z.string()).optional(),
  scoreDrags: z.array(z.string()).optional(),

  persona: z.unknown().optional(),
  deepAnalysis: optionalString,
  companyMatch: z.unknown().optional(),
  indicators: z.unknown().optional(),
  interviewGuide: z.unknown().optional(),
  networkDossier: z.unknown().optional(),
  advancedProfile: z.unknown().optional(),
  buildprint: z.unknown().optional(),

  pipelineStage: z.string().optional().default('sourced'),
  unlockedSteps: z.array(z.number().int()).optional(),
  shortlistSummary: optionalString,
  keyEvidence: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),

  connectionDegree: optionalString,
  mutualConnections: optionalString,
  openToWork: z.boolean().optional().nullable(),
  isPremium: z.boolean().optional().nullable(),
  rawProfileText: optionalString,

  userId: z.string().optional().nullable(),
  capturedAt: z.string().datetime().optional(),
});

export const candidateUpdateSchema = candidateCreateSchema.partial();

export const candidateImportSchema = z.object({
  source: z.enum(['localStorage', 'vercelKV']),
  candidates: z.array(z.record(z.string(), z.unknown())).min(0),
  userId: z.string().optional().nullable(),
});

export const candidateNoteCreateSchema = z.object({
  author: nonEmptyString,
  content: nonEmptyString,
  tags: z.array(z.string()).optional(),
});

// ============================================================
// Criteria / scorecard schemas
// ============================================================

export const criteriaSetCreateSchema = z.object({
  name: nonEmptyString,
  role: z.string().optional(),
  description: z.string().optional(),
  criteria: z.array(criterionSchema).min(1),
});

export const criteriaSetUpdateSchema = criteriaSetCreateSchema.partial();

export const criteriaScoreRequestSchema = z.object({
  criteria: z.array(criterionSchema).min(1),
  evidenceText: z.string().optional(),
  evidence: z
    .array(
      z.object({
        text: z.string().min(1),
        source: z.string().optional(),
      })
    )
    .optional(),
});

export const criteriaInterviewRequestSchema = z.object({
  criteria: z.array(criterionSchema).min(1),
  candidateName: z.string().optional(),
  evidence: z
    .array(
      z.object({
        text: z.string().min(1),
        source: z.string().optional(),
      })
    )
    .optional(),
});

// ============================================================
// LinkedIn schemas
// ============================================================

export const linkedinCandidateSchema = z.object({
  source: z.string().optional(),
  capturedAt: z.string().optional(),
  profile: z.object({
    linkedinId: nonEmptyString,
    name: z.string().optional(),
    headline: z.string().optional(),
    currentCompany: z.string().optional(),
    location: z.string().optional(),
    photoUrl: z.string().optional(),
    url: z.string().optional(),
    about: z.string().optional(),
    experience: z.unknown().optional(),
    education: z.unknown().optional(),
    skills: z.unknown().optional(),
    languages: z.unknown().optional(),
    certifications: z.unknown().optional(),
    connectionDegree: z.string().optional(),
    mutualConnections: z.string().optional(),
    openToWork: z.boolean().optional(),
    isPremium: z.boolean().optional(),
    connectionCount: z.union([z.number(), z.string()]).optional(),
    followers: z.union([z.number(), z.string()]).optional(),
    isCreator: z.boolean().optional(),
  }),
});

export const linkedinEnrichSchema = z.object({
  name: nonEmptyString,
  company: z.string().optional(),
  linkedinId: z.string().optional(),
});

export const linkedinNoteSchema = z.object({
  candidateId: nonEmptyString,
  content: nonEmptyString,
  tags: z.array(z.string()).optional(),
});

// ============================================================
// GitHub schemas
// ============================================================

export const githubSearchSchema = z.object({
  q: z.string().min(1, 'Query parameter is required'),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const githubDeepSchema = z.object({
  username: nonEmptyString,
  jobContext: z.string().optional(),
});

export const githubQualitySchema = z.object({
  username: nonEmptyString,
});

// ============================================================
// Credit schemas
// ============================================================

export const creditActionSchema = z.object({
  action: z.literal('deduct'),
  username: z.string().min(1, 'Username is required'),
});

export const creditConsumeSchema = z.object({
  candidateUsername: nonEmptyString,
});

export const creditCheckoutSchema = z.object({
  packageId: nonEmptyString,
});

// ============================================================
// Outreach schemas
// ============================================================

export const outreachGenerateSchema = z.object({
  candidateName: nonEmptyString,
  candidateRole: z.string().optional(),
  company: z.string().optional(),
  jobContext: nonEmptyString,
  instructions: z.string().optional(),
  connectionPath: z.string().optional(),
  sharedContext: z.array(z.string()).optional(),
  personaArchetype: z.string().optional(),
  multiVariant: z.boolean().optional().default(false),
});

export const outreachSendSchema = z.object({
  to: z.string().email('A valid email address is required'),
  subject: nonEmptyString,
  body: nonEmptyString,
  candidateId: z.string().optional(),
});

// ============================================================
// Profile schemas
// ============================================================

export const profileAnalyzeSchema = z.object({
  candidateId: z.string().min(1),
  candidateName: z.string().min(1),
  currentRole: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  isShortlisted: z.boolean().optional(),
  enrichmentData: z.any().optional(),
  useComparativeAnalysis: z.boolean().optional().default(true),
});

export const sharedProfileCreateSchema = z.object({
  candidateId: nonEmptyString,
  name: nonEmptyString,
  currentRole: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().optional(),
  skills: z.array(z.string()).optional(),
  yearsExperience: z.number().int().optional(),
  alignmentScore: z.number().int().min(0).max(100).optional().default(0),
  persona: z.unknown().optional(),
  keyEvidence: z.unknown().optional(),
  keyEvidenceWithSources: z.unknown().optional(),
  risks: z.unknown().optional(),
  risksWithSources: z.unknown().optional(),
  scoreBreakdown: z.unknown().optional(),
  createdBy: z.string().optional(),
});

// ============================================================
// Team schemas
// ============================================================

export const teamCreateSchema = z.object({
  name: nonEmptyString,
  description: z.string().optional(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional().default('MEMBER'),
});

export const pipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  description: z.string().optional(),
  stages: z.array(z.string()).optional(),
});

// ============================================================
// TeamTailor schemas
// ============================================================

export const teamTailorExportSchema = z.object({
  candidates: z.array(z.object({
    candidate: z.record(z.string(), z.unknown()),
    email: z.string().email('Each candidate must have a valid email'),
    phone: z.string().optional(),
  })).min(1, 'At least one candidate is required'),
  jobId: z.string().optional(),
  includeEvidence: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================
// Analytics schemas
// ============================================================

export const analyticsExportSchema = z.object({
  format: z.enum(['csv', 'json']).optional().default('json'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ============================================================
// Checkout schemas
// ============================================================

export const stripeCheckoutSchema = z.object({
  packageId: nonEmptyString,
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// ============================================================
// Auth schemas
// ============================================================

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

// ============================================================
// Environment variables schema
// ============================================================

export const envSchema = z.object({
  // Required
  POSTGRES_PRISMA_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // Optional but recommended
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  BRIGHTDATA_API_KEY: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // OAuth
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables on startup
 * @throws {ZodError} if required variables are missing or invalid
 */
export function validateEnv(processEnv: NodeJS.ProcessEnv): EnvConfig {
  try {
    return envSchema.parse(processEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter(e => e.code === 'invalid_type' && (e as any).received === 'undefined')
        .map(e => e.path.join('.'));

      const invalidVars = error.issues
        .filter(e => e.code !== 'invalid_type' || (e as any).received !== 'undefined')
        .map(e => `${e.path.join('.')}: ${e.message}`);

      let errorMessage = 'Environment variable validation failed:\n';

      if (missingVars.length > 0) {
        errorMessage += `\nMissing required variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}`;
      }

      if (invalidVars.length > 0) {
        errorMessage += `\nInvalid variables:\n${invalidVars.map(v => `  - ${v}`).join('\n')}`;
      }

      console.error(errorMessage);
      throw error;
    }
    throw error;
  }
}

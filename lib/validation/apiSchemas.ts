import { z } from 'zod';

// Common validation schemas

export const githubSearchSchema = z.object({
  q: z.string().min(1, 'Query parameter is required'),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const creditActionSchema = z.object({
  action: z.literal('deduct'),
  username: z.string().min(1, 'Username is required'),
});

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

// Environment variables schema
export const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
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
      
      let errorMessage = '❌ Environment variable validation failed:\n';
      
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

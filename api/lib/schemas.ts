/**
 * API Schema Definitions (Zod)
 *
 * Central location for all API input/output schemas.
 * These schemas serve as both runtime validation AND TypeScript types.
 */

import { z } from 'zod';

// ============================================================
// ERROR CODES
// ============================================================

export const ErrorCode = {
  // Auth errors (401)
  AUTH_MISSING: 'AUTH_MISSING',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',

  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_PARAM: 'MISSING_PARAM',
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_URL: 'INVALID_URL',

  // External service errors (502/503)
  BRIGHTDATA_ERROR: 'BRIGHTDATA_ERROR',
  BRIGHTDATA_TIMEOUT: 'BRIGHTDATA_TIMEOUT',
  SCRAPE_FAILED: 'SCRAPE_FAILED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Internal errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',

  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// ============================================================
// COMMON SCHEMAS
// ============================================================

export const LinkedInUrlSchema = z.string()
  .url()
  .refine(
    (url) => url.includes('linkedin.com/in/'),
    { message: 'Must be a valid LinkedIn profile URL' }
  );

export const SnapshotIdSchema = z.string()
  .min(1, 'snapshot_id is required')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid snapshot_id format');

// ============================================================
// BRIGHTDATA API SCHEMAS
// ============================================================

// --- Actions ---

export const TriggerInputSchema = z.object({
  action: z.literal('trigger'),
  url: LinkedInUrlSchema,
});

export const SerpTriggerInputSchema = z.object({
  action: z.literal('serp-trigger'),
  keyword: z.string().min(1, 'keyword is required').max(500),
});

export const ProgressInputSchema = z.object({
  action: z.literal('progress'),
  snapshot_id: SnapshotIdSchema,
});

export const SnapshotInputSchema = z.object({
  action: z.literal('snapshot'),
  snapshot_id: SnapshotIdSchema,
});

export const ScrapeInputSchema = z.object({
  action: z.literal('scrape'),
  url: z.string().url('Must be a valid URL'),
  tier: z.enum(['1', '2', '3', '4']).optional(),
});

// Combined input schema (discriminated union)
export const BrightDataInputSchema = z.discriminatedUnion('action', [
  TriggerInputSchema,
  SerpTriggerInputSchema,
  ProgressInputSchema,
  SnapshotInputSchema,
  ScrapeInputSchema,
]);

export type BrightDataInput = z.infer<typeof BrightDataInputSchema>;

// --- Outputs ---

export const TriggerResponseSchema = z.object({
  snapshot_id: z.string(),
  status: z.string().optional(),
});

export const ProgressResponseSchema = z.object({
  status: z.enum(['pending', 'running', 'ready', 'failed']),
  records: z.number().optional(),
  progress: z.number().optional(),
  error: z.string().optional(),
});

export const ScrapeResponseSchema = z.object({
  content: z.string(),
  statusCode: z.number(),
  url: z.string().optional(),
  contentType: z.string().optional(),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.nativeEnum(ErrorCode).optional(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Success response wrapper
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.string().datetime().optional(),
  });

// ============================================================
// LINKEDIN PROFILE SCHEMA (for parsing BrightData responses)
// ============================================================

export const LinkedInExperienceSchema = z.object({
  title: z.string().optional(),
  position: z.string().optional(),
  role: z.string().optional(),
  company: z.string().optional(),
  company_name: z.string().optional(),
  organization: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  started_on: z.object({
    year: z.number().optional(),
    month: z.number().optional(),
  }).optional(),
  ended_on: z.object({
    year: z.number().optional(),
    month: z.number().optional(),
  }).optional(),
  duration: z.string().optional(),
  description: z.string().optional(),
  description_html: z.string().optional(),
  location: z.string().optional(),
  is_current: z.boolean().optional(),
}).passthrough();

export const LinkedInEducationSchema = z.object({
  title: z.string().optional(),
  school: z.string().optional(),
  school_name: z.string().optional(),
  degree: z.string().optional(),
  degree_name: z.string().optional(),
  field: z.string().optional(),
  field_of_study: z.string().optional(),
  start_year: z.string().optional(),
  end_year: z.string().optional(),
  started_on: z.object({ year: z.number().optional() }).optional(),
  ended_on: z.object({ year: z.number().optional() }).optional(),
  description: z.string().optional(),
  grade: z.string().optional(),
  activities: z.string().optional(),
}).passthrough();

export const LinkedInCertificationSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  meta: z.string().optional(),
  credential_url: z.string().optional(),
  credential_id: z.string().optional(),
});

export const LinkedInProfileSchema = z.object({
  // Name variations
  name: z.string().optional(),
  full_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),

  // Position/headline variations
  position: z.string().optional(),
  headline: z.string().optional(),
  title: z.string().optional(),

  // Company variations
  current_company: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
  }).optional(),
  current_company_name: z.string().optional(),
  company: z.string().optional(),

  // Location variations
  city: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  location: z.string().optional(),
  region: z.string().optional(),

  // About section variations
  about: z.string().optional(),
  summary: z.string().optional(),
  bio: z.string().optional(),

  // Experience
  experience: z.array(LinkedInExperienceSchema).optional(),
  positions: z.array(z.record(z.unknown())).optional(),

  // Education
  education: z.array(LinkedInEducationSchema).optional(),
  schools: z.array(z.record(z.unknown())).optional(),
  educations_details: z.string().optional(),

  // Skills
  skills: z.array(z.string()).optional(),
  skill_list: z.array(z.string()).optional(),
  skills_data: z.array(z.object({
    name: z.string().optional(),
    endorsements: z.number().optional(),
  })).optional(),

  // Certifications & Courses
  certifications: z.array(LinkedInCertificationSchema).optional(),
  courses: z.array(z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  })).optional(),

  // Engagement metrics
  followers: z.number().optional(),
  follower_count: z.number().optional(),
  connections: z.number().optional(),
  connection_count: z.number().optional(),

  // Profile metadata
  avatar: z.string().optional(),
  default_avatar: z.boolean().optional(),
  linkedin_id: z.string().optional(),
  url: z.string().optional(),

  // Network context
  people_also_viewed: z.array(z.object({
    name: z.string().optional(),
    profile_link: z.string().optional(),
    about: z.string().optional(),
    location: z.string().optional(),
  })).optional(),
}).passthrough();

export type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>;

// ============================================================
// GITHUB API SCHEMAS
// ============================================================

export const GitHubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  name: z.string().nullable(),
  company: z.string().nullable(),
  blog: z.string().nullable(),
  location: z.string().nullable(),
  email: z.string().nullable(),
  bio: z.string().nullable(),
  twitter_username: z.string().nullable(),
  public_repos: z.number(),
  public_gists: z.number(),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  hireable: z.boolean().nullable(),
});

export const GitHubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  watchers_count: z.number(),
  topics: z.array(z.string()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
  homepage: z.string().nullable(),
  fork: z.boolean(),
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Format Zod validation errors into a readable string
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join('; ');
}

/**
 * Extract action and params from query string (for GET requests)
 */
export function parseQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

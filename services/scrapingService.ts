/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { type EnrichedProfile } from './enrichmentServiceLegacy';
import { enrichCandidatePersona } from './enrichmentServiceV2';
import { CandidatePersona } from '../types'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { normalizeLinkedInUrl } from '../lib/urlNormalizer';

import { callOpenRouter } from './geminiService';

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: any;
  };
  error?: string;
}

interface BrightDataProfile {
  // Name variations
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;

  // Position/headline variations
  position?: string;
  headline?: string;
  title?: string;

  // Company variations
  current_company?: { name?: string; title?: string };
  current_company_name?: string;
  company?: string;

  // Location variations
  city?: string;
  country?: string;
  country_code?: string;
  location?: string;
  region?: string;

  // About section variations
  about?: string;
  summary?: string;
  bio?: string;

  // Experience variations
  experience?: Array<{
    title?: string;
    position?: string;
    role?: string;
    company?: string;
    company_name?: string;
    organization?: string;
    start_date?: string;
    end_date?: string;
    started_on?: { year?: number; month?: number };
    ended_on?: { year?: number; month?: number };
    duration?: string;
    description?: string;
    description_html?: string;
    location?: string;
    is_current?: boolean;
  }>;
  positions?: Array<any>; // Alternate field name

  // Education variations
  education?: Array<{
    title?: string;
    school?: string;
    school_name?: string;
    degree?: string;
    degree_name?: string;
    field?: string;
    field_of_study?: string;
    start_year?: string;
    end_year?: string;
    started_on?: { year?: number };
    ended_on?: { year?: number };
    description?: string;
    grade?: string;
    activities?: string;
  }>;
  schools?: Array<any>; // Alternate field name

  // Skills variations
  skills?: string[];
  skill_list?: string[];
  skills_data?: Array<{ name?: string; endorsements?: number }>;

  // Certifications (BrightData specific)
  certifications?: Array<{
    title?: string;
    subtitle?: string;
    meta?: string;
    credential_url?: string;
    credential_id?: string;
  }>;

  // Courses (BrightData specific)
  courses?: Array<{
    title?: string;
    subtitle?: string;
  }>;

  // Additional BrightData fields
  educations_details?: string; // Text summary of education
  avatar?: string; // Profile picture URL
  default_avatar?: boolean; // Whether using default LinkedIn avatar
  people_also_viewed?: Array<{
    name?: string;
    profile_link?: string;
    about?: string;
    location?: string;
  }>;
  linkedin_id?: string;
  url?: string;

  // Engagement metrics variations
  followers?: number;
  follower_count?: number;
  connections?: number;
  connection_count?: number;

  // Catch-all for unexpected fields
  [key: string]: any;
}

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Check if URL is a LinkedIn profile
const isLinkedInUrl = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('linkedin.com');
  } catch {
    return false;
  }
};

// List of domains that Firecrawl typically blocks (excluding LinkedIn which we now handle via BrightData)
const FIRECRAWL_BLOCKED_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com'];

const isFirecrawlBlockedDomain = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return FIRECRAWL_BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
};

/**
 * Convert BrightData profile JSON to readable markdown text
 * Enhanced to support multiple field name variations
 */
const brightDataProfileToMarkdown = (profile: BrightDataProfile): string => {
  let markdown = '';
  const extractedFields: string[] = []; // Track what we extracted for diagnostics

  // === HEADER: Name (multiple variations) ===
  const name = profile.name || profile.full_name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null);
  if (name) {
    markdown += `# ${name}\n`;
    extractedFields.push('name');
  }

  // === HEADLINE/POSITION (multiple variations) ===
  const position = profile.position || profile.headline || profile.title;
  if (position) {
    markdown += `**${position}**`;
    extractedFields.push('position');

    // Company extraction with multiple fallbacks
    const companyName = profile.current_company?.name ||
      profile.current_company_name ||
      profile.company;
    if (companyName) {
      markdown += ` at ${companyName}`;
      extractedFields.push('company');
    }
    markdown += '\n';
  }

  // === LOCATION (multiple variations) ===
  const location = profile.city || profile.location ||
    profile.country || profile.region;
  if (location) {
    markdown += `📍 ${location}\n`;
    extractedFields.push('location');
  }

  // === ENGAGEMENT METRICS (multiple variations) ===
  const followers = profile.followers || profile.follower_count;
  const connections = profile.connections || profile.connection_count;

  if (followers || connections) {
    const stats = [];
    if (followers) stats.push(`${followers.toLocaleString()} followers`);
    if (connections) stats.push(`${connections}+ connections`);
    markdown += `${stats.join(' | ')}\n`;
    extractedFields.push('engagement');
  }

  // === ABOUT SECTION (multiple variations) ===
  const about = profile.about || profile.summary || profile.bio;
  if (about) {
    markdown += `\n## About\n${about}\n`;
    extractedFields.push('about');
  }

  // === EXPERIENCE (enhanced extraction with multiple formats) ===
  const experiences = profile.experience || profile.positions || [];

  if (experiences && experiences.length > 0) {
    markdown += `\n## Experience\n`;
    extractedFields.push('experience');

    for (const exp of experiences) {
      // Title extraction (multiple variations)
      const title = exp.title || exp.position || exp.role || 'Role';

      // Company extraction (multiple variations)
      const company = exp.company || exp.company_name || exp.organization;

      markdown += `### ${title}`;
      if (company) markdown += ` at ${company}`;
      markdown += '\n';

      // Date range extraction (handle multiple formats)
      let dateRange = '';
      if (exp.start_date) {
        // String format: "Jan 2020" - "Dec 2023"
        dateRange = exp.start_date;
        if (exp.end_date) {
          dateRange += ` - ${exp.end_date}`;
        } else if (exp.is_current) {
          dateRange += ' - Present';
        }
      } else if (exp.started_on) {
        // Object format: { year: 2020, month: 1 }
        const startYear = exp.started_on.year;
        const startMonth = exp.started_on.month;
        dateRange = startMonth ? `${startMonth}/${startYear}` : `${startYear}`;

        if (exp.ended_on) {
          const endYear = exp.ended_on.year;
          const endMonth = exp.ended_on.month;
          const endDate = endMonth ? `${endMonth}/${endYear}` : `${endYear}`;
          dateRange += ` - ${endDate}`;
        } else if (exp.is_current) {
          dateRange += ' - Present';
        }
      }

      if (dateRange) {
        markdown += `*${dateRange}*`;
        if (exp.duration) markdown += ` (${exp.duration})`;
        markdown += '\n';
      }

      if (exp.location) markdown += `${exp.location}\n`;

      // Description (prefer HTML stripped version)
      const description = exp.description ||
        (exp.description_html
          ? exp.description_html.replace(/<[^>]*>/g, '')
          : null);
      if (description) markdown += `${description}\n`;

      markdown += '\n';
    }
  }

  // === EDUCATION (enhanced extraction with multiple formats) ===
  const educations = profile.education || profile.schools || [];
  const educationSummary = profile.educations_details;

  if (educations && educations.length > 0 || educationSummary) {
    markdown += `\n## Education\n`;
    extractedFields.push('education');

    // BrightData specific: educations_details (text summary)
    if (educationSummary) {
      markdown += `${educationSummary}\n`;
    }

    for (const edu of educations) {
      const school = edu.title || edu.school || edu.school_name || 'Institution';
      markdown += `### ${school}\n`;

      // Degree and field extraction (multiple variations)
      const degree = edu.degree || edu.degree_name;
      const field = edu.field || edu.field_of_study;

      if (degree || field) {
        markdown += `${[degree, field].filter(Boolean).join(' in ')}\n`;
      }

      // Date range (multiple formats)
      let eduDateRange = '';
      if (edu.start_year || edu.end_year) {
        eduDateRange = `${edu.start_year || ''} - ${edu.end_year || ''}`;
      } else if (edu.started_on || edu.ended_on) {
        const startYear = edu.started_on?.year || '';
        const endYear = edu.ended_on?.year || '';
        eduDateRange = `${startYear} - ${endYear}`;
      }

      if (eduDateRange) markdown += `*${eduDateRange}*\n`;

      if (edu.grade) markdown += `Grade: ${edu.grade}\n`;
      if (edu.description) markdown += `${edu.description}\n`;
      if (edu.activities) markdown += `Activities: ${edu.activities}\n`;

      markdown += '\n';
    }
  }

  // === SKILLS (multiple format support) ===
  let skills: string[] = [];

  if (profile.skills && Array.isArray(profile.skills)) {
    skills = profile.skills;
  } else if (profile.skill_list && Array.isArray(profile.skill_list)) {
    skills = profile.skill_list;
  } else if (profile.skills_data && Array.isArray(profile.skills_data)) {
    skills = profile.skills_data.map(s => s.name || '').filter(Boolean);
  }

  if (skills.length > 0) {
    markdown += `\n## Skills\n${skills.join(', ')}\n`;
    extractedFields.push('skills');
  }

  // === CERTIFICATIONS (BrightData specific field) ===
  if (profile.certifications && profile.certifications.length > 0) {
    markdown += `\n## Certifications\n`;
    extractedFields.push('certifications');

    for (const cert of profile.certifications) {
      markdown += `### ${cert.title || 'Certification'}\n`;
      if (cert.subtitle) markdown += `**${cert.subtitle}**\n`;
      if (cert.meta) markdown += `*${cert.meta}*\n`;
      if (cert.credential_url) markdown += `[View Credential](${cert.credential_url})\n`;
      markdown += '\n';
    }
  }

  // === COURSES (BrightData specific field) ===
  if (profile.courses && profile.courses.length > 0) {
    markdown += `\n## Courses\n`;
    extractedFields.push('courses');

    for (const course of profile.courses) {
      markdown += `- **${course.title || 'Course'}**`;
      if (course.subtitle && course.subtitle !== '-') {
        markdown += ` (${course.subtitle})`;
      }
      markdown += '\n';
    }
  }

  // === PROFESSIONAL NETWORK (people_also_viewed) ===
  if (profile.people_also_viewed && profile.people_also_viewed.length > 0) {
    markdown += `\n## Professional Network Context\n`;
    markdown += `*LinkedIn suggests these similar professionals:*\n`;
    extractedFields.push('professional_network');

    const topProfiles = profile.people_also_viewed.slice(0, 5); // Top 5 for brevity
    for (const person of topProfiles) {
      markdown += `- ${person.name || 'Professional'}`;
      if (person.location) markdown += ` (${person.location})`;
      markdown += '\n';
    }
    markdown += '\n';
  }

  // === PROFILE METADATA (for psychographic context) ===
  if (profile.linkedin_id || profile.url || profile.avatar) {
    markdown += `\n## Profile Metadata\n`;
    if (profile.url) {
      markdown += `LinkedIn: ${profile.url}\n`;
    }
    if (profile.linkedin_id) {
      markdown += `Profile ID: ${profile.linkedin_id}\n`;
    }
    if (profile.avatar && !profile.default_avatar) {
      markdown += `Avatar: ${profile.avatar}\n`;
    }
    extractedFields.push('metadata');
  }

  // === DIAGNOSTIC LOGGING ===
  if (process.env.NODE_ENV === 'development') {
    console.log('[BrightData] Extracted fields:', extractedFields);
    console.log('[BrightData] Total field types:', extractedFields.length);
  }

  return markdown || 'No profile data available';
};

/**
 * Helper: Assess data quality of scraped profile
 */
const assessDataQuality = (profile: BrightDataProfile): { isRich: boolean; score: number; missing: string[] } => {
  const checks = {
    hasExperience: !!profile.experience && profile.experience.length > 0,
    hasPositions: !!profile.positions && profile.positions.length > 0,
    hasSkills: (profile.skills && profile.skills.length > 0) ||
      (profile.skill_list && profile.skill_list.length > 0),
    hasAbout: !!profile.about || !!profile.summary,
    hasEducation: (profile.education && profile.education.length > 0) ||
      (profile.schools && profile.schools.length > 0)
  };

  const score = Object.values(checks).filter(Boolean).length;
  const missing: string[] = [];

  if (!checks.hasExperience && !checks.hasPositions) missing.push('work experience');
  if (!checks.hasSkills) missing.push('skills');
  if (!checks.hasAbout) missing.push('about/summary');
  if (!checks.hasEducation) missing.push('education');

  // Rich data = has experience AND (skills OR about)
  const isRich = (checks.hasExperience || checks.hasPositions) &&
    (checks.hasSkills || checks.hasAbout);

  return { isRich, score, missing };
};

/**
 * Helper: Merge multiple profile responses (e.g., main + /details/experience/)
 */
const mergeLinkedInProfiles = (profiles: BrightDataProfile[]): BrightDataProfile => {
  if (profiles.length === 0) return {};
  if (profiles.length === 1) return profiles[0];

  // Start with the profile that has the most data
  const sorted = profiles.sort((a, b) => {
    const aQuality = assessDataQuality(a).score;
    const bQuality = assessDataQuality(b).score;
    return bQuality - aQuality;
  });

  const merged = { ...sorted[0] };

  // Merge experience arrays (dedupe by company+title)
  const allExperience = profiles
    .flatMap(p => p.experience || p.positions || [])
    .filter((exp, idx, arr) => {
      const key = `${exp.company || exp.company_name}-${exp.title || exp.position}`;
      return arr.findIndex(e =>
        `${e.company || e.company_name}-${e.title || e.position}` === key
      ) === idx;
    });

  if (allExperience.length > 0) {
    merged.experience = allExperience;
  }

  // Merge skills arrays (dedupe)
  const allSkills = Array.from(new Set(
    profiles.flatMap(p => p.skills || p.skill_list || [])
  ));
  if (allSkills.length > 0) {
    merged.skills = allSkills;
  }

  // Prefer longer about/summary
  const longestAbout = profiles
    .map(p => p.about || p.summary || '')
    .sort((a, b) => b.length - a.length)[0];
  if (longestAbout) {
    merged.about = longestAbout;
  }

  return merged;
};

/**
 * Decision function: Classify profile outcome based on data sources
 * Returns: 'auto_full', 'auto_partial', or 'manual_required'
 */
type ProfileOutcome = {
  type: 'auto_full' | 'auto_partial' | 'manual_required';
  confidence: 'high' | 'medium' | 'low' | 'none';
  canAutoScore: boolean;
  source: string;
  reason: string;
};

const decideProfileOutcome = (
  hasLinkedInData: boolean,
  hasEnrichmentData: boolean,
  profile: BrightDataProfile
): ProfileOutcome => {
  const hasExperience = (profile.experience?.length ?? 0) > 0 ||
    (profile.positions?.length ?? 0) > 0;
  const hasSkills = (profile.skills?.length ?? 0) > 0 ||
    (profile.skill_list?.length ?? 0) > 0;
  const hasAbout = !!(profile.about || profile.summary);
  const experienceCount = (profile.experience?.length ?? 0) + (profile.positions?.length ?? 0);
  const skillsCount = (profile.skills?.length ?? 0) + (profile.skill_list?.length ?? 0);

  // AUTO_FULL: Rich LinkedIn data - can score with high confidence
  if (hasLinkedInData && hasExperience && (hasSkills || hasAbout)) {
    return {
      type: 'auto_full',
      confidence: experienceCount >= 2 && skillsCount >= 5 ? 'high' : 'medium',
      canAutoScore: true,
      source: 'linkedin',
      reason: 'Complete LinkedIn profile with work history and skills'
    };
  }

  // AUTO_PARTIAL: Some LinkedIn OR enrichment data - can score with low confidence
  if ((hasLinkedInData || hasEnrichmentData) && (hasExperience || skillsCount >= 3)) {
    const sources = [];
    if (hasLinkedInData) sources.push('LinkedIn');
    if (hasEnrichmentData) sources.push('web enrichment');

    return {
      type: 'auto_partial',
      confidence: 'low',
      canAutoScore: true,
      source: sources.join(' + '),
      reason: `Partial data from ${sources.join(' and ')}. Score will have lower confidence.`
    };
  }

  // MANUAL_REQUIRED: No usable data from any source
  return {
    type: 'manual_required',
    confidence: 'none',
    canAutoScore: false,
    source: 'manual_input',
    reason: 'No public data available. Manual input required.'
  };
};

/**
 * Helper: Scrape a single LinkedIn URL variant via BrightData
 */
/**
 * Helper: Extract profile data from HTML using AI (for Tiers 1-3)
 */
const extractProfileFromHtmlWithAi = async (html: string, url: string): Promise<BrightDataProfile | null> => {
  // Pre-filter: Check if this is an authwall or security check
  const authwallKeywords = [
    'authwall', 'login', 'sign in', 'security check', 'challenge',
    'please enter the characters', 'captcha', 'robot', 'unusual activity',
    'LinkedIn | Log In', 'join linkedin'
  ];

  const isAuthwall = authwallKeywords.some(keyword =>
    html.toLowerCase().includes(keyword.toLowerCase())
  );

  if (isAuthwall) {
    if (process.env.NODE_ENV === 'development') {
      const match = authwallKeywords.find(k => html.toLowerCase().includes(k.toLowerCase()));
      console.warn(`[Scraper] 🛡️ Detected authwall/security check (${match}), skipping AI extraction`);
    }
    return null;
  }

  // Ensure we have enough content to actually be a profile
  if (html.length < 2500) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Scraper] ⚠️ Content too short (', html.length, 'chars), skipping AI extraction');
    }
    return null;
  }

  try {
    const prompt = `
      Extract structured LinkedIn profile data from the following HTML content.
      Only extract data if it looks like a real person's profile.
      If it's a login page or error message, return null.

      URL: ${url}
      HTML content snippet:
      ${html.substring(0, 15000)}
    `;

    const response = await callOpenRouter(prompt, {
      type: "object",
      properties: {
        full_name: { type: "string" },
        headline: { type: "string" },
        summary: { type: "string" },
        location: { type: "string" },
        current_company_name: { type: "string" },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              start_date: { type: "string" },
              end_date: { type: "string" },
              description: { type: "string" }
            }
          }
        },
        skills: { type: "array", items: { type: "string" } },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              school: { type: "string" },
              degree: { type: "string" },
              start_date: { type: "string" },
              end_date: { type: "string" }
            }
          }
        }
      }
    });

    const cleanedJson = response.replace(/```json\n?|\n?```/g, '').trim();
    if (cleanedJson === 'null' || cleanedJson === '{}') return null;
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('[BrightData] AI Extraction failed:', error);
    return null;
  }
};

/**
 * Helper: Scrape a single LinkedIn URL variant via Progressive Four-Tier Strategy
 */
const scrapeSingleLinkedInUrl = async (url: string, brightDataKey: string): Promise<BrightDataProfile | null> => {
  const proxyBase = '/api/brightdata';

  if (process.env.NODE_ENV === 'development') {
    console.log('[Scraper] Starting 4-Tier Strategy for:', url);
  }

  // ===== TIER 1: Simple WebFetch (built-in proxy or direct) =====
  try {
    if (process.env.NODE_ENV === 'development') console.log('[Scraper] Tier 1: Simple WebFetch...');
    // Use body for URL as preferred by backend to avoid 999/414 query length errors
    const t1Response = await fetch(`${proxyBase}?action=scrape`, {
      method: 'POST',
      headers: { 'X-BrightData-Key': brightDataKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, tier: '1' })
    });

    if (t1Response.ok) {
      const { content } = await t1Response.json();
      if (content && content.length > 2500) {
        const profile = await extractProfileFromHtmlWithAi(content, url);
        if (profile && profile.full_name) {
          if (process.env.NODE_ENV === 'development') console.log('[Scraper] ✅ Tier 1 Success!');
          return profile;
        }
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Scraper] Info: Tier 1 direct fetch skipped (expected for protected pages)');
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  // ===== TIER 2: Customized Request (Browser Headers) =====
  try {
    if (process.env.NODE_ENV === 'development') console.log('[Scraper] Tier 2: Customized Request...');
    if (process.env.NODE_ENV === 'development') console.log('[Scraper] Tier 2: Customized Request...');
    const t2Response = await fetch(`${proxyBase}?action=scrape`, {
      method: 'POST',
      headers: { 'X-BrightData-Key': brightDataKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, tier: '2' })
    });

    if (t2Response.ok) {
      const { content } = await t2Response.json();
      if (content && content.length > 2500) {
        const profile = await extractProfileFromHtmlWithAi(content, url);
        if (profile && profile.full_name) {
          if (process.env.NODE_ENV === 'development') console.log('[Scraper] ✅ Tier 2 Success!');
          return profile;
        }
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Scraper] Info: Tier 2 browser simulation skipped (likely authwall)');
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1500));

  // ===== TIER 3: Bright Data Web Unlocker (Scrape API) =====
  try {
    if (process.env.NODE_ENV === 'development') console.log('[Scraper] Tier 3: Bright Data Web Unlocker...');
    if (process.env.NODE_ENV === 'development') console.log('[Scraper] Tier 3: Bright Data Web Unlocker...');
    const t3Response = await fetch(`${proxyBase}?action=scrape`, {
      method: 'POST',
      headers: { 'X-BrightData-Key': brightDataKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, tier: '3' })
    });

    if (t3Response.ok) {
      const { content } = await t3Response.json();
      if (content && content.length > 500) {
        const profile = await extractProfileFromHtmlWithAi(content, url);
        if (profile && profile.full_name) {
          if (process.env.NODE_ENV === 'development') console.log('[Scraper] ✅ Tier 3 Success!');
          return profile;
        }
      }
    } else if (t3Response.status === 401) {
      if (process.env.NODE_ENV === 'development') console.warn('[Scraper] Tier 3 Skipped: Invalid BrightData API Key');
    }
  } catch (e) { console.warn('[Scraper] Tier 3 request failed'); }

  // ===== TIER 4: Bright Data Dataset API (Legacy/Highest Reliability) =====
  try {
    if (process.env.NODE_ENV === 'development') console.log('[Scraper] Tier 4: Bright Data Dataset API...');
    // Fix: pass url as query param for trigger action
    const triggerResponse = await fetch(
      `${proxyBase}?action=trigger&url=${encodeURIComponent(url)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BrightData-Key': brightDataKey
        }
      }
    );

    if (!triggerResponse.ok) return null;

    const triggerResult = await triggerResponse.json();
    const snapshotId = triggerResult.snapshot_id;
    if (!snapshotId) return null;

    // Speed up polling in test environment to avoid timeouts
    const isTest = process.env.NODE_ENV === 'test';
    const maxAttempts = isTest ? 5 : 15;
    const pollInterval = isTest ? 100 : 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      const progressResponse = await fetch(
        `${proxyBase}?action=progress&snapshot_id=${snapshotId}`,
        { headers: { 'X-BrightData-Key': brightDataKey } }
      );
      if (!progressResponse.ok) continue;

      const progress = await progressResponse.json();
      if (progress.status === 'ready' && progress.records > 0) {
        const snapshotResponse = await fetch(
          `${proxyBase}?action=snapshot&snapshot_id=${snapshotId}`,
          { headers: { 'X-BrightData-Key': brightDataKey } }
        );
        if (!snapshotResponse.ok) return null;
        const data = await snapshotResponse.json();
        // Handle potential array wrapping
        const profiles: BrightDataProfile[] = Array.isArray(data) ? data : [data];
        if (profiles.length > 0) {
          if (process.env.NODE_ENV === 'development') console.log('[Scraper] ✅ Tier 4 Success!');
          return profiles[0];
        }
      }
      if (progress.status === 'failed') break;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[Scraper] Tier 4 error:', error);
  }

  return null;
};

/**
 * Scrape LinkedIn profile using BrightData API with multi-URL fallback strategy
 * Tries: main URL → /details/experience/ → /details/skills/
 */
const scrapeLinkedInWithBrightData = async (url: string, jobContext: string = 'Software Engineer'): Promise<string> => {
  const brightDataKey = localStorage.getItem('BRIGHTDATA_API_KEY') || getEnv('BRIGHTDATA_API_KEY');

  if (!brightDataKey) {
    throw new Error("BrightData API Key is missing. Please configure it in Settings or use Quick Paste.");
  }

  // ===== NORMALIZE URL FIRST =====
  // Handle mobile URLs, tracking params, localized domains, etc.
  const normalizeResult = normalizeLinkedInUrl(url);

  if (normalizeResult.type === 'invalid') {
    throw new Error("Invalid LinkedIn URL format. Please enter a valid profile URL (linkedin.com/in/username).");
  }

  // Use the normalized URL
  const normalizedUrl = normalizeResult.normalized;

  if (process.env.NODE_ENV === 'development' && normalizeResult.wasModified) {
    console.log('[BrightData] URL normalized:', url, '->', normalizedUrl);
  }

  // ===== MULTI-URL ENRICHMENT PIPELINE =====
  // Strategy: Try multiple LinkedIn URL variants and merge results
  const urlsToTry: string[] = [];
  const attemptedUrls: string[] = [];

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] ===== MULTI-URL ENRICHMENT PIPELINE =====');
      console.log('[BrightData] Base URL:', normalizedUrl);
    }

    // Build URL variants
    // Optimization: Only use the main profile URL to save costs (no variants)
    const baseUrl = normalizedUrl.replace(/\/$/, ''); // Remove trailing slash

    // Main profile only
    urlsToTry.push(baseUrl);

    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] Will try', urlsToTry.length, 'URL (optimized strategy)');
    }

    const scrapedProfiles: BrightDataProfile[] = [];

    // Try each URL variant
    for (const urlVariant of urlsToTry) {
      attemptedUrls.push(urlVariant);

      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Trying:', urlVariant);
      }

      const profile = await scrapeSingleLinkedInUrl(urlVariant, brightDataKey);

      if (profile) {
        scrapedProfiles.push(profile);

        // Assess quality
        const quality = assessDataQuality(profile);

        if (process.env.NODE_ENV === 'development') {
          console.log('[BrightData] Success! Quality score:', quality.score, '/ 5');
          console.log('[BrightData] Missing:', quality.missing.length > 0 ? quality.missing.join(', ') : 'none');
        }

        // If we got rich data, we can stop early
        if (quality.isRich) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[BrightData] ✅ Rich data found, stopping early');
          }
          break;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[BrightData] ⚠️ Minimal data, trying next variant...');
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[BrightData] ❌ Failed, trying next variant...');
        }
      }
    }

    // Merge all scraped profiles (or create empty profile if nothing from LinkedIn)
    let mergedProfile: BrightDataProfile = {};
    let finalQuality = { isRich: false, score: 0, missing: ['work experience', 'skills', 'about', 'education'] };

    if (scrapedProfiles.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Merging', scrapedProfiles.length, 'profile(s)...');
      }

      mergedProfile = mergeLinkedInProfiles(scrapedProfiles);
      finalQuality = assessDataQuality(mergedProfile);

      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Final merged quality score:', finalQuality.score, '/ 5');
        console.log('[BrightData] Still missing:', finalQuality.missing.length > 0 ? finalQuality.missing.join(', ') : 'none');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] ⚠️ No data from any LinkedIn URL');
        console.log('[BrightData] Attempted:', attemptedUrls);
      }

      // Extract name from URL for enrichment
      const urlMatch = url.match(/\/in\/([^/]+)/);
      const slug = urlMatch ? urlMatch[1] : '';

      // Decode URL-encoded characters (e.g., %C3%B8 → ø)
      const decodedSlug = decodeURIComponent(slug);

      // Convert slug to name (e.g., "daniel-borre-bøbel-61b421142" → "Daniel Borre Bøbel")
      const nameParts = decodedSlug
        .replace(/-\d+$/, '') // Remove trailing numbers (LinkedIn ID)
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1));

      mergedProfile = {
        name: nameParts.join(' '),
        url: url
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Extracted name from URL:', mergedProfile.name);
      }
    }

    // Convert merged profile to markdown
    const finalProfile = mergedProfile;

    // ===== ENRICHMENT PIPELINE: Try to enhance sparse OR empty profiles =====
    const needsEnrichment = scrapedProfiles.length === 0 || (!finalQuality.isRich && finalQuality.missing.length > 0);
    let enriched: EnrichedProfile | null = null;

    if (needsEnrichment) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Profile is sparse, attempting web enrichment...');
      }

      try {
        const enrichmentResult = await enrichCandidatePersona({
          fullName: mergedProfile.name || mergedProfile.full_name || '',
          linkedinUrl: url,
          jobContext
        });

        if (enrichmentResult.status === 'ok') {
          const persona = enrichmentResult.persona;
          // Map V2 persona to legacy EnrichedProfile format for compatibility with existing merge logic
          enriched = {
            about: persona.headline || '',
            skills: persona.skills,
            experiences: persona.pastRoles.map(role => ({
              title: role.title,
              company: role.company,
              startYear: role.startYear || undefined,
              endYear: role.endYear || undefined,
              description: ''
            })),
            enrichmentSources: Array.from(new Set(persona.evidence.map(e => {
              try { return new URL(e.sourceUrl).hostname; } catch { return 'web'; }
            }))),
            evidenceUrls: Array.from(new Set(persona.evidence.map(e => e.sourceUrl)))
          };

          // Merge enriched data into profile
          if (process.env.NODE_ENV === 'development') {
            console.log('[BrightData] ✅ Enrichment successful!');
            console.log('[BrightData] Added', enriched.experiences.length, 'experiences from:', enriched.enrichmentSources.join(', '));
            console.log('[BrightData] Added', enriched.skills.length, 'skills from web sources');
          }

          // Append enriched experiences to profile
          if (enriched.experiences.length > 0 && (!finalProfile.experience || finalProfile.experience.length === 0)) {
            finalProfile.experience = enriched.experiences.map(exp => ({
              title: exp.title,
              company: exp.company,
              start_date: exp.startYear ? `${exp.startYear}` : undefined,
              end_date: exp.endYear === 'present' ? 'Present' : exp.endYear ? `${exp.endYear}` : undefined,
              description: exp.description
            }));
          }

          // Append enriched skills
          if (enriched.skills.length > 0) {
            const existingSkills = finalProfile.skills || finalProfile.skill_list || [];
            finalProfile.skills = Array.from(new Set([...existingSkills, ...enriched.skills]));
          }

          // Use enriched about if we don't have one
          if (!finalProfile.about && !finalProfile.summary && enriched.about) {
            finalProfile.about = enriched.about;
          }

          // Mark profile as enriched
          (finalProfile as any).enrichmentSources = enriched.enrichmentSources;
          (finalProfile as any).enrichmentUrls = enriched.evidenceUrls;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[BrightData] ⚠️ Enrichment found no additional data:', enrichmentResult.message);
          }
        }
      } catch (enrichError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[BrightData] Enrichment failed:', enrichError);
        }
      }
    }

    // ===== DECISION LOGIC: Route profile based on data quality (Runs for ALL profiles) =====
    const profileOutcome = decideProfileOutcome(
      scrapedProfiles.length > 0,
      enriched ? true : false,
      finalProfile
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] Profile outcome:', profileOutcome.type);
      console.log('[BrightData] Confidence:', profileOutcome.confidence);
    }

    // For manual_required profiles, return a special markdown format
    if (profileOutcome.type === 'manual_required') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Creating manual-input stub profile');
      }

      return (
        `**Name:** ${finalProfile.name || 'Unknown'}\n` +
        `**LinkedIn:** ${url}\n\n` +
        `---\n` +
        `**STATUS:** MANUAL_INPUT_REQUIRED\n\n` +
        `❌ No public data found for this profile.\n\n` +
        `**Next steps:**\n` +
        `Please use Quick Paste to manually enter:\n` +
        `• Current role + company\n` +
        `• 1-2 past roles\n` +
        `• 5-10 key skills\n`
      );
    }

    // Convert merged profile to markdown
    let markdown = brightDataProfileToMarkdown(finalProfile);

    // Add enrichment notice if applicable
    if (enriched && (finalProfile as any).enrichmentSources && (finalProfile as any).enrichmentSources.length > 0) {
      const sources = (finalProfile as any).enrichmentSources;
      const notice = `\n\n---\n**📊 Profile Enrichment Notice**\n\n` +
        `This profile was enhanced with data from multiple public sources:\n` +
        `- LinkedIn (partial data)\n` +
        sources.map((s: string) => `- ${s}`).join('\n') + '\n\n' +
        `*For higher accuracy, you can paste the candidate's full CV using "Quick Paste".*\n`;

      markdown += notice;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] ✅ Successfully extracted profile for:', finalProfile.name || finalProfile.full_name);
      console.log('[BrightData] Markdown length:', markdown.length, 'characters');
    }

    return markdown;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("[BrightData] Scraping Error:", error);
    }
    throw error;
  }
};

/**
 * Generic scraper - routes to BrightData for LinkedIn, Firecrawl for others
 */
export const scrapeUrlContent = async (url: string, jobContext: string = 'Software Development'): Promise<string> => {
  // Route LinkedIn URLs to BrightData
  if (isLinkedInUrl(url)) {
    return scrapeLinkedInWithBrightData(url, jobContext);
  }

  // Check for other blocked domains
  if (isFirecrawlBlockedDomain(url)) {
    throw new Error(`This social media site is not supported. Use "Quick Paste" to copy/paste profile content instead.`);
  }

  // Use Firecrawl for non-LinkedIn URLs
  const firecrawlKey = localStorage.getItem('FIRECRAWL_API_KEY') || getEnv('FIRECRAWL_API_KEY');

  if (!firecrawlKey) {
    throw new Error("Firecrawl API Key is missing. Please configure it in Settings.");
  }

  try {
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        pageOptions: {
          onlyMainContent: true
        }
      })
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.includes('not currently supported')) {
          throw new Error(`This website is not supported. Use "Quick Paste" to copy/paste content instead.`);
        }
      } catch {
        // If parsing fails, continue with generic error
      }
      throw new Error(`Firecrawl Error (${scrapeResponse.status}): Site not supported. Use Quick Paste instead.`);
    }

    const json: FirecrawlResponse = await scrapeResponse.json();

    if (!json.success || !json.data?.markdown) {
      throw new Error(json.error || "Failed to retrieve content from URL");
    }

    return json.data.markdown;

  } catch (error) {
    console.error("Scraping Error:", error);
    throw error;
  }
};

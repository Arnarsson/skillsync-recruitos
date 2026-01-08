/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { enrichSparseProfile, type EnrichedProfile } from './enrichmentService';

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
const scrapeSingleLinkedInUrl = async (url: string, brightDataKey: string): Promise<BrightDataProfile | null> => {
  const proxyBase = '/api/brightdata';

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] Attempting scrape:', url);
    }

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

    if (!triggerResponse.ok) {
      const errorData = await triggerResponse.json().catch(() => ({}));
      if (process.env.NODE_ENV === 'development') {
        console.error('[BrightData] Trigger error for', url, ':', errorData);
      }
      return null; // Fail gracefully
    }

    const triggerResult = await triggerResponse.json();
    const snapshotId = triggerResult.snapshot_id;

    if (!snapshotId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[BrightData] No snapshot ID returned for:', url);
      }
      return null;
    }

    // Poll for results (30 seconds max per URL)
    const maxAttempts = 15; // 30 seconds
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const progressResponse = await fetch(
        `${proxyBase}?action=progress&snapshot_id=${snapshotId}`,
        { headers: { 'X-BrightData-Key': brightDataKey } }
      );

      if (!progressResponse.ok) continue;

      const progress = await progressResponse.json();

      if (progress.status === 'ready') {
        if (progress.records === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[BrightData] No records found for:', url);
          }
          return null;
        }

        const snapshotResponse = await fetch(
          `${proxyBase}?action=snapshot&snapshot_id=${snapshotId}`,
          { headers: { 'X-BrightData-Key': brightDataKey } }
        );

        if (!snapshotResponse.ok) return null;

        const profiles: BrightDataProfile[] = await snapshotResponse.json();
        return profiles.length > 0 ? profiles[0] : null;
      }

      if (progress.status === 'failed') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[BrightData] Scrape failed for:', url);
        }
        return null;
      }
    }

    // Timeout
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BrightData] Timeout for:', url);
    }
    return null;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[BrightData] Error scraping', url, ':', error);
    }
    return null;
  }
};

/**
 * Scrape LinkedIn profile using BrightData API with multi-URL fallback strategy
 * Tries: main URL → /details/experience/ → /details/skills/
 */
const scrapeLinkedInWithBrightData = async (url: string): Promise<string> => {
  const brightDataKey = getEnv('VITE_BRIGHTDATA_API_KEY') || localStorage.getItem('BRIGHTDATA_API_KEY');

  if (!brightDataKey) {
    throw new Error("BrightData API Key is missing. Please configure it in Settings or use Quick Paste.");
  }

  // ===== MULTI-URL ENRICHMENT PIPELINE =====
  // Strategy: Try multiple LinkedIn URL variants and merge results
  const urlsToTry: string[] = [];
  const attemptedUrls: string[] = [];

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] ===== MULTI-URL ENRICHMENT PIPELINE =====');
      console.log('[BrightData] Base URL:', url);
    }

    // Build URL variants
    let baseUrl = url.replace(/\/$/, ''); // Remove trailing slash

    // Main profile
    urlsToTry.push(baseUrl);

    // /details/experience/ variant
    if (!baseUrl.includes('/details/')) {
      urlsToTry.push(`${baseUrl}/details/experience/`);
    }

    // /details/skills/ variant
    if (!baseUrl.includes('/details/')) {
      urlsToTry.push(`${baseUrl}/details/skills/`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] Will try', urlsToTry.length, 'URL variants');
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
    let finalProfile = mergedProfile;

    // ===== ENRICHMENT PIPELINE: Try to enhance sparse OR empty profiles =====
    const needsEnrichment = scrapedProfiles.length === 0 || (!finalQuality.isRich && finalQuality.missing.length > 0);
    let enriched: EnrichedProfile | null = null;

    if (needsEnrichment) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Profile is sparse, attempting web enrichment...');
      }

      try {
        enriched = await enrichSparseProfile({
          fullName: mergedProfile.name || mergedProfile.full_name || '',
          currentCompany: mergedProfile.current_company?.name || mergedProfile.current_company_name || mergedProfile.company,
          locationHint: mergedProfile.city || mergedProfile.location || mergedProfile.region
        });

        if (enriched) {
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
            console.log('[BrightData] ⚠️ Enrichment found no additional data');
          }
        }
      } catch (enrichError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[BrightData] Enrichment failed:', enrichError);
        }
      }
    }

    // ===== DECISION LOGIC: Route profile based on data quality =====
    const profileOutcome = decideProfileOutcome(
      scrapedProfiles.length > 0,
      enriched ? true : false,
      finalProfile
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('[BrightData] Profile outcome:', profileOutcome.type);
      console.log('[BrightData] Confidence:', profileOutcome.confidence);
      console.log('[BrightData] Can auto-score:', profileOutcome.canAutoScore);
    }

    // For manual_required profiles, return a special markdown format
    if (profileOutcome.type === 'manual_required') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BrightData] Creating manual-input stub profile');
      }

      // Return special markdown that UI can detect and handle
      return (
        `**Name:** ${finalProfile.name || 'Unknown'}\n` +
        `**LinkedIn:** ${url}\n\n` +
        `---\n` +
        `**STATUS:** MANUAL_INPUT_REQUIRED\n\n` +
        `❌ No public data found for this profile.\n\n` +
        `**What we tried:**\n` +
        `• LinkedIn scraping (${attemptedUrls.length} URLs)\n` +
        `• Web enrichment: ${needsEnrichment ? 'Yes' : 'No'}\n\n` +
        `**Next steps:**\n` +
        `Please use Quick Paste to manually enter:\n` +
        `• Current role + company\n` +
        `• 1-2 past roles\n` +
        `• 5-10 key skills\n\n` +
        `This will allow us to generate a preliminary score.\n\n` +
        `---\n` +
        `**Attempted URLs:**\n${attemptedUrls.map(u => `- ${u}`).join('\n')}`
      );
    }

    // Add profile outcome metadata
    (finalProfile as any).dataSource = profileOutcome.source;
    (finalProfile as any).scoreConfidence = profileOutcome.confidence;
    (finalProfile as any).autoDataAvailable = true;

    if (process.env.NODE_ENV === 'development') {
      const qualityCheck = assessDataQuality(finalProfile);
      console.log('[BrightData] ✅ Final data check passed');
      console.log('[BrightData] Quality score:', qualityCheck.score, '/ 5');
      console.log('[BrightData] Has name:', !!finalProfile.name);
      console.log('[BrightData] Has experience:', !!(finalProfile.experience?.length || finalProfile.positions?.length));
      console.log('[BrightData] Has skills:', !!(finalProfile.skills?.length));
    }

    const profiles: BrightDataProfile[] = [finalProfile];

        if (profiles && profiles.length > 0) {
          const profile = profiles[0];

          if (process.env.NODE_ENV === 'development') {
            console.log('[BrightData] ===== RAW PROFILE ANALYSIS =====');

            // All available keys in response
            console.log('[BrightData] Available keys:', Object.keys(profile));

            // Full profile dump for deep analysis
            console.log('[BrightData] Full profile data:', JSON.stringify(profile, null, 2));

            // Field presence analysis with variations
            const fieldPresence = {
              hasName: !!profile.name || !!profile.full_name,
              hasPosition: !!profile.position || !!profile.headline || !!profile.title,
              hasAbout: !!profile.about || !!profile.summary || !!profile.bio,
              hasExperience: !!profile.experience || !!profile.positions,
              experienceCount: (profile.experience || profile.positions || []).length,
              hasEducation: !!profile.education || !!profile.schools || !!profile.educations_details,
              educationCount: (profile.education || profile.schools || []).length,
              hasSkills: !!profile.skills || !!profile.skill_list,
              skillsCount: (profile.skills || profile.skill_list || []).length,
              hasCertifications: !!profile.certifications,
              certificationsCount: (profile.certifications || []).length,
              hasCourses: !!profile.courses,
              coursesCount: (profile.courses || []).length,
              hasProfessionalNetwork: !!profile.people_also_viewed,
              networkCount: (profile.people_also_viewed || []).length,
              hasAvatar: !!profile.avatar && !profile.default_avatar,
              hasMetadata: !!profile.linkedin_id || !!profile.url
            };
            console.log('[BrightData] Field presence:', fieldPresence);

            // Raw data size analysis
            const profileJson = JSON.stringify(profile);
            console.log('[BrightData] Raw JSON size:', profileJson.length, 'characters');

            // Data richness score (out of 10 total fields now)
            const richnessScore = Object.keys(fieldPresence)
              .filter(k => k.startsWith('has') && fieldPresence[k as keyof typeof fieldPresence]).length;
            console.log('[BrightData] Data richness score:', richnessScore, '/ 10 fields');

            // Potential dataset limitation detection
            if (richnessScore < 3) {
              console.warn('[BrightData] ⚠️ LOW DATA RICHNESS - Dataset may be limited or profile is private');
              console.warn('[BrightData] Consider:');
              console.warn('  1. Verify dataset ID supports full profile extraction');
              console.warn('  2. Check if LinkedIn profile is public');
              console.warn('  3. Review BrightData dashboard for dataset capabilities');
            } else if (richnessScore >= 5) {
              console.log('[BrightData] ✅ HIGH DATA RICHNESS - Good dataset configuration');
            }
          }

          // Enhanced data validation with graceful degradation
          const hasMinimalData = profile.name || profile.full_name ||
            profile.position || profile.headline;
          const hasRichData = profile.about || profile.summary ||
            (profile.experience && profile.experience.length > 0) ||
            (profile.positions && profile.positions.length > 0) ||
            (profile.skills && profile.skills.length > 0) ||
            (profile.skill_list && profile.skill_list.length > 0) ||
            (profile.certifications && profile.certifications.length > 0) ||
            (profile.courses && profile.courses.length > 0);

          // No data at all - hard error
          if (!hasMinimalData) {
            throw new Error(
              'BrightData returned empty profile data.\n\n' +
              'Possible causes:\n' +
              '• LinkedIn profile is private/restricted\n' +
              '• Dataset "gd_l1viktl72bvl7bjuj0" has limited extraction capabilities\n' +
              '• Profile URL invalid or redirected\n\n' +
              'Recommendation: Use Quick Paste to manually enter profile data, or ' +
              'check BrightData dashboard to verify dataset capabilities.'
            );
          }

          // Minimal data but not rich - graceful degradation with warning
          if (hasMinimalData && !hasRichData) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[BrightData] ⚠️ MINIMAL DATA EXTRACTED');
              console.warn('Only basic fields (name, position) were extracted.');
              console.warn('Missing: about, experience, education, skills');
              console.warn('This may indicate:');
              console.warn('  - Dataset configuration limits extraction depth');
              console.warn('  - Profile has privacy restrictions');
              console.warn('  - Consider upgrading to a full LinkedIn People dataset');
            }

            // Continue with minimal data but add notice
            const markdown = brightDataProfileToMarkdown(profile);
            const notice = '\n\n---\n*⚠️ Note: Only basic profile information was available. ' +
              'Full details (experience, skills, etc.) could not be extracted.*\n';

            if (process.env.NODE_ENV === 'development') {
              console.log('[BrightData] Partial extraction for:', profile.name || profile.full_name);
              console.log('[BrightData] Markdown length:', markdown.length, 'characters');
            }

            return markdown + notice;
          }

          // Success case - full or rich data extracted
          let markdown = brightDataProfileToMarkdown(profile);

          // Add enrichment notice if profile was enhanced from web sources
          if ((profile as any).enrichmentSources && (profile as any).enrichmentSources.length > 0) {
            const sources = (profile as any).enrichmentSources;
            const notice = `\n\n---\n**📊 Profile Enrichment Notice**\n\n` +
              `This profile was enhanced with data from multiple public sources:\n` +
              `- LinkedIn (partial data)\n` +
              sources.map((s: string) => `- ${s}`).join('\n') + '\n\n' +
              `*For higher accuracy, you can paste the candidate's full CV using "Quick Paste".*\n`;

            markdown += notice;
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('[BrightData] ✅ Successfully extracted profile for:', profile.name || profile.full_name);
            console.log('[BrightData] Markdown length:', markdown.length, 'characters');
            console.log('[BrightData] Markdown preview:', markdown.substring(0, 500));
          }

          return markdown;
        }
        throw new Error('No profile data returned from merged profiles. The profile may be completely empty.');

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
export const scrapeUrlContent = async (url: string): Promise<string> => {
  // Route LinkedIn URLs to BrightData
  if (isLinkedInUrl(url)) {
    return scrapeLinkedInWithBrightData(url);
  }

  // Check for other blocked domains
  if (isFirecrawlBlockedDomain(url)) {
    throw new Error(`This social media site is not supported. Use "Quick Paste" to copy/paste profile content instead.`);
  }

  // Use Firecrawl for non-LinkedIn URLs
  const firecrawlKey = getEnv('VITE_FIRECRAWL_API_KEY') || localStorage.getItem('FIRECRAWL_API_KEY');

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

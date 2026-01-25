/**
 * LinkedIn URL Normalizer
 * Handles various LinkedIn URL formats and normalizes them for consistent behavior
 */

export interface LinkedInUrlResult {
  normalized: string;
  type: 'person' | 'company' | 'invalid';
  wasModified: boolean;
  username?: string; // For person profiles
  companyId?: string; // For company pages
  originalFormat?: string; // Description of detected format
}

// Query parameters that should be stripped from LinkedIn URLs
const TRACKING_PARAMS = [
  'trk',
  'trkEmail',
  'lipi',
  'licu',
  'locale',
  'midToken',
  'midSig',
  'trackingId',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'originalSubdomain',
  'miniProfileUrn',
];

// Mobile and alternative LinkedIn domains to normalize
const LINKEDIN_DOMAINS = [
  'm.linkedin.com',
  'www.linkedin.com',
  'linkedin.com',
  'de.linkedin.com',
  'uk.linkedin.com',
  'fr.linkedin.com',
  'es.linkedin.com',
  'pt.linkedin.com',
  'it.linkedin.com',
  'nl.linkedin.com',
  'se.linkedin.com',
  'no.linkedin.com',
  'dk.linkedin.com',
  'fi.linkedin.com',
  'pl.linkedin.com',
  'br.linkedin.com',
  'cn.linkedin.com',
  'jp.linkedin.com',
  'in.linkedin.com',
  'au.linkedin.com',
];

/**
 * Check if a URL is a LinkedIn URL
 */
export function isLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
  } catch {
    return false;
  }
}

/**
 * Normalize a LinkedIn URL to a consistent format
 *
 * Handles:
 * - Mobile URLs (m.linkedin.com)
 * - Localized URLs (de.linkedin.com, etc.)
 * - Tracking parameters (?trk=, ?lipi=, etc.)
 * - Sales Navigator URLs
 * - Admin/recruiter URLs
 * - Various path formats
 */
export function normalizeLinkedInUrl(url: string): LinkedInUrlResult {
  // Handle empty or whitespace
  if (!url || !url.trim()) {
    return {
      normalized: '',
      type: 'invalid',
      wasModified: false,
    };
  }

  url = url.trim();

  // Add https:// if missing protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Check if it looks like a LinkedIn URL
    if (url.includes('linkedin.com')) {
      url = 'https://' + url;
    } else {
      return {
        normalized: url,
        type: 'invalid',
        wasModified: false,
      };
    }
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check if it's a LinkedIn domain
    if (!hostname.includes('linkedin.com')) {
      return {
        normalized: url,
        type: 'invalid',
        wasModified: false,
      };
    }

    let wasModified = false;
    let originalFormat = 'standard';

    // Detect original format
    if (hostname.startsWith('m.')) {
      originalFormat = 'mobile';
    } else if (LINKEDIN_DOMAINS.some(d => hostname === d && d !== 'www.linkedin.com' && d !== 'linkedin.com')) {
      originalFormat = 'localized';
    }

    // Normalize domain to www.linkedin.com
    if (hostname !== 'www.linkedin.com') {
      parsed.hostname = 'www.linkedin.com';
      wasModified = true;
    }

    // Remove tracking parameters
    const paramsToRemove: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.some(param => key.toLowerCase().includes(param.toLowerCase()))) {
        paramsToRemove.push(key);
      }
    });

    for (const param of paramsToRemove) {
      parsed.searchParams.delete(param);
      wasModified = true;
    }

    // Get the path for analysis
    const path = parsed.pathname;

    // Handle Sales Navigator URLs
    // /sales/lead/{id} or /sales/people/{id}
    if (path.includes('/sales/')) {
      originalFormat = 'sales-navigator';
      const leadMatch = path.match(/\/sales\/(?:lead|people)\/([^/?]+)/);
      if (leadMatch) {
        // Sales Navigator IDs are different from regular LinkedIn usernames
        // We'll try to extract them but note that conversion is imperfect
        return {
          normalized: parsed.toString(),
          type: 'person',
          wasModified,
          originalFormat,
        };
      }
    }

    // Handle person profiles (/in/username)
    const personMatch = path.match(/\/in\/([^/?]+)/);
    if (personMatch) {
      const username = personMatch[1].toLowerCase();
      // Reconstruct clean URL
      parsed.pathname = `/in/${username}`;
      parsed.hash = '';

      // Remove any remaining search params if the URL was from an admin/special view
      if (parsed.search && wasModified) {
        parsed.search = '';
      }

      return {
        normalized: parsed.toString().replace(/\/$/, ''), // Remove trailing slash
        type: 'person',
        wasModified: wasModified || parsed.pathname !== path,
        username,
        originalFormat,
      };
    }

    // Handle company pages (/company/company-name)
    const companyMatch = path.match(/\/company\/([^/?]+)/);
    if (companyMatch) {
      const companyId = companyMatch[1].toLowerCase();
      // Reconstruct clean URL
      parsed.pathname = `/company/${companyId}`;
      parsed.hash = '';
      parsed.search = '';

      return {
        normalized: parsed.toString().replace(/\/$/, ''),
        type: 'company',
        wasModified: wasModified || parsed.pathname !== path,
        companyId,
        originalFormat,
      };
    }

    // Handle school pages (/school/school-name)
    const schoolMatch = path.match(/\/school\/([^/?]+)/);
    if (schoolMatch) {
      return {
        normalized: parsed.toString().replace(/\/$/, ''),
        type: 'company', // Treat schools similar to companies
        wasModified,
        originalFormat: 'school',
      };
    }

    // Handle recruiter/talent URLs
    if (path.includes('/talent/') || path.includes('/recruiter/')) {
      originalFormat = 'recruiter';
      return {
        normalized: parsed.toString(),
        type: 'person',
        wasModified,
        originalFormat,
      };
    }

    // Handle public profile URLs (/pub/name/id/id/id)
    const pubMatch = path.match(/\/pub\/([^/]+)/);
    if (pubMatch) {
      originalFormat = 'public-profile';
      return {
        normalized: parsed.toString(),
        type: 'person',
        wasModified,
        originalFormat,
      };
    }

    // If we can't determine the type, return as invalid
    return {
      normalized: parsed.toString(),
      type: 'invalid',
      wasModified,
    };

  } catch {
    return {
      normalized: url,
      type: 'invalid',
      wasModified: false,
    };
  }
}

/**
 * Validate a LinkedIn URL and return user-friendly error messages
 */
export interface LinkedInValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  error?: string;
  warning?: string;
  expectedType?: 'person' | 'company';
}

export function validateLinkedInUrl(
  url: string,
  expectedType?: 'person' | 'company'
): LinkedInValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: 'Please enter a LinkedIn URL',
    };
  }

  // Basic URL format check
  const trimmed = url.trim();
  if (!trimmed.includes('linkedin.com') && !trimmed.startsWith('http')) {
    return {
      isValid: false,
      error: "This doesn't look like a LinkedIn URL. Expected format: linkedin.com/in/username",
    };
  }

  const result = normalizeLinkedInUrl(trimmed);

  if (result.type === 'invalid') {
    // Check for common mistakes
    if (trimmed.includes('linkedin.com/jobs')) {
      return {
        isValid: false,
        error: 'This appears to be a job posting URL, not a profile URL.',
      };
    }
    if (trimmed.includes('linkedin.com/feed') || trimmed.includes('linkedin.com/notifications')) {
      return {
        isValid: false,
        error: 'This appears to be a LinkedIn feed URL. Please enter a profile URL (linkedin.com/in/username).',
      };
    }
    if (trimmed.includes('linkedin.com/search')) {
      return {
        isValid: false,
        error: 'This appears to be a search results URL. Please enter a specific profile URL.',
      };
    }

    return {
      isValid: false,
      error: "Couldn't parse this LinkedIn URL. Expected format: linkedin.com/in/username or linkedin.com/company/name",
    };
  }

  // Check type mismatch
  if (expectedType && result.type !== expectedType) {
    if (expectedType === 'person' && result.type === 'company') {
      return {
        isValid: true, // Still valid, just a warning
        normalizedUrl: result.normalized,
        warning: "This is a company page, not a person's profile. Did you mean to enter a person's LinkedIn URL?",
        expectedType,
      };
    }
    if (expectedType === 'company' && result.type === 'person') {
      return {
        isValid: true,
        normalizedUrl: result.normalized,
        warning: "This is a person's profile, not a company page. Did you mean to enter a company LinkedIn URL?",
        expectedType,
      };
    }
  }

  // Build result with any warnings
  const validationResult: LinkedInValidationResult = {
    isValid: true,
    normalizedUrl: result.normalized,
  };

  // Add warning if URL was modified
  if (result.wasModified) {
    const modifications: string[] = [];
    if (result.originalFormat === 'mobile') {
      modifications.push('mobile URL converted to desktop');
    }
    if (result.originalFormat === 'sales-navigator') {
      modifications.push('Sales Navigator URL detected');
    }
    if (result.originalFormat === 'recruiter') {
      modifications.push('Recruiter URL format detected');
    }

    if (modifications.length > 0 || result.normalized !== trimmed) {
      validationResult.warning = `URL normalized: ${modifications.join(', ') || 'tracking parameters removed'}`;
    }
  }

  return validationResult;
}

/**
 * Extract username from a LinkedIn person URL
 */
export function extractLinkedInUsername(url: string): string | null {
  const result = normalizeLinkedInUrl(url);
  return result.type === 'person' ? result.username || null : null;
}

/**
 * Extract company ID from a LinkedIn company URL
 */
export function extractLinkedInCompanyId(url: string): string | null {
  const result = normalizeLinkedInUrl(url);
  return result.type === 'company' ? result.companyId || null : null;
}

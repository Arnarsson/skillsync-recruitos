/**
 * Advanced Filters for Pipeline
 * Supports: experience level, company size, education type, and more
 */

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'staff';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type EducationType = 'degree' | 'bootcamp' | 'self-taught' | 'mixed';

export interface AdvancedFiltersState {
  // Experience levels
  experienceLevels: ExperienceLevel[];
  
  // Company size preferences
  companySizes: CompanySize[];
  
  // Education type
  educationTypes: EducationType[];
  
  // Additional filters
  minFollowers?: number;
  maxFollowers?: number;
  minRepos?: number;
  hasContributions?: boolean;
  languages?: string[];
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFiltersState = {
  experienceLevels: [],
  companySizes: [],
  educationTypes: [],
  hasContributions: undefined,
};

/**
 * Infer experience level from candidate data
 */
export function inferExperienceLevel(candidate: {
  createdAt?: string;
  followers?: number;
  topRepos?: any[];
}): ExperienceLevel {
  if (!candidate.createdAt) return 'mid';

  const createdDate = new Date(candidate.createdAt);
  const now = new Date();
  const yearsActive = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  const followers = candidate.followers || 0;
  const repoCount = candidate.topRepos?.length || 0;

  // Staff level: 8+ years, 1000+ followers, multiple significant repos
  if (yearsActive >= 8 && followers >= 1000 && repoCount >= 5) {
    return 'staff';
  }

  // Senior: 5+ years, 500+ followers, multiple repos
  if (yearsActive >= 5 && followers >= 500 && repoCount >= 3) {
    return 'senior';
  }

  // Mid: 2+ years or decent activity
  if (yearsActive >= 2 || followers >= 100 || repoCount >= 2) {
    return 'mid';
  }

  // Junior: Less than 2 years active
  return 'junior';
}

/**
 * Infer company size from company string
 */
export function inferCompanySize(company?: string): CompanySize | null {
  if (!company) return null;

  const lower = company.toLowerCase();

  // Enterprise indicators
  if (
    lower.includes('google') ||
    lower.includes('microsoft') ||
    lower.includes('apple') ||
    lower.includes('amazon') ||
    lower.includes('meta') ||
    lower.includes('netflix') ||
    lower.includes('ibm') ||
    lower.includes('oracle') ||
    lower.includes('intel') ||
    lower.includes('cisco') ||
    lower.includes('enterprise')
  ) {
    return 'enterprise';
  }

  // Large company indicators
  if (
    lower.includes('inc') ||
    lower.includes('corp') ||
    lower.includes('corporation') ||
    lower.includes('ltd') ||
    lower.includes('gmbh') ||
    lower.includes('ag') ||
    lower.includes('banking') ||
    lower.includes('financial') ||
    lower.includes('insurance')
  ) {
    return 'large';
  }

  // Startup indicators
  if (
    lower.includes('startup') ||
    lower.includes('venture') ||
    lower.includes('ai') ||
    lower.includes('labs') ||
    lower.includes('hq')
  ) {
    return 'startup';
  }

  // Default: medium-sized company
  return 'medium';
}

/**
 * Infer education type from candidate bio and activity
 */
export function inferEducationType(candidate: {
  bio?: string;
  topRepos?: any[];
}): EducationType | null {
  if (!candidate.bio) return null;

  const lower = candidate.bio.toLowerCase();

  // Bootcamp indicators
  if (
    lower.includes('bootcamp') ||
    lower.includes('coding school') ||
    lower.includes('general assembly') ||
    lower.includes('flatiron') ||
    lower.includes('springboard')
  ) {
    return 'bootcamp';
  }

  // Degree indicators
  if (
    lower.includes('phd') ||
    lower.includes('master') ||
    lower.includes('msc') ||
    lower.includes('bsc') ||
    lower.includes('bachelor') ||
    lower.includes('degree') ||
    lower.includes('university') ||
    lower.includes('college') ||
    lower.includes('graduated')
  ) {
    return 'degree';
  }

  // Self-taught indicators
  if (
    lower.includes('self-taught') ||
    lower.includes('self taught') ||
    lower.includes('autodidact') ||
    lower.includes('learning') ||
    lower.includes('developer')
  ) {
    return 'self-taught';
  }

  return null;
}

/**
 * Apply advanced filters to candidate list
 */
export function applyAdvancedFilters(
  candidates: any[],
  filters: Partial<AdvancedFiltersState>
): any[] {
  return candidates.filter((candidate) => {
    // Experience level filter
    if (filters.experienceLevels && filters.experienceLevels.length > 0) {
      const level = inferExperienceLevel(candidate);
      if (!filters.experienceLevels.includes(level)) {
        return false;
      }
    }

    // Company size filter
    if (filters.companySizes && filters.companySizes.length > 0) {
      const size = inferCompanySize(candidate.company);
      if (!filters.companySizes.includes(size as CompanySize)) {
        return false;
      }
    }

    // Education type filter
    if (filters.educationTypes && filters.educationTypes.length > 0) {
      const eduType = inferEducationType({
        bio: candidate.bio,
        topRepos: candidate.topRepos,
      });
      if (!filters.educationTypes.includes(eduType as EducationType)) {
        return false;
      }
    }

    // Followers filter
    if (filters.minFollowers !== undefined) {
      const followers = candidate.followers || 0;
      if (followers < filters.minFollowers) {
        return false;
      }
    }

    if (filters.maxFollowers !== undefined) {
      const followers = candidate.followers || 0;
      if (followers > filters.maxFollowers) {
        return false;
      }
    }

    // Repos filter
    if (filters.minRepos !== undefined) {
      const repoCount = candidate.public_repos || candidate.topRepos?.length || 0;
      if (repoCount < filters.minRepos) {
        return false;
      }
    }

    // Contributions filter
    if (filters.hasContributions !== undefined && filters.hasContributions === true) {
      // Check for activity signals (commits, repos, etc.)
      const hasActivity = (candidate.topRepos?.length || 0) > 0;
      if (!hasActivity) {
        return false;
      }
    }

    // Languages filter
    if (filters.languages && filters.languages.length > 0) {
      const candidateLanguages = (candidate.topRepos || [])
        .map((repo: any) => repo.language)
        .filter(Boolean)
        .map((lang: string) => lang.toLowerCase());

      const hasMatchingLanguage = filters.languages.some((lang) =>
        candidateLanguages.includes(lang.toLowerCase())
      );

      if (!hasMatchingLanguage) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get label for experience level
 */
export function getExperienceLevelLabel(level: ExperienceLevel): string {
  const labels: Record<ExperienceLevel, string> = {
    junior: 'Junior (0-2 years)',
    mid: 'Mid-level (2-5 years)',
    senior: 'Senior (5-8 years)',
    staff: 'Staff (8+ years)',
  };
  return labels[level];
}

/**
 * Get label for company size
 */
export function getCompanySizeLabel(size: CompanySize): string {
  const labels: Record<CompanySize, string> = {
    startup: 'Startup (<50)',
    small: 'Small (50-200)',
    medium: 'Medium (200-1000)',
    large: 'Large (1000-10000)',
    enterprise: 'Enterprise (10000+)',
  };
  return labels[size];
}

/**
 * Get label for education type
 */
export function getEducationTypeLabel(type: EducationType): string {
  const labels: Record<EducationType, string> = {
    degree: 'University Degree',
    bootcamp: 'Coding Bootcamp',
    'self-taught': 'Self-Taught',
    mixed: 'Mixed Education',
  };
  return labels[type];
}

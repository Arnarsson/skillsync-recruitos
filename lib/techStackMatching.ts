/**
 * Tech Stack Matching
 * 
 * Filter candidates by exact tech stack requirements.
 * Uses REAL data from GitHub repos and skills.
 * NO MOCK DATA.
 */

export interface TechStackFilter {
  required: string[];  // Must have ALL of these
  preferred: string[]; // Nice to have
  exclude: string[];   // Must NOT have these
}

export interface TechStackMatchResult {
  candidateId: string;
  matchScore: number;       // 0-100
  matchedRequired: string[];
  missingRequired: string[];
  matchedPreferred: string[];
  hasExcluded: string[];
  isFullMatch: boolean;     // All required skills present
}

/**
 * Normalize skill names for comparison
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase()
    .replace(/[.\-_]/g, '')
    .replace(/js$/i, 'javascript')
    .replace(/ts$/i, 'typescript')
    .trim();
}

/**
 * Check if candidate skill matches target skill (fuzzy)
 */
function skillMatches(candidateSkill: string, targetSkill: string): boolean {
  const normCandidate = normalizeSkill(candidateSkill);
  const normTarget = normalizeSkill(targetSkill);
  
  // Exact match
  if (normCandidate === normTarget) return true;
  
  // Contains match (for compound skills like "React Native")
  if (normCandidate.includes(normTarget) || normTarget.includes(normCandidate)) return true;
  
  // Common aliases
  const aliases: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
    'typescript': ['ts'],
    'react': ['reactjs', 'reactnative'],
    'vue': ['vuejs', 'vue3'],
    'angular': ['angularjs', 'angular2'],
    'node': ['nodejs', 'node.js'],
    'python': ['py', 'python3'],
    'postgres': ['postgresql', 'psql'],
    'mongodb': ['mongo'],
    'kubernetes': ['k8s'],
    'docker': ['containers'],
    'aws': ['amazon web services'],
    'gcp': ['google cloud'],
    'azure': ['microsoft azure'],
  };
  
  for (const [canonical, alts] of Object.entries(aliases)) {
    const allForms = [canonical, ...alts];
    if (allForms.includes(normCandidate) && allForms.includes(normTarget)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Match a candidate against tech stack filter
 */
export function matchTechStack(
  candidateSkills: string[],
  candidateBio: string | undefined,
  filter: TechStackFilter
): TechStackMatchResult {
  const allSkills = [
    ...candidateSkills,
    // Extract potential skills from bio
    ...(candidateBio?.split(/[\s,;|]+/).filter(word => word.length > 1) || [])
  ];
  
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];
  
  for (const required of filter.required) {
    const hasSkill = allSkills.some(s => skillMatches(s, required));
    if (hasSkill) {
      matchedRequired.push(required);
    } else {
      missingRequired.push(required);
    }
  }
  
  const matchedPreferred: string[] = [];
  for (const preferred of filter.preferred) {
    const hasSkill = allSkills.some(s => skillMatches(s, preferred));
    if (hasSkill) {
      matchedPreferred.push(preferred);
    }
  }
  
  const hasExcluded: string[] = [];
  for (const excluded of filter.exclude) {
    const hasSkill = allSkills.some(s => skillMatches(s, excluded));
    if (hasSkill) {
      hasExcluded.push(excluded);
    }
  }
  
  // Calculate match score
  const requiredScore = filter.required.length > 0
    ? (matchedRequired.length / filter.required.length) * 70
    : 70;
    
  const preferredScore = filter.preferred.length > 0
    ? (matchedPreferred.length / filter.preferred.length) * 30
    : 30;
    
  const excludePenalty = hasExcluded.length * 20;
  
  const matchScore = Math.max(0, Math.min(100, 
    Math.round(requiredScore + preferredScore - excludePenalty)
  ));
  
  return {
    candidateId: '', // Set by caller
    matchScore,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    hasExcluded,
    isFullMatch: missingRequired.length === 0 && hasExcluded.length === 0,
  };
}

/**
 * Filter candidates by tech stack
 */
export function filterByTechStack<T extends { id: string; skills?: string[]; currentRole?: string }>(
  candidates: T[],
  filter: TechStackFilter,
  requireFullMatch = false
): Array<T & { techStackMatch: TechStackMatchResult }> {
  return candidates
    .map(candidate => {
      const match = matchTechStack(
        candidate.skills || [],
        candidate.currentRole,
        filter
      );
      match.candidateId = candidate.id;
      return { ...candidate, techStackMatch: match };
    })
    .filter(c => !requireFullMatch || c.techStackMatch.isFullMatch)
    .sort((a, b) => b.techStackMatch.matchScore - a.techStackMatch.matchScore);
}

/**
 * Extract common tech stacks from job descriptions
 */
export function extractTechStackFromJob(jobDescription: string): TechStackFilter {
  const keywords = [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'ruby', 'php', 'c#', 'c++', 'swift', 'kotlin',
    // Frontend
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby',
    // Backend
    'node', 'express', 'fastify', 'django', 'flask', 'spring', 'rails', 'laravel',
    // Databases
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'firebase',
    // Cloud/DevOps
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins', 'github actions',
    // Other
    'graphql', 'rest', 'grpc', 'microservices', 'machine learning', 'ai',
  ];
  
  const found: string[] = [];
  const lowerDesc = jobDescription.toLowerCase();
  
  for (const keyword of keywords) {
    if (lowerDesc.includes(keyword)) {
      found.push(keyword);
    }
  }
  
  // First 3 found are "required", rest are "preferred"
  return {
    required: found.slice(0, 3),
    preferred: found.slice(3),
    exclude: [],
  };
}

/**
 * Experience Parser - Extract Years of Experience and Seniority Level
 *
 * Parses experience requirements from natural language queries in multiple languages.
 * Examples:
 *   "5 års erfaring" → { yearsMin: 5 }
 *   "3-5 years" → { yearsMin: 3, yearsMax: 5 }
 *   "senior developer" → { seniority: 'senior' }
 */

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export interface ExperienceInfo {
  yearsMin: number | null;
  yearsMax: number | null;
  seniority: SeniorityLevel | null;
}

// Year unit patterns across languages
const YEAR_UNITS = '(?:years?|yrs?|yr|års?|år|jahre?n?|ans?|années?|años?|anos?|vuot+a|vuoden|jaar|jaren|lat|lata)';

// RANGE patterns (must be checked FIRST - e.g., "3-5 years", "3 to 5 years")
const RANGE_PATTERN = new RegExp(`(\\d+)\\s*[-–—]\\s*(\\d+)\\s*${YEAR_UNITS}\\b`, 'i');
const RANGE_TO_PATTERN = new RegExp(`(\\d+)\\s+to\\s+(\\d+)\\s*${YEAR_UNITS}\\b`, 'i');

// SINGLE patterns (e.g., "5 years", "5+ years")
const SINGLE_PATTERN = new RegExp(`(\\d+)\\s*\\+?\\s*${YEAR_UNITS}\\b`, 'i');
const PLUS_PATTERN = new RegExp(`(\\d+)\\+\\s*${YEAR_UNITS}\\b`, 'i');

// Seniority keywords across languages
const SENIORITY_PATTERNS: Record<SeniorityLevel, RegExp> = {
  junior: /\b(junior|jr\.?|entry[\s-]?level|nyuddannet|nyutdannet|nybörjare|anfänger|débutant|principiante|początkujący)\b/i,
  mid: /\b(mid[\s-]?level|medior|mellemlevel|mellannivå|mittel|intermédiaire|intermedio|średniozaawansowany)\b/i,
  senior: /\b(senior|sr\.?|erfaren|erfahren|expérimenté|experimentado|doświadczony|experienced|seasoned|veteran)\b/i,
  lead: /\b(lead|leder|ledare|leiter|chef|responsable|líder|kierownik|team[\s-]?lead|tech[\s-]?lead)\b/i,
  principal: /\b(principal|staff|distinguished|expert|arkitekt|architect|główny)\b/i,
};

// Implied years by seniority (used when no explicit years given)
export const SENIORITY_YEARS: Record<SeniorityLevel, { min: number; max: number }> = {
  junior: { min: 0, max: 2 },
  mid: { min: 2, max: 5 },
  senior: { min: 5, max: 10 },
  lead: { min: 7, max: 15 },
  principal: { min: 10, max: 20 },
};

/**
 * Parse experience requirements from a search query
 * @param query - Natural language search query
 * @returns Extracted experience information
 */
export function parseExperience(query: string): ExperienceInfo {
  const result: ExperienceInfo = {
    yearsMin: null,
    yearsMax: null,
    seniority: null,
  };

  const lowerQuery = query.toLowerCase();

  // Try RANGE patterns FIRST (e.g., "3-5 years", "3 to 5 years")
  let match = lowerQuery.match(RANGE_PATTERN);
  if (match) {
    result.yearsMin = parseInt(match[1], 10);
    result.yearsMax = parseInt(match[2], 10);
  } else {
    match = lowerQuery.match(RANGE_TO_PATTERN);
    if (match) {
      result.yearsMin = parseInt(match[1], 10);
      result.yearsMax = parseInt(match[2], 10);
    } else {
      // Try SINGLE patterns (e.g., "5 years", "5+ years")
      const plusMatch = lowerQuery.match(PLUS_PATTERN);
      if (plusMatch) {
        // "5+ years" → minimum only
        result.yearsMin = parseInt(plusMatch[1], 10);
      } else {
        const singleMatch = lowerQuery.match(SINGLE_PATTERN);
        if (singleMatch) {
          result.yearsMin = parseInt(singleMatch[1], 10);
        }
      }
    }
  }

  // Match seniority keywords
  for (const [level, pattern] of Object.entries(SENIORITY_PATTERNS) as [SeniorityLevel, RegExp][]) {
    if (pattern.test(lowerQuery)) {
      result.seniority = level;
      break; // Use first match (in order: junior → principal)
    }
  }

  // If we got seniority but no years, we could infer years
  // (but we don't populate them to avoid overconstraining the search)

  return result;
}

/**
 * Remove experience-related terms from a query
 * @param query - Original query
 * @returns Query with experience terms removed
 */
export function removeExperienceTerms(query: string): string {
  let result = query;

  // Remove years patterns (range first, then single)
  result = result.replace(RANGE_PATTERN, '');
  result = result.replace(RANGE_TO_PATTERN, '');
  result = result.replace(PLUS_PATTERN, '');
  result = result.replace(SINGLE_PATTERN, '');

  // Remove seniority patterns
  for (const pattern of Object.values(SENIORITY_PATTERNS)) {
    result = result.replace(pattern, '');
  }

  // Clean up extra whitespace
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Format experience info for display
 */
export function formatExperience(exp: ExperienceInfo): string {
  const parts: string[] = [];

  if (exp.seniority) {
    parts.push(exp.seniority.charAt(0).toUpperCase() + exp.seniority.slice(1));
  }

  if (exp.yearsMin !== null) {
    if (exp.yearsMax !== null) {
      parts.push(`${exp.yearsMin}-${exp.yearsMax} years`);
    } else {
      parts.push(`${exp.yearsMin}+ years`);
    }
  }

  return parts.join(', ') || 'Any experience level';
}

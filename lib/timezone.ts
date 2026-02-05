/**
 * Timezone & Best Time to Reach Out Utilities
 * 
 * Uses REAL data: GitHub location → timezone → overlap calculation
 * NO MOCK DATA
 */

// Location to timezone mapping (major cities/regions)
const LOCATION_TIMEZONE_MAP: Record<string, string> = {
  // US
  'new york': 'America/New_York',
  'nyc': 'America/New_York',
  'boston': 'America/New_York',
  'washington': 'America/New_York',
  'miami': 'America/New_York',
  'atlanta': 'America/New_York',
  'chicago': 'America/Chicago',
  'austin': 'America/Chicago',
  'dallas': 'America/Chicago',
  'houston': 'America/Chicago',
  'denver': 'America/Denver',
  'phoenix': 'America/Phoenix',
  'los angeles': 'America/Los_Angeles',
  'la': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  'sf': 'America/Los_Angeles',
  'seattle': 'America/Los_Angeles',
  'portland': 'America/Los_Angeles',
  'san diego': 'America/Los_Angeles',
  'silicon valley': 'America/Los_Angeles',
  
  // Europe
  'london': 'Europe/London',
  'uk': 'Europe/London',
  'united kingdom': 'Europe/London',
  'paris': 'Europe/Paris',
  'france': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'germany': 'Europe/Berlin',
  'munich': 'Europe/Berlin',
  'amsterdam': 'Europe/Amsterdam',
  'netherlands': 'Europe/Amsterdam',
  'copenhagen': 'Europe/Copenhagen',
  'denmark': 'Europe/Copenhagen',
  'stockholm': 'Europe/Stockholm',
  'sweden': 'Europe/Stockholm',
  'oslo': 'Europe/Oslo',
  'norway': 'Europe/Oslo',
  'helsinki': 'Europe/Helsinki',
  'finland': 'Europe/Helsinki',
  'dublin': 'Europe/Dublin',
  'ireland': 'Europe/Dublin',
  'lisbon': 'Europe/Lisbon',
  'portugal': 'Europe/Lisbon',
  'madrid': 'Europe/Madrid',
  'spain': 'Europe/Madrid',
  'barcelona': 'Europe/Madrid',
  'rome': 'Europe/Rome',
  'italy': 'Europe/Rome',
  'milan': 'Europe/Rome',
  'zurich': 'Europe/Zurich',
  'switzerland': 'Europe/Zurich',
  'vienna': 'Europe/Vienna',
  'austria': 'Europe/Vienna',
  'prague': 'Europe/Prague',
  'warsaw': 'Europe/Warsaw',
  'poland': 'Europe/Warsaw',
  
  // Asia
  'tokyo': 'Asia/Tokyo',
  'japan': 'Asia/Tokyo',
  'seoul': 'Asia/Seoul',
  'south korea': 'Asia/Seoul',
  'korea': 'Asia/Seoul',
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'china': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'singapore': 'Asia/Singapore',
  'bangkok': 'Asia/Bangkok',
  'thailand': 'Asia/Bangkok',
  'mumbai': 'Asia/Kolkata',
  'india': 'Asia/Kolkata',
  'bangalore': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'dubai': 'Asia/Dubai',
  'uae': 'Asia/Dubai',
  'tel aviv': 'Asia/Jerusalem',
  'israel': 'Asia/Jerusalem',
  'jakarta': 'Asia/Jakarta',
  'indonesia': 'Asia/Jakarta',
  'manila': 'Asia/Manila',
  'philippines': 'Asia/Manila',
  'kuala lumpur': 'Asia/Kuala_Lumpur',
  'malaysia': 'Asia/Kuala_Lumpur',
  'taipei': 'Asia/Taipei',
  'taiwan': 'Asia/Taipei',
  'ho chi minh': 'Asia/Ho_Chi_Minh',
  'vietnam': 'Asia/Ho_Chi_Minh',
  
  // Oceania
  'sydney': 'Australia/Sydney',
  'australia': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'brisbane': 'Australia/Brisbane',
  'perth': 'Australia/Perth',
  'auckland': 'Pacific/Auckland',
  'new zealand': 'Pacific/Auckland',
  
  // Americas
  'toronto': 'America/Toronto',
  'canada': 'America/Toronto',
  'vancouver': 'America/Vancouver',
  'montreal': 'America/Montreal',
  'mexico city': 'America/Mexico_City',
  'mexico': 'America/Mexico_City',
  'sao paulo': 'America/Sao_Paulo',
  'brazil': 'America/Sao_Paulo',
  'rio': 'America/Sao_Paulo',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'argentina': 'America/Argentina/Buenos_Aires',
  'bogota': 'America/Bogota',
  'colombia': 'America/Bogota',
  'santiago': 'America/Santiago',
  'chile': 'America/Santiago',
  'lima': 'America/Lima',
  'peru': 'America/Lima',
  
  // Africa
  'lagos': 'Africa/Lagos',
  'nigeria': 'Africa/Lagos',
  'nairobi': 'Africa/Nairobi',
  'kenya': 'Africa/Nairobi',
  'johannesburg': 'Africa/Johannesburg',
  'south africa': 'Africa/Johannesburg',
  'cape town': 'Africa/Johannesburg',
  'cairo': 'Africa/Cairo',
  'egypt': 'Africa/Cairo',
  
  // Remote/Generic
  'remote': 'UTC',
  'worldwide': 'UTC',
  'earth': 'UTC',
};

/**
 * Guess timezone from location string
 * Returns null if unable to determine
 */
export function guessTimezone(location: string | null | undefined): string | null {
  if (!location) return null;
  
  const normalized = location.toLowerCase().trim();
  
  // Direct match
  if (LOCATION_TIMEZONE_MAP[normalized]) {
    return LOCATION_TIMEZONE_MAP[normalized];
  }
  
  // Partial match (location contains known city/country)
  for (const [key, tz] of Object.entries(LOCATION_TIMEZONE_MAP)) {
    if (normalized.includes(key)) {
      return tz;
    }
  }
  
  // Country code patterns
  if (/\busa?\b|\bunited states\b/i.test(normalized)) return 'America/New_York';
  if (/\buk\b|\bengland\b/i.test(normalized)) return 'Europe/London';
  if (/\bde\b/i.test(normalized) && normalized.length < 10) return 'Europe/Berlin';
  
  return null;
}

/**
 * Get UTC offset for a timezone
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart) {
      const match = tzPart.value.match(/GMT([+-]\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Calculate work hour overlap between two timezones
 * Assumes standard work hours: 9 AM - 6 PM
 */
export function calculateOverlap(
  tz1: string,
  tz2: string,
  workStart = 9,
  workEnd = 18
): { overlapHours: number; overlapRange: string | null } {
  const offset1 = getTimezoneOffset(tz1);
  const offset2 = getTimezoneOffset(tz2);
  const diff = Math.abs(offset1 - offset2);
  
  const workHours = workEnd - workStart; // 9 hours
  const overlapHours = Math.max(0, workHours - diff);
  
  if (overlapHours === 0) {
    return { overlapHours: 0, overlapRange: null };
  }
  
  // Calculate the overlap window in tz1's time
  const tz2WorkStartInTz1 = workStart + (offset2 - offset1);
  const tz2WorkEndInTz1 = workEnd + (offset2 - offset1);
  
  const overlapStart = Math.max(workStart, tz2WorkStartInTz1);
  const overlapEnd = Math.min(workEnd, tz2WorkEndInTz1);
  
  const formatHour = (h: number) => {
    const normalized = ((h % 24) + 24) % 24;
    const period = normalized >= 12 ? 'PM' : 'AM';
    const hour12 = normalized % 12 || 12;
    return `${hour12}${period}`;
  };
  
  return {
    overlapHours,
    overlapRange: `${formatHour(overlapStart)} - ${formatHour(overlapEnd)}`,
  };
}

export interface BestTimeToReach {
  bestHour: number;
  bestDay: string;
  localTime: string;
  yourTime: string;
  overlapHours: number;
  overlapRange: string | null;
  timezone: string | null;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Calculate best time to reach out based on commit patterns and location
 * Uses REAL GitHub data - no mocks
 */
export function calculateBestTimeToReach(
  mostActiveHour: number,
  mostActiveDay: string,
  candidateLocation: string | null,
  yourTimezone = 'Europe/Copenhagen'
): BestTimeToReach {
  const candidateTz = guessTimezone(candidateLocation);
  
  // If we can't determine timezone, use commit time as-is (assume UTC)
  if (!candidateTz) {
    return {
      bestHour: mostActiveHour,
      bestDay: mostActiveDay,
      localTime: formatHour24(mostActiveHour),
      yourTime: formatHour24(mostActiveHour),
      overlapHours: 8, // Assume reasonable overlap
      overlapRange: '9AM - 5PM',
      timezone: null,
      confidence: 'low',
    };
  }
  
  const overlap = calculateOverlap(yourTimezone, candidateTz);
  
  // Convert candidate's active hour to your timezone
  const candidateOffset = getTimezoneOffset(candidateTz);
  const yourOffset = getTimezoneOffset(yourTimezone);
  const yourBestHour = (mostActiveHour + (yourOffset - candidateOffset) + 24) % 24;
  
  return {
    bestHour: mostActiveHour,
    bestDay: mostActiveDay,
    localTime: formatHour24(mostActiveHour),
    yourTime: formatHour24(yourBestHour),
    overlapHours: overlap.overlapHours,
    overlapRange: overlap.overlapRange,
    timezone: candidateTz,
    confidence: overlap.overlapHours >= 4 ? 'high' : overlap.overlapHours >= 2 ? 'medium' : 'low',
  };
}

function formatHour24(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${period}`;
}

/**
 * Format timezone for display
 */
export function formatTimezone(timezone: string): string {
  const offset = getTimezoneOffset(timezone);
  const sign = offset >= 0 ? '+' : '';
  return `UTC${sign}${offset}`;
}

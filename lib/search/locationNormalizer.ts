/**
 * Location Normalization for Multi-Language Search
 *
 * Handles location aliases across multiple languages and unicode normalization.
 * For example: "København" → "copenhagen", "göteborg" → "gothenburg"
 */

// Canonical location names with their variants (including local spellings)
export const LOCATION_ALIASES: Record<string, string[]> = {
  // Denmark
  'copenhagen': ['copenhagen', 'kobenhavn', 'københavn', 'cph', 'kbh'],
  'aarhus': ['aarhus', 'århus'],
  'odense': ['odense'],
  'aalborg': ['aalborg', 'ålborg'],
  'denmark': ['denmark', 'danmark', 'dk'],

  // Sweden
  'stockholm': ['stockholm', 'sthlm'],
  'gothenburg': ['gothenburg', 'göteborg', 'goteborg', 'gbg'],
  'malmo': ['malmo', 'malmö', 'malmoe'],
  'uppsala': ['uppsala'],
  'sweden': ['sweden', 'sverige', 'se'],

  // Norway
  'oslo': ['oslo'],
  'bergen': ['bergen'],
  'trondheim': ['trondheim'],
  'norway': ['norway', 'norge', 'no'],

  // Finland
  'helsinki': ['helsinki', 'helsingfors'],
  'espoo': ['espoo'],
  'tampere': ['tampere'],
  'finland': ['finland', 'suomi', 'fi'],

  // Germany
  'berlin': ['berlin'],
  'munich': ['munich', 'münchen', 'muenchen'],
  'hamburg': ['hamburg'],
  'frankfurt': ['frankfurt'],
  'cologne': ['cologne', 'köln', 'koeln'],
  'dusseldorf': ['dusseldorf', 'düsseldorf', 'duesseldorf'],
  'germany': ['germany', 'deutschland', 'de'],

  // Netherlands
  'amsterdam': ['amsterdam', 'ams'],
  'rotterdam': ['rotterdam'],
  'utrecht': ['utrecht'],
  'eindhoven': ['eindhoven'],
  'netherlands': ['netherlands', 'nederland', 'holland', 'nl'],

  // UK
  'london': ['london', 'ldn'],
  'manchester': ['manchester'],
  'birmingham': ['birmingham'],
  'edinburgh': ['edinburgh'],
  'glasgow': ['glasgow'],
  'cambridge': ['cambridge'],
  'oxford': ['oxford'],
  'bristol': ['bristol'],
  'uk': ['uk', 'united kingdom', 'britain', 'great britain', 'england', 'scotland', 'wales'],

  // France
  'paris': ['paris'],
  'lyon': ['lyon'],
  'marseille': ['marseille'],
  'toulouse': ['toulouse'],
  'france': ['france', 'fr'],

  // Spain
  'madrid': ['madrid'],
  'barcelona': ['barcelona', 'bcn'],
  'valencia': ['valencia'],
  'seville': ['seville', 'sevilla'],
  'spain': ['spain', 'españa', 'espana', 'es'],

  // Italy
  'milan': ['milan', 'milano'],
  'rome': ['rome', 'roma'],
  'turin': ['turin', 'torino'],
  'italy': ['italy', 'italia', 'it'],

  // Switzerland
  'zurich': ['zurich', 'zürich', 'zuerich'],
  'geneva': ['geneva', 'genève', 'geneve'],
  'bern': ['bern', 'berne'],
  'basel': ['basel'],
  'switzerland': ['switzerland', 'schweiz', 'suisse', 'ch'],

  // Austria
  'vienna': ['vienna', 'wien'],
  'austria': ['austria', 'österreich', 'oesterreich', 'at'],

  // Ireland
  'dublin': ['dublin'],
  'cork': ['cork'],
  'galway': ['galway'],
  'ireland': ['ireland', 'ie', 'éire', 'eire'],

  // Portugal
  'lisbon': ['lisbon', 'lisboa'],
  'porto': ['porto'],
  'portugal': ['portugal', 'pt'],

  // Poland
  'warsaw': ['warsaw', 'warszawa'],
  'krakow': ['krakow', 'kraków', 'cracow'],
  'wroclaw': ['wroclaw', 'wrocław'],
  'gdansk': ['gdansk', 'gdańsk'],
  'poland': ['poland', 'polska', 'pl'],

  // Czech Republic
  'prague': ['prague', 'praha'],
  'brno': ['brno'],
  'czech republic': ['czech republic', 'czechia', 'česko', 'cesko', 'cz'],

  // Belgium
  'brussels': ['brussels', 'bruxelles', 'brussel'],
  'antwerp': ['antwerp', 'antwerpen', 'anvers'],
  'ghent': ['ghent', 'gent', 'gand'],
  'belgium': ['belgium', 'belgique', 'belgië', 'belgie', 'be'],

  // USA
  'new york': ['new york', 'nyc', 'ny'],
  'san francisco': ['san francisco', 'sf', 'bay area'],
  'los angeles': ['los angeles', 'la'],
  'seattle': ['seattle'],
  'austin': ['austin'],
  'boston': ['boston'],
  'chicago': ['chicago'],
  'denver': ['denver'],
  'atlanta': ['atlanta'],
  'miami': ['miami'],
  'portland': ['portland'],
  'san diego': ['san diego'],
  'usa': ['usa', 'us', 'united states', 'america'],

  // Canada
  'toronto': ['toronto', 'to'],
  'vancouver': ['vancouver', 'van'],
  'montreal': ['montreal', 'montréal'],
  'ottawa': ['ottawa'],
  'calgary': ['calgary'],
  'canada': ['canada', 'ca'],

  // Australia
  'sydney': ['sydney', 'syd'],
  'melbourne': ['melbourne', 'mel'],
  'brisbane': ['brisbane'],
  'perth': ['perth'],
  'australia': ['australia', 'au'],

  // Asia
  'tokyo': ['tokyo', '東京'],
  'osaka': ['osaka', '大阪'],
  'japan': ['japan', '日本', 'jp'],
  'singapore': ['singapore', 'sg'],
  'hong kong': ['hong kong', 'hk'],
  'seoul': ['seoul', '서울'],
  'south korea': ['south korea', 'korea', '한국', 'kr'],
  'bangalore': ['bangalore', 'bengaluru'],
  'mumbai': ['mumbai', 'bombay'],
  'delhi': ['delhi', 'new delhi'],
  'hyderabad': ['hyderabad'],
  'chennai': ['chennai', 'madras'],
  'pune': ['pune'],
  'india': ['india', 'in'],
  'beijing': ['beijing', 'peking', '北京'],
  'shanghai': ['shanghai', '上海'],
  'shenzhen': ['shenzhen', '深圳'],
  'china': ['china', '中国', 'cn'],
  'taipei': ['taipei', '台北'],
  'taiwan': ['taiwan', '台灣', 'tw'],

  // Middle East
  'tel aviv': ['tel aviv', 'tlv', 'telaviv'],
  'israel': ['israel', 'il'],
  'dubai': ['dubai'],
  'uae': ['uae', 'united arab emirates'],

  // South America
  'sao paulo': ['sao paulo', 'são paulo'],
  'rio de janeiro': ['rio de janeiro', 'rio'],
  'brazil': ['brazil', 'brasil', 'br'],
  'buenos aires': ['buenos aires'],
  'argentina': ['argentina', 'ar'],

  // Regions
  'remote': ['remote', 'worldwide', 'anywhere', 'global'],
  'europe': ['europe', 'eu', 'european union'],
  'asia': ['asia', 'apac', 'asia pacific'],
  'north america': ['north america'],
  'nordic': ['nordic', 'scandinavia', 'scandinavian'],
};

// Pre-compute normalized variants for efficient matching
const normalizedAliasMap = new Map<string, string>();

function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics: ø→o, å→a, é→e
    .trim();
}

// Build the lookup map
for (const [canonical, variants] of Object.entries(LOCATION_ALIASES)) {
  for (const variant of variants) {
    normalizedAliasMap.set(normalizeString(variant), canonical);
  }
}

/**
 * Normalize a location string to its canonical form
 * @param input - Location string (potentially in any supported language)
 * @returns Canonical location name or original input if no match
 */
export function normalizeLocation(input: string): string {
  const normalized = normalizeString(input);
  return normalizedAliasMap.get(normalized) || input;
}

/**
 * Extract and normalize location from a search query
 * @param query - Full search query string
 * @returns Object with detected location and remaining query
 */
export function extractLocation(query: string): {
  location: string | null;
  remainingQuery: string;
} {
  const lowerQuery = query.toLowerCase();
  const normalizedQuery = normalizeString(query);

  // Check each alias (longer phrases first to match "new york" before "york")
  const sortedEntries = Object.entries(LOCATION_ALIASES)
    .flatMap(([canonical, variants]) =>
      variants.map(v => ({ canonical, variant: v, length: v.length }))
    )
    .sort((a, b) => b.length - a.length); // Longest first

  for (const { canonical, variant } of sortedEntries) {
    const normalizedVariant = normalizeString(variant);

    // Check if the normalized query contains this variant
    if (normalizedQuery.includes(normalizedVariant)) {
      // Find the original position in the query to remove it properly
      // We need to handle both normalized and original forms
      let remaining = lowerQuery;

      // Try to remove the original variant first
      if (lowerQuery.includes(variant.toLowerCase())) {
        remaining = lowerQuery.replace(new RegExp(escapeRegex(variant), 'gi'), '').trim();
      } else {
        // Fall back to removing based on normalized position
        const index = normalizedQuery.indexOf(normalizedVariant);
        if (index !== -1) {
          // Find corresponding position in original query
          // This is an approximation - we remove the same character count
          remaining = (lowerQuery.slice(0, index) + lowerQuery.slice(index + variant.length)).trim();
        }
      }

      // Clean up "in", "i", "from" prepositions left behind
      remaining = remaining
        .replace(/\b(in|i|from|at|near)\s*$/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      return { location: canonical, remainingQuery: remaining };
    }
  }

  return { location: null, remainingQuery: query };
}

/**
 * Get all known canonical locations
 */
export function getAllLocations(): string[] {
  return Object.keys(LOCATION_ALIASES);
}

/**
 * Get all variants for a canonical location
 */
export function getLocationVariants(canonical: string): string[] {
  return LOCATION_ALIASES[canonical] || [];
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

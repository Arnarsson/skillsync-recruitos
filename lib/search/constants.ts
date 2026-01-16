/**
 * Search Constants - Multi-Language Stop Words and Common Terms
 *
 * Stop words are common words that should be filtered from search queries
 * as they don't add value to GitHub user search.
 */

// Stop words organized by language
export const STOP_WORDS: Record<string, string[]> = {
  // English
  en: [
    // Experience-related
    'years', 'year', 'experience', 'experienced', 'exp',
    // Seniority terms (useful for context but not GitHub search)
    'senior', 'junior', 'mid', 'level', 'lead', 'principal', 'staff', 'entry',
    // Role terms
    'developer', 'engineer', 'programmer', 'architect', 'specialist',
    'consultant', 'analyst', 'manager', 'intern',
    // Connector words
    'looking', 'for', 'with', 'and', 'or', 'the', 'a', 'an', 'in', 'at',
    'from', 'to', 'on', 'of', 'is', 'are', 'who', 'that', 'this',
    // Common phrases
    'full', 'stack', 'fullstack', 'full-stack', 'frontend', 'front-end',
    'backend', 'back-end', 'devops', 'dev', 'ops',
    // Misc
    'remote', 'hybrid', 'onsite', 'office', 'work', 'job', 'position',
    'role', 'opportunity', 'hire', 'hiring',
  ],

  // Danish
  da: [
    // Experience
    'år', 'års', 'erfaring', 'erfaringer', 'erfaren',
    // Seniority
    'senior', 'junior', 'medarbejder', 'leder', 'ekspert',
    // Roles
    'udvikler', 'ingeniør', 'programmør', 'arkitekt', 'konsulent', 'analytiker',
    // Connectors
    'søger', 'med', 'og', 'i', 'til', 'fra', 'på', 'for', 'en', 'et', 'den', 'det',
    // Common
    'fuld', 'stack', 'arbejde', 'stilling', 'job',
  ],

  // Swedish
  sv: [
    // Experience
    'år', 'års', 'erfarenhet', 'erfaren',
    // Seniority
    'senior', 'junior', 'medarbetare', 'ledare', 'expert',
    // Roles
    'utvecklare', 'ingenjör', 'programmerare', 'arkitekt', 'konsult', 'analytiker',
    // Connectors
    'söker', 'med', 'och', 'i', 'till', 'från', 'på', 'för', 'en', 'ett', 'den', 'det',
    // Common
    'full', 'stack', 'arbete', 'tjänst', 'jobb',
  ],

  // Norwegian
  no: [
    // Experience
    'år', 'års', 'erfaring', 'erfaringer', 'erfaren',
    // Seniority
    'senior', 'junior', 'medarbeider', 'leder', 'ekspert',
    // Roles
    'utvikler', 'ingeniør', 'programmerer', 'arkitekt', 'konsulent', 'analytiker',
    // Connectors
    'søker', 'med', 'og', 'i', 'til', 'fra', 'på', 'for', 'en', 'et', 'den', 'det',
    // Common
    'full', 'stack', 'arbeid', 'stilling', 'jobb',
  ],

  // Finnish
  fi: [
    // Experience
    'vuotta', 'vuoden', 'kokemus', 'kokemusta', 'kokenut',
    // Seniority
    'senior', 'junior', 'johtava', 'asiantuntija',
    // Roles
    'kehittäjä', 'insinööri', 'ohjelmoija', 'arkkitehti', 'konsultti', 'analyytikko',
    // Connectors
    'etsii', 'kanssa', 'ja', 'tai', 'jolla', 'jossa',
    // Common
    'työ', 'tehtävä',
  ],

  // German
  de: [
    // Experience
    'jahre', 'jahren', 'erfahrung', 'berufserfahrung', 'erfahren',
    // Seniority
    'senior', 'junior', 'leitender', 'experte', 'spezialist',
    // Roles
    'entwickler', 'ingenieur', 'programmierer', 'architekt', 'berater', 'analyst',
    // Connectors
    'suchen', 'sucht', 'mit', 'und', 'oder', 'in', 'für', 'der', 'die', 'das',
    'ein', 'eine', 'einer',
    // Common
    'full', 'stack', 'stelle', 'position', 'job', 'arbeit',
  ],

  // Dutch
  nl: [
    // Experience
    'jaar', 'jaren', 'ervaring', 'ervaren',
    // Seniority
    'senior', 'junior', 'medior', 'leidende', 'expert',
    // Roles
    'ontwikkelaar', 'ingenieur', 'programmeur', 'architect', 'consultant', 'analist',
    // Connectors
    'zoekt', 'met', 'en', 'of', 'in', 'voor', 'de', 'het', 'een',
    // Common
    'full', 'stack', 'baan', 'functie', 'vacature',
  ],

  // French
  fr: [
    // Experience
    'ans', 'années', 'expérience', 'experience', 'expérimenté',
    // Seniority
    'senior', 'junior', 'confirmé', 'expert', 'spécialiste',
    // Roles
    'développeur', 'developpeur', 'ingénieur', 'ingenieur', 'programmeur',
    'architecte', 'consultant', 'analyste',
    // Connectors
    'cherche', 'avec', 'et', 'ou', 'dans', 'pour', 'le', 'la', 'les', 'un', 'une',
    // Common
    'full', 'stack', 'poste', 'emploi', 'travail',
  ],

  // Spanish
  es: [
    // Experience
    'años', 'experiencia', 'experimentado',
    // Seniority
    'senior', 'junior', 'líder', 'experto', 'especialista',
    // Roles
    'desarrollador', 'ingeniero', 'programador', 'arquitecto', 'consultor', 'analista',
    // Connectors
    'busca', 'con', 'y', 'o', 'en', 'para', 'el', 'la', 'los', 'las', 'un', 'una',
    // Common
    'full', 'stack', 'puesto', 'empleo', 'trabajo',
  ],

  // Italian
  it: [
    // Experience
    'anni', 'esperienza', 'esperto',
    // Seniority
    'senior', 'junior', 'leader', 'specialista',
    // Roles
    'sviluppatore', 'ingegnere', 'programmatore', 'architetto', 'consulente', 'analista',
    // Connectors
    'cerca', 'con', 'e', 'o', 'in', 'per', 'il', 'la', 'i', 'le', 'un', 'una',
    // Common
    'full', 'stack', 'posizione', 'lavoro',
  ],

  // Portuguese
  pt: [
    // Experience
    'anos', 'experiência', 'experiencia', 'experiente',
    // Seniority
    'senior', 'sênior', 'junior', 'júnior', 'pleno', 'líder', 'especialista',
    // Roles
    'desenvolvedor', 'engenheiro', 'programador', 'arquiteto', 'consultor', 'analista',
    // Connectors
    'procura', 'com', 'e', 'ou', 'em', 'para', 'o', 'a', 'os', 'as', 'um', 'uma',
    // Common
    'full', 'stack', 'vaga', 'emprego', 'trabalho',
  ],

  // Polish
  pl: [
    // Experience
    'lat', 'lata', 'doświadczenie', 'doswiadczenie', 'doświadczony',
    // Seniority
    'senior', 'junior', 'lider', 'ekspert', 'specjalista',
    // Roles
    'programista', 'deweloper', 'inżynier', 'inzynier', 'architekt', 'konsultant', 'analityk',
    // Connectors
    'szuka', 'z', 'i', 'lub', 'w', 'dla', 'na',
    // Common
    'full', 'stack', 'stanowisko', 'praca',
  ],
};

// Combine all stop words into a single set for universal filtering
export const ALL_STOP_WORDS = new Set(
  Object.values(STOP_WORDS).flat().map(w => w.toLowerCase())
);

/**
 * Check if a word is a stop word in any supported language
 */
export function isStopWord(word: string): boolean {
  return ALL_STOP_WORDS.has(word.toLowerCase());
}

/**
 * Filter stop words from an array of words
 */
export function filterStopWords(words: string[]): string[] {
  return words.filter(word => !isStopWord(word) && word.length > 1);
}

/**
 * Get stop words for a specific language
 */
export function getStopWords(language: string): string[] {
  return STOP_WORDS[language] || STOP_WORDS['en'];
}

// Supported languages for auto-detection
export const SUPPORTED_LANGUAGES = Object.keys(STOP_WORDS);

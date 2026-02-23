/**
 * Skill Normalization - Map Programming Language Variants to Canonical Names
 *
 * Handles various ways people refer to programming languages and frameworks.
 * Maps to GitHub's language names for accurate search.
 */

// Canonical skill names → variants (including common misspellings/abbreviations)
export const SKILL_ALIASES: Record<string, string[]> = {
  // C-family
  'c': ['c lang', 'clang', 'ansi c'],
  'cpp': ['c++', 'cpp', 'c plus plus', 'cplusplus', 'c++17', 'c++20', 'c++14', 'c++11'],
  'csharp': ['c#', 'csharp', 'c sharp', 'c-sharp', '.net', 'dotnet', 'dot net'],

  // JavaScript ecosystem
  'javascript': ['javascript', 'js', 'ecmascript', 'es6', 'es2020', 'es2021', 'vanilla js'],
  'typescript': ['typescript', 'ts'],
  'nodejs': ['node', 'nodejs', 'node.js', 'node js'],
  'react': ['react', 'reactjs', 'react.js', 'react js'],
  'vue': ['vue', 'vuejs', 'vue.js', 'vue js', 'vue3', 'vue 3'],
  'angular': ['angular', 'angularjs', 'angular.js', 'angular js', 'ng'],
  'svelte': ['svelte', 'sveltejs', 'svelte.js'],
  'nextjs': ['next', 'nextjs', 'next.js', 'next js'],
  'nuxt': ['nuxt', 'nuxtjs', 'nuxt.js'],
  'deno': ['deno'],
  'bun': ['bun', 'bunjs'],

  // Python ecosystem
  'python': ['python', 'py', 'python3', 'python 3', 'python2'],
  'django': ['django'],
  'flask': ['flask'],
  'fastapi': ['fastapi', 'fast api', 'fast-api'],
  'pytorch': ['pytorch', 'torch'],
  'tensorflow': ['tensorflow', 'tf'],

  // JVM languages
  'java': ['java', 'jvm', 'java8', 'java11', 'java17', 'java 8', 'java 11', 'java 17'],
  'kotlin': ['kotlin', 'kt'],
  'scala': ['scala'],
  'clojure': ['clojure', 'clj'],
  'groovy': ['groovy'],

  // Systems languages
  'rust': ['rust', 'rustlang', 'rust-lang', 'rs'],
  'go': ['go', 'golang', 'go lang'],
  'zig': ['zig', 'ziglang'],

  // Mobile
  'swift': ['swift', 'ios', 'swiftui'],
  'objectivec': ['objective-c', 'objc', 'objective c', 'obj-c'],
  'dart': ['dart', 'flutter'],

  // Ruby ecosystem
  'ruby': ['ruby', 'rb', 'rails', 'ruby on rails', 'ror'],

  // PHP ecosystem
  'php': ['php', 'php8', 'php 8'],
  'laravel': ['laravel'],
  'symfony': ['symfony'],
  'wordpress': ['wordpress', 'wp'],

  // Data & ML
  'r': ['r lang', 'rlang', 'r-lang'],
  'julia': ['julia'],
  'matlab': ['matlab'],

  // Data Engineering tools (map verbose names to GitHub-searchable forms)
  'airflow': ['airflow', 'apache airflow', 'apache-airflow'],
  'kafka': ['kafka', 'apache kafka', 'apache-kafka', 'confluent kafka'],
  'spark': ['spark', 'apache spark', 'apache-spark', 'pyspark'],
  'flink': ['flink', 'apache flink', 'apache-flink'],
  'dbt': ['dbt', 'dbt-core', 'data build tool'],
  'bigquery': ['bigquery', 'google bigquery', 'bq'],
  'redshift': ['redshift', 'amazon redshift', 'aws redshift'],
  'snowflake': ['snowflake', 'snowflakedb'],
  'databricks': ['databricks', 'delta lake'],
  'elasticsearch': ['elasticsearch', 'elastic search', 'opensearch', 'elk'],

  // Shell & scripting
  'shell': ['shell', 'bash', 'zsh', 'sh', 'shell script', 'shellscript'],
  'powershell': ['powershell', 'pwsh', 'ps1'],
  'perl': ['perl'],
  'lua': ['lua'],

  // Functional
  'haskell': ['haskell', 'hs'],
  'elixir': ['elixir', 'phoenix'],
  'erlang': ['erlang', 'erl'],
  'fsharp': ['f#', 'fsharp', 'f sharp'],
  'ocaml': ['ocaml', 'ml'],

  // Database
  'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'mariadb', 'mssql', 'sql server', 'oracle db'],

  // Infrastructure & DevOps
  'kubernetes': ['kubernetes', 'k8s', 'kube'],
  'docker': ['docker', 'containerization'],
  'terraform': ['terraform', 'tf', 'hcl'],
  'ansible': ['ansible'],
  'aws': ['aws', 'amazon web services'],
  'azure': ['azure', 'microsoft azure'],
  'gcp': ['gcp', 'google cloud', 'google cloud platform'],

  // Other
  'solidity': ['solidity', 'sol', 'ethereum', 'smart contracts'],
  'webassembly': ['webassembly', 'wasm', 'web assembly'],
  'graphql': ['graphql', 'gql'],
  'assembly': ['assembly', 'asm', 'assembler', 'x86', 'arm'],
  'cobol': ['cobol'],
  'fortran': ['fortran', 'f90', 'f95'],
};

// GitHub language names for API search (maps our canonical to GitHub's)
export const GITHUB_LANGUAGE_MAP: Record<string, string> = {
  'cpp': 'C++',
  'csharp': 'C#',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'nodejs': 'JavaScript', // Node.js code is JavaScript
  'python': 'Python',
  'java': 'Java',
  'kotlin': 'Kotlin',
  'scala': 'Scala',
  'rust': 'Rust',
  'go': 'Go',
  'swift': 'Swift',
  'objectivec': 'Objective-C',
  'ruby': 'Ruby',
  'php': 'PHP',
  'shell': 'Shell',
  'haskell': 'Haskell',
  'elixir': 'Elixir',
  'fsharp': 'F#',
  'c': 'C',
  'r': 'R',
  'julia': 'Julia',
  'lua': 'Lua',
  'perl': 'Perl',
  'dart': 'Dart',
  'clojure': 'Clojure',
  'groovy': 'Groovy',
  'erlang': 'Erlang',
  'ocaml': 'OCaml',
  'assembly': 'Assembly',
  'cobol': 'COBOL',
  'fortran': 'Fortran',
  'solidity': 'Solidity',
  'zig': 'Zig',
};

// Frameworks that map to parent languages for GitHub search
export const FRAMEWORK_TO_LANGUAGE: Record<string, string> = {
  'react': 'javascript',
  'vue': 'javascript',
  'angular': 'typescript',
  'svelte': 'javascript',
  'nextjs': 'javascript',
  'nuxt': 'javascript',
  'deno': 'typescript',
  'bun': 'javascript',
  'django': 'python',
  'flask': 'python',
  'fastapi': 'python',
  'pytorch': 'python',
  'tensorflow': 'python',
  'rails': 'ruby',
  'laravel': 'php',
  'symfony': 'php',
  'wordpress': 'php',
  'phoenix': 'elixir',
};

// Build reverse lookup map for fast matching
const normalizedAliasMap = new Map<string, string>();

function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9#+.]/g, '') // Keep letters, numbers, #, +, .
    .trim();
}

// Initialize the lookup map
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  for (const alias of aliases) {
    normalizedAliasMap.set(normalizeString(alias), canonical);
  }
  // Also add the canonical name itself
  normalizedAliasMap.set(normalizeString(canonical), canonical);
}

/**
 * Meta-skills are high-level concepts (e.g. "Open Source") that don't map to
 * specific GitHub languages/frameworks. Searching GitHub for them is meaningless
 * and produces confusing results or console errors. Return null so callers can
 * substitute a sensible fallback count instead of hitting the API.
 */
export const META_SKILLS = ['open source', 'open-source', 'oss', 'open_source'];

/**
 * Normalize a skill/language string to its canonical form
 * @param input - Skill string (e.g., "C++", "React.js", "golang")
 * @returns Canonical skill name or null if not recognized (including meta-skills)
 */
export function normalizeSkill(input: string): string | null {
  // Meta-skills are philosophical/community concepts, not searchable languages.
  // Skip them silently so no console error fires for missing tag_alias mappings.
  if (META_SKILLS.includes(input.toLowerCase().trim())) {
    return null;
  }

  const normalized = normalizeString(input);
  return normalizedAliasMap.get(normalized) || null;
}

/**
 * Get the GitHub language qualifier for a skill
 * @param skill - Canonical skill name
 * @returns GitHub language name or null
 */
export function getGitHubLanguage(skill: string): string | null {
  // Direct language mapping
  if (GITHUB_LANGUAGE_MAP[skill]) {
    return GITHUB_LANGUAGE_MAP[skill];
  }

  // Framework to parent language
  const parentLang = FRAMEWORK_TO_LANGUAGE[skill];
  if (parentLang && GITHUB_LANGUAGE_MAP[parentLang]) {
    return GITHUB_LANGUAGE_MAP[parentLang];
  }

  return null;
}

/**
 * Extract and normalize skill from a search query
 * @param query - Full search query string
 * @returns Object with detected skill, GitHub language, and remaining query
 */
export function extractSkill(query: string): {
  skill: string | null;
  githubLanguage: string | null;
  keyword: string | null; // Framework name to include in search
  remainingQuery: string;
} {
  const lowerQuery = query.toLowerCase();

  // Sort aliases by length (longest first) to match "node.js" before "node"
  const sortedEntries = Object.entries(SKILL_ALIASES)
    .flatMap(([canonical, aliases]) =>
      aliases.map(alias => ({ canonical, alias, length: alias.length }))
    )
    .sort((a, b) => b.length - a.length);

  for (const { canonical, alias } of sortedEntries) {
    // Escape special regex characters in the alias
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Use space/boundary-aware matching that works with Unicode
    // \b doesn't work well with Unicode (e.g., "års" would match \brs\b)
    // Instead, require whitespace or start/end of string around the match
    const regex = new RegExp(`(?:^|[\\s,;:])${escapedAlias}(?:[\\s,;:]|$)`, 'gi');

    if (regex.test(lowerQuery)) {
      // Remove the alias from the query (preserving surrounding spaces correctly)
      const removeRegex = new RegExp(`(?:^|\\s)${escapedAlias}(?:\\s|$)`, 'gi');
      const remaining = lowerQuery.replace(removeRegex, ' ').replace(/\s+/g, ' ').trim();
      const githubLang = getGitHubLanguage(canonical);

      // Determine if we should include a keyword (for frameworks)
      const isFramework = FRAMEWORK_TO_LANGUAGE[canonical] !== undefined;
      const keyword = isFramework ? canonical : null;

      return {
        skill: canonical,
        githubLanguage: githubLang,
        keyword,
        remainingQuery: remaining,
      };
    }
  }

  return {
    skill: null,
    githubLanguage: null,
    keyword: null,
    remainingQuery: query,
  };
}

/**
 * Get all known canonical skill names
 */
export function getAllSkills(): string[] {
  return Object.keys(SKILL_ALIASES);
}

/**
 * Get all variants for a canonical skill
 */
export function getSkillVariants(canonical: string): string[] {
  return SKILL_ALIASES[canonical] || [];
}

/**
 * Check if a string might be a programming language/skill
 */
export function isPossibleSkill(term: string): boolean {
  return normalizeSkill(term) !== null;
}

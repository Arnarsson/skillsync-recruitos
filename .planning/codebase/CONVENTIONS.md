# Coding Conventions

**Analysis Date:** 2026-01-24

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `SearchBar.tsx`, `NetworkMap.tsx`, `CandidateNode`)
- Services: camelCase with "Service" suffix (e.g., `geminiService.ts`, `candidateService.ts`, `behavioralSignalsService.ts`)
- Utilities/helpers: camelCase (e.g., `locationNormalizer.ts`, `skillNormalizer.ts`, `experienceParser.ts`)
- Hooks: camelCase with "use" prefix (e.g., `usePersistedState.ts`)
- Test files: Mirror source name with `.test.ts` or `.spec.ts` suffix (e.g., `geminiService.test.ts`, `usePersistedState.test.ts`)
- API routes: Use slash-separated paths in Next.js App Router (e.g., `app/api/search/route.ts`, `app/api/profile/analyze/route.ts`)

**Functions:**
- camelCase for all function names: `analyzeCandidateProfile()`, `generatePersona()`, `searchDevelopers()`
- Event handlers start with "handle": `handleKeyDown()`, `handleSearch()`, `handleNodeClick()`
- Query/fetch functions use past tense: `fetchLinkedInProfile()`, `collectBehavioralSignals()`, `collectEvidence()`
- Predicate functions use "is/has/should" prefix: `isTarget`, `isMutual`, `hasApiKey()`

**Variables:**
- camelCase: `query`, `showSuggestions`, `mockCandidate`, `alignmentScore`
- Boolean prefixes: `is`, `has`, `should`, `can` (e.g., `isAdmin`, `hasError`, `shouldRetry`)
- Constants: UPPER_SNAKE_CASE (e.g., `CANDIDATES_STORAGE_KEY`, `PRICING`, `AI_MODELS`)
- React state: `[value, setValue]` pattern, where variable names are simple nouns (e.g., `[query, setQuery]`, `[mounted, setMounted]`)

**Types/Interfaces:**
- PascalCase (e.g., `Candidate`, `SearchResult`, `GitHubUser`, `BrightDataProfile`)
- Props interfaces end with "Props" (e.g., `NetworkMapProps`, `SearchBarProps`)
- Service objects/modules: lowercase with "Service" suffix (e.g., `candidateService`, `geminiService`)

## Code Style

**Formatting:**
- Tool: Prettier (`.prettierrc` configured)
- Print width: 100 characters
- Tab width: 2 spaces
- Single quotes for strings: `'string'`
- Double quotes for JSX attributes: `<Component prop="value" />`
- Trailing commas: ES5 style (objects/arrays, no function params)
- Arrow functions: No parentheses for single parameter (e.g., `e => e.value`, not `(e) => e.value`)
- Semi-colons: Always included
- End of line: LF (Unix style)

**Linting:**
- Tool: ESLint with TypeScript support (`.eslintrc.json`)
- Key rules enforced:
  - `@typescript-eslint/no-explicit-any`: Error - avoid `any` types
  - `@typescript-eslint/no-unused-vars`: Warn - unused vars forbidden (except prefixed with `_`)
  - `react-hooks/rules-of-hooks`: Error - enforce hook rules
  - `react-hooks/exhaustive-deps`: Warn - check effect dependencies
  - `no-console`: Warn - limit console usage, allow `warn`/`error`/`info`
  - `no-var`: Error - use `const`/`let` only
  - `prefer-const`: Warn - use `const` when variable never reassigned
  - `react/react-in-jsx-scope`: Off - React 19+ doesn't need scope
  - `react/prop-types`: Off - TypeScript replaces prop-types

## Import Organization

**Order:**
1. React/Next.js core imports: `import { useState } from 'react'`
2. Third-party libraries: `import { motion } from 'framer-motion'`
3. UI components from shadcn/ui: `import { Button } from '@/components/ui/button'`
4. Local custom components: `import { SearchBar } from '@/components/SearchBar'`
5. Services: `import { geminiService } from '@/services/geminiService'`
6. Types: `import { Candidate } from '@/types'`
7. Utilities/lib: `import { parseSearchQuery } from '@/lib/github'`
8. Relative imports (if used): `import { helper } from '../utils'`
9. CSS/styles: `import '@xyflow/react/dist/style.css'`

**Path Aliases:**
- `@/*` resolves to project root (configured in `tsconfig.json`)
- Always use absolute paths with `@/`: `import { Button } from '@/components/ui/button'`
- Never use relative paths like `../../../components/Button`

## Error Handling

**Patterns:**
- Try/catch blocks for async operations and risky sync operations
- Error logging: Use `console.error()` or `console.warn()` with context prefix (e.g., `console.error('Search error:', error)`)
- In development: Log errors with details using `if (process.env.NODE_ENV === 'development')`
- In production: Log only safe, non-sensitive error messages
- Async errors in services: Throw Error objects with descriptive messages: `throw new Error('API Key missing')`
- Missing required values: Check and throw early: `if (!apiKey) throw new Error('API Key missing')`
- API responses: Check `response.ok` before parsing JSON
- Graceful degradation: Return fallback values instead of throwing (e.g., `return []` for failed fetches, fallback to localStorage)

**Examples:**
```typescript
// Service error handling - throw for critical failures
try {
  const data = await fetch(url);
  if (!data.ok) throw new Error('API request failed');
  return await data.json();
} catch (err: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Fetch error:', err);
  }
  throw new Error('Failed to fetch');
}

// Component error handling - log and continue
try {
  const result = await api.analyze(candidate);
  return result;
} catch (error) {
  console.error('Analysis error:', error);
  return null; // Graceful fallback
}
```

## Logging

**Framework:** Console API (`console.log`, `console.warn`, `console.error`)

**Patterns:**
- Prefix logs with context in brackets: `console.log('[Enrichment] Starting analysis')`
- Service logs include service name: `console.warn('[NetworkAnalysis] BrightData key not configured')`
- Development-only verbose logs: Wrap in `if (process.env.NODE_ENV === 'development')`
- Production logs: Only warn/error level, no debug info
- Error context: Include the error object: `console.error('Fetch error:', error)`
- Disable ESLint for console in development-heavy files: Use `/* eslint-disable no-console */` at top

**Examples:**
```typescript
// Top of service file if heavy logging
/* eslint-disable no-console */

// Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('[Service] Detailed debug info:', data);
}

// Always log errors
console.error('Operation failed:', error);
```

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic: Add explanatory comments
- Architecture decisions: Document "why" not "what"
- TODOs and FIXMEs: Include context (e.g., `// TODO: Add API mocking`)
- JSDoc for public functions/exports: Document parameters and return types
- Inline comments for subtle bugs or workarounds

**JSDoc/TSDoc:**
- Used for service exports and public functions
- Include descriptions and key architecture details
- Example from `enrichmentServiceV2.ts`:
```typescript
/**
 * Profile Enrichment Pipeline V2
 *
 * Based on BrightData consultant's recommended architecture:
 * - Bright Data SERP API: Discover alternative sources
 * - Bright Data Web Scraper API: Fetch content from discovered URLs
 * - Gemini AI: Build unified persona + compute alignment
 */
```

## Function Design

**Size:**
- Keep functions focused and under 100 lines when possible
- Break complex operations into helper functions
- Services organize related functions as exported object: `export const candidateService = { fetchAll(), save(), ... }`

**Parameters:**
- Use destructuring for object parameters: `function analyze({ name, experience }: Candidate)`
- 3+ parameters: Consider object parameter pattern
- Avoid positional parameters for optional values
- Type all parameters explicitly (no `any`)

**Return Values:**
- Async functions return `Promise<T>` with explicit type
- Always specify return type in function signature
- Return early for validation/errors
- Example: `async function fetchAll(): Promise<Candidate[]>`

## Module Design

**Exports:**
- Services export as named objects: `export const candidateService = { ... }`
- Components export as default: `export default function SearchBar()`
- Utilities export as named functions: `export function parseSearchQuery()`
- Types/interfaces always exported: `export interface Candidate { ... }`

**Barrel Files:**
- Used for UI components: `import { Button } from '@/components/ui/button'`
- Services typically exported individually
- Index files group related exports by feature

---

*Convention analysis: 2026-01-24*

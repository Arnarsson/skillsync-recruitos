# Coding Conventions

**Analysis Date:** 2026-02-16

## Naming Patterns

**Files:**
- Service files: `camelCaseService.ts` (e.g., `geminiService.ts`, `candidateService.ts`, `citedEvidenceService.ts`)
- Components: PascalCase (e.g., `PricingCard.tsx`, `NetworkMap.tsx`, `AdminDock.tsx`)
- Utilities and libraries: kebab-case or camelCase for modules (e.g., `anti-gaming-filters.ts`, `auth.ts`, `pricing.ts`)
- Test files: Match source file with `.test.ts` or `.spec.ts` suffix (e.g., `candidateService.test.ts`, `usePersistedState.test.ts`)
- API routes: Use directory structure matching endpoint paths, e.g., `app/api/candidates/route.ts`

**Functions and Constants:**
- Functions: camelCase (e.g., `calculateScore`, `parseJsonSafe`, `fetchCandidates`)
- Exported constants: UPPER_SNAKE_CASE (e.g., `VALID_ORDER_BY`, `MAX_LIMIT`, `DEFAULT_LIMIT`)
- Internal constants: camelCase (e.g., `primaryModel`, `secondaryModel`)
- Type/interface names: PascalCase (e.g., `Candidate`, `AlignmentScore`, `UseCandidatesReturn`)
- Enum names: PascalCase with UPPER_SNAKE_CASE values (e.g., `FunnelStage`, `ConfidenceLevel`)

**Variables:**
- State variables: camelCase (e.g., `candidates`, `isLoading`, `error`)
- Prefixed flags: is/has pattern (e.g., `isLoading`, `hasError`, `hasSubmitted`)
- Callback functions: camelCase starting with verb (e.g., `fetchCandidates`, `updateCandidate`, `createCandidate`)
- Mocked/test values: prefix with `mock` (e.g., `mockCandidate`, `mockFetch`)

**Types:**
- Interface names: PascalCase, no `I` prefix (e.g., `Candidate`, `UseCandidatesReturn`, `PricingCardProps`)
- Generic types: Single letter (e.g., `<T>`) or descriptive (e.g., `<ApiResponse>`)
- Optional interface fields: Use `?` modifier, not `null` as default
- Type aliases for discriminated unions: PascalCase (e.g., `EnrichmentResult`)

## Code Style

**Formatting:**
- Tool: Prettier
- Print width: 100 characters
- Tab width: 2 spaces
- Quotes: Single quotes for JS/TS (e.g., `'use client'`, `'vitest'`), double quotes for JSX attributes
- Trailing comma: ES5 style (objects/arrays only, not function params)
- Arrow parens: Omit when single parameter (e.g., `items.map(item =>` not `(item) =>`)
- Semicolons: Required (enabled in config)
- End of line: LF

**Linting:**
- Tool: ESLint with Next.js + TypeScript configuration
- Key rules enforced:
  - `@typescript-eslint/no-explicit-any`: ERROR (no `any` types)
  - `@typescript-eslint/no-unused-vars`: WARN (allow underscore-prefixed for intentional ignores, e.g., `_unused`)
  - `no-var`: ERROR (use `const`/`let` only)
  - `prefer-const`: WARN (const over let when possible)
  - `no-console`: WARN (allow `console.warn`, `console.error`, `console.info` for logging)
  - `react-hooks/rules-of-hooks`: ERROR
  - `react-hooks/exhaustive-deps`: WARN
- Ignore patterns: `dist`, `node_modules`, `*.config.js`, `*.config.ts`, `.auto-claude`

## Import Organization

**Order:**
1. React and Next.js imports (e.g., `import { useState } from 'react'`, `import { NextRequest } from 'next/server'`)
2. Third-party library imports (e.g., `import { GoogleGenAI } from '@google/genai'`, `import { Check } from 'lucide-react'`)
3. Local absolute imports using `@/` path alias (e.g., `import { Candidate } from '@/types'`, `import { candidateService } from '@/services/candidateService'`)
4. Relative imports (rare; prefer absolute when possible)

**Path Aliases:**
- `@/*` resolves to project root (configured in `tsconfig.json`)
- Always use `@/` for local imports across the project
- Examples: `@/types`, `@/services/candidateService`, `@/components/ui/dock`, `@/lib/db`, `@/hooks/useCandidates`

**Re-exports:**
- Services export a named object or default export: `export const candidateService = { ... }` or `export const geminiService = { ... }`
- Components always use default exports: `export default function PricingCard(...) { }`

## Error Handling

**Patterns:**
- Try-catch blocks for async operations: explicit error handling in all `async/await` chains
- Error type checking: Use `instanceof Error` to safely extract messages (e.g., `err instanceof Error ? err.message : String(err)`)
- Generic error fallback: Always provide a default message when Error type is unknown
- Shared error handler pattern: Functions like `handleResponse<T>` (in `candidateService.ts`) centralize error logic:
  ```typescript
  async function handleResponse<T>(response: Response, action: string): Promise<T> {
    if (!response.ok) {
      let message = `Failed to ${action}`;
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
      } catch {
        // response body was not JSON — use default message
      }
      throw new Error(message);
    }
    return response.json() as Promise<T>;
  }
  ```
- Silent error handling for background operations: Background mutations (like background refresh) catch errors silently; only foreground operations expose errors to UI

**Logging:**
- Framework: `console` methods (warn, error, info, log)
- Prefixing: Use service/module bracket notation for context (e.g., `[CitedEvidence]`, `[SocialMatrix]`, `[Scraper]`)
- Allowed in production: `console.warn`, `console.error`, `console.info` (as per ESLint rule)
- Development-only: Wrap dev logs in `if (process.env.NODE_ENV === 'development')` to prevent bloat
- Examples:
  ```typescript
  console.log('[CitedEvidence] 🔄 Falling back to OpenRouter...');
  console.error('[CitedEvidence] OpenRouter fallback failed:', fallbackError);
  console.warn('[SocialMatrix] GitHub quick check failed:', error);
  if (process.env.NODE_ENV === 'development') {
    console.log('[Scraper] Tier 1: Simple WebFetch...');
  }
  ```

## Comments

**When to Comment:**
- Explain "why" not "what" (code should be self-documenting)
- Use for complex algorithms or non-obvious decisions
- Document workarounds or temporary fixes with context
- Rarely needed for simple operations

**JSDoc/TSDoc:**
- Use for exported functions, interfaces, and public APIs
- Include parameter descriptions, return type, and usage examples for complex functions
- Example:
  ```typescript
  /**
   * Fetch a paginated, filterable list of candidates.
   * Returns both the candidate array and the total count for pagination.
   */
  async fetchAll(filters?: CandidateFilters): Promise<{ candidates: Candidate[]; total: number }>
  ```

## Function Design

**Size:**
- Keep functions focused and small (aim for <50 lines)
- Extract complex logic into separate utility functions
- Example violation: `app/pipeline/page.tsx` (1881 lines) needs decomposition into smaller components

**Parameters:**
- Limit parameters to 3-4; use object destructuring for multiple params
- Use type annotations for all parameters: `(id: string, data: Partial<Candidate>): Promise<Candidate>`
- Optional parameters should use `?` on the type, not runtime checks
- Use `Record<string, unknown>` for flexible object params instead of `any`

**Return Values:**
- Always type return values explicitly (no implicit returns)
- For success/failure patterns, return discriminated unions (e.g., `EnrichmentResult` in `types.ts`)
- Async functions always return `Promise<T>`
- Void returns only for side-effect functions (event handlers, state setters)

**Async Functions:**
- Always return `Promise<T>`, never bare async without return
- Use `async/await` (not `.then()` chains)
- Wrap in try-catch for all potentially failing operations
- Use `finally` for cleanup

**Callbacks:**
- Use `useCallback` with stable dependency arrays in React components
- Name callbacks with action prefix: `fetchCandidates`, `updateCandidate`, `deleteCandidate`
- Provide explicit dependency arrays; use ESLint rule to enforce

## Module Design

**Exports:**
- Services: Export a named object containing methods (e.g., `export const candidateService = { fetchAll, create, ... }`)
- Components: Always default export (e.g., `export default function PricingCard(...)`)
- Utilities: Named exports for utility functions, default export for single-export modules
- Types: Always named exports (e.g., `export interface Candidate`, `export type EnrichmentResult`)

**Barrel Files:**
- Not used; components import directly from files
- Avoid deep nesting; organize by feature/concern instead

**File Organization:**
- One main export per file (services, components)
- Group related helper functions in same file if <30 lines
- Extract utilities to separate files if reused across multiple modules
- Keep test files co-located with source (same directory)

## Code Examples

**Service Pattern (candidateService.ts):**
```typescript
export const candidateService = {
  async fetchAll(filters?: CandidateFilters): Promise<{ candidates: Candidate[]; total: number }> {
    const url = buildUrl(BASE_URL, filters);
    const response = await fetch(url);
    return handleResponse<...>(response, 'fetch candidates');
  },

  async create(data: Partial<Candidate> & { name: string }): Promise<Candidate> {
    const response = await fetch(BASE_URL, { method: 'POST', body: JSON.stringify(data) });
    return handleResponse<Candidate>(response, 'create candidate');
  }
};
```

**Component Pattern (PricingCard.tsx):**
```typescript
interface PricingCardProps {
  name: string;
  price: string;
  popular?: boolean;
}

export default function PricingCard({ name, price, popular }: PricingCardProps) {
  return (
    <div className={`border ${popular ? 'border-blue-500' : 'border-white/10'}`}>
      {/* JSX content */}
    </div>
  );
}
```

**Hook Pattern (useCandidates.ts):**
```typescript
export function useCandidates(filters?: CandidateFilters): UseCandidatesReturn {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await candidateService.fetchAll(filters);
      setCandidates(result.candidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return { candidates, isLoading, error, refresh: fetchCandidates };
}
```

**API Route Pattern (app/api/candidates/route.ts):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireOptionalAuth } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOptionalAuth();
    const userId = auth?.user.id;

    // Parse and validate parameters
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '50'), 200);

    // Business logic
    const data = await fetchData();

    // Return success response
    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('[API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

*Convention analysis: 2026-02-16*

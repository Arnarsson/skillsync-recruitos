# Testing Patterns

**Analysis Date:** 2026-01-24

## Test Framework

**Runner:**
- Vitest (config backed up as `vitest.config.ts.bak`)
- Status: **Not currently enabled** - tests exist but Vitest is not configured in package.json
- Note: Test commands (`npm test`, `npm run test:watch`, `npm run test:coverage`) are not in package.json

**Assertion Library:**
- Vitest built-in assertions: `expect()`
- React Testing Library: `@testing-library/react` for component testing
- Additional: `@testing-library/jest-dom` for DOM assertions

**Run Commands:**
```bash
# Once Vitest config is restored and enabled:
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report
```

## Test File Organization

**Location:**
- Tests are co-located in `/tests` directory, not alongside source files
- Organized by category: `tests/services/`, `tests/hooks/`, `tests/e2e/`

**Naming:**
- Unit/integration: `.test.ts` (e.g., `geminiService.test.ts`)
- End-to-end: `.spec.ts` (e.g., `core-funnel.spec.ts`)
- Pattern: Mirror source file name with suffix

**Structure:**
```
tests/
├── services/              # Service unit tests
│   ├── geminiService.test.ts
│   ├── candidateService.test.ts
│   ├── behavioralSignalsService.test.ts
│   └── [feature].test.ts
├── hooks/                 # Hook unit tests
│   └── usePersistedState.test.ts
├── e2e/                   # End-to-end tests (Playwright)
│   └── core-funnel.spec.ts
└── setup.ts              # Vitest setup file (mocks, fixtures)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('serviceName', () => {
  describe('functionName', () => {
    it('should do specific behavior', () => {
      // Arrange
      const input = {...};

      // Act
      const result = performAction(input);

      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle error case', async () => {
      await expect(riskyFunction()).rejects.toThrow('Expected error');
    });
  });
});
```

**Patterns:**
- Use `describe()` blocks for suite organization (service name, function name)
- `it()` statements describe specific behavior (starts with "should")
- `beforeEach()` for setup/mocking before each test
- `afterEach()` for cleanup and mock restoration
- Follow Arrange-Act-Assert (AAA) pattern
- Async tests: `async` keyword and `await` for async operations

## Mocking

**Framework:** Vitest's built-in `vi` mock utilities

**Patterns:**

```typescript
// Mock entire module (at top of file)
vi.mock('../../services/supabase', () => {
  return {
    getSupabase: vi.fn(() => mockClient),
    resetSupabase: vi.fn()
  };
});

// Spy on existing function
const setItemSpy = vi.spyOn(localStorage, 'setItem');
expect(setItemSpy).toHaveBeenCalledWith(key, value);

// Mock return value
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'response' })
});

// Mock rejection
mockFetch.mockRejectedValue(new Error('API Error'));

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Restore all mocks after tests
afterEach(() => {
  vi.restoreAllMocks();
});
```

**What to Mock:**
- External APIs (fetch, Gemini, BrightData)
- localStorage/sessionStorage
- Dependencies with side effects
- Time-dependent functions (use `vi.useFakeTimers()`)

**What NOT to Mock:**
- Core business logic functions
- Data transformation utilities
- Hooks themselves (unless testing external calls within them)
- DOM APIs in component tests (use actual DOM)

**localStorage Mock Pattern:**
```typescript
// tests/setup.ts defines functional mock
function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    // ... other methods
  };
}
```

## Fixtures and Factories

**Test Data:**
```typescript
// From candidateService.test.ts
const mockCandidate: Candidate = {
  id: 'test-123',
  name: 'John Doe',
  currentRole: 'Senior Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  yearsExperience: 5,
  avatar: 'https://example.com/avatar.jpg',
  alignmentScore: 85,
  scoreBreakdown: {
    skills: { value: 20, max: 25, percentage: 80 },
    experience: { value: 18, max: 20, percentage: 90 },
    industry: { value: 15, max: 20, percentage: 75 },
    seniority: { value: 16, max: 20, percentage: 80 },
    location: { value: 13, max: 15, percentage: 87 }
  },
  shortlistSummary: 'Strong technical background',
  keyEvidence: ['5 years React', 'Led team of 4'],
  risks: ['Remote work preference'],
  unlockedSteps: [FunnelStage.SHORTLIST]
};
```

**Location:**
- Test fixtures are defined in each test file
- Factory-style functions for creating variations of test data
- Re-used across related test suites

## Coverage

**Requirements:** Not currently enforced (test framework not configured)

**View Coverage:**
```bash
npm run test:coverage
```

**Config:**
```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'tests/',
    '*.config.ts',
    'dist/',
  ],
}
```

## Test Types

**Unit Tests:**
- Scope: Single function or hook in isolation
- Location: `tests/services/`, `tests/hooks/`
- Pattern: Mock all external dependencies
- Example: Testing `usePersistedState()` initialization, state updates, and localStorage persistence

**Integration Tests:**
- Scope: Multiple related functions working together (not yet established)
- Currently used for service tests that interact with mocked APIs

**E2E Tests:**
- Framework: Playwright (`.spec.ts` files)
- Location: `tests/e2e/`
- Scope: Full user workflows across pages
- Example: `core-funnel.spec.ts` - Job intake → Shortlist → Deep Profile flow

**E2E Test Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test('Core Funnel: Intake -> Shortlist -> Deep Profile', async ({ page }) => {
  // 1. Navigate to page
  await page.goto('/');

  // 2. Interact with UI
  const button = page.getByRole('button', { name: /Load Demo/i });
  await button.click();

  // 3. Assert outcomes
  await expect(page).toHaveTitle(/Apex OS/);
  await expect(page.getByText('Talent Engine')).toBeVisible({ timeout: 10000 });
});
```

## Common Patterns

**Async Testing:**
```typescript
// For async functions
it('should fetch candidates', async () => {
  const candidates = await candidateService.fetchAll();
  expect(candidates).toBeInstanceOf(Array);
});

// For promises that reject
it('should throw error when API key is missing', async () => {
  localStorage.getItem = vi.fn().mockReturnValue(null);
  await expect(
    analyzeCandidateProfile('resume', 'job')
  ).rejects.toThrow('API Key missing');
});

// For React hooks with async
it('should persist state to localStorage', () => {
  const setItemSpy = vi.spyOn(localStorage, 'setItem');
  const { result } = renderHook(() => usePersistedState('key', 'initial'));

  act(() => {
    result.current[1]('updated');
  });

  expect(setItemSpy).toHaveBeenCalledWith('key', JSON.stringify('updated'));
});
```

**Error Testing:**
```typescript
// Testing error paths
it('should handle missing API key', async () => {
  vi.spyOn(localStorage, 'getItem').mockReturnValue(null);

  await expect(geminiService.analyze(profile)).rejects.toThrow('API Key missing');
});

// Testing error recovery
it('should load from localStorage when Supabase returns error', async () => {
  localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([mockCandidate]));

  const supabase = await getMockedSupabase();
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: null, error: 'Network error' }))
    }))
  });

  const candidates = await candidateService.fetchAll();
  expect(candidates).toEqual([mockCandidate]);
});
```

**Hook Testing with act():**
```typescript
import { renderHook, act } from '@testing-library/react';

it('should handle functional updates', () => {
  const { result } = renderHook(() => usePersistedState('key', 0));

  act(() => {
    result.current[1](prev => prev + 1);
  });

  expect(result.current[0]).toBe(1);
});
```

**Setup and Cleanup:**
```typescript
describe('featureService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test case', () => {
    // Test runs with clean state
  });
});
```

---

*Testing analysis: 2026-01-24*

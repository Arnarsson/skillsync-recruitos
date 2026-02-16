# Testing Patterns

**Analysis Date:** 2026-02-16

## Test Framework

**Runner:**
- Vitest (configured in `vitest.config.ts`)
- Environment: jsdom (for component and browser-based testing)
- Global test utilities enabled (describe, it, expect, beforeEach, etc.)

**Assertion Library:**
- Vitest built-in expect (compatible with Jest assertions)
- `@testing-library/react` for component testing (renderHook, act, cleanup)
- `@testing-library/jest-dom/vitest` for DOM matchers

**Run Commands:**
```bash
npm run test              # Run all tests in watch mode
npm run test:ui          # Interactive UI mode with coverage
npm run test:run         # Run tests once (CI mode)
npm run test:coverage    # Generate coverage report (HTML, JSON, text)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:headed  # Playwright tests with visible browser
```

**Pre-commit Hook:**
- Husky runs `vitest` automatically before commits
- 17 tests in `candidateService.test.ts` fail (pre-existing: tests old localStorage API)
- 3 tests in `anti-gaming-filters.test.ts` fail (pre-existing anti-gaming-filter failures)
- These failures do NOT block commits currently but should be addressed

## Test File Organization

**Location:**
- Co-located: Test files live in `/tests` directory matching source structure
  - `tests/services/*.test.ts` for service tests
  - `tests/hooks/*.test.ts` for hook tests
  - `tests/api/*.test.ts` for API route tests
  - `tests/lib/*.test.ts` for utility tests
  - `tests/auth/*.test.ts` for auth-specific tests
  - `tests/e2e/*.spec.ts` for Playwright E2E tests

**Naming:**
- Unit/integration: `[name].test.ts` (e.g., `candidateService.test.ts`, `usePersistedState.test.ts`)
- E2E: `[name].spec.ts` (e.g., `intake.spec.ts`, `pipeline.spec.ts`)
- QA checks: `qa-checklist.spec.ts` (special Playwright suite)

**Structure:**
```
tests/
├── setup.ts                     # Global test setup (localStorage mock, cleanup)
├── services/
│   ├── candidateService.test.ts
│   ├── geminiService.test.ts
│   └── ...
├── hooks/
│   └── usePersistedState.test.ts
├── api/
│   ├── search.test.ts
│   └── ...
├── lib/
│   └── pricing-catalog-consistency.test.ts
├── auth/
│   └── route-protection.test.ts
├── e2e/
│   ├── intake.spec.ts
│   ├── pipeline.spec.ts
│   └── ...
├── anti-gaming-filters.test.ts  # Unit tests for gaming detection
└── qa-checklist.spec.ts         # Playwright QA suite
```

## Test Structure

**Suite Organization (tests/setup.ts):**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ComponentName', () => {
  // Global setup
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('methodName', () => {
    it('should do X when Y happens', () => {
      // Arrange
      const input = setupTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

**Patterns:**

1. **Setup Pattern (beforeEach/afterEach):**
   - Clear mocks: `vi.clearAllMocks()`
   - Spy on console: `vi.spyOn(console, 'warn').mockImplementation(() => {})`
   - Cleanup: `afterEach(() => { vi.restoreAllMocks(); })`
   - Isolate state: `localStorage.clear()` before each test

2. **Arrange-Act-Assert:**
   - Arrange: Set up test data and mocks
   - Act: Call the function/component under test
   - Assert: Verify the result matches expectations

3. **Test Naming:**
   - Use "should X when Y" pattern (e.g., "should return empty array when no candidates exist")
   - Descriptive: Full sentence that explains test intent
   - Avoid: "test X", "test 1", generic names

## Mocking

**Framework:** Vitest (`vi` namespace)

**Patterns:**

1. **Mock Functions:**
   ```typescript
   const mockFetch = vi.fn();
   vi.stubGlobal('fetch', mockFetch);

   // Mock return value
   mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

   // Assert calls
   expect(mockFetch).toHaveBeenCalledWith('/api/candidates');
   expect(mockFetch.mock.calls[0][0]).toContain('limit=10');
   ```

2. **Mock Responses (helper):**
   ```typescript
   function jsonResponse(body: unknown, status = 200) {
     return new Response(JSON.stringify(body), {
       status,
       headers: { 'Content-Type': 'application/json' },
     });
   }

   // Usage
   mockFetch.mockResolvedValueOnce(jsonResponse({ candidates: [mockCandidate] }));
   ```

3. **localStorage Mock (setup.ts):**
   ```typescript
   function createLocalStorageMock(): Storage {
     let store: Record<string, string> = {};
     return {
       getItem: vi.fn((key: string) => store[key] ?? null),
       setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
       removeItem: vi.fn((key: string) => { delete store[key]; }),
       clear: vi.fn(() => { store = {}; }),
       key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
       get length() { return Object.keys(store).length; },
     };
   }

   Object.defineProperty(global, 'localStorage', {
     value: createLocalStorageMock(),
     writable: true,
   });
   ```

4. **Spying on Methods:**
   ```typescript
   const setItemSpy = vi.spyOn(localStorage, 'setItem');
   // ... perform test ...
   expect(setItemSpy).toHaveBeenCalledWith('key-3', JSON.stringify('updated'));
   setItemSpy.mockClear(); // Reset count without clearing mock
   ```

**What to Mock:**
- API calls (fetch requests to external services)
- External dependencies (Google Gemini, OpenRouter, GitHub API)
- Browser APIs (localStorage, sessionStorage, fetch)
- Heavy operations (large computations, network requests)
- Time-based functions (in place of real timers)

**What NOT to Mock:**
- Core business logic functions (test real behavior)
- Data transformation utilities
- Type checking/validation
- React hooks (use renderHook for hooks; use shallow rendering for components using hooks)
- localStorage reads in tests that validate persistence (write real values, read real)

## Fixtures and Factories

**Test Data (candidateService.test.ts):**
```typescript
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
    location: { value: 13, max: 15, percentage: 87 },
  },
  shortlistSummary: 'Strong technical background',
  keyEvidence: ['5 years React', 'Led team of 4'],
  risks: ['Remote work preference'],
  unlockedSteps: [FunnelStage.SHORTLIST],
  sourceUrl: 'https://linkedin.com/in/johndoe',
  rawProfileText: 'Senior Engineer with 5 years...',
};
```

**Location:**
- Define in test files themselves (not separate fixtures directory)
- Group related test data near the test that uses it
- Create descriptive names: `mockCandidate`, `mockApiResponse`, `highQualitySignals`, `lowQualitySignals`

**Example (anti-gaming-filters.test.ts):**
```typescript
const highQualitySignals: QualitySignals = {
  isTutorialRepo: false,
  forkRatio: 0.2,
  hasSustantiveContributions: true,
  hasCommitBursts: false,
  substantiveDiffScore: 90,
  reviewParticipation: 80,
  maintenanceScore: 85,
  issueDiscussionScore: 70,
  overallQualityScore: 95,
  flags: ['✓ High-quality profile', 'Active code reviewer'],
};

const lowQualitySignals: QualitySignals = {
  isTutorialRepo: true,
  forkRatio: 0.9,
  hasSustantiveContributions: false,
  hasCommitBursts: true,
  substantiveDiffScore: 20,
  reviewParticipation: 0,
  maintenanceScore: 10,
  issueDiscussionScore: 0,
  overallQualityScore: 25,
  flags: ['Fork-heavy profile', 'Tutorial repos in top 10'],
};
```

## Coverage

**Requirements:** None enforced (not configured in pre-commit)

**View Coverage:**
```bash
npm run test:coverage    # Generates HTML report in coverage/index.html
```

**Coverage Config (vitest.config.ts):**
- Provider: v8
- Reporters: text (console), json, html (in coverage/ directory)
- Exclude: node_modules/, tests/, *.config.ts, dist/, .auto-claude/

**Note:** Coverage is measured but not required; use as informational metric for gap analysis

## Test Types

**Unit Tests:**
- Scope: Single function or service method
- Approach: Mock external dependencies, test function output given inputs
- Location: `tests/services/*.test.ts`, `tests/lib/*.test.ts`
- Example: `candidateService.test.ts` tests individual methods like `fetchAll`, `create`, `update`, `delete` with mocked fetch
- Pattern: Isolate function, verify return values and call counts

**Integration Tests:**
- Scope: Multiple functions working together (e.g., hook calling service, service calling API)
- Approach: Mock external APIs (fetch) but test real business logic
- Location: `tests/hooks/*.test.ts`, `tests/api/*.test.ts`
- Example: `usePersistedState.test.ts` tests hook behavior with real localStorage
- Pattern: Set up realistic scenarios, verify state updates and side effects

**E2E Tests (Playwright):**
- Scope: Full user flows across app
- Framework: Playwright (`@playwright/test`)
- Location: `tests/e2e/*.spec.ts`
- Examples: `intake.spec.ts`, `pipeline.spec.ts`, `search.spec.ts`
- Run: `npm run test:e2e`
- Pattern: Navigate app, interact with UI, verify outcomes

**QA Checklist (Special Playwright Suite):**
- File: `tests/qa-checklist.spec.ts`
- Purpose: Verify visual quality, responsiveness, console errors, accessibility
- Tests include:
  - Light/dark mode rendering
  - Mobile/tablet/desktop viewports
  - Console error detection
  - PDF export functionality
  - Navigation flows
  - Empty/error states
  - Accessibility (heading structure, keyboard nav)
  - Performance (page load time < 3s)

## Common Patterns

**Async Testing (usePersistedState.test.ts):**
```typescript
it('should persist state to localStorage when updated', () => {
  const setItemSpy = vi.spyOn(localStorage, 'setItem');
  const { result } = renderHook(() => usePersistedState('key-3', 'initial'));

  // Act with state update
  act(() => {
    result.current[1]('updated');
  });

  // Assert
  expect(setItemSpy).toHaveBeenCalledWith('key-3', JSON.stringify('updated'));
  expect(result.current[0]).toBe('updated');
});
```

**Error Testing (candidateService.test.ts):**
```typescript
it('should throw on API error', async () => {
  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: 'Candidate not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  );

  await expect(candidateService.fetchById('missing-id')).rejects.toThrow(
    'Candidate not found'
  );
});
```

**React Hook Testing (renderHook pattern):**
```typescript
it('should initialize with value from localStorage if it exists', () => {
  localStorage.setItem('key-2', JSON.stringify('stored'));
  const { result } = renderHook(() => usePersistedState('key-2', 'initial'));
  expect(result.current[0]).toBe('stored');
});
```

**Quality Signals Testing (discriminated union):**
```typescript
it('should reduce score for low-quality profiles', () => {
  const lowQualitySignals: QualitySignals = { /* ... */ };
  const result = applyQualityAdjustment(80, lowQualitySignals);
  expect(result.adjustedScore).toBeLessThan(80);
  expect(result.adjustment).toBeLessThan(0);
});
```

**Commit Burst Detection (async with multiple events):**
```typescript
it('should detect suspicious commit bursts', async () => {
  const events = [
    // 20 normal days with 1-3 commits
    ...Array(20).fill(null).map((_, day) => ({
      type: 'PushEvent',
      created_at: `2024-01-${String(day + 1).padStart(2, '0')}T10:00:00Z`,
      payload: { commits: new Array(2).fill({}) },
    })),
    // 2 burst days with 200 commits each
    { type: 'PushEvent', created_at: '2024-01-25T10:00:00Z', payload: { commits: new Array(200).fill({}) } },
    { type: 'PushEvent', created_at: '2024-01-26T10:00:00Z', payload: { commits: new Array(200).fill({}) } },
  ];

  const result = await detectCommitBursts(events);
  expect(result.hasBursts).toBe(true);
  expect(result.burstDays).toBeGreaterThan(0);
});
```

## Known Test Failures

**Service Tests (17 failures):**
- File: `tests/services/candidateService.test.ts`
- Cause: Tests written for old localStorage-based API
- Current API: Now fetch-based (`/api/candidates` routes)
- Status: Pre-existing failures, do NOT block commits
- Fix approach: Update tests to mock correct API responses (see working pattern in top of file)

**Anti-Gaming Filters (3 failures):**
- File: `tests/anti-gaming-filters.test.ts`
- Cause: Pre-existing test failures (unrelated to Phase 0 changes)
- Status: Do NOT block commits
- Note: Core filter logic works; tests need alignment

**Recommendation:** Address in dedicated testing phase, not blocking feature work

---

*Testing analysis: 2026-02-16*

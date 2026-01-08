# Testing Patterns Guide

## Overview

This guide documents testing patterns and best practices for the 6Degrees codebase using Vitest and React Testing Library.

## Test Infrastructure

### Tools

- **Vitest** - Fast unit test framework (Vite-native)
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - DOM matchers

### Test Commands

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

---

## Test Structure

### Directory Organization

```
tests/
├── setup.ts                           # Global test configuration
├── hooks/
│   └── usePersistedState.test.ts     # Hook tests
├── services/
│   ├── candidateService.test.ts      # Service logic tests
│   ├── geminiService.test.ts         # AI service tests
│   └── scrapingService.test.ts       # External API tests
└── components/
    ├── TalentHeatMap.test.tsx        # Component tests
    └── BattleCardCockpit.test.tsx    # Complex component tests
```

### Test File Naming

- Service tests: `[serviceName].test.ts`
- Component tests: `[ComponentName].test.tsx`
- Hook tests: `[hookName].test.ts`

---

## Service Testing Pattern

### Example: candidateService.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { candidateService } from '../../services/candidateService';
import { Candidate, FunnelStage } from '../../types';

// Mock external dependencies
vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

const CANDIDATES_STORAGE_KEY = 'apex_candidates';

describe('candidateService', () => {
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
    unlockedSteps: [FunnelStage.SHORTLIST],
    sourceUrl: 'https://linkedin.com/in/johndoe',
    rawProfileText: 'Senior Engineer with 5 years...'
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Suppress console in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAll', () => {
    it('should return empty array when localStorage is empty', async () => {
      const { supabase } = await import('../../services/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      } as any);

      const candidates = await candidateService.fetchAll();
      expect(candidates).toEqual([]);
    });

    it('should load from localStorage when Supabase fails', async () => {
      localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([mockCandidate]));

      const { supabase } = await import('../../services/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Network error' }
          }))
        }))
      } as any);

      const candidates = await candidateService.fetchAll();
      expect(candidates).toHaveLength(1);
      expect(candidates[0].id).toBe('test-123');
    });
  });

  describe('create', () => {
    it('should save to localStorage immediately', async () => {
      await candidateService.create(mockCandidate);

      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed[0].id).toBe('test-123');
    });

    it('should gracefully handle Supabase errors', async () => {
      const { supabase } = await import('../../services/supabase');
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insert failed' }
          }))
        }))
      } as any);

      const result = await candidateService.create(mockCandidate);
      expect(result).toEqual([mockCandidate]);

      // Should still be in localStorage
      const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      expect(stored).toBeTruthy();
    });
  });
});
```

---

## Key Testing Patterns

### 1. Mock External Dependencies

Always mock external services (Supabase, APIs):

```typescript
vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));
```

### 2. Use beforeEach/afterEach for Cleanup

```typescript
beforeEach(() => {
  localStorage.clear();        // Reset localStorage
  vi.clearAllMocks();          // Clear mock call history
  // Suppress console noise
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();        // Restore original implementations
});
```

### 3. Test Both Success and Failure Paths

```typescript
it('should handle success case', async () => {
  // Setup successful response
  // Assert happy path
});

it('should handle error case gracefully', async () => {
  // Setup error response
  // Assert error handling
});
```

### 4. Test Edge Cases

```typescript
describe('edge cases', () => {
  it('should handle empty input', async () => {
    // Test with empty arrays, null, undefined
  });

  it('should handle malformed data', async () => {
    localStorage.setItem('key', 'invalid json {{{');
    // Should not throw
  });

  it('should handle quota exceeded error', async () => {
    vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
    // Should handle gracefully
  });
});
```

---

## localStorage Mocking

### Test Setup (tests/setup.ts)

```typescript
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage with actual implementation
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

global.localStorage = new LocalStorageMock() as any;
```

**Why actual implementation?**
- Simple `vi.fn()` mocks don't store data
- Tests need real get/set/clear behavior
- Enables testing localStorage-dependent logic

---

## Test Coverage Guidelines

### Target Coverage

- **Services**: 80%+ coverage
- **Components**: 70%+ coverage
- **Critical paths**: 100% coverage (auth, payments, data persistence)

### What to Test

#### Services
- ✅ All exported functions
- ✅ Success paths
- ✅ Error handling
- ✅ Edge cases (null, empty, malformed)
- ✅ External service failures
- ✅ Data transformations

#### Components
- ✅ Rendering with default props
- ✅ User interactions (clicks, input)
- ✅ Conditional rendering
- ✅ Loading/error states
- ✅ Prop validation

### What NOT to Test

- ❌ Third-party library internals
- ❌ Trivial getters/setters
- ❌ Type definitions
- ❌ Mock implementations themselves

---

## Running Tests

### Watch Mode (Development)

```bash
npm run test:watch
```

Auto-reruns tests on file changes. Use for TDD workflow.

### Coverage Report

```bash
npm run test:coverage
```

Generates HTML coverage report in `coverage/` directory.

### CI/CD Integration

Tests run automatically on:
- Pre-commit hook (via `.husky/pre-commit`)
- GitHub Actions (`.github/workflows/ci.yml`)
- Pull request checks

---

## Common Patterns

### Testing Async Functions

```typescript
it('should fetch data asynchronously', async () => {
  const data = await service.fetchData();
  expect(data).toBeDefined();
});
```

### Testing Error Objects

```typescript
it('should handle typed errors', async () => {
  const mockError = new Error('Test error');
  vi.mocked(service.someMethod).mockRejectedValue(mockError);

  await expect(service.someMethod()).rejects.toThrow('Test error');
});
```

### Testing with Timers

```typescript
it('should debounce input', async () => {
  vi.useFakeTimers();

  const handleChange = vi.fn();
  // Trigger debounced function

  vi.advanceTimersByTime(500);
  expect(handleChange).toHaveBeenCalledOnce();

  vi.useRealTimers();
});
```

---

## Best Practices

### ✅ DO

- **Test behavior, not implementation**: Focus on what functions do, not how
- **Use descriptive test names**: `it('should save to localStorage when Supabase unavailable')`
- **One assertion per test** (when possible): Makes failures easier to diagnose
- **Mock external dependencies**: Don't make real API calls in tests
- **Test edge cases**: null, undefined, empty, malformed data
- **Use TypeScript**: Leverage type safety in tests too

### ❌ DON'T

- **Don't test implementation details**: Avoid testing internal state
- **Don't make real API calls**: Always mock external services
- **Don't skip error cases**: Test failure paths too
- **Don't use `any` type**: Properly type test data and mocks
- **Don't test third-party code**: Trust that libraries work
- **Don't write flaky tests**: Tests should be deterministic

---

## Example: Full Service Test Suite

```typescript
describe('candidateService', () => {
  // Test data
  const mockCandidate = { /* ... */ };

  // Setup/teardown
  beforeEach(() => { /* ... */ });
  afterEach(() => { /* ... */ });

  // Group related tests
  describe('fetchAll', () => {
    it('should return empty array when storage empty', async () => { /* ... */ });
    it('should load from localStorage on Supabase error', async () => { /* ... */ });
    it('should cache Supabase results to localStorage', async () => { /* ... */ });
  });

  describe('create', () => {
    it('should save to localStorage immediately', async () => { /* ... */ });
    it('should call Supabase with correct mapping', async () => { /* ... */ });
    it('should deduplicate by ID', async () => { /* ... */ });
  });

  describe('error handling', () => {
    it('should handle quota exceeded', async () => { /* ... */ });
    it('should handle malformed JSON', async () => { /* ... */ });
  });
});
```

---

## Resources

- **Vitest Docs**: https://vitest.dev
- **React Testing Library**: https://testing-library.com/react
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## Current Coverage

| Area | Files Tested | Coverage | Status |
|------|-------------|----------|--------|
| **Hooks** | 1/1 (usePersistedState) | ~80% | ✅ Good |
| **Services** | 2/6 (candidateService, geminiService) | ~20% | ⚠️ Needs work |
| **Components** | 0/12 | 0% | ❌ Critical gap |

**Next Priority**: Add tests for TalentHeatMap, BattleCardCockpit, scrapingService

---

**Last Updated:** 2026-01-08

# Console → Logger Migration Guide

## Overview

This guide documents the migration from raw `console.*` statements to the centralized `logger` service in the 6Degrees codebase. This migration improves production performance, security, and debugging capabilities.

## Why Migrate?

### Problems with Direct Console Usage

1. **Production Exposure**: Console statements leak internal application logic via browser DevTools
2. **Performance**: Unnecessary I/O operations in production builds
3. **Security**: May leak sensitive debugging information
4. **Inconsistency**: No standardized format or context

### Benefits of Logger Service

1. **Environment-Aware**: Automatically suppresses debug/info logs in production
2. **Structured Context**: Service, operation, and metadata tracking
3. **Consistent Format**: Timestamps, log levels, and formatting
4. **Centralized Control**: Single place to adjust logging behavior

---

## Migration Pattern

### Before: Raw Console Statements

```typescript
// ❌ BAD - Raw console usage
if (process.env.NODE_ENV === 'development') {
  console.log('Fetching candidates from database');
}

try {
  const data = await fetchData();
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Database error:', error);
  }
}

console.warn('Supabase not connected. Using localStorage.');
```

### After: Structured Logger

```typescript
// ✅ GOOD - Structured logging with logger service
import { log } from './logger';

log.debug('Fetching candidates from database', {
  service: 'candidateService',
  operation: 'fetchAll'
});

try {
  const data = await fetchData();
} catch (error: unknown) {
  log.error('Database error', error, {
    service: 'candidateService',
    operation: 'fetchAll'
  });
}

log.warn('Supabase not connected. Using localStorage persistence.', {
  service: 'candidateService',
  operation: 'fetchAll'
});
```

---

## Logger API Reference

### Available Log Levels

```typescript
import { log } from '@/services/logger';

// DEBUG - Development-only, suppressed in production
log.debug(message: string, context?: LogContext);

// INFO - Informational, suppressed in production
log.info(message: string, context?: LogContext);

// WARN - Always logged, non-fatal issues
log.warn(message: string, context?: LogContext);

// ERROR - Always logged, error conditions
log.error(message: string, error?: unknown, context?: LogContext);
```

### Specialized Loggers

```typescript
// API Call Logging
log.api(
  service: string,      // e.g., 'Gemini', 'Firecrawl'
  operation: string,    // e.g., 'analyzeCandidateProfile'
  success: boolean,
  duration?: number     // milliseconds
);

// Database Operation Logging
log.db(
  operation: string,    // e.g., 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  table: string,        // e.g., 'candidates'
  success: boolean,
  error?: unknown
);
```

### LogContext Interface

```typescript
interface LogContext {
  service?: string;      // Service name (e.g., 'candidateService')
  operation?: string;    // Function/operation name (e.g., 'fetchAll')
  metadata?: Record<string, unknown>;  // Additional structured data
}
```

---

## Migration Examples

### Example 1: Service Functions

```typescript
// BEFORE
export const candidateService = {
  async fetchAll(): Promise<Candidate[]> {
    if (!supabase) {
      console.warn('Supabase not connected. Using localStorage persistence.');
      return loadFromLocalStorage();
    }

    try {
      const { data, error } = await supabase.from('candidates').select('*');

      if (error) {
        console.error('Supabase Fetch Error:', error);
        return loadFromLocalStorage();
      }

      return data;
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Supabase connection error:', err);
      }
      return loadFromLocalStorage();
    }
  }
};

// AFTER
import { log } from './logger';

export const candidateService = {
  async fetchAll(): Promise<Candidate[]> {
    if (!supabase) {
      log.warn('Supabase not connected. Using localStorage persistence.', {
        service: 'candidateService',
        operation: 'fetchAll'
      });
      return loadFromLocalStorage();
    }

    try {
      const { data, error } = await supabase.from('candidates').select('*');

      if (error) {
        log.db('SELECT', 'candidates', false, error);
        return loadFromLocalStorage();
      }

      log.db('SELECT', 'candidates', true);
      return data;
    } catch (err: unknown) {
      log.error('Supabase connection error', err, {
        service: 'candidateService',
        operation: 'fetchAll'
      });
      return loadFromLocalStorage();
    }
  }
};
```

### Example 2: Error Handling with Metadata

```typescript
// BEFORE
try {
  const profile = await enrichProfile(candidate);
} catch (error) {
  console.error('Failed to enrich profile:', error);
}

// AFTER
import { log } from './logger';

try {
  const profile = await enrichProfile(candidate);
} catch (error: unknown) {
  log.error('Failed to enrich profile', error, {
    service: 'enrichmentService',
    operation: 'enrichProfile',
    metadata: {
      candidateId: candidate.id,
      candidateName: candidate.name
    }
  });
}
```

### Example 3: Debug Logging with Rich Context

```typescript
// BEFORE
if (process.env.NODE_ENV === 'development') {
  console.log('[Enrichment] Found', results.length, 'SERP results');
  console.log('[Enrichment] Scraped', textLength, 'characters');
}

// AFTER
import { log } from './logger';

log.debug('Found SERP results', {
  service: 'enrichmentService',
  operation: 'enrichSparseProfile',
  metadata: {
    resultsCount: results.length,
    query: searchQuery
  }
});

log.debug('Scraped content from URL', {
  service: 'enrichmentService',
  operation: 'enrichSparseProfile',
  metadata: {
    url: targetUrl,
    textLength: textLength
  }
});
```

---

## Migration Checklist

When migrating a file:

- [ ] **Import logger**: Add `import { log } from '@/services/logger';` at top
- [ ] **Remove env checks**: Delete all `if (process.env.NODE_ENV === 'development')` wrappers
- [ ] **Convert console.log** → `log.debug()`
- [ ] **Convert console.info** → `log.info()`
- [ ] **Convert console.warn** → `log.warn()`
- [ ] **Convert console.error** → `log.error()`
- [ ] **Add context**: Include `service` and `operation` in all log calls
- [ ] **Add metadata**: Include relevant data for debugging
- [ ] **Use specialized loggers**: Use `log.api()` or `log.db()` where appropriate
- [ ] **Fix error types**: Change `catch (error)` → `catch (error: unknown)`
- [ ] **Test**: Verify logs appear in development, suppressed in production

---

## Migration Statistics

### Files Migrated (as of 2026-01-08)

| File | Console Statements | Migrated | Status |
|------|-------------------|----------|--------|
| `services/candidateService.ts` | 14 | 14 | ✅ Complete |
| `services/enrichmentService.ts` | 40+ | 40+ | ✅ Complete |
| **TOTAL** | **54+** | **54+** | **23% of codebase** |

### Remaining Work

- `services/geminiService.ts` - ~30 statements
- `services/scrapingService.ts` - ~15 statements
- `components/*.tsx` - ~130 statements
- Other files - ~TBD

**Total Remaining:** ~175 console statements across codebase

---

## ESLint Configuration (Recommended)

After migration is complete, enforce logger usage with ESLint:

```json
// .eslintrc.json
{
  "rules": {
    "no-console": ["error", { "allow": [] }]
  }
}
```

This will prevent new `console.*` statements from being added.

---

## Logger Service Implementation

For reference, here's the core logger implementation:

```typescript
// services/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  service?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

const isDevelopment = typeof process !== 'undefined' &&
                      process.env?.NODE_ENV === 'development';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!isDevelopment && (level === 'debug' || level === 'info')) {
      return false;
    }
    return true;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context),
                    context?.metadata || '');
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error;
      console.error(this.formatMessage('error', message, context),
                    errorDetails,
                    context?.metadata || '');
    }
  }

  // ... other methods
}

export const logger = new Logger();
export const log = {
  debug: (msg: string, ctx?: LogContext) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: LogContext) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.warn(msg, ctx),
  error: (msg: string, err?: unknown, ctx?: LogContext) => logger.error(msg, err, ctx),
  // ... convenience methods
};
```

---

## Best Practices

### ✅ DO

- **Always provide context**: Include `service` and `operation`
- **Use appropriate log levels**: debug for development, warn for issues, error for failures
- **Include metadata**: Add relevant data for debugging
- **Type errors properly**: Use `catch (error: unknown)`
- **Use specialized loggers**: Prefer `log.db()` and `log.api()` when applicable

### ❌ DON'T

- **Don't use console directly**: Always use logger service
- **Don't omit context**: Logs without context are hard to trace
- **Don't log sensitive data**: Avoid passwords, API keys, PII in logs
- **Don't use `any` type**: Properly type error objects as `unknown`
- **Don't over-log**: Avoid logging inside tight loops

---

## Questions?

For questions or issues with the logger service, see:
- Implementation: `services/logger.ts`
- Examples: `services/candidateService.ts`, `services/enrichmentService.ts`
- CLAUDE.md: Project coding standards

---

**Migration Progress:** 54+ / 231 statements complete (23%)
**Target:** 100% migration by end of Q1 2026

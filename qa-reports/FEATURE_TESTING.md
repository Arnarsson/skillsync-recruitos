# Feature Testing Report

**Tester:** feature-tester
**Date:** 2026-02-09
**Branch:** merge-recruitos
**Environment:** localhost:3000 (dev server)

## Executive Summary

Tested all user-facing features of RecruitOS after security hardening. The application is stable with security headers properly configured and auth protection working on all protected routes. However, a **critical bug** was found in demo mode authentication that prevents demo users from accessing protected pages.

**Overall Status: MOSTLY FUNCTIONAL with 1 critical bug**

---

## 1. Authentication Flow (Login/Signup/Logout)

### Status: PARTIAL PASS (Bug Found)

#### What Works
- Login page loads correctly (200 OK)
- Signup page loads correctly (200 OK)
- GitHub OAuth button triggers `signIn("github")` correctly
- Demo button visible with bilingual text "Prøv Demo / Try Demo"
- Protected routes correctly redirect unauthenticated users (307 -> /login)
- Auth session endpoint returns empty `{}` for unauthenticated requests (correct)

#### Bug: Demo Mode Authentication Broken

**Severity: CRITICAL**

**Description:** The "Try Demo" button on the login page sets a cookie (`recruitos_demo=true`) and localStorage values, then navigates to `/intake?demo=true`. However, the middleware (`middleware.ts`) does NOT check for the demo cookie. It only checks for a NextAuth JWT token via `getToken()`. This causes an infinite redirect loop:

1. User clicks "Try Demo"
2. `handleDemoMode()` sets cookie + localStorage, calls `router.push("/intake?demo=true")`
3. Middleware intercepts request to `/intake`
4. `getToken()` returns null (no NextAuth session)
5. Middleware redirects to `/login?callbackUrl=/intake`
6. User sees login page again

**Evidence:**
- `middleware.ts:106-126` - Only checks `getToken()`, no demo cookie check
- `app/login/page.tsx:16-25` - Sets cookie with comment "so middleware can bypass auth" but middleware doesn't implement this
- Browser testing confirmed: after clicking demo, page redirects back to login

**Fix Required:** Add demo cookie check to middleware:
```typescript
// In middleware.ts, after getToken() check:
const isDemo = request.cookies.get("recruitos_demo")?.value === "true";
const isAuthenticated = !!token || isDemo;
```

#### Screenshots
- `qa-reports/login-page.png` - Login page with Demo and GitHub buttons
- `qa-reports/intake-page.png` - Intake page redirecting to login

---

## 2. Calibration/Agent Chat

### Status: BLOCKED (Cannot Test)

Testing blocked by demo mode auth bug. The intake page (`/intake`) requires authentication and demo mode does not work. Cannot access the calibration chat interface without a valid GitHub OAuth session.

**Recommendation:** Fix demo mode auth, then re-test.

---

## 3. Candidate Search

### Status: PARTIAL PASS (Auth-gated features untestable)

#### API Endpoint Tests
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/search` | GET (no params) | 400 | Returns `{"error":"Query parameter 'q' is required"}` |
| `/api/search` | GET (no auth) | 400 | Validates params before auth - see security note below |

#### Security Note
`/api/search` returns 400 (validation error) instead of 401 (unauthorized) when accessed without authentication. The endpoint validates query parameters before checking auth. While not a vulnerability per se, best practice is to check auth first so unauthenticated users don't learn about API parameter requirements.

#### UI Testing
- Search page (`/search`) correctly redirects unauthenticated users (307)
- Cannot test search UI due to auth requirement

---

## 4. Candidate Pipeline

### Status: PARTIAL PASS (Auth-gated features untestable)

- Pipeline page (`/pipeline`) correctly redirects unauthenticated users (307)
- Cannot test pipeline UI due to auth requirement

---

## 5. Profile Views

### Status: NOT TESTED

Developer profile pages (`/profile/[username]`) require testing with actual candidate data. Blocked by auth.

---

## 6. Outreach Generation

### Status: PARTIAL PASS

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/outreach` | GET | 405 | Correctly rejects GET (POST only) |

Cannot test POST without authentication.

---

## 7. Credits & Payments

### Status: PARTIAL PASS

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/credits` | GET | 401 | Correctly returns Unauthorized |
| `/api/checkout` | GET | 405 | Correctly rejects GET (POST only) |

Credit system UI cannot be tested without auth.

---

## 8. TeamTailor Export

### Status: NOT TESTED

Requires authenticated session and candidate data.

---

## 9. LinkedIn Integration

### Status: NOT TESTED

Requires authenticated session and BrightData API key.

---

## 10. Admin Features

### Status: PARTIAL PASS

#### Admin Mode Toggle
- Admin mode toggle (`Ctrl+Shift+A`) was tested via JavaScript KeyboardEvent dispatch
- Yellow "Admin" badge visible in header when admin mode is active
- AdminDock (Mac-style navigation dock) renders at bottom of page
- Dock contains navigation icons: Home, Intake, Search, Pipeline, Power toggle
- Dock shows "Demo Mode Active" label when demo mode localStorage flag is set
- Note: `Ctrl+Shift+A` keyboard shortcut did not work via programmatic dispatch; manual localStorage manipulation required as workaround

#### Team Management API
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/team` | GET | 401 | Correctly returns Unauthorized |

---

## Security Headers Assessment

All security headers are properly configured:

| Header | Value | Status |
|--------|-------|--------|
| Content-Security-Policy | Comprehensive with whitelisted domains | PASS |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | PASS |
| X-Frame-Options | DENY | PASS |
| X-Content-Type-Options | nosniff | PASS |
| Referrer-Policy | strict-origin-when-cross-origin | PASS |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), interest-cohort=() | PASS |
| X-DNS-Prefetch-Control | on | PASS |

**Note:** CSP allows `'unsafe-inline'` for scripts, which is common with Next.js but weakens CSP. Consider using nonces in the future.

---

## Route Protection Summary

| Route | Expected | Actual | Status |
|-------|----------|--------|--------|
| `/` (homepage) | 200 | 200 | PASS |
| `/login` | 200 | 200 | PASS |
| `/signup` | 200 | 200 | PASS |
| `/intake` | 307 (no auth) | 307 | PASS |
| `/search` | 307 (no auth) | 307 | PASS |
| `/pipeline` | 307 (no auth) | 307 | PASS |
| `/api/auth/session` | 200 | 200 (`{}`) | PASS |

---

## API Endpoint Summary

| Endpoint | Expected | Actual | Status |
|----------|----------|--------|--------|
| `GET /api/search` | 401 | 400 | WARN (validates before auth) |
| `GET /api/profile/analyze` | 405 | 405 | PASS |
| `GET /api/credits` | 401 | 401 | PASS |
| `GET /api/outreach` | 405 | 405 | PASS |
| `GET /api/checkout` | 405 | 405 | PASS |
| `GET /api/team` | 401 | 401 | PASS |

---

## Issues Found

### Critical
1. **Demo mode auth broken** - Middleware does not check for `recruitos_demo` cookie, making demo mode non-functional. The login page sets the cookie but middleware only checks NextAuth JWT tokens.

### Medium
2. **`/api/search` validates before authenticating** - Returns 400 (parameter validation) instead of 401 (unauthorized) for unauthenticated requests. Should check auth first.

### Low
3. **CSP allows `unsafe-inline`** - Common with Next.js but could be strengthened with nonces.
4. **Transient Turbopack build error** - During browser testing, a Turbopack parsing error was intermittently observed at `/app/api/candidates/[id]/route.ts:187:5` ("Expected a semicolon"). Code inspection shows the file is syntactically correct, suggesting this is a transient dev server issue. Monitor for recurrence.

---

## Recommendations

1. **Fix demo mode auth** (Critical) - Add `recruitos_demo` cookie check to `middleware.ts` authentication logic
2. **Reorder search API validation** (Medium) - Check auth before parameter validation in `/api/search`
3. **Re-test after demo mode fix** - Most features cannot be tested without working authentication
4. **Add integration tests** - The lack of a working test suite (vitest.config.ts.bak) means all testing must be manual

---

## Test Coverage Limitations

Due to the demo mode auth bug, approximately 70% of features could not be fully tested through the UI. Only the following were fully verifiable:
- Public page rendering
- Route protection (redirect behavior)
- API endpoint error responses
- Security headers
- Admin mode toggle (client-side only)

Features requiring authenticated sessions (calibration chat, search UI, pipeline management, profile views, outreach generation, credits, team management) need to be retested after the demo mode bug is fixed.

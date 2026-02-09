# Security Guidelines

## Overview

This document outlines security considerations and best practices for RecruitOS (6Degrees).

## Known Security Considerations

### 1. API Key Storage

**Current Implementation:**
- API keys are stored in browser `localStorage` without encryption
- Keys are accessible via browser DevTools
- Vulnerable to XSS attacks

**Risk Level:** 🟠 HIGH

**Recommendations:**

#### For Development/Testing
1. Use separate API keys from production
2. Rotate keys regularly (weekly recommended)
3. Set up API key usage limits/quotas
4. Monitor API usage for anomalies

#### For Production
1. **Implement Backend Proxy** (Recommended)
   ```
   Client → Your Backend API → External APIs (Gemini, Firecrawl, etc.)
   ```
   - Store API keys in backend environment variables
   - Client never sees actual API keys
   - Add rate limiting and authentication

2. **Use Vercel Edge Functions** (Quick Solution)
   - Already configured in `/api/brightdata.ts`
   - Extend pattern to other services
   - Keys stored in Vercel environment variables

3. **Environment Variables Only**
   - Disable localStorage key input in production
   - Force environment variable usage
   - Add build-time validation

### 2. Content Security Policy (CSP)

**Current Implementation:**
- CSP configured in `index.html`
- Allows necessary external resources
- Restricts inline scripts (with exceptions for Tailwind)

**Limitations:**
- `'unsafe-inline'` and `'unsafe-eval'` required for Tailwind CDN
- Consider migrating to build-time Tailwind for stricter CSP

**Recommendation:**
Replace Tailwind CDN with compiled CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Dependency Security

**Current Measures:**
- Regular `npm audit` via CI/CD
- Automated security scanning with TruffleHog

**Recommendations:**
1. Run `npm audit` before every deployment
2. Update dependencies monthly
3. Review Dependabot/Snyk alerts promptly
4. Pin dependency versions for reproducible builds

### 4. Data Privacy & GDPR

**Current State:**
- All data stored client-side (localStorage)
- Optional Supabase integration
- No explicit data retention policy

**Requirements:**

#### GDPR Compliance Checklist
- [ ] Add explicit consent flow for data processing
- [ ] Implement "Right to be Forgotten" (delete candidate data)
- [ ] Add data export functionality
- [ ] Define data retention policy (recommend: 90 days)
- [ ] Include privacy policy link in UI
- [ ] Document data processing activities
- [ ] Add audit log export for transparency

#### Recommended Implementation
```typescript
// Add to AdminSettings
const handleDeleteAllData = () => {
  if (confirm('Delete all local data? This cannot be undone.')) {
    localStorage.clear();
    window.location.reload();
  }
};

const handleExportData = () => {
  const data = {
    candidates: localStorage.getItem('apex_candidates'),
    logs: localStorage.getItem('apex_logs'),
    // ... other data
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  // Trigger download
};
```

### 5. Supabase Row-Level Security (RLS)

**CRITICAL:** If using Supabase, implement Row-Level Security policies.

**Current Risk:**
- Hardcoded credentials were removed (✅)
- RLS policies may not be configured (⚠️)

**Required Supabase Setup:**

```sql
-- Enable RLS on candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Example: User can only access their own candidates
CREATE POLICY "Users can only access their own candidates"
  ON candidates
  FOR ALL
  USING (auth.uid() = user_id);

-- Add user_id column if not exists
ALTER TABLE candidates ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

### 6. Input Validation & Sanitization

**Current State:**
- TypeScript provides type safety
- No explicit input sanitization for user text

**Recommendations:**
1. Validate/sanitize job context input
2. Validate resume text before AI processing
3. Add max length limits for inputs
4. Sanitize URL inputs for scraping

```typescript
// Example sanitization
const sanitizeInput = (input: string, maxLength: number = 50000): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script[^>]*>.*?<\/script>/gi, ''); // Remove script tags
};
```

### 7. Rate Limiting

**Current State:**
- No client-side rate limiting
- Relies on external API rate limits

**Recommendations:**
1. Implement client-side rate limiting for expensive operations
2. Add cooldown periods for AI calls
3. Show credit costs before operations

```typescript
// Example rate limiter
const useRateLimit = (maxCalls: number, windowMs: number) => {
  const calls = useRef<number[]>([]);

  const isAllowed = () => {
    const now = Date.now();
    calls.current = calls.current.filter(time => now - time < windowMs);
    if (calls.current.length >= maxCalls) return false;
    calls.current.push(now);
    return true;
  };

  return { isAllowed };
};
```

## Incident Response

### If API Keys Are Compromised

1. **Immediate Actions:**
   - Revoke compromised keys immediately
   - Generate new keys
   - Update environment variables
   - Force logout all users (if backend auth exists)

2. **Investigation:**
   - Check API usage logs for anomalies
   - Review recent commits for accidental exposure
   - Scan Git history: `git log -p | grep -i "api[_-]key"`

3. **Communication:**
   - Notify affected users if data breach occurred
   - Document incident timeline
   - Implement additional controls

### Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead:
1. Email: security@your-domain.com
2. Include: Description, reproduction steps, potential impact
3. Expected response time: 48 hours

## Security Checklist for Deployment

Before deploying to production:

- [ ] Remove all hardcoded credentials
- [ ] Set up backend API proxy for sensitive operations
- [ ] Enable Supabase RLS policies
- [ ] Configure environment variables in hosting platform
- [ ] Test CSP doesn't block legitimate resources
- [ ] Run `npm audit` and fix critical/high issues
- [ ] Enable HTTPS only (no HTTP fallback)
- [ ] Configure CORS properly
- [ ] Set up monitoring and alerting
- [ ] Review audit logs before launch
- [ ] Add privacy policy and terms of service
- [ ] Test data export/deletion functionality
- [ ] Enable MFA for all admin accounts
- [ ] Set up automated security scanning (Dependabot, Snyk)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [EU AI Act Overview](https://artificialintelligenceact.eu/)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

## Updates

This document should be reviewed and updated:
- After security incidents
- When adding new features
- Quarterly security reviews
- When regulations change

**Last Updated:** 2026-01-07

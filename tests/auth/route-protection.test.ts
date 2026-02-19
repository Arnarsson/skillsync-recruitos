/**
 * Authentication Route Protection Tests
 *
 * Verifies that protected API routes reject unauthenticated requests with 401.
 * Tests import route handlers directly and call them with no auth session.
 *
 * Routes are categorized:
 * - PROTECTED: Must return 401 without authentication
 * - PUBLIC: Intentionally accessible without auth (health, webhooks, auth endpoints)
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ============================================================
// Mock ALL auth-related modules to simulate "no session"
// ============================================================

// next-auth: getServerSession returns null (no authenticated user)
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
}));

// auth-guard: requireAuth returns 401 (consistent with no session)
// requireOptionalAuth returns null (no session, but no hard failure — used for demo mode)
vi.mock('@/lib/auth-guard', async () => {
  const { NextResponse } = await import('next/server');
  return {
    requireAuth: vi.fn(() =>
      Promise.resolve(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    ),
    requireOptionalAuth: vi.fn(() => Promise.resolve(null)),
    withAuth: vi.fn(
      () => async () =>
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    ),
  };
});

// auth config
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// ============================================================
// Mock external services to prevent real API calls / DB hits
// ============================================================

vi.mock('@/lib/db', () => ({
  prisma: new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get: () => vi.fn(() => Promise.resolve(null)),
          }
        ),
    }
  ),
}));

vi.mock('@/lib/github', () => ({
  searchDevelopers: vi.fn(() =>
    Promise.resolve({ items: [], total_count: 0 })
  ),
  createOctokit: vi.fn(() => ({
    search: { users: vi.fn(() => Promise.resolve({ data: { total_count: 0 } })) },
    users: { getByUsername: vi.fn(() => Promise.resolve({ data: {} })) },
    repos: { listForUser: vi.fn(() => Promise.resolve({ data: [] })) },
    activity: { listPublicEventsForUser: vi.fn(() => Promise.resolve({ data: [] })) },
  })),
}));

vi.mock('@/lib/psychometrics', () => ({
  analyzeGitHubSignals: vi.fn(() => ({})),
  generateAIPsychometricProfile: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@/services/geminiService', () => ({
  default: {},
  geminiService: {},
}));

// Stub fetch for routes that call external APIs directly
const originalFetch = globalThis.fetch;
vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  )
);

// ============================================================
// Helper
// ============================================================

function makeGetRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`);
}

function makePostRequest(
  path: string,
  body: Record<string, unknown> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(
  path: string,
  body: Record<string, unknown> = {}
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'DELETE',
  });
}

// ============================================================
// Tests
// ============================================================

describe('API Route Authentication', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // --------------------------------------------------------
  // Routes protected with requireAuth() — MUST return 401
  // --------------------------------------------------------
  describe('Routes with requireAuth() should return 401', () => {
    it('POST /api/ai returns 401', async () => {
      const { POST } = await import('@/app/api/ai/route');
      const res = await POST(makePostRequest('/api/ai', { username: 'test' }));
      expect(res.status).toBe(401);
    });

    it('POST /api/ai/compare validates payload without auth hard-fail', async () => {
      const { POST } = await import('@/app/api/ai/compare/route');
      const res = await POST(
        makePostRequest('/api/ai/compare', { candidates: [] })
      );
      expect([400, 401]).toContain(res.status);
    });

    it('GET /api/candidates supports demo/public read mode', async () => {
      const { GET } = await import('@/app/api/candidates/route');
      const res = await GET(makeGetRequest('/api/candidates'));
      expect(res.status).not.toBe(401);
    });

    it('POST /api/candidates supports demo/unauthenticated mode (no 401)', async () => {
      // POST /api/candidates intentionally allows unauthenticated requests so that
      // the demo pipeline flow can display candidates without requiring a login.
      // When unauthenticated, the handler returns a synthetic 201 response instead
      // of persisting to the DB, and never returns 401.
      const { POST } = await import('@/app/api/candidates/route');
      const res = await POST(
        makePostRequest('/api/candidates', { name: 'Test', sourceType: 'MANUAL' })
      );
      expect(res.status).not.toBe(401);
    });

    it('POST /api/outreach returns 401', async () => {
      const { POST } = await import('@/app/api/outreach/route');
      const res = await POST(
        makePostRequest('/api/outreach', { candidateId: '1' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/outreach/send returns 401', async () => {
      const { POST } = await import('@/app/api/outreach/send/route');
      const res = await POST(
        makePostRequest('/api/outreach/send', { to: 'test@example.com' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/shared-profile returns 401', async () => {
      const { POST } = await import('@/app/api/shared-profile/route');
      const res = await POST(
        makePostRequest('/api/shared-profile', { candidateId: '1' })
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/github/signals supports public access', async () => {
      const { GET } = await import('@/app/api/github/signals/route');
      const res = await GET(
        makeGetRequest('/api/github/signals?username=test')
      );
      expect(res.status).not.toBe(401);
    });

    it('GET /api/github/deep supports public access', async () => {
      const { GET } = await import('@/app/api/github/deep/route');
      const res = await GET(
        makeGetRequest('/api/github/deep?username=test')
      );
      expect(res.status).not.toBe(401);
    });

    it('GET /api/github/user supports public access', async () => {
      const { GET } = await import('@/app/api/github/user/route');
      const res = await GET(makeGetRequest('/api/github/user?username=test'));
      expect(res.status).not.toBe(401);
    });

    it('GET /api/github/quality supports public access', async () => {
      const { GET } = await import('@/app/api/github/quality/route');
      const res = await GET(
        makeGetRequest('/api/github/quality?username=test')
      );
      expect(res.status).not.toBe(401);
    });

    it('POST /api/profile/psychometric returns 401', async () => {
      const { POST } = await import('@/app/api/profile/psychometric/route');
      const res = await POST(
        makePostRequest('/api/profile/psychometric', { username: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/brightdata returns 401', async () => {
      const { POST } = await import('@/app/api/brightdata/route');
      const res = await POST(
        makePostRequest('/api/brightdata', { url: 'https://example.com' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/brightdata/trigger returns 401', async () => {
      const { POST } = await import('@/app/api/brightdata/trigger/route');
      const res = await POST(
        makePostRequest('/api/brightdata/trigger', { url: 'https://example.com' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/brightdata/progress returns 401', async () => {
      const { POST } = await import('@/app/api/brightdata/progress/route');
      const res = await POST(
        makePostRequest('/api/brightdata/progress', { snapshotId: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/brightdata/snapshot returns 401', async () => {
      const { POST } = await import('@/app/api/brightdata/snapshot/route');
      const res = await POST(
        makePostRequest('/api/brightdata/snapshot', { snapshotId: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/brightdata/serp returns 401', async () => {
      const { POST } = await import('@/app/api/brightdata/serp/route');
      const res = await POST(
        makePostRequest('/api/brightdata/serp', { query: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/brightdata/linkedin-search returns 401', async () => {
      const { POST } = await import(
        '@/app/api/brightdata/linkedin-search/route'
      );
      const res = await POST(
        makePostRequest('/api/brightdata/linkedin-search', { query: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin/candidate returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin/candidate/route');
      const res = await POST(
        makePostRequest('/api/linkedin/candidate', { name: 'Test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin/enrich returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin/enrich/route');
      const res = await POST(
        makePostRequest('/api/linkedin/enrich', { url: 'https://linkedin.com/in/test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin/network returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin/network/route');
      const res = await POST(
        makePostRequest('/api/linkedin/network', { username: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin/verify-email returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin/verify-email/route');
      const res = await POST(
        makePostRequest('/api/linkedin/verify-email', { email: 'test@example.com' })
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/linkedin/messages returns 401', async () => {
      const { GET } = await import('@/app/api/linkedin/messages/route');
      const res = await GET(makeGetRequest('/api/linkedin/messages'));
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin/messages returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin/messages/route');
      const res = await POST(
        makePostRequest('/api/linkedin/messages', { text: 'Hello' })
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/linkedin/notes returns 401', async () => {
      const { GET } = await import('@/app/api/linkedin/notes/route');
      const res = await GET(makeGetRequest('/api/linkedin/notes'));
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin/notes returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin/notes/route');
      const res = await POST(
        makePostRequest('/api/linkedin/notes', { content: 'A note' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin-connection returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin-connection/route');
      const res = await POST(
        makePostRequest('/api/linkedin-connection', { url: 'https://linkedin.com' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/linkedin-finder returns 401', async () => {
      const { POST } = await import('@/app/api/linkedin-finder/route');
      const res = await POST(
        makePostRequest('/api/linkedin-finder', { name: 'Test User' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/deep-research returns 401', async () => {
      const { POST } = await import('@/app/api/deep-research/route');
      const res = await POST(
        makePostRequest('/api/deep-research', { username: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/deep-enrichment returns 401', async () => {
      const { POST } = await import('@/app/api/deep-enrichment/route');
      const res = await POST(
        makePostRequest('/api/deep-enrichment', { candidateId: '1' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/calibration validates payload without auth hard-fail', async () => {
      const { POST } = await import('@/app/api/calibration/route');
      const res = await POST(
        makePostRequest('/api/calibration', { data: {} })
      );
      expect([400, 401]).toContain(res.status);
    });

    it('POST /api/calibration/chat returns 401', async () => {
      const { POST } = await import('@/app/api/calibration/chat/route');
      const res = await POST(
        makePostRequest('/api/calibration/chat', { message: 'test' })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/demo/reset returns 401', async () => {
      const { POST } = await import('@/app/api/demo/reset/route');
      const res = await POST(makePostRequest('/api/demo/reset'));
      expect(res.status).toBe(401);
    });

    it('GET /api/analytics/pipeline supports demo/public read mode', async () => {
      const { GET } = await import('@/app/api/analytics/pipeline/route');
      const res = await GET(makeGetRequest('/api/analytics/pipeline'));
      expect(res.status).not.toBe(401);
    });

    it('POST /api/candidates/import returns 401', async () => {
      const { POST } = await import('@/app/api/candidates/import/route');
      const res = await POST(
        makePostRequest('/api/candidates/import', { candidates: [] })
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/search/serp returns 401', async () => {
      const { GET } = await import('@/app/api/search/serp/route');
      const res = await GET(makeGetRequest('/api/search/serp?q=test'));
      expect(res.status).toBe(401);
    });
  });

  // --------------------------------------------------------
  // Routes with manual getServerSession (enforced) — 401/403
  // --------------------------------------------------------
  describe('Routes with manual auth enforcement should return 401/403', () => {
    it('GET /api/team returns 401', async () => {
      const { GET } = await import('@/app/api/team/route');
      const res = await GET(makeGetRequest('/api/team'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/team returns 401', async () => {
      const { POST } = await import('@/app/api/team/route');
      const res = await POST(
        makePostRequest('/api/team', { name: 'Test Team' })
      );
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/analytics/export returns 401', async () => {
      const { GET } = await import('@/app/api/analytics/export/route');
      const res = await GET(makeGetRequest('/api/analytics/export'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/analytics/funnel supports demo/public read mode', async () => {
      const { GET } = await import('@/app/api/analytics/funnel/route');
      const res = await GET(makeGetRequest('/api/analytics/funnel'));
      expect(res.status).not.toBe(401);
    });

    it('POST /api/profile/analyze returns 401', async () => {
      const { POST } = await import('@/app/api/profile/analyze/route');
      const res = await POST(
        makePostRequest('/api/profile/analyze', { username: 'test' })
      );
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/credits/balance returns 401', async () => {
      const { GET } = await import('@/app/api/credits/balance/route');
      const res = await GET(makeGetRequest('/api/credits/balance'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/credits returns 401', async () => {
      const { GET } = await import('@/app/api/credits/route');
      const res = await GET(makeGetRequest('/api/credits'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/credits/consume returns 401', async () => {
      const { POST } = await import('@/app/api/credits/consume/route');
      const res = await POST(
        makePostRequest('/api/credits/consume', { amount: 10 })
      );
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/checkout/credits returns 401', async () => {
      const { POST } = await import('@/app/api/checkout/credits/route');
      const res = await POST(
        makePostRequest('/api/checkout/credits', { packageId: 'starter' })
      );
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/checkout returns 401', async () => {
      const { POST } = await import('@/app/api/checkout/route');
      const res = await POST(
        makePostRequest('/api/checkout', { priceId: 'price_test' })
      );
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/teamtailor/export returns 401', async () => {
      const { POST } = await import('@/app/api/teamtailor/export/route');
      const res = await POST(
        makePostRequest('/api/teamtailor/export', { candidateId: '1' })
      );
      expect([401, 403]).toContain(res.status);
    });
  });

  // --------------------------------------------------------
  // Intentionally public routes — should NOT return 401
  // --------------------------------------------------------
  describe('Public routes should NOT return 401', () => {
    it('GET /api/health is accessible without auth', async () => {
      const { GET } = await import('@/app/api/health/route');
      const res = await GET(makeGetRequest('/api/health'));
      // Health endpoint does not require auth. It may return 503 if DB is unreachable
      // (which is expected in test env with mocked prisma), but never 401.
      expect(res.status).not.toBe(401);
      expect([200, 503]).toContain(res.status);
    });

    it('POST /api/auth/signup is accessible', async () => {
      const { POST } = await import('@/app/api/auth/signup/route');
      const res = await POST(
        makePostRequest('/api/auth/signup', {
          email: 'test@example.com',
          password: 'test123',
        })
      );
      // May return 400/422 for validation, but NOT 401
      expect(res.status).not.toBe(401);
    });
  });
});

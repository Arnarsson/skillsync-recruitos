import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-process deployments (Vercel serverless has natural
 * per-instance isolation). For distributed rate limiting across multiple
 * instances, swap to @upstash/ratelimit + Redis.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now - entry.lastRefill > windowMs * 2) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Rate limit presets for different route categories.
 */
export const RATE_LIMITS = {
  /** General API routes: 60 req/min */
  api: { limit: 60, windowMs: 60_000 } satisfies RateLimitConfig,
  /** AI-heavy routes (scoring, profiles): 10 req/min */
  ai: { limit: 10, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Auth routes (login, signup): 10 req/min */
  auth: { limit: 10, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Search routes: 30 req/min */
  search: { limit: 30, windowMs: 60_000 } satisfies RateLimitConfig,
} as const;

function getIdentifier(request: NextRequest): string {
  // Prefer X-Forwarded-For (set by reverse proxies / Vercel)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // Fall back to x-real-ip
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Check rate limit for a request. Returns null if allowed,
 * or a 429 NextResponse if rate limited.
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const { limit, windowMs } = config;
  const ip = getIdentifier(request);
  const pathname = request.nextUrl.pathname;
  const key = `${ip}:${pathname}`;

  cleanup(windowMs);

  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { tokens: limit - 1, lastRefill: now };
    store.set(key, entry);
    return null;
  }

  // Token bucket refill
  const elapsed = now - entry.lastRefill;
  const refill = Math.floor((elapsed / windowMs) * limit);
  if (refill > 0) {
    entry.tokens = Math.min(limit, entry.tokens + refill);
    entry.lastRefill = now;
  }

  if (entry.tokens <= 0) {
    const retryAfter = Math.ceil(windowMs / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((entry.lastRefill + windowMs) / 1000)),
        },
      }
    );
  }

  entry.tokens--;
  return null;
}

/**
 * Determine the rate limit config for a given pathname.
 */
export function getRateLimitForPath(pathname: string): RateLimitConfig {
  // AI-heavy routes
  if (
    pathname.startsWith("/api/ai/") ||
    pathname.startsWith("/api/profile/") ||
    pathname.startsWith("/api/deep-research") ||
    pathname.startsWith("/api/deep-enrichment") ||
    pathname.startsWith("/api/outreach")
  ) {
    return RATE_LIMITS.ai;
  }

  // Auth routes
  if (pathname.startsWith("/api/auth/")) {
    return RATE_LIMITS.auth;
  }

  // Search routes
  if (pathname.startsWith("/api/search/")) {
    return RATE_LIMITS.search;
  }

  // Default API rate limit
  return RATE_LIMITS.api;
}

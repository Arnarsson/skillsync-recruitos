import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitForPath } from "@/lib/rate-limit";

// Allowed origins for CORS
const ALLOWED_ORIGINS = new Set([
  "https://recruitos.app",
  "https://www.recruitos.app",
  "https://skillsync.app",
  "https://www.skillsync.app",
  "http://localhost:3000",
  "http://localhost:3001",
]);

// Routes that require authentication (page routes)
const protectedRoutes = [
  "/dashboard",
  "/search",
  "/pipeline",
  "/shortlist",
  "/settings",
  "/team",
  "/intake",
  "/profile",
  "/skills-review",
];

// Routes that should redirect to /search if already authenticated
const authRoutes = ["/login", "/signup"];

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-BrightData-Key",
    "Access-Control-Max-Age": "86400",
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

function getSecurityHeaders(): Record<string, string> {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://sourcetrace.vercel.app",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
    "img-src 'self' data: https://avatars.githubusercontent.com https://api.dicebear.com",
    "connect-src 'self' https://api.github.com https://api.firecrawl.dev https://api.brightdata.com https://api.teamtailor.com https://generativelanguage.googleapis.com https://openrouter.ai https://*.stripe.com https://*.ingest.sentry.io https://*.supabase.co wss://*.supabase.co https://sourcetrace.vercel.app",
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "X-DNS-Prefetch-Control": "on",
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight for API routes
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(request);
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // For API routes: rate limit, then add CORS + security headers
  if (pathname.startsWith("/api/")) {
    // Rate limit check (skip health check and NextAuth internals)
    if (!pathname.startsWith("/api/auth/") && pathname !== "/api/health") {
      const rateLimitConfig = getRateLimitForPath(pathname);
      const rateLimited = checkRateLimit(request, rateLimitConfig);
      if (rateLimited) return rateLimited;
    }

    const response = NextResponse.next();
    const corsHeaders = getCorsHeaders(request);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    for (const [key, value] of Object.entries(getSecurityHeaders())) {
      response.headers.set(key, value);
    }
    return response;
  }

  // --- Page route auth below ---
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isDemoMode = request.cookies.get("recruitos_demo")?.value === "true";

  // Redirect authenticated users away from auth pages
  if (
    (isAuthenticated || isDemoMode) &&
    authRoutes.some((route) => pathname === route)
  ) {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  // Demo mode users with the recruitos_demo cookie bypass this check
  // DISABLED FOR DEMO - Re-enable after demo by uncommenting below
  /*
  if (
    !isAuthenticated &&
    !isDemoMode &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  */

  // Add security headers to page responses
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(getSecurityHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next (Next.js internals)
     * - static files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};

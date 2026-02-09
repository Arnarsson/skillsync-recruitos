import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

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
  return {
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

  // For API routes: add CORS + security headers to response
  if (pathname.startsWith("/api/")) {
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

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some((route) => pathname === route)) {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (
    !isAuthenticated &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

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

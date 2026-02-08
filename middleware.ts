import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some((route) => pathname === route)) {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  // Allow demo mode to bypass auth (set via cookie from login page)
  const isDemoMode = request.cookies.get("recruitos_demo")?.value === "true";

  // Redirect unauthenticated users to login for protected routes
  if (
    !isAuthenticated &&
    !isDemoMode &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they handle their own auth)
     * - _next (Next.js internals)
     * - static files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};

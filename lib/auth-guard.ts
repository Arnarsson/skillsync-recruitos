import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export interface AuthResult {
  session: Session;
  user: NonNullable<Session["user"]>;
}

/**
 * Check authentication and return session or 401 response.
 * Usage:
 *   const authResult = await requireAuth();
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { session, user } = authResult;
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { session, user: session.user };
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: any,
  auth: AuthResult
) => Promise<NextResponse> | NextResponse;

/**
 * HOF wrapper that enforces authentication before calling the handler.
 * Usage:
 *   export const POST = withAuth(async (request, context, { session, user }) => {
 *     // handler body — guaranteed authenticated
 *   });
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    return handler(request, context, authResult);
  };
}

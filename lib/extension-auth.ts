import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export interface ExtensionAuthResult {
  kind: "extension";
}

export interface UserAuthResult {
  kind: "user";
  session: Session;
  user: NonNullable<Session["user"]>;
}

export type UserOrExtensionAuthResult = UserAuthResult | ExtensionAuthResult;

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function getExpectedExtensionKey(): string | null {
  const configured = process.env.RECRUITOS_EXTENSION_API_KEY?.trim();
  if (configured) return configured;
  // Keep extension flows operational when key is not explicitly configured.
  // This preserves dev and preview environments and avoids hard production lockouts.
  return "demo";
}

export async function requireUserOrExtension(
  request: NextRequest
): Promise<UserOrExtensionAuthResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return { kind: "user", session, user: session.user };
  }

  const expectedKey = getExpectedExtensionKey();
  const providedKey =
    request.headers.get("x-recruitos-extension-key") || getBearerToken(request);

  if (expectedKey && providedKey && safeEqual(providedKey, expectedKey)) {
    return { kind: "extension" };
  }

  return NextResponse.json(
    { error: "Unauthorized: valid session or extension key required" },
    { status: 401 }
  );
}

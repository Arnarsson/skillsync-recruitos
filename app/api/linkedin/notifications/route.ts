import { NextRequest, NextResponse } from "next/server";
import { requireUserOrExtension } from "@/lib/extension-auth";

/**
 * POST /api/linkedin/notifications
 * Receives LinkedIn notifications from extension capture.
 * This endpoint acknowledges payloads to remove hardcoded localhost dependency.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUserOrExtension(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const notifications = Array.isArray(body?.notifications)
      ? body.notifications
      : [];

    return NextResponse.json({
      success: true,
      received: notifications.length,
      persisted: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to process notifications", details: message },
      { status: 500 }
    );
  }
}

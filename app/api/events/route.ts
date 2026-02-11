import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal ingestion endpoint to avoid recurring 404 noise from client event beacons.
 */
export async function POST(request: NextRequest) {
  try {
    // Accept event payloads without failing caller flows.
    await request.json().catch(() => ({}));
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

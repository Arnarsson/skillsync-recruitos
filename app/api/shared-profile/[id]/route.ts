import { NextRequest, NextResponse } from "next/server";
import { getSharedProfile } from "@/lib/shared-profiles";

/**
 * GET /api/shared-profile/[id]
 * 
 * Public endpoint — no auth required.
 * Returns the shared personality profile data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getSharedProfile(id);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to fetch shared profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

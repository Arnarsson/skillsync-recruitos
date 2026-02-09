import { NextRequest, NextResponse } from "next/server";
import { createSharedProfile, SharedProfileData } from "@/lib/shared-profiles";
import { requireAuth } from "@/lib/auth-guard";
import { sharedProfileCreateSchema } from "@/lib/validation/apiSchemas";

/**
 * POST /api/shared-profile
 *
 * Creates a shareable personality profile link.
 * Requires authentication to prevent abuse.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = sharedProfileCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const profileData = {
      candidateId: body.candidateId,
      name: body.name,
      currentRole: body.currentRole,
      company: body.company,
      location: body.location,
      avatar: body.avatar,
      skills: body.skills || [],
      yearsExperience: body.yearsExperience,
      alignmentScore: body.alignmentScore || 0,
      persona: body.persona,
      keyEvidence: body.keyEvidence || body.keyEvidenceWithSources,
      risks: body.risks || body.risksWithSources,
      scoreBreakdown: body.scoreBreakdown,
    } as SharedProfileData;

    const id = await createSharedProfile(profileData, body.createdBy);

    // Build the shareable URL
    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/report/${id}`;

    return NextResponse.json({
      id,
      url: shareUrl,
      expiresIn: "90 days",
    });
  } catch (error) {
    console.error("Failed to create shared profile:", error);
    return NextResponse.json(
      { error: "Failed to create shared profile" },
      { status: 500 }
    );
  }
}

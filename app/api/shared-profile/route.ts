import { NextRequest, NextResponse } from "next/server";
import { createSharedProfile, SharedProfileData } from "@/lib/shared-profiles";

/**
 * POST /api/shared-profile
 * 
 * Creates a shareable personality profile link.
 * No auth required to CREATE — the data is provided by the caller.
 * (In production, add auth to prevent abuse.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.candidateId || !body.name) {
      return NextResponse.json(
        { error: "candidateId and name are required" },
        { status: 400 }
      );
    }

    const profileData: SharedProfileData = {
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
    };

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

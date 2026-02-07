import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// CORS headers for extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/linkedin/candidate
 * Receives candidate profile data from the LinkedIn extension
 */
export async function POST(request: NextRequest) {
  try {
    // For demo/testing: accept requests without API key
    // TODO: Add proper auth later
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "") || "demo";

    const body = await request.json();
    const { source, profile, capturedAt } = body;

    if (!profile || !profile.linkedinId) {
      return NextResponse.json(
        { error: "Profile data with linkedinId required" },
        { status: 400 }
      );
    }

    // Build the advancedProfile JSON for fields that don't have dedicated columns
    const advancedProfile: Record<string, Prisma.InputJsonValue> = {};
    if (profile.connectionCount) advancedProfile.connectionCount = String(profile.connectionCount);
    if (profile.followers) advancedProfile.followers = String(profile.followers);
    if (profile.isCreator !== undefined) advancedProfile.isCreator = Boolean(profile.isCreator);

    const hasAdvancedProfile = Object.keys(advancedProfile).length > 0;

    // Map extension profile fields to Prisma Candidate fields
    const candidateFields = {
      name: (profile.name as string) || "Unknown",
      headline: (profile.headline as string) || null,
      company: (profile.currentCompany as string) || null,
      location: (profile.location as string) || null,
      avatar: (profile.photoUrl as string) || null,
      linkedinId: profile.linkedinId as string,
      linkedinUrl: (profile.url as string) || null,
      rawProfileText: (profile.about as string) || null,
      experience: (profile.experience || []) as Prisma.InputJsonValue,
      education: (profile.education || []) as Prisma.InputJsonValue,
      skills: (profile.skills || []) as Prisma.InputJsonValue,
      spokenLanguages: (profile.languages || []) as Prisma.InputJsonValue,
      certifications: (profile.certifications || []) as Prisma.InputJsonValue,
      connectionDegree: (profile.connectionDegree as string) || null,
      mutualConnections: (profile.mutualConnections as string) || null,
      openToWork: (profile.openToWork as boolean) || false,
      isPremium: (profile.isPremium as boolean) || false,
      ...(hasAdvancedProfile ? { advancedProfile: advancedProfile as unknown as Prisma.InputJsonValue } : {}),
      capturedAt: capturedAt ? new Date(capturedAt as string) : new Date(),
    };

    // Check for existing candidate (findFirst because userId can be null)
    const existing = await prisma.candidate.findFirst({
      where: { linkedinId: profile.linkedinId, userId: null },
    });

    let candidate;
    let isNew: boolean;

    if (existing) {
      // Update existing candidate
      candidate = await prisma.candidate.update({
        where: { id: existing.id },
        data: {
          ...candidateFields,
          updatedAt: new Date(),
        },
      });
      isNew = false;
    } else {
      // Create new candidate
      candidate = await prisma.candidate.create({
        data: {
          ...candidateFields,
          sourceType: "LINKEDIN",
          userId: null,
        },
      });
      isNew = true;
    }

    console.log("[LinkedIn Extension] Candidate received:", candidate.name, candidate.linkedinId, isNew ? "NEW" : "UPDATED");

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        linkedinId: candidate.linkedinId,
        status: isNew ? "captured" : "updated",
      },
      isDuplicate: !isNew,
      persisted: true,
    }, { headers: corsHeaders });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[LinkedIn Extension] Candidate error:", error);
    return NextResponse.json(
      { error: "Failed to process candidate", details: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/linkedin/candidate
 * List all captures or check if a candidate exists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkedinId = searchParams.get("linkedinId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // If looking for specific candidate
    if (linkedinId) {
      const candidate = await prisma.candidate.findFirst({
        where: { linkedinId, sourceType: "LINKEDIN" },
      });
      return NextResponse.json({
        exists: !!candidate,
        candidate: candidate || null,
      }, { headers: corsHeaders });
    }

    // Get all LinkedIn candidates with pagination
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where: { sourceType: "LINKEDIN" },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidate.count({
        where: { sourceType: "LINKEDIN" },
      }),
    ]);

    return NextResponse.json({
      candidates,
      total,
      limit,
      offset,
      persisted: true,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("[LinkedIn Extension] Candidate lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup candidate" },
      { status: 500, headers: corsHeaders }
    );
  }
}

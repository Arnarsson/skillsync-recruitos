import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { requireUserOrExtension } from "@/lib/extension-auth";
import { linkedinCandidateSchema } from "@/lib/validation/apiSchemas";
import { enrichCandidateBackground } from "@/services/unifiedEnrichment";

/**
 * POST /api/linkedin/candidate
 * Receives candidate profile data from the LinkedIn extension
 */
export async function POST(request: NextRequest) {
  const auth = await requireUserOrExtension(request);
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

    const parsed = linkedinCandidateSchema.safeParse(rawBody);
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
    const { profile, capturedAt } = body;

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
      linkedinFetchedAt: new Date(),
    };

    // Check for existing candidate
    // Use sourceType and linkedinId to find public candidates (userId = null)
    // Order by createdAt to get the oldest (first created) if duplicates exist
    const existing = await prisma.candidate.findFirst({
      where: { 
        linkedinId: profile.linkedinId,
        sourceType: "LINKEDIN",
        userId: null
      },
      orderBy: { createdAt: 'asc' }
    });

    let candidate;
    let isNew: boolean;

    if (existing) {
      // Update existing candidate
      try {
        candidate = await prisma.candidate.update({
          where: { id: existing.id },
          data: {
            ...candidateFields,
            updatedAt: new Date(),
          },
        });
        isNew = false;
      } catch (updateError) {
        // If update fails (rare race condition), try to fetch again
        console.error("[LinkedIn] Update failed, refetching:", updateError);
        const refetch = await prisma.candidate.findUnique({
          where: { id: existing.id }
        });
        if (!refetch) {
          // Record was deleted, create new
          throw new Error("Candidate record vanished during update");
        }
        throw updateError;
      }
    } else {
      // Create new candidate
      try {
        candidate = await prisma.candidate.create({
          data: {
            ...candidateFields,
            sourceType: "LINKEDIN",
            userId: null,
          },
        });
        isNew = true;
      } catch (createError: any) {
        // Handle unique constraint violation (P2002)
        if (createError?.code === 'P2002') {
          // Another request created the record between findFirst and create
          // Fetch it and update instead
          console.log("[LinkedIn] Race condition detected, fetching existing record");
          const raceExisting = await prisma.candidate.findFirst({
            where: { 
              linkedinId: profile.linkedinId,
              sourceType: "LINKEDIN",
              userId: null
            }
          });
          if (raceExisting) {
            candidate = await prisma.candidate.update({
              where: { id: raceExisting.id },
              data: {
                ...candidateFields,
                updatedAt: new Date(),
              },
            });
            isNew = false;
          } else {
            // Very rare: couldn't find the record that caused the conflict
            throw new Error("Unique constraint violated but no matching record found");
          }
        } else {
          throw createError;
        }
      }
    }

    console.log("[LinkedIn Extension] Candidate received:", candidate.name, candidate.linkedinId, isNew ? "NEW" : "UPDATED");

    // Trigger background enrichment if GitHub username is available
    if (candidate.githubUsername) {
      enrichCandidateBackground(candidate.id, candidate.githubUsername).catch(err => {
        console.error("[LinkedIn Extension] Background enrichment failed:", err);
        // Non-blocking - enrichment failure doesn't fail the API response
      });
    }

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
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[LinkedIn Extension] Candidate error:", error);
    return NextResponse.json(
      { error: "Failed to process candidate", details: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/linkedin/candidate
 * List all captures or check if a candidate exists
 */
export async function GET(request: NextRequest) {
  const auth = await requireUserOrExtension(request);
  const hasAccess = !(auth instanceof NextResponse);

  try {
    const { searchParams } = new URL(request.url);
    const linkedinId = searchParams.get("linkedinId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // If looking for specific candidate
    if (linkedinId) {
      const candidate = await prisma.candidate.findFirst({
        where: hasAccess
          ? { linkedinId, sourceType: "LINKEDIN" }
          : { linkedinId, sourceType: "LINKEDIN", userId: null },
      });
      return NextResponse.json({
        exists: !!candidate,
        candidate: candidate || null,
      });
    }

    // Get all LinkedIn candidates with pagination
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where: hasAccess
          ? { sourceType: "LINKEDIN" }
          : { sourceType: "LINKEDIN", userId: null },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.candidate.count({
        where: hasAccess
          ? { sourceType: "LINKEDIN" }
          : { sourceType: "LINKEDIN", userId: null },
      }),
    ]);

    return NextResponse.json({
      candidates,
      total,
      limit,
      offset,
      persisted: true,
    });

  } catch (error) {
    console.error("[LinkedIn Extension] Candidate lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup candidate" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/linkedin/candidate?id=<candidateId>
 * DELETE /api/linkedin/candidate?linkedinId=<linkedinId>
 * DELETE /api/linkedin/candidate?olderThanHours=<n>
 *
 * In authenticated/extension mode: can delete any LinkedIn captures.
 * In demo mode without auth: restricted to public demo captures (userId = null).
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireUserOrExtension(request);
  const hasAccess = !(auth instanceof NextResponse);
  const isDemoMode = request.cookies.get("recruitos_demo")?.value === "true";

  if (!hasAccess && !isDemoMode) {
    return auth;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const linkedinId = searchParams.get("linkedinId");
    const olderThanHoursRaw = searchParams.get("olderThanHours");

    // Bulk cleanup mode
    if (olderThanHoursRaw) {
      const hours = Number.parseInt(olderThanHoursRaw, 10);
      if (Number.isNaN(hours) || hours < 1) {
        return NextResponse.json(
          { error: "olderThanHours must be a positive integer" },
          { status: 400 }
        );
      }

      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

      const result = await prisma.candidate.deleteMany({
        where: hasAccess
          ? {
              sourceType: "LINKEDIN",
              createdAt: { lt: cutoff },
            }
          : {
              sourceType: "LINKEDIN",
              userId: null,
              createdAt: { lt: cutoff },
            },
      });

      return NextResponse.json({
        success: true,
        deleted: result.count,
      });
    }

    if (!id && !linkedinId) {
      return NextResponse.json(
        { error: "Provide either id or linkedinId" },
        { status: 400 }
      );
    }

    const result = await prisma.candidate.deleteMany({
      where: hasAccess
        ? {
            sourceType: "LINKEDIN",
            ...(id ? { id } : { linkedinId: linkedinId! }),
          }
        : {
            sourceType: "LINKEDIN",
            userId: null,
            ...(id ? { id } : { linkedinId: linkedinId! }),
          },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[LinkedIn Extension] Candidate delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete capture", details: message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const VALID_SOURCE_TYPES = ["GITHUB", "LINKEDIN", "MANUAL"] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single candidate with notes
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { id } = await params;

    const where: Prisma.CandidateWhereInput = { id, userId };

    const candidate = await prisma.candidate.findFirst({
      where,
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Candidate fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 }
    );
  }
}

// PATCH - Update candidate fields
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();

    // Validate name when provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "name must be a non-empty string" },
          { status: 400 }
        );
      }
    }

    // Validate sourceType when provided
    if (body.sourceType !== undefined) {
      if (
        !VALID_SOURCE_TYPES.includes(
          body.sourceType as (typeof VALID_SOURCE_TYPES)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `sourceType must be one of: ${VALID_SOURCE_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Build update data from allowed fields only
    const data: Prisma.CandidateUpdateInput = {};

    // Identity fields
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.headline !== undefined) data.headline = body.headline;
    if (body.currentRole !== undefined) data.currentRole = body.currentRole;
    if (body.company !== undefined) data.company = body.company;
    if (body.location !== undefined) data.location = body.location;
    if (body.avatar !== undefined) data.avatar = body.avatar;

    // Source tracking
    if (body.sourceType !== undefined) data.sourceType = body.sourceType;
    if (body.githubUsername !== undefined)
      data.githubUsername = body.githubUsername;
    if (body.linkedinId !== undefined) data.linkedinId = body.linkedinId;
    if (body.linkedinUrl !== undefined) data.linkedinUrl = body.linkedinUrl;
    if (body.sourceUrl !== undefined) data.sourceUrl = body.sourceUrl;

    // Experience
    if (body.yearsExperience !== undefined)
      data.yearsExperience = body.yearsExperience;
    if (body.experience !== undefined) data.experience = body.experience;
    if (body.education !== undefined) data.education = body.education;
    if (body.certifications !== undefined)
      data.certifications = body.certifications;
    if (body.spokenLanguages !== undefined)
      data.spokenLanguages = body.spokenLanguages;

    // Skills
    if (body.skills !== undefined) data.skills = body.skills;
    if (body.codingLanguages !== undefined)
      data.codingLanguages = body.codingLanguages;

    // AI Scoring
    if (body.alignmentScore !== undefined)
      data.alignmentScore = body.alignmentScore;
    if (body.scoreBreakdown !== undefined)
      data.scoreBreakdown = body.scoreBreakdown;
    if (body.scoreConfidence !== undefined)
      data.scoreConfidence = body.scoreConfidence;
    if (body.scoreDrivers !== undefined) data.scoreDrivers = body.scoreDrivers;
    if (body.scoreDrags !== undefined) data.scoreDrags = body.scoreDrags;

    // AI Analysis
    if (body.persona !== undefined) data.persona = body.persona;
    if (body.deepAnalysis !== undefined) data.deepAnalysis = body.deepAnalysis;
    if (body.companyMatch !== undefined) data.companyMatch = body.companyMatch;
    if (body.indicators !== undefined) data.indicators = body.indicators;
    if (body.interviewGuide !== undefined)
      data.interviewGuide = body.interviewGuide;
    if (body.networkDossier !== undefined)
      data.networkDossier = body.networkDossier;
    if (body.advancedProfile !== undefined)
      data.advancedProfile = body.advancedProfile;
    if (body.buildprint !== undefined) data.buildprint = body.buildprint;

    // Pipeline
    if (body.pipelineStage !== undefined)
      data.pipelineStage = body.pipelineStage;
    if (body.unlockedSteps !== undefined)
      data.unlockedSteps = body.unlockedSteps;
    if (body.shortlistSummary !== undefined)
      data.shortlistSummary = body.shortlistSummary;
    if (body.keyEvidence !== undefined) data.keyEvidence = body.keyEvidence;
    if (body.risks !== undefined) data.risks = body.risks;

    // LinkedIn-specific signals
    if (body.connectionDegree !== undefined)
      data.connectionDegree = body.connectionDegree;
    if (body.mutualConnections !== undefined)
      data.mutualConnections = body.mutualConnections;
    if (body.openToWork !== undefined) data.openToWork = body.openToWork;
    if (body.isPremium !== undefined) data.isPremium = body.isPremium;
    if (body.rawProfileText !== undefined)
      data.rawProfileText = body.rawProfileText;

    // Verify ownership before updating (userId is guaranteed by auth check above)
    const existing = await prisma.candidate.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
            { error: "Candidate not found" },
            { status: 404 }
          );
        }
      }

    const candidate = await prisma.candidate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Candidate update error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Update would violate a unique constraint" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}

// DELETE - Delete candidate
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const { id } = await params;

    // If session exists, verify ownership before deleting
    if (userId) {
      const existing = await prisma.candidate.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Candidate not found" },
          { status: 404 }
        );
      }
    }

    // Attempt delete directly, catch P2025 for not-found
    try {
      await prisma.candidate.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch (deleteError) {
      if (
        deleteError instanceof Prisma.PrismaClientKnownRequestError &&
        deleteError.code === "P2025"
      ) {
        return NextResponse.json(
          { error: "Candidate not found" },
          { status: 404 }
        );
      }
      throw deleteError;
    }
  } catch (error) {
    console.error("Candidate deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single candidate with notes
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
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
  try {
    const { id } = await params;
    const body = await request.json();

    // Check candidate exists
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Build update data from allowed fields only
    const data: Prisma.CandidateUpdateInput = {};

    // Identity fields
    if (body.name !== undefined) data.name = body.name;
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
  try {
    const { id } = await params;

    // Check candidate exists
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    await prisma.candidate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Candidate deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const VALID_ORDER_BY = ["createdAt", "alignmentScore", "name"] as const;
const VALID_SOURCE_TYPES = ["GITHUB", "LINKEDIN", "MANUAL"] as const;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

// GET - List candidates with filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse pagination
    let limit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT));
    if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    let offset = parseInt(searchParams.get("offset") || "0");
    if (isNaN(offset) || offset < 0) offset = 0;

    // Parse ordering
    const orderByParam = searchParams.get("orderBy") || "createdAt";
    const orderBy = VALID_ORDER_BY.includes(
      orderByParam as (typeof VALID_ORDER_BY)[number]
    )
      ? orderByParam
      : "createdAt";

    const orderParam = searchParams.get("order") || "desc";
    const order = orderParam === "asc" ? "asc" : "desc";

    // Build where clause
    const where: Prisma.CandidateWhereInput = {};

    // Filter by sourceType
    const sourceType = searchParams.get("sourceType");
    if (
      sourceType &&
      VALID_SOURCE_TYPES.includes(
        sourceType as (typeof VALID_SOURCE_TYPES)[number]
      )
    ) {
      where.sourceType = sourceType as Prisma.EnumSourceTypeFilter;
    }

    // Filter by pipelineStage
    const pipelineStage = searchParams.get("pipelineStage");
    if (pipelineStage) {
      where.pipelineStage = pipelineStage;
    }

    // Search by name, company, currentRole
    const search = searchParams.get("search");
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { company: { contains: search.trim(), mode: "insensitive" } },
        { currentRole: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    // Execute query and count in parallel
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset,
      }),
      prisma.candidate.count({ where }),
    ]);

    return NextResponse.json({ candidates, total, limit, offset });
  } catch (error) {
    console.error("Candidates list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

// POST - Create a new candidate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (
      !body.sourceType ||
      !VALID_SOURCE_TYPES.includes(body.sourceType)
    ) {
      return NextResponse.json(
        {
          error: `sourceType is required and must be one of: ${VALID_SOURCE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.create({
      data: {
        // Identity
        name: body.name.trim(),
        headline: body.headline || null,
        currentRole: body.currentRole || null,
        company: body.company || null,
        location: body.location || null,
        avatar: body.avatar || null,

        // Source tracking
        sourceType: body.sourceType,
        githubUsername: body.githubUsername || null,
        linkedinId: body.linkedinId || null,
        linkedinUrl: body.linkedinUrl || null,
        sourceUrl: body.sourceUrl || null,

        // Experience
        yearsExperience: body.yearsExperience ?? null,
        experience: body.experience ?? undefined,
        education: body.education ?? undefined,
        certifications: body.certifications ?? undefined,
        spokenLanguages: body.spokenLanguages ?? undefined,

        // Skills
        skills: body.skills ?? undefined,
        codingLanguages: body.codingLanguages ?? undefined,

        // AI Scoring
        alignmentScore: body.alignmentScore ?? null,
        scoreBreakdown: body.scoreBreakdown ?? undefined,
        scoreConfidence: body.scoreConfidence || null,
        scoreDrivers: body.scoreDrivers || [],
        scoreDrags: body.scoreDrags || [],

        // AI Analysis
        persona: body.persona ?? undefined,
        deepAnalysis: body.deepAnalysis || null,
        companyMatch: body.companyMatch ?? undefined,
        indicators: body.indicators ?? undefined,
        interviewGuide: body.interviewGuide ?? undefined,
        networkDossier: body.networkDossier ?? undefined,
        advancedProfile: body.advancedProfile ?? undefined,
        buildprint: body.buildprint ?? undefined,

        // Pipeline
        pipelineStage: body.pipelineStage || "sourced",
        unlockedSteps: body.unlockedSteps || [],
        shortlistSummary: body.shortlistSummary || null,
        keyEvidence: body.keyEvidence || [],
        risks: body.risks || [],

        // LinkedIn-specific signals
        connectionDegree: body.connectionDegree || null,
        mutualConnections: body.mutualConnections || null,
        openToWork: body.openToWork ?? null,
        isPremium: body.isPremium ?? null,
        rawProfileText: body.rawProfileText || null,

        // User association
        userId: body.userId || null,

        // Timestamps
        capturedAt: body.capturedAt ? new Date(body.capturedAt) : new Date(),
      },
    });

    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error) {
    console.error("Candidate creation error:", error);

    // Handle unique constraint violations
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A candidate with this identity already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }
}

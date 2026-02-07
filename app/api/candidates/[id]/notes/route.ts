import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List notes for a candidate
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const { id } = await params;

    // Verify candidate exists (and belongs to user if authenticated)
    const candidateWhere: Prisma.CandidateWhereInput = { id };
    if (userId) {
      candidateWhere.userId = userId;
    }

    const candidate = await prisma.candidate.findFirst({
      where: candidateWhere,
      select: { id: true },
    });
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const notes = await prisma.candidateNote.findMany({
      where: { candidateId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Notes list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST - Add a note to a candidate
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.author || typeof body.author !== "string" || !body.author.trim()) {
      return NextResponse.json(
        { error: "author is required" },
        { status: 400 }
      );
    }

    if (
      !body.content ||
      typeof body.content !== "string" ||
      !body.content.trim()
    ) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json(
          { error: "tags must be an array of strings" },
          { status: 400 }
        );
      }
      if (!body.tags.every((t: unknown) => typeof t === "string")) {
        return NextResponse.json(
          { error: "tags must be an array of strings" },
          { status: 400 }
        );
      }
    }

    // Verify candidate exists (and belongs to user if authenticated)
    const candidateWhere: Prisma.CandidateWhereInput = { id };
    if (userId) {
      candidateWhere.userId = userId;
    }

    const candidate = await prisma.candidate.findFirst({
      where: candidateWhere,
      select: { id: true },
    });
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const note = await prisma.candidateNote.create({
      data: {
        candidateId: id,
        author: body.author.trim(),
        content: body.content.trim(),
        tags: body.tags ?? [],
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Note creation error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

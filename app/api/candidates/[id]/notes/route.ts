import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { candidateNoteCreateSchema } from "@/lib/validation/apiSchemas";

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

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = candidateNoteCreateSchema.safeParse(rawBody);
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

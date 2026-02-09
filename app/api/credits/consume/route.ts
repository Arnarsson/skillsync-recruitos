import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { consumeCredit } from "@/lib/credits";
import prisma from "@/lib/db";
import { creditConsumeSchema } from "@/lib/validation/apiSchemas";

/**
 * POST /api/credits/consume
 * Deducts 1 credit for a candidate profile analysis.
 *
 * Body: { candidateUsername: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parsed = creditConsumeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { candidateUsername } = parsed.data;

    const githubId = (session.user as any).id?.toString();
    if (!githubId) {
      return NextResponse.json(
        { error: "User ID not available" },
        { status: 400 },
      );
    }

    // Find user by githubId
    const user = await prisma.user.findUnique({
      where: { githubId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await consumeCredit(user.id, candidateUsername);

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      ledgerEntryId: result.ledgerEntryId,
    });
  } catch (error: any) {
    if (error.message === "Insufficient credits") {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: "Du har ikke nok kreditter. Køb flere for at fortsætte.",
        },
        { status: 402 },
      );
    }

    console.error("Credit consumption error:", error);
    return NextResponse.json(
      { error: "Failed to consume credit" },
      { status: 500 },
    );
  }
}

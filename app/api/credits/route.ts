import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * GET /api/credits
 * Returns user's credit balance. (Legacy endpoint — prefer /api/credits/balance)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const githubId = (session.user as any).id?.toString();

    if (githubId) {
      try {
        const user = await prisma.user.findUnique({
          where: { githubId },
          select: {
            credits: true,
            plan: true,
            _count: {
              select: { profileViews: { where: { creditUsed: true } } },
            },
          },
        });

        if (user) {
          return NextResponse.json({
            credits: user.credits,
            plan: user.plan,
            profilesViewed: user._count.profileViews,
            unlimited: user.plan === "ANNUAL",
          });
        }
      } catch {
        // DB not available, fall through to defaults
      }
    }

    // Fallback defaults
    return NextResponse.json({
      credits: 5,
      plan: "FREE",
      profilesViewed: 0,
      unlimited: false,
    });
  } catch (error) {
    console.error("Credits error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 },
    );
  }
}

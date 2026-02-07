import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits";
import prisma from "@/lib/db";

/**
 * GET /api/credits/balance
 * Returns the current user's credit balance and plan info.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id?.toString();

    if (!userId) {
      // Fallback: if we don't have a DB user yet, return defaults
      return NextResponse.json({
        credits: 5,
        plan: "FREE",
        unlimited: false,
        profilesViewed: 0,
      });
    }

    // Try to find user by githubId
    const user = await prisma.user.findUnique({
      where: { githubId: userId },
      select: {
        id: true,
        credits: true,
        plan: true,
        _count: { select: { profileViews: { where: { creditUsed: true } } } },
      },
    });

    if (!user) {
      return NextResponse.json({
        credits: 5,
        plan: "FREE",
        unlimited: false,
        profilesViewed: 0,
      });
    }

    return NextResponse.json({
      credits: user.credits,
      plan: user.plan,
      unlimited: user.plan === "ANNUAL",
      profilesViewed: user._count.profileViews,
    });
  } catch (error) {
    console.error("Credits balance error:", error);
    // Graceful fallback if DB not connected
    return NextResponse.json({
      credits: 5,
      plan: "FREE",
      unlimited: false,
      profilesViewed: 0,
    });
  }
}

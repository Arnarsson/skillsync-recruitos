import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET user's credit balance
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        credits: true,
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        profileViews: {
          where: { creditUsed: true },
          select: { id: true },
        },
      },
    });

    if (!user) {
      // User not in database yet - return defaults
      return NextResponse.json({
        credits: 3,
        plan: "FREE",
        profilesViewed: 0,
        unlimited: false,
        hasStripeAccount: false,
      });
    }

    const unlimited = user.plan === "PRO" || user.plan === "ENTERPRISE";
    const profilesViewed = user.profileViews.length;

    return NextResponse.json({
      credits: user.credits,
      plan: user.plan,
      profilesViewed,
      unlimited,
      hasStripeAccount: !!user.stripeCustomerId,
      hasActiveSubscription: !!user.stripeSubscriptionId,
    });
  } catch (error) {
    console.error("Credits error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}

// POST to deduct credits (internal use - called when generating reports)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, username } = body;

    if (action !== "deduct") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Auto-create user on first credit usage (free trial activation)
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email: session.user.email!,
            name: session.user.name || session.user.email!,
            githubId: (session.user as any).id || `github_${Date.now()}`,
            credits: 3, // Start with 3 free trial credits
            plan: "FREE",
          },
        });
        console.log(`✅ Free trial activated for ${session.user.email} - 3 credits granted`);
      } catch (createError: any) {
        // Handle race condition if user was created by another request
        if (createError.code === 'P2002') {
          user = await prisma.user.findUnique({
            where: { email: session.user.email },
          });
          if (!user) throw createError;
        } else {
          throw createError;
        }
      }
    }

    // Check if user has unlimited credits (Pro/Enterprise)
    if (user.plan === "PRO" || user.plan === "ENTERPRISE") {
      // Record view but don't deduct credits
      await prisma.profileView.create({
        data: {
          userId: user.id,
          username,
          creditUsed: false,
        },
      });

      return NextResponse.json({
        success: true,
        creditsRemaining: 999999,
        unlimited: true,
      });
    }

    // Check if user has enough credits
    if (user.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 } // Payment Required
      );
    }

    // Deduct credit and record view
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          decrement: 1,
        },
      },
    });

    await prisma.profileView.create({
      data: {
        userId: user.id,
        username,
        creditUsed: true,
      },
    });

    return NextResponse.json({
      success: true,
      creditsRemaining: updatedUser.credits,
      unlimited: false,
    });
  } catch (error) {
    console.error("Credit deduction error:", error);
    return NextResponse.json(
      { error: "Failed to process credit deduction" },
      { status: 500 }
    );
  }
}

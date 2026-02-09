import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  detectActivitySignals,
  calculateEngagementScore,
  type ActivitySignals,
  type EngagementScore,
} from "@/lib/github";

export interface BehavioralInsights {
  activitySignals: ActivitySignals;
  engagementScore: EngagementScore;
  fetchedAt: string;
}

/**
 * GET /api/github/signals?username=<username>
 *
 * Returns behavioral insights including "open to work" signals
 * and engagement scoring for a GitHub user.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch both signals and engagement score in parallel
    const [activitySignals, engagementScore] = await Promise.all([
      detectActivitySignals(username),
      calculateEngagementScore(username),
    ]);

    const insights: BehavioralInsights = {
      activitySignals,
      engagementScore,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Behavioral insights API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze behavioral signals" },
      { status: 500 }
    );
  }
}

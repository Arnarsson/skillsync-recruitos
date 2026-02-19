import { NextRequest, NextResponse } from "next/server";
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
    // Return graceful empty data instead of 500 — avoids breaking the UI
    // when GITHUB_TOKEN is missing or the API is rate-limited.
    const emptyInsights: BehavioralInsights = {
      activitySignals: {
        openToWork: false,
        confidence: "low" as const,
        signals: [],
        lastProfileUpdate: null,
        activityTrend: "stable" as const,
        recentActivityCount: 0,
      },
      engagementScore: {
        score: 0,
        factors: {
          activityRecency: 0,
          contactability: 0,
          signalStrength: 0,
          responsiveness: 0,
        },
        bestOutreachTime: null,
        timezone: null,
      },
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(emptyInsights);
  }
}

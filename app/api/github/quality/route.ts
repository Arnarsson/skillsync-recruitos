import { NextRequest, NextResponse } from "next/server";
import { createOctokit } from "@/lib/github";
import {
  calculateQualitySignals,
  type QualitySignals,
} from "@/lib/anti-gaming-filters";

export interface QualityAssessmentResponse {
  username: string;
  qualitySignals: QualitySignals;
  fetchedAt: string;
}

/**
 * GET /api/github/quality?username=<username>
 *
 * Returns anti-gaming quality assessment for a GitHub profile:
 * - Tutorial repo detection
 * - Fork ratio analysis
 * - Commit burst detection
 * - Substantive contribution analysis
 * - Code review participation
 * - Maintenance score
 * - Overall quality score
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
    const octokit = createOctokit(process.env.GITHUB_TOKEN);
    
    const qualitySignals = await calculateQualitySignals(username, octokit);

    const response: QualityAssessmentResponse = {
      username,
      qualitySignals,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Quality assessment API error:", error);
    return NextResponse.json(
      { error: "Failed to assess profile quality" },
      { status: 500 }
    );
  }
}

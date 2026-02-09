import { NextRequest, NextResponse } from "next/server";
import { getDeepGitHubAnalysis } from "@/lib/github";
import { requireAuth } from "@/lib/auth-guard";

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
    const analysis = await getDeepGitHubAnalysis(username);

    if (!analysis) {
      return NextResponse.json(
        { error: "Could not fetch GitHub data" },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("GitHub deep analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze GitHub profile" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { searchTalentViaSERP } from "@/services/serpTalentSearch";
import { requireAuth } from "@/lib/auth-guard";

/**
 * SERP Talent Search API
 * 
 * Endpoint for searching technical talent via web search (Google/SERP)
 * Best for niche/specialized queries where GitHub/LinkedIn have limited coverage
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const location = searchParams.get("location") || undefined;
  const maxResults = parseInt(searchParams.get("maxResults") || "10");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const results = await searchTalentViaSERP(query, {
      location,
      maxResults,
    });

    return NextResponse.json({
      results,
      total: results.length,
      query,
    });
  } catch (error) {
    console.error("SERP talent search error:", error);
    return NextResponse.json(
      { error: "Failed to search talent via SERP" },
      { status: 500 }
    );
  }
}

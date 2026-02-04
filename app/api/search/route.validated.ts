import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchDevelopers } from "@/lib/github";
import { githubSearchSchema } from "@/lib/validation/apiSchemas";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    // Parse and validate search params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validated = githubSearchSchema.parse(searchParams);

    // Get session for authenticated requests (higher rate limits)
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    // Search GitHub
    const results = await searchDevelopers(
      validated.q,
      accessToken,
      validated.page,
      validated.perPage
    );

    return NextResponse.json(results);
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search developers" },
      { status: 500 }
    );
  }
}

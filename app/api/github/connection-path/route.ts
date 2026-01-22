import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  analyzeConnectionPath,
  checkDirectConnection,
  type GitHubConnectionPath,
  type DirectConnection,
} from "@/services/githubConnectionService";

export interface ConnectionPathResponse {
  connectionPath: GitHubConnectionPath;
  recruiterUsername: string;
  candidateUsername: string;
}

export interface DirectConnectionResponse {
  directConnection: DirectConnection;
  recruiterUsername: string;
  candidateUsername: string;
}

/**
 * GET /api/github/connection-path?candidate=<username>&quick=<boolean>
 *
 * Analyzes the connection path between the logged-in recruiter
 * and a candidate through GitHub's social graph.
 *
 * Query params:
 * - candidate: Required. The GitHub username of the candidate.
 * - quick: Optional. If "true", only checks direct connections (faster).
 *
 * Returns connection degree (1st/2nd/3rd), mutual connections,
 * shared repos, shared orgs, and the shortest path description.
 *
 * Requires authentication - the recruiter must be logged in via GitHub OAuth.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const candidateUsername = searchParams.get("candidate");
  const quickMode = searchParams.get("quick") === "true";

  if (!candidateUsername) {
    return NextResponse.json(
      { error: "Candidate username is required" },
      { status: 400 }
    );
  }

  // Get the logged-in user's session
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in with GitHub." },
      { status: 401 }
    );
  }

  // Extract recruiter's GitHub username from session
  // NextAuth stores it in the user object when using GitHub provider
  const sessionUser = session.user as { name?: string; login?: string };
  const sessionWithToken = session as { accessToken?: string };
  const recruiterUsername = sessionUser.name || sessionUser.login;
  const accessToken = sessionWithToken.accessToken;

  if (!recruiterUsername) {
    return NextResponse.json(
      { error: "Could not determine your GitHub username from session" },
      { status: 400 }
    );
  }

  // Don't allow checking connection to yourself
  if (recruiterUsername.toLowerCase() === candidateUsername.toLowerCase()) {
    return NextResponse.json(
      { error: "Cannot check connection path to yourself" },
      { status: 400 }
    );
  }

  try {
    if (quickMode) {
      // Quick mode: Only check direct follows
      const directConnection = await checkDirectConnection(
        recruiterUsername,
        candidateUsername,
        accessToken
      );

      const response: DirectConnectionResponse = {
        directConnection,
        recruiterUsername,
        candidateUsername,
      };

      return NextResponse.json(response);
    }

    // Full analysis
    const connectionPath = await analyzeConnectionPath(
      recruiterUsername,
      candidateUsername,
      accessToken
    );

    const response: ConnectionPathResponse = {
      connectionPath,
      recruiterUsername,
      candidateUsername,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Connection path analysis error:", error);

    // Handle rate limiting specifically
    if (error instanceof Error && error.message.includes("rate limit")) {
      return NextResponse.json(
        {
          error: "GitHub API rate limit exceeded. Please try again later.",
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze connection path" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateAIPsychometricProfile, analyzeGitHubSignals } from "@/lib/psychometrics";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    console.log(`[Behavioral Profile API] Generating profile for: ${username}`);

    // Fetch GitHub user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "SkillSync-Recruitos",
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: `GitHub user not found: ${username}` },
        { status: 404 }
      );
    }

    const githubUser = await userResponse.json();

    // Fetch user's repositories for analysis
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "SkillSync-Recruitos",
        },
      }
    );

    const repos = reposResponse.ok ? await reposResponse.json() : [];

    // Analyze GitHub signals
    const githubSignals = analyzeGitHubSignals(repos, githubUser);

    // Generate AI-powered behavioral profile
    const profile = await generateAIPsychometricProfile(
      githubSignals,
      {
        name: githubUser.name,
        bio: githubUser.bio,
        company: githubUser.company,
        location: githubUser.location,
        followers: githubUser.followers,
        public_repos: githubUser.public_repos,
      }
    );

    console.log(`[Behavioral Profile API] Successfully generated profile for: ${username}`);

    return NextResponse.json({
      success: true,
      profile,
      githubSignals: {
        username: githubSignals.username,
        techStack: githubSignals.techStack,
        interests: githubSignals.interests,
        commitPatterns: githubSignals.commitPatterns,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Behavioral Profile API] Error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to generate behavioral profile", details: errorMessage },
      { status: 500 }
    );
  }
}

// Increase timeout for AI operations
export const maxDuration = 60;

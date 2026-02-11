import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserProfile } from "@/lib/github";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const session = await getServerSession(authOptions);
    const accessToken = (session as any)?.accessToken;

    // Get profile from GitHub
    const profile = await getUserProfile(username, accessToken);

    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if this is a deep profile request
    const deep = request.nextUrl.searchParams.get("deep") === "true";

    if (deep) {
      // Return full profile with contact info
      return NextResponse.json({
        ...profile,
        deep: true,
        contact: {
          email: profile.user.blog?.includes("@")
            ? profile.user.blog
            : `${username}@users.noreply.github.com`,
          twitter: profile.user.twitter_username,
          website: profile.user.blog,
        },
      });
    }

    // Return basic profile
    return NextResponse.json({
      user: {
        login: profile.user.login,
        name: profile.user.name,
        avatar_url: profile.user.avatar_url,
        bio: profile.user.bio,
        location: profile.user.location,
        company: profile.user.company,
        public_repos: profile.user.public_repos,
        followers: profile.user.followers,
        following: profile.user.following,
        created_at: profile.user.created_at,
      },
      repos: profile.repos,
      totalStars: profile.totalStars,
      skills: profile.skills,
      contributions: profile.contributions,
      deep: false,
    });
  } catch (error) {
    console.warn("[Developers API] GitHub profile fetch failed, trying fallback", error);

    // Fallback to latest captured candidate data when GitHub is unavailable/rate-limited.
    const fallbackCandidate = await prisma.candidate.findFirst({
      where: { githubUsername: username },
      orderBy: { updatedAt: "desc" },
    });

    if (fallbackCandidate) {
      const parsedSkills = Array.isArray(fallbackCandidate.skills)
        ? (fallbackCandidate.skills as string[])
        : [];

      const fallbackPayload = {
        user: {
          login: fallbackCandidate.githubUsername || username,
          name: fallbackCandidate.name || username,
          avatar_url:
            fallbackCandidate.avatar ||
            `https://avatars.githubusercontent.com/${fallbackCandidate.githubUsername || username}`,
          bio: fallbackCandidate.headline || null,
          location: fallbackCandidate.location || null,
          company: fallbackCandidate.company || null,
          public_repos: 0,
          followers: 0,
          following: 0,
          created_at: fallbackCandidate.createdAt.toISOString(),
        },
        repos: [],
        totalStars: 0,
        skills: parsedSkills,
        contributions: 0,
        deep: false,
      };

      return NextResponse.json(fallbackPayload);
    }

    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserProfile } from "@/lib/github";

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
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

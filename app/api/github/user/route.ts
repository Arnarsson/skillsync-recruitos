import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const username = request.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ error: "Missing username" }, { status: 400 });
  
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {},
      }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=30&sort=pushed`, {
        headers: process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {},
      }),
    ]);
    
    if (!userRes.ok) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const user = await userRes.json();
    const repos = await reposRes.json();
    
    // Extract top languages from repos
    const langCounts: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.language) langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    }
    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([lang]) => lang);
    
    return NextResponse.json({
      login: user.login,
      name: user.name,
      bio: user.bio,
      company: user.company,
      location: user.location,
      avatar_url: user.avatar_url,
      public_repos: user.public_repos,
      followers: user.followers,
      topLanguages,
      blog: user.blog,
      html_url: user.html_url,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

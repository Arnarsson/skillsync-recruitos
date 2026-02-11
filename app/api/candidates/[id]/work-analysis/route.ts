import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOctokit } from "@/lib/github";

export const maxDuration = 60;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "google/gemini-2.5-flash";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ---- GitHub data fetching helpers ----

interface RepoData {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  size: number;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface CommitTimeSlot {
  morning: number;   // 6-12
  afternoon: number;  // 12-18
  evening: number;    // 18-24
  night: number;      // 0-6
}

interface ContributionDay {
  date: string;
  count: number;
}

async function fetchGitHubData(username: string) {
  const octokit = createOctokit();

  // Fetch events, repos, and user profile in parallel
  const [eventsRes, reposRes, userRes] = await Promise.all([
    octokit.activity.listPublicEventsForUser({ username, per_page: 100 }),
    octokit.repos.listForUser({ username, sort: "pushed", per_page: 100 }),
    octokit.users.getByUsername({ username }),
  ]);

  const events = eventsRes.data;
  const repos = reposRes.data as unknown as RepoData[];
  const user = userRes.data;

  // --- Commit frequency patterns ---
  const commitSlots: CommitTimeSlot = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const commitsByDayOfWeek: Record<string, number> = {
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
  };
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build contribution heatmap data (last 52 weeks)
  const contributionMap = new Map<string, number>();
  const now = new Date();

  const pushEvents = events.filter((e) => e.type === "PushEvent");
  pushEvents.forEach((event) => {
    const date = new Date(event.created_at || "");
    const hour = date.getUTCHours();

    if (hour >= 6 && hour < 12) commitSlots.morning++;
    else if (hour >= 12 && hour < 18) commitSlots.afternoon++;
    else if (hour >= 18) commitSlots.evening++;
    else commitSlots.night++;

    const dayName = dayNames[date.getUTCDay()];
    commitsByDayOfWeek[dayName] = (commitsByDayOfWeek[dayName] || 0) + 1;

    // Add to contribution map
    const dateStr = date.toISOString().split("T")[0];
    contributionMap.set(dateStr, (contributionMap.get(dateStr) || 0) + 1);
  });

  // Fill heatmap for last 365 days
  const contributions: ContributionDay[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    contributions.push({
      date: dateStr,
      count: contributionMap.get(dateStr) || 0,
    });
  }

  // --- Language breakdown ---
  const languageBytes = new Map<string, number>();
  repos.forEach((repo) => {
    if (repo.language && !repo.fork) {
      languageBytes.set(
        repo.language,
        (languageBytes.get(repo.language) || 0) + (repo.size || 0)
      );
    }
  });
  const totalBytes = Array.from(languageBytes.values()).reduce((a, b) => a + b, 0);
  const languages = Array.from(languageBytes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, bytes]) => ({
      name,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
      repoCount: repos.filter((r) => r.language === name && !r.fork).length,
    }));

  // --- Top repos ---
  const topRepos = [...repos]
    .filter((r) => !r.fork)
    .sort((a, b) => (b.stargazers_count + b.forks_count * 2) - (a.stargazers_count + a.forks_count * 2))
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      topics: r.topics || [],
      updatedAt: r.pushed_at,
    }));

  // --- Tech stack from topics + languages ---
  const techMap = new Map<string, number>();
  repos.forEach((repo) => {
    if (repo.language && !repo.fork) {
      techMap.set(repo.language, (techMap.get(repo.language) || 0) + 1);
    }
    (repo.topics || []).forEach((topic) => {
      techMap.set(topic, (techMap.get(topic) || 0) + 1);
    });
  });
  const techStack = Array.from(techMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({
      name,
      count,
      proficiency: count >= 10 ? "expert" : count >= 5 ? "proficient" : count >= 2 ? "familiar" : "exploring",
    }));

  // --- Activity summary stats ---
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const ownedRepos = repos.filter((r) => !r.fork).length;
  const forkedRepos = repos.filter((r) => r.fork).length;

  // Recent activity in the last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentEventCount = events.filter(
    (e) => new Date(e.created_at || "") > thirtyDaysAgo
  ).length;

  return {
    user: {
      name: user.name || username,
      bio: user.bio || "",
      location: user.location || "",
      company: user.company || "",
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
    },
    commitPatterns: {
      timeOfDay: commitSlots,
      dayOfWeek: commitsByDayOfWeek,
      totalPushEvents: pushEvents.length,
      recentActivityCount: recentEventCount,
    },
    contributions,
    languages,
    topRepos,
    techStack,
    stats: {
      totalStars,
      totalForks,
      ownedRepos,
      forkedRepos,
      totalEvents: events.length,
    },
  };
}

// ---- AI Insights generation ----

async function generateAIInsights(
  githubData: Awaited<ReturnType<typeof fetchGitHubData>>
): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY not configured" };
  }

  const prompt = `Analyze this software engineer's GitHub activity and provide recruiting insights.

GitHub Profile: ${githubData.user.name}
Bio: ${githubData.user.bio}
Location: ${githubData.user.location}
Company: ${githubData.user.company}
Account created: ${githubData.user.createdAt}
Followers: ${githubData.user.followers}
Public repos: ${githubData.user.publicRepos}

Top Languages: ${githubData.languages.map((l) => `${l.name} (${l.percentage}%, ${l.repoCount} repos)`).join(", ")}

Top Repositories:
${githubData.topRepos.map((r) => `- ${r.name}: ${r.description || "No description"} (${r.stars} stars, ${r.forks} forks, ${r.language})`).join("\n")}

Tech Stack: ${githubData.techStack.map((t) => `${t.name} (${t.proficiency})`).join(", ")}

Activity Stats:
- Total stars across repos: ${githubData.stats.totalStars}
- Total forks: ${githubData.stats.totalForks}
- Owned repos: ${githubData.stats.ownedRepos}
- Forked repos (OSS contributions): ${githubData.stats.forkedRepos}
- Push events in last ~90 days: ${githubData.commitPatterns.totalPushEvents}
- Events in last 30 days: ${githubData.commitPatterns.recentActivityCount}

Commit Time Patterns:
- Morning (6-12): ${githubData.commitPatterns.timeOfDay.morning}
- Afternoon (12-18): ${githubData.commitPatterns.timeOfDay.afternoon}
- Evening (18-24): ${githubData.commitPatterns.timeOfDay.evening}
- Night (0-6): ${githubData.commitPatterns.timeOfDay.night}

Respond in JSON with this exact structure:
{
  "workPatterns": {
    "summary": "2-3 sentence summary of when and how they code",
    "consistency": "high/moderate/sporadic",
    "peakHours": "description of when they're most active"
  },
  "technicalDepth": {
    "summary": "2-3 sentence assessment of technical depth and breadth",
    "primaryDomain": "their main technical domain",
    "specializations": ["list", "of", "specializations"]
  },
  "openSourceImpact": {
    "summary": "2-3 sentence assessment of their open source impact",
    "impactLevel": "high/moderate/low/minimal",
    "notableContributions": "any notable projects or contributions"
  },
  "growthTrajectory": {
    "summary": "2-3 sentence assessment of their growth trajectory",
    "trajectory": "accelerating/steady/plateauing",
    "nextLikelySkills": ["technologies", "they", "might", "learn", "next"]
  },
  "recruitingInsights": {
    "strengths": ["key strength 1", "key strength 2", "key strength 3"],
    "concerns": ["potential concern 1", "potential concern 2"],
    "outreachAngle": "suggested angle for recruitment outreach"
  }
}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://skillsync.app",
      "X-Title": "RecruitOS Deep Work Analyzer",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Work Analysis] AI error:", response.status, errorText.substring(0, 200));
    return { error: `AI analysis failed (${response.status})` };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { error: "Empty AI response" };
  }

  try {
    return JSON.parse(content);
  } catch {
    return { rawInsights: content };
  }
}

// ---- GET handler ----

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fallbackUsernameParam = request.nextUrl.searchParams.get("username");
    const isUuidLike = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      );

    // Look up candidate by Prisma id first, then by githubUsername
    let candidate = await prisma.candidate.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        githubUsername: true,
        buildprint: true,
      },
    });

    if (!candidate) {
      // Fallback: look up by githubUsername (pipeline uses username as id)
      candidate = await prisma.candidate.findFirst({
        where: { githubUsername: id },
        select: {
          id: true,
          name: true,
          githubUsername: true,
          buildprint: true,
        },
      });
    }

    // Build a synthetic candidate for public/demo flow when this is already a GitHub username.
    let syntheticCandidateName: string | null = null;
    let githubUsername = candidate?.githubUsername || id;
    if (!candidate && fallbackUsernameParam && !isUuidLike(fallbackUsernameParam)) {
      githubUsername = fallbackUsernameParam;
      syntheticCandidateName = fallbackUsernameParam;
    }
    if (!candidate && isUuidLike(id) && !githubUsername) {
      return NextResponse.json(
        { error: "Candidate not found. Missing GitHub username for work analysis." },
        { status: 404 }
      );
    }
    if (!candidate && !isUuidLike(id)) {
      syntheticCandidateName = id;
      githubUsername = id;
    }

    if (!githubUsername) {
      return NextResponse.json(
        { error: "Candidate has no GitHub username" },
        { status: 400 }
      );
    }

    // Check for cached analysis in buildprint
    const existingBuildprint = (candidate?.buildprint as Record<string, unknown> | null) || null;
    if (existingBuildprint?.workAnalysis) {
      return NextResponse.json({
        cached: true,
        ...(existingBuildprint.workAnalysis as Record<string, unknown>),
      });
    }

    // Fetch fresh GitHub data
    const githubData = await fetchGitHubData(githubUsername);

    // Generate AI insights
    const aiInsights = await generateAIInsights(githubData);

    // Build result
    const workAnalysis = {
      githubUsername,
      candidateName: candidate?.name || syntheticCandidateName || githubUsername,
      analyzedAt: new Date().toISOString(),
      user: githubData.user,
      commitPatterns: githubData.commitPatterns,
      contributions: githubData.contributions,
      languages: githubData.languages,
      topRepos: githubData.topRepos,
      techStack: githubData.techStack,
      stats: githubData.stats,
      aiInsights,
    };

    // Cache in the candidate's buildprint field
    // Use JSON round-trip to ensure Prisma-compatible plain JSON (no typed interfaces)
    const updatedBuildprint = JSON.parse(JSON.stringify({
      ...(existingBuildprint || {}),
      workAnalysis,
    }));

    if (candidate?.id) {
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { buildprint: updatedBuildprint },
      });
    }

    return NextResponse.json({ cached: false, ...workAnalysis });
  } catch (error) {
    console.error("[Work Analysis] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate work analysis", details: message },
      { status: 500 }
    );
  }
}

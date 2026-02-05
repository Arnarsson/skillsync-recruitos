/**
 * Generate Real Demo Profiles
 * 
 * Fetches actual GitHub data for famous developers and generates
 * complete profiles with real receipts (commit URLs, PR links, etc.)
 */

import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";

// Load env
import * as dotenv from "dotenv";
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN not found in environment");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Famous developers to analyze
const DEMO_DEVELOPERS = [
  "sindresorhus",  // Creator of Chalk, AVA, many npm packages
  "tj",            // TJ Holowaychuk - Express.js, Koa, co
  "rauchg",        // Guillermo Rauch - Vercel, Next.js, Socket.io
];

interface DemoProfile {
  id: string;
  githubUsername: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  blog: string;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
  
  // Buildprint metrics with real receipts
  buildprint: {
    impact: MetricWithReceipts;
    collaboration: MetricWithReceipts;
    consistency: MetricWithReceipts;
    complexity: MetricWithReceipts;
    ownership: MetricWithReceipts;
    overallScore: number;
  };
  
  // Top repositories with real URLs
  topRepos: RepoInfo[];
  
  // Recent PRs with real URLs
  recentPRs: PRInfo[];
  
  // Languages breakdown
  languages: LanguageInfo[];
  
  // Skills extracted from repos
  skills: string[];
  
  // Generated at timestamp
  generatedAt: string;
}

interface MetricWithReceipts {
  value: number;
  label: string;
  receipts: Receipt[];
}

interface Receipt {
  label: string;
  value: string | number;
  url: string;
  type: "repo" | "pr" | "commit" | "profile" | "stat";
}

interface RepoInfo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  updatedAt: string;
}

interface PRInfo {
  title: string;
  repo: string;
  url: string;
  state: string;
  createdAt: string;
  mergedAt: string | null;
}

interface LanguageInfo {
  name: string;
  percentage: number;
  color: string;
}

// Language colors from GitHub
const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Swift: "#F05138",
};

async function fetchUserProfile(username: string) {
  console.log(`📥 Fetching profile for ${username}...`);
  
  const { data: user } = await octokit.users.getByUsername({ username });
  return user;
}

async function fetchUserRepos(username: string, limit = 100) {
  console.log(`📦 Fetching repos for ${username}...`);
  
  const { data: repos } = await octokit.repos.listForUser({
    username,
    sort: "pushed",
    per_page: limit,
    type: "owner",
  });
  
  return repos;
}

async function fetchUserEvents(username: string, limit = 100) {
  console.log(`📊 Fetching events for ${username}...`);
  
  try {
    const { data: events } = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: limit,
    });
    return events;
  } catch (e) {
    console.warn(`⚠️ Could not fetch events for ${username}`);
    return [];
  }
}

async function fetchUserPRs(username: string) {
  console.log(`🔀 Fetching PRs for ${username}...`);
  
  try {
    // Search for PRs by user
    const { data } = await octokit.search.issuesAndPullRequests({
      q: `author:${username} type:pr`,
      sort: "created",
      order: "desc",
      per_page: 20,
    });
    
    return data.items.map(pr => ({
      title: pr.title,
      repo: pr.repository_url.split("/").slice(-2).join("/"),
      url: pr.html_url,
      state: pr.state,
      createdAt: pr.created_at,
      mergedAt: pr.pull_request?.merged_at || null,
    }));
  } catch (e) {
    console.warn(`⚠️ Could not fetch PRs for ${username}`);
    return [];
  }
}

function calculateBuildprint(user: any, repos: any[], prs: any[]): DemoProfile["buildprint"] {
  // Sort repos by stars
  const sortedByStars = [...repos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  const topRepos = sortedByStars.slice(0, 5);
  
  // Calculate total stars
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  
  // Impact score based on stars/forks
  const impactScore = Math.min(100, Math.log10(totalStars + 1) * 20);
  
  // Collaboration score based on PRs to other repos
  const externalPRs = prs.filter(pr => !pr.repo.includes(user.login));
  const collabScore = Math.min(100, externalPRs.length * 5 + (user.followers / 100));
  
  // Consistency score based on recent activity
  const recentRepos = repos.filter(r => {
    const updated = new Date(r.updated_at);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return updated > threeMonthsAgo;
  });
  const consistencyScore = Math.min(100, recentRepos.length * 10);
  
  // Complexity score based on language diversity
  const languages = new Set(repos.map(r => r.language).filter(Boolean));
  const complexityScore = Math.min(100, languages.size * 12);
  
  // Ownership score based on owned repos
  const ownedRepos = repos.filter(r => !r.fork);
  const ownershipScore = Math.min(100, (ownedRepos.length / repos.length) * 100);
  
  return {
    impact: {
      value: Math.round(impactScore),
      label: "Impact",
      receipts: [
        {
          label: "Total Stars",
          value: totalStars.toLocaleString(),
          url: `https://github.com/${user.login}?tab=repositories&sort=stargazers`,
          type: "profile",
        },
        ...topRepos.slice(0, 3).map(r => ({
          label: r.name,
          value: `⭐ ${r.stargazers_count.toLocaleString()}`,
          url: r.html_url,
          type: "repo" as const,
        })),
      ],
    },
    collaboration: {
      value: Math.round(collabScore),
      label: "Collaboration",
      receipts: [
        {
          label: "Followers",
          value: user.followers.toLocaleString(),
          url: `https://github.com/${user.login}?tab=followers`,
          type: "profile",
        },
        ...externalPRs.slice(0, 3).map(pr => ({
          label: pr.title.slice(0, 50),
          value: pr.repo,
          url: pr.url,
          type: "pr" as const,
        })),
      ],
    },
    consistency: {
      value: Math.round(consistencyScore),
      label: "Consistency",
      receipts: [
        {
          label: "Recently Active Repos",
          value: recentRepos.length,
          url: `https://github.com/${user.login}?tab=repositories&sort=pushed`,
          type: "profile",
        },
        {
          label: "Account Age",
          value: `${Math.floor((Date.now() - new Date(user.created_at).getTime()) / (365 * 24 * 60 * 60 * 1000))} years`,
          url: `https://github.com/${user.login}`,
          type: "profile",
        },
      ],
    },
    complexity: {
      value: Math.round(complexityScore),
      label: "Complexity",
      receipts: [
        {
          label: "Languages Used",
          value: languages.size,
          url: `https://github.com/${user.login}`,
          type: "stat",
        },
        ...[...languages].slice(0, 4).map(lang => ({
          label: lang as string,
          value: "✓",
          url: `https://github.com/${user.login}?tab=repositories&language=${encodeURIComponent(lang as string)}`,
          type: "stat" as const,
        })),
      ],
    },
    ownership: {
      value: Math.round(ownershipScore),
      label: "Ownership",
      receipts: [
        {
          label: "Original Repos",
          value: `${ownedRepos.length} / ${repos.length}`,
          url: `https://github.com/${user.login}?tab=repositories&type=source`,
          type: "stat",
        },
        {
          label: "Total Forks Received",
          value: totalForks.toLocaleString(),
          url: `https://github.com/${user.login}`,
          type: "stat",
        },
      ],
    },
    overallScore: Math.round((impactScore + collabScore + consistencyScore + complexityScore + ownershipScore) / 5),
  };
}

function calculateLanguages(repos: any[]): LanguageInfo[] {
  const langCounts: Record<string, number> = {};
  
  for (const repo of repos) {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    }
  }
  
  const total = Object.values(langCounts).reduce((a, b) => a + b, 0);
  
  return Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
      color: LANG_COLORS[name] || "#666",
    }));
}

function extractSkills(repos: any[]): string[] {
  const skills = new Set<string>();
  
  // Add languages
  for (const repo of repos) {
    if (repo.language) skills.add(repo.language);
  }
  
  // Add topics
  for (const repo of repos) {
    if (repo.topics) {
      for (const topic of repo.topics) {
        skills.add(topic);
      }
    }
  }
  
  // Map common topics to cleaner skill names
  const skillMap: Record<string, string> = {
    "nodejs": "Node.js",
    "reactjs": "React",
    "vuejs": "Vue.js",
    "nextjs": "Next.js",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "python": "Python",
    "golang": "Go",
    "rust": "Rust",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "graphql": "GraphQL",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
  };
  
  return [...skills]
    .map(s => skillMap[s.toLowerCase()] || s)
    .filter(s => s.length > 1 && s.length < 20)
    .slice(0, 20);
}

async function generateDemoProfile(username: string): Promise<DemoProfile> {
  console.log(`\n🚀 Generating profile for @${username}...`);
  
  // Fetch all data
  const user = await fetchUserProfile(username);
  const repos = await fetchUserRepos(username);
  const prs = await fetchUserPRs(username);
  
  // Sort repos by stars for top repos
  const topRepos = [...repos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 10)
    .map(r => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description || "",
      url: r.html_url,
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      language: r.language || "Unknown",
      topics: r.topics || [],
      updatedAt: r.updated_at,
    }));
  
  // Calculate buildprint
  const buildprint = calculateBuildprint(user, repos, prs);
  
  // Calculate languages
  const languages = calculateLanguages(repos);
  
  // Extract skills
  const skills = extractSkills(repos);
  
  // Determine current role based on bio/company
  const currentRole = user.bio?.includes("creator") || user.bio?.includes("author")
    ? "Open Source Creator"
    : user.company
    ? `Engineer at ${user.company}`
    : "Software Engineer";
  
  const profile: DemoProfile = {
    id: username,
    githubUsername: username,
    name: user.name || username,
    avatar: user.avatar_url,
    bio: user.bio || "",
    location: user.location || "Unknown",
    company: user.company || "",
    blog: user.blog || "",
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    createdAt: user.created_at,
    buildprint,
    topRepos,
    recentPRs: prs.slice(0, 10),
    languages,
    skills,
    generatedAt: new Date().toISOString(),
  };
  
  console.log(`✅ Generated profile for ${user.name || username}`);
  console.log(`   ⭐ Total stars: ${repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0).toLocaleString()}`);
  console.log(`   📦 Repos: ${repos.length}`);
  console.log(`   🔀 PRs found: ${prs.length}`);
  console.log(`   📊 Buildprint score: ${buildprint.overallScore}`);
  
  return profile;
}

async function main() {
  console.log("🎯 Generating Real Demo Profiles for RecruitOS\n");
  console.log("=" .repeat(50));
  
  const profiles: DemoProfile[] = [];
  
  for (const username of DEMO_DEVELOPERS) {
    try {
      const profile = await generateDemoProfile(username);
      profiles.push(profile);
      
      // Save individual profile
      const profilePath = path.join(__dirname, "..", ".data", "demo-profiles", `${username}.json`);
      fs.mkdirSync(path.dirname(profilePath), { recursive: true });
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
      console.log(`   💾 Saved to ${profilePath}`);
      
      // Rate limit: wait 2 seconds between users
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Failed to generate profile for ${username}:`, error);
    }
  }
  
  // Save all profiles
  const allProfilesPath = path.join(__dirname, "..", ".data", "demo-profiles", "all-profiles.json");
  fs.writeFileSync(allProfilesPath, JSON.stringify(profiles, null, 2));
  console.log(`\n✅ All profiles saved to ${allProfilesPath}`);
  
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Demo profile generation complete!");
  console.log(`   Generated ${profiles.length} profiles with REAL GitHub data`);
}

main().catch(console.error);

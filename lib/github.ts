import { Octokit } from "@octokit/rest";

// Create authenticated Octokit instance
export function createOctokit(accessToken?: string) {
  return new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN,
  });
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language?: string | null;
  topics: string[];
}

export interface SearchResult {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  skills: string[];
  repos: number;
  stars: number;
  followers: number;
  score: number;
}

// Search GitHub users by query
export async function searchDevelopers(
  query: string,
  accessToken?: string,
  page: number = 1,
  perPage: number = 10
): Promise<{ users: SearchResult[]; total: number }> {
  const octokit = createOctokit(accessToken);

  // Parse query for skills/languages
  const queryParts = query.toLowerCase().split(/\s+/);
  const languages = extractLanguages(queryParts);

  // Build GitHub search query
  let searchQuery = query;
  if (languages.length > 0) {
    searchQuery = `${query} language:${languages[0]}`;
  }

  try {
    // Search users
    const { data: searchData } = await octokit.search.users({
      q: searchQuery,
      sort: "followers",
      order: "desc",
      per_page: perPage,
      page,
    });

    // Fetch detailed info for each user
    const users = await Promise.all(
      searchData.items.slice(0, perPage).map(async (user) => {
        try {
          const [userDetails, repos] = await Promise.all([
            octokit.users.getByUsername({ username: user.login }),
            octokit.repos.listForUser({
              username: user.login,
              sort: "updated",
              per_page: 10,
            }),
          ]);

          // Calculate total stars
          const totalStars = repos.data.reduce(
            (sum, repo) => sum + (repo.stargazers_count || 0),
            0
          );

          // Extract skills from top repos
          const skills = extractSkills(repos.data as any);

          // Calculate match score (simple algorithm)
          const score = calculateScore(userDetails.data as any, totalStars, query);

          return {
            username: user.login,
            name: userDetails.data.name || user.login,
            avatar: userDetails.data.avatar_url,
            bio: userDetails.data.bio || "",
            location: userDetails.data.location || "",
            company: userDetails.data.company || "",
            skills,
            repos: userDetails.data.public_repos,
            stars: totalStars,
            followers: userDetails.data.followers,
            score,
          };
        } catch {
          return null;
        }
      })
    );

    return {
      users: users.filter((u): u is SearchResult => u !== null),
      total: searchData.total_count,
    };
  } catch (error) {
    console.error("GitHub search error:", error);
    return { users: [], total: 0 };
  }
}

// Get detailed user profile
export async function getUserProfile(
  username: string,
  accessToken?: string
): Promise<{
  user: GitHubUser;
  repos: GitHubRepo[];
  totalStars: number;
  skills: string[];
  contributions: number;
} | null> {
  const octokit = createOctokit(accessToken);

  try {
    const [userResponse, reposResponse] = await Promise.all([
      octokit.users.getByUsername({ username }),
      octokit.repos.listForUser({
        username,
        sort: "updated",
        per_page: 100,
      }),
    ]);

    const totalStars = reposResponse.data.reduce(
      (sum, repo) => sum + (repo.stargazers_count || 0),
      0
    );

    const skills = extractSkills(reposResponse.data as any);

    // Estimate contributions (public repos * avg commits)
    const contributions = userResponse.data.public_repos * 50;

    return {
      user: userResponse.data as GitHubUser,
      repos: reposResponse.data.slice(0, 6).map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count || 0,
        forks_count: repo.forks_count || 0,
        language: repo.language,
        topics: repo.topics || [],
      })),
      totalStars,
      skills,
      contributions,
    };
  } catch (error) {
    console.error("GitHub profile error:", error);
    return null;
  }
}

// Extract programming languages from query
function extractLanguages(queryParts: string[]): string[] {
  const knownLanguages = [
    "javascript", "typescript", "python", "rust", "go", "java",
    "ruby", "php", "c", "cpp", "csharp", "swift", "kotlin",
    "react", "vue", "angular", "node", "nodejs", "deno",
  ];

  return queryParts.filter((part) =>
    knownLanguages.includes(part.toLowerCase())
  );
}

// Extract skills from repositories
function extractSkills(repos: { language?: string | null; topics?: string[] }[]): string[] {
  const skillsMap = new Map<string, number>();

  repos.forEach((repo) => {
    if (repo.language) {
      skillsMap.set(repo.language, (skillsMap.get(repo.language) || 0) + 1);
    }
    repo.topics?.forEach((topic) => {
      skillsMap.set(topic, (skillsMap.get(topic) || 0) + 1);
    });
  });

  return Array.from(skillsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill]) => skill);
}

// Calculate match score
function calculateScore(
  user: GitHubUser,
  totalStars: number,
  query: string
): number {
  let score = 50;

  // Boost for stars
  if (totalStars > 10000) score += 20;
  else if (totalStars > 1000) score += 15;
  else if (totalStars > 100) score += 10;

  // Boost for followers
  if (user.followers > 5000) score += 15;
  else if (user.followers > 1000) score += 10;
  else if (user.followers > 100) score += 5;

  // Boost for bio containing query terms
  const queryTerms = query.toLowerCase().split(/\s+/);
  const bio = (user.bio || "").toLowerCase();
  queryTerms.forEach((term) => {
    if (bio.includes(term)) score += 5;
  });

  return Math.min(99, score);
}

import type { EvidenceLink, SkillClaim } from "@/types/skillClaims";

type GithubPR = {
  repo: string;
  repoOwner: string;
  title: string;
  state: "open" | "closed" | "merged";
  url: string;
  createdAt: string;
  mergedAt?: string;
};

type GithubContributionPattern = {
  totalContributions: number;
  averagePerWeek: number;
  longestStreak: number;
  mostActiveDay: string;
  activityLevel: "very-active" | "active" | "moderate" | "low";
};

export function evidenceTypeFromUrl(url: string): EvidenceLink["type"] {
  try {
    const u = new URL(url);
    const path = u.pathname;

    if (path.includes("/pull/")) return "pr";
    if (path.includes("/commit/")) return "commit";
    if (path.includes("/issues/")) return "issue";
    if (path.includes("/blob/")) return "file";
    return "repo";
  } catch {
    return "repo";
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeSkill(s: string): string {
  return s.trim().toLowerCase();
}

function githubCodeSearchUrl(username: string, skill: string): string {
  // GitHub code search: best-effort evidence link even when we don't have PR/commit URLs.
  const q = encodeURIComponent(`user:${username} ${skill}`);
  return `https://github.com/search?q=${q}&type=code`;
}

function matchPRsToSkill(prs: GithubPR[] | undefined, skill: string): GithubPR[] {
  if (!prs?.length) return [];
  const needle = normalizeSkill(skill);
  return prs.filter((pr) => {
    const hay = normalizeSkill(`${pr.title} ${pr.repo}`);
    return hay.includes(needle);
  });
}

function levelFromIndex(i: number): SkillClaim["level"] {
  if (i <= 2) return "strong";
  if (i <= 6) return "moderate";
  return "weak";
}

function confidenceFromEvidence(evidenceCount: number, prMatches: number, activity?: GithubContributionPattern): number {
  let base = 0.55;
  base += Math.min(0.25, evidenceCount * 0.05);
  base += Math.min(0.15, prMatches * 0.05);

  if (activity) {
    const bump =
      activity.activityLevel === "very-active"
        ? 0.1
        : activity.activityLevel === "active"
          ? 0.07
          : activity.activityLevel === "moderate"
            ? 0.04
            : 0.0;
    base += bump;
  }

  return clamp01(base);
}

export function buildSkillClaims(input: {
  username: string;
  skills: string[];
  github?: {
    prsToOthers?: GithubPR[];
    topics?: string[];
    contributionPattern?: GithubContributionPattern;
  } | null;
}): SkillClaim[] {
  const { username, skills, github } = input;

  return (skills || []).map((skill, idx) => {
    const prMatches = matchPRsToSkill(github?.prsToOthers, skill);

    const evidence: EvidenceLink[] = [
      {
        type: "repo",
        url: githubCodeSearchUrl(username, skill),
        title: `GitHub code search for “${skill}”`,
      },
      ...prMatches.slice(0, 3).map((pr) => ({
        type: "pr" as const,
        url: pr.url,
        title: `${pr.repo}: ${pr.title}`,
        date: pr.mergedAt ? new Date(pr.mergedAt) : new Date(pr.createdAt),
      })),
    ];

    const whyBits: string[] = [];
    if (prMatches.length > 0) whyBits.push(`${prMatches.length} related PR${prMatches.length === 1 ? "" : "s"}`);
    if (github?.topics?.some((t) => normalizeSkill(t) === normalizeSkill(skill))) {
      whyBits.push("appears in repo topics");
    }
    if (github?.contributionPattern?.totalContributions) {
      whyBits.push(`${github.contributionPattern.totalContributions} contributions (activity signal)`);
    }

    const why =
      whyBits.length > 0
        ? whyBits.join("; ")
        : "Demonstrated in public code artifacts (searchable repos/files).";

    const conf = confidenceFromEvidence(evidence.length, prMatches.length, github?.contributionPattern);

    return {
      skill,
      level: levelFromIndex(idx),
      evidence,
      why_it_counts: why,
      confidence: conf,
      timestamp: new Date(),
    };
  });
}

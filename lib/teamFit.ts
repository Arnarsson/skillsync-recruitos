/**
 * Team Fit Analysis
 * Analyzes culture compatibility based on work patterns, tech stack, and communication style
 */

export interface TeamFitAnalysis {
  overallFitPercentage: number;
  workPatternCompatibility: number;
  techStackOverlap: number;
  communicationStyleScore: number;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
}

export interface CandidateActivity {
  topRepos?: Array<{
    name: string;
    language?: string;
    topics?: string[];
  }>;
  followers?: number;
  createdAt?: string;
  bio?: string;
  topRepos?: any[];
}

/**
 * Analyze work pattern compatibility (async vs sync from commit patterns)
 * Returns score 0-100
 */
export function analyzeWorkPatternCompatibility(
  candidate: CandidateActivity,
  teamPattern: "async" | "sync" | "hybrid" = "hybrid"
): { score: number; pattern: string; reasoning: string } {
  // Heuristics based on activity patterns
  // A developer with many small commits might be more sync-oriented
  // A developer with fewer, larger commits might be async-oriented

  const followers = candidate.followers || 0;
  const isEstablished = followers > 500;

  let score = 50; // neutral baseline
  let pattern = "hybrid";
  let reasoning = "Unable to determine work pattern from available data";

  // If we have repo data, try to infer from activity
  if (candidate.topRepos && candidate.topRepos.length > 0) {
    // More repos might indicate open source work (potentially more async)
    const repoCount = candidate.topRepos.length;

    if (repoCount > 10) {
      pattern = "async";
      score = teamPattern === "async" ? 85 : teamPattern === "sync" ? 50 : 75;
      reasoning =
        "High repository count suggests comfort with async collaboration and open source work";
    } else if (repoCount > 5) {
      pattern = "hybrid";
      score =
        teamPattern === "hybrid"
          ? 80
          : teamPattern === "async"
            ? 65
            : teamPattern === "sync"
              ? 70
              : 75;
      reasoning =
        "Moderate repository activity suggests flexibility with both sync and async work";
    } else {
      pattern = "sync";
      score = teamPattern === "sync" ? 85 : teamPattern === "hybrid" ? 65 : 45;
      reasoning =
        "Limited public repository activity might suggest preference for synchronous collaboration";
    }

    // Adjust based on establishment level
    if (isEstablished && pattern !== "sync") {
      score = Math.min(score + 10, 100);
      reasoning += ". Established presence suggests effective collaboration experience";
    }
  }

  return { score, pattern, reasoning };
}

/**
 * Analyze tech stack overlap with team
 * Returns score 0-100
 */
export function analyzeTechStackOverlap(
  candidate: CandidateActivity,
  teamTechStack: string[] = []
): { score: number; overlap: string[]; missing: string[]; reasoning: string } {
  const candidateLanguages = new Set<string>();

  if (candidate.topRepos) {
    candidate.topRepos.forEach((repo: any) => {
      if (repo.language) {
        candidateLanguages.add(repo.language.toLowerCase());
      }
      if (repo.topics) {
        repo.topics.forEach((topic: string) => {
          candidateLanguages.add(topic.toLowerCase());
        });
      }
    });
  }

  if (candidateLanguages.size === 0) {
    return {
      score: 50,
      overlap: [],
      missing: teamTechStack,
      reasoning: "Unable to determine tech stack from available repository data",
    };
  }

  const teamTechStackLower = teamTechStack.map((t) => t.toLowerCase());
  const overlap = Array.from(candidateLanguages).filter((lang) =>
    teamTechStackLower.some(
      (team) =>
        team.includes(lang) ||
        lang.includes(team) ||
        normalizeLanguage(lang) === normalizeLanguage(team)
    )
  );
  const missing = teamTechStack.filter(
    (tech) =>
      !overlap.some((o) => normalizeLanguage(o) === normalizeLanguage(tech))
  );

  const overlapPercentage =
    teamTechStack.length > 0
      ? Math.round((overlap.length / teamTechStack.length) * 100)
      : 50;

  const score = Math.min(overlapPercentage + 20, 100); // +20 for willingness to learn

  const reasoning =
    overlap.length > 0
      ? `Strong overlap in ${overlap.join(", ")}. Candidate has experience with ${overlap.length}/${teamTechStack.length} key technologies`
      : "No direct tech stack overlap, but candidate shows strong foundation to learn your stack";

  return {
    score: Math.max(50, Math.min(100, score)), // Clamp between 50-100
    overlap,
    missing,
    reasoning,
  };
}

/**
 * Analyze communication style from bio and activity
 * Returns score 0-100
 */
export function analyzeCommunicationStyle(
  candidate: CandidateActivity
): { score: number; style: string; reasoning: string } {
  const bio = (candidate.bio || "").toLowerCase();

  let score = 60; // baseline
  let style = "standard";
  let reasoning = "Standard communication profile";

  // Check for collaborative indicators
  const collaborativeKeywords = [
    "mentor",
    "coach",
    "team",
    "community",
    "open source",
    "teaching",
    "speaker",
    "conference",
    "sharing",
    "knowledge",
  ];
  const collaborativeMatches = collaborativeKeywords.filter((keyword) =>
    bio.includes(keyword)
  ).length;

  if (collaborativeMatches >= 3) {
    style = "highly communicative";
    score = 90;
    reasoning =
      "Strong indicators of communication skills: mentoring, teaching, or community involvement";
  } else if (collaborativeMatches >= 1) {
    style = "collaborative";
    score = 75;
    reasoning =
      "Shows interest in collaboration and knowledge sharing based on bio";
  }

  // Check for technical depth indicators
  const technicalKeywords = ["architect", "expert", "senior", "lead", "principal"];
  if (technicalKeywords.some((keyword) => bio.includes(keyword))) {
    score = Math.min(score + 15, 100);
    reasoning +=
      ". Also demonstrates technical depth and likely experience with technical discussions";
  }

  return { score, style, reasoning };
}

/**
 * Calculate overall team fit
 */
export function calculateTeamFit(
  candidate: CandidateActivity,
  teamProfile: {
    workPattern?: "async" | "sync" | "hybrid";
    techStack?: string[];
  } = {}
): TeamFitAnalysis {
  const workPattern = analyzeWorkPatternCompatibility(
    candidate,
    teamProfile.workPattern || "hybrid"
  );
  const techStack = analyzeTechStackOverlap(
    candidate,
    teamProfile.techStack || []
  );
  const communication = analyzeCommunicationStyle(candidate);

  // Calculate weighted overall score
  const overallFitPercentage = Math.round(
    workPattern.score * 0.3 +
      techStack.score * 0.4 +
      communication.score * 0.3
  );

  const insights: string[] = [
    workPattern.reasoning,
    techStack.reasoning,
    communication.reasoning,
  ];

  const recommendations: string[] = [];
  const riskFactors: string[] = [];

  // Generate recommendations
  if (techStack.missing.length > 0) {
    recommendations.push(
      `Candidate would need to learn: ${techStack.missing.slice(0, 3).join(", ")}`
    );
  }

  if (workPattern.score < 60) {
    recommendations.push(
      `Consider onboarding approach for ${workPattern.pattern} working style`
    );
  }

  if (communication.score > 80) {
    recommendations.push("Strong fit for roles requiring mentorship or knowledge sharing");
  }

  // Risk factors
  if (techStack.overlap.length === 0 && techStack.score < 60) {
    riskFactors.push("No direct tech stack overlap - expect longer onboarding");
  }

  if (workPattern.score < 50) {
    riskFactors.push(
      "Potential mismatch in working style - may require adaptation period"
    );
  }

  return {
    overallFitPercentage,
    workPatternCompatibility: workPattern.score,
    techStackOverlap: techStack.score,
    communicationStyleScore: communication.score,
    insights,
    recommendations,
    riskFactors,
  };
}

/**
 * Normalize language names for comparison
 */
function normalizeLanguage(lang: string): string {
  const normalizations: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    go: "golang",
    rs: "rust",
    cpp: "c++",
    csharp: "c#",
    cs: "c#",
  };

  const lower = lang.toLowerCase().trim();
  return normalizations[lower] || lower;
}

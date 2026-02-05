/**
 * AI Interview Prep Generator
 * 
 * Generates personalized interview questions based on candidate's REAL GitHub data.
 * NO MOCK DATA - all questions derived from their actual repos, PRs, and contributions.
 */

export interface InterviewQuestion {
  question: string;
  category: "technical" | "behavioral" | "project" | "architecture" | "collaboration";
  context: string; // Why we're asking this (based on their profile)
  followUps: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface InterviewPrepKit {
  candidateName: string;
  candidateUsername: string;
  totalQuestions: number;
  questions: InterviewQuestion[];
  talkingPoints: string[];
  redFlags: string[];
  greenFlags: string[];
}

interface CandidateData {
  name: string;
  username: string;
  bio?: string;
  company?: string;
  skills: string[];
  topRepos: Array<{
    name: string;
    description?: string;
    stars: number;
    language?: string;
    topics?: string[];
  }>;
  recentPRs?: Array<{
    title: string;
    repo: string;
  }>;
  languages?: Array<{
    name: string;
    percentage: number;
  }>;
  commitPatterns?: {
    mostActiveDay?: string;
    consistency?: string;
  };
}

/**
 * Generate interview questions from REAL candidate data
 */
export function generateInterviewPrep(candidate: CandidateData): InterviewPrepKit {
  const questions: InterviewQuestion[] = [];
  const talkingPoints: string[] = [];
  const greenFlags: string[] = [];
  const redFlags: string[] = [];

  // --- TECHNICAL QUESTIONS (based on their skills/languages) ---
  
  const primaryLanguage = candidate.languages?.[0]?.name || candidate.topRepos[0]?.language;
  if (primaryLanguage) {
    questions.push({
      question: `You've done extensive work in ${primaryLanguage}. What's a ${primaryLanguage}-specific pattern or idiom you've come to appreciate over time?`,
      category: "technical",
      context: `${candidate.languages?.[0]?.percentage || 0}% of their repos use ${primaryLanguage}`,
      followUps: [
        `How does ${primaryLanguage} compare to other languages you've used for similar problems?`,
        `What's the biggest ${primaryLanguage} footgun you've encountered?`,
      ],
      difficulty: "medium",
    });
  }

  // --- PROJECT DEEP-DIVES (based on their top repos) ---
  
  if (candidate.topRepos[0]) {
    const topRepo = candidate.topRepos[0];
    questions.push({
      question: `Tell me about ${topRepo.name}. What problem were you solving, and what were the key architectural decisions?`,
      category: "project",
      context: `Their most starred project (${topRepo.stars.toLocaleString()}⭐): "${topRepo.description || 'No description'}"`,
      followUps: [
        "What would you do differently if you started over today?",
        "What's the most interesting technical challenge you faced?",
        "How do you handle contributions from others?",
      ],
      difficulty: "medium",
    });

    talkingPoints.push(`🔥 Their top project ${topRepo.name} has ${topRepo.stars.toLocaleString()} stars — a good conversation anchor`);
    greenFlags.push(`Created a project with ${topRepo.stars.toLocaleString()}+ stars — shows ability to build impactful software`);
  }

  // Question about a second repo for comparison
  if (candidate.topRepos[1]) {
    const repo2 = candidate.topRepos[1];
    questions.push({
      question: `How does ${repo2.name} differ from ${candidate.topRepos[0]?.name} in terms of architecture and approach?`,
      category: "architecture",
      context: `Comparing their top two projects to understand range`,
      followUps: [
        "Do you have a preferred architecture pattern across projects?",
      ],
      difficulty: "hard",
    });
  }

  // --- COLLABORATION QUESTIONS (based on PRs) ---
  
  if (candidate.recentPRs && candidate.recentPRs.length > 0) {
    const recentPR = candidate.recentPRs[0];
    questions.push({
      question: `I see you contributed to ${recentPR.repo}. What was the context of "${recentPR.title}"?`,
      category: "collaboration",
      context: `Recent open source contribution to external project`,
      followUps: [
        "How did you approach getting your PR accepted?",
        "Did you have any back-and-forth with maintainers?",
      ],
      difficulty: "easy",
    });

    greenFlags.push(`Active open source contributor — recently submitted PR to ${recentPR.repo}`);
  }

  // --- BEHAVIORAL QUESTIONS (based on patterns) ---
  
  questions.push({
    question: "When you're starting a new project, what's your process for making architectural decisions?",
    category: "behavioral",
    context: `They have ${candidate.topRepos.length} public projects — understanding their decision-making`,
    followUps: [
      "How do you balance 'move fast' vs 'do it right'?",
      "Give me an example of a decision you later regretted.",
    ],
    difficulty: "medium",
  });

  // Based on commit patterns
  if (candidate.commitPatterns?.consistency === "high") {
    greenFlags.push("High commit consistency — disciplined and reliable contributor");
    questions.push({
      question: "You seem to have a very consistent commit pattern. How do you maintain that discipline?",
      category: "behavioral",
      context: "Their GitHub shows high commit consistency",
      followUps: [
        "How do you handle days when you're blocked or unmotivated?",
      ],
      difficulty: "easy",
    });
  }

  // --- SKILL-SPECIFIC QUESTIONS ---
  
  const skills = candidate.skills || [];
  
  if (skills.some(s => /react|vue|angular|frontend/i.test(s))) {
    questions.push({
      question: "What's your approach to state management in frontend applications?",
      category: "technical",
      context: `Profile indicates frontend experience: ${skills.filter(s => /react|vue|angular|frontend/i.test(s)).join(", ")}`,
      followUps: [
        "When would you choose local state vs global state?",
        "How do you handle complex async flows?",
      ],
      difficulty: "medium",
    });
  }

  if (skills.some(s => /kubernetes|docker|devops|infrastructure/i.test(s))) {
    questions.push({
      question: "Describe your ideal CI/CD pipeline. What would it look like?",
      category: "technical",
      context: `DevOps/Infrastructure experience: ${skills.filter(s => /kubernetes|docker|devops|infra/i.test(s)).join(", ")}`,
      followUps: [
        "How do you handle rollbacks?",
        "What's your approach to infrastructure as code?",
      ],
      difficulty: "medium",
    });
  }

  if (skills.some(s => /machine learning|ml|ai|tensorflow|pytorch/i.test(s))) {
    questions.push({
      question: "Walk me through how you'd approach a new ML problem from data exploration to deployment.",
      category: "technical",
      context: `ML/AI experience detected in their profile`,
      followUps: [
        "How do you handle model monitoring in production?",
        "What's your experience with MLOps?",
      ],
      difficulty: "hard",
    });
  }

  // --- POTENTIAL RED FLAGS ---
  
  if (candidate.topRepos.length > 0 && candidate.topRepos.every(r => r.stars < 10)) {
    redFlags.push("No repos with significant traction — may need to dig into impact at previous roles");
  }

  if (!candidate.recentPRs || candidate.recentPRs.length === 0) {
    redFlags.push("No visible open source contributions — verify collaboration skills through other means");
  }

  // --- GENERAL TALKING POINTS ---
  
  if (candidate.company) {
    talkingPoints.push(`💼 Currently at ${candidate.company} — ask about their experience there`);
  }

  if (candidate.bio) {
    talkingPoints.push(`📝 Bio mentions: "${candidate.bio.slice(0, 100)}${candidate.bio.length > 100 ? '...' : ''}"`);
  }

  const topTopics = [...new Set(candidate.topRepos.flatMap(r => r.topics || []))].slice(0, 5);
  if (topTopics.length > 0) {
    talkingPoints.push(`🏷️ Common topics: ${topTopics.join(", ")}`);
  }

  return {
    candidateName: candidate.name,
    candidateUsername: candidate.username,
    totalQuestions: questions.length,
    questions,
    talkingPoints,
    greenFlags,
    redFlags,
  };
}

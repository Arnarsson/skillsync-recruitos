// Psychometric Profiling Engine
// Analyzes GitHub + LinkedIn data to build personality profiles

import { LinkedInProfile } from "./brightdata";

export interface PsychometricProfile {
  archetype: CandidateArchetype;
  workStyle: WorkStyleIndicators;
  communicationStyle: CommunicationStyle;
  motivators: string[];
  stressors: string[];
  teamDynamics: TeamDynamics;
  greenFlags: string[];
  redFlags: string[];
  interviewQuestions: string[];
  outreachTips: string[];
  confidence: number; // 0-100
}

export interface CandidateArchetype {
  primary: ArchetypeType;
  secondary: ArchetypeType | null;
  description: string;
  strengths: string[];
  blindSpots: string[];
}

export type ArchetypeType =
  | "The Architect"      // Systems thinker, designs elegant solutions
  | "The Optimizer"      // Performance focused, loves efficiency
  | "The Collaborator"   // Team player, strong communicator
  | "The Pioneer"        // Early adopter, builds new things
  | "The Craftsman"      // Quality focused, attention to detail
  | "The Mentor"         // Knowledge sharer, grows others
  | "The Strategist"     // Big picture thinker, business minded
  | "The Specialist";    // Deep expertise in narrow domain

export interface WorkStyleIndicators {
  autonomy: number;        // 0-100: prefers independence vs guidance
  collaboration: number;   // 0-100: solo vs team work
  structure: number;       // 0-100: flexible vs organized
  pacePreference: "fast" | "steady" | "methodical";
  feedbackStyle: "direct" | "diplomatic" | "data-driven";
  decisionMaking: "intuitive" | "analytical" | "consensus";
}

export interface CommunicationStyle {
  formality: "casual" | "professional" | "technical";
  verbosity: "concise" | "detailed" | "contextual";
  responseTime: "quick" | "thoughtful" | "variable";
  preferredChannels: string[];
}

export interface TeamDynamics {
  idealTeamSize: "small" | "medium" | "large";
  leadershipStyle: "lead" | "collaborate" | "support";
  conflictApproach: "direct" | "mediate" | "avoid";
  mentorshipInterest: "mentor" | "mentee" | "peer" | "both";
}

export interface GitHubSignals {
  username: string;
  commitPatterns: {
    frequency: "daily" | "weekly" | "sporadic";
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
    weekendActivity: boolean;
  };
  codeStyle: {
    documentationLevel: "minimal" | "moderate" | "extensive";
    testCoverage: "none" | "some" | "comprehensive";
    refactoringFrequency: "rare" | "regular" | "obsessive";
  };
  collaboration: {
    prReviewStyle: "thorough" | "quick" | "rare";
    issueResponseTime: "fast" | "moderate" | "slow";
    openSourceContributions: number;
  };
  interests: string[];
  techStack: string[];
}

// Analyze GitHub data to extract signals
export function analyzeGitHubSignals(
  repos: any[],
  user: any
): GitHubSignals {
  const languages = new Map<string, number>();
  const topics = new Set<string>();

  repos.forEach(repo => {
    if (repo.language) {
      languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
    }
    repo.topics?.forEach((t: string) => topics.add(t));
  });

  const techStack = Array.from(languages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang]) => lang);

  // Infer patterns from available data
  const hasTests = repos.some(r =>
    r.name?.includes('test') ||
    r.description?.toLowerCase().includes('test')
  );

  const hasDocs = repos.some(r =>
    r.name?.includes('docs') ||
    r.description?.toLowerCase().includes('documentation')
  );

  const forkCount = repos.filter(r => r.fork).length;
  const originalCount = repos.length - forkCount;

  return {
    username: user.login,
    commitPatterns: {
      frequency: user.public_repos > 50 ? "daily" : user.public_repos > 20 ? "weekly" : "sporadic",
      timeOfDay: "afternoon", // Would need commit data to determine
      weekendActivity: true,  // Would need commit data to determine
    },
    codeStyle: {
      documentationLevel: hasDocs ? "extensive" : "moderate",
      testCoverage: hasTests ? "some" : "none",
      refactoringFrequency: "regular",
    },
    collaboration: {
      prReviewStyle: user.followers > 100 ? "thorough" : "quick",
      issueResponseTime: "moderate",
      openSourceContributions: originalCount,
    },
    interests: Array.from(topics).slice(0, 10),
    techStack,
  };
}

// Generate psychometric profile from combined data
export function generatePsychometricProfile(
  github: GitHubSignals,
  linkedin?: LinkedInProfile | null
): PsychometricProfile {
  // Determine archetype based on signals
  const archetype = determineArchetype(github, linkedin);

  // Analyze work style
  const workStyle = analyzeWorkStyle(github, linkedin);

  // Determine communication style
  const communicationStyle = analyzeCommunicationStyle(github, linkedin);

  // Identify motivators and stressors
  const { motivators, stressors } = identifyMotivators(archetype, workStyle);

  // Analyze team dynamics
  const teamDynamics = analyzeTeamDynamics(github, linkedin);

  // Generate flags
  const { greenFlags, redFlags } = generateFlags(github, linkedin, archetype);

  // Generate interview questions
  const interviewQuestions = generateInterviewQuestions(archetype, workStyle, redFlags);

  // Generate outreach tips
  const outreachTips = generateOutreachTips(archetype, communicationStyle, motivators);

  // Calculate confidence based on data availability
  const confidence = calculateConfidence(github, linkedin);

  return {
    archetype,
    workStyle,
    communicationStyle,
    motivators,
    stressors,
    teamDynamics,
    greenFlags,
    redFlags,
    interviewQuestions,
    outreachTips,
    confidence,
  };
}

function determineArchetype(
  github: GitHubSignals,
  linkedin?: LinkedInProfile | null
): CandidateArchetype {
  let primary: ArchetypeType = "The Craftsman";
  let secondary: ArchetypeType | null = null;

  // Analyze based on GitHub signals
  const hasSystemsWork = github.interests.some(i =>
    ["infrastructure", "devops", "kubernetes", "distributed-systems", "architecture"].includes(i.toLowerCase())
  );

  const hasPerformanceWork = github.interests.some(i =>
    ["optimization", "performance", "benchmarks", "profiling"].includes(i.toLowerCase())
  );

  const hasTeachingContent = github.interests.some(i =>
    ["tutorial", "learning", "education", "awesome", "guide"].includes(i.toLowerCase())
  );

  const isEarlyAdopter = github.techStack.some(t =>
    ["rust", "zig", "bun", "deno", "gleam"].includes(t.toLowerCase())
  );

  const hasDeepExpertise = github.techStack.length <= 3 && github.collaboration.openSourceContributions > 10;

  if (hasSystemsWork) {
    primary = "The Architect";
    secondary = hasPerformanceWork ? "The Optimizer" : null;
  } else if (hasPerformanceWork) {
    primary = "The Optimizer";
  } else if (hasTeachingContent) {
    primary = "The Mentor";
    secondary = "The Collaborator";
  } else if (isEarlyAdopter) {
    primary = "The Pioneer";
  } else if (hasDeepExpertise) {
    primary = "The Specialist";
  } else if (github.collaboration.openSourceContributions > 20) {
    primary = "The Collaborator";
  }

  // Enhance with LinkedIn data if available
  if (linkedin) {
    const headline = linkedin.headline.toLowerCase();
    if (headline.includes("lead") || headline.includes("manager") || headline.includes("director")) {
      secondary = secondary || "The Strategist";
    }
    if (headline.includes("architect") || headline.includes("principal")) {
      primary = "The Architect";
    }
  }

  const archetypeDetails: Record<ArchetypeType, { description: string; strengths: string[]; blindSpots: string[] }> = {
    "The Architect": {
      description: "Systems thinker who designs elegant, scalable solutions. Sees the big picture and connects complex pieces.",
      strengths: ["System design", "Long-term thinking", "Technical leadership", "Pattern recognition"],
      blindSpots: ["May over-engineer", "Can be slow to ship", "Sometimes dismissive of simple solutions"],
    },
    "The Optimizer": {
      description: "Performance-obsessed engineer who loves making things faster and more efficient.",
      strengths: ["Performance tuning", "Resource optimization", "Benchmarking", "Deep technical skills"],
      blindSpots: ["Premature optimization", "May neglect features for performance", "Can be perfectionist"],
    },
    "The Collaborator": {
      description: "Natural team player who excels at bringing people together and building consensus.",
      strengths: ["Team communication", "Code reviews", "Knowledge sharing", "Cross-team collaboration"],
      blindSpots: ["May avoid conflict", "Can be slow to make solo decisions", "Sometimes over-collaborative"],
    },
    "The Pioneer": {
      description: "Early adopter who loves exploring new technologies and pushing boundaries.",
      strengths: ["Innovation", "Adaptability", "Technical curiosity", "Risk tolerance"],
      blindSpots: ["Shiny object syndrome", "May introduce unproven tech", "Can get bored with maintenance"],
    },
    "The Craftsman": {
      description: "Quality-focused developer who takes pride in well-written, maintainable code.",
      strengths: ["Code quality", "Attention to detail", "Best practices", "Technical debt management"],
      blindSpots: ["May be slow to deliver", "Can be rigid about standards", "Sometimes over-polishes"],
    },
    "The Mentor": {
      description: "Knowledge sharer who loves growing others and building team capabilities.",
      strengths: ["Teaching", "Documentation", "Onboarding", "Team growth"],
      blindSpots: ["May under-prioritize own work", "Can be too hands-on with juniors", "Sometimes lectures"],
    },
    "The Strategist": {
      description: "Business-minded engineer who connects technical decisions to business outcomes.",
      strengths: ["Business acumen", "Prioritization", "Stakeholder management", "ROI thinking"],
      blindSpots: ["May over-index on metrics", "Can deprioritize technical excellence", "Sometimes too political"],
    },
    "The Specialist": {
      description: "Deep expert in a specific domain who provides unmatched expertise in their area.",
      strengths: ["Deep expertise", "Problem solving in domain", "Technical authority", "Focused execution"],
      blindSpots: ["Limited breadth", "May resist work outside specialty", "Can be siloed"],
    },
  };

  return {
    primary,
    secondary,
    ...archetypeDetails[primary],
  };
}

function analyzeWorkStyle(
  github: GitHubSignals,
  linkedin?: LinkedInProfile | null
): WorkStyleIndicators {
  // Infer from available data
  const autonomy = github.collaboration.openSourceContributions > 10 ? 80 : 60;
  const collaboration = github.collaboration.prReviewStyle === "thorough" ? 75 : 50;
  const structure = github.codeStyle.documentationLevel === "extensive" ? 80 : 50;

  let pacePreference: "fast" | "steady" | "methodical" = "steady";
  if (github.commitPatterns.frequency === "daily") pacePreference = "fast";
  if (github.codeStyle.testCoverage === "comprehensive") pacePreference = "methodical";

  return {
    autonomy,
    collaboration,
    structure,
    pacePreference,
    feedbackStyle: github.codeStyle.documentationLevel === "extensive" ? "data-driven" : "direct",
    decisionMaking: github.collaboration.prReviewStyle === "thorough" ? "analytical" : "intuitive",
  };
}

function analyzeCommunicationStyle(
  github: GitHubSignals,
  linkedin?: LinkedInProfile | null
): CommunicationStyle {
  const hasBlogs = github.interests.some(i => i.includes("blog"));

  return {
    formality: linkedin ? "professional" : "technical",
    verbosity: github.codeStyle.documentationLevel === "extensive" ? "detailed" : "concise",
    responseTime: github.collaboration.issueResponseTime === "fast" ? "quick" : "thoughtful",
    preferredChannels: ["GitHub", "Email", linkedin ? "LinkedIn" : "Twitter"].filter(Boolean),
  };
}

function identifyMotivators(
  archetype: CandidateArchetype,
  workStyle: WorkStyleIndicators
): { motivators: string[]; stressors: string[] } {
  const motivatorMap: Record<ArchetypeType, string[]> = {
    "The Architect": ["Complex problems", "Greenfield projects", "Technical influence", "System ownership"],
    "The Optimizer": ["Performance challenges", "Measurable impact", "Technical depth", "Optimization problems"],
    "The Collaborator": ["Team success", "Mentorship opportunities", "Cross-functional work", "Inclusive culture"],
    "The Pioneer": ["New technologies", "Innovation time", "Experimentation", "Cutting-edge projects"],
    "The Craftsman": ["Code quality culture", "Time for polish", "Best practices", "Meaningful work"],
    "The Mentor": ["Growing others", "Knowledge sharing", "Teaching opportunities", "Team building"],
    "The Strategist": ["Business impact", "Leadership path", "Strategic decisions", "Visible projects"],
    "The Specialist": ["Deep work", "Domain challenges", "Expert recognition", "Focused scope"],
  };

  const stressorMap: Record<ArchetypeType, string[]> = {
    "The Architect": ["Rushed decisions", "No ownership", "Fragmented work", "Technical debt ignored"],
    "The Optimizer": ["No metrics", "Arbitrary deadlines", "Ignored improvements", "Sloppy code"],
    "The Collaborator": ["Siloed teams", "Conflict avoidance", "No feedback culture", "Solo work"],
    "The Pioneer": ["Legacy systems only", "No learning time", "Risk-averse culture", "Stagnant tech"],
    "The Craftsman": ["Constant rushing", "No code review", "Technical debt", "Throwaway code"],
    "The Mentor": ["No junior devs", "No time for teaching", "Knowledge hoarding", "Competitive culture"],
    "The Strategist": ["No business context", "Pure execution role", "No influence", "Unclear impact"],
    "The Specialist": ["Forced generalization", "Context switching", "Surface-level work", "No depth"],
  };

  return {
    motivators: motivatorMap[archetype.primary],
    stressors: stressorMap[archetype.primary],
  };
}

function analyzeTeamDynamics(
  github: GitHubSignals,
  linkedin?: LinkedInProfile | null
): TeamDynamics {
  const isLeader = linkedin?.headline.toLowerCase().includes("lead") ||
                   linkedin?.headline.toLowerCase().includes("senior") ||
                   github.collaboration.openSourceContributions > 30;

  return {
    idealTeamSize: github.collaboration.prReviewStyle === "thorough" ? "small" : "medium",
    leadershipStyle: isLeader ? "lead" : "collaborate",
    conflictApproach: github.collaboration.prReviewStyle === "thorough" ? "direct" : "mediate",
    mentorshipInterest: github.codeStyle.documentationLevel === "extensive" ? "mentor" : "peer",
  };
}

function generateFlags(
  github: GitHubSignals,
  linkedin: LinkedInProfile | null | undefined,
  archetype: CandidateArchetype
): { greenFlags: string[]; redFlags: string[] } {
  const greenFlags: string[] = [];
  const redFlags: string[] = [];

  // GitHub-based flags
  if (github.collaboration.openSourceContributions > 20) {
    greenFlags.push("Strong open source contributor");
  }
  if (github.codeStyle.documentationLevel === "extensive") {
    greenFlags.push("Values documentation");
  }
  if (github.codeStyle.testCoverage !== "none") {
    greenFlags.push("Writes tests");
  }
  if (github.techStack.length >= 5) {
    greenFlags.push("Diverse technical skills");
  }

  // LinkedIn-based flags
  if (linkedin) {
    if (linkedin.recommendations.length >= 3) {
      greenFlags.push(`${linkedin.recommendations.length} LinkedIn recommendations`);
    }
    if (linkedin.connectionCount > 500) {
      greenFlags.push("Strong professional network");
    }
    const avgTenure = calculateAverageTenure(linkedin.experience);
    if (avgTenure >= 2) {
      greenFlags.push(`Good tenure stability (${avgTenure.toFixed(1)}yr avg)`);
    } else if (avgTenure < 1.5 && linkedin.experience.length > 2) {
      redFlags.push(`Short tenure pattern (${avgTenure.toFixed(1)}yr avg)`);
    }
  }

  // Pattern-based red flags
  if (github.commitPatterns.frequency === "sporadic") {
    redFlags.push("Inconsistent activity patterns");
  }

  return { greenFlags, redFlags };
}

function calculateAverageTenure(experience: LinkedInProfile["experience"]): number {
  if (experience.length === 0) return 0;

  // Simple estimation - would need actual date parsing for accuracy
  const tenures = experience.map(exp => {
    if (exp.duration) {
      const years = exp.duration.match(/(\d+)\s*yr/);
      const months = exp.duration.match(/(\d+)\s*mo/);
      return (years ? parseInt(years[1]) : 0) + (months ? parseInt(months[1]) / 12 : 0);
    }
    return 2; // Default assumption
  });

  return tenures.reduce((a, b) => a + b, 0) / tenures.length;
}

function generateInterviewQuestions(
  archetype: CandidateArchetype,
  workStyle: WorkStyleIndicators,
  redFlags: string[]
): string[] {
  const questions: string[] = [];

  // Archetype-specific questions
  const archetypeQuestions: Record<ArchetypeType, string[]> = {
    "The Architect": [
      "Walk me through a system you designed from scratch. What trade-offs did you make?",
      "How do you balance immediate needs with long-term architectural vision?",
    ],
    "The Optimizer": [
      "Tell me about a performance problem you solved. How did you measure success?",
      "When is optimization not worth it?",
    ],
    "The Collaborator": [
      "How do you handle disagreements in code reviews?",
      "Describe a time you helped a struggling teammate.",
    ],
    "The Pioneer": [
      "What's a technology you introduced that didn't work out? What did you learn?",
      "How do you evaluate when to adopt new technology vs. staying with proven solutions?",
    ],
    "The Craftsman": [
      "What does 'good code' mean to you?",
      "How do you balance code quality with delivery speed?",
    ],
    "The Mentor": [
      "How have you helped junior developers grow?",
      "What's your approach to knowledge sharing?",
    ],
    "The Strategist": [
      "How do you prioritize technical work against business needs?",
      "Tell me about a technical decision you made that had significant business impact.",
    ],
    "The Specialist": [
      "What makes you the expert in your domain?",
      "How do you stay current in your specialty?",
    ],
  };

  questions.push(...archetypeQuestions[archetype.primary]);

  // Red flag probing questions
  redFlags.forEach(flag => {
    if (flag.includes("tenure")) {
      questions.push("I noticed you've had several shorter roles. What are you looking for in your next long-term position?");
    }
    if (flag.includes("inconsistent")) {
      questions.push("What does your ideal work rhythm look like?");
    }
  });

  return questions.slice(0, 5);
}

function generateOutreachTips(
  archetype: CandidateArchetype,
  communicationStyle: CommunicationStyle,
  motivators: string[]
): string[] {
  const tips: string[] = [];

  // Communication style tips
  if (communicationStyle.formality === "technical") {
    tips.push("Lead with technical challenges and interesting problems");
  } else if (communicationStyle.formality === "professional") {
    tips.push("Keep it professional but personalized");
  }

  if (communicationStyle.verbosity === "concise") {
    tips.push("Keep message short and punchy - they won't read walls of text");
  } else {
    tips.push("Provide context and details - they appreciate thoroughness");
  }

  // Motivator-based tips
  tips.push(`Emphasize: ${motivators.slice(0, 2).join(", ")}`);

  // Archetype-specific tips
  const archetypeTips: Record<ArchetypeType, string> = {
    "The Architect": "Mention greenfield projects or system design opportunities",
    "The Optimizer": "Highlight scale challenges and performance problems to solve",
    "The Collaborator": "Emphasize team culture and collaboration opportunities",
    "The Pioneer": "Lead with your tech stack and innovation initiatives",
    "The Craftsman": "Mention code quality standards and engineering culture",
    "The Mentor": "Highlight growth opportunities and team building",
    "The Strategist": "Connect the role to business impact and leadership path",
    "The Specialist": "Show you value their specific expertise",
  };

  tips.push(archetypeTips[archetype.primary]);

  return tips;
}

function calculateConfidence(
  github: GitHubSignals,
  linkedin?: LinkedInProfile | null
): number {
  let confidence = 50; // Base confidence with GitHub only

  // GitHub data quality
  if (github.collaboration.openSourceContributions > 10) confidence += 10;
  if (github.techStack.length > 3) confidence += 10;
  if (github.interests.length > 5) confidence += 5;

  // LinkedIn data availability
  if (linkedin) {
    confidence += 15;
    if (linkedin.recommendations.length > 0) confidence += 5;
    if (linkedin.experience.length > 2) confidence += 5;
  }

  return Math.min(confidence, 95);
}

/**
 * Generate AI-powered psychometric profile with personalized insights
 * Falls back to rule-based generation if AI fails
 */
export async function generateAIPsychometricProfile(
  github: GitHubSignals,
  githubUser: {
    name?: string;
    bio?: string;
    company?: string;
    location?: string;
    followers?: number;
    public_repos?: number;
  },
  linkedin?: LinkedInProfile | null
): Promise<PsychometricProfile> {
  try {
    // Dynamic import to avoid circular dependencies
    const { generatePsychometricInsights } = await import('@/lib/services/gemini');

    // Call AI for personalized insights
    const aiInsights = await generatePsychometricInsights({
      username: github.username,
      name: githubUser.name || github.username,
      bio: githubUser.bio || '',
      company: githubUser.company || '',
      location: githubUser.location || '',
      followers: githubUser.followers || 0,
      publicRepos: githubUser.public_repos || github.collaboration.openSourceContributions,
      topLanguages: github.techStack,
      repoTopics: github.interests,
      hasTests: github.codeStyle.testCoverage !== 'none',
      hasDocs: github.codeStyle.documentationLevel === 'extensive',
      contributionCount: github.collaboration.openSourceContributions,
    });

    // Map AI archetype to our type system
    const archetypeType = aiInsights.archetype.primary as ArchetypeType;

    // Build profile from AI insights
    const archetype: CandidateArchetype = {
      primary: archetypeType,
      secondary: aiInsights.archetype.secondary as ArchetypeType | null,
      description: aiInsights.archetype.description,
      strengths: aiInsights.archetype.strengths,
      blindSpots: aiInsights.archetype.blindSpots,
    };

    const workStyle: WorkStyleIndicators = aiInsights.workStyle;

    // Use AI-generated communicationStyle or fall back to rule-based
    const communicationStyle = analyzeCommunicationStyle(github, linkedin);

    // Use AI-generated team dynamics or fall back to rule-based
    const teamDynamics = analyzeTeamDynamics(github, linkedin);

    return {
      archetype,
      workStyle,
      communicationStyle,
      motivators: aiInsights.motivators,
      stressors: aiInsights.stressors,
      teamDynamics,
      greenFlags: aiInsights.greenFlags,
      redFlags: aiInsights.redFlags,
      interviewQuestions: aiInsights.interviewQuestions,
      outreachTips: aiInsights.outreachTips,
      confidence: aiInsights.confidence,
    };
  } catch (error) {
    console.error('[Psychometrics] AI generation failed, falling back to rules:', error);
    // Fall back to rule-based generation
    return generatePsychometricProfile(github, linkedin);
  }
}

export default {
  analyzeGitHubSignals,
  generatePsychometricProfile,
  generateAIPsychometricProfile,
};

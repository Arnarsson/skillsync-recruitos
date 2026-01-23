// AI Service - Uses OpenRouter with Google Gemini model
// OpenRouter provides access to Gemini via OpenAI-compatible API

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001"; // Paid tier - no rate limits

// Types
export interface Persona {
  archetype: string;
  psychometric: {
    communicationStyle: string;
    primaryMotivator: string;
    riskTolerance: string;
    leadershipPotential: string;
  };
  softSkills: string[];
  redFlags: string[];
  greenFlags: string[];
  reasoning: string;
  careerTrajectory?: {
    growthVelocity: 'rapid' | 'steady' | 'slow';
    promotionFrequency: 'high' | 'moderate' | 'low';
    roleProgression: 'vertical' | 'lateral' | 'mixed';
    industryPivots: number;
    leadershipGrowth: 'ascending' | 'stable' | 'declining';
    averageTenure: string;
    tenurePattern: 'stable' | 'job-hopper' | 'long-term';
  };
  skillProfile?: {
    coreSkills: Array<{ name: string; proficiency: string; yearsActive: number }>;
    emergingSkills: string[];
    deprecatedSkills: string[];
    skillGaps: string[];
    adjacentSkills: string[];
    depthVsBreadth: 'specialist' | 'generalist' | 't-shaped';
  };
  riskAssessment?: {
    attritionRisk: 'low' | 'moderate' | 'high';
    flightRiskFactors: string[];
    skillObsolescenceRisk: 'low' | 'moderate' | 'high';
    geographicBarriers: string[];
    unexplainedGaps: boolean;
    compensationRiskLevel: 'low' | 'moderate' | 'high';
  };
}

export interface EvidenceItem {
  claim: string;
  source: 'github_profile' | 'repositories' | 'contributions' | 'bio' | 'inferred' | 'location_data';
  sourceDetail?: string; // e.g., "Based on 15+ React repositories"
}

export interface CandidateAnalysis {
  name: string;
  currentRole: string;
  company: string;
  location: string;
  yearsExperience: number;
  alignmentScore: number;
  shortlistSummary: string;
  keyEvidence: string[];
  keyEvidenceWithSources?: EvidenceItem[];
  risks: string[];
  risksWithSources?: EvidenceItem[];
  scoreBreakdown: {
    skills: { value: number; max: number; percentage: number };
    experience: { value: number; max: number; percentage: number };
    industry: { value: number; max: number; percentage: number };
    seniority: { value: number; max: number; percentage: number };
    location: { value: number; max: number; percentage: number };
  };
  scoreConfidence: 'high' | 'moderate' | 'low';
  scoreDrivers: string[];
  scoreDrags: string[];
}

export interface DeepProfile {
  indicators: Array<{
    name: string;
    value: number;
    interpretation: string;
    icon: string;
  }>;
  questions: Array<{
    question: string;
    context: string;
    expectedAnswer: string;
    category: 'Technical' | 'Soft Skills' | 'Behavioral';
  }>;
  deepAnalysis: string;
  cultureFit: string;
  companyMatch: {
    score: number;
    reasons: string[];
    risks: string[];
  };
}

// Get API key - ONLY OpenRouter
function getApiKey(): string | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (key) {
    console.log(`[AI] API Key loaded: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`);
  } else {
    console.error("[AI] OPENROUTER_API_KEY is NOT set in environment!");
  }
  return key || null;
}

// Call OpenRouter API
async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured - add it to Vercel environment variables");
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  console.log(`[AI] Calling OpenRouter with model: ${MODEL}`);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://skillsync.app",
        "X-Title": "SkillSync Recruiting"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI] OpenRouter Error ${response.status}:`, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (!content) {
      throw new Error("AI returned empty response");
    }

    console.log(`[AI] Response received (${content.length} chars)`);
    return content;
  } catch (error) {
    console.error("[AI] callOpenRouter failed:", error);
    throw error;
  }
}

// Parse JSON safely from AI response
function parseJsonSafe(text: string): unknown {
  let jsonString = text.trim();

  // Strip markdown code blocks
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    const startIndex = jsonString.indexOf('{');
    const endIndex = jsonString.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonString = jsonString.substring(startIndex, endIndex + 1);
    }
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    // Try fixing common issues
    const fixed = jsonString
      .replace(/(?<!\\)\n/g, '\\n')
      .replace(/\r/g, '');
    return JSON.parse(fixed);
  }
}

// Calculate score from breakdown
function calculateScore(breakdown: CandidateAnalysis['scoreBreakdown']): number {
  if (!breakdown) return 0;
  const totalMax = breakdown.skills.max + breakdown.experience.max +
    breakdown.industry.max + breakdown.seniority.max + breakdown.location.max;
  const totalValue = breakdown.skills.value + breakdown.experience.value +
    breakdown.industry.value + breakdown.seniority.value + breakdown.location.value;
  if (totalMax === 0) return 0;
  return Math.round((totalValue / totalMax) * 100);
}

// Generate Persona from raw profile text
export async function generatePersona(rawProfileText: string): Promise<Persona> {
  const systemPrompt = `You are an expert Executive Recruiter preparing a candidate briefing. Always respond with valid JSON only, no markdown or explanations.`;

  const prompt = `
Analyze this candidate and return JSON with:
{
  "persona_archetype": "string (2-sentence elevator pitch)",
  "psychometric_profile": {
    "communication_style": "string",
    "primary_motivator": "string",
    "risk_tolerance": "string",
    "leadership_potential": "string"
  },
  "soft_skills_analysis": ["string"],
  "red_flags": ["string"],
  "green_flags": ["string"],
  "reasoning_evidence": "string",
  "career_trajectory": {
    "growth_velocity": "rapid|steady|slow",
    "promotion_frequency": "high|moderate|low",
    "role_progression": "vertical|lateral|mixed",
    "industry_pivots": number,
    "leadership_growth": "ascending|stable|declining",
    "average_tenure": "string",
    "tenure_pattern": "stable|job-hopper|long-term"
  },
  "skill_profile": {
    "core_skills": [{"name": "string", "proficiency": "expert|advanced|intermediate", "years_active": number}],
    "emerging_skills": ["string"],
    "deprecated_skills": ["string"],
    "skill_gaps": ["string"],
    "adjacent_skills": ["string"],
    "depth_vs_breadth": "specialist|generalist|t-shaped"
  },
  "risk_assessment": {
    "attrition_risk": "low|moderate|high",
    "flight_risk_factors": ["string"],
    "skill_obsolescence_risk": "low|moderate|high",
    "geographic_barriers": ["string"],
    "unexplained_gaps": boolean,
    "compensation_risk_level": "low|moderate|high"
  }
}

Raw Candidate Data:
"${rawProfileText.substring(0, 30000)}"

Return ONLY valid JSON.`;

  const text = await callOpenRouter(prompt, systemPrompt);
  const data = parseJsonSafe(text) as Record<string, unknown>;

  return {
    archetype: data.persona_archetype as string || '',
    psychometric: {
      communicationStyle: (data.psychometric_profile as Record<string, string>)?.communication_style || "Unknown",
      primaryMotivator: (data.psychometric_profile as Record<string, string>)?.primary_motivator || "Unknown",
      riskTolerance: (data.psychometric_profile as Record<string, string>)?.risk_tolerance || "Unknown",
      leadershipPotential: (data.psychometric_profile as Record<string, string>)?.leadership_potential || "Unknown"
    },
    softSkills: data.soft_skills_analysis as string[] || [],
    redFlags: data.red_flags as string[] || [],
    greenFlags: data.green_flags as string[] || [],
    reasoning: data.reasoning_evidence as string || "",
    careerTrajectory: data.career_trajectory as Persona['careerTrajectory'],
    skillProfile: data.skill_profile as Persona['skillProfile'],
    riskAssessment: data.risk_assessment as Persona['riskAssessment']
  };
}

// Analyze candidate profile
export async function analyzeCandidateProfile(
  resumeText: string,
  jobContext: string
): Promise<CandidateAnalysis> {
  const systemPrompt = `You are a highly analytical Recruitment AI. Always respond with valid JSON only.
IMPORTANT: For every claim you make, you MUST cite specific evidence from the provided data.
Do NOT make claims that cannot be verified from the input data.`;

  const prompt = `
Job Context: ${jobContext}

Raw Input Text: "${resumeText.substring(0, 20000)}"

Return JSON only. For each evidence item and risk, you MUST include the source of the information:
{
  "name": "string",
  "currentRole": "string",
  "company": "string",
  "location": "string",
  "yearsExperience": number,
  "shortlistSummary": "string (max 50 words)",
  "keyEvidence": ["string"],
  "keyEvidenceWithSources": [
    {
      "claim": "string (the evidence claim)",
      "source": "github_profile|repositories|contributions|bio|inferred|location_data",
      "sourceDetail": "string (specific detail, e.g. 'Based on 12 React repositories' or 'From GitHub bio')"
    }
  ],
  "risks": ["string"],
  "risksWithSources": [
    {
      "claim": "string (the risk)",
      "source": "github_profile|repositories|contributions|bio|inferred|location_data",
      "sourceDetail": "string (what led to this conclusion)"
    }
  ],
  "scoreBreakdown": {
    "skills": { "value": number, "max": 35, "percentage": number },
    "experience": { "value": number, "max": 20, "percentage": number },
    "industry": { "value": number, "max": 15, "percentage": number },
    "seniority": { "value": number, "max": 20, "percentage": number },
    "location": { "value": number, "max": 10, "percentage": number }
  },
  "scoreConfidence": "high|moderate|low",
  "scoreDrivers": ["string"],
  "scoreDrags": ["string"]
}

Source types explained:
- github_profile: From profile fields (name, bio, location, company)
- repositories: From their public repos (languages, topics, stars)
- contributions: From commit history and contribution patterns
- bio: From their bio/about text
- inferred: Logical inference from available data
- location_data: From location field`;

  const text = await callOpenRouter(prompt, systemPrompt);
  const data = parseJsonSafe(text) as CandidateAnalysis;

  return {
    ...data,
    alignmentScore: calculateScore(data.scoreBreakdown)
  };
}

// Generate deep profile analysis
export async function generateDeepProfile(
  candidate: CandidateAnalysis,
  jobContext: string
): Promise<DeepProfile> {
  const systemPrompt = `You are a senior talent analyst. Always respond with valid JSON only.`;

  const prompt = `
Analyze this candidate for the following Job Context:
Job Context: ${jobContext}
Candidate: ${JSON.stringify(candidate)}

Return JSON only:
{
  "indicators": [{ "name": "string", "value": number, "interpretation": "string", "icon": "string" }],
  "questions": [{ "question": "string", "context": "string", "expectedAnswer": "string", "category": "Technical|Soft Skills|Behavioral" }],
  "deepAnalysis": "string",
  "cultureFit": "string",
  "companyMatch": { "score": number, "reasons": ["string"], "risks": ["string"] }
}`;

  const text = await callOpenRouter(prompt, systemPrompt);
  return parseJsonSafe(text) as DeepProfile;
}

// Generate outreach message
export async function generateOutreach(
  candidateName: string,
  candidateRole: string,
  company: string,
  jobContext: string,
  instructions: string
): Promise<string> {
  const prompt = `
Generate a personalized outreach message.
Candidate: ${candidateName} (${candidateRole} at ${company})
Job Context: ${jobContext}
Instructions: ${instructions}

Return ONLY the message text, no JSON.`;

  return await callOpenRouter(prompt);
}

// Network Dossier Types for Contact Strategy
export interface NetworkDossier {
  strategyContext: {
    industryPosition: string;
    companyDynamics: string;
    marketTiming: string;
    competitiveIntel: string;
  };
  networkIntelligence: {
    inferredConnections: string[];
    introductionPaths: string[];
    professionalCommunities: string[];
    thoughtLeadership: string;
  };
  culturalFit: {
    currentCultureProfile: string;
    targetCultureMatch: string;
    adaptationChallenges: string[];
    motivationalDrivers: string[];
  };
  engagementPlaybook: {
    primaryApproach: string;
    conversationStarters: string[];
    timingConsiderations: string;
    objectionHandling: Array<{ objection: string; response: string }>;
    bestContactMethod: 'linkedin' | 'email' | 'github' | 'referral';
    redFlagsToAvoid: string[];
  };
  generatedAt: string;
}

// Generate Network Dossier for strategic candidate engagement (Stage 3 only)
export async function generateNetworkDossier(
  candidate: CandidateAnalysis,
  jobContext: string
): Promise<NetworkDossier> {
  const systemPrompt = `You are a strategic recruitment intelligence analyst. You specialize in creating actionable engagement strategies for high-value candidates. Always respond with valid JSON only.`;

  const prompt = `
Generate a comprehensive Network Pathfinding Dossier for this candidate.
This is for Stage 3 (shortlisted) candidates only - used to inform outreach strategy.

Candidate Profile:
${JSON.stringify(candidate)}

Target Role / Job Context:
${jobContext}

Return JSON only:
{
  "strategyContext": {
    "industryPosition": "string (Where does their current company sit in the tech ecosystem? Startup, scale-up, enterprise?)",
    "companyDynamics": "string (Current challenges/opportunities at their company - layoffs, growth, pivots?)",
    "marketTiming": "string (Is now a good time to approach? Recent changes, tenure milestones, market conditions)",
    "competitiveIntel": "string (What competitors might also be targeting this person? What's our advantage?)"
  },
  "networkIntelligence": {
    "inferredConnections": ["string (Likely mutual connections based on company history, location, industry)"],
    "introductionPaths": ["string (Ranked pathways to reach them: warm intro > event > direct)"],
    "professionalCommunities": ["string (Communities/groups/Slacks they likely engage with based on their stack)"],
    "thoughtLeadership": "string (Do they speak at conferences, write blogs, have public presence?)"
  },
  "culturalFit": {
    "currentCultureProfile": "string (What's the work culture like at their current company?)",
    "targetCultureMatch": "string (How would they fit your company's culture based on their background?)",
    "adaptationChallenges": ["string (Potential friction points in culture transition)"],
    "motivationalDrivers": ["string (What would make them consider moving? Growth, tech stack, mission, compensation?)"]
  },
  "engagementPlaybook": {
    "primaryApproach": "string (Best angle: technical challenge, growth opportunity, mission alignment, team quality, etc.)",
    "conversationStarters": ["string (3-5 evidence-backed openers specific to this person's background)"],
    "timingConsiderations": "string (When to reach out: after recent project, before anniversary, during hiring season)",
    "objectionHandling": [
      { "objection": "I'm happy where I am", "response": "string (Strategic response)" },
      { "objection": "Company size/stage concern", "response": "string" },
      { "objection": "Location/remote concern", "response": "string" }
    ],
    "bestContactMethod": "linkedin|email|github|referral (based on their online presence)",
    "redFlagsToAvoid": ["string (Topics to skip, sensitive areas based on their profile)"]
  }
}

Be specific and actionable. Base everything on the candidate's actual profile data.`;

  const text = await callOpenRouter(prompt, systemPrompt);
  const data = parseJsonSafe(text) as NetworkDossier;

  return {
    ...data,
    generatedAt: new Date().toISOString()
  };
}

// Analyze job description (supports Danish and English)
export async function analyzeJobDescription(jobText: string): Promise<{
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  location: string;
  summary: string;
}> {
  const systemPrompt = `You are a job description analyst that extracts skills optimized for GitHub developer search.
You understand both Danish and English. Always respond with valid JSON only.

CRITICAL RULES FOR SKILLS:
1. Use ONLY standard, common technology names that developers put in their GitHub profiles
2. Prefer simple, single-word skills: "React" not "React.js development"
3. Use the most common name: "JavaScript" not "JS", "TypeScript" not "TS"
4. For frameworks, use the framework name: "Next.js", "Django", "Spring Boot"
5. For languages, use proper names: "Python", "Go", "Rust", "Java"
6. Keep skills concise - max 2 words typically
7. Avoid vague terms like "problem solving", "agile", "teamwork" - focus on tech skills`;

  const prompt = `
Extract structured information from this job description. The text may be in Danish or English.

SKILL EXTRACTION RULES:
- Return 4-8 requiredSkills (the MOST important technical skills)
- Return 3-6 preferredSkills (nice-to-have technical skills)
- Use EXACT technology names developers use on GitHub: "React", "Node.js", "PostgreSQL", "Docker"
- DO NOT use verbose descriptions like "React.js frontend development" → just "React"
- DO NOT use version numbers unless critical: "Python" not "Python 3.10"
- DO NOT include soft skills or methodologies - only technical skills

Job description:
"${jobText.substring(0, 10000)}"

Return JSON:
{
  "title": "string (job title)",
  "company": "string (company name if found, empty string if not)",
  "requiredSkills": ["React", "TypeScript", "Node.js", "PostgreSQL"],
  "preferredSkills": ["Docker", "AWS", "GraphQL"],
  "experienceLevel": "string (e.g., '3-5 years', 'Senior', 'Junior')",
  "location": "string",
  "summary": "string (2-3 sentences describing the role)"
}

GOOD skill examples: "React", "TypeScript", "Python", "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "GraphQL", "Node.js", "Go", "Rust", "Java", "Spring Boot", "Django", "FastAPI", "Next.js", "Vue.js", "Angular", "Redis", "Elasticsearch"

BAD skill examples (DO NOT USE): "Frontend development", "Backend systems", "Cloud computing", "API design principles", "Database management", "Modern JavaScript frameworks"`;

  const text = await callOpenRouter(prompt, systemPrompt);
  return parseJsonSafe(text) as {
    title: string;
    company: string;
    requiredSkills: string[];
    preferredSkills: string[];
    experienceLevel: string;
    location: string;
    summary: string;
  };
}

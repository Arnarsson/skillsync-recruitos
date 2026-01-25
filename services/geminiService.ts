 

import { GoogleGenAI } from "@google/genai";
import { Candidate, InterviewQuestion, WorkstyleIndicator, FunnelStage, Persona, CompanyMatch, NetworkDossier } from '../types';
import { AI_MODELS } from '../constants';
import { enrichCandidatePersona } from './enrichmentServiceV2';
import type { EnrichmentResult } from '../types';

// Re-export AI_MODELS for use by enrichmentService
export { AI_MODELS };

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Initialize with localStorage key if available, otherwise env
export const getAiClient = () => {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || getEnv('API_KEY') || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Get OpenRouter API key
const getOpenRouterKey = () => {
  return localStorage.getItem('OPENROUTER_API_KEY') || getEnv('OPENROUTER_API_KEY') || '';
};

interface OpenRouterOptions {
  schema?: unknown;
  max_tokens?: number;
}

// OpenRouter API wrapper (OpenAI-compatible format)
export const callOpenRouter = async (prompt: string, optionsOrSchema?: unknown | OpenRouterOptions, retries = 3): Promise<string> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  // Handle both old signature (schema only) and new options object
  let options: OpenRouterOptions = {};
  if (optionsOrSchema) {
    if (typeof optionsOrSchema === 'object' && ('schema' in optionsOrSchema || 'max_tokens' in optionsOrSchema)) {
      options = optionsOrSchema as OpenRouterOptions;
    } else {
      options = { schema: optionsOrSchema };
    }
  }

  const primaryModel = 'google/gemini-3-flash-preview';
  const secondaryModel = 'google/gemini-2.5-flash';

  const messages = [{ role: 'user', content: prompt }];
  const requestBody: Record<string, unknown> = {
    model: primaryModel,
    messages,
    temperature: 0.1, // Lower temperature for more stable extraction
    max_tokens: options.max_tokens || 4000 // Default high max tokens to prevent truncation
  };

  if (options.schema) {
    requestBody.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'response',
        strict: true,
        schema: options.schema
      }
    };
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
          'X-Title': '6Degrees Recruitment OS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[OpenRouter] 429 Rate Limit (Attempt ${i + 1}/${retries}), retrying in ${Math.round(delay)}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        // If primary model fails (e.g. 404 or specific error), try secondary model
        if (requestBody.model === primaryModel && (response.status >= 400 && response.status !== 429)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[OpenRouter] Primary model ${primaryModel} failed (${response.status}), falling back to ${secondaryModel}...`);
          }
          requestBody.model = secondaryModel;
          i--; // Don't count this as a retry attempt for the secondary model
          continue;
        }

        const error = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('OpenRouter call failed after maximum retries');
};

// Retry wrapper with Gemini → OpenRouter failover
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isGeminiOverloaded = errorMessage.includes('503') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('UNAVAILABLE');
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit');

      // If Gemini is overloaded (not rate-limited), try OpenRouter immediately
      if (isGeminiOverloaded && getOpenRouterKey()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ Gemini overloaded - switching to OpenRouter...');
        }
        // Caller should handle OpenRouter fallback
        throw new Error('GEMINI_OVERLOADED');
      }

      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Gemini API error (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Unified AI call with automatic Gemini → OpenRouter failover
export const callAIWithFailover = async (
  prompt: string,
  schema?: unknown
): Promise<string> => {
  try {
    // Try Gemini first
    const ai = getAiClient();
    if (!ai) {
      throw new Error('Gemini API key not configured');
    }

    return await withRetry(async () => {
      // This will be implemented by each specific function
      throw new Error('Direct withRetry not supported - use specific AI functions');
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini failed with overload, try OpenRouter
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Falling back to OpenRouter...');
      }

      return await callOpenRouter(prompt, schema);
    }

    throw error;
  }
};

// Helper to calculate a rough score based on breakdown
const calculateScore = (breakdown: {
  skills: { value: number; max: number };
  experience: { value: number; max: number };
  industry: { value: number; max: number };
  seniority: { value: number; max: number };
  location: { value: number; max: number };
} | undefined): number => {
  if (!breakdown) return 0;
  const totalMax = breakdown.skills.max + breakdown.experience.max + breakdown.industry.max + breakdown.seniority.max + breakdown.location.max;
  const totalValue = breakdown.skills.value + breakdown.experience.value + breakdown.industry.value + breakdown.seniority.value + breakdown.location.value;
  if (totalMax === 0) return 0;
  return Math.round((totalValue / totalMax) * 100);
}

// Helper: Robust JSON extraction from AI text response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseJsonSafe = (text: string): any => {
  if (typeof text !== 'string') return text; // Safety check

  let jsonString = text.trim();

  // 1. Markdown Code Block Stripping
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    // 2. Fallback: Find first '{' and last '}'
    const startIndex = jsonString.indexOf('{');
    const endIndex = jsonString.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonString = jsonString.substring(startIndex, endIndex + 1);
    }
  }

  // Remove potential control characters that break JSON.parse
  // jsonString = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, ""); 
  // (Be careful removing newlines valid in strings, but \n is escaped usually)

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Gemini] JSON Parse Error:', error);
      console.log('[Gemini] Failed JSON length:', jsonString.length);
      console.log('[Gemini] Failed JSON start:', jsonString.substring(0, 100) + '...');
    }

    // 3. Attempt common fix: Unescaped newlines in property values
    try {
      // Replace literal newlines with \n, but try to preserve structure
      const fixed = jsonString
        .replace(/(?<!\\)\n/g, '\\n')  // Escape unescaped newlines
        .replace(/\r/g, '');           // Remove carriage returns
      return JSON.parse(fixed);
    } catch (e) {
      // 4. If strict parsing still fails, throw error
      throw new Error(`Invalid JSON output from AI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Attempts to repair invalid JSON by asking the AI to fix it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repairJson = async (brokenJson: string, error: unknown, schema?: any): Promise<any> => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Attempting to repair broken JSON via AI...');
  }
  const repairPrompt = `
    The following JSON is invalid and threw this error: "${error instanceof Error ? error.message : String(error)}".
    
    Please fix the JSON syntax failures (such as unescaped quotes, missing commas, or trailing commas) and return ONLY the valid JSON matching the original intent.
    
    BROKEN JSON:
    ${brokenJson.substring(0, 15000)}
    `;

  // Use the same schema if provided to enforce structure during repair
  const options: OpenRouterOptions = {
    max_tokens: 4000
  };

  if (schema) {
    options.schema = schema;
  } else {
    // strict object schema fallback
    options.schema = { type: "object", additionalProperties: true };
  }

  const fixedText = await callOpenRouter(repairPrompt, options);
  return parseJsonSafe(fixedText);
}


// ---------------------------------------------------------
// NEW: Persona Engine (Step 2.5)
// ---------------------------------------------------------

export const generatePersona = async (rawProfileText: string): Promise<Persona> => {
  // Use OpenRouter instead of Gemini
  const openRouterKey = getOpenRouterKey();
  if (!openRouterKey) throw new Error("OpenRouter API Key missing.");

  const systemPrompt = `
        Role: You are an expert Executive Recruiter preparing a compelling candidate briefing for a CEO making a critical hiring decision.

        Objective: Transform this raw resume into a STORY with a clear narrative arc. The CEO should read your analysis and immediately know:
        1. Who is this person? (Archetype)
        2. What's their superpower? (Core strength)
        3. What's the risk? (Red flags)
        4. Should we hire them? (Implicit recommendation)

        STORYTELLING REQUIREMENTS:
        - Write the "persona_archetype" field as a compelling 2-sentence elevator pitch that identifies the PATTERN across their career
        - Use vivid, specific language with quantified impact (e.g., "shipped Gmail Smart Compose to 100M users" not "worked on email features")
        - Frame risks as hypotheses to test, not disqualifiers (e.g., "May struggle with enterprise sales - probe Stripe Tax experience")
        - Every claim must cite specific resume data with numbers when possible

        Strict Constraints:
        - No Hallucinations: If a trait is unknown or cannot be inferred, mark as "Unknown" or use neutral values.
        - Evidence-Based: Base all inferences on specific resume/profile data points.
        - Tone: Professional, objective, and analytical with narrative clarity.

        ARCHETYPE SELECTION GUIDE (Choose the BEST match from these 12):

        1. "The Strategic Scaler 🚀" - Pattern: Joins post-PMF companies (Series B-D), builds 0→1 products, scales to 10M+ users
           Select if: Rapid promotions (every 1-2 yrs), vertical climb, multiple startups, "launched new product" language

        2. "The Hands-On Fixer 🔧" - Pattern: Dives into broken systems, refactors, optimizes, then moves on (tenure <2 yrs)
           Select if: "Improved performance X%", "refactored", "migrated", short tenures, technical focus

        3. "The Domain Expert 📚" - Pattern: Deep specialist (ML, security, payments) with 5-10+ years in same niche
           Select if: Long tenure (5+ yrs), deep technical skills, specialist language, academic background

        4. "The People Catalyst 🤝" - Pattern: Builds teams, mentors, creates high-trust cultures
           Select if: "Scaled team X to Y", "mentored", management roles, high retention mentions

        5. "The Operator Perfectionist ⚙️" - Pattern: Process-driven, loves dashboards, optimizes for efficiency
           Select if: "Built analytics stack", "improved processes", ops/systems roles, data-driven language

        6. "The Visionary Architect 🏛️" - Pattern: Designs systems for 10x scale, thinks 3-5 years ahead
           Select if: "Designed for scale", principal/architect titles, platform/infrastructure work

        7. "The Revenue Driver 💰" - Pattern: Product decisions tied to ARR, close to sales, metric-obsessed
           Select if: "Increased revenue X%", growth roles, mentions of monetization, conversion optimization

        8. "The User Champion ❤️" - Pattern: Lives in user research, ships beautiful experiences, high empathy
           Select if: Design background, "user-centric", UX research, product design, empathy language

        9. "The Rapid Executor ⚡" - Pattern: Ships daily, breaks things, iterates fast, biased to action
           Select if: Very short tenures, "shipped X features", startup DNA, move fast language

        10. "The Data Scientist 📊" - Pattern: Every decision backed by analysis, loves experiments, skeptical
            Select if: Analytics background, "A/B testing", "data-driven", quantitative focus

        11. "The Generalist Swiss Army Knife 🛠️" - Pattern: Can do anything - code, design, sell, analyze
            Select if: Diverse skill set, early-stage startups, "wore many hats", varied experiences

        12. "The Enterprise Navigator 🏢" - Pattern: Thrives in large orgs, politics-savvy, stakeholder whisperer
            Select if: Big tech (FAANG), long tenure at large companies, "cross-functional", enterprise focus

        Analysis Instructions:
        1. **Archetype**: Select from the 12 archetypes above. Write as a 2-sentence elevator pitch identifying the career PATTERN with specific examples.

        2. **Psychometric Profile**: Analyze communication style, motivations, risk tolerance, leadership potential from "About" section and role descriptions.

        3. **Career Trajectory**: Analyze job history progression:
           - Growth velocity: How quickly they advance (rapid/steady/slow)
           - Promotion frequency: How often they get promoted within companies
           - Role progression: Vertical climb, lateral moves, or mixed
           - Industry pivots: Count of major industry changes
           - Leadership growth: Ascending to larger teams, stable, or declining
           - Average tenure: Calculate typical time per role
           - Tenure pattern: Stable (3+ years), job-hopper (<2 years), or long-term (5+ years)

        4. **Skill Profile**: Deep skill analysis:
           - Core skills: Top 3-5 skills with proficiency level and years active
           - Emerging skills: Recently added or learning (last 2 years)
           - Deprecated skills: Outdated tech/methods they may still list
           - Skill gaps: Missing skills for senior/target roles
           - Adjacent skills: Transferable skills to related domains
           - Depth vs breadth: Specialist (deep in one area), Generalist (broad), or T-shaped (deep + broad)

        5. **Risk Assessment**: Identify retention/performance risks:
           - Attrition risk: Likelihood to leave soon (low/moderate/high)
           - Flight risk factors: Overqualification, boredom signals, external interests
           - Skill obsolescence risk: Using outdated tech/practices
           - Geographic barriers: Location mismatches or relocation concerns
           - Unexplained gaps: Resume gaps >6 months
           - Compensation risk: Likely above/below market expectations

        6. **Compensation Intelligence**: Market positioning analysis:
           - Implied salary band: Estimate based on role, seniority, location (min/max/currency)
           - Compensation growth rate: Aggressive jumps, steady increases, or flat
           - Equity indicators: Startup experience suggesting equity expectations
           - Likely salary expectation: Single number estimate

        7. **Soft Skills & Flags**: Traditional red/green flags for quick reference.
    `;

  const prompt = `
        ${systemPrompt}

        Raw Candidate Data:
        "${rawProfileText.substring(0, 30000)}"
    `;

  try {
    // Call OpenRouter with the prompt - it will return JSON
    const responseText = await callOpenRouter(`${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema described above. No markdown, no explanations.`);

    // Use safe parser
    const data = parseJsonSafe(responseText);

    // Map to internal Persona interface (with enhanced fields)
    return {
      archetype: data.persona_archetype,
      psychometric: {
        communicationStyle: data.psychometric_profile?.communication_style || "Unknown",
        primaryMotivator: data.psychometric_profile?.primary_motivator || "Unknown",
        riskTolerance: data.psychometric_profile?.risk_tolerance || "Unknown",
        leadershipPotential: data.psychometric_profile?.leadership_potential || "Unknown"
      },
      softSkills: data.soft_skills_analysis || [],
      redFlags: data.red_flags || [],
      greenFlags: data.green_flags || [],
      reasoning: data.reasoning_evidence || "",

      // NEW: Map enhanced persona fields
      careerTrajectory: data.career_trajectory ? {
        growthVelocity: data.career_trajectory.growth_velocity as 'rapid' | 'steady' | 'slow',
        promotionFrequency: data.career_trajectory.promotion_frequency as 'high' | 'moderate' | 'low',
        roleProgression: data.career_trajectory.role_progression as 'vertical' | 'lateral' | 'mixed',
        industryPivots: data.career_trajectory.industry_pivots || 0,
        leadershipGrowth: data.career_trajectory.leadership_growth as 'ascending' | 'stable' | 'declining',
        averageTenure: data.career_trajectory.average_tenure || "Unknown",
        tenurePattern: data.career_trajectory.tenure_pattern as 'stable' | 'job-hopper' | 'long-term'
      } : undefined,

      skillProfile: data.skill_profile ? {
        coreSkills: (data.skill_profile.core_skills || []).map((skill: { name: string; proficiency: string; years_active: number }) => ({
          name: skill.name,
          proficiency: skill.proficiency as 'expert' | 'advanced' | 'intermediate',
          yearsActive: skill.years_active || 0
        })),
        emergingSkills: data.skill_profile.emerging_skills || [],
        deprecatedSkills: data.skill_profile.deprecated_skills || [],
        skillGaps: data.skill_profile.skill_gaps || [],
        adjacentSkills: data.skill_profile.adjacent_skills || [],
        depthVsBreadth: data.skill_profile.depth_vs_breadth as 'specialist' | 'generalist' | 't-shaped'
      } : undefined,

      riskAssessment: data.risk_assessment ? {
        attritionRisk: data.risk_assessment.attrition_risk as 'low' | 'moderate' | 'high',
        flightRiskFactors: data.risk_assessment.flight_risk_factors || [],
        skillObsolescenceRisk: data.risk_assessment.skill_obsolescence_risk as 'low' | 'moderate' | 'high',
        geographicBarriers: data.risk_assessment.geographic_barriers || [],
        unexplainedGaps: data.risk_assessment.unexplained_gaps || false,
        compensationRiskLevel: data.risk_assessment.compensation_risk_level as 'low' | 'moderate' | 'high'
      } : undefined,

      compensationIntelligence: data.compensation_intelligence ? {
        impliedSalaryBand: {
          min: data.compensation_intelligence.implied_salary_band?.min || 0,
          max: data.compensation_intelligence.implied_salary_band?.max || 0,
          currency: data.compensation_intelligence.implied_salary_band?.currency || 'USD'
        },
        compensationGrowthRate: data.compensation_intelligence.compensation_growth_rate as 'aggressive' | 'steady' | 'flat',
        equityIndicators: data.compensation_intelligence.equity_indicators || false,
        likelySalaryExpectation: data.compensation_intelligence.likely_salary_expectation || 0
      } : undefined
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Persona generation: Falling back to OpenRouter...');
      }

      try {
        const promptWithInstructions = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
        const responseText = await callOpenRouter(promptWithInstructions);
        const data = JSON.parse(responseText);

        // Map to internal Persona interface (same as above)
        return {
          archetype: data.persona_archetype,
          psychometric: {
            communicationStyle: data.psychometric_profile?.communication_style || "Unknown",
            primaryMotivator: data.psychometric_profile?.primary_motivator || "Unknown",
            riskTolerance: data.psychometric_profile?.risk_tolerance || "Unknown",
            leadershipPotential: data.psychometric_profile?.leadership_potential || "Unknown"
          },
          softSkills: data.soft_skills_analysis || [],
          redFlags: data.red_flags || [],
          greenFlags: data.green_flags || [],
          reasoning: data.reasoning_evidence || "",
          careerTrajectory: data.career_trajectory,
          skillProfile: data.skill_profile,
          riskAssessment: data.risk_assessment,
          compensationIntelligence: data.compensation_intelligence
        };
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error("OpenRouter fallback failed:", openrouterError);
        }
        throw openrouterError;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error("Persona Gen Error:", error);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// ---------------------------------------------------------
// Existing Workflows
// ---------------------------------------------------------

// Step 2: Live Candidate Analysis (Standard Import)
/**
 * Extract candidate name from LinkedIn URL
 * e.g., "/in/john-smith-data-engineer/" → "John Smith"
 */
function extractNameFromLinkedInUrl(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
  if (!match) return '';

  const slug = match[1];

  // Decode URL encoding (e.g., %C3%B8 → ø)
  const decodedSlug = decodeURIComponent(slug);

  // Convert slug to name: "john-smith-data-engineer" → "John Smith"
  const nameParts = decodedSlug
    .split('-')
    .filter(part => !/^\d+$/.test(part)) // Remove pure numbers (e.g., "123abc")
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  // Take first 2-4 parts as name (rest are likely job titles or IDs)
  // Stop at common job title keywords
  const jobKeywords = ['engineer', 'developer', 'manager', 'director', 'designer', 'analyst', 'consultant', 'specialist'];
  const nameOnly = [];

  for (const part of nameParts) {
    if (jobKeywords.some(keyword => part.toLowerCase().includes(keyword))) {
      break;
    }
    nameOnly.push(part);
    if (nameOnly.length >= 4) break; // Max 4 name parts
  }

  return nameOnly.slice(0, Math.min(4, nameOnly.length)).join(' ');
}

/**
 * Convert EnrichmentResult to Candidate format
 */
function enrichmentResultToCandidate(result: EnrichmentResult, linkedinUrl: string): Candidate {
  if (result.status === 'manual_required') {
    throw new Error(result.message);
  }

  const { persona, alignment, metadata } = result;

  // Generate candidate ID
  const candidateId = `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: candidateId,
    name: persona.name,
    currentRole: persona.currentRole?.title || 'Unknown',
    company: persona.currentRole?.company || 'Unknown',
    location: persona.location || 'Unknown',
    yearsExperience: persona.pastRoles.length > 0 ? persona.pastRoles.length * 2 : 0,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name)}&background=random`,

    alignmentScore: alignment.score,
    scoreBreakdown: {
      skills: {
        value: Math.round(alignment.factors.skills * 35),
        max: 35,
        percentage: alignment.factors.skills * 100
      },
      experience: {
        value: Math.round(alignment.factors.experience * 20),
        max: 20,
        percentage: alignment.factors.experience * 100
      },
      industry: {
        value: Math.round(alignment.factors.domain * 15),
        max: 15,
        percentage: alignment.factors.domain * 100
      },
      seniority: {
        value: Math.round(alignment.factors.seniority * 20),
        max: 20,
        percentage: alignment.factors.seniority * 100
      },
      location: {
        value: Math.round(alignment.factors.location * 10),
        max: 10,
        percentage: alignment.factors.location * 100
      }
    },
    shortlistSummary: `${metadata.outcome === 'auto_full' ? 'High quality' : metadata.outcome === 'auto_partial' ? 'Partial' : 'Manual'} profile with ${metadata.evidenceSourcesUsed} evidence source(s). Confidence: ${alignment.confidence * 100}%.`,
    keyEvidence: result.rawEvidence.slice(0, 3).map(e => e.snippet || `Data from ${e.url}`),
    risks: metadata.outcome === 'auto_partial' ? ['Profile based on limited public data - verify during interview'] : [],
    unlockedSteps: [FunnelStage.INTAKE, FunnelStage.SHORTLIST],

    sourceUrl: linkedinUrl,
    scoreConfidence: alignment.confidence > 0.7 ? 'high' : alignment.confidence > 0.4 ? 'moderate' : 'low',
    scoreDrivers: Object.entries(alignment.factors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => key),
    scoreDrags: Object.entries(alignment.factors)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([key]) => key)
  };
}

export const analyzeCandidateProfile = async (resumeText: string, jobContext: string, personaData?: Persona): Promise<Candidate> => {
  // ===== NEW ENRICHMENT PIPELINE =====
  const isLinkedInUrl = resumeText.trim().startsWith('http') &&
    (resumeText.includes('linkedin.com/in/') || resumeText.includes('linkedin.com/pub/'));

  if (isLinkedInUrl) {
    try {
      const extractedName = extractNameFromLinkedInUrl(resumeText.trim());
      const result = await enrichCandidatePersona({
        fullName: extractedName || 'Unknown',
        linkedinUrl: resumeText.trim(),
        jobContext
      });
      return enrichmentResultToCandidate(result, resumeText.trim());
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('[Gemini] Enrichment error:', error);
      throw error;
    }
  }

  // ===== OPENROUTER ANALYSIS =====
  const personaContext = personaData ? `
        PRE-GENERATED PERSONA:
        Archetype: ${personaData.archetype}
        Motivations: ${personaData.psychometric.primaryMotivator}
        Risk Flags: ${personaData.redFlags.join(', ')}
    ` : '';

  const prompt = `
        You are a highly analytical Recruitment AI.
        Job Context:
        ${jobContext}
        ${personaContext}
        Raw Input Text:
        "${resumeText.substring(0, 20000)}"
        Output JSON only matching this schema:
        {
          "name": "string",
          "currentRole": "string",
          "company": "string",
          "location": "string",
          "yearsExperience": number,
          "shortlistSummary": "string",
          "keyEvidence": ["string"],
          "risks": ["string"],
          "scoreBreakdown": {
            "skills": { "value": number, "max": number, "reasoning": "string" },
            "experience": { "value": number, "max": number, "reasoning": "string" },
            "industry": { "value": number, "max": number, "reasoning": "string" },
            "seniority": { "value": number, "max": number, "reasoning": "string" },
            "location": { "value": number, "max": number, "reasoning": "string" }
          },
          "scoreConfidence": "high" | "moderate" | "low",
          "scoreDrivers": ["string"],
          "scoreDrags": ["string"]
        }

        IMPORTANT:
        1. Do NOT repeat the input text.
        2. Keep "shortlistSummary" concise (<50 words).
        3. Ensure valid JSON format.
    `;

  try {
    const aiOptions: OpenRouterOptions = {
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          currentRole: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          yearsExperience: { type: "number" },
          shortlistSummary: { type: "string" },
          keyEvidence: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          scoreBreakdown: {
            type: "object",
            properties: {
              skills: { type: "object", properties: { value: { type: "number" }, max: { type: "number" }, reasoning: { type: "string" } } },
              experience: { type: "object", properties: { value: { type: "number" }, max: { type: "number" }, reasoning: { type: "string" } } },
              industry: { type: "object", properties: { value: { type: "number" }, max: { type: "number" }, reasoning: { type: "string" } } },
              seniority: { type: "object", properties: { value: { type: "number" }, max: { type: "number" }, reasoning: { type: "string" } } },
              location: { type: "object", properties: { value: { type: "number" }, max: { type: "number" }, reasoning: { type: "string" } } }
            }
          },
          scoreConfidence: { type: "string", enum: ["high", "moderate", "low"] },
          scoreDrivers: { type: "array", items: { type: "string" } },
          scoreDrags: { type: "array", items: { type: "string" } }
        }
      },
      max_tokens: 4000
    };

    const responseText = await callOpenRouter(prompt, aiOptions);
    let data;

    try {
      data = parseJsonSafe(responseText);
    } catch (parseError) {
      // If safe parse fails, attempt to repair
      console.warn(`[AnalyzeCandidate] JSON parse failed, attempting repair...`);
      try {
        data = await repairJson(responseText, parseError, aiOptions.schema);
      } catch (repairError) {
        console.error(`[AnalyzeCandidate] Repair failed:`, repairError);
        throw parseError; // Determine if we really want to throw or fallback to partial?
      }
    }

    const calculatedScore = calculateScore(data.scoreBreakdown);
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;

    return {
      id: uuid,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Candidate')}&background=random&color=fff`,
      alignmentScore: calculatedScore,
      unlockedSteps: [FunnelStage.SHORTLIST],
      persona: personaData,
      ...data
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[OpenRouter] Scoring error:', error);
    throw new Error("AI analysis failed: " + (error instanceof Error ? error.message : String(error)));
  }
};

// Step 3: Deep Profile Generation
export const generateDeepProfile = async (candidate: Candidate, jobContext: string): Promise<{ indicators: WorkstyleIndicator[], questions: InterviewQuestion[], deepAnalysis: string, cultureFit: string, companyMatch: CompanyMatch }> => {
  const prompt = `
        Analyze this candidate for the following Job Context:
        Job Context: ${jobContext}
        Candidate: ${JSON.stringify(candidate)}

        Return JSON only with:
        {
          "indicators": [{ "name": "string", "value": number, "interpretation": "string", "icon": "string" }],
          "questions": [{ "question": "string", "context": "string", "expectedAnswer": "string", "category": "Technical" | "Soft Skills" | "Behavioral" }],
          "deepAnalysis": "string",
          "cultureFit": "string",
          "companyMatch": { "score": number, "reasons": ["string"], "risks": ["string"] }
        }
    `;

  try {
    const responseText = await callOpenRouter(prompt);
    return parseJsonSafe(responseText);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[OpenRouter] Deep Profile error:', error);
    throw new Error("Deep analysis failed.");
  }
};

// Step 4: Enhanced Outreach Generation with Strategic Intelligence
export const generateOutreach = async (candidate: Candidate, context: string, jobContext?: string): Promise<string> => {
  const prompt = `
        Generate a personalized outreach message.
        Candidate: ${candidate.name} (${candidate.currentRole} at ${candidate.company})
        Job Context: ${jobContext}
        Instructions: ${context}
        Return ONLY the message text.
    `;

  try {
    return await callOpenRouter(prompt);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[OpenRouter] Outreach error:', error);
    throw new Error("Outreach generation failed.");
  }
};

// Step 3.5: Network Pathfinding Dossier - Strategic Intelligence Layer
export const generateNetworkDossier = async (candidate: Candidate, jobContext: string): Promise<NetworkDossier> => {
  const prompt = `
        Generate a Network Pathfinding Dossier for ${candidate.name}.
        Target Role: ${jobContext}
        Candidate Data: ${JSON.stringify(candidate)}

        Return JSON matching this schema:
        {
          "strategyContext": { "industryPosition": "string", "companyDynamics": "string", "marketTiming": "string", "competitiveIntel": "string" },
          "networkIntelligence": { "inferredConnections": ["string"], "introductionPaths": ["string"], "professionalCommunities": ["string"], "thoughtLeadership": "string" },
          "culturalFit": { "currentCultureProfile": "string", "targetCultureMatch": "string", "adaptationChallenges": ["string"], "motivationalDrivers": ["string"] },
          "engagementPlaybook": { "primaryApproach": "string", "conversationStarters": ["string"], "timingConsiderations": "string", "objectionHandling": ["string"] }
        }
    `;

  try {
    const responseText = await callOpenRouter(prompt);
    const data = parseJsonSafe(responseText);

    return {
      strategyContext: data.strategyContext,
      networkIntelligence: data.networkIntelligence,
      culturalFit: data.culturalFit,
      engagementPlaybook: data.engagementPlaybook,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[OpenRouter] Dossier error:', error);
    throw new Error("Dossier generation failed.");
  }
};

// ===== SOCIAL MATRIX AI FUNCTIONS =====

/**
 * Analyze a connection path and generate insights
 */
export const analyzeConnectionPath = async (
  pathData: {
    nodes: Array<{ name: string; type: string; metadata?: Record<string, unknown> }>;
    edges: Array<{ type: string; context?: string }>;
  }
): Promise<{
  shortExplanation: string;
  detailedExplanation: string;
  outreachHook: string;
  introRequest: string;
  commonGround: string[];
}> => {
  const prompt = `
You are a professional recruiter explaining the connection path between yourself and a candidate.

CONNECTION PATH:
${JSON.stringify(pathData, null, 2)}

Generate a natural, professional explanation of this connection that could be used:
1. In an outreach message
2. To explain the relationship to the candidate
3. To request a warm introduction

Return JSON:
{
  "shortExplanation": "One sentence summary (max 15 words)",
  "detailedExplanation": "2-3 sentences with context",
  "outreachHook": "How to mention this connection in an outreach message",
  "introRequest": "Template for requesting introduction from the connector",
  "commonGround": ["List of shared interests/experiences to discuss"]
}
  `;

  try {
    const responseText = await callOpenRouter(prompt);
    return parseJsonSafe(responseText);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[OpenRouter] Path analysis error:', error);
    throw new Error("Connection path analysis failed.");
  }
};

/**
 * Explain a relationship between two people
 */
export const explainRelationship = async (
  personA: { name: string; role?: string; company?: string },
  personB: { name: string; role?: string; company?: string },
  connectionContext: string
): Promise<{
  relationshipSummary: string;
  connectionStrength: 'strong' | 'moderate' | 'weak';
  suggestedApproach: string;
  talkingPoints: string[];
}> => {
  const prompt = `
Analyze the professional relationship between these two people:

PERSON A: ${personA.name}${personA.role ? `, ${personA.role}` : ''}${personA.company ? ` at ${personA.company}` : ''}
PERSON B: ${personB.name}${personB.role ? `, ${personB.role}` : ''}${personB.company ? ` at ${personB.company}` : ''}

CONNECTION CONTEXT:
${connectionContext}

Return JSON:
{
  "relationshipSummary": "Brief description of how they're connected",
  "connectionStrength": "strong" | "moderate" | "weak",
  "suggestedApproach": "How to leverage this connection for recruitment",
  "talkingPoints": ["List of topics they could discuss based on shared experience"]
}
  `;

  try {
    const responseText = await callOpenRouter(prompt);
    return parseJsonSafe(responseText);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[OpenRouter] Relationship explanation error:', error);
    throw new Error("Relationship explanation failed.");
  }
};

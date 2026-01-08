/* eslint-disable no-console */

import { GoogleGenAI, Type } from "@google/genai";
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

// OpenRouter API wrapper (OpenAI-compatible format)
export const callOpenRouter = async (prompt: string, schema?: unknown): Promise<string> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const messages = [{ role: 'user', content: prompt }];

  const requestBody: Record<string, unknown> = {
    model: 'google/gemini-2.0-flash-exp:free', // Free Gemini model via OpenRouter
    messages
  };

  // If schema provided, add response format (OpenAI-compatible structured output)
  if (schema) {
    requestBody.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'response',
        strict: true,
        schema
      }
    };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': '6Degrees Recruitment OS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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

// ---------------------------------------------------------
// NEW: Persona Engine (Step 2.5)
// ---------------------------------------------------------

export const generatePersona = async (rawProfileText: string): Promise<Persona> => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing.");

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
    const response = await withRetry(() => ai.models.generateContent({
      model: AI_MODELS.PERSONA_GEN,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidate_name: { type: Type.STRING },
            persona_archetype: { type: Type.STRING },
            psychometric_profile: {
              type: Type.OBJECT,
              properties: {
                communication_style: { type: Type.STRING },
                primary_motivator: { type: Type.STRING },
                risk_tolerance: { type: Type.STRING },
                leadership_potential: { type: Type.STRING }
              }
            },
            soft_skills_analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
            red_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
            green_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning_evidence: { type: Type.STRING },

            // NEW: Enhanced persona fields (Sprint 2)
            career_trajectory: {
              type: Type.OBJECT,
              properties: {
                growth_velocity: { type: Type.STRING }, // "rapid" | "steady" | "slow"
                promotion_frequency: { type: Type.STRING }, // "high" | "moderate" | "low"
                role_progression: { type: Type.STRING }, // "vertical" | "lateral" | "mixed"
                industry_pivots: { type: Type.NUMBER },
                leadership_growth: { type: Type.STRING }, // "ascending" | "stable" | "declining"
                average_tenure: { type: Type.STRING }, // "2.5 years"
                tenure_pattern: { type: Type.STRING } // "stable" | "job-hopper" | "long-term"
              }
            },
            skill_profile: {
              type: Type.OBJECT,
              properties: {
                core_skills: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      proficiency: { type: Type.STRING }, // "expert" | "advanced" | "intermediate"
                      years_active: { type: Type.NUMBER }
                    }
                  }
                },
                emerging_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                deprecated_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                skill_gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                adjacent_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                depth_vs_breadth: { type: Type.STRING } // "specialist" | "generalist" | "t-shaped"
              }
            },
            risk_assessment: {
              type: Type.OBJECT,
              properties: {
                attrition_risk: { type: Type.STRING }, // "low" | "moderate" | "high"
                flight_risk_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
                skill_obsolescence_risk: { type: Type.STRING }, // "low" | "moderate" | "high"
                geographic_barriers: { type: Type.ARRAY, items: { type: Type.STRING } },
                unexplained_gaps: { type: Type.BOOLEAN },
                compensation_risk_level: { type: Type.STRING } // "low" | "moderate" | "high"
              }
            },
            compensation_intelligence: {
              type: Type.OBJECT,
              properties: {
                implied_salary_band: {
                  type: Type.OBJECT,
                  properties: {
                    min: { type: Type.NUMBER },
                    max: { type: Type.NUMBER },
                    currency: { type: Type.STRING }
                  }
                },
                compensation_growth_rate: { type: Type.STRING }, // "aggressive" | "steady" | "flat"
                equity_indicators: { type: Type.BOOLEAN },
                likely_salary_expectation: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }));

    if (!response.text) throw new Error("No response from AI");
    const data = JSON.parse(response.text);

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
  // If input looks like a LinkedIn URL, use the new enrichment pipeline with AI inference
  const isLinkedInUrl = resumeText.trim().startsWith('http') &&
                        (resumeText.includes('linkedin.com/in/') || resumeText.includes('linkedin.com/pub/'));

  if (isLinkedInUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Gemini] Detected LinkedIn URL - using enrichment pipeline with AI inference fallback');
    }

    try {
      // Extract name from LinkedIn URL for better AI inference
      const extractedName = extractNameFromLinkedInUrl(resumeText.trim());

      const result = await enrichCandidatePersona({
        fullName: extractedName || 'Unknown',
        linkedinUrl: resumeText.trim(),
        jobContext
      });

      const candidate = enrichmentResultToCandidate(result, resumeText.trim());

      if (process.env.NODE_ENV === 'development') {
        console.log('[Gemini] ✅ Enrichment pipeline succeeded');
        console.log('[Gemini] Outcome:', result.metadata.outcome);
        console.log('[Gemini] Credit charge:', result.metadata.creditCharge);
        console.log('[Gemini] Quality score:', result.metadata.qualityScore);
      }

      return candidate;

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Gemini] Enrichment pipeline error:', error);
      }
      throw error;
    }
  }

  // ===== FALLBACK TO OLD PIPELINE =====
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing.");

  // ===== DATA QUALITY GATE =====
  // Prevent scoring candidates with insufficient professional data

  // Check if this is a manual-input-required profile
  if (resumeText.includes('STATUS:** MANUAL_INPUT_REQUIRED')) {
    throw new Error(
      `❌ MANUAL INPUT REQUIRED\n\n` +
      `This profile has no public data available from LinkedIn or web sources.\n\n` +
      `**Next steps:**\n` +
      `1. Use "Quick Paste" to manually enter candidate details\n` +
      `2. Include: current role, company, 1-2 past roles, and 5-10 skills\n` +
      `3. Once added, you can generate a score\n\n` +
      `**Why this happens:**\n` +
      `• LinkedIn profile is private or restricted\n` +
      `• No alternative public sources found (GitHub, company bio, etc.)\n` +
      `• This is expected for 5-10% of profiles`
    );
  }

  // Check if this is an enriched profile (data from multiple sources)
  const isEnrichedProfile = resumeText.includes('Profile Enrichment Notice');

  const hasExperienceData = resumeText.toLowerCase().includes('experience') ||
                           resumeText.toLowerCase().includes('role') ||
                           resumeText.toLowerCase().includes('position') ||
                           resumeText.toLowerCase().includes('at ') || // "Senior Engineer at Company"
                           resumeText.toLowerCase().includes('•') || // Bullet points often indicate experience
                           /\d{4}\s*-\s*\d{4}/.test(resumeText) || // Date ranges like "2020 - 2023"
                           /\d{4}\s*-\s*present/i.test(resumeText); // "2020 - Present"

  const hasSkillsData = resumeText.toLowerCase().includes('skill') ||
                       resumeText.toLowerCase().includes('proficient') ||
                       resumeText.toLowerCase().includes('expert') ||
                       resumeText.length > 500; // Substantial content suggests skills mentioned

  const minimumDataThreshold = resumeText.length >= 200; // At least 200 chars

  // Check for BrightData minimal extraction warning (but not if enriched)
  const hasBrightDataWarning = resumeText.includes('Only basic profile information was available') && !isEnrichedProfile;

  // If profile is enriched, relax requirements (some experience OR some skills is enough)
  const meetsRequirements = isEnrichedProfile
    ? (hasExperienceData || hasSkillsData) && minimumDataThreshold
    : (hasExperienceData && hasSkillsData && minimumDataThreshold);

  if (!meetsRequirements || hasBrightDataWarning) {
    const dataQualityIssues = [];
    if (!hasExperienceData) dataQualityIssues.push('No work experience details found');
    if (!hasSkillsData) dataQualityIssues.push('No skills or technical expertise identified');
    if (!minimumDataThreshold) dataQualityIssues.push('Profile content too brief (< 200 characters)');
    if (hasBrightDataWarning) dataQualityIssues.push('BrightData extraction incomplete (privacy settings or dataset limitations)');

    throw new Error(
      `❌ INSUFFICIENT DATA QUALITY\n\n` +
      `This candidate profile cannot be scored due to missing professional details:\n\n` +
      `${dataQualityIssues.map(issue => `• ${issue}`).join('\n')}\n\n` +
      `**Why this happens:**\n` +
      `• LinkedIn privacy settings restrict public data access\n` +
      `• BrightData dataset has limited extraction capabilities\n` +
      `• Profile is genuinely sparse or incomplete\n\n` +
      `**Next steps:**\n` +
      `1. Use "Quick Paste" to manually enter candidate details from their resume/CV\n` +
      `2. Ask the candidate for their full resume document\n` +
      `3. Try a different LinkedIn URL format (e.g., add /details/experience)\n\n` +
      `We need at least work experience and skills to generate a meaningful score.`
    );
  }

  // If we already have a Persona, we inject it into the prompt to guide the score
  const personaContext = personaData ? `
        PRE-GENERATED PERSONA (Use this for "Soft Skill" and "Culture" evaluation):
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

        Task:
        1. Ignore UI noise.
        2. Extract details.
        3. Analyze alignment with Job Context strictly.
        4. Generate Score Breakdown (0-100) with REASONING for each component explaining strengths/gaps.
        5. Identify Score DRIVERS (top 2 components boosting score) and Score DRAGS (components pulling down).
        6. Assess Score CONFIDENCE based on data completeness (high/moderate/low).
        7. Write Shortlist Summary.

        Output JSON matching schema.
    `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: AI_MODELS.SCORING,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            currentRole: { type: Type.STRING },
            company: { type: Type.STRING },
            location: { type: Type.STRING },
            yearsExperience: { type: Type.NUMBER },
            shortlistSummary: { type: Type.STRING },
            keyEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            scoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                skills: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, max: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } },
                experience: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, max: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } },
                industry: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, max: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } },
                seniority: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, max: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } },
                location: { type: Type.OBJECT, properties: { value: { type: Type.NUMBER }, max: { type: Type.NUMBER }, percentage: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } },
              }
            },
            scoreConfidence: { type: Type.STRING, enum: ['high', 'moderate', 'low'] },
            scoreDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
            scoreDrags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }));

    if (!response.text) throw new Error("No response from AI");
    const data = JSON.parse(response.text);
    const calculatedScore = calculateScore(data.scoreBreakdown);

    // TEMP: Log enhanced scoring fields for verification
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Enhanced Score Analysis:');
      console.log('  → Confidence:', data.scoreConfidence);
      console.log('  → Score Drivers:', data.scoreDrivers);
      console.log('  → Score Drags:', data.scoreDrags);
      console.log('  → Has Reasoning:', !!(data.scoreBreakdown?.skills?.reasoning));
      if (data.scoreBreakdown?.skills?.reasoning) {
        console.log('  → Skills Reasoning Sample:', data.scoreBreakdown.skills.reasoning.substring(0, 100) + '...');
      }
    }

    // Generate UUID for Supabase compatibility
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;

    return {
      id: uuid,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Candidate')}&background=random&color=fff`,
      alignmentScore: calculatedScore,
      unlockedSteps: [FunnelStage.SHORTLIST],
      persona: personaData, // Attach persona if it exists
      ...data
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Scoring: Falling back to OpenRouter...');
      }

      try {
        const promptWithInstructions = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
        const responseText = await callOpenRouter(promptWithInstructions);
        const data = JSON.parse(responseText);
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
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error("OpenRouter fallback failed:", openrouterError);
        }
        throw new Error("Both Gemini and OpenRouter failed. Please try again later.");
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error("Analysis Error:", error);
    }
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      throw new Error("API rate limit reached. Please wait a moment and try again.");
    }
    throw new Error("Failed to analyze candidate. Verify API Key.");
  }
};

// Step 3: Deep Profile Generation
export const generateDeepProfile = async (candidate: Candidate, jobContext: string): Promise<{ indicators: WorkstyleIndicator[], questions: InterviewQuestion[], deepAnalysis: string, cultureFit: string, companyMatch: CompanyMatch }> => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing.");

  // If Persona exists, use it to enrich Deep Profile
  const personaContext = candidate.persona ? `
    PSYCHOMETRIC PERSONA:
    Archetype: ${candidate.persona.archetype}
    Communication: ${candidate.persona.psychometric.communicationStyle}
    Leadership: ${candidate.persona.psychometric.leadershipPotential}
    Motivator: ${candidate.persona.psychometric.primaryMotivator}
  ` : '';

  const prompt = `
    Role Context: ${jobContext}
    Candidate: ${candidate.name}, ${candidate.currentRole} at ${candidate.company}.
    Score: ${candidate.alignmentScore}

    ${personaContext}
    
    Task: Create a "Deep Profile" for internal decision support.
    
    1. Write a "Deep Analysis" summary (3-4 sentences).
    2. Write a "Culture Fit" assessment (1-2 sentences) (Legacy).
    3. Identify 3 "Workstyle Indicators". 
    4. Generate 3 Interview Questions.
    5. Perform a Detailed Company Match Analysis:
       - Compare candidate persona against implied company culture in Job Context.
       - Estimate a Match Score (0-100).
       - Write a 2-sentence analysis.
       - List key alignment strengths (e.g. "Direct communication style matches team").
       - List potential friction points (e.g. "Used to big corporate, we are a startup").
    
    Output JSON.
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: AI_MODELS.DEEP_PROFILE,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deepAnalysis: { type: Type.STRING },
            cultureFit: { type: Type.STRING },
            companyMatch: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                analysis: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                potentialFriction: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            indicators: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  label: { type: Type.STRING },
                  observation: { type: Type.STRING },
                  evidence: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      source: { type: Type.STRING },
                      confidence: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  question: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }));

    const text = response.text;
    if (text) return JSON.parse(text);
    throw new Error("Empty response");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Deep Profile: Falling back to OpenRouter...');
      }

      try {
        const promptWithInstructions = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
        const responseText = await callOpenRouter(promptWithInstructions);
        return JSON.parse(responseText);
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error("OpenRouter fallback failed:", openrouterError);
        }
        throw new Error("Both Gemini and OpenRouter failed. Please try again later.");
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error("Deep Profile Gen Error", error);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Step 4: Enhanced Outreach Generation with Strategic Intelligence
export const generateOutreach = async (candidate: Candidate, context: string, jobContext?: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing.");

  // Build comprehensive intelligence context
  const personaContext = candidate.persona ? `
**PSYCHOMETRIC PROFILE:**
- Archetype: ${candidate.persona.archetype}
- Communication Style: ${candidate.persona.psychometric?.communicationStyle || 'Unknown'}
- Primary Motivator: ${candidate.persona.psychometric?.primaryMotivator || 'Unknown'}
- Risk Tolerance: ${candidate.persona.psychometric?.riskTolerance || 'Unknown'}
- Leadership Potential: ${candidate.persona.psychometric?.leadershipPotential || 'Unknown'}
${candidate.persona.greenFlags && candidate.persona.greenFlags.length > 0 ? `- Strengths: ${candidate.persona.greenFlags.slice(0, 2).join(', ')}` : ''}
` : '';

  const deepProfileContext = candidate.deepAnalysis ? `
**DEEP PROFILE INSIGHTS:**
${candidate.deepAnalysis.substring(0, 300)}...
` : '';

  const networkDossierContext = candidate.networkDossier ? `
**STRATEGIC INTELLIGENCE:**
Primary Engagement Approach: ${candidate.networkDossier.engagementPlaybook.primaryApproach}

Conversation Starters:
${candidate.networkDossier.engagementPlaybook.conversationStarters.slice(0, 2).map((starter, i) => `${i + 1}. ${starter}`).join('\n')}

Timing Considerations: ${candidate.networkDossier.engagementPlaybook.timingConsiderations}

Cultural Fit: ${candidate.networkDossier.culturalFit.targetCultureMatch.substring(0, 200)}
` : '';

  const companyMatchContext = candidate.companyMatch ? `
**COMPANY ALIGNMENT:**
Match Score: ${candidate.companyMatch.score}/100
${candidate.companyMatch.strengths.slice(0, 2).map(s => `✓ ${s}`).join('\n')}
` : '';

  const prompt = `
You are an expert executive recruiter drafting a highly personalized outreach message to ${candidate.name}.

**CANDIDATE PROFILE:**
- Current Role: ${candidate.currentRole || 'Role Not Listed'} at ${candidate.company}
- Location: ${candidate.location}
- Alignment Score: ${candidate.alignmentScore}%
- Experience: ${candidate.yearsExperience} years

**CONNECTION CONTEXT:**
${context}

${personaContext}

${deepProfileContext}

${networkDossierContext}

${companyMatchContext}

**TARGET OPPORTUNITY:**
${jobContext ? jobContext.substring(0, 400) : 'Confidential leadership opportunity'}

**YOUR TASK:**
Draft a warm, personalized LinkedIn outreach message that:

1. **Opens with relevance** - Reference something specific from their background or recent activity that connects to the opportunity
2. **Shows you understand them** - Adapt tone to their communication style and personality
3. **Creates intrigue** - Mention 1-2 specific aspects of the role that align with their motivators
4. **Respects their time** - Keep it concise but warm (150-200 words max)
5. **Makes it easy to respond** - Clear, low-friction call to action

**CRITICAL INSTRUCTIONS:**
- DO NOT mention their alignment score or use AI-generated phrases like "I came across your profile"
- DO reference specific projects, skills, or career moves from their background
- DO adapt tone to their communication style (direct, warm, visionary, analytical, etc.)
- DO create genuine curiosity about the opportunity without overselling
- DO make it feel like you personally wrote this, not a template
- DO end with an easy yes: "Would you be open to a brief 15-minute exploratory conversation?"

Write the message now:
`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: AI_MODELS.OUTREACH,
      contents: prompt
    }));
    return response.text || "Drafting error.";
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Outreach: Falling back to OpenRouter...');
      }

      try {
        const responseText = await callOpenRouter(prompt);
        return responseText || "Drafting error.";
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error("OpenRouter fallback failed:", openrouterError);
        }
        return "Failed to generate draft. Both Gemini and OpenRouter unavailable.";
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    return "Failed to generate draft. Check API Key.";
  }
}

// Step 3.5: Network Pathfinding Dossier - Strategic Intelligence Layer
export const generateNetworkDossier = async (candidate: Candidate, jobContext: string): Promise<NetworkDossier> => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing.");

  const prompt = `
You are an executive search strategist and organizational psychologist analyzing a candidate for strategic engagement.

**Context:**
- Candidate: ${candidate.name}
- Current Role: ${candidate.currentRole} at ${candidate.company}
- Location: ${candidate.location}
- Years Experience: ${candidate.yearsExperience}
- Target Role Context: ${jobContext}
${candidate.persona ? `
- Persona Archetype: ${candidate.persona.archetype}
- Communication Style: ${candidate.persona.psychometric.communicationStyle}
- Primary Motivator: ${candidate.persona.psychometric.primaryMotivator}
` : ''}

**Task:**
Generate a comprehensive Network Pathfinding Dossier with strategic intelligence to guide engagement. This is premium analysis that justifies significant investment - provide deep, actionable insights.

**Output 4 Strategic Sections:**

1. **STRATEGIC CONTEXT** - Industry & Market Positioning
   - Where does ${candidate.company} sit in the ${candidate.location} tech/business ecosystem?
   - What are the current challenges, opportunities, or changes at ${candidate.company}?
   - Market timing: Is now a good time to approach this candidate? (funding rounds, layoffs, acquisitions, etc.)
   - Competitive intelligence: What alternatives might they be considering?

2. **NETWORK INTELLIGENCE** - Connection Pathways (Inferential)
   - Inferred mutual connections based on ${candidate.location}, industry, and company size
   - Ranked introduction pathways (warm intro via investor, board member, former colleague, etc.)
   - Professional communities they likely engage with (conferences, Slack groups, meetups)
   - Thought leadership presence (speaking, writing, open source contributions)

3. **CULTURAL FIT** - Deep Dive Analysis
   - Current culture profile: What's it like working at ${candidate.company}? (pace, structure, values)
   - Target culture match: How does the target company culture align or differ?
   - Adaptation challenges: What friction points might arise in transition?
   - Motivational drivers: What would make them seriously consider moving? (not just compensation)

4. **ENGAGEMENT PLAYBOOK** - Tactical Execution
   - Primary approach vector: Best angle to lead with (technical challenge, growth opportunity, mission alignment, team quality, impact scale)
   - Conversation starters: 3-5 evidence-backed openers that reference their work/interests
   - Timing considerations: When to reach out (based on tenure, recent company changes, industry events)
   - Objection handling: 3-4 likely objections with strategic responses

**Critical Guidelines:**
- Be specific and actionable, not generic advice
- Ground insights in real industry knowledge about ${candidate.company} and competitors
- Focus on strategic value - this analysis costs $150, justify it
- Use the persona data to personalize the engagement strategy
- Avoid hallucinating specific people or connections - use "likely" and "potential" language
`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: AI_MODELS.DEEP_PROFILE,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategyContext: {
              type: Type.OBJECT,
              properties: {
                industryPosition: { type: Type.STRING },
                companyDynamics: { type: Type.STRING },
                marketTiming: { type: Type.STRING },
                competitiveIntel: { type: Type.STRING }
              },
              required: ['industryPosition', 'companyDynamics', 'marketTiming', 'competitiveIntel']
            },
            networkIntelligence: {
              type: Type.OBJECT,
              properties: {
                inferredConnections: { type: Type.ARRAY, items: { type: Type.STRING } },
                introductionPaths: { type: Type.ARRAY, items: { type: Type.STRING } },
                professionalCommunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                thoughtLeadership: { type: Type.STRING }
              },
              required: ['inferredConnections', 'introductionPaths', 'professionalCommunities', 'thoughtLeadership']
            },
            culturalFit: {
              type: Type.OBJECT,
              properties: {
                currentCultureProfile: { type: Type.STRING },
                targetCultureMatch: { type: Type.STRING },
                adaptationChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
                motivationalDrivers: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['currentCultureProfile', 'targetCultureMatch', 'adaptationChallenges', 'motivationalDrivers']
            },
            engagementPlaybook: {
              type: Type.OBJECT,
              properties: {
                primaryApproach: { type: Type.STRING },
                conversationStarters: { type: Type.ARRAY, items: { type: Type.STRING } },
                timingConsiderations: { type: Type.STRING },
                objectionHandling: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      objection: { type: Type.STRING },
                      response: { type: Type.STRING }
                    },
                    required: ['objection', 'response']
                  }
                }
              },
              required: ['primaryApproach', 'conversationStarters', 'timingConsiderations', 'objectionHandling']
            }
          },
          required: ['strategyContext', 'networkIntelligence', 'culturalFit', 'engagementPlaybook']
        }
      }
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response from Network Dossier generation");
    const data = JSON.parse(text);

    return {
      strategyContext: data.strategyContext,
      networkIntelligence: data.networkIntelligence,
      culturalFit: data.culturalFit,
      engagementPlaybook: data.engagementPlaybook,
      generatedAt: new Date().toISOString()
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Network Dossier: Falling back to OpenRouter...');
      }

      try {
        const promptWithInstructions = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
        const responseText = await callOpenRouter(promptWithInstructions);
        const data = JSON.parse(responseText);

        return {
          strategyContext: data.strategyContext,
          networkIntelligence: data.networkIntelligence,
          culturalFit: data.culturalFit,
          engagementPlaybook: data.engagementPlaybook,
          generatedAt: new Date().toISOString()
        };
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error("OpenRouter fallback failed:", openrouterError);
        }
        throw new Error("Both Gemini and OpenRouter failed. Please try again later.");
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error("Network Dossier Generation Error:", error);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
};

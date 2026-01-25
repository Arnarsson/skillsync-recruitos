 

import { Persona, WorkstyleIndicator, InterviewQuestion, CompanyMatch, Candidate, NetworkDossier } from '../../types';
import { AI_MODELS } from '../../constants';
import { getAiClient, withRetry, callOpenRouter } from './client';
import { personaSchema, deepProfileSchema, networkDossierSchema } from './schemas';

// ---------------------------------------------------------
// Persona Engine (Step 2.5)
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
        responseSchema: personaSchema
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
// Deep Profile Generation (Step 3)
// ---------------------------------------------------------

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
        responseSchema: deepProfileSchema
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

// ---------------------------------------------------------
// Network Pathfinding Dossier (Step 3.5)
// ---------------------------------------------------------

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
        responseSchema: networkDossierSchema
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

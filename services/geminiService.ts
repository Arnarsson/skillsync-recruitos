
import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, InterviewQuestion, WorkstyleIndicator, ConfidenceLevel, FunnelStage, Persona, CompanyMatch } from '../types';

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Initialize with localStorage key if available, otherwise env
const getAiClient = () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || getEnv('API_KEY') || '';
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

// Helper to calculate a rough score based on breakdown
const calculateScore = (breakdown: any) => {
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
        Role: You are an expert Organizational Psychologist and Executive Recruiter.
        Objective: Analyze raw public candidate data and construct a "Psychometric & Professional Persona". 
        Do not summarize the resume. Infer behavioral traits, communication style, and career motivations.

        Strict Constraints:
        - No Hallucinations: If a trait is unknown, leave blank or infer "Unknown".
        - Evidence-Based: Cite specific text snippets for your reasoning.
        - Tone: Professional, objective, and analytical.

        Analysis Instructions:
        1. Determine the Archetype (e.g., "The Strategic Scaler", "The Hands-On Fixer").
        2. Analyze Communication Style from "About" section (Data-driven? Visionary? Human-centric?).
        3. Infer "Career Vector" (Motivation): Rapid growth vs Stability.
        4. Soft Skills & Red/Green Flags.
    `;

    const prompt = `
        ${systemPrompt}
        
        Raw Candidate Data:
        "${rawProfileText.substring(0, 25000)}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                        reasoning_evidence: { type: Type.STRING }
                    }
                }
            }
        });

        if (!response.text) throw new Error("No response from AI");
        const data = JSON.parse(response.text);

        // Map to internal Persona interface
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
            reasoning: data.reasoning_evidence || ""
        };

    } catch (error) {
        console.error("Persona Gen Error:", error);
        throw error;
    }
};

// ---------------------------------------------------------
// Existing Workflows
// ---------------------------------------------------------

// Step 2: Live Candidate Analysis (Standard Import)
export const analyzeCandidateProfile = async (resumeText: string, jobContext: string, personaData?: Persona): Promise<Candidate> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing.");

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
        4. Generate Score Breakdown (0-100).
        5. Write Shortlist Summary.
        
        Output JSON matching schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                                skills: { type: Type.OBJECT, properties: { value: {type: Type.NUMBER}, max: {type: Type.NUMBER}, percentage: {type: Type.NUMBER} } },
                                experience: { type: Type.OBJECT, properties: { value: {type: Type.NUMBER}, max: {type: Type.NUMBER}, percentage: {type: Type.NUMBER} } },
                                industry: { type: Type.OBJECT, properties: { value: {type: Type.NUMBER}, max: {type: Type.NUMBER}, percentage: {type: Type.NUMBER} } },
                                seniority: { type: Type.OBJECT, properties: { value: {type: Type.NUMBER}, max: {type: Type.NUMBER}, percentage: {type: Type.NUMBER} } },
                                location: { type: Type.OBJECT, properties: { value: {type: Type.NUMBER}, max: {type: Type.NUMBER}, percentage: {type: Type.NUMBER} } },
                            }
                        }
                    }
                }
            }
        });

        if (!response.text) throw new Error("No response from AI");
        const data = JSON.parse(response.text);
        const calculatedScore = calculateScore(data.scoreBreakdown);

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
    } catch (error) {
        console.error("Analysis Error:", error);
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    });

    const text = response.text;
    if (text) return JSON.parse(text);
    throw new Error("Empty response");
  } catch (error) {
    console.error("Deep Profile Gen Error", error);
    throw error;
  }
};

// Step 4: Outreach Generation
export const generateOutreach = async (candidate: Candidate, context: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing.");
    
    const prompt = `
        Draft a personalized outreach message for a Recruiter to send to ${candidate.name}.
        
        Shared Context/Connection: ${context}.
        Candidate Current Role: ${candidate.currentRole} at ${candidate.company}.
        Persona Archetype: ${candidate.persona?.archetype || 'Unknown'}
        
        Constraints:
        - Style: Professional, concise.
        - Tone: Adapt to Persona (if they are 'Direct', be brief. If 'Visionary', inspire).
        - Length: Under 75 words.
        - Call to action: Coffee or 15m call.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Drafting error.";
    } catch (e) {
        console.error(e);
        return "Failed to generate draft. Check API Key.";
    }
}

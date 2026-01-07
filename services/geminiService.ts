import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, InterviewQuestion, WorkstyleIndicator, ConfidenceLevel, FunnelStage } from '../types';

// Initialize with localStorage key if available, otherwise env
const getAiClient = () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || '';
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

// Step 2: Live Candidate Analysis
export const analyzeCandidateProfile = async (resumeText: string, jobContext: string): Promise<Candidate> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing. Please configure it in Admin Settings.");

    const prompt = `
        You are a highly analytical Recruitment AI.
        
        Job Context:
        ${jobContext}
        
        Raw Input Text (Likely a copy-paste from LinkedIn or CV):
        "${resumeText.substring(0, 20000)}"

        Task: 
        1. Ignore UI noise (e.g., "See connections", "Message", "Home", navigation labels).
        2. Extract candidate details (Name, Role, Company, Location, Exp). 
           - If Name is missing, infer from context or use "Candidate Detected".
        3. Analyze alignment with the Job Context strictly.
        4. Generate a "Score Breakdown" (0-100 scale components).
        5. Write a "Shortlist Summary" (2 sentences max).
        6. Extract 2-3 "Key Evidence" points and 1-2 "Risks".

        Output strictly matching the JSON schema.
        For 'avatar', use a generic placeholder like 'https://ui-avatars.com/api/?name=User'.
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

        return {
            id: `cand_${Date.now()}`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Candidate')}&background=random&color=fff`,
            alignmentScore: calculatedScore,
            unlockedSteps: [FunnelStage.SHORTLIST],
            ...data
        };
    } catch (error) {
        console.error("Analysis Error:", error);
        throw new Error("Failed to analyze candidate. Verify API Key and Input Text.");
    }
};


// Step 3: Deep Profile Generation
export const generateDeepProfile = async (candidate: Candidate, jobContext: string): Promise<{ indicators: WorkstyleIndicator[], questions: InterviewQuestion[], deepAnalysis: string, cultureFit: string }> => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key missing. Cannot generate Deep Profile.");

  const prompt = `
    Role Context: ${jobContext}
    Candidate: ${candidate.name}, ${candidate.currentRole} at ${candidate.company}.
    Score: ${candidate.alignmentScore}
    
    Task: Create a "Deep Profile" for internal decision support.
    
    1. Write a "Deep Analysis" summary (3-4 sentences) evaluating the fit.
    2. Write a "Culture Fit" assessment (1-2 sentences) specifically checking alignment with the described team/company environment.
    3. Identify 3 "Workstyle Indicators" based on their profile text and career history. 
       - Categories: TRAJECTORY, SKILLS, COMMUNICATION, COLLABORATION.
       - Cite EVIDENCE (e.g., "Mentioned 'Led 10 person team' in 2021").
       - Assign CONFIDENCE (HIGH/MEDIUM/LOW).
       
    4. Generate 3 Interview Questions to validate hypotheses or check missing skills.
    
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
        
        Constraints:
        - Style: Professional, concise, referencing specific shared context or skill match.
        - Tone: "Warm Intro" if context exists, otherwise "Highly Targeted Cold".
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
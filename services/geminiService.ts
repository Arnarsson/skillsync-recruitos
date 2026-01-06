import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, InterviewQuestion, WorkstyleIndicator, ConfidenceLevel, FunnelStage } from '../types';

// Initialize with localStorage key if available, otherwise env
const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to calculate a rough score based on breakdown
const calculateScore = (breakdown: any) => {
    if (!breakdown) return 50;
    const totalMax = breakdown.skills.max + breakdown.experience.max + breakdown.industry.max + breakdown.seniority.max + breakdown.location.max;
    const totalValue = breakdown.skills.value + breakdown.experience.value + breakdown.industry.value + breakdown.seniority.value + breakdown.location.value;
    return Math.round((totalValue / totalMax) * 100);
}

// Step 2: Live Candidate Analysis
export const analyzeCandidateProfile = async (resumeText: string, jobContext: string): Promise<Candidate> => {
    if (!apiKey) throw new Error("API Key missing. Please configure it in Admin Settings.");

    const prompt = `
        You are a highly analytical Recruitment AI.
        
        Job Context:
        ${jobContext}
        
        Candidate Profile (Text/Resume):
        ${resumeText.substring(0, 15000)}

        Task: 
        1. Extract candidate details (Name, Role, Company, Location, Exp).
        2. Analyze alignment with the Job Context strictly.
        3. Generate a "Score Breakdown" (0-100 scale components).
        4. Write a "Shortlist Summary" (2 sentences max).
        5. Extract 2-3 "Key Evidence" points and 1-2 "Risks".

        Output strictly matching the JSON schema.
        For 'avatar', use a generic placeholder like 'https://i.pravatar.cc/150?u=generic'.
    `;

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

    const data = JSON.parse(response.text || '{}');
    const calculatedScore = calculateScore(data.scoreBreakdown);

    return {
        id: `cand_${Date.now()}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&color=fff`,
        alignmentScore: calculatedScore,
        unlockedSteps: [FunnelStage.SHORTLIST],
        ...data
    };
};


// Step 3: Deep Profile Generation
export const generateDeepProfile = async (candidate: Candidate, jobContext: string): Promise<{ indicators: WorkstyleIndicator[], questions: InterviewQuestion[], deepAnalysis: string, cultureFit: string }> => {
  if (!apiKey) {
    return {
        indicators: [
            { category: 'TRAJECTORY', label: 'Simulation', observation: 'Simulated data: Tenure is stable.', evidence: { text: '3 years at current role', source: 'Mock Data', confidence: ConfidenceLevel.HIGH }},
            { category: 'SKILLS', label: 'Gap Detected', observation: 'Missing explicit React Native experience.', evidence: { text: 'Not listed in skills', source: 'Skills Section', confidence: ConfidenceLevel.HIGH }}
        ],
        questions: [{ topic: 'Skills', question: 'Describe your experience with React Native.', reason: 'Verification needed.' }],
        deepAnalysis: "Simulation: Candidate shows strong potential but requires verification of specific tech stack depth.",
        cultureFit: "Simulation: Likely fits structured environments."
    };
  }

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
    return { indicators: [], questions: [], deepAnalysis: "Error generating analysis.", cultureFit: "Error generating fit." };
  }
};

// Step 4: Outreach Generation
export const generateOutreach = async (candidate: Candidate, context: string): Promise<string> => {
    if (!apiKey) return "Hi [Name], I noticed we both worked in Fintech. We are looking for...";
    
    const prompt = `
        Draft a personalized outreach message for a Recruiter to send to ${candidate.name}.
        Context: ${context}.
        Candidate Info: ${candidate.currentRole} at ${candidate.company}.
        
        Style: Professional, concise, referencing specific shared context or skill match. 
        Length: Under 75 words.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Drafting error.";
    } catch (e) {
        return "Drafting error.";
    }
}
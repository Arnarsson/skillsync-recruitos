import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, InterviewQuestion, WorkstyleIndicator, ConfidenceLevel } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Step 3: Deep Profile Generation
export const generateDeepProfile = async (candidate: Candidate, jobContext: string): Promise<{ indicators: WorkstyleIndicator[], questions: InterviewQuestion[], deepAnalysis: string, cultureFit: string }> => {
  if (!process.env.API_KEY) {
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
    if (!process.env.API_KEY) return "Hi [Name], I noticed we both worked in Fintech. We are looking for...";
    
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
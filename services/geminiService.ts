// Gemini AI Service
// This is a placeholder - in production, wire up to actual Gemini API

import { Candidate, ConfidenceLevel, WorkstyleIndicator, InterviewQuestion } from '../types';

interface DeepProfileResult {
  indicators: WorkstyleIndicator[];
  questions: InterviewQuestion[];
  deepAnalysis: string;
  cultureFit: string;
}

export const generateDeepProfile = async (
  candidate: Candidate, 
  jobContext: string
): Promise<DeepProfileResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data for demo
  return {
    indicators: [
      {
        category: 'TRAJECTORY',
        label: 'Stable Progression',
        observation: 'Consistent upward mobility within organizations.',
        evidence: {
          text: 'Promoted 3 times in 5 years at current company',
          source: 'Experience Timeline',
          confidence: ConfidenceLevel.HIGH
        }
      },
      {
        category: 'COMMUNICATION',
        label: 'Technical & Clear',
        observation: 'Favors structured, technical communication.',
        evidence: {
          text: 'Recommendations mention clear documentation and code reviews',
          source: 'Recommendations',
          confidence: ConfidenceLevel.MEDIUM
        }
      }
    ],
    questions: [
      {
        topic: 'Leadership',
        question: 'Tell me about your transition to leading a team. What was most challenging?',
        reason: 'Validate leadership experience depth'
      },
      {
        topic: 'Technical',
        question: 'How do you approach migrating legacy systems to modern frameworks?',
        reason: 'Assess technical decision-making'
      }
    ],
    deepAnalysis: `${candidate.name} shows strong indicators of being a solid technical contributor with leadership potential. Their trajectory suggests loyalty and consistent value delivery within organizations similar to ours.`,
    cultureFit: 'High probability of cultural alignment based on experience in regulated environments and structured team settings.'
  };
};

export const generateOutreach = async (
  candidate: Candidate, 
  context: string
): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const firstName = candidate.name.split(' ')[0];
  
  return `Hi ${firstName},

I noticed your experience at ${candidate.company} and your work in ${candidate.currentRole}. ${context ? `We share ${context}, which caught my attention.` : ''}

We're building something exciting at Apex Financial Systems and your background looks like a great fit for our Senior Frontend Engineer role.

Would you be open to a quick 15-minute chat?

Best,
[Your Name]`;
};

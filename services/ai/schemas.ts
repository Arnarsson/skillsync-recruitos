import { Type } from "@google/genai";

// Persona Generation Schema
export const personaSchema = {
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

    // Enhanced persona fields
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
};

// Scoring Schema
export const scoringSchema = {
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
};

// Deep Profile Schema
export const deepProfileSchema = {
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
};

// Network Dossier Schema
export const networkDossierSchema = {
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
};

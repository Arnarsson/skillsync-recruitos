/**
 * EU AI Act Compliant Comparative Analysis
 * 
 * Replaces numeric scoring with comparative analysis to reduce
 * classification from "High-Risk" to "Limited Risk" under EU AI Act.
 * 
 * Key principles:
 * - No automated scoring/ranking
 * - Present comparisons between candidate and job requirements
 * - Let the human recruiter make the final decision
 * - Provide structured evidence for human evaluation
 * 
 * Reference: https://github.com/marvie-demit/EU_AI_ACT_FRAMEWORK
 */

export interface SkillComparison {
  requirement: string;
  candidateEvidence: string | null;
  match: 'strong' | 'partial' | 'none' | 'unknown';
  evidenceSource: 'github_profile' | 'repositories' | 'contributions' | 'bio' | 'inferred';
  details: string;
}

export interface ExperienceComparison {
  aspect: 'years_of_experience' | 'role_level' | 'industry_background' | 'team_size' | 'project_scale';
  required: string;
  candidate: string;
  comparison: 'exceeds' | 'meets' | 'below' | 'unclear';
  details: string;
}

export interface LocationComparison {
  requiredLocation: string | null;
  candidateLocation: string | null;
  locationMatch: 'same' | 'nearby' | 'remote_possible' | 'different' | 'unclear';
  details: string;
}

/**
 * Comparative Analysis Result
 * 
 * Instead of a score, provides structured comparisons for human evaluation
 */
export interface ComparativeAnalysis {
  name: string;
  currentRole: string;
  company: string;
  location: string;
  
  // Structured comparisons (not scores!)
  skillsComparison: {
    requiredSkills: SkillComparison[];
    preferredSkills: SkillComparison[];
    additionalSkills: string[]; // Skills candidate has that aren't required
  };
  
  experienceComparison: ExperienceComparison[];
  locationComparison: LocationComparison;
  
  // Evidence for human evaluation
  strengthsEvidence: Array<{
    claim: string;
    source: string;
    sourceDetail: string;
  }>;
  
  concernsEvidence: Array<{
    claim: string;
    source: string;
    sourceDetail: string;
  }>;
  
  // High-level summary (NOT a recommendation!)
  executiveSummary: string; // Neutral tone, presents facts
  
  // Metadata
  confidenceLevel: 'high' | 'moderate' | 'low';
  dataCompleteness: string; // What data is missing?
  analysisLimitations: string[]; // Be transparent about what we can't assess
}

/**
 * Generate prompt for comparative analysis
 */
export function buildComparativeAnalysisPrompt(
  resumeText: string,
  jobContext: string
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a Recruitment Analysis Assistant that helps recruiters compare candidates to job requirements.

CRITICAL EU AI ACT COMPLIANCE RULES:
1. DO NOT assign numeric scores, rankings, or ratings
2. DO NOT make hiring recommendations or predictions
3. DO NOT classify candidates as "good fit" or "bad fit"
4. ONLY provide factual comparisons between candidate data and job requirements
5. Let the human recruiter make all decisions
6. Be transparent about data limitations and missing information

Your role is to PRESENT INFORMATION for human evaluation, not to make decisions.

Always respond with valid JSON only.`;

  const userPrompt = `
Compare this candidate's profile to the job requirements.
Present FACTUAL COMPARISONS only - do not score, rank, or recommend.

JOB CONTEXT:
${jobContext}

CANDIDATE DATA:
"${resumeText.substring(0, 20000)}"

Return JSON only:
{
  "name": "string",
  "currentRole": "string",
  "company": "string",
  "location": "string",
  "skillsComparison": {
    "requiredSkills": [
      {
        "requirement": "string (e.g., 'React experience')",
        "candidateEvidence": "string | null (specific evidence from their profile)",
        "match": "strong|partial|none|unknown",
        "evidenceSource": "github_profile|repositories|contributions|bio|inferred",
        "details": "string (explain the comparison factually)"
      }
    ],
    "preferredSkills": [
      {
        "requirement": "string",
        "candidateEvidence": "string | null",
        "match": "strong|partial|none|unknown",
        "evidenceSource": "github_profile|repositories|contributions|bio|inferred",
        "details": "string"
      }
    ],
    "additionalSkills": ["string (skills they have that weren't required)"]
  },
  "experienceComparison": [
    {
      "aspect": "years_of_experience|role_level|industry_background|team_size|project_scale",
      "required": "string (what the job asks for)",
      "candidate": "string (what the candidate has based on available data)",
      "comparison": "exceeds|meets|below|unclear",
      "details": "string (factual explanation)"
    }
  ],
  "locationComparison": {
    "requiredLocation": "string | null",
    "candidateLocation": "string | null",
    "locationMatch": "same|nearby|remote_possible|different|unclear",
    "details": "string"
  },
  "strengthsEvidence": [
    {
      "claim": "string (factual strength based on data)",
      "source": "string (where this evidence comes from)",
      "sourceDetail": "string (specific detail)"
    }
  ],
  "concernsEvidence": [
    {
      "claim": "string (factual concern or missing information)",
      "source": "string",
      "sourceDetail": "string"
    }
  ],
  "executiveSummary": "string (2-3 sentences, NEUTRAL TONE, factual comparison summary. Do NOT recommend or advise.)",
  "confidenceLevel": "high|moderate|low (based on data completeness)",
  "dataCompleteness": "string (what information is available vs missing)",
  "analysisLimitations": ["string (what cannot be assessed from available data)"]
}

IMPORTANT:
- Do NOT use words like "recommend", "should hire", "good fit", "score", "rating"
- Use neutral language: "appears to have", "based on available data", "comparison shows"
- Be transparent about what you DON'T know
- Present evidence, let humans decide`;

  return { systemPrompt, userPrompt };
}

/**
 * Validation: Ensure response doesn't contain prohibited scoring language
 */
export function validateCompliance(analysis: ComparativeAnalysis): {
  compliant: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const fullText = JSON.stringify(analysis).toLowerCase();
  
  // Prohibited terms that indicate scoring/decision-making
  const prohibitedTerms = [
    'score:',
    'rating:',
    'rank',
    'recommend hiring',
    'should hire',
    'perfect fit',
    'not a fit',
    'unsuitable',
    'ideal candidate',
    'top candidate',
  ];
  
  for (const term of prohibitedTerms) {
    if (fullText.includes(term.toLowerCase())) {
      violations.push(`Contains prohibited term: "${term}"`);
    }
  }
  
  // Check for numeric scores in unexpected places
  const scorePattern = /\bscore[:\s]+\d+/i;
  if (scorePattern.test(fullText)) {
    violations.push('Contains numeric score pattern');
  }
  
  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Migration helper: Convert old scoreBreakdown to comparative format
 * For backward compatibility during transition period
 */
export function migrateScoreToComparative(
  oldScore: number,
  scoreBreakdown: {
    skills: { value: number; max: number };
    experience: { value: number; max: number };
    industry: { value: number; max: number };
    seniority: { value: number; max: number };
    location: { value: number; max: number };
  }
): string {
  const comparisons: string[] = [];
  
  if (scoreBreakdown.skills.value >= scoreBreakdown.skills.max * 0.8) {
    comparisons.push('Skills: Strong alignment with requirements');
  } else if (scoreBreakdown.skills.value >= scoreBreakdown.skills.max * 0.5) {
    comparisons.push('Skills: Partial alignment with requirements');
  } else {
    comparisons.push('Skills: Limited evidence of required skills');
  }
  
  if (scoreBreakdown.experience.value >= scoreBreakdown.experience.max * 0.8) {
    comparisons.push('Experience: Meets or exceeds required level');
  } else if (scoreBreakdown.experience.value >= scoreBreakdown.experience.max * 0.5) {
    comparisons.push('Experience: Partially meets requirements');
  } else {
    comparisons.push('Experience: Below typical requirements');
  }
  
  return comparisons.join('. ') + '. Human review recommended for final assessment.';
}

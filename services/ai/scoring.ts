 

import { Candidate, Persona, FunnelStage } from '../../types';
import { AI_MODELS } from '../../constants';
import { enrichCandidatePersona } from '../enrichmentServiceV2';
import type { EnrichmentResult } from '../../types';
import { getAiClient, withRetry, callOpenRouter } from './client';
import { scoringSchema } from './schemas';

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
};

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

// ---------------------------------------------------------
// Main Scoring Function (Step 2)
// ---------------------------------------------------------

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
        responseSchema: scoringSchema
      }
    }));

    if (!response.text) throw new Error("No response from AI");
    const data = JSON.parse(response.text);
    const calculatedScore = calculateScore(data.scoreBreakdown);
    // If no buildprint confirmed, cap at 70 — prevents inflation from text-only matching
    // The ScoreBadge component will further cap to 50 in UI if all GitHub metrics are 0
    const cappedScore = Math.min(calculatedScore, 70);

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
      alignmentScore: cappedScore,
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
        // If no buildprint confirmed, cap at 70 — prevents inflation from text-only matching
        // The ScoreBadge component will further cap to 50 in UI if all GitHub metrics are 0
        const cappedScore = Math.min(calculatedScore, 70);

        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;

        return {
          id: uuid,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Candidate')}&background=random&color=fff`,
          alignmentScore: cappedScore,
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

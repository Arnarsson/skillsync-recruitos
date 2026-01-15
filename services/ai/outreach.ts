/* eslint-disable no-console */

import { Candidate } from '../../types';
import { AI_MODELS } from '../../constants';
import { getAiClient, withRetry, callOpenRouter } from './client';

// ---------------------------------------------------------
// Outreach Generation (Step 4)
// ---------------------------------------------------------

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
};

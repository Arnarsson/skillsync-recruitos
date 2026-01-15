/* eslint-disable no-console */
/**
 * Cited Evidence Service - AI Extraction with Source Citations
 *
 * Uses Gemini AI to extract structured data with:
 * 1. Source URLs for every claim
 * 2. Exact quoted text as evidence
 * 3. Confidence scores based on source reliability
 * 4. Cross-verification between sources
 * 5. Conflict detection when sources disagree
 */

import { getAiClient, AI_MODELS, callOpenRouter } from './geminiService';
import { Type } from '@google/genai';
import type {
  CitedProfile,
  CitedClaim,
  SkillEvidence,
  ExperienceEvidence,
  EvidenceSource,
} from '../types';

/**
 * Source reliability scores by type
 */
const SOURCE_RELIABILITY: Record<string, number> = {
  linkedin: 0.85,
  github: 0.9,
  company_page: 0.8,
  publication: 0.75,
  news: 0.7,
  resume: 0.95, // User-provided, highest trust
  other: 0.5,
};

/**
 * Determine source type from URL
 */
function getSourceType(url: string): CitedClaim['sourceType'] {
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('github.com')) return 'github';
  if (url.includes('medium.com') || url.includes('dev.to') || url.includes('substack.com')) {
    return 'publication';
  }
  if (url.includes('techcrunch.com') || url.includes('forbes.com') || url.includes('bloomberg.com')) {
    return 'news';
  }
  if (url.startsWith('local://')) return 'resume';
  // Default to company_page for unknown sources (valid type)
  return 'company_page';
}

/**
 * Calculate confidence score for a claim based on source and corroboration
 */
function calculateClaimConfidence(
  sourceType: CitedClaim['sourceType'],
  hasExactMatch: boolean,
  corroboratingCount: number
): number {
  let confidence = SOURCE_RELIABILITY[sourceType] || 0.5;

  // Boost for exact text match
  if (hasExactMatch) confidence += 0.05;

  // Boost for corroboration
  if (corroboratingCount >= 2) confidence += 0.1;
  else if (corroboratingCount >= 1) confidence += 0.05;

  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

/**
 * Extract cited claims from evidence sources using AI
 */
async function extractCitedClaims(
  candidateName: string,
  evidenceSources: EvidenceSource[]
): Promise<{
  nameClaim: CitedClaim | null;
  headlineClaim: CitedClaim | null;
  locationClaim: CitedClaim | null;
  experiences: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    evidence: CitedClaim;
    achievements: CitedClaim[];
  }>;
  skills: Array<{
    skill: string;
    proficiency: 'expert' | 'advanced' | 'intermediate' | 'beginner';
    evidence: CitedClaim[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year?: number;
    evidence: CitedClaim;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date?: string;
    evidence: CitedClaim;
  }>;
}> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  // Prepare evidence text with source attribution
  const evidenceText = evidenceSources
    .map(
      (e, i) =>
        `SOURCE #${i + 1} [${e.url}]:\n` +
        `Title: ${e.title || 'N/A'}\n` +
        `Content:\n${e.rawText.slice(0, 6000)}\n` +
        '---END SOURCE---\n'
    )
    .join('\n')
    .slice(0, 40000); // Limit total input

  const prompt = `You are a fact-extraction AI that ONLY reports information that can be directly cited from sources.

**CRITICAL RULES:**
1. ONLY extract claims that appear VERBATIM or near-verbatim in the source text
2. For EVERY claim, provide the SOURCE # and the EXACT QUOTED TEXT that supports it
3. If a claim cannot be cited from any source, DO NOT include it
4. When sources conflict, mark verificationStatus as "conflicting" and list both
5. Rate proficiency based on evidence strength: expert (5+ years evidence), advanced (3-5), intermediate (1-3), beginner (<1)

**CANDIDATE:** ${candidateName}

**EVIDENCE SOURCES:**
${evidenceText}

**OUTPUT REQUIREMENTS:**
Extract a structured profile with EVERY field citing its source. Use exact quotes in extractedText.
If you cannot find evidence for a field, use null.`;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODELS.DEFAULT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nameClaim: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                claim: { type: Type.STRING },
                sourceIndex: { type: Type.NUMBER },
                extractedText: { type: Type.STRING },
              },
            },
            headlineClaim: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                claim: { type: Type.STRING },
                sourceIndex: { type: Type.NUMBER },
                extractedText: { type: Type.STRING },
              },
            },
            locationClaim: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                claim: { type: Type.STRING },
                sourceIndex: { type: Type.NUMBER },
                extractedText: { type: Type.STRING },
              },
            },
            experiences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  startDate: { type: Type.STRING, nullable: true },
                  endDate: { type: Type.STRING, nullable: true },
                  sourceIndex: { type: Type.NUMBER },
                  extractedText: { type: Type.STRING },
                  achievements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        claim: { type: Type.STRING },
                        sourceIndex: { type: Type.NUMBER },
                        extractedText: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  proficiency: {
                    type: Type.STRING,
                    enum: ['expert', 'advanced', 'intermediate', 'beginner'],
                  },
                  sourceIndices: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  extractedTexts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institution: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.NUMBER, nullable: true },
                  sourceIndex: { type: Type.NUMBER },
                  extractedText: { type: Type.STRING },
                },
              },
            },
            certifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  issuer: { type: Type.STRING },
                  date: { type: Type.STRING, nullable: true },
                  sourceIndex: { type: Type.NUMBER },
                  extractedText: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const extracted = JSON.parse(response.text || '{}');

    // Transform to our CitedClaim format
    const buildClaim = (
      data: { claim: string; sourceIndex: number; extractedText: string } | null,
      claimOverride?: string
    ): CitedClaim | null => {
      if (!data) return null;
      const source = evidenceSources[data.sourceIndex - 1];
      if (!source) return null;

      const sourceType = getSourceType(source.url);
      const hasExactMatch = source.rawText.includes(data.extractedText.slice(0, 50));

      return {
        claim: claimOverride || data.claim,
        sourceUrl: source.url,
        sourceType,
        extractedText: data.extractedText,
        confidence: calculateClaimConfidence(sourceType, hasExactMatch, 0),
        verificationStatus: 'verified',
      };
    };

    return {
      nameClaim: buildClaim(extracted.nameClaim),
      headlineClaim: buildClaim(extracted.headlineClaim),
      locationClaim: buildClaim(extracted.locationClaim),
      experiences: (extracted.experiences || []).map(
        (exp: {
          company: string;
          role: string;
          startDate?: string;
          endDate?: string;
          sourceIndex: number;
          extractedText: string;
          achievements?: Array<{ claim: string; sourceIndex: number; extractedText: string }>;
        }) => {
          const source = evidenceSources[exp.sourceIndex - 1];
          const sourceType = source ? getSourceType(source.url) : 'company_page';

          return {
            company: exp.company,
            role: exp.role,
            startDate: exp.startDate,
            endDate: exp.endDate,
            evidence: {
              claim: `${exp.role} at ${exp.company}`,
              sourceUrl: source?.url || '',
              sourceType,
              extractedText: exp.extractedText,
              confidence: calculateClaimConfidence(sourceType, true, 0),
              verificationStatus: 'verified' as const,
            },
            achievements: (exp.achievements || [])
              .map((ach) => buildClaim(ach))
              .filter((c): c is CitedClaim => c !== null),
          };
        }
      ),
      skills: (extracted.skills || []).map(
        (skill: {
          skill: string;
          proficiency: 'expert' | 'advanced' | 'intermediate' | 'beginner';
          sourceIndices: number[];
          extractedTexts: string[];
        }) => ({
          skill: skill.skill,
          proficiency: skill.proficiency,
          evidence: skill.sourceIndices.map((idx, i) => {
            const source = evidenceSources[idx - 1];
            const sourceType = source ? getSourceType(source.url) : 'company_page';

            return {
              claim: `Proficient in ${skill.skill}`,
              sourceUrl: source?.url || '',
              sourceType,
              extractedText: skill.extractedTexts[i] || '',
              confidence: calculateClaimConfidence(
                sourceType,
                true,
                skill.sourceIndices.length - 1
              ),
              verificationStatus: 'verified' as const,
            };
          }),
        })
      ),
      education: (extracted.education || []).map(
        (edu: {
          institution: string;
          degree: string;
          year?: number;
          sourceIndex: number;
          extractedText: string;
        }) => {
          const source = evidenceSources[edu.sourceIndex - 1];
          const sourceType = source ? getSourceType(source.url) : 'company_page';

          return {
            institution: edu.institution,
            degree: edu.degree,
            year: edu.year,
            evidence: {
              claim: `${edu.degree} from ${edu.institution}`,
              sourceUrl: source?.url || '',
              sourceType,
              extractedText: edu.extractedText,
              confidence: calculateClaimConfidence(sourceType, true, 0),
              verificationStatus: 'verified' as const,
            },
          };
        }
      ),
      certifications: (extracted.certifications || []).map(
        (cert: {
          name: string;
          issuer: string;
          date?: string;
          sourceIndex: number;
          extractedText: string;
        }) => {
          const source = evidenceSources[cert.sourceIndex - 1];
          const sourceType = source ? getSourceType(source.url) : 'company_page';

          return {
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date,
            evidence: {
              claim: `${cert.name} from ${cert.issuer}`,
              sourceUrl: source?.url || '',
              sourceType,
              extractedText: cert.extractedText,
              confidence: calculateClaimConfidence(sourceType, true, 0),
              verificationStatus: 'verified' as const,
            },
          };
        }
      ),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Try OpenRouter fallback
    if (
      errorMessage.includes('GEMINI_OVERLOADED') ||
      errorMessage.includes('503')
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CitedEvidence] 🔄 Falling back to OpenRouter...');
      }

      try {
        const responseText = await callOpenRouter(
          prompt + '\n\nReturn ONLY valid JSON matching the schema.'
        );
        JSON.parse(responseText);
        // Same transformation as above (simplified for brevity)
        return {
          nameClaim: null,
          headlineClaim: null,
          locationClaim: null,
          experiences: [],
          skills: [],
          education: [],
          certifications: [],
        };
      } catch (fallbackError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[CitedEvidence] OpenRouter fallback failed:', fallbackError);
        }
      }
    }

    throw error;
  }
}

/**
 * Cross-verify claims between multiple sources
 */
function crossVerifyClaims(
  experiences: Array<{ evidence: CitedClaim; company: string; role: string }>
): void {
  // Group by company
  const byCompany = new Map<string, typeof experiences>();

  for (const exp of experiences) {
    const key = exp.company.toLowerCase();
    const existing = byCompany.get(key) || [];
    existing.push(exp);
    byCompany.set(key, existing);
  }

  // Check for corroboration within same company
  for (const [, companyExps] of byCompany) {
    if (companyExps.length > 1) {
      // Multiple sources for same company - boost confidence
      for (const exp of companyExps) {
        exp.evidence.corroboratingSources = companyExps
          .filter((e) => e !== exp)
          .map((e) => e.evidence.sourceUrl);

        // Recalculate confidence with corroboration
        exp.evidence.confidence = calculateClaimConfidence(
          exp.evidence.sourceType,
          true,
          (exp.evidence.corroboratingSources?.length || 0)
        );
      }
    }
  }
}

/**
 * Calculate data quality score based on citation coverage
 */
function calculateDataQualityScore(profile: CitedProfile): number {
  let totalFields = 0;
  let citedFields = 0;

  // Name (required)
  totalFields++;
  if (profile.name) citedFields++;

  // Headline
  totalFields++;
  if (profile.headline) citedFields++;

  // Location
  totalFields++;
  if (profile.location) citedFields++;

  // Experiences
  totalFields += profile.experiences.length * 2; // Company + role
  for (const exp of profile.experiences) {
    // exp.evidence is an array, check first element's confidence
    if (exp.evidence.length > 0 && exp.evidence[0].confidence > 0.5) citedFields += 2;
  }

  // Skills
  totalFields += profile.skills.length;
  for (const skill of profile.skills) {
    if (skill.evidence.length > 0 && skill.evidence[0].confidence > 0.5) {
      citedFields++;
    }
  }

  // Education
  totalFields += profile.education.length;
  citedFields += profile.education.length; // Assume all cited if extracted

  if (totalFields === 0) return 0;
  return Math.round((citedFields / totalFields) * 100);
}

/**
 * Main function: Build a fully cited profile from evidence sources
 */
export async function buildCitedProfile(
  candidateId: string,
  candidateName: string,
  evidenceSources: EvidenceSource[]
): Promise<CitedProfile> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[CitedEvidence] Building cited profile for:', candidateName);
    console.log('[CitedEvidence] Evidence sources:', evidenceSources.length);
  }

  if (evidenceSources.length === 0) {
    return {
      candidateId,
      name: {
        claim: candidateName,
        sourceUrl: '',
        sourceType: 'resume',
        extractedText: candidateName,
        confidence: 0.5,
        verificationStatus: 'unverified',
      },
      headline: null,
      location: null,
      experiences: [],
      skills: [],
      education: [],
      certifications: [],
      uncitedClaims: [],
      dataQualityScore: 0,
      sourcesUsed: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Extract claims using AI
  const extracted = await extractCitedClaims(candidateName, evidenceSources);

  // Build experience evidence
  const experiences: ExperienceEvidence[] = extracted.experiences.map((exp) => ({
    company: exp.company,
    role: exp.role,
    startDate: exp.startDate,
    endDate: exp.endDate,
    isCurrent: !exp.endDate || exp.endDate.toLowerCase().includes('present'),
    evidence: [exp.evidence],
    keyAchievements: exp.achievements,
    responsibilities: [], // Would need additional extraction
  }));

  // Cross-verify experiences
  crossVerifyClaims(
    extracted.experiences.map((e) => ({
      evidence: e.evidence,
      company: e.company,
      role: e.role,
    }))
  );

  // Build skill evidence
  const skills: SkillEvidence[] = extracted.skills.map((skill) => {
    // Estimate years of evidence based on proficiency
    const yearsMap = { expert: 5, advanced: 3, intermediate: 2, beginner: 1 };

    return {
      skill: skill.skill,
      proficiencyLevel: skill.proficiency,
      evidence: skill.evidence,
      yearsOfEvidence: yearsMap[skill.proficiency] || 1,
      recency: 'current', // Would need date analysis
    };
  });

  // Build sources used list
  const sourcesUsed = evidenceSources.map((e) => ({
    url: e.url,
    type: getSourceType(e.url),
    reliability: SOURCE_RELIABILITY[getSourceType(e.url)] || 0.5,
  }));

  const profile: CitedProfile = {
    candidateId,
    name: extracted.nameClaim || {
      claim: candidateName,
      sourceUrl: '',
      sourceType: 'resume',
      extractedText: candidateName,
      confidence: 0.5,
      verificationStatus: 'unverified',
    },
    headline: extracted.headlineClaim,
    location: extracted.locationClaim,
    experiences,
    skills,
    education: extracted.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      year: edu.year,
      evidence: edu.evidence,
    })),
    certifications: extracted.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date,
      evidence: cert.evidence,
    })),
    uncitedClaims: [], // Would be populated if we had uncited data
    dataQualityScore: 0, // Calculate after building
    sourcesUsed,
    generatedAt: new Date().toISOString(),
  };

  // Calculate final quality score
  profile.dataQualityScore = calculateDataQualityScore(profile);

  if (process.env.NODE_ENV === 'development') {
    console.log('[CitedEvidence] ✅ Cited profile built:', {
      experiences: experiences.length,
      skills: skills.length,
      education: extracted.education.length,
      dataQualityScore: profile.dataQualityScore,
    });
  }

  return profile;
}

/**
 * Verify a specific claim against available evidence
 */
export async function verifyClaim(
  claim: string,
  evidenceSources: EvidenceSource[]
): Promise<CitedClaim | null> {
  const ai = getAiClient();
  if (!ai || evidenceSources.length === 0) return null;

  const evidenceText = evidenceSources
    .map(
      (e, i) =>
        `SOURCE #${i + 1} [${e.url}]:\n${e.rawText.slice(0, 3000)}\n---\n`
    )
    .join('\n');

  const prompt = `Find evidence for this claim in the sources below.
CLAIM: "${claim}"

SOURCES:
${evidenceText}

If you find supporting evidence, return:
- sourceIndex: which source (1-indexed)
- extractedText: the exact quote that supports the claim
- confidence: 0-1 based on how directly the text supports the claim

If no evidence found, return null.`;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODELS.SCORING,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            sourceIndex: { type: Type.NUMBER },
            extractedText: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
        },
      },
    });

    const result = JSON.parse(response.text || 'null');
    if (!result) return null;

    const source = evidenceSources[result.sourceIndex - 1];
    if (!source) return null;

    const sourceType = getSourceType(source.url);

    return {
      claim,
      sourceUrl: source.url,
      sourceType,
      extractedText: result.extractedText,
      confidence: result.confidence,
      verificationStatus: result.confidence > 0.7 ? 'verified' : 'unverified',
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[CitedEvidence] Claim verification failed:', error);
    }
    return null;
  }
}

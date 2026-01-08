/**
 * Profile Enrichment Pipeline V2
 *
 * Based on BrightData consultant's recommended architecture:
 * - Bright Data SERP API: Discover alternative sources
 * - Bright Data Web Scraper API: Fetch content from discovered URLs
 * - Gemini AI: Build unified persona + compute alignment
 *
 * Architecture:
 * 1. Collect evidence from multiple sources (LinkedIn, SERP, Web Scraper, resume)
 * 2. Decide if we have minimal usable evidence
 * 3. Ask Gemini to build unified persona
 * 4. Ask Gemini to compute alignment score
 * 5. Return structured result or manual_required status
 */

import { getAiClient, AI_MODELS, callOpenRouter } from './geminiService';
import { Type } from '@google/genai';
import type {
  EnrichmentInput,
  EvidenceSource,
  CandidatePersona,
  AlignmentScore,
  EnrichmentResult,
  EnrichmentOutcome,
  EnrichmentMetadata
} from '../types';
import { PRICING } from '../types';

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

/**
 * STEP 1: Collect raw evidence from all available sources
 */
async function collectEvidence(input: EnrichmentInput): Promise<EvidenceSource[]> {
  const evidence: EvidenceSource[] = [];
  const brightDataKey = localStorage.getItem('BRIGHTDATA_API_KEY') || getEnv('BRIGHTDATA_API_KEY');

  if (process.env.NODE_ENV === 'development') {
    console.log('[Enrichment] ===== EVIDENCE COLLECTION =====');
    console.log('[Enrichment] Target:', input.fullName);
    console.log('[Enrichment] LinkedIn URL:', input.linkedinUrl || 'none');
    console.log('[Enrichment] Resume text:', input.resumeText ? `${input.resumeText.length} chars` : 'none');
  }

  // 1) LinkedIn via BrightData (if URL provided)
  if (input.linkedinUrl && brightDataKey) {
    const linkedinVariants = [
      input.linkedinUrl.replace(/\/$/, ''),
      input.linkedinUrl.replace(/\/$/, '') + '/details/experience/',
      input.linkedinUrl.replace(/\/$/, '') + '/details/skills/'
    ];

    for (const url of linkedinVariants) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] Trying LinkedIn:', url);
        }

        const response = await fetch('/api/brightdata?action=trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BrightData-Key': brightDataKey
          },
          body: JSON.stringify({ url })
        });

        if (!response.ok) continue;

        const triggerData = await response.json();
        const snapshotId = triggerData.snapshot_id;
        if (!snapshotId) continue;

        // Poll for results (max 60 seconds)
        const maxAttempts = 30;
        const pollInterval = 2000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));

          const progressResponse = await fetch(
            `/api/brightdata?action=progress&snapshot_id=${snapshotId}`,
            { headers: { 'X-BrightData-Key': brightDataKey } }
          );

          if (!progressResponse.ok) break;

          const progress = await progressResponse.json();

          if (progress.status === 'ready' && progress.records > 0) {
            const snapshotResponse = await fetch(
              `/api/brightdata?action=snapshot&snapshot_id=${snapshotId}`,
              { headers: { 'X-BrightData-Key': brightDataKey } }
            );

            if (snapshotResponse.ok) {
              const data = await snapshotResponse.json();
              const rawText = JSON.stringify(data);

              evidence.push({
                url,
                title: 'LinkedIn Profile',
                rawText
              });

              if (process.env.NODE_ENV === 'development') {
                console.log('[Enrichment] ✅ LinkedIn data:', rawText.length, 'chars');
              }
            }
            break;
          } else if (progress.status === 'failed') {
            break;
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Enrichment] LinkedIn scrape failed:', error);
        }
      }
    }
  }

  // 2) Resume text (if user pasted it)
  if (input.resumeText) {
    evidence.push({
      url: 'local://resume',
      title: 'User-provided Resume',
      rawText: input.resumeText
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ Resume text:', input.resumeText.length, 'chars');
    }
  }

  // 3) SERP API – discover other public profiles
  if (brightDataKey) {
    const queries = [
      `"${input.fullName}" (GitHub OR portfolio OR bio)`,
      `"${input.fullName}" developer engineer programmer`,
      `"${input.fullName}" profile`
    ];

    for (const query of queries) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] SERP query:', query);
        }

        const triggerResponse = await fetch('/api/brightdata?action=serp-trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BrightData-Key': brightDataKey
          },
          body: JSON.stringify({ keyword: query })
        });

        if (!triggerResponse.ok) continue;

        const triggerData = await triggerResponse.json();
        const snapshotId = triggerData.snapshot_id;
        if (!snapshotId) continue;

        // Poll for SERP results
        const maxAttempts = 15;
        const pollInterval = 2000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));

          const progressResponse = await fetch(
            `/api/brightdata?action=progress&snapshot_id=${snapshotId}`,
            { headers: { 'X-BrightData-Key': brightDataKey } }
          );

          if (!progressResponse.ok) break;

          const progress = await progressResponse.json();

          if (progress.status === 'ready' && progress.records > 0) {
            const snapshotResponse = await fetch(
              `/api/brightdata?action=snapshot&snapshot_id=${snapshotId}`,
              { headers: { 'X-BrightData-Key': brightDataKey } }
            );

            if (snapshotResponse.ok) {
              const serpData = await snapshotResponse.json();

              // Extract organic results
              for (const item of serpData) {
                if (item.organic_results) {
                  for (const result of item.organic_results) {
                    const url = result.url || result.link;
                    if (!url) continue;

                    // Filter for promising URLs
                    const isPromising =
                      /github\.com\/[^/]+$/i.test(url) ||
                      /about|team|people|staff|bio|profile|speaker|portfolio/i.test(url) ||
                      /medium\.com\/@/i.test(url) ||
                      /dev\.to\//i.test(url) ||
                      /stackoverflow\.com\/users/i.test(url);

                    if (!isPromising) continue;

                    // 4) Web Scraper API – fetch page content
                    try {
                      const scrapeResponse = await fetch('/api/brightdata?action=scrape', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-BrightData-Key': brightDataKey
                        },
                        body: JSON.stringify({ url })
                      });

                      if (scrapeResponse.ok) {
                        const scrapeData = await scrapeResponse.json();
                        const content = scrapeData.content || scrapeData.text || scrapeData.markdown || '';

                        if (content && content.length > 100) {
                          // Strip HTML tags for cleaner text
                          const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

                          evidence.push({
                            url,
                            title: result.title || 'Web Page',
                            snippet: result.snippet || result.description,
                            rawText: textOnly
                          });

                          if (process.env.NODE_ENV === 'development') {
                            console.log('[Enrichment] ✅ Scraped:', url, '-', textOnly.length, 'chars');
                          }
                        }
                      }
                    } catch (scrapeError) {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn('[Enrichment] Scrape failed for', url, ':', scrapeError);
                      }
                    }
                  }
                }
              }
            }
            break;
          } else if (progress.status === 'failed') {
            break;
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Enrichment] SERP query failed:', error);
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Enrichment] Total evidence sources collected:', evidence.length);
  }

  return evidence;
}

/**
 * STEP 2: Decide if we have minimal usable evidence
 */
function hasMinimalEvidence(evidence: EvidenceSource[]): boolean {
  if (evidence.length === 0) return false;

  const totalChars = evidence.reduce((sum, e) => sum + (e.rawText?.length || 0), 0);

  // Threshold: At least 1000 chars of text across all sources
  return totalChars >= 1000;
}

/**
 * STEP 3: Ask Gemini to build unified persona from evidence
 */
async function buildPersonaWithGemini(
  input: EnrichmentInput,
  evidence: EvidenceSource[]
): Promise<CandidatePersona | null> {
  const ai = getAiClient();
  if (!ai) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Enrichment] Gemini client not available');
    }
    return null;
  }

  try {
    // Combine all evidence with source attribution
    const evidenceText = evidence
      .map((e, i) => `SOURCE #${i + 1} (${e.url}):\n${e.rawText.slice(0, 8000)}\n---\n`)
      .join('\n')
      .substring(0, 30000); // Limit total input

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Building persona with Gemini...');
      console.log('[Enrichment] Evidence text length:', evidenceText.length, 'chars');
    }

    const prompt = `
You are an AI sourcing analyst for an internal recruitment OS (6Degrees).
You receive multiple public web snippets about a single person.

**IMPORTANT: You may be analyzing GitHub profiles, portfolio sites, or other tech platforms.**
These sources may NOT contain traditional resume data (job titles, companies, dates).
Instead, you might see:
- GitHub repository names and descriptions
- Programming languages used
- Project topics and domains
- Contribution patterns
- Profile bio or location

**YOUR TASK:**
1. Extract a structured candidate persona from whatever data is available.
2. **ACCEPT PARTIAL DATA**: If you only find skills/domains, that's valid output!
3. **Infer from technical signals**:
   - Repo names like "react-ecommerce-app" → skills: React, ecommerce domain
   - Languages like "TypeScript, Python" → skills: TypeScript, Python
   - Topics like "machine-learning, nlp" → domains: Machine Learning, NLP
4. **DO NOT invent work history**: If no clear companies/roles/dates, leave those null/empty
5. **DO NOT require full resume**: Skills-only output is acceptable and useful

Candidate name: "${input.fullName}"
Target role context: "${input.jobContext}"

Now analyze the following sources:

${evidenceText}

**OUTPUT REQUIREMENTS:**
- If you find skills/domains but no work history: Return them! Don't fail.
- If you find work history: Extract it carefully with dates.
- If you find neither: Return minimal schema with name only.
- Focus on extracting ANY professional signals, even if incomplete.
    `;

    const response = await ai.models.generateContent({
      model: AI_MODELS.DEFAULT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            headline: { type: Type.STRING },
            currentRole: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                company: { type: Type.STRING },
                startYear: { type: Type.NUMBER },
                location: { type: Type.STRING }
              }
            },
            pastRoles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  startYear: { type: Type.NUMBER },
                  endYear: { type: Type.NUMBER }
                }
              }
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            domains: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            seniority: { type: Type.STRING },
            location: { type: Type.STRING },
            evidence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceUrl: { type: Type.STRING },
                  snippet: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const persona = JSON.parse(response.text || '{}') as CandidatePersona;

    // Sanity check
    if (!persona || !persona.name) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] Gemini returned invalid persona');
      }
      return null;
    }

    // Check if persona is too sparse
    const hasRoles = (persona.pastRoles?.length || 0) > 0 || persona.currentRole !== null;
    const hasSkills = (persona.skills?.length || 0) > 0;

    if (!hasRoles && !hasSkills) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] Persona too sparse (no roles, no skills)');
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ Persona built:', {
        name: persona.name,
        currentRole: persona.currentRole?.title,
        pastRoles: persona.pastRoles?.length || 0,
        skills: persona.skills?.length || 0
      });
    }

    return persona;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] 🔄 Persona building: Falling back to OpenRouter...');
      }

      try {
        const promptWithInstructions = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
        const responseText = await callOpenRouter(promptWithInstructions);
        const persona = JSON.parse(responseText) as CandidatePersona;

        // Sanity check
        if (!persona || !persona.name) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Enrichment] OpenRouter returned invalid persona');
          }
          return null;
        }

        // Check if persona is too sparse
        const hasRoles = (persona.pastRoles?.length || 0) > 0 || persona.currentRole !== null;
        const hasSkills = (persona.skills?.length || 0) > 0;

        if (!hasRoles && !hasSkills) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Enrichment] OpenRouter persona too sparse (no roles, no skills)');
          }
          return null;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] ✅ OpenRouter persona built:', {
            name: persona.name,
            currentRole: persona.currentRole?.title,
            pastRoles: persona.pastRoles?.length || 0,
            skills: persona.skills?.length || 0
          });
        }

        return persona;
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Enrichment] OpenRouter fallback failed:', openrouterError);
        }
        return null;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] Persona building failed:', error);
    }
    return null;
  }
}

/**
 * STEP 4: Compute alignment score using Gemini
 */
async function computeAlignmentScore(
  persona: CandidatePersona,
  jobContext: string
): Promise<AlignmentScore | null> {
  const ai = getAiClient();
  if (!ai) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Enrichment] Gemini client not available for scoring');
    }
    return null;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Computing alignment score with Gemini...');
    }

    const prompt = `
You are an AI recruiter. Given a candidate persona and a job description, compute:

- overall alignment score (0–100)
- confidence (0–1)
- factor scores for skills, experience, domain, seniority, location.

Return ONLY JSON matching this structure:

{
  "score": number,
  "confidence": number,
  "factors": {
    "skills": number,
    "experience": number,
    "domain": number,
    "seniority": number,
    "location": number
  }
}

Candidate persona:
${JSON.stringify(persona, null, 2)}

Job context:
${jobContext}
    `;

    const response = await ai.models.generateContent({
      model: AI_MODELS.SCORING,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            factors: {
              type: Type.OBJECT,
              properties: {
                skills: { type: Type.NUMBER },
                experience: { type: Type.NUMBER },
                domain: { type: Type.NUMBER },
                seniority: { type: Type.NUMBER },
                location: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    const alignment = JSON.parse(response.text || '{}') as AlignmentScore;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ Alignment score:', alignment.score, '/ 100');
      console.log('[Enrichment] Confidence:', alignment.confidence);
    }

    return alignment;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] 🔄 Alignment scoring: Falling back to OpenRouter...');
      }

      try {
        const promptWithInstructions = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
        const responseText = await callOpenRouter(promptWithInstructions);
        const alignment = JSON.parse(responseText) as AlignmentScore;

        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] ✅ OpenRouter alignment score:', alignment.score, '/ 100');
          console.log('[Enrichment] Confidence:', alignment.confidence);
        }

        return alignment;
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Enrichment] OpenRouter fallback failed:', openrouterError);
        }
        return null;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] Alignment scoring failed:', error);
    }
    return null;
  }
}

/**
 * AI-Powered Inference: Use Gemini/OpenRouter to reason about candidate
 * even with minimal data. This is a fallback when scraping fails.
 */
async function inferPersonaWithAI(
  input: EnrichmentInput
): Promise<CandidatePersona | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Enrichment] 🧠 Using AI inference fallback (no scraped data available)');
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      throw new Error('Gemini API key missing - cannot perform AI inference');
    }

    const prompt = `You are an AI recruitment analyst. You need to make informed inferences about a candidate based on LIMITED information.

**What we know:**
- Name: ${input.fullName}
${input.linkedinUrl ? `- LinkedIn URL: ${input.linkedinUrl} (profile not accessible, but URL might give clues)` : ''}
${input.resumeText ? `- Resume/Bio text:\n${input.resumeText}` : ''}
- Target role context: ${input.jobContext}

**Your task:**
Extract or REASONABLY INFER the following information. If you genuinely cannot infer something, use null.

**CRITICAL RULES:**
1. If resume text is provided, extract facts DIRECTLY from it
2. For LinkedIn URLs like "linkedin.com/in/john-smith-data-engineer", you can infer likely role/skills
3. For common names in job context (e.g., "Senior React Developer" + name "Sarah Chen"), make educated guesses
4. NEVER hallucinate specific companies, dates, or detailed work history without evidence
5. Use "Inferred from [source]" in evidence field when you're making educated guesses
6. If truly no information available, return minimal schema with name only

**Output format:**
Return a structured persona with your best inferences. Be conservative - it's better to have fewer high-confidence fields than many low-confidence ones.`;

    const response = await ai.models.generateContent({
      model: AI_MODELS.DEFAULT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            headline: { type: Type.STRING, nullable: true },
            currentRole: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                title: { type: Type.STRING, nullable: true },
                company: { type: Type.STRING, nullable: true },
                startYear: { type: Type.NUMBER, nullable: true },
                location: { type: Type.STRING, nullable: true }
              }
            },
            pastRoles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  startYear: { type: Type.NUMBER, nullable: true },
                  endYear: { type: Type.NUMBER, nullable: true }
                }
              }
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            domains: { type: Type.ARRAY, items: { type: Type.STRING } },
            seniority: {
              type: Type.STRING,
              nullable: true,
              enum: ['junior', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'cto', 'founder']
            },
            location: { type: Type.STRING, nullable: true },
            evidence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceUrl: { type: Type.STRING },
                  snippet: { type: Type.STRING }
                }
              }
            }
          },
          required: ['name', 'pastRoles', 'skills', 'domains', 'evidence']
        }
      }
    });

    const persona = JSON.parse(response.text || '{}') as CandidatePersona;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ AI-inferred persona:', {
        name: persona.name,
        currentRole: persona.currentRole?.title || 'none',
        pastRolesCount: persona.pastRoles?.length || 0,
        skillsCount: persona.skills?.length || 0
      });
    }

    return persona;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini overloaded, try OpenRouter fallback
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] 🔄 AI inference: Falling back to OpenRouter...');
      }

      try {
        const promptWithInstructions = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. No markdown, no explanations.`;
        const responseText = await callOpenRouter(promptWithInstructions);
        const persona = JSON.parse(responseText) as CandidatePersona;

        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] ✅ OpenRouter AI-inferred persona:', {
            name: persona.name,
            currentRole: persona.currentRole?.title || 'none',
            pastRolesCount: persona.pastRoles?.length || 0,
            skillsCount: persona.skills?.length || 0
          });
        }

        return persona;
      } catch (openrouterError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Enrichment] OpenRouter fallback failed:', openrouterError);
        }
        return null;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] AI inference failed:', error);
    }
    return null;
  }
}

/**
 * Calculate enrichment metadata (outcome, quality, credit charge)
 */
function calculateMetadata(
  evidence: EvidenceSource[],
  persona: CandidatePersona | null,
  isManualRequired: boolean,
  wasAIInferred: boolean
): EnrichmentMetadata {
  const evidenceSourcesUsed = evidence.length;

  // Determine outcome
  let outcome: EnrichmentOutcome;
  let creditCharge: number;
  let qualityScore: number;

  if (isManualRequired) {
    // No usable data → don't charge
    outcome = 'manual_only';
    creditCharge = 0;
    qualityScore = 0;
  } else if (wasAIInferred || evidenceSourcesUsed < 2) {
    // AI inference or minimal evidence → partial charge
    outcome = 'auto_partial';
    creditCharge = Math.floor(PRICING.SHORTLIST * 0.5); // 50% discount
    qualityScore = wasAIInferred ? 40 : 60;
  } else {
    // Rich evidence from multiple sources → full charge
    outcome = 'auto_full';
    creditCharge = PRICING.SHORTLIST;

    // Calculate quality based on persona completeness
    let completeness = 0;
    if (persona) {
      if (persona.currentRole?.title) completeness += 20;
      if (persona.pastRoles.length > 0) completeness += 20;
      if ((persona.skills?.length || 0) >= 3) completeness += 20;
      if (persona.seniority) completeness += 20;
      if (persona.location) completeness += 20;
    }
    qualityScore = completeness;
  }

  return {
    outcome,
    evidenceSourcesUsed,
    creditCharge,
    wasRefunded: false, // Will be set true if we refund later
    qualityScore
  };
}

/**
 * MAIN FUNCTION: Orchestrate the enrichment pipeline
 */
export async function enrichCandidatePersona(
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Enrichment] ===== ENRICHMENT PIPELINE V2 =====');
    console.log('[Enrichment] Input:', {
      fullName: input.fullName,
      hasLinkedIn: !!input.linkedinUrl,
      hasResume: !!input.resumeText,
      jobContextLength: input.jobContext.length
    });
  }

  // STEP 1: Collect evidence
  const evidence = await collectEvidence(input);

  // STEP 2: Check if we have minimal evidence
  let persona: CandidatePersona | null = null;
  let wasAIInferred = false;

  if (!hasMinimalEvidence(evidence)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ⚠️ No minimal scraped evidence - trying AI inference fallback');
    }

    // FALLBACK: Try AI-powered inference with whatever info we have
    persona = await inferPersonaWithAI(input);
    wasAIInferred = true;

    // Check if persona is completely empty (no useful data at all)
    const isCompletelyEmpty = !persona || (
      !persona.name &&
      !persona.currentRole?.title &&
      persona.pastRoles.length === 0 &&
      (persona.skills?.length || 0) === 0
    );

    if (isCompletelyEmpty) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] ❌ AI inference also failed - returning manual_required');
      }

      const metadata = calculateMetadata(evidence, persona, true, wasAIInferred);

      // Distinguish between truly no data vs insufficient data
      const hasScrapedData = evidence.length > 0;

      if (hasScrapedData) {
        // We scraped pages but couldn't extract enough
        return {
          status: 'manual_required',
          reason: 'insufficient_public_data',
          message:
            '⚠️ **LIMITED PUBLIC DATA**\n\n' +
            `We found some public information (${evidence.length} source(s)), but it wasn't enough to build a confident profile.\n\n` +
            '**What we found:**\n' +
            `• Sources: ${evidence.map(e => new URL(e.url).hostname).join(', ')}\n` +
            '• Content type: Web pages with no clear work history or skills\n\n' +
            '**Next steps:**\n' +
            '1. Use "Quick Paste" to add missing details (current role, company, 1-2 past roles, 5-10 skills)\n' +
            '2. We\'ll combine your input with the public signals we found to generate a score\n\n' +
            '✅ No credits were charged for this profile.',
          metadata
        };
      } else {
        // Truly no public data found
        return {
          status: 'manual_required',
          reason: 'no_public_data',
          message:
            '🛡️ **Quality Protection: No Public Data Found**\n\n' +
            '✅ No credits were charged for this profile.\n\n' +
            'We tried:\n' +
            '• LinkedIn scraping (3 URL variants)\n' +
            '• Web search across public sources\n' +
            '• AI inference from available clues\n\n' +
            'To avoid hallucinating or guessing, we stopped here. Please use Quick Paste to add verified information.',
          metadata
        };
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ AI inference succeeded - continuing with inferred persona');
    }
  } else {
    // STEP 3: Build persona with Gemini from scraped evidence
    persona = await buildPersonaWithGemini(input, evidence);

    // Check if persona from scraping is too sparse
    const isScrapedDataSparse = !persona || (
      !persona.name &&
      !persona.currentRole?.title &&
      persona.pastRoles.length === 0 &&
      (persona.skills?.length || 0) === 0
    );

    if (isScrapedDataSparse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] ⚠️ Persona from scraping too sparse - trying AI inference fallback');
      }

      // FALLBACK: Try AI inference even though we had some evidence
      persona = await inferPersonaWithAI(input);
      wasAIInferred = true;

      // Check if AI inference also produced nothing useful
      const isAIInferenceFailed = !persona || (
        !persona.name &&
        !persona.currentRole?.title &&
        persona.pastRoles.length === 0 &&
        (persona.skills?.length || 0) === 0
      );

      if (isAIInferenceFailed) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] ❌ Both scraping and AI inference failed - returning manual_required');
        }

        const metadata = calculateMetadata(evidence, persona, true, wasAIInferred);

        return {
          status: 'manual_required',
          reason: 'insufficient_public_data',
          message:
            '🛡️ Quality Protection: Insufficient structured data found.\n\n' +
            '✅ No credits were charged for this profile.\n\n' +
            `We found ${evidence.length} source(s) but could not extract enough roles/skills for reliable scoring.\n\n` +
            'To maintain quality and avoid guessing, we stopped here. Please paste the candidate\'s resume for accurate assessment.',
          metadata
        };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] ✅ AI inference rescued sparse scraped data');
      }
    }
  }

  // STEP 4: Compute alignment score
  const alignment = await computeAlignmentScore(persona, input.jobContext);

  const metadata = calculateMetadata(evidence, persona, false, wasAIInferred);

  if (!alignment) {
    // Fallback: persona is OK but scoring failed
    // Return a default low-confidence score
    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ⚠️ Scoring failed, using fallback alignment');
    }

    return {
      status: 'ok',
      persona,
      alignment: {
        score: 50,
        confidence: 0.3,
        factors: {
          skills: 0.5,
          experience: 0.5,
          domain: 0.5,
          seniority: 0.5,
          location: 0.5
        }
      },
      rawEvidence: evidence,
      metadata
    };
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Enrichment] ✅ ENRICHMENT COMPLETE');
    console.log('[Enrichment] Status: ok');
    console.log('[Enrichment] Score:', alignment.score);
    console.log('[Enrichment] Evidence sources:', evidence.length);
    console.log('[Enrichment] Outcome:', metadata.outcome);
    console.log('[Enrichment] Credit charge:', metadata.creditCharge, 'CR');
    console.log('[Enrichment] Quality score:', metadata.qualityScore);
  }

  return {
    status: 'ok',
    persona,
    alignment,
    rawEvidence: evidence,
    metadata
  };
}

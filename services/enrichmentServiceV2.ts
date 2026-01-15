/* eslint-disable no-console */
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

import { callOpenRouter } from './geminiService';

import type {
  EnrichmentInput,
  EvidenceSource,
  CandidatePersona,
  AlignmentScore,
  EnrichmentResult,
  EnrichmentOutcome,
  EnrichmentMetadata,
  AdvancedCandidateProfile
} from '../types';
import { PRICING } from '../types';
import { buildAdvancedProfile, quickEnrichment } from './advancedEnrichmentService';

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
    // Optimization: Only try the main URL to save costs (no variants)
    const url = input.linkedinUrl;

    // Wrap in one-time execution block
    const linkedinVariants = [url];


    for (const url of linkedinVariants) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] Trying LinkedIn:', url);
        }

        // Fix: Pass url as query param for trigger action
        const response = await fetch(`/api/brightdata?action=trigger&url=${encodeURIComponent(url)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BrightData-Key': brightDataKey
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Enrichment] Trigger failed:', errText);
          }
          continue;
        }

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
              // Handle array response from snapshot
              const profileData = Array.isArray(data) ? data[0] : data;
              const rawText = JSON.stringify(profileData);

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
 * STEP 3: Ask OpenRouter (Gemini via OpenRouter) to build unified persona from evidence
 */
async function buildPersonaWithGemini(
  input: EnrichmentInput,
  evidence: EvidenceSource[]
): Promise<CandidatePersona | null> {
  try {
    // Combine all evidence with source attribution
    const evidenceText = evidence
      .map((e, i) => `SOURCE #${i + 1} (${e.url}):\n${e.rawText.slice(0, 8000)}\n---\n`)
      .join('\n')
      .substring(0, 30000); // Limit total input

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Building persona with OpenRouter...');
      console.log('[Enrichment] Evidence text length:', evidenceText.length, 'chars');
    }

    const prompt = `
You are an AI sourcing analyst for an internal recruitment OS (6Degrees).
You receive multiple public web snippets about a single person.

**IMPORTANT: You may be analyzing GitHub profiles, portfolio sites, or other tech platforms.**
**These are NOT resumes - they are scraped web content. Be flexible.**

**TASK:**
Extract a unified candidate persona from the evidence below.

**CRITICAL RULES:**
1. ONLY extract information EXPLICITLY stated in the evidence
2. DO NOT hallucinate or infer details not present
3. If a field is unclear or missing, use null/empty
4. Cite specific evidence for all claims
5. Be conservative - only include info you can directly cite

**INPUT EVIDENCE:**
${evidenceText}

**JOB CONTEXT (for reference):**
${input.jobContext}

**OUTPUT FORMAT:**
Return ONLY valid JSON (no markdown, no explanations) matching this schema:
{
  "name": "string",
  "headline": "string or null",
  "currentRole": {
    "title": "string or null",
    "company": "string or null",
    "startYear": number or null,
    "location": "string or null"
  },
  "pastRoles": [
    {
      "title": "string",
      "company": "string",
      "startYear": number or null,
      "endYear": number or null
    }
  ],
  "skills": ["array of skill strings"],
  "domains": ["array of domain strings like 'fintech', 'ml', etc"],
  "seniority": "string or null (junior/mid/senior/staff/principal/vp/c-level)",
  "location": "string or null",
  "evidence": [
    {
      "sourceUrl": "string",
      "snippet": "string (specific quote from evidence)"
    }
  ]
}

**SPECIAL INSTRUCTIONS:**
- If analyzing a GitHub profile, extract skills from repos, languages, and bio
- If analyzing a company bio, extract current role and background
- Focus on extracting ANY professional signals, even if incomplete.
    `;

    const responseText = await callOpenRouter(prompt);
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

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] Persona building failed:', error);
    }
    return null;
  }
}

/**
 * STEP 4: Compute alignment score using OpenRouter
 */
async function computeAlignmentScore(
  persona: CandidatePersona,
  jobContext: string
): Promise<AlignmentScore | null> {
  try {
    const prompt = `You are an AI recruitment scoring engine.

Given a candidate persona and job context, compute an alignment score (0-100) and breakdown by factors.

Return ONLY valid JSON (no markdown) matching this schema:
{
  "score": number (0-100),
  "confidence": number (0-1),
  "factors": {
    "skills": number (0-1),
    "experience": number (0-1),
    "domain": number (0-1),
    "seniority": number (0-1),
    "location": number (0-1)
  }
}

Candidate persona:
${JSON.stringify(persona, null, 2)}

Job context:
${jobContext}
    `;

    const responseText = await callOpenRouter(prompt);
    const alignment = JSON.parse(responseText) as AlignmentScore;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ Alignment score:', alignment.score, '/ 100');
      console.log('[Enrichment] Confidence:', alignment.confidence);
    }

    return alignment;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] Alignment scoring failed:', error);
    }
    return null;
  }
}

/**
 * AI-Powered Inference: Use OpenRouter to reason about candidate
 * even with minimal data. This is a fallback when scraping fails.
 */
async function inferPersonaWithAI(
  input: EnrichmentInput
): Promise<CandidatePersona | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Enrichment] 🧠 Using AI inference fallback (no scraped data available)');
  }

  try {
    const prompt = `You are an AI recruitment analyst. You need to make informed inferences about a candidate based on LIMITED information.

**What we know:**
- Name: ${input.fullName}
${input.linkedinUrl ? `- LinkedIn URL: ${input.linkedinUrl} (profile not accessible, but URL might give clues)` : ''}
${input.resumeText ? `- Resume/Bio text:\n${input.resumeText}` : ''}
- Target role context: ${input.jobContext}

**Your task:**
Make conservative inferences to build a minimal persona. Only include information you can reasonably infer.

**Output format:**
Return ONLY valid JSON (no markdown) matching this schema:
{
  "name": "string",
  "headline": "string or null",
  "currentRole": {
    "title": "string or null",
    "company": "string or null",
    "startYear": number or null,
    "location": "string or null"
  },
  "pastRoles": [],
  "skills": ["array of skill strings"],
  "domains": ["array of domain strings"],
  "seniority": "string or null",
  "location": "string or null",
  "evidence": []
}

**Output format:**
Return a structured persona with your best inferences. Be conservative - it's better to have fewer high-confidence fields than many low-confidence ones.`;

    const responseText = await callOpenRouter(prompt);
    const persona = JSON.parse(responseText) as CandidatePersona;

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

  // Safety check: persona should never be null here due to control flow above,
  // but TypeScript can't track this. Add explicit guard.
  if (!persona) {
    const metadata = calculateMetadata(evidence, null, true, wasAIInferred);
    return {
      status: 'manual_required',
      reason: 'insufficient_public_data',
      message: 'Unable to build candidate profile from available data.',
      metadata
    };
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

/**
 * Extended enrichment options for advanced profile building
 */
export interface ExtendedEnrichmentOptions {
  includeAdvanced?: boolean;
  quickMode?: boolean;
  githubUrl?: string;
  teamLinkedInUrls?: string[];
}

/**
 * Extended result type that includes advanced profile
 */
export type ExtendedEnrichmentResult = EnrichmentResult & {
  advancedProfile?: AdvancedCandidateProfile;
};

/**
 * ENHANCED ENRICHMENT: Basic enrichment + Advanced profile building
 *
 * This function runs the basic enrichment pipeline and optionally
 * builds an advanced profile with network analysis, behavioral signals,
 * and cited evidence.
 */
export async function enrichCandidateWithAdvanced(
  input: EnrichmentInput,
  candidateId: string,
  options: ExtendedEnrichmentOptions = {}
): Promise<ExtendedEnrichmentResult> {
  const {
    includeAdvanced = true,
    quickMode = false,
    githubUrl,
    teamLinkedInUrls = []
  } = options;

  if (process.env.NODE_ENV === 'development') {
    console.log('[Enrichment] ===== EXTENDED ENRICHMENT PIPELINE =====');
    console.log('[Enrichment] Include advanced:', includeAdvanced);
    console.log('[Enrichment] Quick mode:', quickMode);
  }

  // Run basic enrichment first
  const basicResult = await enrichCandidatePersona(input);

  // If basic enrichment failed or advanced is not requested, return early
  if (basicResult.status !== 'ok' || !includeAdvanced) {
    return basicResult;
  }

  // Build advanced profile
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Starting advanced profile enrichment...');
    }

    const advancedProfile = quickMode
      ? await quickEnrichment({
        candidateId,
        candidateName: input.fullName,
        linkedinUrl: input.linkedinUrl,
        githubUrl,
        resumeText: input.resumeText,
        evidenceSources: basicResult.rawEvidence,
        teamLinkedInUrls,
        previousProfileData: basicResult.persona.currentRole ? {
          title: basicResult.persona.currentRole.title ?? undefined,
          company: basicResult.persona.currentRole.company ?? undefined,
          location: basicResult.persona.currentRole.location ?? undefined,
        } : undefined
      })
      : await buildAdvancedProfile({
        candidateId,
        candidateName: input.fullName,
        linkedinUrl: input.linkedinUrl,
        githubUrl,
        resumeText: input.resumeText,
        evidenceSources: basicResult.rawEvidence,
        teamLinkedInUrls,
        previousProfileData: basicResult.persona.currentRole ? {
          title: basicResult.persona.currentRole.title ?? undefined,
          company: basicResult.persona.currentRole.company ?? undefined,
          location: basicResult.persona.currentRole.location ?? undefined,
        } : undefined
      });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ Advanced profile complete:', {
        hasNetwork: !!advancedProfile.networkGraph,
        hasBehavioral: !!advancedProfile.behavioralSignals,
        hasCited: !!advancedProfile.citedProfile,
        overallConfidence: advancedProfile.overallConfidence
      });
    }

    return {
      ...basicResult,
      advancedProfile
    };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] Advanced enrichment failed:', error);
    }

    // Return basic result even if advanced fails
    return basicResult;
  }
}

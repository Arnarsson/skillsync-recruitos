/**
 * Deep Research Service
 *
 * AI-powered discovery of non-obvious connections between people.
 * Uses BrightData SERP API for web searches and Gemini/OpenRouter for analysis.
 */

import { callOpenRouter } from './geminiService';
import {
  PATH_DISCOVERY_PROMPT,
  CO_APPEARANCE_SEARCH_PROMPT,
  generateCoAppearanceQuery,
  generateEventSearchQuery,
} from '@/lib/prompts/socialMatrix';
import type {
  AIClaimEntity,
  DeepResearchQuery,
  DeepResearchResult,
  DeepResearchJob,
  VerificationStatus,
} from '@/types/socialMatrix';

// ===== CONSTANTS =====

const CACHE_KEY_PREFIX = 'recruitos_deep_research_';
const JOBS_CACHE_KEY = 'recruitos_deep_research_jobs';

// Helper to safely get env vars (server-side only - no localStorage)
const getBrightDataKey = (): string | null => {
  return (typeof process !== 'undefined' && process.env) ? (process.env.BRIGHTDATA_API_KEY || null) : null;
};

// ===== SERP SEARCH =====

interface SerpResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Search using BrightData SERP API
 */
async function searchSerp(query: string): Promise<SerpResult[]> {
  const brightDataKey = getBrightDataKey();
  if (!brightDataKey) {
    console.warn('[DeepResearch] BrightData API key not configured');
    return [];
  }

  try {
    // Trigger SERP search
    const triggerResponse = await fetch('/api/brightdata?action=serp-trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BrightData-Key': brightDataKey,
      },
      body: JSON.stringify({ keyword: query }),
    });

    if (!triggerResponse.ok) {
      console.warn('[DeepResearch] SERP trigger failed:', triggerResponse.status);
      return [];
    }

    const { snapshot_id } = await triggerResponse.json();
    if (!snapshot_id) return [];

    // Poll for results
    const maxAttempts = 15;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const progressResponse = await fetch(
        `/api/brightdata?action=progress&snapshot_id=${snapshot_id}`,
        { headers: { 'X-BrightData-Key': brightDataKey } }
      );

      if (!progressResponse.ok) break;

      const progress = await progressResponse.json();

      if (progress.status === 'ready' && progress.records > 0) {
        const snapshotResponse = await fetch(
          `/api/brightdata?action=snapshot&snapshot_id=${snapshot_id}`,
          { headers: { 'X-BrightData-Key': brightDataKey } }
        );

        if (snapshotResponse.ok) {
          const serpData = await snapshotResponse.json();
          const results: SerpResult[] = [];

          for (const item of serpData) {
            if (item.organic_results) {
              for (const result of item.organic_results) {
                results.push({
                  title: result.title || '',
                  url: result.url || '',
                  snippet: result.snippet || '',
                });
              }
            }
          }

          return results;
        }
        break;
      } else if (progress.status === 'failed') {
        break;
      }
    }

    return [];
  } catch (error) {
    console.error('[DeepResearch] SERP search error:', error);
    return [];
  }
}

// ===== AI ANALYSIS =====

/**
 * Parse AI response to extract claims
 */
function parseAIClaims(responseText: string): AIClaimEntity[] {
  try {
    // Try to extract JSON from response
    let jsonString = responseText.trim();

    // Handle markdown code blocks
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // Find JSON object
    const startIndex = jsonString.indexOf('{');
    const endIndex = jsonString.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      jsonString = jsonString.substring(startIndex, endIndex + 1);
    }

    const data = JSON.parse(jsonString);
    const discoveries = data.discoveries || data.coAppearances || [];

    return discoveries.map((d: Record<string, unknown>, index: number) => ({
      id: `claim-${Date.now()}-${index}`,
      type: (d.type || d.eventType || 'connection') as AIClaimEntity['type'],
      claim: (d.claim || d.eventName || '') as string,
      sourceUrl: (d.sourceUrl || '') as string,
      sourceType: determineSourceType(d.sourceUrl as string),
      extractedText: (d.extractedText || d.reasoning || '') as string,
      entities: (d.entities || {}) as AIClaimEntity['entities'],
      confidence: (typeof d.confidence === 'number' ? d.confidence : 0.5),
      verificationStatus: 'unverified' as VerificationStatus,
    }));
  } catch (error) {
    console.error('[DeepResearch] Failed to parse AI response:', error);
    return [];
  }
}

function determineSourceType(url: string): AIClaimEntity['sourceType'] {
  if (!url) return 'serp';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('github.com')) return 'github';
  if (url.includes('youtube.com') || url.includes('spotify.com')) return 'podcast';
  if (url.includes('meetup.com') || url.includes('eventbrite.com')) return 'conference';
  if (url.includes('medium.com') || url.includes('dev.to') || url.includes('substack.com')) return 'publication';
  return 'serp';
}

// ===== MAIN RESEARCH FUNCTIONS =====

/**
 * Search for co-appearances between two people
 */
export async function searchCoAppearances(
  personA: string,
  personB: string,
  context?: string
): Promise<AIClaimEntity[]> {
  console.log('[DeepResearch] Searching co-appearances:', personA, personB);

  // Generate search queries
  const queries = [
    generateCoAppearanceQuery(personA, personB, context),
    generateEventSearchQuery(personA, personB),
  ];

  const allResults: SerpResult[] = [];

  // Execute searches in parallel
  const searchPromises = queries.map(q => searchSerp(q));
  const searchResults = await Promise.all(searchPromises);
  searchResults.forEach(results => allResults.push(...results));

  if (allResults.length === 0) {
    console.log('[DeepResearch] No SERP results found');
    return [];
  }

  // Analyze results with AI
  const prompt = CO_APPEARANCE_SEARCH_PROMPT
    .replace('{personA}', personA)
    .replace('{personB}', personB)
    .replace('{searchResults}', JSON.stringify(allResults.slice(0, 20), null, 2));

  try {
    const responseText = await callOpenRouter(prompt);
    return parseAIClaims(responseText);
  } catch (error) {
    console.error('[DeepResearch] AI analysis failed:', error);
    return [];
  }
}

/**
 * Extract relationships from a URL
 */
export async function extractRelationships(url: string): Promise<{
  names: string[];
  relationships: Array<{ personA: string; personB: string; context: string }>;
}> {
  // This would need web scraping capability
  // For now, return empty as we'd need to integrate with a scraping service
  console.log('[DeepResearch] extractRelationships not yet implemented for:', url);
  return { names: [], relationships: [] };
}

/**
 * Full AI-powered research for connection paths
 */
export async function aiResearch(
  query: DeepResearchQuery
): Promise<DeepResearchResult> {
  const startTime = Date.now();
  console.log('[DeepResearch] Starting AI research:', query);

  const allDiscoveries: AIClaimEntity[] = [];
  const allSources: string[] = [];
  const searchQueries: string[] = [];

  // Build person data strings
  const personAData = [
    query.personA.name,
    query.personA.company && `works at ${query.personA.company}`,
    query.personA.linkedinUrl,
    query.personA.githubUsername && `GitHub: ${query.personA.githubUsername}`,
  ].filter(Boolean).join(', ');

  const personBData = [
    query.personB.name,
    query.personB.company && `works at ${query.personB.company}`,
    query.personB.linkedinUrl,
    query.personB.githubUsername && `GitHub: ${query.personB.githubUsername}`,
  ].filter(Boolean).join(', ');

  // Search for co-appearances
  const coAppearances = await searchCoAppearances(
    query.personA.name,
    query.personB.name,
    query.personA.company || query.personB.company
  );
  allDiscoveries.push(...coAppearances);

  // If deep search, do additional queries
  if (query.searchDepth === 'deep') {
    // Search by company connections
    if (query.personA.company && query.personB.company) {
      const companyQuery = `"${query.personA.company}" "${query.personB.company}" connection OR partnership`;
      searchQueries.push(companyQuery);
      const companyResults = await searchSerp(companyQuery);
      allSources.push(...companyResults.map(r => r.url));
    }

    // Search tech community mentions
    const techQuery = `"${query.personA.name}" OR "${query.personB.name}" tech conference speaker`;
    searchQueries.push(techQuery);
    const techResults = await searchSerp(techQuery);
    allSources.push(...techResults.map(r => r.url));
  }

  // Use AI to discover additional paths
  const discoveryPrompt = PATH_DISCOVERY_PROMPT
    .replace('{personAData}', personAData)
    .replace('{personBData}', personBData)
    .replace('{searchResults}', JSON.stringify(allSources.slice(0, 10), null, 2));

  try {
    const responseText = await callOpenRouter(discoveryPrompt);
    const aiDiscoveries = parseAIClaims(responseText);
    allDiscoveries.push(...aiDiscoveries);
  } catch (error) {
    console.warn('[DeepResearch] AI path discovery failed:', error);
  }

  // Deduplicate discoveries
  const uniqueDiscoveries = allDiscoveries.filter((d, i, arr) =>
    arr.findIndex(x => x.claim === d.claim && x.sourceUrl === d.sourceUrl) === i
  );

  // Calculate overall confidence
  const avgConfidence = uniqueDiscoveries.length > 0
    ? uniqueDiscoveries.reduce((sum, d) => sum + d.confidence, 0) / uniqueDiscoveries.length
    : 0;

  return {
    discoveries: uniqueDiscoveries,
    sources: [...new Set(allSources)],
    confidence: avgConfidence,
    searchQueries,
    processingTimeMs: Date.now() - startTime,
  };
}

// ===== JOB MANAGEMENT =====

/**
 * Create a deep research job (for async processing)
 */
export function createResearchJob(query: DeepResearchQuery): DeepResearchJob {
  const job: DeepResearchJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    query,
    createdAt: new Date().toISOString(),
  };

  // Save to localStorage
  if (typeof window !== 'undefined') {
    const jobs = getResearchJobs();
    jobs.push(job);
    localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(jobs));
  }

  return job;
}

/**
 * Get all research jobs
 */
export function getResearchJobs(): DeepResearchJob[] {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem(JOBS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

/**
 * Get a specific research job
 */
export function getResearchJob(jobId: string): DeepResearchJob | null {
  const jobs = getResearchJobs();
  return jobs.find(j => j.id === jobId) || null;
}

/**
 * Update a research job
 */
export function updateResearchJob(
  jobId: string,
  updates: Partial<Pick<DeepResearchJob, 'status' | 'result' | 'error' | 'completedAt'>>
): void {
  if (typeof window === 'undefined') return;

  const jobs = getResearchJobs();
  const index = jobs.findIndex(j => j.id === jobId);

  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(jobs));
  }
}

/**
 * Execute a research job (should be called from API route or background process)
 */
export async function executeResearchJob(jobId: string): Promise<void> {
  const job = getResearchJob(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  updateResearchJob(jobId, { status: 'processing' });

  try {
    const result = await aiResearch(job.query);
    updateResearchJob(jobId, {
      status: 'completed',
      result,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    updateResearchJob(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      completedAt: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Clear old research jobs (older than 7 days)
 */
export function cleanupOldJobs(): void {
  if (typeof window === 'undefined') return;

  const jobs = getResearchJobs();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const filteredJobs = jobs.filter(j => new Date(j.createdAt) > sevenDaysAgo);
  localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(filteredJobs));
}

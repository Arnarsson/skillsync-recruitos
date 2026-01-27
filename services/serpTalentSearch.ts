/**
 * SERP Talent Search Service
 *
 * Finds technical talent through web search for niche/specific queries
 * where GitHub and LinkedIn might not have coverage.
 *
 * Use cases:
 * - Highly specialized technical domains (e.g., "nanofabrication", "quantum computing")
 * - Academic/research profiles
 * - Company team pages
 * - Technical blog authors and open source contributors
 */

import { callOpenRouter } from './geminiService';

// ===== TYPES =====

export interface SerpTalentResult {
  id: string;
  name: string;
  headline?: string;
  avatar?: string;
  location?: string;
  profileUrl: string;
  source: 'serp';
  sourceType: 'linkedin' | 'github' | 'academic' | 'company' | 'blog' | 'other';
  snippet: string;
  skills?: string[];
  company?: string;
  relevanceScore: number;
}

interface RawSerpResult {
  title: string;
  url: string;
  snippet: string;
}

interface ProfileExtraction {
  name: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  skills: string[];
  relevance: number;
  sourceType: 'linkedin' | 'github' | 'academic' | 'company' | 'blog' | 'other';
}

// ===== HELPERS =====

/**
 * Get BrightData API key from env or localStorage
 */
function getBrightDataKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('BRIGHTDATA_API_KEY') || null;
  }
  return process.env.BRIGHTDATA_API_KEY || null;
}

/**
 * Determine source type from URL
 */
function determineSourceType(url: string): SerpTalentResult['sourceType'] {
  const lower = url.toLowerCase();
  
  if (lower.includes('linkedin.com/in/')) return 'linkedin';
  if (lower.includes('github.com/') && !lower.includes('/repos')) return 'github';
  if (lower.includes('scholar.google') || lower.includes('researchgate.net') || 
      lower.includes('.edu/') || lower.includes('orcid.org')) return 'academic';
  if (lower.includes('/team') || lower.includes('/about') || 
      lower.includes('/people') || lower.includes('/our-team')) return 'company';
  if (lower.includes('medium.com') || lower.includes('dev.to') || 
      lower.includes('substack.com') || lower.includes('blog')) return 'blog';
  
  return 'other';
}

/**
 * Execute SERP search using BrightData
 */
async function executeSerpSearch(query: string): Promise<RawSerpResult[]> {
  const brightDataKey = getBrightDataKey();
  if (!brightDataKey) {
    console.warn('[SerpTalentSearch] BrightData API key not configured');
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
      console.warn('[SerpTalentSearch] SERP trigger failed:', triggerResponse.status);
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
          const results: RawSerpResult[] = [];

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
    console.error('[SerpTalentSearch] SERP search error:', error);
    return [];
  }
}

/**
 * Use AI to extract profile information from SERP results
 */
async function extractProfilesWithAI(
  results: RawSerpResult[],
  originalQuery: string
): Promise<ProfileExtraction[]> {
  const prompt = `You are analyzing web search results to find technical talent.

Original search query: "${originalQuery}"

Search results:
${JSON.stringify(results.slice(0, 15), null, 2)}

For each result that appears to be a person's profile or mentions a specific technical expert, extract:
- name: The person's full name
- headline: Their role/title (if mentioned)
- company: Current company (if mentioned)
- location: Location (if mentioned)
- skills: Array of relevant technical skills mentioned (related to the query)
- relevance: Score 0-1 indicating how well they match the query
- sourceType: 'linkedin' | 'github' | 'academic' | 'company' | 'blog' | 'other'

Return ONLY valid JSON array:
[
  {
    "name": "John Doe",
    "headline": "Senior Nanofabrication Engineer",
    "company": "Technical University of Denmark",
    "location": "Copenhagen",
    "skills": ["nanofabrication", "electron-beam lithography", "thin films"],
    "relevance": 0.95,
    "sourceType": "academic"
  }
]

Requirements:
- ONLY include results about specific people (not companies or generic pages)
- Filter out job postings, news articles without expert mentions
- Prioritize academic profiles, LinkedIn, GitHub, company team pages
- Include at most 10 profiles
- Return empty array [] if no suitable profiles found`;

  try {
    const responseText = await callOpenRouter(prompt);
    
    // Extract JSON from response
    let jsonString = responseText.trim();
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    const profiles = JSON.parse(jsonString);
    return Array.isArray(profiles) ? profiles : [];
  } catch (error) {
    console.error('[SerpTalentSearch] AI extraction failed:', error);
    return [];
  }
}

/**
 * Generate optimized search queries for talent discovery
 */
function generateTalentQueries(query: string, location?: string): string[] {
  const queries: string[] = [];
  
  // Base query
  queries.push(query);
  
  // With location if provided
  if (location) {
    queries.push(`${query} ${location}`);
  }
  
  // LinkedIn-specific
  queries.push(`site:linkedin.com/in/ ${query}`);
  
  // Academic/research-specific
  queries.push(`${query} researcher OR scientist OR professor`);
  
  // GitHub-specific (for niche technologies)
  queries.push(`site:github.com ${query} developer`);
  
  // Company team pages
  queries.push(`${query} expert OR engineer "team" OR "our people"`);
  
  return queries;
}

// ===== MAIN API =====

/**
 * Search for technical talent using SERP
 * 
 * Best for niche/specialized queries where GitHub/LinkedIn have limited coverage
 */
export async function searchTalentViaSERP(
  query: string,
  options: {
    location?: string;
    maxResults?: number;
  } = {}
): Promise<SerpTalentResult[]> {
  const { location, maxResults = 10 } = options;
  
  console.log('[SerpTalentSearch] Starting search:', query, options);
  
  // Generate search queries
  const searchQueries = generateTalentQueries(query, location);
  
  // Execute searches (first 2 queries to avoid rate limits)
  const allRawResults: RawSerpResult[] = [];
  
  for (const searchQuery of searchQueries.slice(0, 2)) {
    const results = await executeSerpSearch(searchQuery);
    allRawResults.push(...results);
  }
  
  if (allRawResults.length === 0) {
    console.log('[SerpTalentSearch] No SERP results found');
    return [];
  }
  
  // Deduplicate by URL
  const uniqueResults = Array.from(
    new Map(allRawResults.map(r => [r.url, r])).values()
  );
  
  // Extract profiles using AI
  const profiles = await extractProfilesWithAI(uniqueResults, query);
  
  // Convert to SerpTalentResult format
  const talents: SerpTalentResult[] = [];
  
  for (let i = 0; i < profiles.length && i < maxResults; i++) {
    const profile = profiles[i];
    const rawResult = uniqueResults.find(r => 
      r.snippet.includes(profile.name || '') || 
      r.title.includes(profile.name || '')
    );
    
    if (!profile.name || !rawResult) continue;
    
    talents.push({
      id: `serp-${Date.now()}-${i}`,
      name: profile.name,
      headline: profile.headline || undefined,
      location: profile.location || undefined,
      profileUrl: rawResult.url,
      source: 'serp',
      sourceType: profile.sourceType,
      snippet: rawResult.snippet,
      skills: profile.skills,
      company: profile.company || undefined,
      relevanceScore: Math.round(profile.relevance * 100),
    });
  }
  
  // Sort by relevance
  talents.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  console.log(`[SerpTalentSearch] Found ${talents.length} profiles`);
  return talents;
}

/**
 * Quick check if query is likely to benefit from SERP search
 * 
 * Returns true for:
 * - Highly specialized technical terms
 * - Academic/research domains
 * - Emerging technologies
 */
export function shouldUseSerpSearch(query: string): boolean {
  const lower = query.toLowerCase();
  
  // Specialized technical domains
  const nicheKeywords = [
    'nanofabrication', 'quantum', 'photonics', 'cryogenic',
    'plasma', 'semiconductor', 'mems', 'microfluidics',
    'bioinformatics', 'computational biology', 'cryo-em',
    'electron microscopy', 'mass spectrometry', 'spectroscopy',
    'laser', 'optics', 'materials science', 'nanotechnology',
    'superconductor', 'topological', 'spintronics',
  ];
  
  // Academic indicators
  const academicKeywords = [
    'researcher', 'scientist', 'professor', 'phd', 'postdoc',
    'research', 'laboratory', 'university',
  ];
  
  return nicheKeywords.some(kw => lower.includes(kw)) ||
         academicKeywords.some(kw => lower.includes(kw));
}

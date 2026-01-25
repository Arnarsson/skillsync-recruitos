 
/**
 * ⚠️ LEGACY SERVICE - Use enrichmentServiceV2.ts for new code
 * 
 * This service is kept for backward compatibility with scrapingService.ts fallback flow.
 * New enrichment should use enrichmentServiceV2.ts which has better architecture.
 * 
 * Profile Enrichment Service
 *
 * When LinkedIn profiles are sparse (missing experience/skills), this service:
 * 1. Uses SERP API to find alternative public sources (company bios, GitHub, personal sites)
 * 2. Uses Web Scraper API to extract raw HTML/text from those sources
 * 3. Uses Gemini AI to reason over messy text and extract structured profile
 * 4. Returns enriched profile data to merge with LinkedIn
 *
 * Architecture:
 * - Bright Data = Data acquisition layer (SERP + Web Scraper)
 * - Gemini = Reasoning layer (turn messy text into structured profile)
 */

import { callOpenRouter } from './geminiService';

export interface EnrichedExperience {
  title: string;
  company: string;
  startYear?: number;
  endYear?: number | 'present';
  description?: string;
}

export interface EnrichedProfile {
  experiences: EnrichedExperience[];
  skills: string[];
  about?: string;
  evidenceUrls: string[]; // Sources we found data from
  enrichmentSources: string[]; // Human-readable source names
}

interface SERPResult {
  title: string;
  url: string;
  snippet: string;
}

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

/**
 * Filter SERP results to promising URLs for profile data
 */
const filterPromisingSources = (results: SERPResult[]): string[] => {
  const promising: string[] = [];

  const goodPatterns = [
    /github\.com\/[^/]+$/i,           // GitHub profiles
    /about|team|people|staff/i,       // Company about/team pages
    /bio|profile|speaker/i,           // Personal bios, speaker pages
    /portfolio|website/i,             // Personal websites
    /linkedin\.com\/in\//i,           // LinkedIn (backup)
    /medium\.com\/@/i,                // Medium profiles
    /dev\.to\//i,                     // Dev.to profiles
    /stackoverflow\.com\/users/i      // Stack Overflow profiles
  ];

  const badPatterns = [
    /facebook\.com/i,
    /twitter\.com/i,
    /instagram\.com/i,
    /tiktok\.com/i,
    /youtube\.com/i,
    /pinterest\.com/i,
    /pdf$/i,                          // PDF files
    /\.(jpg|png|gif|svg)$/i          // Image files
  ];

  for (const result of results) {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();
    // const snippet = result.snippet.toLowerCase();

    // Skip bad patterns
    if (badPatterns.some(pattern => pattern.test(url))) {
      continue;
    }

    // Prioritize good patterns
    if (goodPatterns.some(pattern => pattern.test(url) || pattern.test(title))) {
      promising.push(result.url);
    }
  }

  // Return top 5 most promising URLs
  return promising.slice(0, 5);
};

/**
 * REASONING LAYER: Use OpenRouter to structure messy web snippets into clean profile
 * This is where AI adds value - not hallucinating, but organizing real data
 */
const deepEnrichWithAI = async (snippets: Array<{ url: string; text: string }>): Promise<EnrichedProfile | null> => {
  // Check for OpenRouter API key
  const openRouterKey = localStorage.getItem('OPENROUTER_API_KEY') ||
    (typeof process !== 'undefined' && process.env ? process.env.OPENROUTER_API_KEY : undefined);

  if (!openRouterKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Enrichment] OpenRouter API key not available for AI enrichment');
    }
    return null;
  }

  try {
    // Concatenate all snippets with source attribution
    const combinedText = snippets
      .map(s => `[Source: ${s.url}]\n${s.text.substring(0, 2000)}`)
      .join('\n\n---\n\n')
      .substring(0, 15000); // Limit total input

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Calling OpenRouter to structure', snippets.length, 'text snippets');
      console.log('[Enrichment] Combined text length:', combinedText.length, 'chars');
    }

    const prompt = `
You are an expert sourcing agent. Given web snippets about a candidate, extract a structured profile.

**CRITICAL CONSTRAINTS:**
- ONLY extract information EXPLICITLY stated in the text
- DO NOT hallucinate or infer details not present
- If a field is unclear or missing, return null/empty
- Include source evidence for all claims

**Input: Raw web snippets**
${combinedText}

**Your task:**
Extract structured profile data. Be conservative - only include info you can directly cite.

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "name": "string or null",
  "current_role": {
    "title": "string or null",
    "company": "string or null",
    "start_year": number or null,
    "location": "string or null"
  },
  "past_roles": [
    {
      "title": "string",
      "company": "string",
      "start_year": number or null,
      "end_year": number or null
    }
  ],
  "skills": ["array of skill strings"],
  "seniority": "string or null"
}
    `;

    const responseText = await callOpenRouter(prompt);

    // Parse JSON from response (handle potential markdown wrapping)
    let structuredData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      structuredData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch (parseError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Enrichment] Failed to parse OpenRouter response:', parseError);
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] OpenRouter extracted:', {
        name: structuredData.name,
        currentRole: structuredData.current_role?.title,
        pastRoles: structuredData.past_roles?.length || 0,
        skills: structuredData.skills?.length || 0
      });
    }

    // Convert OpenRouter output to EnrichedProfile format
    const enriched: EnrichedProfile = {
      experiences: [],
      skills: structuredData.skills || [],
      evidenceUrls: snippets.map(s => s.url),
      enrichmentSources: ['AI-structured from web sources (OpenRouter)']
    };

    // Add current role
    if (structuredData.current_role?.title && structuredData.current_role?.company) {
      enriched.experiences.push({
        title: structuredData.current_role.title,
        company: structuredData.current_role.company,
        startYear: structuredData.current_role.start_year,
        endYear: 'present'
      });
    }

    // Add past roles
    if (structuredData.past_roles && Array.isArray(structuredData.past_roles)) {
      for (const role of structuredData.past_roles) {
        if (role.title && role.company) {
          enriched.experiences.push({
            title: role.title,
            company: role.company,
            startYear: role.start_year,
            endYear: role.end_year
          });
        }
      }
    }

    // Validate we have minimal usable data
    const hasUsableData = enriched.experiences.length > 0 || enriched.skills.length >= 3;

    if (!hasUsableData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] OpenRouter found insufficient data in snippets');
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ✅ AI enrichment successful via OpenRouter');
    }

    return enriched;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] AI enrichment failed:', error);
    }
    return null;
  }
};

/**
 * FALLBACK: Simple regex extraction from scraped HTML/text
 * Used if AI enrichment unavailable
 */
const extractDataFromScrapedContent = (content: string, sourceUrl: string): Partial<EnrichedProfile> => {
  const extracted: Partial<EnrichedProfile> = {
    experiences: [],
    skills: [],
    evidenceUrls: [sourceUrl]
  };

  // Normalize content
  const text = content.toLowerCase();

  // ==== EXPERIENCE EXTRACTION ====

  // Pattern 1: "John is a Senior Engineer at ACME"
  const isAtPattern = /(?:is|works as|currently|serves as)\s+(?:a|an)?\s*([^.]+?)\s+at\s+([^,.]+)/gi;
  let match;
  while ((match = isAtPattern.exec(text)) !== null) {
    const title = match[1].trim();
    const company = match[2].trim();

    if (title.length > 3 && title.length < 100 && company.length > 2) {
      extracted.experiences?.push({
        title: title,
        company: company,
        endYear: 'present'
      });
    }
  }

  // Pattern 2: Job titles with common keywords
  const jobTitleKeywords = [
    'engineer', 'developer', 'architect', 'manager', 'director', 'vp', 'cto', 'ceo', 'founder',
    'lead', 'senior', 'principal', 'staff', 'head of', 'chief'
  ];

  for (const keyword of jobTitleKeywords) {
    const regex = new RegExp(`([^.]*?${keyword}[^.]*?)\\s+at\\s+([^,.]+)`, 'gi');
    while ((match = regex.exec(text)) !== null) {
      const title = match[1].trim();
      const company = match[2].trim();

      if (title.length > 5 && title.length < 100 && company.length > 2) {
        // Avoid duplicates
        const isDuplicate = extracted.experiences?.some(exp =>
          exp.title.toLowerCase() === title && exp.company.toLowerCase() === company
        );

        if (!isDuplicate) {
          extracted.experiences?.push({
            title: title,
            company: company
          });
        }
      }
    }
  }

  // ==== SKILLS EXTRACTION ====

  /**
   * Escape special regex characters to prevent crashes
   * Fixes: "C++" causing "Invalid regular expression: /\bc++\b/i: Nothing to repeat"
   */
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Common tech skills to look for
  const techSkills = [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'golang', 'go', 'rust', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
    // Frontend
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'next.js', 'html', 'css', 'tailwind',
    // Backend
    'node.js', 'nodejs', 'express', 'fastapi', 'django', 'flask', 'spring', 'rails',
    // Databases
    'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
    // Cloud / Infra
    'aws', 'azure', 'gcp', 'google cloud', 'kubernetes', 'docker', 'terraform', 'jenkins', 'ci/cd',
    // Domains
    'machine learning', 'ml', 'ai', 'artificial intelligence', 'data science', 'blockchain', 'fintech',
    'distributed systems', 'microservices', 'devops', 'security', 'api', 'rest', 'graphql'
  ];

  for (const skill of techSkills) {
    try {
      // Use word boundaries to avoid false positives
      // Escape special regex characters (e.g., C++ becomes C\+\+)
      const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
      if (regex.test(text)) {
        extracted.skills?.push(skill);
      }
    } catch (error) {
      // Silently skip invalid regex patterns
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Enrichment] Skipping skill pattern "${skill}":`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  // ==== ABOUT EXTRACTION (first paragraph with bio keywords) ====

  const bioKeywords = ['specializes in', 'expert in', 'focuses on', 'passionate about', 'experience in'];
  const paragraphs = content.split(/\n\n|\n/).filter(p => p.length > 50 && p.length < 500);

  for (const para of paragraphs) {
    if (bioKeywords.some(kw => para.toLowerCase().includes(kw))) {
      extracted.about = para.trim().substring(0, 300);
      break;
    }
  }

  return extracted;
};

/**
 * Main enrichment function: searches web and extracts profile data
 */
export const enrichSparseProfile = async (candidate: {
  fullName: string;
  linkedinUrl?: string;
  currentCompany?: string;
  locationHint?: string;
}): Promise<EnrichedProfile | null> => {

  // Get API keys (check localStorage first, then env vars)
  const serpApiKey = localStorage.getItem('SERP_API_KEY') || getEnv('SERP_API_KEY');
  const brightDataKey = localStorage.getItem('BRIGHTDATA_API_KEY') || getEnv('BRIGHTDATA_API_KEY');

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] ===== PROFILE ENRICHMENT PIPELINE =====');
      console.log('[Enrichment] Target:', candidate.fullName);
      console.log('[Enrichment] Company hint:', candidate.currentCompany || 'none');
      console.log('[Enrichment] SERP API available:', !!serpApiKey);
      console.log('[Enrichment] BrightData API available:', !!brightDataKey);
    }

    // ==== STEP 0: Try common profile URLs directly (no SERP needed) ====
    const promisingUrls: string[] = [];

    // Build common URL patterns
    const nameParts = candidate.fullName.toLowerCase().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    const fullNameSlug = nameParts.join('-');
    const firstLast = `${firstName}-${lastName}`;

    // Try common patterns
    const commonUrls = [
      `https://github.com/${firstName}${lastName}`,
      `https://github.com/${firstLast}`,
      `https://github.com/${fullNameSlug}`,
      candidate.currentCompany ? `https://${candidate.currentCompany.toLowerCase().replace(/\s+/g, '')}.com/team` : null,
      candidate.currentCompany ? `https://${candidate.currentCompany.toLowerCase().replace(/\s+/g, '')}.com/about` : null,
    ].filter(Boolean) as string[];

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Trying common URL patterns:', commonUrls.length);
    }

    promisingUrls.push(...commonUrls);

    // ==== STEP 1: SERP API - Find alternative sources (if available) ====

    if (serpApiKey) {

      const queries = [
        // Query 1: Name + company (if known)
        candidate.currentCompany
          ? `"${candidate.fullName}" "${candidate.currentCompany}"`
          : `"${candidate.fullName}" developer engineer`,

        // Query 2: Name + common profile sites
        `"${candidate.fullName}" (GitHub OR portfolio OR bio)`,

        // Query 3: Name + location (if known)
        candidate.locationHint
          ? `"${candidate.fullName}" "${candidate.locationHint}" profile`
          : null
      ].filter(Boolean);

      const allResults: SERPResult[] = [];

      for (const query of queries) {
        if (!query) continue;

        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] SERP query:', query);
        }

        try {
          // Use Bright Data SERP API (datasets format, not simple GET)
          // Trigger SERP scrape
          const triggerResponse = await fetch('/api/brightdata?action=serp-trigger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-BrightData-Key': brightDataKey || serpApiKey
            },
            body: JSON.stringify({ keyword: query })
          });

          if (triggerResponse.ok) {
            const triggerData = await triggerResponse.json();
            const snapshotId = triggerData.snapshot_id;

            if (snapshotId) {
              // Poll for results (max 30 seconds)
              const maxAttempts = 15;
              const pollInterval = 2000;

              for (let attempt = 0; attempt < maxAttempts; attempt++) {
                await new Promise(resolve => setTimeout(resolve, pollInterval));

                const progressResponse = await fetch(
                  `/api/brightdata?action=progress&snapshot_id=${snapshotId}`,
                  {
                    headers: {
                      'X-BrightData-Key': brightDataKey || serpApiKey
                    }
                  }
                );

                if (progressResponse.ok) {
                  const progress = await progressResponse.json();

                  if (progress.status === 'ready' && progress.records > 0) {
                    // Get snapshot data
                    const snapshotResponse = await fetch(
                      `/api/brightdata?action=snapshot&snapshot_id=${snapshotId}`,
                      {
                        headers: {
                          'X-BrightData-Key': brightDataKey || serpApiKey
                        }
                      }
                    );

                    if (snapshotResponse.ok) {
                      const serpData = await snapshotResponse.json();

                      // Parse SERP results from dataset
                      for (const item of serpData) {
                        if (item.organic_results) {
                          for (const result of item.organic_results) {
                            allResults.push({
                              title: result.title || '',
                              url: result.url || result.link || '',
                              snippet: result.snippet || result.description || ''
                            });
                          }
                        }
                      }

                      if (process.env.NODE_ENV === 'development') {
                        console.log('[Enrichment] Found', allResults.length, 'SERP results for:', query);
                      }
                    }
                    break;
                  } else if (progress.status === 'failed') {
                    break;
                  }
                }
              }
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Enrichment] SERP query failed:', error);
          }
        }
      }

      // ==== STEP 2: Filter SERP results for promising URLs ====

      if (allResults.length > 0) {
        const serpUrls = filterPromisingSources(allResults);
        promisingUrls.push(...serpUrls);

        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] Added', serpUrls.length, 'promising URLs from SERP');
        }
      }

    } else {
      // No SERP API - rely on common URL patterns
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] No SERP API - using common URL patterns only');
      }
    }

    if (promisingUrls.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] No promising URLs to try');
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Total promising URLs to try:', promisingUrls.length);
      console.log('[Enrichment] URLs:', promisingUrls);
    }

    // ==== STEP 3: Scrape promising URLs (Data Acquisition) ====

    const scrapedSnippets: Array<{ url: string; text: string }> = [];

    for (const url of promisingUrls) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Enrichment] Scraping:', url);
        }

        // Use Web Scraper API (generic scraper)
        let content = '';

        if (brightDataKey) {
          // Use Bright Data Web Scraper via proxy
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
            content = scrapeData.content || scrapeData.text || scrapeData.markdown || '';
          }
        }

        // Note: No browser-side fetch fallback to avoid CSP violations
        // All external requests must go through /api/brightdata proxy

        if (content && content.length > 100) {
          // Clean HTML more thoroughly for GitHub and other pages
          let cleaned = content;

          // Remove script and style tags with their content
          cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
          cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

          // Remove HTML comments
          cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

          // Remove common boilerplate patterns from GitHub
          cleaned = cleaned.replace(/Sign in.*?Sign up/gi, '');
          cleaned = cleaned.replace(/Jump to.*?navigation/gi, '');
          cleaned = cleaned.replace(/Terms.*?Privacy.*?Security/gi, '');

          // Strip remaining HTML tags
          cleaned = cleaned.replace(/<[^>]*>/g, ' ');

          // Collapse multiple spaces/newlines into single spaces
          cleaned = cleaned.replace(/\s+/g, ' ').trim();

          const textOnly = cleaned;

          scrapedSnippets.push({
            url,
            text: textOnly
          });

          if (process.env.NODE_ENV === 'development') {
            console.log('[Enrichment] Scraped', textOnly.length, 'chars from:', url);
          }
        }

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Enrichment] Failed to scrape', url, ':', error);
        }
      }
    }

    if (scrapedSnippets.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] No content scraped from any URL');
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] Successfully scraped', scrapedSnippets.length, 'sources');
    }

    // ==== STEP 4: AI Reasoning Layer - Structure messy text ====

    // Try AI enrichment first (better quality)
    const aiEnriched = await deepEnrichWithAI(scrapedSnippets);

    if (aiEnriched) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] ✅ Using AI-structured profile');
      }
      return aiEnriched;
    }

    // Fallback: Regex extraction if AI unavailable
    if (process.env.NODE_ENV === 'development') {
      console.log('[Enrichment] AI enrichment unavailable, falling back to regex extraction');
    }

    const enriched: EnrichedProfile = {
      experiences: [],
      skills: [],
      evidenceUrls: [],
      enrichmentSources: []
    };

    for (const snippet of scrapedSnippets) {
      const extracted = extractDataFromScrapedContent(snippet.text, snippet.url);

      // Merge experiences (avoid duplicates)
      for (const exp of extracted.experiences || []) {
        const isDuplicate = enriched.experiences.some(e =>
          e.title.toLowerCase() === exp.title.toLowerCase() &&
          e.company.toLowerCase() === exp.company.toLowerCase()
        );
        if (!isDuplicate) {
          enriched.experiences.push(exp);
        }
      }

      // Merge skills (dedupe)
      enriched.skills = Array.from(new Set([
        ...enriched.skills,
        ...(extracted.skills || [])
      ]));

      // Track source
      if (extracted.experiences?.length || extracted.skills?.length) {
        enriched.evidenceUrls.push(snippet.url);

        // Human-readable source name
        const sourceName = snippet.url.includes('github.com') ? 'GitHub' :
          snippet.url.includes('about') || snippet.url.includes('team') ? 'Company Bio' :
            snippet.url.includes('linkedin') ? 'LinkedIn' :
              'Public Profile';

        if (!enriched.enrichmentSources.includes(sourceName)) {
          enriched.enrichmentSources.push(sourceName);
        }
      }

      // Use first good about section
      if (!enriched.about && extracted.about) {
        enriched.about = extracted.about;
      }
    }

    // ==== STEP 4: Return enriched data if we found anything useful ====

    const hasUsefulData = enriched.experiences.length > 0 || enriched.skills.length > 0;

    if (hasUsefulData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] ✅ SUCCESS - Enriched profile:');
        console.log('[Enrichment] - Experiences:', enriched.experiences.length);
        console.log('[Enrichment] - Skills:', enriched.skills.length);
        console.log('[Enrichment] - Sources:', enriched.enrichmentSources.join(', '));
      }

      return enriched;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Enrichment] ❌ No useful data found from web sources');
      }
      return null;
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Enrichment] Pipeline error:', error);
    }
    return null;
  }
};

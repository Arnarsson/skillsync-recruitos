/**
 * External data fetchers for Job Readiness Engine
 *
 * Direct API calls to BrightData and OpenRouter — no internal route dependencies.
 * Works in any context: API routes, background jobs, tests.
 */

import type { ExternalFetchers, ReadinessInput } from './types';

const BRIGHTDATA_BASE_URL = 'https://api.brightdata.com/datasets/v3';
const BRIGHTDATA_SERP_URL = 'https://api.brightdata.com/request';

function getBrightDataKey(): string | null {
  return process.env.BRIGHTDATA_API_KEY || null;
}
function getOpenRouterKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}
function getSerpZone(): string {
  return process.env.BRIGHTDATA_SERP_ZONE || 'serp_api1';
}
function getLinkedInDataset(): string {
  return process.env.BRIGHTDATA_LINKEDIN_DATASET || 'gd_l1viktl72bvl7bjuj0';
}

/**
 * Poll BrightData snapshot until ready (with timeout)
 */
async function pollSnapshot(snapshotId: string, apiKey: string, timeoutMs = 30000): Promise<any | null> {
  const start = Date.now();
  const pollInterval = 2000;

  while (Date.now() - start < timeoutMs) {
    const progressRes = await fetch(`${BRIGHTDATA_BASE_URL}/progress/${snapshotId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!progressRes.ok) return null;

    const progress = await progressRes.json();
    if (progress.status === 'ready') {
      const snapshotRes = await fetch(
        `${BRIGHTDATA_BASE_URL}/snapshot/${snapshotId}?format=json`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );
      if (!snapshotRes.ok) return null;
      return snapshotRes.json();
    }
    if (progress.status === 'error' || progress.status === 'failed') return null;

    await new Promise(r => setTimeout(r, pollInterval));
  }

  return null; // Timeout
}

/**
 * Fetch LinkedIn profile data via BrightData datasets API.
 * Triggers scrape → polls for completion → returns parsed profile.
 */
async function fetchLinkedInProfile(url: string): Promise<ReadinessInput['linkedinProfile'] | null> {
  const apiKey = getBrightDataKey();
  if (!apiKey) return null;

  try {
    const triggerRes = await fetch(
      `${BRIGHTDATA_BASE_URL}/trigger?dataset_id=${getLinkedInDataset()}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ url }]),
      }
    );
    if (!triggerRes.ok) {
      console.error('[LinkedIn Fetcher] Trigger failed:', await triggerRes.text());
      return null;
    }

    const triggerData = await triggerRes.json();
    const snapshotId = triggerData.snapshot_id;
    if (!snapshotId) return null;

    const data = await pollSnapshot(snapshotId, apiKey);
    if (!data) return null;

    // Parse BrightData LinkedIn response
    const profiles = Array.isArray(data) ? data : [data];
    const profile = profiles[0];
    if (!profile) return null;

    return {
      headline: profile.headline || profile.title || undefined,
      experience: (profile.experience || profile.positions || []).map((exp: any) => ({
        title: exp.title || exp.role || '',
        company: exp.company || exp.company_name || '',
        startDate: exp.start_date || exp.from || undefined,
        endDate: exp.end_date || exp.to || undefined,
        current: exp.current ?? (!exp.end_date ? true : false),
      })),
      skills: profile.skills || [],
      posts: (profile.posts || profile.activity || []).slice(0, 10).map((p: any) => ({
        text: p.text || p.content || '',
        date: p.date || p.posted_at || new Date().toISOString(),
        reactions: p.reactions || p.likes || 0,
      })),
    };
  } catch (error) {
    console.error('[LinkedIn Fetcher] Error:', error);
    return null;
  }
}

/**
 * Fetch layoffs data via BrightData SERP (direct API call)
 */
async function fetchLayoffsData(company: string): Promise<{ hasLayoffs: boolean; date?: string; count?: number } | null> {
  const apiKey = getBrightDataKey();
  if (!apiKey) return null;

  try {
    const searchQuery = `site:layoffs.fyi ${company}`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=en&num=5`;

    const response = await fetch(BRIGHTDATA_SERP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone: getSerpZone(),
        url: googleUrl,
        format: 'raw',
        data_format: 'parsed_light',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    const organic = data?.organic || data?.results?.organic || data?.results || [];
    const results = Array.isArray(organic) ? organic : [];

    const hasLayoffs = results.some((r: any) =>
      r.title?.toLowerCase().includes('layoff') ||
      r.snippet?.toLowerCase().includes('layoff') ||
      r.description?.toLowerCase().includes('layoff')
    );

    if (!hasLayoffs) return { hasLayoffs: false };

    const description = results[0]?.snippet || results[0]?.description || '';
    const countMatch = description.match(/(\d+)\s*(?:employees?|people|workers?|laid off)/i);
    const dateMatch = description.match(/\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}/i);

    return {
      hasLayoffs: true,
      date: dateMatch?.[0],
      count: countMatch ? parseInt(countMatch[1]) : undefined,
    };
  } catch (error) {
    console.error('[Layoffs Fetcher] Error:', error);
    return null;
  }
}

/**
 * Fetch company news via BrightData SERP (direct API call)
 */
async function fetchCompanyNews(company: string): Promise<Array<{ title: string; date: string; sentiment: number }> | null> {
  const apiKey = getBrightDataKey();
  if (!apiKey) return null;

  try {
    const searchQuery = `${company} news`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=en&num=10`;

    const response = await fetch(BRIGHTDATA_SERP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone: getSerpZone(),
        url: googleUrl,
        format: 'raw',
        data_format: 'parsed_light',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    const organic = data?.organic || data?.results?.organic || data?.results || [];
    const results = Array.isArray(organic) ? organic : [];
    if (results.length === 0) return null;

    return results.slice(0, 5).map((r: any) => ({
      title: r.title || '',
      date: new Date().toISOString(),
      sentiment: 0.5,
    }));
  } catch (error) {
    console.error('[Company News Fetcher] Error:', error);
    return null;
  }
}

/**
 * Analyze sentiment via OpenRouter LLM (direct API call)
 */
async function analyzeSentiment(texts: string[]): Promise<Array<{ text: string; sentiment: number; confidence: number }> | null> {
  const apiKey = getOpenRouterKey();
  if (!apiKey || texts.length === 0) return null;

  try {
    const prompt = `Analyze the sentiment of these texts on a scale from 0 (very negative) to 1 (very positive). Return JSON array.

Texts:
${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return format: [{"text": "...", "sentiment": 0.7, "confidence": 0.9}, ...]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://recruitos.xyz',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed) ? parsed : (parsed.results || parsed.sentiments || []);

    return results.map((r: any, i: number) => ({
      text: r.text || texts[i] || '',
      sentiment: typeof r.sentiment === 'number' ? r.sentiment : 0.5,
      confidence: typeof r.confidence === 'number' ? r.confidence : 0.7,
    }));
  } catch (error) {
    console.error('[Sentiment Fetcher] Error:', error);
    return null;
  }
}

/**
 * Create external fetchers with live API integrations.
 * All calls go directly to external APIs — no internal route dependencies.
 */
export function createExternalFetchers(): ExternalFetchers {
  return {
    fetchLinkedInProfile,
    fetchLayoffsData,
    fetchCompanyNews,
    analyzeSentiment,
  };
}

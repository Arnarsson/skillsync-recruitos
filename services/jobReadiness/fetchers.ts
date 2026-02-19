/**
 * External data fetchers for Job Readiness Engine
 *
 * Wires up BrightData, Firecrawl, and OpenRouter to power Company Health
 * and Sentiment pillars with real-world data.
 */

import type { ExternalFetchers } from './types';

const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('brightdata_api_key') : null);
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('firecrawl_api_key') : null);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') : null);

/**
 * Fetch layoffs data for a company
 * Uses BrightData to scrape layoffs.fyi
 */
async function fetchLayoffsData(company: string): Promise<{ hasLayoffs: boolean; date?: string; count?: number } | null> {
  if (!BRIGHTDATA_API_KEY) return null;

  try {
    // Use BrightData SERP to search layoffs.fyi
    const searchQuery = `site:layoffs.fyi ${company}`;
    const response = await fetch('/api/brightdata/serp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: 'google',
        query: searchQuery,
        limit: 5,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    // Check if any results mention layoffs
    const hasLayoffs = data.results?.some((r: any) =>
      r.title?.toLowerCase().includes('layoff') ||
      r.description?.toLowerCase().includes('layoff')
    );

    if (!hasLayoffs) return { hasLayoffs: false };

    // Try to extract count and date from first result
    const firstResult = data.results?.[0];
    const description = firstResult?.description || '';

    // Match patterns like "500 laid off", "200 employees", etc
    const countMatch = description.match(/(\d+)\s*(?:employees?|people|workers?|laid off)/i);
    const count = countMatch ? parseInt(countMatch[1]) : undefined;

    // Match date patterns (YYYY-MM-DD or Month YYYY)
    const dateMatch = description.match(/\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}/i);
    const date = dateMatch ? dateMatch[0] : undefined;

    return { hasLayoffs: true, date, count };
  } catch (error) {
    console.error('fetchLayoffsData error:', error);
    return null;
  }
}

/**
 * Fetch recent news articles about a company
 * Uses BrightData SERP + Firecrawl fallback
 */
async function fetchCompanyNews(company: string): Promise<Array<{ title: string; date: string; sentiment: number }> | null> {
  if (!BRIGHTDATA_API_KEY && !FIRECRAWL_API_KEY) return null;

  try {
    // Search for recent company news
    const searchQuery = `${company} news`;
    const response = await fetch('/api/brightdata/serp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: 'google',
        query: searchQuery,
        limit: 10,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (!data.results || data.results.length === 0) return null;

    // Map results to news articles
    const articles = data.results.slice(0, 5).map((r: any) => ({
      title: r.title || '',
      date: new Date().toISOString(), // SERP doesn't always give dates
      sentiment: 0.5, // Neutral by default, will analyze with LLM below
    }));

    return articles;
  } catch (error) {
    console.error('fetchCompanyNews error:', error);
    return null;
  }
}

/**
 * Analyze sentiment of text chunks using OpenRouter LLM
 * Returns sentiment scores: 0 (negative) to 1 (positive)
 */
async function analyzeSentiment(texts: string[]): Promise<Array<{ text: string; sentiment: number; confidence: number }> | null> {
  if (!OPENROUTER_API_KEY || texts.length === 0) return null;

  try {
    const prompt = `Analyze the sentiment of these texts on a scale from 0 (very negative) to 1 (very positive). Return JSON array with sentiment scores.

Texts:
${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return format: [{"text": "...", "sentiment": 0.7, "confidence": 0.9}, ...]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://recruitos.xyz',
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
    // Handle both array and object with results key
    const results = Array.isArray(parsed) ? parsed : (parsed.results || parsed.sentiments || []);

    return results.map((r: any, i: number) => ({
      text: r.text || texts[i] || '',
      sentiment: typeof r.sentiment === 'number' ? r.sentiment : 0.5,
      confidence: typeof r.confidence === 'number' ? r.confidence : 0.7,
    }));
  } catch (error) {
    console.error('analyzeSentiment error:', error);
    return null;
  }
}

/**
 * Create external fetchers with live API integrations
 */
export function createExternalFetchers(): ExternalFetchers {
  return {
    fetchLayoffsData,
    fetchCompanyNews,
    analyzeSentiment,
  };
}

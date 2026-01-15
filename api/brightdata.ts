/* eslint-disable no-console */
/**
 * BrightData API Proxy
 *
 * Serverless function that proxies requests to BrightData APIs.
 * Handles LinkedIn profile scraping, SERP searches, and generic web scraping.
 *
 * Actions:
 * - trigger: Start LinkedIn profile scrape
 * - serp-trigger: Start Google SERP search
 * - progress: Check scrape progress
 * - snapshot: Get scraped data
 * - scrape: Generic web scrape (4-tier fallback)
 *
 * @see api/lib/schemas.ts for input/output schemas
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  ErrorCode,
  LinkedInUrlSchema,
  SnapshotIdSchema,
  formatZodError,
} from './lib/schemas';
import {
  handleCors,
  applyCors,
  rawSuccess,
  error,
  validationError,
  authError,
  externalError,
  internalError,
  logRequest,
} from './lib/responses';

// ============================================================
// CONSTANTS
// ============================================================

const BRIGHTDATA_API_BASE = 'https://api.brightdata.com/datasets/v3';
const LINKEDIN_DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const SERP_DATASET_ID = 'gd_mfz5x93lmsjjjylob';
const WEB_SCRAPER_DATASET_ID = 'gd_lwdb5fft2sxbj0ioiy';

// Request timeout (ms)
const FETCH_TIMEOUT = 30000;

// ============================================================
// INPUT SCHEMAS (per action)
// ============================================================

const TriggerParamsSchema = z.object({
  url: LinkedInUrlSchema,
});

const SerpTriggerBodySchema = z.object({
  keyword: z.string().min(1, 'keyword is required').max(500),
});

const ProgressParamsSchema = z.object({
  snapshot_id: SnapshotIdSchema,
});

const SnapshotParamsSchema = z.object({
  snapshot_id: SnapshotIdSchema,
});

const ScrapeBodySchema = z.object({
  url: z.string().url('Must be a valid URL'),
  tier: z.enum(['1', '2', '3', '4']).optional(),
});

// ============================================================
// HELPERS
// ============================================================

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get API key from headers or env
 */
function getApiKey(req: VercelRequest): string | null {
  return (
    (req.headers['x-brightdata-key'] as string) ||
    process.env.BRIGHTDATA_API_KEY ||
    null
  );
}

/**
 * Parse request body safely
 */
function parseBody(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return (req.body as Record<string, unknown>) || {};
}

// ============================================================
// ACTION HANDLERS
// ============================================================

/**
 * Trigger LinkedIn profile scrape
 */
async function handleTrigger(
  req: VercelRequest,
  res: VercelResponse,
  apiKey: string
): Promise<VercelResponse> {
  // Validate URL from query params
  const parseResult = TriggerParamsSchema.safeParse({
    url: req.query.url,
  });

  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  const { url } = parseResult.data;
  const triggerUrl = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${LINKEDIN_DATASET_ID}&format=json`;

  try {
    const response = await fetchWithTimeout(triggerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ url }]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return externalError(res, 'BrightData', `trigger failed: ${errorText}`);
    }

    const data = await response.json();
    return rawSuccess(res, data);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'BrightData request timeout', 504, {
        code: ErrorCode.BRIGHTDATA_TIMEOUT,
      });
    }
    return internalError(res, err);
  }
}

/**
 * Trigger SERP (Google search) scrape
 */
async function handleSerpTrigger(
  req: VercelRequest,
  res: VercelResponse,
  apiKey: string
): Promise<VercelResponse> {
  const body = parseBody(req);

  const parseResult = SerpTriggerBodySchema.safeParse(body);
  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  const { keyword } = parseResult.data;
  const triggerUrl = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${SERP_DATASET_ID}&format=json`;

  try {
    const response = await fetchWithTimeout(triggerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          url: 'https://www.google.com/',
          keyword,
          tbm: '',
          language: '',
          uule: '',
          brd_mobile: '',
          tbs: '',
          nfpr: '',
        },
      ]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return externalError(res, 'BrightData SERP', `trigger failed: ${errorText}`);
    }

    const data = await response.json();
    return rawSuccess(res, data);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'SERP request timeout', 504, {
        code: ErrorCode.BRIGHTDATA_TIMEOUT,
      });
    }
    return internalError(res, err);
  }
}

/**
 * Check scrape progress
 */
async function handleProgress(
  req: VercelRequest,
  res: VercelResponse,
  apiKey: string
): Promise<VercelResponse> {
  const parseResult = ProgressParamsSchema.safeParse({
    snapshot_id: req.query.snapshot_id,
  });

  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  const { snapshot_id } = parseResult.data;
  const progressUrl = `${BRIGHTDATA_API_BASE}/progress/${snapshot_id}`;

  try {
    const response = await fetchWithTimeout(progressUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return externalError(res, 'BrightData', `progress check failed: ${errorText}`);
    }

    const data = await response.json();
    return rawSuccess(res, data);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'Progress check timeout', 504, {
        code: ErrorCode.BRIGHTDATA_TIMEOUT,
      });
    }
    return internalError(res, err);
  }
}

/**
 * Get snapshot data
 */
async function handleSnapshot(
  req: VercelRequest,
  res: VercelResponse,
  apiKey: string
): Promise<VercelResponse> {
  const parseResult = SnapshotParamsSchema.safeParse({
    snapshot_id: req.query.snapshot_id,
  });

  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  const { snapshot_id } = parseResult.data;
  const snapshotUrl = `${BRIGHTDATA_API_BASE}/snapshot/${snapshot_id}?format=json`;

  try {
    const response = await fetchWithTimeout(snapshotUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return externalError(res, 'BrightData', `snapshot fetch failed: ${errorText}`);
    }

    const data = await response.json();
    return rawSuccess(res, data);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return error(res, 'Snapshot fetch timeout', 504, {
        code: ErrorCode.BRIGHTDATA_TIMEOUT,
      });
    }
    return internalError(res, err);
  }
}

/**
 * Generic web scrape with multi-tier fallback
 */
async function handleScrape(
  req: VercelRequest,
  res: VercelResponse,
  apiKey: string
): Promise<VercelResponse> {
  const body = parseBody(req);

  const parseResult = ScrapeBodySchema.safeParse(body);
  if (!parseResult.success) {
    return validationError(res, parseResult.error);
  }

  const { url, tier } = parseResult.data;
  const requestId = logRequest('SCRAPE', url, { tier });

  // Tier 1: Direct fetch (for public pages)
  if (!tier || tier === '1') {
    try {
      console.log(`[${requestId}] Tier 1: Direct fetch`);
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      }, 15000);

      if (response.ok) {
        const content = await response.text();
        if (content.length > 500) {
          console.log(`[${requestId}] Tier 1 success: ${content.length} chars`);
          return rawSuccess(res, { content, statusCode: 200, tier: '1' });
        }
      }
    } catch (err) {
      console.log(`[${requestId}] Tier 1 failed:`, err instanceof Error ? err.message : 'unknown');
    }
  }

  // Tier 2: Browser-like headers
  if (!tier || tier === '2') {
    try {
      console.log(`[${requestId}] Tier 2: Browser simulation`);
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
      }, 15000);

      if (response.ok) {
        const content = await response.text();
        if (content.length > 500) {
          console.log(`[${requestId}] Tier 2 success: ${content.length} chars`);
          return rawSuccess(res, { content, statusCode: 200, tier: '2' });
        }
      }
    } catch (err) {
      console.log(`[${requestId}] Tier 2 failed:`, err instanceof Error ? err.message : 'unknown');
    }
  }

  // Tier 3: BrightData Web Scraper (if API key available)
  if (apiKey && (!tier || tier === '3')) {
    try {
      console.log(`[${requestId}] Tier 3: BrightData Web Scraper`);
      const triggerUrl = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${WEB_SCRAPER_DATASET_ID}&format=json`;

      const triggerResponse = await fetchWithTimeout(triggerUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ url }]),
      });

      if (triggerResponse.ok) {
        const triggerData = await triggerResponse.json();
        const snapshotId = triggerData.snapshot_id;

        if (snapshotId) {
          // Poll for results (max 20 seconds)
          for (let i = 0; i < 10; i++) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const progressResponse = await fetchWithTimeout(
              `${BRIGHTDATA_API_BASE}/progress/${snapshotId}`,
              { headers: { Authorization: `Bearer ${apiKey}` } }
            );

            if (progressResponse.ok) {
              const progress = await progressResponse.json();

              if (progress.status === 'ready') {
                const snapshotResponse = await fetchWithTimeout(
                  `${BRIGHTDATA_API_BASE}/snapshot/${snapshotId}?format=json`,
                  { headers: { Authorization: `Bearer ${apiKey}` } }
                );

                if (snapshotResponse.ok) {
                  const snapshotData = await snapshotResponse.json();
                  if (Array.isArray(snapshotData) && snapshotData.length > 0) {
                    const content =
                      snapshotData[0].content ||
                      snapshotData[0].text ||
                      JSON.stringify(snapshotData[0]);

                    console.log(`[${requestId}] Tier 3 success: ${content.length} chars`);
                    return rawSuccess(res, { content, statusCode: 200, tier: '3' });
                  }
                }
                break;
              } else if (progress.status === 'failed') {
                console.log(`[${requestId}] Tier 3 scrape failed`);
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(`[${requestId}] Tier 3 failed:`, err instanceof Error ? err.message : 'unknown');
    }
  }

  // All tiers failed
  return error(res, 'Failed to scrape URL - all tiers exhausted', 404, {
    code: ErrorCode.SCRAPE_FAILED,
    details: { url, attemptedTiers: tier ? [tier] : ['1', '2', '3'] },
  });
}

// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCors(res);
  }

  applyCors(res);

  const { action } = req.query;
  const requestId = logRequest(req.method || 'UNKNOWN', req.url || '/api/brightdata', { action });

  // Validate action
  const validActions = ['trigger', 'serp-trigger', 'progress', 'snapshot', 'scrape'];
  if (!action || !validActions.includes(action as string)) {
    return error(res, `Invalid action. Use: ${validActions.join(', ')}`, 400, {
      code: ErrorCode.INVALID_ACTION,
    });
  }

  // Get API key (required for most actions except scrape tier 1-2)
  const apiKey = getApiKey(req);

  // Actions that require API key
  const requiresAuth = ['trigger', 'serp-trigger', 'progress', 'snapshot'];
  if (requiresAuth.includes(action as string) && !apiKey) {
    return authError(res, 'BrightData API key is required');
  }

  try {
    switch (action) {
      case 'trigger':
        return await handleTrigger(req, res, apiKey!);

      case 'serp-trigger':
        return await handleSerpTrigger(req, res, apiKey!);

      case 'progress':
        return await handleProgress(req, res, apiKey!);

      case 'snapshot':
        return await handleSnapshot(req, res, apiKey!);

      case 'scrape':
        return await handleScrape(req, res, apiKey || '');

      default:
        return error(res, `Unknown action: ${action}`, 400, {
          code: ErrorCode.INVALID_ACTION,
        });
    }
  } catch (err) {
    console.error(`[${requestId}] Unhandled error:`, err);
    return internalError(res, err);
  }
}

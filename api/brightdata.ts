import type { VercelRequest, VercelResponse } from '@vercel/node';

const BRIGHTDATA_API_BASE = 'https://api.brightdata.com/datasets/v3';
const LINKEDIN_DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const SERP_DATASET_ID = 'gd_mfz5x93lmsjjjylob'; // Google SERP dataset

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-BrightData-Key, X-SERP-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers['x-brightdata-key'] as string || process.env.BRIGHTDATA_API_KEY;
  const serpKey = req.headers['x-serp-key'] as string || process.env.SERP_API_KEY;

  const { action, snapshot_id, url } = req.query;

  try {
    if (action === 'trigger') {
      // Trigger a new LinkedIn scrape
      if (!apiKey) {
        return res.status(400).json({ error: 'BrightData API key is required' });
      }

      const linkedInUrl = url as string;
      if (!linkedInUrl) {
        return res.status(400).json({ error: 'URL is required for trigger action' });
      }

      const triggerUrl = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${LINKEDIN_DATASET_ID}&format=json`;

      const response = await fetch(triggerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ url: linkedInUrl }]),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `BrightData trigger failed: ${errorText}` });
      }

      const data = await response.json();
      return res.status(200).json(data);

    } else if (action === 'serp-trigger') {
      // Trigger a new SERP (Google search) scrape
      if (!apiKey) {
        return res.status(400).json({ error: 'BrightData API key is required' });
      }

      const body = req.body;
      const keyword = body?.keyword;

      if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required for SERP trigger' });
      }

      const triggerUrl = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${SERP_DATASET_ID}&format=json`;

      const response = await fetch(triggerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            url: 'https://www.google.com/',
            keyword: keyword,
            tbm: '', // Search type (empty = all results, 'nws' = news, etc.)
            language: '',
            uule: '',
            brd_mobile: '',
            tbs: '',
            nfpr: ''
          }
        ]),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `SERP trigger failed: ${errorText}` });
      }

      const data = await response.json();
      return res.status(200).json(data);

    } else if (action === 'progress') {
      // Check scrape progress
      const snapshotId = snapshot_id as string;
      if (!snapshotId) {
        return res.status(400).json({ error: 'snapshot_id is required for progress action' });
      }

      const progressUrl = `${BRIGHTDATA_API_BASE}/progress/${snapshotId}`;

      const response = await fetch(progressUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `BrightData progress failed: ${errorText}` });
      }

      const data = await response.json();
      return res.status(200).json(data);

    } else if (action === 'snapshot') {
      // Get snapshot data
      const snapshotId = snapshot_id as string;
      if (!snapshotId) {
        return res.status(400).json({ error: 'snapshot_id is required for snapshot action' });
      }

      const snapshotUrl = `${BRIGHTDATA_API_BASE}/snapshot/${snapshotId}?format=json`;

      const response = await fetch(snapshotUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: `BrightData snapshot failed: ${errorText}` });
      }

      const data = await response.json();
      return res.status(200).json(data);

    } else if (action === 'scrape') {
      // Generic web scraper for enrichment pipeline
      if (!apiKey) {
        return res.status(400).json({ error: 'BrightData API key is required for scrape action' });
      }

      // Safely parse req.body (might be string in Vercel)
      let body: any = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const targetUrl = body?.url;
      if (!targetUrl || typeof targetUrl !== 'string') {
        return res.status(400).json({ error: 'URL is required for scrape action' });
      }

      console.log('[BrightData API] Scraping URL:', targetUrl);

      // Use Bright Data Web Unlocker API (correct endpoint)
      // Docs: https://docs.brightdata.com/scraping-automation/web-unlocker/overview
      const scrapeUrl = `https://api.brightdata.com/request`;

      const requestBody = {
        url: targetUrl,
        zone: 'web_unlocker',
        format: 'raw'
      };

      console.log('[BrightData API] Request body:', JSON.stringify(requestBody));

      const response = await fetch(scrapeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[BrightData API] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BrightData API] Error response:', errorText);
        return res.status(response.status).json({ error: `Web scraper failed: ${errorText}` });
      }

      const data = await response.json();
      // Web Unlocker returns { body: "...", status_code: 200, ... }
      const html = data.body || data.content || '';

      console.log('[BrightData API] Success, content length:', html.length);

      return res.status(200).json({ content: html, statusCode: data.status_code });

    } else {
      return res.status(400).json({
        error: 'Invalid action. Use: trigger, serp-trigger, progress, snapshot, or scrape'
      });
    }

  } catch (error) {
    console.error('BrightData proxy error:', error);
    return res.status(500).json({ error: `Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

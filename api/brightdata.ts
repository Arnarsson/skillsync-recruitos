/* eslint-disable no-console */
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
  // const serpKey = req.headers['x-serp-key'] as string || process.env.SERP_API_KEY;

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
      // Safely parse req.body (might be string in Vercel)
      let parsedBody: { url?: string };
      if (typeof req.body === 'string') {
        try {
          parsedBody = JSON.parse(req.body);
        } catch {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      } else {
        parsedBody = req.body as { url?: string };
      }

      const targetUrl = parsedBody?.url;
      if (!targetUrl || typeof targetUrl !== 'string') {
        return res.status(400).json({ error: 'URL is required for scrape action' });
      }

      console.log('[BrightData API] Scraping URL:', targetUrl);

      // Try multiple scraping methods in order of preference
      let content = '';
      let success = false;

      // Method 1: Try BrightData SERP API for common sites
      if (apiKey && !success) {
        try {
          // Use datasets API with web_data_extraction dataset for generic scraping
          const scrapeDatasetId = 'gd_lwdb5fft2sxbj0ioiy'; // Generic web scraper dataset
          const triggerUrl = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${scrapeDatasetId}&format=json`;

          const response = await fetch(triggerUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ url: targetUrl }]),
          });

          if (response.ok) {
            const triggerData = await response.json();
            const snapshotId = triggerData.snapshot_id;

            if (snapshotId) {
              // Poll for results (max 20 seconds)
              for (let i = 0; i < 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                const progressResponse = await fetch(
                  `${BRIGHTDATA_API_BASE}/progress/${snapshotId}`,
                  { headers: { 'Authorization': `Bearer ${apiKey}` } }
                );

                if (progressResponse.ok) {
                  const progress = await progressResponse.json();
                  if (progress.status === 'ready') {
                    const snapshotResponse = await fetch(
                      `${BRIGHTDATA_API_BASE}/snapshot/${snapshotId}?format=json`,
                      { headers: { 'Authorization': `Bearer ${apiKey}` } }
                    );

                    if (snapshotResponse.ok) {
                      const snapshotData = await snapshotResponse.json();
                      if (Array.isArray(snapshotData) && snapshotData.length > 0) {
                        content = snapshotData[0].content || snapshotData[0].text || JSON.stringify(snapshotData[0]);
                        success = true;
                        console.log('[BrightData API] Method 1 (datasets) success, content length:', content.length);
                      }
                    }
                    break;
                  } else if (progress.status === 'failed') {
                    console.log('[BrightData API] Method 1 failed, trying fallback');
                    break;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.log('[BrightData API] Method 1 error:', error);
        }
      }

      // Method 2: Direct fetch (for public pages)
      if (!success) {
        try {
          console.log('[BrightData API] Trying direct fetch for:', targetUrl);
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });

          if (response.ok) {
            content = await response.text();
            success = true;
            console.log('[BrightData API] Method 2 (direct fetch) success, content length:', content.length);
          }
        } catch (error) {
          console.log('[BrightData API] Method 2 error:', error);
        }
      }

      if (success && content) {
        return res.status(200).json({ content, statusCode: 200 });
      }

      return res.status(404).json({ error: 'Failed to scrape URL - no content retrieved' });

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

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BRIGHTDATA_API_BASE = 'https://api.brightdata.com/datasets/v3';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-BrightData-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers['x-brightdata-key'] as string || process.env.BRIGHTDATA_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'BrightData API key is required' });
  }

  const { action, snapshot_id, url } = req.query;

  try {
    if (action === 'trigger') {
      // Trigger a new scrape
      const linkedInUrl = url as string;
      if (!linkedInUrl) {
        return res.status(400).json({ error: 'URL is required for trigger action' });
      }

      const triggerUrl = `${BRIGHTDATA_API_BASE}/trigger?dataset_id=${DATASET_ID}&format=json`;

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

    } else {
      return res.status(400).json({ error: 'Invalid action. Use: trigger, progress, or snapshot' });
    }

  } catch (error) {
    console.error('BrightData proxy error:', error);
    return res.status(500).json({ error: `Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

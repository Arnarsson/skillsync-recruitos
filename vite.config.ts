/* eslint-disable no-console */
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to handle /api/brightdata requests during dev
function brightdataProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'brightdata-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        // Robust check for BrightData API path
        if (!reqUrl.includes('api/brightdata')) {
          return next();
        }

        console.log('[BrightData Proxy] Handling:', reqUrl);

        let url: URL;
        try {
          url = new URL(reqUrl, 'http://localhost');
        } catch (e) {
          console.error('[BrightData Proxy] URL parse error:', reqUrl);
          return next();
        }

        const action = url.searchParams.get('action');
        const snapshotId = url.searchParams.get('snapshot_id');
        const linkedInUrl = url.searchParams.get('url');
        const headerKey = req.headers['x-brightdata-key'] as string;
        const envKey = env.BRIGHTDATA_API_KEY;
        const brightDataKey = headerKey || envKey;

        if (!brightDataKey) {
          console.error('[BrightData Proxy] ❌ 401 Error: API Key missing');
          console.error('[BrightData Proxy]   - Header Key provided:', !!headerKey);
          console.error('[BrightData Proxy]   - Env Key provided:', !!envKey);
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'BrightData API key is required' }));
          return;
        } else {
          // Debug log (only first few chars)
          const maskedKey = brightDataKey.substring(0, 4) + '***';
          console.log(`[BrightData Proxy] 🔑 Authenticated using ${headerKey ? 'Header' : 'Env'} Key (${maskedKey})`);
        }

        // Consume body for all POST/PUT requests upfront
        let bodyData = '';
        if (req.method === 'POST' || req.method === 'PUT') {
          try {
            for await (const chunk of req) {
              bodyData += chunk;
            }
          } catch (e) {
            console.error('[BrightData Proxy] Body read error:', e);
          }
        }

        const datasetId = 'gd_l1viktl72bvl7bjuj0';
        let apiUrl = '';
        let method = 'GET';
        let body: string | undefined;
        let tier: string | undefined;

        if (action === 'trigger') {
          apiUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&format=json`;
          method = 'POST';
          body = JSON.stringify([{ url: linkedInUrl }]);
        } else if (action === 'progress') {
          apiUrl = `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`;
        } else if (action === 'serp-trigger') {
          // Fix: Use Datasets API for SERP instead of generic /request which requires a zone
          const SERP_DATASET_ID = 'gd_mfz5x93lmsjjjylob';
          apiUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${SERP_DATASET_ID}&format=json`;
          method = 'POST';

          const keyword = bodyData ? JSON.parse(bodyData).keyword : url.searchParams.get('keyword');

          // Format body for Datasets API
          body = JSON.stringify([
            {
              url: 'https://www.google.com/',
              keyword: keyword,
              tbm: '',
              language: ''
            }
          ]);

          console.log('[BrightData Proxy] SERP Dataset Trigger:', { apiUrl, keyword });
        } else if (action === 'snapshot') {
          apiUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`;
        } else if (action === 'scrape') {
          let targetUrl: string | undefined;
          tier = '3'; // Default to web_unlocker
          try {
            if (bodyData) {
              const parsed = JSON.parse(bodyData);
              targetUrl = parsed.url;
              tier = parsed.tier || '3';
            }
          } catch {
            // fallback
          }

          if (!targetUrl && url.searchParams.get('url')) {
            targetUrl = url.searchParams.get('url') as string;
          }

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          if (tier === '1' || tier === '2') {
            apiUrl = targetUrl;
            method = 'GET';
            body = undefined;
          } else {
            apiUrl = 'https://api.brightdata.com/request';
            method = 'POST';
            body = JSON.stringify({
              url: targetUrl,
              zone: 'web_unlocker',
              format: 'raw'
            });
          }
        } else {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid action' }));
          return;
        }

        try {
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${brightDataKey}`,
          };
          if (body) {
            headers['Content-Type'] = 'application/json';
          }

          if (action === 'scrape' && tier === '2') {
            headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
            headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';
          }

          console.log('[BrightData Proxy] Requesting:', method, apiUrl);
          const response = await fetch(apiUrl, {
            method,
            headers,
            body,
          });

          console.log('[BrightData Proxy] Response Status:', response.status, 'for', apiUrl);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[BrightData Proxy] Error:', errorText);
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: `BrightData request failed: ${errorText}`, url: apiUrl }));
            return;
          }

          if (action === 'scrape') {
            const html = await response.text();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ content: html }));
          } else {
            const data = await response.text();
            res.statusCode = response.status;
            res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(data);
          }
        } catch (error) {
          console.error('BrightData proxy error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Proxy request failed' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      host: '0.0.0.0',
    },
    plugins: [react(), brightdataProxyPlugin(env)],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.FIRECRAWL_API_KEY': JSON.stringify(env.FIRECRAWL_API_KEY),
      'process.env.BRIGHTDATA_API_KEY': JSON.stringify(env.BRIGHTDATA_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

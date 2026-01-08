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
        if (!req.url?.startsWith('/api/brightdata')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const action = url.searchParams.get('action');
        const snapshotId = url.searchParams.get('snapshot_id');
        const linkedInUrl = url.searchParams.get('url');
        const brightDataKey = req.headers['x-brightdata-key'] as string || env.BRIGHTDATA_API_KEY;

        if (!brightDataKey) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'BrightData API key is required' }));
          return;
        }

        const datasetId = 'gd_l1viktl72bvl7bjuj0';
        let apiUrl = '';
        let method = 'GET';
        let body: string | undefined;

        if (action === 'trigger') {
          apiUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&format=json`;
          method = 'POST';
          body = JSON.stringify([{ url: linkedInUrl }]);
        } else if (action === 'progress') {
          apiUrl = `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`;
        } else if (action === 'snapshot') {
          apiUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`;
        } else if (action === 'scrape') {
          // Handle web scraper for enrichment pipeline
          // Read body for POST request
          let bodyData = '';
          for await (const chunk of req) {
            bodyData += chunk;
          }

          let targetUrl: string | undefined;
          try {
            const parsed = JSON.parse(bodyData);
            targetUrl = parsed.url;
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
          }

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'URL is required for scrape action' }));
            return;
          }

          console.log('[BrightData API] Scraping URL:', targetUrl);

          // Use BrightData Web Unlocker API
          apiUrl = 'https://api.brightdata.com/request';
          method = 'POST';
          body = JSON.stringify({
            url: targetUrl,
            zone: 'web_unlocker',
            format: 'raw'
          });

          console.log('[BrightData API] Request body:', body);
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

          const response = await fetch(apiUrl, {
            method,
            headers,
            body,
          });

          console.log('[BrightData API] Response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[BrightData API] Error response:', errorText);
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: `BrightData request failed: ${errorText}` }));
            return;
          }

          // Handle scrape response specially (Web Unlocker API format)
          if (action === 'scrape') {
            // BrightData returns HTML content directly, not JSON-wrapped
            const html = await response.text();
            console.log('[BrightData API] Success, content length:', html.length);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ content: html, statusCode: response.status }));
          } else {
            // For other actions, pass through as-is
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
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), brightdataProxyPlugin(env)],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.FIRECRAWL_API_KEY': JSON.stringify(env.FIRECRAWL_API_KEY),
        'process.env.BRIGHTDATA_API_KEY': JSON.stringify(env.BRIGHTDATA_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

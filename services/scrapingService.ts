
interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: any;
  };
  error?: string;
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
 * Generic scraper using Firecrawl.
 * STRICT MODE: Requires a valid API Key.
 */
export const scrapeUrlContent = async (url: string): Promise<string> => {
  const firecrawlKey = localStorage.getItem('FIRECRAWL_API_KEY') || getEnv('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    throw new Error("Firecrawl API Key is missing. Please configure it in Settings.");
  }

  try {
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        pageOptions: {
           onlyMainContent: true
        }
      })
    });

    if (!scrapeResponse.ok) {
        const errorText = await scrapeResponse.text();
        throw new Error(`Firecrawl API Error (${scrapeResponse.status}): ${errorText}`);
    }

    const json: FirecrawlResponse = await scrapeResponse.json();

    if (!json.success || !json.data?.markdown) {
        throw new Error(json.error || "Failed to retrieve content from URL");
    }

    return json.data.markdown;

  } catch (error) {
    console.error("Scraping Error:", error);
    throw error;
  }
};

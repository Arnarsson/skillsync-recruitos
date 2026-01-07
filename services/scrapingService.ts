
interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: any;
  };
  error?: string;
}

/**
 * Generic scraper using Firecrawl.
 * Strictly fetches real data from the provided URL.
 */
export const scrapeUrlContent = async (url: string): Promise<string> => {
  const firecrawlKey = localStorage.getItem('FIRECRAWL_API_KEY') || process.env.FIRECRAWL_API_KEY;
  
  if (!firecrawlKey) {
    throw new Error("Missing Firecrawl API Key. Please configure it in Admin Settings.");
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
        throw new Error(`Scraping API Error: ${scrapeResponse.statusText}`);
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

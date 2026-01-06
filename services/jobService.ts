import { GoogleGenAI } from "@google/genai";

// Initialize with localStorage key if available, otherwise env
const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: any;
  };
  error?: string;
}

/**
 * Orchestrates the scraping and parsing of a job URL.
 * 1. Scrapes raw markdown via Firecrawl.
 * 2. Cleans and structures data via Gemini.
 */
export const fetchJobContextFromUrl = async (url: string): Promise<string> => {
  // 1. Scrape with Firecrawl
  // Prioritize LocalStorage (from Admin Settings) over Env var
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
        // Optional: limit capabilities to speed up processing
        pageOptions: {
           onlyMainContent: true
        }
      })
    });

    if (!scrapeResponse.ok) {
        throw new Error(`Firecrawl API Error: ${scrapeResponse.statusText}`);
    }

    const json: FirecrawlResponse = await scrapeResponse.json();

    if (!json.success || !json.data?.markdown) {
        throw new Error(json.error || "Failed to retrieve content from URL");
    }

    const rawMarkdown = json.data.markdown;

    // 2. Parse with Gemini
    // We use Gemini to behave as a strict formatter/extractor
    const prompt = `
      You are an expert Data Extractor for a Recruitment OS.
      
      Task: Extract structured job data from the following raw Markdown scraped from a job board.
      
      Output Format (Strict Text):
      Role: [Job Title]
      Location: [Location, Remote/Hybrid status]
      Source: ${url}
      
      Job Summary:
      [2-3 sentence summary of the role's core purpose]
      
      Requirements:
      - [Requirement 1]
      - [Requirement 2]
      - [Requirement 3]
      ... (Extract up to 8 key hard/soft requirements)
      
      Raw Input Markdown:
      ${rawMarkdown.substring(0, 15000)} // Truncate to avoid token limits if page is massive
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return result.text || "Failed to parse job content.";

  } catch (error) {
    console.error("Job Fetch Error:", error);
    throw error; // Propagate to UI
  }
};
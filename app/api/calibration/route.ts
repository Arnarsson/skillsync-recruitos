import { NextRequest, NextResponse } from "next/server";
import { analyzeJobDescription } from "@/lib/services/gemini";

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Scrape job description using Firecrawl API
 */
async function scrapeWithFirecrawl(url: string): Promise<string | null> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  if (!firecrawlKey) {
    console.log("[Calibration] Firecrawl API key not configured, falling back to basic fetch");
    return null;
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"],
        pageOptions: {
          onlyMainContent: true,
        },
      }),
    });

    if (!response.ok) {
      console.log(`[Calibration] Firecrawl returned ${response.status}, falling back to basic fetch`);
      return null;
    }

    const json: FirecrawlResponse = await response.json();

    if (!json.success || !json.data?.markdown) {
      console.log("[Calibration] Firecrawl returned no content, falling back to basic fetch");
      return null;
    }

    console.log("[Calibration] Successfully scraped with Firecrawl");
    return json.data.markdown;
  } catch (error) {
    console.error("[Calibration] Firecrawl error:", error);
    return null;
  }
}

/**
 * Basic HTML fetch and text extraction fallback
 */
async function basicFetch(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract text content (improved extraction)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    return text;
  } catch (error) {
    console.error("[Calibration] Basic fetch error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, url, text } = body;

    let jobText = "";

    if (type === "url" && url) {
      // Try Firecrawl first (better quality), fall back to basic fetch
      const firecrawlContent = await scrapeWithFirecrawl(url);

      if (firecrawlContent) {
        jobText = firecrawlContent.substring(0, 20000);
      } else {
        // Fallback to basic fetch
        const basicContent = await basicFetch(url);

        if (!basicContent || basicContent.length < 100) {
          return NextResponse.json(
            { error: "Failed to fetch job posting. The site may block automated access. Try pasting the job description text directly." },
            { status: 400 }
          );
        }

        jobText = basicContent.substring(0, 15000);
      }
    } else if (type === "text" && text) {
      jobText = text;
    } else {
      return NextResponse.json(
        { error: "Invalid request - provide url or text" },
        { status: 400 }
      );
    }

    if (!jobText.trim()) {
      return NextResponse.json(
        { error: "No job content to analyze" },
        { status: 400 }
      );
    }

    // Analyze with Gemini
    const analysis = await analyzeJobDescription(jobText);

    return NextResponse.json(analysis);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Calibration API error:", errorMessage);
    return NextResponse.json(
      {
        error: "Failed to analyze job description",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// Increase timeout for AI operations
export const maxDuration = 60;

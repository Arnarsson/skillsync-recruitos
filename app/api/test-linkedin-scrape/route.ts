import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to compare Firecrawl vs BrightData for LinkedIn scraping
 * GET /api/test-linkedin-scrape?url=https://linkedin.com/in/username
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !url.includes("linkedin.com")) {
    return NextResponse.json({ error: "Provide a LinkedIn URL" }, { status: 400 });
  }

  const results: Record<string, unknown> = {
    url,
    timestamp: new Date().toISOString(),
    firecrawl: null,
    brightdata: null,
  };

  // Test 1: Firecrawl
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (firecrawlKey) {
    try {
      console.log("[Test] Trying Firecrawl...");
      const startFC = Date.now();

      const fcResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      const fcTime = Date.now() - startFC;
      const fcData = await fcResponse.json();

      results.firecrawl = {
        status: fcResponse.status,
        success: fcData.success,
        timeMs: fcTime,
        contentLength: fcData.data?.markdown?.length || 0,
        preview: fcData.data?.markdown?.substring(0, 500) || fcData.error || "No content",
      };
    } catch (err) {
      results.firecrawl = { error: String(err) };
    }
  } else {
    results.firecrawl = { error: "FIRECRAWL_API_KEY not configured" };
  }

  // Test 2: BrightData
  const brightdataKey = process.env.BRIGHTDATA_API_KEY;
  if (brightdataKey) {
    try {
      console.log("[Test] Trying BrightData...");
      const startBD = Date.now();

      // BrightData LinkedIn scraper endpoint
      const bdResponse = await fetch(
        "https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true&type=discover_new&discover_by=url",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${brightdataKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ url }]),
        }
      );

      const bdTime = Date.now() - startBD;
      const bdData = await bdResponse.json();

      results.brightdata = {
        status: bdResponse.status,
        timeMs: bdTime,
        response: bdData,
        note: "BrightData is async - returns snapshot_id, need to poll for results"
      };
    } catch (err) {
      results.brightdata = { error: String(err) };
    }
  } else {
    results.brightdata = { error: "BRIGHTDATA_API_KEY not configured" };
  }

  return NextResponse.json(results, { status: 200 });
}

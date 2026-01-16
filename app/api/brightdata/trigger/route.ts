import { NextRequest, NextResponse } from "next/server";

// BrightData Web Scraper API - Trigger a LinkedIn profile scrape
export async function POST(request: NextRequest) {
  try {
    const { apiKey, url, dataset } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { message: "BrightData API key is required" },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { message: "LinkedIn URL is required" },
        { status: 400 }
      );
    }

    // BrightData Web Scraper API endpoint
    const brightDataUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l1viktl72bvl7bjuj0&include_errors=true`;

    const response = await fetch(brightDataUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ url }]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BrightData trigger error:", errorText);
      return NextResponse.json(
        { message: `BrightData API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("BrightData trigger error:", error);
    return NextResponse.json(
      { message: "Failed to trigger LinkedIn scrape" },
      { status: 500 }
    );
  }
}

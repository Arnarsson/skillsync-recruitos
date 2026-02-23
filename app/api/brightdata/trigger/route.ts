import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// BrightData Web Scraper API - Trigger a LinkedIn profile scrape
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { url } = await request.json();

    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "BrightData not configured on server. Set BRIGHTDATA_API_KEY in environment variables." },
        { status: 503 }
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

    console.log("[BrightData] Triggering scrape for:", url);

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
    console.log("[BrightData] Trigger response:", JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error("BrightData trigger error:", error);
    return NextResponse.json(
      { message: "Failed to trigger LinkedIn scrape" },
      { status: 500 }
    );
  }
}

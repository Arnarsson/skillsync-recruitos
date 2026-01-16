import { NextRequest, NextResponse } from "next/server";

// BrightData Web Scraper API - Check scrape progress
export async function POST(request: NextRequest) {
  try {
    const { apiKey, snapshotId } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { message: "BrightData API key is required" },
        { status: 400 }
      );
    }

    if (!snapshotId) {
      return NextResponse.json(
        { message: "Snapshot ID is required" },
        { status: 400 }
      );
    }

    // BrightData snapshot progress endpoint
    const brightDataUrl = `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`;

    const response = await fetch(brightDataUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BrightData progress error:", errorText);
      return NextResponse.json(
        { message: `BrightData API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("BrightData progress error:", error);
    return NextResponse.json(
      { message: "Failed to check scrape progress" },
      { status: 500 }
    );
  }
}

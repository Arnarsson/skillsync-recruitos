import { NextRequest, NextResponse } from "next/server";

// BrightData Web Scraper API - Get snapshot data
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

    // BrightData snapshot data endpoint
    const brightDataUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`;

    const response = await fetch(brightDataUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BrightData snapshot error:", errorText);
      return NextResponse.json(
        { message: `BrightData API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data: Array.isArray(data) ? data : [data], status: "ready" });
  } catch (error) {
    console.error("BrightData snapshot error:", error);
    return NextResponse.json(
      { message: "Failed to get snapshot data" },
      { status: 500 }
    );
  }
}

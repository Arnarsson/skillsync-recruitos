import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// BrightData Web Scraper API - Check scrape progress
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { snapshotId } = await request.json();

    const apiKey = process.env.BRIGHTDATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "BrightData not configured on server" },
        { status: 503 }
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
    console.log("[BrightData] Progress response:", JSON.stringify(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error("BrightData progress error:", error);
    return NextResponse.json(
      { message: "Failed to check scrape progress" },
      { status: 500 }
    );
  }
}

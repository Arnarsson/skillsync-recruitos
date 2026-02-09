import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// BrightData Web Scraper API - Get snapshot data
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { apiKey: clientApiKey, snapshotId } = await request.json();

    // Use server-side env var, fallback to client-provided key
    const apiKey = process.env.BRIGHTDATA_API_KEY || clientApiKey;

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
    console.log("[BrightData] Snapshot response type:", typeof data);
    console.log("[BrightData] Snapshot is array:", Array.isArray(data));
    console.log("[BrightData] Snapshot data length:", Array.isArray(data) ? data.length : 'N/A');

    // BrightData returns an array of profiles, or a single profile object
    const profiles = Array.isArray(data) ? data : [data];
    console.log("[BrightData] Returning", profiles.length, "profile(s)");

    return NextResponse.json({ data: profiles, status: "ready" });
  } catch (error) {
    console.error("BrightData snapshot error:", error);
    return NextResponse.json(
      { message: "Failed to get snapshot data" },
      { status: 500 }
    );
  }
}

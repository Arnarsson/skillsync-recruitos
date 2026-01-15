import { NextRequest, NextResponse } from "next/server";

const BRIGHTDATA_BASE_URL = "https://api.brightdata.com/datasets/v3";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, apiKey, ...params } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "BrightData API key is required" },
        { status: 400 }
      );
    }

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    switch (action) {
      case "trigger": {
        // Trigger a new LinkedIn profile scrape
        const { url, dataset = "gd_l1viktl72bvl7bjuj0" } = params;

        if (!url) {
          return NextResponse.json(
            { error: "LinkedIn URL is required" },
            { status: 400 }
          );
        }

        const response = await fetch(`${BRIGHTDATA_BASE_URL}/trigger?dataset_id=${dataset}`, {
          method: "POST",
          headers,
          body: JSON.stringify([{ url }]),
        });

        if (!response.ok) {
          const error = await response.text();
          return NextResponse.json(
            { error: `BrightData trigger failed: ${error}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json(data);
      }

      case "progress": {
        // Check scrape progress
        const { snapshotId } = params;

        if (!snapshotId) {
          return NextResponse.json(
            { error: "Snapshot ID is required" },
            { status: 400 }
          );
        }

        const response = await fetch(
          `${BRIGHTDATA_BASE_URL}/progress/${snapshotId}`,
          { headers }
        );

        if (!response.ok) {
          const error = await response.text();
          return NextResponse.json(
            { error: `BrightData progress check failed: ${error}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json(data);
      }

      case "snapshot": {
        // Get completed snapshot data
        const { snapshotId } = params;

        if (!snapshotId) {
          return NextResponse.json(
            { error: "Snapshot ID is required" },
            { status: 400 }
          );
        }

        const response = await fetch(
          `${BRIGHTDATA_BASE_URL}/snapshot/${snapshotId}?format=json`,
          { headers }
        );

        if (!response.ok) {
          const error = await response.text();
          return NextResponse.json(
            { error: `BrightData snapshot failed: ${error}` },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json({ data });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("BrightData API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

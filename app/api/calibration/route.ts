import { NextRequest, NextResponse } from "next/server";
import { analyzeJobDescription } from "@/lib/services/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, url, text } = body;

    let jobText = "";

    if (type === "url" && url) {
      // Fetch job posting from URL
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SkillSync/1.0)",
          },
        });

        if (!response.ok) {
          return NextResponse.json(
            { error: "Failed to fetch job posting" },
            { status: 400 }
          );
        }

        const html = await response.text();
        // Extract text content (basic extraction)
        jobText = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 15000);
      } catch {
        return NextResponse.json(
          { error: "Failed to fetch job posting URL" },
          { status: 400 }
        );
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
    console.error("Calibration API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze job description" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateOutreach } from "@/lib/services/gemini";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateName, candidateRole, company, jobContext, instructions, connectionPath, sharedContext } = body;

    if (!candidateName || !jobContext) {
      return NextResponse.json(
        { error: "Candidate name and job context are required" },
        { status: 400 }
      );
    }

    // Build enriched instructions with connection context
    let enrichedInstructions = instructions || "Write a professional, personalized outreach message.";

    if (connectionPath) {
      enrichedInstructions += `\n\nConnection Path: ${connectionPath} (mention this warm intro if relevant)`;
    }

    if (sharedContext && sharedContext.length > 0) {
      enrichedInstructions += `\n\nShared Context/Hooks to use: ${sharedContext.join(", ")}`;
    }

    const message = await generateOutreach(
      candidateName,
      candidateRole || "Professional",
      company || "their company",
      jobContext,
      enrichedInstructions
    );

    return NextResponse.json({ message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Outreach API error:", errorMessage);
    return NextResponse.json(
      {
        error: "Failed to generate outreach message",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

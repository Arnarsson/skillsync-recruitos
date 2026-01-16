import { NextRequest, NextResponse } from "next/server";
import {
  generatePersona,
  analyzeCandidateProfile,
  generateDeepProfile,
} from "@/lib/services/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, candidateName, currentRole, company, location, skills } = body;

    // Build a profile text from available data
    const profileText = `
      Candidate: ${candidateName}
      Current Role: ${currentRole}
      Company: ${company}
      Location: ${location}
      Skills: ${skills?.join(", ") || "Not specified"}
      GitHub Username: ${candidateId}
    `;

    // Get job context from the request or use a default
    const jobContext =
      body.jobContext ||
      "Looking for a senior software engineer with strong technical skills and collaborative mindset.";

    // Run analysis in parallel
    const [persona, candidateAnalysis] = await Promise.all([
      generatePersona(profileText),
      analyzeCandidateProfile(profileText, jobContext),
    ]);

    // Generate deep profile based on candidate analysis
    const deepProfile = await generateDeepProfile(candidateAnalysis, jobContext);

    return NextResponse.json({
      persona,
      deepProfile,
      scoreBreakdown: candidateAnalysis.scoreBreakdown,
      keyEvidence: candidateAnalysis.keyEvidence,
      keyEvidenceWithSources: candidateAnalysis.keyEvidenceWithSources,
      risks: candidateAnalysis.risks,
      risksWithSources: candidateAnalysis.risksWithSources,
      alignmentScore: candidateAnalysis.alignmentScore,
    });
  } catch (error) {
    console.error("Profile analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze profile" },
      { status: 500 }
    );
  }
}

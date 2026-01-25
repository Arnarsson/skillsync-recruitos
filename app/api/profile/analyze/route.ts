import { NextRequest, NextResponse } from "next/server";
import {
  generatePersona,
  analyzeCandidateProfile,
  generateDeepProfile,
  generateNetworkDossier,
  EnrichmentData,
} from "@/lib/services/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      candidateId,
      candidateName,
      currentRole,
      company,
      location,
      skills,
      isShortlisted,  // Stage 3 flag - triggers network dossier generation
      enrichmentData, // Optional enrichment data from deep-enrichment API
    } = body;

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

    // Transform enrichment data to match EnrichmentData interface if provided
    let formattedEnrichment: EnrichmentData | undefined;
    if (enrichmentData) {
      formattedEnrichment = {
        github: enrichmentData.github ? {
          readme: enrichmentData.github.readme,
          prsToOthers: enrichmentData.github.prsToOthers || [],
          contributionPattern: enrichmentData.github.contributionPattern || {
            totalContributions: 0,
            averagePerWeek: 0,
            longestStreak: 0,
            mostActiveDay: 'Unknown',
            activityLevel: 'low' as const,
          },
          topics: enrichmentData.github.topics || [],
        } : undefined,
        linkedin: enrichmentData.linkedin ? {
          headline: enrichmentData.linkedin.headline,
          location: enrichmentData.linkedin.location,
          company: enrichmentData.linkedin.company,
        } : undefined,
        website: enrichmentData.website ? {
          url: enrichmentData.website.url,
          title: enrichmentData.website.title,
          topics: enrichmentData.website.topics || [],
          hasProjects: enrichmentData.website.hasProjects || false,
          hasBlog: enrichmentData.website.hasBlog || false,
          socialLinks: enrichmentData.website.socialLinks || [],
        } : undefined,
        talks: enrichmentData.talks ? {
          talks: enrichmentData.talks.talks || [],
          hasTalks: enrichmentData.talks.hasTalks || false,
          platforms: enrichmentData.talks.platforms || [],
        } : undefined,
      };
      console.log("[API] Using enrichment data for enhanced persona generation");
    }

    // Run analysis in parallel - pass enrichment data if available
    const [persona, candidateAnalysis] = await Promise.all([
      generatePersona(profileText, formattedEnrichment),
      analyzeCandidateProfile(profileText, jobContext),
    ]);

    // Generate deep profile based on candidate analysis
    const deepProfile = await generateDeepProfile(candidateAnalysis, jobContext);

    // Generate network dossier ONLY for shortlisted candidates (Stage 3)
    // This saves API costs by only generating strategic intelligence for serious candidates
    let networkDossier = null;
    if (isShortlisted) {
      try {
        networkDossier = await generateNetworkDossier(candidateAnalysis, jobContext);
        console.log(`[API] Generated network dossier for shortlisted candidate: ${candidateName}`);
      } catch (dossierError) {
        console.error("Network dossier generation failed (non-critical):", dossierError);
        // Don't fail the whole request if dossier generation fails
      }
    }

    return NextResponse.json({
      persona,
      deepProfile,
      networkDossier, // Will be null for non-shortlisted candidates
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

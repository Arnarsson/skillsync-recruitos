import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generatePersona,
  analyzeCandidateProfile,
  analyzeCandidateComparative,
  generateDeepProfile,
  generateNetworkDossier,
  EnrichmentData,
} from "@/lib/services/gemini";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and credits FIRST
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
      useComparativeAnalysis = true, // EU AI Act compliant mode (default: true)
    } = body;

    // Check if demo mode (skip credits)
    const isDemoMode = session.user.email === "demo@recruitos.xyz" || 
                       request.headers.get("x-demo-mode") === "true" ||
                       request.nextUrl.searchParams.get("demo") === "true";

    // Deduct credit before generating report (skip in demo mode)
    if (!isDemoMode) {
      try {
        const creditResponse = await fetch(`${request.nextUrl.origin}/api/credits`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "deduct",
            username: candidateId,
          }),
        });

        if (!creditResponse.ok) {
          const errorData = await creditResponse.json();
          
          if (creditResponse.status === 402) {
            return NextResponse.json(
              { error: "Insufficient credits. Please purchase more credits to continue." },
              { status: 402 }
            );
          }
          
          throw new Error(errorData.error || "Failed to deduct credit");
        }

        const creditData = await creditResponse.json();
        console.log(`Credit deducted for ${candidateName}. Remaining: ${creditData.creditsRemaining}`);
      } catch (creditError) {
        console.error("Credit deduction failed:", creditError);
        return NextResponse.json(
          { error: "Credit system error. Please try again." },
          { status: 500 }
        );
      }
    } else {
      console.log(`[Demo Mode] Skipping credit deduction for ${candidateName}`);
    }

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
    // Use comparative analysis (EU AI Act compliant) or legacy scoring
    const persona = await generatePersona(profileText, formattedEnrichment);
    
    let candidateAnalysis: any;
    let comparativeAnalysis: any;
    
    if (useComparativeAnalysis) {
      // EU AI Act compliant mode - comparative analysis instead of scoring
      comparativeAnalysis = await analyzeCandidateComparative(profileText, jobContext);
      // Create compatibility object for deepProfile generation
      candidateAnalysis = {
        name: comparativeAnalysis.name,
        currentRole: comparativeAnalysis.currentRole,
        company: comparativeAnalysis.company,
        location: comparativeAnalysis.location,
        alignmentScore: 0, // Not used in comparative mode
        scoreBreakdown: {} as any, // Not used in comparative mode
      };
    } else {
      // Legacy scoring mode (deprecated)
      candidateAnalysis = await analyzeCandidateProfile(profileText, jobContext);
    }

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

    // Build response based on analysis mode
    const response: any = {
      persona,
      deepProfile,
      networkDossier, // Will be null for non-shortlisted candidates
      analysisMode: useComparativeAnalysis ? 'comparative' : 'scoring',
    };
    
    if (useComparativeAnalysis) {
      // EU AI Act compliant response - comparative analysis
      response.comparativeAnalysis = comparativeAnalysis;
      response.euAiActCompliant = true;
    } else {
      // Legacy scoring response (deprecated)
      response.scoreBreakdown = candidateAnalysis.scoreBreakdown;
      response.keyEvidence = candidateAnalysis.keyEvidence;
      response.keyEvidenceWithSources = candidateAnalysis.keyEvidenceWithSources;
      response.risks = candidateAnalysis.risks;
      response.risksWithSources = candidateAnalysis.risksWithSources;
      response.alignmentScore = candidateAnalysis.alignmentScore;
      response.euAiActCompliant = false;
      response.warning = 'Using deprecated scoring mode. Switch to comparative analysis for EU AI Act compliance.';
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Profile analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze profile" },
      { status: 500 }
    );
  }
}

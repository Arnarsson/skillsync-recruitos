import { NextRequest, NextResponse } from "next/server";

// CORS headers for extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// In-memory storage for serverless (resets on cold start)
// TODO: Replace with database (Supabase, Vercel KV, etc.)
const memoryCaptures: any[] = [];

/**
 * POST /api/linkedin/candidate
 * Receives candidate profile data from the LinkedIn extension
 */
export async function POST(request: NextRequest) {
  try {
    // For demo/testing: accept requests without API key
    // TODO: Add proper auth later
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "") || "demo";
    
    const body = await request.json();
    const { source, profile, capturedAt } = body;
    
    if (!profile || !profile.linkedinId) {
      return NextResponse.json(
        { error: "Profile data with linkedinId required" },
        { status: 400 }
      );
    }
    
    // Normalize the profile data (including rich capture fields)
    const candidate = {
      id: `li_${profile.linkedinId}_${Date.now()}`,
      linkedinId: profile.linkedinId,
      linkedinUrl: profile.url,
      name: profile.name,
      headline: profile.headline,
      location: profile.location,
      currentCompany: profile.currentCompany,
      photoUrl: profile.photoUrl,
      about: profile.about,
      // Rich capture: full work history
      experience: profile.experience || [],
      // Rich capture: education
      education: profile.education || [],
      // Rich capture: skills with endorsements
      skills: profile.skills || [],
      // Rich capture: languages
      languages: profile.languages || [],
      // Rich capture: certifications
      certifications: profile.certifications || [],
      // Connection info
      connectionDegree: profile.connectionDegree,
      mutualConnections: profile.mutualConnections,
      connectionCount: profile.connectionCount,
      followers: profile.followers,
      // Flags
      openToWork: profile.openToWork || false,
      isPremium: profile.isPremium || false,
      isCreator: profile.isCreator || false,
      // Meta
      source: source || "linkedin_extension",
      capturedAt: capturedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    // Check for duplicates in memory
    const existingIndex = memoryCaptures.findIndex(c => c.linkedinId === candidate.linkedinId);
    const isDuplicate = existingIndex !== -1;
    
    if (isDuplicate) {
      memoryCaptures[existingIndex] = { ...memoryCaptures[existingIndex], ...candidate, updatedAt: new Date().toISOString() };
    } else {
      memoryCaptures.unshift(candidate);
    }
    
    // Keep last 500
    if (memoryCaptures.length > 500) {
      memoryCaptures.splice(500);
    }
    
    console.log("[LinkedIn Extension] Candidate received:", candidate.name, candidate.linkedinId);
    
    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        linkedinId: candidate.linkedinId,
        status: isDuplicate ? "updated" : "captured",
      },
      isDuplicate,
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error("[LinkedIn Extension] Candidate error:", error);
    return NextResponse.json(
      { error: "Failed to process candidate", details: error?.message || String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/linkedin/candidate
 * List all captures or check if a candidate exists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkedinId = searchParams.get("linkedinId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // If looking for specific candidate
    if (linkedinId) {
      const candidate = memoryCaptures.find(c => c.linkedinId === linkedinId);
      return NextResponse.json({
        exists: !!candidate,
        candidate: candidate || null,
      }, { headers: corsHeaders });
    }
    
    // Return paginated list
    const paginated = memoryCaptures.slice(offset, offset + limit);
    
    return NextResponse.json({
      candidates: paginated,
      total: memoryCaptures.length,
      limit,
      offset,
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error("[LinkedIn Extension] Candidate lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup candidate" },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".data", "linkedin-captures.json");

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

async function loadCaptures(): Promise<any[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveCaptures(captures: any[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(captures, null, 2));
}

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
    
    // Normalize the profile data
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
      experience: profile.experience || [],
      connectionDegree: profile.connectionDegree,
      mutualConnections: profile.mutualConnections,
      source: source || "linkedin_extension",
      capturedAt: capturedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    // Load existing captures
    const captures = await loadCaptures();
    
    // Check for duplicates
    const existingIndex = captures.findIndex(c => c.linkedinId === candidate.linkedinId);
    const isDuplicate = existingIndex !== -1;
    
    if (isDuplicate) {
      // Update existing
      captures[existingIndex] = { ...captures[existingIndex], ...candidate, updatedAt: new Date().toISOString() };
    } else {
      // Add new
      captures.unshift(candidate);
    }
    
    // Keep last 500
    const trimmed = captures.slice(0, 500);
    await saveCaptures(trimmed);
    
    console.log("[LinkedIn Extension] Candidate saved:", {
      name: candidate.name,
      linkedinId: candidate.linkedinId,
      isDuplicate,
    });
    
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
    
  } catch (error) {
    console.error("[LinkedIn Extension] Candidate error:", error);
    return NextResponse.json(
      { error: "Failed to process candidate" },
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
    
    const captures = await loadCaptures();
    
    // If looking for specific candidate
    if (linkedinId) {
      const candidate = captures.find(c => c.linkedinId === linkedinId);
      return NextResponse.json({
        exists: !!candidate,
        candidate: candidate || null,
      }, { headers: corsHeaders });
    }
    
    // Return paginated list
    const paginated = captures.slice(offset, offset + limit);
    
    return NextResponse.json({
      candidates: paginated,
      total: captures.length,
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

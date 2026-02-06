import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// In-memory storage (TODO: replace with database)
const notesStorage = new Map<string, Note[]>();

interface Note {
  id: string;
  linkedinId: string;
  author: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/linkedin/notes?linkedinId=xxx
 * Get all notes for a candidate
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const linkedinId = searchParams.get("linkedinId");
  
  if (!linkedinId) {
    return NextResponse.json(
      { error: "linkedinId is required" },
      { status: 400, headers: corsHeaders }
    );
  }
  
  const notes = notesStorage.get(linkedinId) || [];
  
  return NextResponse.json({
    success: true,
    notes,
    count: notes.length,
  }, { headers: corsHeaders });
}

/**
 * POST /api/linkedin/notes
 * Add a note to a candidate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkedinId, author, content, tags = [] } = body;
    
    if (!linkedinId || !content) {
      return NextResponse.json(
        { error: "linkedinId and content are required" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const note: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      linkedinId,
      author: author || "Anonymous",
      content,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const existingNotes = notesStorage.get(linkedinId) || [];
    existingNotes.push(note);
    notesStorage.set(linkedinId, existingNotes);
    
    return NextResponse.json({
      success: true,
      note,
    }, { headers: corsHeaders });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to add note", details: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * DELETE /api/linkedin/notes?noteId=xxx&linkedinId=xxx
 * Delete a note
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get("noteId");
  const linkedinId = searchParams.get("linkedinId");
  
  if (!noteId || !linkedinId) {
    return NextResponse.json(
      { error: "noteId and linkedinId are required" },
      { status: 400, headers: corsHeaders }
    );
  }
  
  const notes = notesStorage.get(linkedinId) || [];
  const filtered = notes.filter(n => n.id !== noteId);
  notesStorage.set(linkedinId, filtered);
  
  return NextResponse.json({
    success: true,
    deleted: notes.length !== filtered.length,
  }, { headers: corsHeaders });
}

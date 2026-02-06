import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/linkedin/messages
 * Receives LinkedIn messages from the extension
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key from extension
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { source, messages, syncedAt } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array required" },
        { status: 400 }
      );
    }
    
    // Process messages
    const processed = [];
    const skipped = [];
    
    for (const msg of messages) {
      // Basic validation
      if (!msg.content || !msg.sender) {
        skipped.push({ reason: "missing content or sender" });
        continue;
      }
      
      // Normalize message
      const normalizedMsg = {
        platform: "linkedin",
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        conversationWith: msg.conversationWith,
        threadUrl: msg.url,
        source: source || "linkedin_extension",
        syncedAt: syncedAt || new Date().toISOString(),
      };
      
      // TODO: Store in database
      // TODO: Link to candidate if sender matches
      // TODO: Deduplicate by content hash
      
      processed.push({
        sender: normalizedMsg.sender,
        preview: normalizedMsg.content.substring(0, 50) + "...",
      });
    }
    
    console.log("[LinkedIn Extension] Messages synced:", {
      total: messages.length,
      processed: processed.length,
      skipped: skipped.length,
    });
    
    return NextResponse.json({
      success: true,
      received: messages.length,
      processed: processed.length,
      skipped: skipped.length,
    });
    
  } catch (error) {
    console.error("[LinkedIn Extension] Messages error:", error);
    return NextResponse.json(
      { error: "Failed to process messages" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/linkedin/messages
 * Retrieve synced messages for a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const conversationWith = searchParams.get("conversationWith");
    const linkedinId = searchParams.get("linkedinId");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    // TODO: Retrieve from database
    // For now, return empty
    
    return NextResponse.json({
      messages: [],
      total: 0,
      limit,
    });
    
  } catch (error) {
    console.error("[LinkedIn Extension] Messages fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

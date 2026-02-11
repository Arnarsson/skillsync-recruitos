import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { requireUserOrExtension } from "@/lib/extension-auth";

/**
 * POST /api/linkedin/messages
 * Receives LinkedIn messages from the extension
 */
export async function POST(request: NextRequest) {
  const auth = await requireUserOrExtension(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { source, messages, syncedAt } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array required" },
        { status: 400 }
      );
    }

    const persisted = [];
    const skipped = [];

    for (const msg of messages) {
      if (!msg.content || !msg.sender) {
        skipped.push({ reason: "missing content or sender" });
        continue;
      }

      const normalizedMsg = {
        platform: "linkedin",
        sender: String(msg.sender),
        content: String(msg.content),
        timestamp: msg.timestamp ? String(msg.timestamp) : null,
        conversationWith: msg.conversationWith
          ? String(msg.conversationWith)
          : null,
        threadUrl: msg.url ? String(msg.url) : null,
        source: source || "linkedin_extension",
        syncedAt: syncedAt || new Date().toISOString(),
      };

      const dedupeKey = createHash("sha256")
        .update(
          [
            normalizedMsg.platform,
            normalizedMsg.sender,
            normalizedMsg.conversationWith || "",
            normalizedMsg.threadUrl || "",
            normalizedMsg.timestamp || "",
            normalizedMsg.content,
          ].join("|")
        )
        .digest("hex");

      const created = await prisma.linkedinMessage.upsert({
        where: { dedupeKey },
        update: {
          syncedAt: new Date(normalizedMsg.syncedAt),
          source: normalizedMsg.source,
        },
        create: {
          platform: normalizedMsg.platform,
          sender: normalizedMsg.sender,
          content: normalizedMsg.content,
          timestamp: normalizedMsg.timestamp,
          conversationWith: normalizedMsg.conversationWith,
          threadUrl: normalizedMsg.threadUrl,
          source: normalizedMsg.source,
          syncedAt: new Date(normalizedMsg.syncedAt),
          dedupeKey,
        },
      });

      persisted.push({
        id: created.id,
        sender: created.sender,
        preview:
          created.content.length > 50
            ? `${created.content.substring(0, 50)}...`
            : created.content,
      });
    }

    console.log("[LinkedIn Extension] Messages synced:", {
      total: messages.length,
      processed: persisted.length,
      skipped: skipped.length,
    });

    return NextResponse.json({
      success: true,
      received: messages.length,
      processed: persisted.length,
      skipped: skipped.length,
      persisted: true,
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
  const auth = await requireUserOrExtension(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const conversationWith = searchParams.get("conversationWith");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sender = searchParams.get("sender");
    const threadUrl = searchParams.get("threadUrl");

    const where = {
      ...(conversationWith
        ? { conversationWith }
        : {}),
      ...(sender ? { sender } : {}),
      ...(threadUrl ? { threadUrl } : {}),
    };

    const [messages, total] = await Promise.all([
      prisma.linkedinMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(Math.max(limit, 1), 200),
      }),
      prisma.linkedinMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      total,
      limit,
      persisted: true,
    });

  } catch (error) {
    console.error("[LinkedIn Extension] Messages fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

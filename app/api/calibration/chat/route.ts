import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  buildSystemPrompt,
  determinePhase,
  type CalibrationMessage,
  type HiringSpec,
} from "@/services/calibrationService";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001";

interface ChatRequestBody {
  messages: CalibrationMessage[];
  userMessage: string;
  currentSpec?: Partial<HiringSpec>;
}

interface AIResponse {
  message: string;
  specUpdates: Partial<HiringSpec>;
  phase: "gathering" | "refining" | "complete";
  suggestedQuestions?: string[];
}

function getApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

/**
 * Parse the AI response text into a structured response.
 * Falls back gracefully if the AI doesn't return perfect JSON.
 */
function parseAIResponse(text: string): AIResponse {
  let jsonString = text.trim();

  // Strip markdown code blocks
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    const startIndex = jsonString.indexOf("{");
    const endIndex = jsonString.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonString = jsonString.substring(startIndex, endIndex + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      message: parsed.message || text,
      specUpdates: parsed.specUpdates || {},
      phase: parsed.phase || "gathering",
      suggestedQuestions: parsed.suggestedQuestions || [],
    };
  } catch {
    // If JSON parsing fails, treat the whole response as a message
    return {
      message: text.replace(/```[\s\S]*?```/g, "").trim(),
      specUpdates: {},
      phase: "gathering",
      suggestedQuestions: [],
    };
  }
}

/**
 * Merge spec updates into the current spec, preserving existing data.
 */
function mergeSpec(
  current: Partial<HiringSpec>,
  updates: Partial<HiringSpec>
): Partial<HiringSpec> {
  const merged = { ...current };

  if (updates.title) merged.title = updates.title;
  if (updates.level) merged.level = updates.level;
  if (updates.summary) merged.summary = updates.summary;

  // Merge skills: add new ones, don't remove existing
  if (updates.skills && updates.skills.length > 0) {
    const existingNames = new Set(
      (merged.skills || []).map((s) => s.name.toLowerCase())
    );
    const newSkills = updates.skills.filter(
      (s) => !existingNames.has(s.name.toLowerCase())
    );
    merged.skills = [...(merged.skills || []), ...newSkills];
  }

  if (updates.experience) {
    merged.experience = { ...(merged.experience || {}), ...updates.experience } as HiringSpec["experience"];
  }

  if (updates.location) {
    merged.location = { ...(merged.location || {}), ...updates.location } as HiringSpec["location"];
  }

  if (updates.teamContext) {
    merged.teamContext = { ...(merged.teamContext || {}), ...updates.teamContext } as HiringSpec["teamContext"];
  }

  if (updates.salary) {
    merged.salary = { ...(merged.salary || {}), ...updates.salary } as HiringSpec["salary"];
  }

  return merged;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body: ChatRequestBody = await request.json();
    const { messages, userMessage, currentSpec } = body;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      );
    }

    const spec = currentSpec || {};
    const systemPrompt = buildSystemPrompt(spec);

    // Build the message history for the AI
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (limited to last 10 messages to stay within context)
    const recentMessages = (messages || []).slice(-10);
    for (const msg of recentMessages) {
      aiMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }

    // Add the new user message
    aiMessages.push({ role: "user", content: userMessage });

    console.log(
      `[CalibrationChat] Processing message (${aiMessages.length} messages in context)`
    );

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://skillsync.app",
        "X-Title": "SkillSync Recruiting - Calibration",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[CalibrationChat] OpenRouter error ${response.status}:`,
        errorText.substring(0, 200)
      );
      return NextResponse.json(
        {
          error: "AI service error",
          details: `OpenRouter returned ${response.status}`,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (!content) {
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 502 }
      );
    }

    // Parse the structured response
    const aiResponse = parseAIResponse(content);

    // Merge spec updates
    const updatedSpec = mergeSpec(spec, aiResponse.specUpdates);

    // Determine phase based on actual spec completeness
    const messageCount = (messages || []).length + 2; // +2 for new user + assistant messages
    const computedPhase = determinePhase(updatedSpec, messageCount);
    // Use the more advanced phase (AI suggestion or computed)
    const phases = ["gathering", "refining", "complete"] as const;
    const aiPhaseIndex = phases.indexOf(aiResponse.phase);
    const computedPhaseIndex = phases.indexOf(computedPhase);
    const finalPhase = phases[Math.max(aiPhaseIndex, computedPhaseIndex)];

    return NextResponse.json({
      message: aiResponse.message,
      spec: updatedSpec,
      phase: finalPhase,
      suggestedQuestions: aiResponse.suggestedQuestions || [],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("[CalibrationChat] Error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to process message", details: errorMessage },
      { status: 500 }
    );
  }
}

// Allow longer AI processing
export const maxDuration = 60;

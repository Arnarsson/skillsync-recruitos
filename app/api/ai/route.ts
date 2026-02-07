import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// AI provider models
const OPENROUTER_PRIMARY_MODEL = "google/gemini-3-flash-preview";
const OPENROUTER_FALLBACK_MODEL = "google/gemini-2.5-flash";

type OperationType =
  | "analyze"
  | "persona"
  | "outreach"
  | "compare"
  | "deepProfile"
  | "generic";

interface AIRequestBody {
  operation: OperationType;
  prompt: string;
  schema?: unknown;
  options?: {
    max_tokens?: number;
    temperature?: number;
    provider?: "openrouter" | "gemini";
  };
}

/**
 * Call OpenRouter API with retry and model fallback
 */
async function callOpenRouter(
  prompt: string,
  schema?: unknown,
  options?: { max_tokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured on server");
  }

  const messages = [{ role: "user", content: prompt }];
  const requestBody: Record<string, unknown> = {
    model: OPENROUTER_PRIMARY_MODEL,
    messages,
    temperature: options?.temperature ?? 0.1,
    max_tokens: options?.max_tokens ?? 4000,
  };

  if (schema) {
    requestBody.response_format = {
      type: "json_schema",
      json_schema: {
        name: "response",
        strict: true,
        schema,
      },
    };
  }

  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://skillsync.app",
          "X-Title": "RecruitOS AI Proxy",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(
          `[AI Proxy] 429 Rate Limit (Attempt ${i + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        // If primary model fails, try fallback model
        if (
          requestBody.model === OPENROUTER_PRIMARY_MODEL &&
          response.status >= 400 &&
          response.status !== 429
        ) {
          console.log(
            `[AI Proxy] Primary model failed (${response.status}), falling back to ${OPENROUTER_FALLBACK_MODEL}...`
          );
          requestBody.model = OPENROUTER_FALLBACK_MODEL;
          i--; // Don't count as retry
          continue;
        }

        const error = await response.text();
        throw new Error(
          `OpenRouter API error (${response.status}): ${error.substring(0, 200)}`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("OpenRouter call failed after maximum retries");
}

/**
 * Call Gemini SDK directly
 */
async function callGemini(
  prompt: string,
  options?: { max_tokens?: number }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured on server");
  }

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      maxOutputTokens: options?.max_tokens ?? 4000,
    },
  });

  const text = result.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text;
}

/**
 * POST /api/ai
 *
 * Unified AI proxy that handles all AI calls server-side.
 * Client sends prompt and operation type; server adds API keys.
 */
export async function POST(request: NextRequest) {
  try {
    const body: AIRequestBody = await request.json();
    const { operation, prompt, schema, options } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    if (!operation) {
      return NextResponse.json(
        { error: "operation is required" },
        { status: 400 }
      );
    }

    const provider = options?.provider || "openrouter";

    let result: string;

    if (provider === "gemini") {
      result = await callGemini(prompt, {
        max_tokens: options?.max_tokens,
      });
    } else {
      result = await callOpenRouter(prompt, schema, {
        max_tokens: options?.max_tokens,
        temperature: options?.temperature,
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("[AI Proxy] Error:", errorMessage);
    return NextResponse.json(
      {
        error: "AI operation failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

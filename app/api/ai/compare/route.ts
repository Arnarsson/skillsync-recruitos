import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export const maxDuration = 60;

/** Sanitize user-controlled strings before interpolating into AI prompts */
function sanitizeForPrompt(value: string | undefined | null, maxLen = 200): string {
  if (!value) return "Unknown";
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>{}[\]`]/g, "")
    .trim()
    .slice(0, maxLen);
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

interface CandidateInput {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  yearsExperience?: number;
  skills?: string[];
  scoreBreakdown?: {
    skills?: { percentage?: number; value?: number; max?: number };
    experience?: { percentage?: number; value?: number; max?: number };
    industry?: { percentage?: number; value?: number; max?: number };
    seniority?: { percentage?: number; value?: number; max?: number };
    location?: { percentage?: number; value?: number; max?: number };
  };
  persona?: {
    archetype?: string;
    softSkills?: string[];
    greenFlags?: string[];
    redFlags?: string[];
  };
  keyEvidence?: string[];
  risks?: string[];
  shortlistSummary?: string;
}

interface CompareRequest {
  candidates: CandidateInput[];
  jobContext?: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body: CompareRequest = await request.json();
    const { candidates, jobContext } = body;

    if (!candidates || candidates.length < 2) {
      return NextResponse.json(
        { error: "At least 2 candidates are required for comparison" },
        { status: 400 }
      );
    }

    if (candidates.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 candidates can be compared at once" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build candidate summaries for the prompt (sanitize all user-controlled fields)
    const candidateSummaries = candidates
      .map(
        (c, i) => `
Candidate ${i + 1} (ID: ${sanitizeForPrompt(c.id, 50)}):
- Name: ${sanitizeForPrompt(c.name)}
- Current Role: ${sanitizeForPrompt(c.currentRole)}
- Company: ${sanitizeForPrompt(c.company)}
- Location: ${sanitizeForPrompt(c.location)}
- Alignment Score: ${c.alignmentScore}/100
- Years Experience: ${c.yearsExperience ?? "Unknown"}
- Skills: ${c.skills?.map(s => sanitizeForPrompt(s, 50)).join(", ") || "Not specified"}
- Key Evidence: ${c.keyEvidence?.map(e => sanitizeForPrompt(e, 100)).join("; ") || "Not available"}
- Risks: ${c.risks?.map(r => sanitizeForPrompt(r, 100)).join("; ") || "None identified"}
- Summary: ${sanitizeForPrompt(c.shortlistSummary, 500)}
- Persona: ${sanitizeForPrompt(c.persona?.archetype)}
- Soft Skills: ${c.persona?.softSkills?.map(s => sanitizeForPrompt(s, 50)).join(", ") || "Not assessed"}
- Green Flags: ${c.persona?.greenFlags?.map(f => sanitizeForPrompt(f, 100)).join("; ") || "None"}
- Red Flags: ${c.persona?.redFlags?.map(f => sanitizeForPrompt(f, 100)).join("; ") || "None"}
- Score Breakdown:
  - Skills: ${c.scoreBreakdown?.skills?.percentage ?? "N/A"}%
  - Experience: ${c.scoreBreakdown?.experience?.percentage ?? "N/A"}%
  - Industry: ${c.scoreBreakdown?.industry?.percentage ?? "N/A"}%
  - Seniority: ${c.scoreBreakdown?.seniority?.percentage ?? "N/A"}%
  - Location: ${c.scoreBreakdown?.location?.percentage ?? "N/A"}%`
      )
      .join("\n");

    const candidateIds = candidates.map((c) => c.id);

    const prompt = `You are an expert recruitment analyst. Compare the following ${candidates.length} candidates for a role and provide a structured analysis.

${jobContext ? `Job Context: ${jobContext}\n` : ""}

${candidateSummaries}

Analyze each candidate across these dimensions: skills, experience, industry, seniority, and location.
For each dimension, assign a score (0-100) and a brief note explaining your reasoning.
Then provide an overall verdict with your recommendation.

You MUST respond with valid JSON in exactly this format (no markdown, no code fences):
{
  "dimensions": {
    "skills": {
      ${candidateIds.map((id) => `"${id}": { "score": <number 0-100>, "notes": "<brief explanation>" }`).join(",\n      ")}
    },
    "experience": {
      ${candidateIds.map((id) => `"${id}": { "score": <number 0-100>, "notes": "<brief explanation>" }`).join(",\n      ")}
    },
    "industry": {
      ${candidateIds.map((id) => `"${id}": { "score": <number 0-100>, "notes": "<brief explanation>" }`).join(",\n      ")}
    },
    "seniority": {
      ${candidateIds.map((id) => `"${id}": { "score": <number 0-100>, "notes": "<brief explanation>" }`).join(",\n      ")}
    },
    "location": {
      ${candidateIds.map((id) => `"${id}": { "score": <number 0-100>, "notes": "<brief explanation>" }`).join(",\n      ")}
    }
  },
  "verdict": {
    "recommended": "<candidateId of the best match>",
    "reasoning": "<2-3 sentences explaining why this candidate is the best fit>",
    "tradeoffs": "<1-2 sentences about what you'd trade off by choosing the recommended candidate over others>"
  }
}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://skillsync.app",
        "X-Title": "SkillSync Recruiting",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert recruitment analyst. Always respond with valid JSON only. No markdown, no code fences, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText.substring(0, 300));
      return NextResponse.json(
        {
          error: "AI comparison failed",
          details: `API returned ${response.status}`,
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

    // Parse the JSON response, handling potential markdown code fences
    let parsed;
    try {
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      return NextResponse.json(
        {
          error: "Failed to parse AI comparison response",
          raw: content.substring(0, 1000),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("Compare API error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to generate comparison", details: errorMessage },
      { status: 500 }
    );
  }
}

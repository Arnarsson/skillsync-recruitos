import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-001";

// Tone configurations for multi-variant outreach
const TONE_CONFIGS = {
  professional: {
    name: "Professional",
    description: "Formal business tone, emphasis on opportunity and company",
    prompt: `Write in a PROFESSIONAL business tone. Be formal but approachable.
Focus on the opportunity, company credentials, and career advancement.
Use complete sentences, proper grammar, and maintain a respectful distance.
Avoid slang, emojis, or overly casual language.`
  },
  warm: {
    name: "Warm & Personal",
    description: "Conversational tone, emphasis on shared interests and connection",
    prompt: `Write in a WARM and PERSONAL tone. Be conversational and friendly.
Focus on shared interests, mutual connections, and building rapport.
Reference specific things about them that show you've done your research.
Use a natural, approachable voice - like reaching out to a potential friend.`
  },
  technical: {
    name: "Technical",
    description: "Lead with tech credibility, specific challenges and stack",
    prompt: `Write in a TECHNICAL tone. Lead with engineering credibility.
Focus on the technical challenges, stack, architecture decisions, and engineering culture.
Mention specific technologies they work with and how they'd apply.
Speak engineer-to-engineer - be direct about the technical problems worth solving.`
  }
};

type ToneKey = keyof typeof TONE_CONFIGS;

async function generateSingleOutreach(
  candidateName: string,
  candidateRole: string,
  company: string,
  jobContext: string,
  instructions: string,
  tone: ToneKey
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const toneConfig = TONE_CONFIGS[tone];

  const prompt = `
Generate a personalized outreach message for recruiting.

${toneConfig.prompt}

Candidate: ${candidateName} (${candidateRole} at ${company})
Job Context: ${jobContext}
Additional Instructions: ${instructions}

IMPORTANT:
- Keep the message concise (under 150 words)
- Make it feel genuine, not templated
- Include a clear call to action
- Don't be pushy or use high-pressure tactics

Return ONLY the message text, no JSON or formatting.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://skillsync.app",
      "X-Title": "SkillSync Recruiting"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert recruiter writing personalized outreach messages. Be authentic and human." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  if (!content) {
    throw new Error("AI returned empty response");
  }

  return content.trim();
}

// Map persona archetypes to recommended tones
function getRecommendedTone(archetype?: string): ToneKey {
  if (!archetype) return "professional";

  const archetypeLower = archetype.toLowerCase();

  // Technical/craft-focused archetypes
  if (
    archetypeLower.includes("craftsperson") ||
    archetypeLower.includes("engineer") ||
    archetypeLower.includes("architect") ||
    archetypeLower.includes("technical") ||
    archetypeLower.includes("builder") ||
    archetypeLower.includes("hacker") ||
    archetypeLower.includes("developer")
  ) {
    return "technical";
  }

  // Business/strategic archetypes
  if (
    archetypeLower.includes("strategic") ||
    archetypeLower.includes("scaler") ||
    archetypeLower.includes("leader") ||
    archetypeLower.includes("executive") ||
    archetypeLower.includes("manager") ||
    archetypeLower.includes("director")
  ) {
    return "professional";
  }

  // Collaborative/people-focused archetypes
  if (
    archetypeLower.includes("collaborator") ||
    archetypeLower.includes("mentor") ||
    archetypeLower.includes("connector") ||
    archetypeLower.includes("community") ||
    archetypeLower.includes("team")
  ) {
    return "warm";
  }

  // Default to professional
  return "professional";
}

export interface OutreachVariant {
  tone: ToneKey;
  name: string;
  description: string;
  message: string;
  isRecommended: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      candidateName,
      candidateRole,
      company,
      jobContext,
      instructions,
      connectionPath,
      sharedContext,
      personaArchetype,
      multiVariant = false // New flag to request all 3 variants
    } = body;

    if (!candidateName || !jobContext) {
      return NextResponse.json(
        { error: "Candidate name and job context are required" },
        { status: 400 }
      );
    }

    // Build enriched instructions with connection context
    let enrichedInstructions = instructions || "Write a professional, personalized outreach message.";

    if (connectionPath) {
      enrichedInstructions += `\n\nConnection Path: ${connectionPath} (mention this warm intro if relevant)`;
    }

    if (sharedContext && sharedContext.length > 0) {
      enrichedInstructions += `\n\nShared Context/Hooks to use: ${sharedContext.join(", ")}`;
    }

    // Multi-variant mode: generate all 3 tones in parallel
    if (multiVariant) {
      const recommendedTone = getRecommendedTone(personaArchetype);

      const tones: ToneKey[] = ["professional", "warm", "technical"];

      const results = await Promise.all(
        tones.map(async (tone) => {
          try {
            const message = await generateSingleOutreach(
              candidateName,
              candidateRole || "Professional",
              company || "their company",
              jobContext,
              enrichedInstructions,
              tone
            );
            return {
              tone,
              name: TONE_CONFIGS[tone].name,
              description: TONE_CONFIGS[tone].description,
              message,
              isRecommended: tone === recommendedTone
            };
          } catch (error) {
            console.error(`Failed to generate ${tone} variant:`, error);
            return {
              tone,
              name: TONE_CONFIGS[tone].name,
              description: TONE_CONFIGS[tone].description,
              message: "",
              isRecommended: tone === recommendedTone,
              error: error instanceof Error ? error.message : "Generation failed"
            };
          }
        })
      );

      return NextResponse.json({
        variants: results,
        recommendedTone
      });
    }

    // Single message mode (backward compatible)
    const message = await generateSingleOutreach(
      candidateName,
      candidateRole || "Professional",
      company || "their company",
      jobContext,
      enrichedInstructions,
      "professional"
    );

    return NextResponse.json({ message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Outreach API error:", errorMessage);
    return NextResponse.json(
      {
        error: "Failed to generate outreach message",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

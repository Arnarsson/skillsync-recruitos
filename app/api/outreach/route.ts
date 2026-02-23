import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { outreachGenerateSchema } from "@/lib/validation/apiSchemas";

export const maxDuration = 60;

/** Sanitize user-controlled strings before interpolating into AI prompts */
function sanitizeForPrompt(value: string | undefined, maxLen = 200): string {
  if (!value) return "Unknown";
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>{}[\]`]/g, "")
    .trim()
    .slice(0, maxLen);
}

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

Candidate: ${sanitizeForPrompt(candidateName)} (${sanitizeForPrompt(candidateRole)} at ${sanitizeForPrompt(company)})
Job Context: ${sanitizeForPrompt(jobContext, 2000)}
Additional Instructions: ${sanitizeForPrompt(instructions, 500)}

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
  const session = await getServerSession(authOptions);
  const isDemoMode =
    session?.user?.email === "demo@recruitos.xyz" ||
    request.headers.get("x-demo-mode") === "true" ||
    request.nextUrl.searchParams.get("demo") === "true";

  if (!session?.user && !isDemoMode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo mode: return synthetic response without calling external AI
  if (isDemoMode) {
    try {
      const body = await request.json();
      const parsed = outreachGenerateSchema.safeParse(body);
      const candidateName = parsed.success ? parsed.data.candidateName : "there";

      const demoVariants: OutreachVariant[] = [
        {
          tone: "professional",
          name: "Professional",
          description: TONE_CONFIGS.professional.description,
          message: `Hi ${candidateName},\n\nI came across your GitHub profile and was genuinely impressed by your work. We're building something ambitious at our company and your technical background aligns strongly with what we're looking for.\n\nWould you be open to a 15-minute chat this week to learn more?\n\nBest regards`,
          isRecommended: false,
        },
        {
          tone: "warm",
          name: "Warm & Personal",
          description: TONE_CONFIGS.warm.description,
          message: `Hey ${candidateName}!\n\nI've been following some of your open-source contributions and I'm really impressed by the quality of your work. We share a passion for clean, well-architected code.\n\nI'd love to tell you about what we're working on — I think you'd find the technical challenges genuinely exciting. Coffee chat sometime this week?\n\nCheers`,
          isRecommended: true,
        },
        {
          tone: "technical",
          name: "Technical",
          description: TONE_CONFIGS.technical.description,
          message: `Hi ${candidateName},\n\nYour approach to distributed systems caught my eye — especially how you've structured your recent projects. We're tackling similar problems at scale and could use someone with your depth.\n\nThe stack is modern (TypeScript, Go, K8s) and the problems are real. Happy to share our architecture doc if you're curious.\n\nLet me know if you'd like to dig in.`,
          isRecommended: false,
        },
      ];

      return NextResponse.json({
        variants: demoVariants,
        recommendedTone: "warm",
        demo: true,
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = outreachGenerateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      candidateName,
      candidateRole,
      company,
      jobContext,
      instructions,
      connectionPath,
      sharedContext,
      personaArchetype,
      multiVariant,
    } = parsed.data;

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

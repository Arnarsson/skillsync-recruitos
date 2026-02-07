/**
 * Calibration Service — Conversational Intake Engine
 *
 * Manages multi-turn AI conversations that build precision hiring specs.
 * Uses OpenRouter for server-side AI calls.
 */

export interface HiringSpec {
  title: string;
  level: string; // junior/mid/senior/lead/principal
  skills: { name: string; priority: "must-have" | "nice-to-have" | "bonus" }[];
  experience: { min: number; max: number };
  location: { preference: string; remote: boolean };
  teamContext: { size: number; role: "ic" | "lead" | "manager" };
  salary?: { min: number; max: number; currency: string };
  summary: string;
}

export interface CalibrationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CalibrationState {
  messages: CalibrationMessage[];
  spec: Partial<HiringSpec>;
  phase: "gathering" | "refining" | "complete";
}

/**
 * Build the system prompt that instructs the AI how to conduct the intake conversation.
 */
export function buildSystemPrompt(currentSpec: Partial<HiringSpec>): string {
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  if (currentSpec.title) filledFields.push(`Title: ${currentSpec.title}`);
  else missingFields.push("title");

  if (currentSpec.level) filledFields.push(`Level: ${currentSpec.level}`);
  else missingFields.push("level (junior/mid/senior/lead/principal)");

  if (currentSpec.skills && currentSpec.skills.length > 0)
    filledFields.push(
      `Skills: ${currentSpec.skills.map((s) => `${s.name} (${s.priority})`).join(", ")}`
    );
  else missingFields.push("skills with priority (must-have/nice-to-have/bonus)");

  if (currentSpec.experience)
    filledFields.push(
      `Experience: ${currentSpec.experience.min}-${currentSpec.experience.max} years`
    );
  else missingFields.push("years of experience range");

  if (currentSpec.location)
    filledFields.push(
      `Location: ${currentSpec.location.preference} (${currentSpec.location.remote ? "remote OK" : "on-site"})`
    );
  else missingFields.push("location preference and remote policy");

  if (currentSpec.teamContext)
    filledFields.push(
      `Team: ${currentSpec.teamContext.size} people, role is ${currentSpec.teamContext.role}`
    );
  else missingFields.push("team size and whether this is IC/lead/manager");

  return `You are a calibration assistant for a recruitment platform called RecruitOS. Your job is to have a focused conversation (3-5 exchanges) with a recruiter to build a precise hiring specification.

RULES:
- Be concise and professional. Each response should be 2-4 sentences max.
- Ask about ONE or TWO missing fields at a time, never overwhelm with questions.
- When the user provides information, acknowledge it briefly and move to the next gap.
- After you have enough information (at least title, level, skills, experience, location), suggest finalizing.
- Support both Danish and English input. Respond in the same language the user uses.
- When suggesting skills, use standard technology names (React, TypeScript, Python, etc.).
- Always return your response as JSON with this structure:
{
  "message": "Your conversational response to the user",
  "specUpdates": { ... partial HiringSpec fields to merge },
  "phase": "gathering" | "refining" | "complete",
  "suggestedQuestions": ["Quick reply option 1", "Quick reply option 2", "Quick reply option 3"]
}

CURRENT SPEC STATE:
${filledFields.length > 0 ? "Already known:\n" + filledFields.join("\n") : "Nothing known yet."}

${missingFields.length > 0 ? "Still needed:\n- " + missingFields.join("\n- ") : "All core fields are filled! Suggest refinement or finalization."}`;
}

/**
 * Count how many core fields are filled in the spec.
 */
export function countFilledFields(spec: Partial<HiringSpec>): number {
  let count = 0;
  if (spec.title) count++;
  if (spec.level) count++;
  if (spec.skills && spec.skills.length > 0) count++;
  if (spec.experience) count++;
  if (spec.location) count++;
  if (spec.teamContext) count++;
  return count;
}

/**
 * Determine the conversation phase based on spec completeness and message count.
 */
export function determinePhase(
  spec: Partial<HiringSpec>,
  messageCount: number
): "gathering" | "refining" | "complete" {
  const filled = countFilledFields(spec);
  if (filled >= 5 && messageCount >= 4) return "refining";
  if (filled >= 6) return "complete";
  return "gathering";
}

/**
 * Convert a HiringSpec to the existing job context format used by the rest of the app.
 */
export function specToJobContext(spec: Partial<HiringSpec>): {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  location: string;
  summary: string;
} {
  const requiredSkills = (spec.skills || [])
    .filter((s) => s.priority === "must-have")
    .map((s) => s.name);
  const preferredSkills = (spec.skills || [])
    .filter((s) => s.priority !== "must-have")
    .map((s) => s.name);

  const expStr = spec.experience
    ? `${spec.experience.min}-${spec.experience.max} years`
    : "";

  const locationStr = spec.location
    ? `${spec.location.preference}${spec.location.remote ? " (Remote OK)" : ""}`
    : "";

  return {
    title: spec.title || "",
    company: "",
    requiredSkills,
    preferredSkills,
    experienceLevel: spec.level
      ? `${spec.level}${expStr ? ` (${expStr})` : ""}`
      : expStr,
    location: locationStr,
    summary: spec.summary || "",
  };
}

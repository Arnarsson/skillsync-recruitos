import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth-guard";
import { candidateImportSchema } from "@/lib/validation/apiSchemas";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractGithubUsername(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/github\.com\/([^\/\?#]+)/);
  return match ? match[1] : null;
}

function mapFunnelStage(steps?: number[]): string {
  if (!steps || steps.length === 0) return "sourced";
  const max = Math.max(...steps);
  // FunnelStage: INTAKE=1, SHORTLIST=2, DEEP_PROFILE=3, OUTREACH=4
  if (max >= 4) return "outreached";
  if (max >= 3) return "analyzed";
  if (max >= 2) return "shortlisted";
  return "sourced";
}

// ---------------------------------------------------------------------------
// Mappers: convert legacy formats into Prisma-ready data
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any; // Prisma JSON fields accept any serializable value

interface LocalStorageCandidate {
  name: string;
  currentRole?: string;
  company?: string;
  location?: string;
  avatar?: string;
  sourceUrl?: string;
  yearsExperience?: number;
  alignmentScore?: number;
  scoreBreakdown?: JsonValue;
  persona?: JsonValue;
  deepAnalysis?: string;
  companyMatch?: JsonValue;
  indicators?: JsonValue;
  interviewGuide?: JsonValue;
  networkDossier?: JsonValue;
  advancedProfile?: JsonValue;
  buildprint?: JsonValue;
  unlockedSteps?: number[];
  shortlistSummary?: string;
  keyEvidence?: string[];
  risks?: string[];
  linkedinUrl?: string;
  rawProfileText?: string;
  scoreConfidence?: string;
  scoreDrivers?: string[];
  scoreDrags?: string[];
  skills?: string[];
  languages?: JsonValue;
}

interface VercelKVCandidate {
  linkedinId: string;
  linkedinUrl?: string;
  name: string;
  headline?: string;
  location?: string;
  currentCompany?: string;
  photoUrl?: string;
  about?: string;
  experience?: JsonValue;
  education?: JsonValue;
  skills?: JsonValue;
  languages?: JsonValue;
  certifications?: JsonValue;
  connectionDegree?: string;
  mutualConnections?: string;
  openToWork?: boolean;
  isPremium?: boolean;
  stage?: string;
}

function mapLocalStorageCandidate(
  c: LocalStorageCandidate,
  userId: string | null
): Prisma.CandidateCreateInput {
  const githubUsername = extractGithubUsername(c.sourceUrl);
  return {
    name: c.name,
    headline: c.currentRole ?? null,
    currentRole: c.currentRole ?? null,
    company: c.company ?? null,
    location: c.location ?? null,
    avatar: c.avatar ?? null,

    sourceType: "GITHUB",
    githubUsername,
    sourceUrl: c.sourceUrl ?? null,

    yearsExperience: c.yearsExperience ?? null,

    // Skills
    skills: c.skills ?? undefined,
    codingLanguages: c.languages ?? undefined,

    // AI Scoring
    alignmentScore: c.alignmentScore ?? null,
    scoreBreakdown: c.scoreBreakdown ?? undefined,
    scoreConfidence: c.scoreConfidence ?? null,
    scoreDrivers: c.scoreDrivers ?? [],
    scoreDrags: c.scoreDrags ?? [],

    // AI Analysis
    persona: c.persona ?? undefined,
    deepAnalysis: c.deepAnalysis ?? null,
    companyMatch: c.companyMatch ?? undefined,
    indicators: c.indicators ?? undefined,
    interviewGuide: c.interviewGuide ?? undefined,
    networkDossier: c.networkDossier ?? undefined,
    advancedProfile: c.advancedProfile ?? undefined,
    buildprint: c.buildprint ?? undefined,

    // Pipeline
    pipelineStage: mapFunnelStage(c.unlockedSteps),
    unlockedSteps: c.unlockedSteps ?? [],
    shortlistSummary: c.shortlistSummary ?? null,
    keyEvidence: c.keyEvidence ?? [],
    risks: c.risks ?? [],

    // LinkedIn
    linkedinUrl: c.linkedinUrl ?? null,
    rawProfileText: c.rawProfileText ?? null,

    // User association
    ...(userId ? { user: { connect: { id: userId } } } : {}),
  };
}

function mapVercelKVCandidate(
  c: VercelKVCandidate,
  userId: string | null
): Prisma.CandidateCreateInput {
  return {
    name: c.name,
    headline: c.headline ?? null,
    company: c.currentCompany ?? null,
    location: c.location ?? null,
    avatar: c.photoUrl ?? null,

    sourceType: "LINKEDIN",
    linkedinId: c.linkedinId,
    linkedinUrl: c.linkedinUrl ?? null,

    rawProfileText: c.about ?? null,

    // Structured data
    experience: c.experience ?? undefined,
    education: c.education ?? undefined,
    skills: c.skills ?? undefined,
    spokenLanguages: c.languages ?? undefined,
    certifications: c.certifications ?? undefined,

    // LinkedIn-specific signals
    connectionDegree: c.connectionDegree ?? null,
    mutualConnections: c.mutualConnections ?? null,
    openToWork: c.openToWork ?? null,
    isPremium: c.isPremium ?? null,

    // Pipeline
    pipelineStage: c.stage || "sourced",

    // User association
    ...(userId ? { user: { connect: { id: userId } } } : {}),
  };
}

// ---------------------------------------------------------------------------
// Batch processing
// ---------------------------------------------------------------------------

const BATCH_SIZE = 50;

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ index: number; name: string; error: string }>;
  total: number;
}

async function processLocalStorageBatch(
  candidates: LocalStorageCandidate[],
  userId: string | null
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    total: candidates.length,
  };

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    const operations = batch.map(async (c, batchIdx) => {
      const idx = i + batchIdx;
      try {
        if (!c.name || typeof c.name !== "string" || !c.name.trim()) {
          result.errors.push({
            index: idx,
            name: c.name ?? "(empty)",
            error: "Missing or empty name",
          });
          return;
        }

        const data = mapLocalStorageCandidate(c, userId);
        const githubUsername = extractGithubUsername(c.sourceUrl);

        // Dedup: check by githubUsername + userId
        if (githubUsername) {
          const existing = await prisma.candidate.findFirst({
            where: { githubUsername, userId: userId ?? null },
            select: { id: true },
          });

          if (existing) {
            // Merge: update the existing record with new data
            const { sourceType: _st, user: _u, ...updateFields } =
              data as Prisma.CandidateCreateInput & {
                sourceType: string;
                user?: unknown;
              };
            await prisma.candidate.update({
              where: { id: existing.id },
              data: updateFields as Prisma.CandidateUpdateInput,
            });
            result.updated++;
            return;
          }
        }

        // No existing record found -- create new
        await prisma.candidate.create({ data });
        result.imported++;
      } catch (err) {
        const message =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
            ? "Duplicate: record with this identity already exists"
            : err instanceof Error
              ? err.message
              : "Unknown error";
        result.errors.push({ index: idx, name: c.name ?? "(unknown)", error: message });
      }
    });

    await Promise.all(operations);
  }

  return result;
}

async function processVercelKVBatch(
  candidates: VercelKVCandidate[],
  userId: string | null
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    total: candidates.length,
  };

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    const operations = batch.map(async (c, batchIdx) => {
      const idx = i + batchIdx;
      try {
        if (!c.name || typeof c.name !== "string" || !c.name.trim()) {
          result.errors.push({
            index: idx,
            name: c.name ?? "(empty)",
            error: "Missing or empty name",
          });
          return;
        }

        if (!c.linkedinId) {
          result.errors.push({
            index: idx,
            name: c.name,
            error: "Missing linkedinId (required for Vercel KV candidates)",
          });
          return;
        }

        const data = mapVercelKVCandidate(c, userId);

        // Dedup: check by linkedinId + userId
        const existing = await prisma.candidate.findFirst({
          where: { linkedinId: c.linkedinId, userId: userId ?? null },
          select: { id: true },
        });

        if (existing) {
          const { sourceType: _st, user: _u, ...updateFields } =
            data as Prisma.CandidateCreateInput & {
              sourceType: string;
              user?: unknown;
            };
          await prisma.candidate.update({
            where: { id: existing.id },
            data: updateFields as Prisma.CandidateUpdateInput,
          });
          result.updated++;
          return;
        }

        // Create new
        await prisma.candidate.create({ data });
        result.imported++;
      } catch (err) {
        const message =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
            ? "Duplicate: record with this identity already exists"
            : err instanceof Error
              ? err.message
              : "Unknown error";
        result.errors.push({ index: idx, name: c.name ?? "(unknown)", error: message });
      }
    });

    await Promise.all(operations);
  }

  return result;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

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

    const parsed = candidateImportSchema.safeParse(rawBody);
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

    const { source, candidates } = parsed.data;
    const userId: string | null = parsed.data.userId ?? null;

    if (candidates.length === 0) {
      return NextResponse.json({
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        total: 0,
      });
    }

    // Dispatch to the correct processor
    let result: ImportResult;
    if (source === "localStorage") {
      result = await processLocalStorageBatch(
        candidates as LocalStorageCandidate[],
        userId
      );
    } else {
      result = await processVercelKVBatch(
        candidates as VercelKVCandidate[],
        userId
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Import failed unexpectedly" },
      { status: 500 }
    );
  }
}

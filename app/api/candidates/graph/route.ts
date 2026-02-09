import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";

/**
 * Graph node in React Flow format
 */
interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    candidateId: string;
    name: string;
    avatar: string | null;
    score: number | null;
    skills: string[];
    company: string | null;
    location: string | null;
    currentRole: string | null;
    pipelineStage: string;
    sourceType: string;
    sourceUrl: string | null;
    githubUsername: string | null;
  };
}

/**
 * Graph edge in React Flow format
 */
interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  data: {
    reason: string;
    weight: number;
    connectionType: string;
  };
}

/**
 * Calculate shared skills between two candidates
 */
function getSharedSkills(
  skillsA: string[],
  skillsB: string[]
): string[] {
  const normalizedA = skillsA.map((s) => s.toLowerCase().trim());
  const normalizedB = new Set(skillsB.map((s) => s.toLowerCase().trim()));
  const shared: string[] = [];

  for (let i = 0; i < normalizedA.length; i++) {
    if (normalizedB.has(normalizedA[i])) {
      // Return the original casing from skillsA
      shared.push(skillsA[i]);
    }
  }

  return shared;
}

/**
 * Parse JSON field that could be a string array stored as Json in SQLite
 */
function parseSkills(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((s) => typeof s === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((s: unknown) => typeof s === "string");
    } catch {
      // not valid JSON
    }
  }
  return [];
}

// GET /api/candidates/graph - Build a relationship graph from pipeline candidates
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.user.id;

    // Build where clause scoped to user if authenticated
    const where: { userId?: string } = {};
    if (userId) {
      where.userId = userId;
    }

    // Fetch all candidates
    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { alignmentScore: "desc" },
      take: 100, // Cap at 100 for performance
    });

    if (candidates.length === 0) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    // Build nodes with a simple force-directed-like layout (circular)
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Place candidates in a circular layout
    const radius = Math.max(300, candidates.length * 50);
    const angleStep = (2 * Math.PI) / candidates.length;

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const angle = i * angleStep - Math.PI / 2; // start from top
      const x = Math.round(radius * Math.cos(angle));
      const y = Math.round(radius * Math.sin(angle));

      nodes.push({
        id: c.id,
        type: "candidateNode",
        position: { x, y },
        data: {
          candidateId: c.id,
          name: c.name,
          avatar: c.avatar,
          score: c.alignmentScore,
          skills: parseSkills(c.skills),
          company: c.company,
          location: c.location,
          currentRole: c.currentRole,
          pipelineStage: c.pipelineStage,
          sourceType: c.sourceType,
          sourceUrl: c.sourceUrl,
          githubUsername: c.githubUsername,
        },
      });
    }

    // Build edges based on relationships
    let edgeId = 0;

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i];
        const b = candidates[j];

        const skillsA = parseSkills(a.skills);
        const skillsB = parseSkills(b.skills);

        // 1. Shared skills (3+ in common)
        const sharedSkills = getSharedSkills(skillsA, skillsB);
        if (sharedSkills.length >= 3) {
          edges.push({
            id: `e-skill-${edgeId++}`,
            source: a.id,
            target: b.id,
            type: "smoothstep",
            animated: sharedSkills.length >= 5,
            data: {
              reason: `${sharedSkills.length} shared skills: ${sharedSkills.slice(0, 3).join(", ")}${sharedSkills.length > 3 ? "..." : ""}`,
              weight: Math.min(1, sharedSkills.length / 8),
              connectionType: "skills",
            },
          });
        }

        // 2. Same company
        if (
          a.company &&
          b.company &&
          a.company.toLowerCase().trim() !== "" &&
          a.company.toLowerCase().trim() !== "independent" &&
          a.company.toLowerCase().trim() === b.company.toLowerCase().trim()
        ) {
          edges.push({
            id: `e-company-${edgeId++}`,
            source: a.id,
            target: b.id,
            type: "smoothstep",
            animated: false,
            data: {
              reason: `Same company: ${a.company}`,
              weight: 0.8,
              connectionType: "company",
            },
          });
        }

        // 3. Same location
        if (
          a.location &&
          b.location &&
          a.location.toLowerCase().trim() !== "" &&
          a.location.toLowerCase().trim() !== "remote" &&
          a.location.toLowerCase().trim() === b.location.toLowerCase().trim()
        ) {
          edges.push({
            id: `e-location-${edgeId++}`,
            source: a.id,
            target: b.id,
            type: "smoothstep",
            animated: false,
            data: {
              reason: `Same location: ${a.location}`,
              weight: 0.4,
              connectionType: "location",
            },
          });
        }

        // 4. Similar alignment scores (within 10 points, both must have scores)
        if (
          a.alignmentScore !== null &&
          b.alignmentScore !== null &&
          Math.abs(a.alignmentScore - b.alignmentScore) <= 10
        ) {
          edges.push({
            id: `e-score-${edgeId++}`,
            source: a.id,
            target: b.id,
            type: "smoothstep",
            animated: false,
            data: {
              reason: `Similar score: ${Math.round(a.alignmentScore)} vs ${Math.round(b.alignmentScore)}`,
              weight: 0.3,
              connectionType: "score",
            },
          });
        }
      }
    }

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Graph API error:", error);
    return NextResponse.json(
      { error: "Failed to build graph" },
      { status: 500 }
    );
  }
}

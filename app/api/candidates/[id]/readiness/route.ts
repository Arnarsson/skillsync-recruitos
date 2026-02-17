import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeReadinessScore } from "@/services/jobReadiness";
import type { ReadinessInput } from "@/services/jobReadiness";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - compute or return cached readiness score
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const candidate = await prisma.candidate.findFirst({
      where: userId ? { id, userId } : { id },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Check for cached result (valid for 24 hours)
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    if (!forceRefresh && candidate.jobReadiness) {
      const cached = candidate.jobReadiness as any;
      if (cached.computedAt) {
        const age = Date.now() - new Date(cached.computedAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          return NextResponse.json(cached);
        }
      }
    }

    // Build readiness input from candidate data
    const input: ReadinessInput = {
      candidateId: candidate.id,
      githubUsername: candidate.githubUsername || undefined,
      linkedinUrl: candidate.linkedinUrl || undefined,
      currentCompany: candidate.company || undefined,
      currentRole: candidate.currentRole || undefined,
      skills: Array.isArray(candidate.skills) ? candidate.skills as string[] : undefined,
      location: candidate.location || undefined,
    };

    // Compute readiness score
    const readiness = await computeReadinessScore(input);

    // Cache result
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { jobReadiness: readiness as any },
    });

    return NextResponse.json(readiness);
  } catch (error) {
    console.error("Readiness computation error:", error);
    return NextResponse.json(
      { error: "Failed to compute readiness score" },
      { status: 500 }
    );
  }
}

// POST - force recompute
export async function POST(request: NextRequest, { params }: RouteParams) {
  const url = new URL(request.url);
  url.searchParams.set("refresh", "true");
  const newRequest = new NextRequest(url, { headers: request.headers });
  return GET(newRequest, { params });
}

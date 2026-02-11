import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { criteriaScoreRequestSchema } from "@/lib/validation/apiSchemas";
import { evaluateCriteria } from "@/lib/criteria";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const rawBody = await request.json();
    const parsed = criteriaScoreRequestSchema.safeParse(rawBody);
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

    const evidenceTexts = [
      ...(parsed.data.evidenceText ? [parsed.data.evidenceText] : []),
      ...(parsed.data.evidence || []).map((e) => e.text),
    ];

    const result = evaluateCriteria(parsed.data.criteria, evidenceTexts);
    return NextResponse.json({ success: true, scorecard: result });
  } catch (error) {
    console.error("[Criteria] Scoring failed:", error);
    return NextResponse.json({ error: "Failed to score criteria" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { criteriaInterviewRequestSchema } from "@/lib/validation/apiSchemas";
import { buildInterviewGuide } from "@/lib/interview-engine";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const rawBody = await request.json();
    const parsed = criteriaInterviewRequestSchema.safeParse(rawBody);
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

    const guide = buildInterviewGuide(
      parsed.data.criteria,
      parsed.data.candidateName
    );
    return NextResponse.json({ success: true, interviewGuide: guide });
  } catch (error) {
    console.error("[Criteria] Interview guide failed:", error);
    return NextResponse.json(
      { error: "Failed to generate interview guide" },
      { status: 500 }
    );
  }
}

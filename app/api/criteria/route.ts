import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { criteriaSetCreateSchema } from "@/lib/validation/apiSchemas";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const userId = auth.user.id || null;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in session" }, { status: 400 });
  }

  const sets = await prisma.criteriaSet.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ criteriaSets: sets });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const userId = auth.user.id || null;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in session" }, { status: 400 });
  }

  try {
    const rawBody = await request.json();
    const parsed = criteriaSetCreateSchema.safeParse(rawBody);
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

    const created = await prisma.criteriaSet.create({
      data: {
        userId,
        name: parsed.data.name,
        role: parsed.data.role || null,
        description: parsed.data.description || null,
        criteria: parsed.data.criteria,
      },
    });

    return NextResponse.json({ success: true, criteriaSet: created }, { status: 201 });
  } catch (error) {
    console.error("[Criteria] Create failed:", error);
    return NextResponse.json({ error: "Failed to create criteria set" }, { status: 500 });
  }
}

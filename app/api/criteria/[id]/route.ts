import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { criteriaSetUpdateSchema } from "@/lib/validation/apiSchemas";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const userId = auth.user.id || null;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in session" }, { status: 400 });
  }

  const set = await prisma.criteriaSet.findFirst({
    where: { id, userId },
  });

  if (!set) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }

  return NextResponse.json({ criteriaSet: set });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const userId = auth.user.id || null;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in session" }, { status: 400 });
  }

  const existing = await prisma.criteriaSet.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }

  try {
    const rawBody = await request.json();
    const parsed = criteriaSetUpdateSchema.safeParse(rawBody);
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

    const updated = await prisma.criteriaSet.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.role !== undefined ? { role: parsed.data.role || null } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description || null }
          : {}),
        ...(parsed.data.criteria !== undefined ? { criteria: parsed.data.criteria } : {}),
      },
    });

    return NextResponse.json({ success: true, criteriaSet: updated });
  } catch (error) {
    console.error("[Criteria] Update failed:", error);
    return NextResponse.json({ error: "Failed to update criteria set" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const userId = auth.user.id || null;
  if (!userId) {
    return NextResponse.json({ error: "Missing user id in session" }, { status: 400 });
  }

  const existing = await prisma.criteriaSet.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }

  await prisma.criteriaSet.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true, deleted: true });
}

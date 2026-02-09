import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validation/apiSchemas";

export async function POST(request: NextRequest) {
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

    const parsed = signupSchema.safeParse(rawBody);
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

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Der findes allerede en konto med denne email" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        passwordHash,
        credits: 5, // signup bonus
      },
    });

    // Create signup bonus ledger entry
    try {
      await prisma.creditLedger.create({
        data: {
          userId: user.id,
          delta: 5,
          reason: "SIGNUP_BONUS",
          balance: 5,
          metadata: { source: "email_signup" },
        },
      });
    } catch {
      // Non-critical: ledger entry failed but user was created
      console.warn("Failed to create signup bonus ledger entry");
    }

    return NextResponse.json(
      { message: "Konto oprettet. Du kan nu logge ind.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // Handle database not configured
    if (
      error instanceof Error &&
      error.message === "Database not configured"
    ) {
      return NextResponse.json(
        { error: "Database er ikke konfigureret. Kontakt administratoren." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Noget gik galt. Prøv igen senere." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email og adgangskode er påkrævet" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Ugyldig email-adresse" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Adgangskode skal være mindst 8 tegn" },
        { status: 400 }
      );
    }

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

import { NextResponse } from "next/server";

export async function POST() {
  // Stripe webhook not configured yet
  return NextResponse.json(
    { error: "Stripe webhook not configured" },
    { status: 501 }
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getOrCreateCustomer,
  createCreditPackageCheckout,
} from "@/lib/stripe";
import { CREDIT_PACKAGES, type PricingTier } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured. Set STRIPE_SECRET_KEY." },
        { status: 501 },
      );
    }

    const { packageId } = (await request.json()) as { packageId: PricingTier };

    // Validate package
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    const userId = (session.user as any).id?.toString() ?? session.user.email;
    const email = session.user.email;
    const name = session.user.name || "User";

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(email, name, userId);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/dashboard?checkout=success&package=${packageId}`;
    const cancelUrl = `${baseUrl}/pricing?checkout=cancelled`;

    const url = await createCreditPackageCheckout(
      customerId,
      packageId,
      userId,
      successUrl,
      cancelUrl,
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}

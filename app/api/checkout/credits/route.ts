import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, createCustomer } from "@/lib/stripe";
import { getCreditPackage, CREDIT_PACKAGES } from "@/lib/credit-packages";
import { prisma } from "@/lib/db";

interface CreditCheckoutRequest {
  packageId: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured. Please set STRIPE_SECRET_KEY." },
        { status: 501 }
      );
    }

    const body: CreditCheckoutRequest = await request.json();
    const { packageId } = body;

    // Validate package
    const pkg = getCreditPackage(packageId);
    if (!pkg) {
      return NextResponse.json(
        { error: "Invalid credit package selected" },
        { status: 400 }
      );
    }

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      // Create user if not exists
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email,
          githubId: (session.user as any).id || session.user.email, // Fallback
        },
      });
    }

    // Get or create Stripe customer
    let customerId: string;
    
    if (user.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    } else {
      // Check if customer exists in Stripe
      const existingCustomers = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        customerId = await createCustomer(
          session.user.email,
          session.user.name || "User",
          {
            source: "recruitos-credits",
          }
        );
      }

      // Save customer ID to database
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/dashboard?purchase=success&credits=${pkg.credits}`;
    const cancelUrl = `${baseUrl}/pricing?purchase=cancelled`;

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "dkk",
            unit_amount: pkg.priceInCents,
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} credits for RecruitOS deep profile reports`,
              metadata: {
                credits: pkg.credits.toString(),
                packageId: pkg.id,
              },
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        credits: pkg.credits.toString(),
      },
      customer_update: {
        address: "auto",
      },
    });

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error("Credit checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// GET endpoint to list available packages
export async function GET() {
  try {
    const packages = CREDIT_PACKAGES.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.priceInDKK,
      discount: pkg.discount,
      popular: pkg.popular,
      costPerCredit: pkg.priceInDKK / pkg.credits,
    }));

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Error fetching credit packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit packages" },
      { status: 500 }
    );
  }
}

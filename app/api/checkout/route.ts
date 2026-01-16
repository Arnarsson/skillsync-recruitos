import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  stripe,
  createSubscriptionCheckout,
  createCustomer,
  createCreditCheckout,
} from "@/lib/stripe";
import { PRICING_PLANS, type PricingTier } from "@/lib/pricing";

interface CheckoutRequest {
  planId: PricingTier;
  annual?: boolean;
  hireGuarantee?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
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

    const body: CheckoutRequest = await request.json();
    const { planId, annual = false } = body;

    // Validate plan
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Enterprise requires contact sales
    if (planId === 'enterprise') {
      return NextResponse.json(
        { error: "Please contact sales for Enterprise pricing" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    const userEmail = session.user.email!;
    const userName = session.user.name || 'User';

    // Check if customer exists
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      customerId = await createCustomer(userEmail, userName, {
        source: 'recruitos-checkout',
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/pipeline?checkout=success`;
    const cancelUrl = `${baseUrl}/pricing?checkout=cancelled`;

    // Handle different plan types
    if (planId === 'starter') {
      // Starter is pay-per-search - create one-time payment
      const checkoutUrl = await createCreditCheckout(
        customerId,
        1, // 1 search credit
        plan.price.amount * 100, // Convert to cents
        successUrl,
        cancelUrl
      );
      return NextResponse.json({ url: checkoutUrl });
    }

    if (planId === 'pro') {
      // Pro is subscription
      const priceId = annual
        ? process.env.STRIPE_PRO_YEARLY_PRICE_ID
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

      if (!priceId) {
        // Create a dynamic price if no price ID configured
        const price = await stripe.prices.create({
          currency: 'usd',
          unit_amount: annual ? 99000 : 9900, // $990/yr or $99/mo
          recurring: {
            interval: annual ? 'year' : 'month',
          },
          product_data: {
            name: annual ? 'RecruitOS Pro Annual' : 'RecruitOS Pro Monthly',
          },
        });

        const checkoutUrl = await createSubscriptionCheckout(
          customerId,
          price.id,
          successUrl,
          cancelUrl
        );
        return NextResponse.json({ url: checkoutUrl });
      }

      const checkoutUrl = await createSubscriptionCheckout(
        customerId,
        priceId,
        successUrl,
        cancelUrl
      );
      return NextResponse.json({ url: checkoutUrl });
    }

    return NextResponse.json(
      { error: "Invalid plan type" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

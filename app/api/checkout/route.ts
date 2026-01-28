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
    const { planId } = body;

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
    const successUrl = `${baseUrl}/dashboard?checkout=success&plan=${planId}`;
    const cancelUrl = `${baseUrl}/pricing?checkout=cancelled`;

    // Handle Personality Profile (one-time payment)
    if (planId === 'personality') {
      const priceId = plan.stripePriceId;

      if (!priceId) {
        // Create a dynamic price if no price ID configured
        const price = await stripe.prices.create({
          currency: 'dkk',
          unit_amount: plan.price.amount * 100, // Convert DKK to øre
          product_data: {
            name: 'Personality Profile',
          },
        });

        const checkoutSession = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'payment',
          line_items: [{
            price: price.id,
            quantity: 1,
          }],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            planId,
            userId: session.user.email!,
          },
        });

        return NextResponse.json({ url: checkoutSession.url });
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          planId,
          userId: session.user.email!,
        },
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    // Handle Full Recruiting (success-based, no upfront payment)
    if (planId === 'recruiting') {
      // For recruiting, we don't charge upfront - just register them
      // They'll be charged 5000 DKK when they mark a candidate as hired
      return NextResponse.json({
        success: true,
        message: "Registered for success-based recruiting. You'll only pay 5,000 DKK per successful hire.",
        redirectUrl: `${baseUrl}/dashboard?plan=recruiting&success=true`,
      });
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

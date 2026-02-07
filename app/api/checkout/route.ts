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

    // Determine checkout mode based on period
    const isSubscription = plan.period === 'annual';
    const mode = isSubscription ? 'subscription' : 'payment';

    // Handle annual subscription via Stripe subscription checkout
    if (isSubscription) {
      const checkoutUrl = await createSubscriptionCheckout(
        customerId,
        plan.stripePriceId || '',
        successUrl,
        cancelUrl,
      );
      return NextResponse.json({ url: checkoutUrl });
    }

    // Handle one-time credit package purchase
    const priceId = plan.stripePriceId;

    if (!priceId) {
      // Create a dynamic price if no price ID configured
      const price = await stripe.prices.create({
        currency: 'dkk',
        unit_amount: plan.price * 100, // Convert DKK to øre
        product_data: {
          name: plan.name,
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

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

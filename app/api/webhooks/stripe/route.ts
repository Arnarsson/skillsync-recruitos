import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!customerEmail) {
    console.error("No customer email in checkout session");
    return;
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!user) {
    console.error(`User not found for email: ${customerEmail}`);
    return;
  }

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customerId,
    },
  });

  // Check if this was a one-time credit purchase
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  
  for (const item of lineItems.data) {
    // Detect credit purchases (one-time payments, not subscriptions)
    if (item.price?.type === 'one_time') {
      const amount = item.amount_total || 0;
      const credits = calculateCreditsFromAmount(amount);

      // Add credits to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: credits,
          },
        },
      });

      // Record payment
      await prisma.payment.create({
        data: {
          userId: user.id,
          stripePaymentId: session.payment_intent as string,
          amount,
          credits,
          status: "succeeded",
        },
      });

      console.log(`Added ${credits} credits to user ${user.email}`);
    }
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer: ${customerId}`);
    return;
  }

  // Determine plan from subscription
  let plan: "FREE" | "PRO" | "ENTERPRISE" = "PRO";
  
  // Update user plan and subscription
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      stripeSubscriptionId: subscription.id,
      // Pro subscribers get unlimited credits (represented as high number)
      credits: 999999,
    },
  });

  console.log(`Updated subscription for user ${user.email} to ${plan}`);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer: ${customerId}`);
    return;
  }

  // Downgrade to free plan
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
      credits: 5, // Reset to free tier credits
    },
  });

  console.log(`Cancelled subscription for user ${user.email}`);
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Additional payment tracking if needed
  console.log(`Payment succeeded: ${paymentIntent.id}`);
}

function calculateCreditsFromAmount(amountInCents: number): number {
  const { calculateCreditsFromStripeAmount } = require("@/lib/credit-packages");
  return calculateCreditsFromStripeAmount(amountInCents);
}

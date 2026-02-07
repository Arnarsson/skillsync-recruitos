import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { addCredits, upgradeToAnnual, recordPayment } from "@/lib/credits";

export const dynamic = "force-dynamic";

/**
 * Stripe Webhook Handler
 * Processes:
 * - checkout.session.completed → credit purchase or annual subscription
 * - invoice.payment_succeeded → subscription renewal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 },
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe Webhook] Subscription cancelled: ${subscription.id}`,
        );
        // Could downgrade user plan here
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const packageId = session.metadata?.packageId;
  const creditsStr = session.metadata?.credits;

  if (!userId || !packageId) {
    console.error("[Stripe Webhook] Missing metadata in checkout session", {
      sessionId: session.id,
    });
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || session.id;

  const amount = session.amount_total || 0;

  console.log(
    `[Stripe Webhook] Checkout complete: user=${userId}, package=${packageId}, credits=${creditsStr}`,
  );

  if (packageId === "annual") {
    // Annual unlimited subscription
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || "";

    await recordPayment({
      userId,
      stripePaymentId: paymentIntentId,
      stripeSessionId: session.id,
      amount,
      currency: "dkk",
      credits: 0,
      packageId: "annual",
      status: "completed",
    });

    await upgradeToAnnual(userId, subscriptionId, paymentIntentId);
    console.log(`[Stripe Webhook] User ${userId} upgraded to Annual unlimited`);
  } else {
    // Credit package purchase
    const credits = parseInt(creditsStr || "0", 10);
    if (credits <= 0) {
      console.error("[Stripe Webhook] Invalid credits count:", creditsStr);
      return;
    }

    await recordPayment({
      userId,
      stripePaymentId: paymentIntentId,
      stripeSessionId: session.id,
      amount,
      currency: "dkk",
      credits,
      packageId,
      status: "completed",
    });

    await addCredits(userId, credits, packageId, paymentIntentId);
    console.log(
      `[Stripe Webhook] Added ${credits} credits to user ${userId}`,
    );
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Handle subscription renewal (annual plan renewal)
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  console.log(
    `[Stripe Webhook] Invoice paid for customer ${customerId}: ${invoice.id}`,
  );
  // Annual subscription renewal — plan stays active, nothing to do
}

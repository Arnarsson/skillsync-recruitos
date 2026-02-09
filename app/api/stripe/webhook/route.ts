import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { addCredits, upgradeToAnnual, recordPayment } from "@/lib/credits";
import {
  getCheckoutPaymentIntentId,
  getCheckoutSubscriptionId,
  processStripeWebhook,
} from "@/lib/stripe-webhook";

export const dynamic = "force-dynamic";
const DEPRECATED_PATH_MESSAGE =
  "Deprecated endpoint. Use /api/webhooks/stripe instead.";

function addDeprecationHeaders(response: Response): Response {
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT");
  response.headers.set("X-Deprecated-Endpoint", "/api/stripe/webhook");
  response.headers.set("X-Replacement-Endpoint", "/api/webhooks/stripe");
  response.headers.set("Warning", `299 - "${DEPRECATED_PATH_MESSAGE}"`);
  return response;
}

/**
 * Stripe Webhook Handler
 * Processes:
 * - checkout.session.completed → credit purchase or annual subscription
 * - invoice.payment_succeeded → subscription renewal
 */
export async function POST(request: NextRequest) {
  const response = await processStripeWebhook(
    request,
    getStripe(),
    {
      "checkout.session.completed": async (event) => {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
      },
      "invoice.payment_succeeded": async (event) => {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
      },
      "customer.subscription.deleted": async (event) => {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe Webhook] Subscription cancelled: ${subscription.id}`,
        );
        // Could downgrade user plan here
      },
    },
    {
      onUnhandled: (eventType) =>
        console.log(`[Stripe Webhook] Unhandled event type: ${eventType}`),
      processingErrorMessage: "Webhook handler failed",
      processingErrorPrefix: "[Stripe Webhook] Error:",
    },
  );
  return addDeprecationHeaders(response);
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

  const paymentIntentId = getCheckoutPaymentIntentId(session);

  const amount = session.amount_total || 0;

  console.log(
    `[Stripe Webhook] Checkout complete: user=${userId}, package=${packageId}, credits=${creditsStr}`,
  );

  if (packageId === "annual") {
    // Annual unlimited subscription
    const subscriptionId = getCheckoutSubscriptionId(session);

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

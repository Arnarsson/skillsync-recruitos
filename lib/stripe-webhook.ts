import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

type StripeClientWithWebhooks = Pick<Stripe, "webhooks">;
type StripeEventHandler = (event: Stripe.Event) => Promise<void> | void;

export function constructStripeWebhookEvent(
  request: NextRequest,
  body: string,
  stripeClient: StripeClientWithWebhooks,
): { event: Stripe.Event } | { errorResponse: NextResponse } {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return {
      errorResponse: NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      ),
    };
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return {
      errorResponse: NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      ),
    };
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    return { event };
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 },
      ),
    };
  }
}

export async function processStripeWebhook(
  request: NextRequest,
  stripeClient: StripeClientWithWebhooks,
  handlers: Partial<Record<Stripe.Event.Type, StripeEventHandler>>,
  options?: {
    onUnhandled?: (eventType: string) => void;
    processingErrorMessage?: string;
    processingErrorPrefix?: string;
  },
): Promise<NextResponse> {
  const body = await request.text();
  const result = constructStripeWebhookEvent(request, body, stripeClient);
  if ("errorResponse" in result) {
    return result.errorResponse;
  }

  const event = result.event;

  try {
    // Idempotency check: skip if this event was already processed
    const existing = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existing) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    const handler = handlers[event.type];
    if (handler) {
      await handler(event);
    } else if (options?.onUnhandled) {
      options.onUnhandled(event.type);
    }

    // Record the event as processed
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        processed: true,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    if (options?.processingErrorPrefix) {
      console.error(options.processingErrorPrefix, error);
    } else {
      console.error("Webhook processing error:", error);
    }

    return NextResponse.json(
      {
        error: options?.processingErrorMessage || "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}

type StripeExpandableRef = string | { id: string } | null | undefined;

export function getStripeRefId(ref: StripeExpandableRef): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  return ref.id || null;
}

export function getCheckoutPaymentIntentId(
  session: Stripe.Checkout.Session,
): string {
  return getStripeRefId(session.payment_intent) || session.id;
}

export function getCheckoutSubscriptionId(
  session: Stripe.Checkout.Session,
): string {
  return getStripeRefId(session.subscription) || "";
}

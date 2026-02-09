import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import {
  constructStripeWebhookEvent,
  getCheckoutPaymentIntentId,
  getCheckoutSubscriptionId,
  getStripeRefId,
  processStripeWebhook,
} from "../../lib/stripe-webhook";

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers,
    body: "{}",
  });
}

function makeStripeMock(returnEvent?: Partial<Stripe.Event>) {
  return {
    webhooks: {
      constructEvent: vi.fn(() => ({
        id: "evt_test",
        object: "event",
        type: "checkout.session.completed",
        api_version: "2020-08-27",
        created: Date.now(),
        data: { object: {} as Stripe.Event.Data.Object },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
        ...returnEvent,
      })),
    },
  } as unknown as Pick<Stripe, "webhooks">;
}

describe("stripe-webhook utility", () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("returns 400 when stripe-signature is missing", () => {
    const req = makeRequest();
    const result = constructStripeWebhookEvent(req, "{}", makeStripeMock());
    expect("errorResponse" in result).toBe(true);
    if ("errorResponse" in result) {
      expect(result.errorResponse.status).toBe(400);
    }
  });

  it("returns 500 when webhook secret is missing", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = makeRequest({ "stripe-signature": "sig" });
    const result = constructStripeWebhookEvent(req, "{}", makeStripeMock());
    expect("errorResponse" in result).toBe(true);
    if ("errorResponse" in result) {
      expect(result.errorResponse.status).toBe(500);
    }
  });

  it("dispatches to matching handler and returns 200", async () => {
    const req = makeRequest({ "stripe-signature": "sig" });
    const handler = vi.fn(async () => {});

    const response = await processStripeWebhook(req, makeStripeMock(), {
      "checkout.session.completed": handler,
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when handler throws", async () => {
    const req = makeRequest({ "stripe-signature": "sig" });
    const response = await processStripeWebhook(req, makeStripeMock(), {
      "checkout.session.completed": async () => {
        throw new Error("boom");
      },
    });

    expect(response.status).toBe(500);
  });

  it("extracts expandable Stripe IDs safely", () => {
    expect(getStripeRefId("pi_123")).toBe("pi_123");
    expect(getStripeRefId({ id: "sub_123" })).toBe("sub_123");
    expect(getStripeRefId(null)).toBeNull();
  });

  it("derives checkout ids from session refs", () => {
    const session = {
      id: "cs_123",
      payment_intent: { id: "pi_123" },
      subscription: "sub_123",
    } as unknown as Stripe.Checkout.Session;

    expect(getCheckoutPaymentIntentId(session)).toBe("pi_123");
    expect(getCheckoutSubscriptionId(session)).toBe("sub_123");
  });
});

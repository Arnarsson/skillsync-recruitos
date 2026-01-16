import Stripe from "stripe";

// Lazy-initialize Stripe to avoid build-time errors when env vars aren't set
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });
  }
  return stripeInstance;
}

// Keep the export for backward compatibility but make it lazy
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get prices() { return getStripe().prices; },
  get webhooks() { return getStripe().webhooks; },
} as unknown as Stripe;

export const PLANS = {
  PRO_MONTHLY: {
    name: "Pro Monthly",
    price: 49900, // $499.00 in cents
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    credits: 50,
    interval: "month" as const,
  },
  PRO_YEARLY: {
    name: "Pro Yearly",
    price: 479000, // $4,790.00 in cents
    priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    credits: 600,
    interval: "year" as const,
  },
};

export const CREDIT_PACKS = [
  { credits: 10, price: 9900, name: "10 Credits" },
  { credits: 25, price: 19900, name: "25 Credits" },
  { credits: 50, price: 34900, name: "50 Credits" },
  { credits: 100, price: 59900, name: "100 Credits" },
];

// Create checkout session for subscription
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

// Create checkout session for credit purchase
export async function createCreditCheckout(
  customerId: string,
  credits: number,
  amount: number,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${credits} Deep Profile Credits`,
            description: `One-time purchase of ${credits} credits for viewing deep profiles`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      credits: credits.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

// Create Stripe customer
export async function createCustomer(
  email: string,
  name: string,
  metadata: Record<string, string> = {}
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  });

  return customer.id;
}

// Get customer portal URL
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

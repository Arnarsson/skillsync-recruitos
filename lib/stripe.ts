import Stripe from "stripe";
import { CREDIT_PACKAGES, type PricingTier } from "./pricing";

// --- Stripe client initialization ---

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

// Proxy for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

// --- Credit packages mapped to Stripe ---

/**
 * Amount in smallest DKK unit (øre).
 * 500 DKK = 50000 øre.
 */
function dkkToOre(dkk: number): number {
  return dkk * 100;
}

/**
 * Create a Stripe Checkout session for a credit package purchase.
 */
export async function createCreditPackageCheckout(
  customerId: string,
  packageId: PricingTier,
  userId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new Error(`Unknown package: ${packageId}`);

  const s = getStripe();

  if (pkg.period === "annual") {
    // Annual unlimited → subscription
    const session = await s.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "dkk",
            product_data: {
              name: `RecruitOS ${pkg.name}`,
              description: pkg.tagline,
            },
            unit_amount: dkkToOre(pkg.price),
            recurring: { interval: "year" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packageId: pkg.id,
        credits: "unlimited",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return session.url!;
  }

  // One-time credit package purchase
  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "dkk",
          product_data: {
            name: `RecruitOS ${pkg.name} — ${pkg.credits} kreditter`,
            description: pkg.tagline,
          },
          unit_amount: dkkToOre(pkg.price),
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageId: pkg.id,
      credits: String(pkg.credits),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

/**
 * Get or create a Stripe customer for the given user.
 */
export async function getOrCreateCustomer(
  email: string,
  name: string,
  userId: string,
): Promise<string> {
  const s = getStripe();

  // Try to find existing customer
  const existing = await s.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await s.customers.create({
    email,
    name,
    metadata: { userId, source: "recruitos" },
  });

  return customer.id;
}

/**
 * Verify Stripe webhook signature.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}

/**
 * Create a billing portal session for the customer.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

// Legacy exports for backward compat
export const PLANS = {
  PRO_MONTHLY: {
    name: "Pro Monthly",
    price: 200000, // 2000 DKK in øre
    credits: 50,
    interval: "month" as const,
  },
  PRO_YEARLY: {
    name: "Årligt Ubegrænset",
    price: 3000000, // 30000 DKK in øre
    credits: -1, // unlimited
    interval: "year" as const,
  },
};

export const CREDIT_PACKS = CREDIT_PACKAGES.filter(
  (p) => p.credits !== "unlimited",
).map((p) => ({
  credits: p.credits as number,
  price: dkkToOre(p.price),
  name: `${p.credits} Credits`,
}));

// Legacy function kept for backward compat
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session.url!;
}

export async function createCreditCheckout(
  customerId: string,
  credits: number,
  amount: number,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "dkk",
          product_data: {
            name: `${credits} Kandidat-analyse Kreditter`,
            description: `Engangskøb af ${credits} kreditter`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: { credits: credits.toString() },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session.url!;
}

export async function createCustomer(
  email: string,
  name: string,
  metadata: Record<string, string> = {},
): Promise<string> {
  const customer = await getStripe().customers.create({
    email,
    name,
    metadata,
  });
  return customer.id;
}

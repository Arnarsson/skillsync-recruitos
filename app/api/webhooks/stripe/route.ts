import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getCheckoutPaymentIntentId, processStripeWebhook } from "@/lib/stripe-webhook";
import { calculateCreditsFromStripeAmount } from "@/lib/credit-packages";

export async function POST(request: NextRequest) {
  return processStripeWebhook(
    request,
    stripe,
    {
      "checkout.session.completed": async (event) => {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
      },
      "customer.subscription.created": async (event) => {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
      },
      "customer.subscription.updated": async (event) => {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
      },
      "customer.subscription.deleted": async (event) => {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
      },
      "payment_intent.succeeded": async (event) => {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
      },
    },
    {
      onUnhandled: (eventType) => console.log(`Unhandled event type: ${eventType}`),
      processingErrorMessage: "Webhook processing failed",
      processingErrorPrefix: "Webhook processing error:",
    },
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!customerEmail) {
    console.error("No customer email in checkout session");
    return;
  }

  // Find user by email
  const user = await findUserByEmail(customerEmail);

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
      await incrementUserCredits(user.id, credits);

      // Record payment
      await prisma.payment.create({
        data: {
          userId: user.id,
          stripePaymentId: getCheckoutPaymentIntentId(session),
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

  const user = await findUserByCustomerId(customerId);

  if (!user) {
    console.error(`User not found for customer: ${customerId}`);
    return;
  }

  // Determine plan from subscription
  const plan: "FREE" | "PRO" | "ENTERPRISE" = "PRO";
  
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

  const user = await findUserByCustomerId(customerId);

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
  return calculateCreditsFromStripeAmount(amountInCents);
}

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

async function findUserByCustomerId(customerId: string) {
  return prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
}

async function incrementUserCredits(userId: string, credits: number) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: credits,
      },
    },
  });
}

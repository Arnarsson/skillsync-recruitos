/**
 * Credit system business logic.
 * All database operations for credits, consumption, and balance queries.
 */

import prisma from "./db";
import { CreditReason } from "@prisma/client";

export interface CreditBalance {
  credits: number;
  plan: string;
  unlimited: boolean;
  profilesViewed: number;
}

/**
 * Get a user's credit balance and plan info.
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      credits: true,
      plan: true,
      _count: { select: { profileViews: { where: { creditUsed: true } } } },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    credits: user.credits,
    plan: user.plan,
    unlimited: user.plan === "ANNUAL",
    profilesViewed: user._count.profileViews,
  };
}

/**
 * Check if user can consume a credit.
 */
export async function canConsumeCredit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, plan: true },
  });

  if (!user) return false;
  if (user.plan === "ANNUAL") return true; // unlimited
  return user.credits > 0;
}

/**
 * Consume 1 credit for a candidate profile analysis.
 * Returns the new balance, or throws if insufficient credits.
 */
export async function consumeCredit(
  userId: string,
  candidateUsername: string,
): Promise<{ newBalance: number; ledgerEntryId: string }> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true },
    });

    if (!user) throw new Error("User not found");

    // Annual plan has unlimited credits
    if (user.plan === "ANNUAL") {
      // Still log usage but don't decrement
      const entry = await tx.creditLedger.create({
        data: {
          userId,
          delta: 0,
          reason: CreditReason.CONSUMPTION,
          balance: user.credits,
          metadata: { candidateUsername, unlimited: true },
        },
      });

      await tx.profileView.create({
        data: {
          userId,
          username: candidateUsername,
          creditUsed: false, // no credit deducted
        },
      });

      return { newBalance: user.credits, ledgerEntryId: entry.id };
    }

    // Check sufficient credits
    if (user.credits <= 0) {
      throw new Error("Insufficient credits");
    }

    // Deduct credit
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
      select: { credits: true },
    });

    // Create ledger entry
    const entry = await tx.creditLedger.create({
      data: {
        userId,
        delta: -1,
        reason: CreditReason.CONSUMPTION,
        balance: updated.credits,
        metadata: { candidateUsername },
      },
    });

    // Record profile view
    await tx.profileView.create({
      data: {
        userId,
        username: candidateUsername,
        creditUsed: true,
      },
    });

    return { newBalance: updated.credits, ledgerEntryId: entry.id };
  });
}

/**
 * Add credits after a successful purchase.
 */
export async function addCredits(
  userId: string,
  credits: number,
  packageId: string,
  paymentId: string,
): Promise<{ newBalance: number }> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: credits } },
      select: { credits: true },
    });

    await tx.creditLedger.create({
      data: {
        userId,
        delta: credits,
        reason: CreditReason.PURCHASE,
        balance: updated.credits,
        metadata: { packageId, paymentId },
      },
    });

    return { newBalance: updated.credits };
  });
}

/**
 * Upgrade user to Annual unlimited plan.
 */
export async function upgradeToAnnual(
  userId: string,
  stripeSubscriptionId: string,
  paymentId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        plan: "ANNUAL",
        stripeSubscriptionId,
      },
      select: { credits: true },
    });

    await tx.creditLedger.create({
      data: {
        userId,
        delta: 0,
        reason: CreditReason.SUBSCRIPTION,
        balance: user.credits,
        metadata: {
          packageId: "annual",
          paymentId,
          stripeSubscriptionId,
          note: "Upgraded to Annual Unlimited",
        },
      },
    });
  });
}

/**
 * Record a payment in the database.
 */
export async function recordPayment(data: {
  userId: string;
  stripePaymentId: string;
  stripeSessionId?: string;
  amount: number;
  currency?: string;
  credits: number;
  packageId: string;
  status: string;
}): Promise<string> {
  const payment = await prisma.payment.create({
    data: {
      userId: data.userId,
      stripePaymentId: data.stripePaymentId,
      stripeSessionId: data.stripeSessionId,
      amount: data.amount,
      currency: data.currency || "dkk",
      credits: data.credits,
      packageId: data.packageId,
      status: data.status,
    },
  });
  return payment.id;
}

/**
 * Get or create user from GitHub OAuth data.
 */
export async function getOrCreateUser(data: {
  githubId: string;
  email?: string;
  name?: string;
  image?: string;
}): Promise<{ id: string; credits: number; plan: string }> {
  const existing = await prisma.user.findUnique({
    where: { githubId: data.githubId },
    select: { id: true, credits: true, plan: true },
  });

  if (existing) return existing;

  const user = await prisma.user.create({
    data: {
      githubId: data.githubId,
      email: data.email,
      name: data.name,
      image: data.image,
      credits: 5, // signup bonus
    },
    select: { id: true, credits: true, plan: true },
  });

  // Log signup bonus
  await prisma.creditLedger.create({
    data: {
      userId: user.id,
      delta: 5,
      reason: CreditReason.SIGNUP_BONUS,
      balance: 5,
      metadata: { note: "Welcome bonus credits" },
    },
  });

  return user;
}

/**
 * Get credit usage history for a user.
 */
export async function getCreditHistory(
  userId: string,
  limit = 50,
): Promise<
  {
    id: string;
    delta: number;
    reason: string;
    balance: number;
    metadata: unknown;
    createdAt: Date;
  }[]
> {
  return prisma.creditLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

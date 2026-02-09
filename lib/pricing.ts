import { RECRUITOS_PRICING_PLANS } from "./pricing-catalog";

/**
 * Credit-Based Pricing — DKK
 *
 * Credit packages:
 * - Starter: 10 credits for 500 DKK
 * - Pro: 50 credits for 2,000 DKK
 * - Enterprise: 200 credits for 5,000 DKK
 * - Annual: Unlimited for 30,000 DKK/year
 *
 * 1 credit = 1 candidate profile analysis
 */

export type PricingTier = "starter" | "pro" | "enterprise" | "annual";

export interface CreditPackage {
  id: PricingTier;
  name: string;
  tagline: string;
  credits: number | "unlimited";
  price: number; // DKK
  pricePerCredit: number | null; // DKK per credit (null for unlimited)
  currency: "DKK";
  period: "one-time" | "annual";
  popular?: boolean;
  features: string[];
  stripePriceId?: string; // Set via env or created dynamically
}

export const CREDIT_PACKAGES: CreditPackage[] = RECRUITOS_PRICING_PLANS.map(
  (plan) => ({
    ...plan,
    features: [...plan.features],
  }),
);

/**
 * Get a credit package by ID
 */
export function getCreditPackage(id: PricingTier): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

/**
 * Format price for display
 */
export function formatPrice(pkg: CreditPackage): string {
  const formatted = new Intl.NumberFormat("da-DK").format(pkg.price);
  if (pkg.period === "annual") {
    return `${formatted} kr/år`;
  }
  return `${formatted} kr`;
}

/**
 * Format price per credit
 */
export function formatPricePerCredit(pkg: CreditPackage): string | null {
  if (pkg.pricePerCredit === null) return null;
  return `${pkg.pricePerCredit} kr/kredit`;
}

/**
 * Check if a user has unlimited credits (annual plan)
 */
export function isUnlimited(plan: string): boolean {
  return plan === "ANNUAL";
}

// --- Legacy exports for backward compatibility ---

export const PRICING_PLANS = CREDIT_PACKAGES;

export interface HireGuarantee {
  basePrice: number;
  successFee: number;
  currency: "EUR";
}

export const HIRE_GUARANTEE: HireGuarantee = {
  basePrice: 0,
  successFee: 500,
  currency: "EUR",
};

export type PricingPlan = CreditPackage;

// Storage keys for local usage tracking
export const STORAGE_KEYS = {
  CURRENT_PLAN: "recruitos_pricing_plan",
  USAGE_RECORD: "recruitos_usage_record",
  HIRE_TRACKING: "recruitos_hire_tracking",
};

export function getCurrentPlan(): PricingTier {
  if (typeof window === "undefined") return "starter";
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN);
  return (stored as PricingTier) || "starter";
}

export function getPricingPlan(planId: PricingTier): CreditPackage | undefined {
  return getCreditPackage(planId);
}

export function getUsageRecord() {
  return { searches: 0, deepProfiles: 0, outreachGenerated: 0 };
}

export function getRemainingUsage(
  _usage: { searches: number },
  pkg: CreditPackage,
) {
  if (pkg.credits === "unlimited") {
    return { searches: "unlimited" as const, deepProfiles: "unlimited" as const };
  }
  return { searches: pkg.credits, deepProfiles: pkg.credits };
}

export function calculateCostAnalytics(
  totalSpent: number,
  searches: number,
  contacts: number,
  interviews: number,
  hires: number,
) {
  return {
    totalSpent,
    searchesConducted: searches,
    candidatesContacted: contacts,
    interviewsConducted: interviews,
    hiresCompleted: hires,
    costPerSearch: searches > 0 ? totalSpent / searches : 0,
    costPerContact: contacts > 0 ? totalSpent / contacts : 0,
    costPerInterview: interviews > 0 ? totalSpent / interviews : 0,
    costPerHire: hires > 0 ? totalSpent / hires : 0,
    conversionRates: {
      searchToContact: searches > 0 ? (contacts / searches) * 100 : 0,
      contactToInterview: contacts > 0 ? (interviews / contacts) * 100 : 0,
      interviewToHire: interviews > 0 ? (hires / interviews) * 100 : 0,
    },
  };
}

export type CostAnalytics = ReturnType<typeof calculateCostAnalytics>;

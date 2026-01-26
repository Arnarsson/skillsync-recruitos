/**
 * Credit Packages - Pay-as-you-go pricing (DKK)
 * 
 * Based on requirements:
 * - 5,000 DKK credit pack
 * - 30,000 DKK/year enterprise
 * - 1 credit = 1 deep profile report
 */

export interface CreditPackage {
  id: string
  name: string
  credits: number
  priceInDKK: number
  priceInCents: number // For Stripe (in DKK cents: 5000 DKK = 500000 cents)
  popular?: boolean
  discount?: number // % discount
  stripePriceId?: string
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter_10',
    name: 'Starter Pack',
    credits: 10,
    priceInDKK: 5000,
    priceInCents: 500000,
    stripePriceId: process.env.STRIPE_CREDITS_10_PRICE_ID,
  },
  {
    id: 'pro_25',
    name: 'Pro Pack',
    credits: 25,
    priceInDKK: 10000,
    priceInCents: 1000000,
    discount: 20,
    popular: true,
    stripePriceId: process.env.STRIPE_CREDITS_25_PRICE_ID,
  },
  {
    id: 'business_50',
    name: 'Business Pack',
    credits: 50,
    priceInDKK: 18000,
    priceInCents: 1800000,
    discount: 28,
    stripePriceId: process.env.STRIPE_CREDITS_50_PRICE_ID,
  },
  {
    id: 'enterprise_100',
    name: 'Enterprise Pack',
    credits: 100,
    priceInDKK: 30000,
    priceInCents: 3000000,
    discount: 40,
    stripePriceId: process.env.STRIPE_CREDITS_100_PRICE_ID,
  },
]

/**
 * Get package by ID
 */
export function getCreditPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(p => p.id === id)
}

/**
 * Calculate cost per credit for a package
 */
export function getCostPerCredit(pkg: CreditPackage): number {
  return pkg.priceInDKK / pkg.credits
}

/**
 * Format DKK price for display
 */
export function formatDKK(amountInDKK: number): string {
  return `${amountInDKK.toLocaleString('da-DK')} kr.`
}

/**
 * Calculate credits from Stripe amount
 * Stripe amounts are in cents, DKK
 */
export function calculateCreditsFromStripeAmount(amountInCents: number): number {
  const amountInDKK = amountInCents / 100
  
  // Find matching package or calculate based on starter rate
  const matchedPackage = CREDIT_PACKAGES.find(pkg => pkg.priceInDKK === amountInDKK)
  
  if (matchedPackage) {
    return matchedPackage.credits
  }
  
  // Fallback: use starter pack rate (500 DKK per credit)
  const starterRate = 500 // DKK per credit
  return Math.floor(amountInDKK / starterRate)
}

/**
 * Validate if amount matches a known package
 */
export function validatePackagePurchase(amountInCents: number): {
  valid: boolean
  package?: CreditPackage
  credits: number
} {
  const amountInDKK = amountInCents / 100
  const pkg = CREDIT_PACKAGES.find(p => p.priceInDKK === amountInDKK)
  
  return {
    valid: !!pkg,
    package: pkg,
    credits: pkg ? pkg.credits : calculateCreditsFromStripeAmount(amountInCents),
  }
}

/**
 * Get pricing tiers for display
 */
export function getPricingTiers() {
  return CREDIT_PACKAGES.map(pkg => ({
    ...pkg,
    costPerCredit: getCostPerCredit(pkg),
    formattedPrice: formatDKK(pkg.priceInDKK),
    savings: pkg.discount ? `Save ${pkg.discount}%` : null,
  }))
}

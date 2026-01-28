/**
 * Pricing Models - RecruitOS Pricing Structure
 *
 * Three tiers:
 * - Personality Profile: 2,000 DKK per profile
 * - Full Recruiting: 5,000 DKK per successful hire
 * - Enterprise: Custom pricing with team features
 */

export type PricingTier = 'personality' | 'recruiting' | 'enterprise';

export interface PricingPlan {
  id: PricingTier;
  name: string;
  tagline: string;
  price: {
    amount: number;
    currency: 'DKK' | 'USD' | 'EUR';
    period: 'profile' | 'hire' | 'custom';
  };
  stripePriceId?: string;
  features: string[];
  limits: {
    searchesPerMonth: number | 'unlimited';
    deepProfiles: number | 'unlimited';
    teamSeats: number;
    savedSearches: number;
    apiAccess: boolean;
  };
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'personality',
    name: 'Personality Profile',
    tagline: 'Deep personality insights for better candidate evaluation',
    price: {
      amount: 2000,
      currency: 'DKK',
      period: 'profile',
    },
    stripePriceId: process.env.STRIPE_PERSONALITY_PRICE_ID,
    features: [
      'Deep personality analysis',
      'Behavioral insights & traits',
      'Work style assessment',
      'Team fit evaluation',
      'Communication style report',
      'Strengths & development areas',
      'PDF export',
    ],
    limits: {
      searchesPerMonth: 'unlimited',
      deepProfiles: 1,
      teamSeats: 1,
      savedSearches: 5,
      apiAccess: false,
    },
  },
  {
    id: 'recruiting',
    name: 'Full Recruiting',
    tagline: 'Complete recruiting service - only pay on successful hire',
    price: {
      amount: 5000,
      currency: 'DKK',
      period: 'hire',
    },
    stripePriceId: process.env.STRIPE_RECRUITING_PRICE_ID,
    features: [
      'Full recruiting process management',
      'Candidate sourcing & screening',
      'Unlimited personality profiles',
      'AI-powered candidate matching',
      'Interview scheduling & coordination',
      'Reference checking',
      'Offer negotiation support',
      'Only pay when you hire',
      'Priority support',
    ],
    limits: {
      searchesPerMonth: 'unlimited',
      deepProfiles: 'unlimited',
      teamSeats: 3,
      savedSearches: 20,
      apiAccess: false,
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom solutions for large organizations',
    price: {
      amount: 0, // Custom
      currency: 'DKK',
      period: 'custom',
    },
    features: [
      'Everything in Full Recruiting',
      'Dedicated account manager',
      'Custom integrations (ATS)',
      'Team workspaces & shared pipelines',
      'API access',
      'White-label options',
      'Advanced analytics & reporting',
      'SLA guarantee',
      'SAML/SSO authentication',
      'Custom pricing models',
    ],
    limits: {
      searchesPerMonth: 'unlimited',
      deepProfiles: 'unlimited',
      teamSeats: -1, // Unlimited
      savedSearches: -1, // Unlimited
      apiAccess: true,
    },
  },
];

/**
 * Hire Guarantee Add-on
 * Optional success-based fee: Only pay if you hire through the platform
 */
export interface HireGuarantee {
  basePrice: number;    // EUR
  successFee: number;   // EUR (paid only on successful hire)
  currency: 'EUR';
}

export const HIRE_GUARANTEE: HireGuarantee = {
  basePrice: 0,
  successFee: 500,
  currency: 'EUR',
};

/**
 * Usage tracking for subscription plans
 */
export interface UsageRecord {
  userId: string;
  planId: PricingTier;
  period: {
    start: string;
    end: string;
  };
  usage: {
    searches: number;
    deepProfiles: number;
    outreachGenerated: number;
  };
  lastUpdated: string;
}

/**
 * Get pricing plan by ID
 */
export function getPricingPlan(planId: PricingTier): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.id === planId);
}

/**
 * Check if user has exceeded their plan limits
 */
export function checkUsageLimits(
  usage: UsageRecord['usage'],
  plan: PricingPlan
): { withinLimits: boolean; exceeded: string[] } {
  const exceeded: string[] = [];

  if (plan.limits.searchesPerMonth !== 'unlimited' &&
      usage.searches >= plan.limits.searchesPerMonth) {
    exceeded.push('searches');
  }

  if (plan.limits.deepProfiles !== 'unlimited' &&
      usage.deepProfiles >= plan.limits.deepProfiles) {
    exceeded.push('deepProfiles');
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}

/**
 * Calculate remaining usage
 */
export function getRemainingUsage(
  usage: UsageRecord['usage'],
  plan: PricingPlan
): { searches: number | 'unlimited'; deepProfiles: number | 'unlimited' } {
  return {
    searches: plan.limits.searchesPerMonth === 'unlimited'
      ? 'unlimited'
      : Math.max(0, plan.limits.searchesPerMonth - usage.searches),
    deepProfiles: plan.limits.deepProfiles === 'unlimited'
      ? 'unlimited'
      : Math.max(0, plan.limits.deepProfiles - usage.deepProfiles),
  };
}

/**
 * Format price for display
 */
export function formatPrice(plan: PricingPlan): string {
  if (plan.price.period === 'custom') {
    return 'Custom';
  }

  const symbol = plan.price.currency === 'USD' ? '$' : 
                 plan.price.currency === 'EUR' ? '€' : 
                 plan.price.currency + ' ';
  
  const formatted = `${symbol}${plan.price.amount.toLocaleString('da-DK')}`;
  
  const period = plan.price.period === 'profile' ? '/profile' :
                 plan.price.period === 'hire' ? '/hire' : '';

  return `${formatted}${period}`;
}

/**
 * Analytics: Cost per hire calculation
 */
export interface CostAnalytics {
  totalSpent: number;
  searchesConducted: number;
  candidatesContacted: number;
  interviewsConducted: number;
  hiresCompleted: number;
  costPerSearch: number;
  costPerContact: number;
  costPerInterview: number;
  costPerHire: number;
  conversionRates: {
    searchToContact: number;   // % of searches that led to contact
    contactToInterview: number; // % of contacts that led to interview
    interviewToHire: number;   // % of interviews that led to hire
  };
}

/**
 * Calculate cost analytics from usage data
 */
export function calculateCostAnalytics(
  totalSpent: number,
  searches: number,
  contacts: number,
  interviews: number,
  hires: number
): CostAnalytics {
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

// Storage keys for local usage tracking
export const STORAGE_KEYS = {
  CURRENT_PLAN: 'recruitos_pricing_plan',
  USAGE_RECORD: 'recruitos_usage_record',
  HIRE_TRACKING: 'recruitos_hire_tracking',
};

/**
 * Get current plan from localStorage
 */
export function getCurrentPlan(): PricingTier {
  if (typeof window === 'undefined') return 'personality';
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN);
  return (stored as PricingTier) || 'personality';
}

/**
 * Set current plan in localStorage
 */
export function setCurrentPlan(planId: PricingTier): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN, planId);
}

/**
 * Get usage record from localStorage
 */
export function getUsageRecord(): UsageRecord['usage'] {
  if (typeof window === 'undefined') {
    return { searches: 0, deepProfiles: 0, outreachGenerated: 0 };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.USAGE_RECORD);
  if (!stored) {
    return { searches: 0, deepProfiles: 0, outreachGenerated: 0 };
  }

  try {
    const record = JSON.parse(stored);
    // Check if we need to reset (new month)
    const now = new Date();
    const recordDate = new Date(record.periodStart || 0);
    if (now.getMonth() !== recordDate.getMonth() ||
        now.getFullYear() !== recordDate.getFullYear()) {
      // Reset for new month
      return { searches: 0, deepProfiles: 0, outreachGenerated: 0 };
    }
    return record.usage || { searches: 0, deepProfiles: 0, outreachGenerated: 0 };
  } catch {
    return { searches: 0, deepProfiles: 0, outreachGenerated: 0 };
  }
}

/**
 * Increment usage counter
 */
export function incrementUsage(type: 'searches' | 'deepProfiles' | 'outreachGenerated'): void {
  if (typeof window === 'undefined') return;

  const current = getUsageRecord();
  current[type] = (current[type] || 0) + 1;

  localStorage.setItem(STORAGE_KEYS.USAGE_RECORD, JSON.stringify({
    periodStart: new Date().toISOString(),
    usage: current,
  }));
}

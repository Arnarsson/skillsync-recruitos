import { describe, it, expect, beforeEach } from 'vitest';
import {
  CREDIT_PACKAGES,
  getCreditPackage,
  getCostPerCredit,
  formatDKK,
  calculateCreditsFromStripeAmount,
  validatePackagePurchase,
  getPricingTiers,
  type CreditPackage,
} from '../../lib/credit-packages';

describe('credit-packages', () => {
  describe('CREDIT_PACKAGES', () => {
    it('should have 4 packages defined', () => {
      expect(CREDIT_PACKAGES).toHaveLength(4);
    });

    it('should have starter pack with 10 credits for 5000 DKK', () => {
      const starter = CREDIT_PACKAGES.find(p => p.id === 'starter_10');
      expect(starter).toBeDefined();
      expect(starter?.credits).toBe(10);
      expect(starter?.priceInDKK).toBe(5000);
      expect(starter?.priceInCents).toBe(500000);
    });

    it('should have pro pack marked as popular', () => {
      const pro = CREDIT_PACKAGES.find(p => p.id === 'pro_25');
      expect(pro?.popular).toBe(true);
    });

    it('should have enterprise pack with 100 credits for 30000 DKK', () => {
      const enterprise = CREDIT_PACKAGES.find(p => p.id === 'enterprise_100');
      expect(enterprise).toBeDefined();
      expect(enterprise?.credits).toBe(100);
      expect(enterprise?.priceInDKK).toBe(30000);
    });

    it('should have correct cents conversion for all packages', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        expect(pkg.priceInCents).toBe(pkg.priceInDKK * 100);
      });
    });

    it('should have all required fields', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        expect(pkg.id).toBeTruthy();
        expect(pkg.name).toBeTruthy();
        expect(pkg.credits).toBeGreaterThan(0);
        expect(pkg.priceInDKK).toBeGreaterThan(0);
        expect(pkg.priceInCents).toBeGreaterThan(0);
      });
    });

    it('should have increasing credits with higher prices', () => {
      for (let i = 1; i < CREDIT_PACKAGES.length; i++) {
        expect(CREDIT_PACKAGES[i].credits).toBeGreaterThan(CREDIT_PACKAGES[i - 1].credits);
        expect(CREDIT_PACKAGES[i].priceInDKK).toBeGreaterThan(CREDIT_PACKAGES[i - 1].priceInDKK);
      }
    });

    it('should have better value (lower cost per credit) in higher tiers', () => {
      const starterCost = CREDIT_PACKAGES[0].priceInDKK / CREDIT_PACKAGES[0].credits;
      const enterpriseCost = CREDIT_PACKAGES[3].priceInDKK / CREDIT_PACKAGES[3].credits;
      expect(enterpriseCost).toBeLessThan(starterCost);
    });
  });

  describe('getCreditPackage', () => {
    it('should return package by id', () => {
      const pkg = getCreditPackage('pro_25');
      expect(pkg).toBeDefined();
      expect(pkg?.id).toBe('pro_25');
      expect(pkg?.credits).toBe(25);
    });

    it('should return undefined for invalid id', () => {
      const pkg = getCreditPackage('invalid_id');
      expect(pkg).toBeUndefined();
    });

    it('should return correct package for starter', () => {
      const pkg = getCreditPackage('starter_10');
      expect(pkg?.name).toBe('Starter Pack');
      expect(pkg?.priceInDKK).toBe(5000);
    });

    it('should return correct package for enterprise', () => {
      const pkg = getCreditPackage('enterprise_100');
      expect(pkg?.name).toBe('Enterprise Pack');
      expect(pkg?.priceInDKK).toBe(30000);
    });

    it('should handle empty string', () => {
      const pkg = getCreditPackage('');
      expect(pkg).toBeUndefined();
    });
  });

  describe('getCostPerCredit', () => {
    it('should calculate correct cost per credit for starter pack', () => {
      const starter = getCreditPackage('starter_10')!;
      const cost = getCostPerCredit(starter);
      expect(cost).toBe(500); // 5000 DKK / 10 credits
    });

    it('should calculate correct cost per credit for pro pack', () => {
      const pro = getCreditPackage('pro_25')!;
      const cost = getCostPerCredit(pro);
      expect(cost).toBe(400); // 10000 DKK / 25 credits
    });

    it('should calculate correct cost per credit for business pack', () => {
      const business = getCreditPackage('business_50')!;
      const cost = getCostPerCredit(business);
      expect(cost).toBe(360); // 18000 DKK / 50 credits
    });

    it('should calculate correct cost per credit for enterprise pack', () => {
      const enterprise = getCreditPackage('enterprise_100')!;
      const cost = getCostPerCredit(enterprise);
      expect(cost).toBe(300); // 30000 DKK / 100 credits
    });

    it('should show volume discount savings', () => {
      const starterCost = getCostPerCredit(getCreditPackage('starter_10')!);
      const proCost = getCostPerCredit(getCreditPackage('pro_25')!);
      const businessCost = getCostPerCredit(getCreditPackage('business_50')!);
      const enterpriseCost = getCostPerCredit(getCreditPackage('enterprise_100')!);

      expect(proCost).toBeLessThan(starterCost);
      expect(businessCost).toBeLessThan(proCost);
      expect(enterpriseCost).toBeLessThan(businessCost);
    });

    it('should match discount percentages approximately', () => {
      const starterCost = getCostPerCredit(getCreditPackage('starter_10')!);
      const pro = getCreditPackage('pro_25')!;
      const proCost = getCostPerCredit(pro);
      const actualDiscount = ((starterCost - proCost) / starterCost) * 100;
      
      // Pro pack advertises 20% discount
      expect(Math.round(actualDiscount)).toBe(pro.discount);
    });
  });

  describe('formatDKK', () => {
    it('should format small amounts', () => {
      expect(formatDKK(100)).toBe('100 kr.');
    });

    it('should format thousands with locale separator', () => {
      const formatted = formatDKK(5000);
      expect(formatted).toContain('kr.');
      // Danish locale uses . as thousands separator
      expect(formatted).toMatch(/5[.,\s]?000 kr\./);
    });

    it('should format large amounts', () => {
      const formatted = formatDKK(30000);
      expect(formatted).toContain('kr.');
      expect(formatted).toMatch(/30[.,\s]?000 kr\./);
    });

    it('should handle zero', () => {
      expect(formatDKK(0)).toBe('0 kr.');
    });

    it('should handle decimal amounts', () => {
      const formatted = formatDKK(5499.99);
      expect(formatted).toContain('kr.');
    });

    it('should format all package prices correctly', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        const formatted = formatDKK(pkg.priceInDKK);
        expect(formatted).toContain('kr.');
        expect(formatted).toBeTruthy();
      });
    });
  });

  describe('calculateCreditsFromStripeAmount', () => {
    it('should calculate credits for exact package match', () => {
      const credits = calculateCreditsFromStripeAmount(500000); // 5000 DKK in cents
      expect(credits).toBe(10);
    });

    it('should calculate credits for pro pack', () => {
      const credits = calculateCreditsFromStripeAmount(1000000); // 10000 DKK
      expect(credits).toBe(25);
    });

    it('should calculate credits for business pack', () => {
      const credits = calculateCreditsFromStripeAmount(1800000); // 18000 DKK
      expect(credits).toBe(50);
    });

    it('should calculate credits for enterprise pack', () => {
      const credits = calculateCreditsFromStripeAmount(3000000); // 30000 DKK
      expect(credits).toBe(100);
    });

    it('should fall back to starter rate for unknown amounts', () => {
      const credits = calculateCreditsFromStripeAmount(250000); // 2500 DKK
      expect(credits).toBe(5); // 2500 / 500 = 5 credits
    });

    it('should handle custom amounts at starter rate', () => {
      const credits = calculateCreditsFromStripeAmount(1500000); // 15000 DKK
      // Not a standard package, uses fallback rate
      expect(credits).toBe(30); // 15000 / 500 = 30 credits
    });

    it('should round down fractional credits', () => {
      const credits = calculateCreditsFromStripeAmount(120000); // 1200 DKK
      expect(credits).toBe(2); // 1200 / 500 = 2.4 → 2
    });

    it('should return 0 for zero amount', () => {
      const credits = calculateCreditsFromStripeAmount(0);
      expect(credits).toBe(0);
    });

    it('should handle very small amounts', () => {
      const credits = calculateCreditsFromStripeAmount(10000); // 100 DKK
      expect(credits).toBe(0); // 100 / 500 = 0.2 → 0
    });
  });

  describe('validatePackagePurchase', () => {
    it('should validate starter pack purchase', () => {
      const result = validatePackagePurchase(500000);
      expect(result.valid).toBe(true);
      expect(result.package?.id).toBe('starter_10');
      expect(result.credits).toBe(10);
    });

    it('should validate pro pack purchase', () => {
      const result = validatePackagePurchase(1000000);
      expect(result.valid).toBe(true);
      expect(result.package?.id).toBe('pro_25');
      expect(result.credits).toBe(25);
    });

    it('should validate enterprise pack purchase', () => {
      const result = validatePackagePurchase(3000000);
      expect(result.valid).toBe(true);
      expect(result.package?.id).toBe('enterprise_100');
      expect(result.credits).toBe(100);
    });

    it('should mark unknown amounts as invalid but still calculate credits', () => {
      const result = validatePackagePurchase(999999); // Not a standard package
      expect(result.valid).toBe(false);
      expect(result.package).toBeUndefined();
      expect(result.credits).toBeGreaterThan(0); // Should still calculate fallback credits
    });

    it('should handle zero amount', () => {
      const result = validatePackagePurchase(0);
      expect(result.valid).toBe(false);
      expect(result.credits).toBe(0);
    });

    it('should validate all defined packages', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        const result = validatePackagePurchase(pkg.priceInCents);
        expect(result.valid).toBe(true);
        expect(result.package?.id).toBe(pkg.id);
        expect(result.credits).toBe(pkg.credits);
      });
    });

    it('should provide fallback credits even for invalid amounts', () => {
      const result = validatePackagePurchase(750000); // 7500 DKK - not a standard package
      expect(result.valid).toBe(false);
      expect(result.credits).toBe(15); // 7500 / 500 = 15
    });
  });

  describe('getPricingTiers', () => {
    it('should return all packages with calculated fields', () => {
      const tiers = getPricingTiers();
      expect(tiers).toHaveLength(4);
    });

    it('should include cost per credit for each tier', () => {
      const tiers = getPricingTiers();
      tiers.forEach(tier => {
        expect(tier.costPerCredit).toBeGreaterThan(0);
        expect(tier.costPerCredit).toBe(tier.priceInDKK / tier.credits);
      });
    });

    it('should include formatted prices', () => {
      const tiers = getPricingTiers();
      tiers.forEach(tier => {
        expect(tier.formattedPrice).toContain('kr.');
      });
    });

    it('should include savings text for discounted packages', () => {
      const tiers = getPricingTiers();
      const pro = tiers.find(t => t.id === 'pro_25');
      expect(pro?.savings).toBe('Save 20%');
    });

    it('should have null savings for non-discounted packages', () => {
      const tiers = getPricingTiers();
      const starter = tiers.find(t => t.id === 'starter_10');
      expect(starter?.savings).toBeNull();
    });

    it('should preserve all original package properties', () => {
      const tiers = getPricingTiers();
      tiers.forEach((tier, index) => {
        const original = CREDIT_PACKAGES[index];
        expect(tier.id).toBe(original.id);
        expect(tier.name).toBe(original.name);
        expect(tier.credits).toBe(original.credits);
        expect(tier.priceInDKK).toBe(original.priceInDKK);
        expect(tier.priceInCents).toBe(original.priceInCents);
      });
    });

    it('should show increasing savings percentage with higher tiers', () => {
      const tiers = getPricingTiers().filter(t => t.discount);
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].discount).toBeGreaterThan(tiers[i - 1].discount!);
      }
    });

    it('should calculate enterprise savings correctly', () => {
      const tiers = getPricingTiers();
      const enterprise = tiers.find(t => t.id === 'enterprise_100');
      expect(enterprise?.discount).toBe(40);
      expect(enterprise?.savings).toBe('Save 40%');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete purchase flow', () => {
      // 1. User selects a package
      const selectedPackage = getCreditPackage('pro_25')!;
      expect(selectedPackage.credits).toBe(25);

      // 2. Calculate and display cost per credit
      const costPerCredit = getCostPerCredit(selectedPackage);
      expect(costPerCredit).toBe(400);

      // 3. Format price for display
      const displayPrice = formatDKK(selectedPackage.priceInDKK);
      expect(displayPrice).toContain('kr.');

      // 4. Stripe payment completes
      const stripeAmount = selectedPackage.priceInCents;

      // 5. Validate and credit the account
      const validation = validatePackagePurchase(stripeAmount);
      expect(validation.valid).toBe(true);
      expect(validation.credits).toBe(25);
    });

    it('should detect and handle fraudulent amounts', () => {
      // Someone tries to pay less than starter pack
      const fraudAmount = 100000; // 1000 DKK
      const validation = validatePackagePurchase(fraudAmount);
      
      expect(validation.valid).toBe(false);
      expect(validation.package).toBeUndefined();
      // System still calculates credits based on fallback rate
      expect(validation.credits).toBe(2);
    });

    it('should support pricing comparison UI', () => {
      const tiers = getPricingTiers();
      
      // Check we can render all tiers
      expect(tiers.length).toBeGreaterThan(0);
      
      // Popular tier should be marked
      const popularTier = tiers.find(t => t.popular);
      expect(popularTier).toBeDefined();
      
      // All tiers have display data
      tiers.forEach(tier => {
        expect(tier.formattedPrice).toBeTruthy();
        expect(tier.costPerCredit).toBeGreaterThan(0);
        if (tier.discount) {
          expect(tier.savings).toBeTruthy();
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle extremely large amounts', () => {
      const hugeAmount = 100000000; // 1,000,000 DKK
      const credits = calculateCreditsFromStripeAmount(hugeAmount);
      expect(credits).toBeGreaterThan(0);
      expect(credits).toBe(2000); // 1,000,000 / 500
    });

    it('should handle negative amounts gracefully', () => {
      const credits = calculateCreditsFromStripeAmount(-50000);
      // Should not crash, return 0 or negative
      expect(credits).toBeLessThanOrEqual(0);
    });

    it('should maintain precision in credit calculations', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        const calculated = calculateCreditsFromStripeAmount(pkg.priceInCents);
        expect(calculated).toBe(pkg.credits);
      });
    });
  });
});

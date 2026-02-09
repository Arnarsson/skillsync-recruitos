import { describe, it, expect } from "vitest";
import { RECRUITOS_PRICING_PLANS, CREDIT_BUNDLE_PACKAGES } from "../../lib/pricing-catalog";
import { CREDIT_PACKAGES as PricingPackages } from "../../lib/pricing";
import { CREDIT_PACKAGES as BundlePackages } from "../../lib/credit-packages";

describe("pricing catalog consistency", () => {
  it("keeps lib/pricing.ts aligned with shared RecruitOS pricing plans", () => {
    expect(PricingPackages).toHaveLength(RECRUITOS_PRICING_PLANS.length);
    expect(PricingPackages.map((p) => p.id)).toEqual(
      RECRUITOS_PRICING_PLANS.map((p) => p.id),
    );
    expect(PricingPackages.map((p) => p.price)).toEqual(
      RECRUITOS_PRICING_PLANS.map((p) => p.price),
    );
  });

  it("keeps lib/credit-packages.ts aligned with shared credit bundle catalog", () => {
    expect(BundlePackages).toHaveLength(CREDIT_BUNDLE_PACKAGES.length);
    expect(BundlePackages.map((p) => p.id)).toEqual(
      CREDIT_BUNDLE_PACKAGES.map((p) => p.id),
    );
    expect(BundlePackages.map((p) => p.priceInCents)).toEqual(
      CREDIT_BUNDLE_PACKAGES.map((p) => p.priceInCents),
    );
  });
});

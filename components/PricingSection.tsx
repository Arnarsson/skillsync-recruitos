"use client";

import { useState } from "react";
import PricingToggle from "./PricingToggle";
import PricingCard from "./PricingCard";

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const proPrice = isYearly ? "$399" : "$499";
  const proPeriod = isYearly ? "mo (billed yearly)" : "month";

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Start finding elite engineers today. No hidden fees, no long-term contracts.
          </p>
        </div>

        <div className="mb-12">
          <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <PricingCard
            name="Pro"
            price={proPrice}
            period={proPeriod}
            description="For growing teams looking to hire top talent"
            features={[
              "Unlimited capability searches",
              "50 deep profile credits/month",
              "GitHub activity analysis",
              "Export to CSV",
              "Email support",
              "API access",
            ]}
            cta="Get Started"
            ctaLink="/signup"
            popular
          />

          <PricingCard
            name="Enterprise"
            price=""
            period=""
            description="For large organizations with custom needs"
            features={[
              "Everything in Pro",
              "Unlimited deep profile credits",
              "Custom integrations",
              "MCP server access",
              "Dedicated account manager",
              "SSO & advanced security",
              "Custom contract terms",
            ]}
            cta="Request Demo"
            ctaLink="https://cal.com"
            enterprise
          />
        </div>

        {isYearly && (
          <p className="text-center text-sm text-gray-500 mt-8">
            Yearly billing: $4,790/year (save $1,198)
          </p>
        )}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import PricingToggle from "./PricingToggle";
import PricingCard from "./PricingCard";

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const proPrice = isYearly ? "$399" : "$499";
  const proPeriod = isYearly ? "seat/mo (billed yearly)" : "seat/month";

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
            description="For teams looking to hire top engineering talent"
            features={[
              "15 searches monthly",
              "10 deep profile credits monthly",
              "Phone and chat support",
              "GitHub activity analysis",
              "Export candidate data",
              "Try your first search free",
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
              "MCP server integration",
              "Dedicated account manager",
              "Internal app integrations",
              "Priority multi-channel support",
              "Custom contract terms",
            ]}
            cta="Request Demo"
            ctaLink="https://cal.com"
            enterprise
          />
        </div>

        {/* Deep Profile Credits */}
        <div className="mt-12 p-6 bg-[#1a1b1e] rounded-xl border border-white/5 text-center">
          <p className="text-gray-400 mb-2">Need more deep profile credits?</p>
          <p className="text-white">
            Additional credits available at <span className="text-blue-400 font-semibold">$5 each</span>
          </p>
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

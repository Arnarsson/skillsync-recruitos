import Link from "next/link";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  enterprise?: boolean;
}

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaLink,
  popular,
  enterprise,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col p-8 rounded-2xl border ${
        popular
          ? "border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-transparent"
          : "border-white/10 bg-[#1a1b1e]"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>

      <div className="mb-6">
        {enterprise ? (
          <div className="text-3xl font-bold">Custom</div>
        ) : (
          <>
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-gray-400 text-sm">/{period}</span>
          </>
        )}
      </div>

      <ul className="flex-1 space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaLink}
        className={`w-full py-3 px-6 rounded-lg text-center font-medium transition-colors ${
          popular
            ? "bg-white text-[#141517] hover:bg-gray-200"
            : enterprise
            ? "bg-transparent border border-white/20 text-white hover:bg-white/5"
            : "bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

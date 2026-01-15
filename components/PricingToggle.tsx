"use client";

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: (isYearly: boolean) => void;
}

export default function PricingToggle({ isYearly, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className={`text-sm ${!isYearly ? "text-white" : "text-gray-500"}`}>
        Monthly
      </span>
      <button
        onClick={() => onToggle(!isYearly)}
        className="relative w-14 h-7 bg-[#1a1b1e] rounded-full border border-white/10 transition-colors"
      >
        <div
          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
            isYearly ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
      <span className={`text-sm ${isYearly ? "text-white" : "text-gray-500"}`}>
        Yearly
      </span>
      {isYearly && (
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
          -20%
        </span>
      )}
    </div>
  );
}

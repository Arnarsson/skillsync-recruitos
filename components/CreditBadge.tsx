"use client";

import { useCredits } from "@/lib/useCredits";
import { Coins, Infinity as InfinityIcon, Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * Credit balance indicator for the header/navbar.
 * Shows current credits or "∞" for unlimited plans.
 */
export default function CreditBadge() {
  const { credits, unlimited, loading, plan } = useCredits();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
      </div>
    );
  }

  return (
    <Link
      href="/pricing"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-xs font-medium"
      title={unlimited ? "Ubegrænset plan" : `${credits} kreditter tilbage`}
    >
      <Coins className="w-3.5 h-3.5 text-primary" />
      {unlimited ? (
        <span className="flex items-center gap-0.5 text-primary">
          <InfinityIcon className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span className={credits <= 2 ? "text-red-400" : "text-primary"}>
          {credits}
        </span>
      )}
    </Link>
  );
}

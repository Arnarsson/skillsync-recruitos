"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface CreditState {
  credits: number;
  plan: string;
  unlimited: boolean;
  profilesViewed: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage the current user's credit balance.
 */
export function useCredits() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<CreditState>({
    credits: 0,
    plan: "FREE",
    unlimited: false,
    profilesViewed: 0,
    loading: true,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (status !== "authenticated") {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    try {
      const res = await fetch("/api/credits/balance");
      if (!res.ok) throw new Error("Failed to fetch credits");
      const data = await res.json();
      setState({
        credits: data.credits ?? 0,
        plan: data.plan ?? "FREE",
        unlimited: data.unlimited ?? false,
        profilesViewed: data.profilesViewed ?? 0,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err.message,
      }));
    }
  }, [status]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  /**
   * Consume 1 credit for a candidate analysis.
   * Returns true if successful, false if insufficient credits.
   */
  const consume = useCallback(
    async (candidateUsername: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/credits/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateUsername }),
        });

        if (res.status === 402) {
          // Insufficient credits
          return false;
        }

        if (!res.ok) throw new Error("Failed to consume credit");

        const data = await res.json();
        setState((s) => ({
          ...s,
          credits: data.newBalance ?? s.credits - 1,
          profilesViewed: s.profilesViewed + 1,
        }));

        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  /**
   * Start checkout for a credit package.
   */
  const purchasePackage = useCallback(async (packageId: string) => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout failed");
      }

      const { url } = await res.json();
      if (url) {
        window.location.assign(url);
      }
    } catch (err: any) {
      console.error("Purchase error:", err);
      throw err;
    }
  }, []);

  return {
    ...state,
    refresh: fetchBalance,
    consume,
    purchasePackage,
  };
}

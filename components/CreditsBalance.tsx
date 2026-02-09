"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface CreditsBalanceProps {
  compact?: boolean;
  className?: string;
  refreshTrigger?: number;
}

export default function CreditsBalance({
  compact = false,
  className = "",
  refreshTrigger = 0,
}: CreditsBalanceProps) {
  const router = useRouter();
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState<string>("FREE");
  const [unlimited, setUnlimited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, [refreshTrigger]);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/credits", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits || 0);
        setPlan(data.plan || "FREE");
        setUnlimited(data.unlimited || false);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = () => {
    router.push("/credits");
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="h-10 w-32 bg-muted/50 animate-pulse rounded-lg" />
      </div>
    );
  }

  // Compact version (for header/navbar)
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge
          variant="outline"
          className="px-3 py-1.5 cursor-pointer hover:bg-accent transition-colors"
          onClick={handleBuyCredits}
        >
          <Coins className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
          <span className="font-mono font-medium">
            {unlimited ? "∞" : credits.toLocaleString()}
          </span>
          {unlimited && (
            <Sparkles className="w-3 h-3 ml-1.5 text-primary" />
          )}
        </Badge>
        {!unlimited && credits < 5 && (
          <Button
            size="sm"
            variant="default"
            onClick={handleBuyCredits}
            className="h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Buy
          </Button>
        )}
      </div>
    );
  }

  // Full card version (for dashboard)
  const lowBalance = !unlimited && credits < 5;

  return (
    <Card className={className}>
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                lowBalance
                  ? "bg-red-500/10"
                  : "bg-amber-500/10"
              }`}
            >
              <Coins
                className={`w-6 h-6 ${
                  lowBalance ? "text-red-500" : "text-amber-500"
                }`}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {unlimited ? "Credits (Unlimited)" : "Credit Balance"}
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold font-mono">
                  {unlimited ? "∞" : credits.toLocaleString()}
                </h3>
                {unlimited && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {plan}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {!unlimited && (
            <Button onClick={handleBuyCredits} variant={lowBalance ? "default" : "outline"}>
              <Plus className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          )}
        </div>

        {lowBalance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 pt-4 border-t border-border"
          >
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600">
                  Low balance warning
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have {credits} {credits === 1 ? "credit" : "credits"} remaining.
                  Purchase more to continue generating deep profile reports.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Coins,
  Sparkles,
  Zap,
  TrendingUp,
  Check,
  ArrowRight,
  CreditCard,
  Shield,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInDKK: number;
  priceInCents: number;
  popular?: boolean;
  discount?: number;
  costPerCredit?: number;
  formattedPrice?: string;
  savings?: string | null;
}

export default function CreditsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
    fetchBalance();
    
    // Check for purchase success/cancel messages
    const purchase = searchParams.get("purchase");
    const credits = searchParams.get("credits");
    
    if (purchase === "success" && credits) {
      toast.success(`Successfully purchased ${credits} credits!`, {
        description: "Your credits have been added to your account.",
        icon: <Coins className="w-4 h-4" />,
      });
      // Clean up URL
      router.replace("/credits");
    } else if (purchase === "cancelled") {
      toast.info("Purchase cancelled", {
        description: "No charges were made to your account.",
      });
      router.replace("/credits");
    }
  }, [searchParams, router]);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/checkout/credits");
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      toast.error("Failed to load credit packages");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/credits");
      if (response.ok) {
        const data = await response.json();
        setCurrentBalance(data.credits || 0);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    
    try {
      const response = await fetch("/api/checkout/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.assign(data.url);
        }
      } else {
        const error = await response.json();
        toast.error("Purchase failed", {
          description: error.error || "Something went wrong",
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to initiate checkout");
    } finally {
      setPurchasing(null);
    }
  };

  const formatDKK = (amount: number) => {
    return `${amount.toLocaleString('da-DK')} kr.`;
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-500/20 text-amber-600">
            <Coins className="w-3 h-3 mr-1" />
            Credits
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Buy Credits for Deep Profile Reports
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Purchase credits to unlock detailed candidate profiles with AI-powered insights.
            Pay as you go, no subscriptions required.
          </p>
        </div>

        {/* Current Balance Card */}
        <Card className="mb-12 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Coins className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Credit Balance</p>
                  <h2 className="text-3xl font-bold">{currentBalance.toLocaleString()} credits</h2>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Each credit = 1 deep profile report</p>
                <p className="text-xs mt-1">Credits never expire</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full ${
                    pkg.popular
                      ? 'border-primary shadow-lg scale-105'
                      : 'border-border/50'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {index === 0 && <Zap className="w-6 h-6 text-primary" />}
                      {index === 1 && <Sparkles className="w-6 h-6 text-primary" />}
                      {index === 2 && <TrendingUp className="w-6 h-6 text-primary" />}
                      {index === 3 && <CreditCard className="w-6 h-6 text-primary" />}
                    </div>
                    <CardTitle className="text-xl mb-1">{pkg.name}</CardTitle>
                    <CardDescription>
                      {pkg.credits} deep profile reports
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {formatDKK(pkg.priceInDKK)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDKK(Math.round(pkg.priceInDKK / pkg.credits))} per credit
                      </p>
                      {pkg.discount && (
                        <Badge variant="secondary" className="mt-2 bg-green-500/20 text-green-600">
                          Save {pkg.discount}%
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* Features */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{pkg.credits} deep profile analyses</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>AI-powered insights</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>Never expires</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>Instant activation</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full"
                      variant={pkg.popular ? 'default' : 'outline'}
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasing !== null}
                    >
                      {purchasing === pkg.id ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Buy Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Trust Signals */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border/50">
            <CardContent className="py-6 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Stripe. Your payment info is encrypted and secure.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="py-6 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Instant Activation</h3>
              <p className="text-sm text-muted-foreground">
                Credits are added to your account immediately after purchase.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="py-6 text-center">
              <Coins className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Never Expire</h3>
              <p className="text-sm text-muted-foreground">
                Your credits remain in your account until you use them.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">What can I do with credits?</h4>
              <p className="text-sm text-muted-foreground">
                Each credit lets you generate one comprehensive deep profile report for a candidate,
                including AI-powered behavioral insights, skills analysis, and hiring recommendations.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">Do credits expire?</h4>
              <p className="text-sm text-muted-foreground">
                No! Your credits remain in your account indefinitely and can be used whenever you need them.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">Can I get a refund?</h4>
              <p className="text-sm text-muted-foreground">
                Unused credits can be refunded within 30 days of purchase. Contact support for assistance.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-1">Is there a subscription option?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! Check out our <a href="/pricing" className="text-primary hover:underline">pricing page</a> for
                subscription plans with unlimited credits and additional features.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

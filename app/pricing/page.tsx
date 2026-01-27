"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  Crown,
  ArrowRight,
  Coins,
  CreditCard,
  Loader2,
} from "lucide-react";
import {
  CREDIT_PACKAGES,
  formatPrice,
  formatPricePerCredit,
  type CreditPackage,
} from "@/lib/pricing";
import { useCredits } from "@/lib/useCredits";
import { Toaster, toast } from "sonner";

const ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="w-6 h-6 text-primary" />,
  pro: <Sparkles className="w-6 h-6 text-primary" />,
  enterprise: <Building2 className="w-6 h-6 text-primary" />,
  annual: <Crown className="w-6 h-6 text-primary" />,
};

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { credits, unlimited, purchasePackage } = useCredits();
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);

  // Show checkout result
  const checkoutStatus = searchParams.get("checkout");
  if (checkoutStatus === "cancelled") {
    // Could show a toast, but keeping it simple
  }

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoadingPkg(pkg.id);
    try {
      await purchasePackage(pkg.id);
    } catch (err: any) {
      toast.error(err.message || "Noget gik galt. Prøv igen.");
    } finally {
      setLoadingPkg(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary">
            <Coins className="w-3 h-3 mr-1" />
            Kreditter
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Køb Kreditter
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            1 kredit = 1 kandidat-analyse. Vælg den pakke der passer til dig.
          </p>

          {/* Current balance */}
          {!unlimited && credits > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
              <Coins className="w-4 h-4 text-primary" />
              <span>
                Du har <strong>{credits}</strong> kreditter tilbage
              </span>
            </div>
          )}
          {unlimited && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-sm text-green-500">
              <Crown className="w-4 h-4" />
              <span>Ubegrænset adgang aktiv</span>
            </div>
          )}
        </div>

        {/* Credit Package Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKAGES.map((pkg, index) => {
            const perCredit = formatPricePerCredit(pkg);
            const isLoading = loadingPkg === pkg.id;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full flex flex-col ${
                    pkg.popular
                      ? "border-primary shadow-lg ring-1 ring-primary/20"
                      : ""
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Mest populær</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {ICONS[pkg.id]}
                    </div>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.tagline}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 space-y-6">
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {formatPrice(pkg)}
                      </div>
                      {pkg.credits === "unlimited" ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          ubegrænset analyser
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {pkg.credits} kreditter
                          {perCredit && (
                            <span className="block text-xs mt-0.5">
                              ({perCredit})
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full"
                      variant={pkg.popular ? "default" : "outline"}
                      onClick={() => handlePurchase(pkg)}
                      disabled={isLoading || (unlimited && pkg.id !== "annual")}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Indlæser...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          {pkg.period === "annual"
                            ? "Abonnér nu"
                            : "Køb kreditter"}
                        </>
                      )}
                    </Button>

                    {/* Features */}
                    <div className="space-y-3 flex-1">
                      {pkg.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* How Credits Work */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Sådan fungerer kreditter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-medium mb-1">1. Køb kreditter</h3>
                <p className="text-sm text-muted-foreground">
                  Vælg en pakke og betal sikkert med Stripe
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-medium mb-1">2. Analysér kandidater</h3>
                <p className="text-sm text-muted-foreground">
                  1 kredit = 1 dyb kandidat-analyse med AI
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-medium mb-1">3. Ingen udløbsdato</h3>
                <p className="text-sm text-muted-foreground">
                  Dine kreditter udløber aldrig. Brug dem når du vil
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            Sammenlign pakker
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Feature</th>
                      {CREDIT_PACKAGES.map((pkg) => (
                        <th
                          key={pkg.id}
                          className="text-center p-4 font-medium"
                        >
                          {pkg.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompRow
                      feature="Kreditter"
                      values={["10", "50", "200", "∞"]}
                    />
                    <CompRow
                      feature="Pris per kredit"
                      values={["50 kr", "40 kr", "25 kr", "—"]}
                    />
                    <CompRow
                      feature="AI profilanalyse"
                      values={[true, true, true, true]}
                    />
                    <CompRow
                      feature="Adfærdsindsigter"
                      values={[true, true, true, true]}
                    />
                    <CompRow
                      feature="GitHub deep-analyse"
                      values={[false, true, true, true]}
                    />
                    <CompRow
                      feature="Team-arbejdsrum"
                      values={[false, false, true, true]}
                    />
                    <CompRow
                      feature="API-adgang"
                      values={[false, false, true, true]}
                    />
                    <CompRow
                      feature="Prioriteret support"
                      values={[false, true, true, true]}
                    />
                    <CompRow
                      feature="Custom integrationer"
                      values={[false, false, false, true]}
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust signals */}
        <div className="text-center text-muted-foreground text-sm">
          <p>Sikker betaling med Stripe · Ingen skjulte gebyrer · Kreditter udløber aldrig</p>
        </div>
      </div>
    </div>
  );
}

function CompRow({
  feature,
  values,
}: {
  feature: string;
  values: (string | boolean)[];
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-4 text-sm">{feature}</td>
      {values.map((v, i) => (
        <td key={i} className="p-4 text-center">
          {typeof v === "boolean" ? (
            v ? (
              <Check className="w-5 h-5 text-green-500 mx-auto" />
            ) : (
              <span className="text-muted-foreground/30">—</span>
            )
          ) : (
            <span className="text-sm">{v}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

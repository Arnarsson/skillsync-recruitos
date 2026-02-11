"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  Users,
  Lock,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { PRICING_PLANS, HIRE_GUARANTEE, formatPrice, type PricingPlan } from "@/lib/pricing";
import { useLanguage } from "@/lib/i18n";

export default function PricingPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'enterprise') {
      // Open mailto link for enterprise inquiries
      window.open('mailto:sales@recruitos.ai?subject=Enterprise%20Pricing%20Inquiry', '_self');
      return;
    }

    // For behavioral profile or recruiting, redirect to checkout
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // For recruiting plan (no upfront payment), redirect to dashboard
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
          return;
        }
        
        // For behavioral profile (Stripe checkout), redirect to payment
        if (data.url) {
          window.location.assign(data.url);
          return;
        }
      } else {
        // Fallback: redirect to signup
        router.push(`/signup?plan=${planId}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Fallback on error
      router.push(`/signup?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary">Pricing</Badge>
          <h1 className="text-4xl font-bold mb-4">
            {t("pricingPage.title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("pricingPage.subtitle")}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PRICING_PLANS.map((plan, index) => {
            const displayPrice = formatPrice(plan);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full ${
                    plan.popular
                      ? 'border-primary shadow-lg scale-105'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">{t("pricingPage.mostPopular")}</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {plan.id === 'starter' && <Zap className="w-6 h-6 text-primary" />}
                      {plan.id === 'pro' && <Sparkles className="w-6 h-6 text-primary" />}
                      {plan.id === 'enterprise' && <Building2 className="w-6 h-6 text-primary" />}
                      {plan.id === 'annual' && <Sparkles className="w-6 h-6 text-primary" />}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.tagline}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-4xl font-bold">
                        {displayPrice}
                      </div>
                      {plan.period === 'one-time' && (
                        <p className="text-sm text-muted-foreground">
                          {plan.credits === 'unlimited' ? t("pricingPage.unlimitedCredits") : `${plan.credits} ${t("pricingPage.credits")}`}
                        </p>
                      )}
                      {plan.period === 'annual' && (
                        <p className="text-sm text-muted-foreground">{t("pricingPage.unlimitedCreditsPerYear")}</p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.id === 'starter' && t("pricingPage.getStarted")}
                      {plan.id === 'pro' && t("pricingPage.buyCredits")}
                      {plan.id === 'enterprise' && t("pricingPage.contactSales")}
                      {plan.id === 'annual' && t("pricingPage.subscribe")}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Credits info */}
                    <div className="pt-4 border-t text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {plan.credits === 'unlimited'
                            ? 'Unlimited analyses'
                            : `${plan.credits} ${t("pricingPage.candidateAnalyses")}`}
                        </span>
                      </div>
                      {plan.pricePerCredit !== null && (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>{plan.pricePerCredit} kr {t("pricingPage.perCredit")}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Success-Based Pricing Highlight */}
        <Card className="mb-12 border-dashed bg-green-500/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t("pricingPage.successBasedTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("pricingPage.successBasedDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">{t("pricingPage.comparePlans")}</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">{t("pricingPage.feature")}</th>
                      {PRICING_PLANS.map(plan => (
                        <th key={plan.id} className="text-center p-4 font-medium">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      feature={t("pricingPage.features.personalityAnalysis")}
                      values={['1 per purchase', 'Unlimited', 'Unlimited']}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.behavioralInsights")}
                      values={[true, true, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.workStyleAssessment")}
                      values={[true, true, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.candidateSourcing")}
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.interviewCoordination")}
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.referenceChecking")}
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.successBasedPricing")}
                      values={[false, true, t("pricingPage.custom")]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.teamSeats")}
                      values={['1', '3', t("pricingPage.unlimited")]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.sharedPipelines")}
                      values={[false, false, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.apiAccess")}
                      values={[false, false, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.atsIntegration")}
                      values={[false, false, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.prioritySupport")}
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature={t("pricingPage.features.dedicatedAccountManager")}
                      values={[false, false, true]}
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ or Trust Signals */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t("pricingPage.trustedTitle")}</h2>
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>{t("pricingPage.trust.hiresMade")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>{t("pricingPage.trust.satisfaction")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{t("pricingPage.trust.companies")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  feature,
  values,
}: {
  feature: string;
  values: (string | boolean)[];
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-4 text-sm">{feature}</td>
      {values.map((value, i) => (
        <td key={i} className="p-4 text-center">
          {typeof value === 'boolean' ? (
            value ? (
              <Check className="w-5 h-5 text-green-500 mx-auto" />
            ) : (
              <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
            )
          ) : (
            <span className="text-sm">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

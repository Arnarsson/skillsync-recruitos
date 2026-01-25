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

export default function PricingPage() {
  const router = useRouter();
  const [showAnnual, setShowAnnual] = useState(false);
  const [showHireGuarantee, setShowHireGuarantee] = useState(false);

  // Calculate annual discount (2 months free)
  const getAnnualPrice = (plan: PricingPlan) => {
    if (plan.price.period !== 'month') return null;
    return Math.round(plan.price.amount * 10); // 10 months instead of 12
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'enterprise') {
      // Open mailto link for enterprise inquiries
      window.open('mailto:sales@recruitos.ai?subject=Enterprise%20Pricing%20Inquiry', '_self');
      return;
    }

    // For starter, redirect directly to search
    if (planId === 'starter') {
      router.push('/search');
      return;
    }

    // For pro, redirect to checkout
    // In a real implementation, this would create a Stripe checkout session
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          annual: showAnnual,
          hireGuarantee: showHireGuarantee,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          // External redirect to Stripe checkout
          window.location.assign(url);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary">Pricing</Badge>
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the perfect plan for your hiring needs. Start free, scale as you grow.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm ${!showAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Switch
            checked={showAnnual}
            onCheckedChange={setShowAnnual}
          />
          <span className={`text-sm ${showAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
            Annual
          </span>
          {showAnnual && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-600">
              Save 17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PRICING_PLANS.map((plan, index) => {
            const annualPrice = getAnnualPrice(plan);
            const displayPrice = showAnnual && annualPrice
              ? `$${annualPrice}/yr`
              : formatPrice(plan);

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
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {plan.id === 'starter' && <Zap className="w-6 h-6 text-primary" />}
                      {plan.id === 'pro' && <Sparkles className="w-6 h-6 text-primary" />}
                      {plan.id === 'enterprise' && <Building2 className="w-6 h-6 text-primary" />}
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
                      {plan.price.period === 'once' && (
                        <p className="text-sm text-muted-foreground">per search</p>
                      )}
                      {plan.price.period === 'month' && !showAnnual && (
                        <p className="text-sm text-muted-foreground">per month</p>
                      )}
                      {plan.price.period === 'month' && showAnnual && (
                        <p className="text-sm text-muted-foreground">per year (billed annually)</p>
                      )}
                      {plan.price.period === 'custom' && (
                        <p className="text-sm text-muted-foreground">contact us for pricing</p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.id === 'starter' && 'Start Searching'}
                      {plan.id === 'pro' && 'Subscribe Now'}
                      {plan.id === 'enterprise' && 'Contact Sales'}
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

                    {/* Limits */}
                    <div className="pt-4 border-t text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {plan.limits.teamSeats === -1
                            ? 'Unlimited team seats'
                            : `${plan.limits.teamSeats} team seat${plan.limits.teamSeats > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      {plan.limits.apiAccess && (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>API access included</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Hire Guarantee Add-on */}
        <Card className="mb-12 border-dashed">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Hire Guarantee</h3>
                  <p className="text-muted-foreground">
                    Only pay €{HIRE_GUARANTEE.successFee} if you successfully hire through our platform
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={showHireGuarantee}
                  onCheckedChange={setShowHireGuarantee}
                />
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  No Cure, No Pay
                </Badge>
              </div>
            </div>
            {showHireGuarantee && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 pt-4 border-t text-sm text-muted-foreground"
              >
                <p>
                  With Hire Guarantee, you only pay the success fee when you mark a candidate
                  as &quot;Hired&quot; in your pipeline. This is perfect for teams who want to
                  minimize upfront risk while still getting access to premium features.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Feature</th>
                      {PRICING_PLANS.map(plan => (
                        <th key={plan.id} className="text-center p-4 font-medium">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      feature="Searches"
                      values={['1 per purchase', '20/month', 'Unlimited']}
                    />
                    <ComparisonRow
                      feature="Deep Profiles"
                      values={['1 per purchase', 'Unlimited', 'Unlimited']}
                    />
                    <ComparisonRow
                      feature="AI Outreach"
                      values={[true, true, true]}
                    />
                    <ComparisonRow
                      feature="Behavioral Insights"
                      values={[true, true, true]}
                    />
                    <ComparisonRow
                      feature="Saved Searches"
                      values={[false, '10', 'Unlimited']}
                    />
                    <ComparisonRow
                      feature="Team Seats"
                      values={['1', '3', 'Unlimited']}
                    />
                    <ComparisonRow
                      feature="Shared Pipelines"
                      values={[false, false, true]}
                    />
                    <ComparisonRow
                      feature="API Access"
                      values={[false, false, true]}
                    />
                    <ComparisonRow
                      feature="ATS Integration"
                      values={[false, false, true]}
                    />
                    <ComparisonRow
                      feature="Priority Support"
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature="Dedicated CSM"
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
          <h2 className="text-2xl font-bold mb-4">Trusted by Recruiters Worldwide</h2>
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>500+ hires made</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>4.9/5 satisfaction</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>100+ companies</span>
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

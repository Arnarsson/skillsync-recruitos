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

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'enterprise') {
      // Open mailto link for enterprise inquiries
      window.open('mailto:sales@recruitos.ai?subject=Enterprise%20Pricing%20Inquiry', '_self');
      return;
    }

    // For personality profile or recruiting, redirect to checkout
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
        
        // For personality profile (Stripe checkout), redirect to payment
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
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the right solution for your hiring needs. From personality insights to full recruiting support.
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
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {plan.id === 'personality' && <Zap className="w-6 h-6 text-primary" />}
                      {plan.id === 'recruiting' && <Sparkles className="w-6 h-6 text-primary" />}
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
                      {plan.price.period === 'profile' && (
                        <p className="text-sm text-muted-foreground">per personality profile</p>
                      )}
                      {plan.price.period === 'hire' && (
                        <p className="text-sm text-muted-foreground">only pay when you hire</p>
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
                      {plan.id === 'personality' && 'Get Started'}
                      {plan.id === 'recruiting' && 'Start Recruiting'}
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

        {/* Success-Based Pricing Highlight */}
        <Card className="mb-12 border-dashed bg-green-500/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Success-Based Pricing</h3>
                <p className="text-muted-foreground">
                  With Full Recruiting, you only pay 5,000 DKK when you successfully make a hire. No upfront fees, no monthly subscriptions.
                </p>
              </div>
            </div>
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
                      feature="Personality Analysis"
                      values={['1 per purchase', 'Unlimited', 'Unlimited']}
                    />
                    <ComparisonRow
                      feature="Behavioral Insights"
                      values={[true, true, true]}
                    />
                    <ComparisonRow
                      feature="Work Style Assessment"
                      values={[true, true, true]}
                    />
                    <ComparisonRow
                      feature="Candidate Sourcing"
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature="Interview Coordination"
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature="Reference Checking"
                      values={[false, true, true]}
                    />
                    <ComparisonRow
                      feature="Success-Based Pricing"
                      values={[false, true, 'Custom']}
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
                      feature="Dedicated Account Manager"
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

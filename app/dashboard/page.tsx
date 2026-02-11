"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Users,
  MessageSquare,
  UserCheck,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getCurrentPlan,
  getPricingPlan,
  getUsageRecord,
  getRemainingUsage,
  calculateCostAnalytics,
  type CostAnalytics,
} from "@/lib/pricing";
import { useLanguage } from "@/lib/i18n";

interface HireTracking {
  searches: number;
  contacted: number;
  interviews: number;
  hires: number;
  totalSpent: number;
}

// Helper to get hire tracking from localStorage
function getHireTrackingFromStorage(): HireTracking {
  if (typeof window === 'undefined') {
    return { searches: 0, contacted: 0, interviews: 0, hires: 0, totalSpent: 0 };
  }
  const stored = localStorage.getItem('recruitos_hire_tracking');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Ignore parse errors
    }
  }
  return { searches: 0, contacted: 0, interviews: 0, hires: 0, totalSpent: 0 };
}

export default function DashboardPage() {
  const { t } = useLanguage();
  // Use lazy initializers to read from localStorage synchronously
  const [plan, setPlan] = useState<ReturnType<typeof getPricingPlan>>(() => {
    if (typeof window === 'undefined') return undefined;
    const currentPlanId = getCurrentPlan();
    return getPricingPlan(currentPlanId);
  });
  const [usage, setUsage] = useState<ReturnType<typeof getUsageRecord>>(getUsageRecord);
  const [hireTracking, setHireTracking] = useState<HireTracking>(() =>
    getHireTrackingFromStorage()
  );

  const remaining = useMemo(() => {
    if (!plan || !usage) return null;
    return getRemainingUsage(usage, plan);
  }, [plan, usage]);

  const analytics = useMemo((): CostAnalytics => {
    return calculateCostAnalytics(
      hireTracking.totalSpent,
      hireTracking.searches,
      hireTracking.contacted,
      hireTracking.interviews,
      hireTracking.hires
    );
  }, [hireTracking]);
  const hasActivity = useMemo(
    () =>
      hireTracking.searches > 0 ||
      hireTracking.contacted > 0 ||
      hireTracking.interviews > 0 ||
      hireTracking.hires > 0,
    [hireTracking]
  );

  // Sample data for charts
  const weeklyActivity = [
    { day: t("dashboard.days.mon"), searches: 4, contacts: 2 },
    { day: t("dashboard.days.tue"), searches: 6, contacts: 3 },
    { day: t("dashboard.days.wed"), searches: 3, contacts: 1 },
    { day: t("dashboard.days.thu"), searches: 8, contacts: 5 },
    { day: t("dashboard.days.fri"), searches: 5, contacts: 2 },
    { day: t("dashboard.days.sat"), searches: 1, contacts: 0 },
    { day: t("dashboard.days.sun"), searches: 2, contacts: 1 },
  ];

  const funnelData = [
    { name: t("dashboard.stats.searches"), value: hireTracking.searches || 100, fill: '#6366f1' },
    { name: t("dashboard.stats.contacted"), value: hireTracking.contacted || 45, fill: '#8b5cf6' },
    { name: t("dashboard.stats.interviews"), value: hireTracking.interviews || 15, fill: '#a855f7' },
    { name: t("dashboard.stats.hires"), value: hireTracking.hires || 3, fill: '#22c55e' },
  ];

  const usagePercent = useMemo(() => {
    if (!plan || !usage) return 0;
    if (plan.credits === 'unlimited') return 0;
    return Math.round((usage.searches / plan.credits) * 100);
  }, [plan, usage]);

  return (
    <div className="page-container">
      <div className="page-content max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary">{t("breadcrumbs.dashboard")}</Badge>
            <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/criteria">
              <Button variant="outline">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {t("dashboard.actions.criteriaBuilder")}
              </Button>
            </Link>
            <Link href="/search">
              <Button>
                <Search className="w-4 h-4 mr-2" />
                {t("dashboard.actions.newSearch")}
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                {t("dashboard.actions.upgrade")}
              </Button>
            </Link>
          </div>
        </div>

        {!hasActivity && (
          <Card className="mb-8 border-dashed">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{t("dashboard.empty.title")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("dashboard.empty.description")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/search">
                    <Button>
                      <Search className="w-4 h-4 mr-2" />
                      {t("dashboard.empty.runFirstSearch")}
                    </Button>
                  </Link>
                  <Link href="/pipeline">
                    <Button variant="outline">{t("dashboard.empty.openPipeline")}</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Status */}
        {plan && (
          <Card className="mb-8">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{plan.name} Plan</h3>
                      <Badge variant="outline">
                        {plan.period === 'annual' ? t("dashboard.annual") : t("dashboard.creditPackage")}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {remaining?.searches === 'unlimited'
                        ? t("dashboard.unlimitedSearches")
                        : `${remaining?.searches || 0} ${t("dashboard.searchesRemainingThisMonth")}`}
                    </p>
                  </div>
                </div>
                {plan.credits !== 'unlimited' && (
                  <div className="w-48">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t("dashboard.usage")}</span>
                      <span>{usage?.searches || 0} / {plan.credits}</span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.searches")}</p>
                    <p className="text-3xl font-bold">{hireTracking.searches}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.contacted")}</p>
                    <p className="text-3xl font-bold">{hireTracking.contacted}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.interviews")}</p>
                    <p className="text-3xl font-bold">{hireTracking.interviews}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.stats.hires")}</p>
                    <p className="text-3xl font-bold text-green-500">{hireTracking.hires}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("dashboard.weeklyActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="searches" fill="#6366f1" radius={[4, 4, 0, 0]} name={t("dashboard.stats.searches")} />
                    <Bar dataKey="contacts" fill="#22c55e" radius={[4, 4, 0, 0]} name={t("dashboard.stats.contacted")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t("dashboard.conversionFunnel")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Analytics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t("dashboard.costAnalytics")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.costAnalyticsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">{t("dashboard.costPerSearch")}</p>
                <p className="text-2xl font-bold">${analytics.costPerSearch.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">{t("dashboard.costPerContact")}</p>
                <p className="text-2xl font-bold">${analytics.costPerContact.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">{t("dashboard.costPerInterview")}</p>
                <p className="text-2xl font-bold">${analytics.costPerInterview.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <p className="text-sm text-muted-foreground mb-1">{t("dashboard.costPerHire")}</p>
                <p className="text-2xl font-bold text-green-500">
                  ${analytics.costPerHire.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">{t("dashboard.conversionRates")}</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("dashboard.searchToContact")}</span>
                    <span>{analytics.conversionRates.searchToContact.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.conversionRates.searchToContact} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("dashboard.contactToInterview")}</span>
                    <span>{analytics.conversionRates.contactToInterview.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.conversionRates.contactToInterview} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("dashboard.interviewToHire")}</span>
                    <span>{analytics.conversionRates.interviewToHire.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.conversionRates.interviewToHire} className="h-2" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.totalSpent")}</p>
                <p className="text-3xl font-bold">${hireTracking.totalSpent.toFixed(2)}</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                {hireTracking.hires > 0 ? `${hireTracking.hires} ${t("dashboard.successfulHires")}` : t("dashboard.noHiresYet")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/pipeline">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="py-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("dashboard.quickActions.viewCandidates")}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.quickActions.manageCandidates")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/search">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="py-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("dashboard.quickActions.newSearch")}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.quickActions.findCandidates")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/intake">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="py-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("dashboard.quickActions.updateJobContext")}</p>
                  <p className="text-sm text-muted-foreground">{t("dashboard.quickActions.refineCriteria")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

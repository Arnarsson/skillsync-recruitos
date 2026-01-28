"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Brain, Globe, Sparkles, Check, AlertCircle, Search, Microscope, Mail, Zap } from "lucide-react";
import { useLanguage, useTranslatedArray } from "@/lib/i18n";
import { HowItWorksSection } from "@/components/HowItWorksSection";

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useLanguage();
  const quickSearches = useTranslatedArray("home.quickSearches");

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickSearch = (q: string) => {
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-0">
      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-3 gap-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    i < 3 || i === 4 ? "bg-foreground" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Free Credits Banner */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Start gratis med 5 dybdeprofil-kreditter</span>
          </div>

          {/* Headline */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground mb-3 font-medium tracking-tight">
            {t("home.headline")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-8 sm:mb-10">
            {t("home.subheadline")}
          </p>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative bg-card border border-border rounded-lg overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t("home.searchPlaceholder")}
                className="w-full bg-transparent px-4 py-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={!query.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">{t("home.enter")}</span>{" "}
                {t("home.lang") === "da" ? "for at søge" : "to search"},{" "}
                <span className="text-primary">{t("home.shiftEnter")}</span>{" "}
                {t("home.lang") === "da" ? "for ny linje" : "for new line"}
              </p>
              <Link
                href="/login?demo=true"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {t("home.lang") === "da" ? "Prøv Demo" : "Try Demo"}
              </Link>
            </div>
          </div>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {quickSearches.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickSearch(q)}
                className="px-3 py-1.5 text-sm rounded-md border border-border hover:border-primary/50 hover:text-primary transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                titleKey: "home.features.searchByCapabilities.title",
                descKey: "home.features.searchByCapabilities.description",
              },
              {
                icon: Sparkles,
                titleKey: "home.features.discoverExperts.title",
                descKey: "home.features.discoverExperts.description",
              },
              {
                icon: Brain,
                titleKey: "home.features.hireFaster.title",
                descKey: "home.features.hireFaster.description",
              },
            ].map((feature) => (
              <div
                key={feature.titleKey}
                className="p-6 rounded-lg border border-border bg-card"
              >
                <feature.icon className="w-5 h-5 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2 lowercase">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground lowercase">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSection />

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-light mb-2 text-center lowercase">
            {t("home.pricing.title")}
          </h2>
          <p className="text-muted-foreground text-center mb-10 lowercase">
            {t("home.pricing.subtitle")}
          </p>

          {/* Stage-Gated Credits */}
          <div className="p-6 sm:p-8 rounded-lg border border-border bg-card mb-8">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-6 text-center">
              {t("home.pricing.stageGated.title")}
            </h3>

            {/* Three Stages */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {/* Stage 1: Search */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {t("home.pricing.stageGated.stages.search.title")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t("home.pricing.stageGated.stages.search.desc")}
                </p>
                <p className="text-xs font-medium text-primary">
                  {t("home.pricing.stageGated.stages.search.credits")}
                </p>
              </div>

              {/* Stage 2: Deep Profile */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Microscope className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {t("home.pricing.stageGated.stages.deepDive.title")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t("home.pricing.stageGated.stages.deepDive.desc")}
                </p>
                <p className="text-xs font-medium text-primary">
                  {t("home.pricing.stageGated.stages.deepDive.credits")}
                </p>
              </div>

              {/* Stage 3: Outreach */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {t("home.pricing.stageGated.stages.outreach.title")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t("home.pricing.stageGated.stages.outreach.desc")}
                </p>
                <p className="text-xs font-medium text-primary">
                  {t("home.pricing.stageGated.stages.outreach.credits")}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center mb-6">
              {t("home.pricing.stageGated.description")}
            </p>

            <div className="text-center">
              <p className="text-sm text-primary mb-4">
                {t("home.pricing.startFree")}
              </p>
              <Link
                href="/intake"
                className="inline-block w-full sm:w-auto px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm transition-colors"
              >
                {t("home.pricing.tryFreeSearch")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Data Transparency */}
      <section className="py-16 sm:py-20 px-4 border-t border-border bg-muted/20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-light mb-4 text-center lowercase">
            {t("home.dataTransparency.title")}
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            {t("home.dataTransparency.description")}
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* What We Analyze */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t("home.dataTransparency.sources.title")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Open source contributions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Repository activity patterns
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Code quality signals
                </li>
              </ul>
            </div>

            {/* Limitations */}
            <div className="p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                {t("home.dataTransparency.limitations.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("home.dataTransparency.limitations.note")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

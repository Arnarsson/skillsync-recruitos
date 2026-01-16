"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Terminal, Wand2, Zap, Brain, Globe, Sparkles } from "lucide-react";
import { useLanguage, useTranslatedArray } from "@/lib/i18n";

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
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-primary">{t("home.enter")}</span>{" "}
              {t("home.lang") === "da" ? "for at søge" : "to search"},{" "}
              <span className="text-primary">{t("home.shiftEnter")}</span>{" "}
              {t("home.lang") === "da" ? "for ny linje" : "for new line"}
            </p>
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

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light mb-10 text-center">
            {t("home.pricing.title")}
          </h2>

          {/* Candidate on Demand */}
          <div className="p-8 rounded-lg border border-border bg-card text-center">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
              {t("home.pricing.candidateOnDemand")}
            </h3>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-5xl font-light">$15</span>
              <span className="text-muted-foreground">
                {t("home.pricing.perSearch")}
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              {t("home.pricing.includesDeepSearch")}
            </p>
            <ul className="space-y-3 text-sm mb-8 text-left max-w-xs mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>{" "}
                {t("home.pricing.features.fullSearch")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>{" "}
                {t("home.pricing.features.deepProfile")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>{" "}
                {t("home.pricing.features.skillBreakdown")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>{" "}
                {t("home.pricing.features.noSubscription")}
              </li>
            </ul>
            <p className="text-sm text-primary mb-4">
              {t("home.pricing.startFree")}
            </p>
            <Link
              href="/search"
              className="inline-block w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm transition-colors"
            >
              {t("home.pricing.tryFreeSearch")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

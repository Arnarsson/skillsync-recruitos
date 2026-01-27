"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Terminal, Wand2, Zap } from "lucide-react";

const quickSearches = [
  "Kernel-modul udviklere",
  "Binær instrumenteringseksperter",
  "Signalbehandlingsforskere",
  "Database query optimizer eksperter",
  "Virtuel maskine implementører",
];

// Product and Offer schema for SEO/GEO
const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RecruitOS",
  applicationCategory: "BusinessApplication",
  description: "Technical recruiting platform that finds and evaluates engineering candidates based on their GitHub contributions and code quality",
  offers: [
    {
      "@type": "Offer",
      name: "Pro Plan",
      price: "499",
      priceCurrency: "USD",
      billingDuration: "P1M",
      description: "15 searches per month, 10 deep profile credits, phone and chat support",
    },
    {
      "@type": "Offer",
      name: "Enterprise Plan",
      priceSpecification: {
        "@type": "PriceSpecification",
        price: "0",
        priceCurrency: "USD",
        description: "Custom pricing",
      },
      description: "Custom pricing with unlimited searches, MCP server, dedicated account manager, and priority support",
    },
  ],
  operatingSystem: "Web",
  softwareVersion: "1.0",
  url: "https://recruitos.dev",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickSearch = (q: string) => {
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {/* JSON-LD Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm mb-8">
            <span className="text-muted-foreground">støttet af</span>
            <span className="text-orange-500 font-medium">Y Combinator</span>
          </div>

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
          <h1 className="text-xl md:text-2xl text-muted-foreground mb-10 font-normal">
            Find ingeniører og forskere der former dit felt
          </h1>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative bg-card border border-border rounded-lg overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Hvem leder du efter?"
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
              <span className="text-primary">enter</span> for at søge,{" "}
              <span className="text-primary">shift + enter</span> for ny linje
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
                icon: Terminal,
                title: "søg efter kompetencer",
                description:
                  "recruitos analyserer ekspertise demonstreret gennem open source arbejde",
              },
              {
                icon: Wand2,
                title: "opdag skjulte eksperter",
                description:
                  "find elite men oversete ingeniører fra hele verden",
              },
              {
                icon: Zap,
                title: "ansæt hurtigere",
                description:
                  "se reelt arbejde, kvalificer ingeniører hurtigere",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg border border-border bg-card"
              >
                <feature.icon className="w-5 h-5 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2 lowercase">{feature.title}</h3>
                <p className="text-sm text-muted-foreground lowercase">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Build in Public */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-light">#bygioffentlighed</h2>
            </div>
            <div className="space-y-6 text-muted-foreground text-sm leading-relaxed lowercase">
              <p>
                open source software driver internettet. men byggerne der får
                det til at ske forbliver ofte usynlige. traditionelle metrikker
                reducerer ingeniører til tal, commits, prs, kodelinjer. men det
                tegner ikke det{" "}
                <span className="underline">hele</span> billede.
              </p>
            </div>
            <div className="space-y-6 text-muted-foreground text-sm leading-relaxed lowercase">
              <p>
                recruitos afdækker hvad der er unikt ved hver skaber: hvordan de
                løser problemer, og anvender domæneekspertise hvor det betyder
                noget. ingen formularer. ingen spørgeskemaer. kun signal fra
                reelt arbejde.
              </p>
            </div>
          </div>

          {/* Profile Explorer */}
          <div className="mt-12">
            <p className="text-sm text-muted-foreground mb-3 lowercase">
              udforsk individuelle udvikler profiler
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-sm text-muted-foreground">
                https://<span className="text-primary">recruit</span>os.dev/github_brugernavn
              </div>
              <Link
                href="/search"
                className="px-4 py-3 rounded-lg border border-border hover:border-primary/50 text-sm transition-colors"
              >
                prøv nu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-10">
            <h2 className="text-3xl md:text-4xl font-light">priser</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm rounded bg-primary/20 text-primary">
                Månedlig
              </button>
              <button className="px-3 py-1 text-sm rounded text-muted-foreground hover:text-foreground transition-colors">
                Årlig (-20% RABAT)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Pro */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  PRO
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light">$499</span>
                  <span className="text-sm text-muted-foreground">
                    per måned/per bruger
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  til rekrutterere og små teams.
                </p>
              </div>

              <ul className="space-y-2 text-sm mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 15 søgninger per måned
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 10 dybdeprofil kreditter per måned
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> telefon og chat support
                </li>
              </ul>

              <p className="text-sm text-primary mb-3">start med 1 gratis søgning</p>
              <button className="w-full py-3 rounded-lg border border-border hover:border-primary/50 text-sm transition-colors">
                kom i gang
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  ENTERPRISE
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light">tilpasset</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  til bureauer og store virksomheder.
                </p>
              </div>

              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                ALT I PRO, OG:
              </p>
              <ul className="space-y-2 text-sm mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> mcp server til brugerdefinerede workflows
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> dedikeret account manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> interne app integrationer
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> prioriteret support (email, chat, slack)
                </li>
              </ul>

              <button className="w-full py-3 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors">
                anmod om demo
              </button>
            </div>
          </div>

          {/* Deep Profile Credits */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  DYBDEPROFIL KREDITTER
                </h3>
                <p className="text-sm text-muted-foreground mb-2 max-w-lg">
                  søgninger viser basisprofiler. brug en kredit til at låse op for fuld
                  kompetenceoversigt, projekthistorik og teknisk dybdeanalyse for kandidater
                  du vil evaluere seriøst.
                </p>
                <p className="text-sm">
                  <span className="font-medium">$5</span>{" "}
                  <span className="text-muted-foreground">per kredit</span>
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg border border-border hover:border-primary/50 text-sm transition-colors">
                køb kreditter
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

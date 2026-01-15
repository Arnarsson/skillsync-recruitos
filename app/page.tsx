"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Terminal, Wand2, Zap } from "lucide-react";

const quickSearches = [
  "Kernel module developers",
  "Binary instrumentation experts",
  "Signal processing researchers",
  "Database query optimizer experts",
  "Virtual machine implementors",
];

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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm mb-8">
            <span className="text-muted-foreground">backed by</span>
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
            Find engineers and scientists shaping your domain
          </h1>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative bg-card border border-border rounded-lg overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Who are you looking for?"
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
              <span className="text-primary">enter</span> to search,{" "}
              <span className="text-primary">shift + enter</span> for new line
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
                title: "search by capabilities",
                description:
                  "recruitos analyzes expertise demonstrated by open source work",
              },
              {
                icon: Wand2,
                title: "discover hidden experts",
                description:
                  "find elite but overlooked engineers from around the world",
              },
              {
                icon: Zap,
                title: "hire faster",
                description:
                  "see real work, qualify engineers faster",
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
              <h2 className="text-3xl md:text-4xl font-light">#buildinpublic</h2>
            </div>
            <div className="space-y-6 text-muted-foreground text-sm leading-relaxed lowercase">
              <p>
                open source software powers the internet. but the builders that
                make it happen often remain invisible. traditional metrics
                reduce engineers to numbers, commits, prs, lines of code. but
                that does not paint the{" "}
                <span className="underline">whole</span> picture.
              </p>
            </div>
            <div className="space-y-6 text-muted-foreground text-sm leading-relaxed lowercase">
              <p>
                recruitos uncovers what&apos;s unique about each creator: how they
                solve problems, and apply domain expertise where it matters. no
                forms. no surveys. just signal drawn from real work.
              </p>
            </div>
          </div>

          {/* Profile Explorer */}
          <div className="mt-12">
            <p className="text-sm text-muted-foreground mb-3 lowercase">
              explore individual developer profiles
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-sm text-muted-foreground">
                https://<span className="text-primary">recruit</span>os.dev/github_username
              </div>
              <Link
                href="/search"
                className="px-4 py-3 rounded-lg border border-border hover:border-primary/50 text-sm transition-colors"
              >
                try now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-10">
            <h2 className="text-3xl md:text-4xl font-light">pricing</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm rounded bg-primary/20 text-primary">
                Monthly
              </button>
              <button className="px-3 py-1 text-sm rounded text-muted-foreground hover:text-foreground transition-colors">
                Yearly (-20% OFF)
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
                    per month/per seat
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  for recruiters and small teams.
                </p>
              </div>

              <ul className="space-y-2 text-sm mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 15 searches per month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> 10 deep profile credits per month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> phone and chat support
                </li>
              </ul>

              <p className="text-sm text-primary mb-3">start with 1 free search</p>
              <button className="w-full py-3 rounded-lg border border-border hover:border-primary/50 text-sm transition-colors">
                get started
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  ENTERPRISE
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light">custom</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  for agencies and large companies.
                </p>
              </div>

              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                EVERYTHING IN PRO, AND:
              </p>
              <ul className="space-y-2 text-sm mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> mcp server for custom workflows
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> dedicated account manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> internal app integrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span> priority support (email, chat, slack)
                </li>
              </ul>

              <button className="w-full py-3 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors">
                request demo
              </button>
            </div>
          </div>

          {/* Deep Profile Credits */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  DEEP PROFILE CREDITS
                </h3>
                <p className="text-sm text-muted-foreground mb-2 max-w-lg">
                  searches show you basic profiles. use a credit to unlock full skill breakdowns,
                  project history, and technical depth analysis for candidates you want to
                  seriously evaluate.
                </p>
                <p className="text-sm">
                  <span className="font-medium">$5</span>{" "}
                  <span className="text-muted-foreground">per credit</span>
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg border border-border hover:border-primary/50 text-sm transition-colors">
                buy credits
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

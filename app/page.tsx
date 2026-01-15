"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  GitPullRequest,
  MessageSquare,
  Code2,
  Star,
  GitBranch,
  Users,
  Zap,
  CheckCircle,
} from "lucide-react";

const tryTheseQueries = [
  "React state management experts",
  "Rust async runtime contributors",
  "TypeScript library maintainers",
  "ML/LLM tooling engineers",
];

const mockResults = [
  {
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "",
    role: "Core contributor @ zustand",
    match: 94,
    signals: ["847 PRs merged", "Core maintainer", "12k+ stars"],
    skills: ["TypeScript", "React", "State Management"],
  },
  {
    name: "Marcus Rivera",
    username: "mrivera",
    avatar: "",
    role: "Rust async ecosystem",
    match: 91,
    signals: ["tokio contributor", "360 code reviews", "RFC author"],
    skills: ["Rust", "Async", "Systems"],
  },
  {
    name: "Aisha Patel",
    username: "aishap",
    avatar: "",
    role: "ML Infrastructure @ Hugging Face",
    match: 88,
    signals: ["transformers maintainer", "220 issues closed", "Docs lead"],
    skills: ["Python", "PyTorch", "MLOps"],
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Show preview after a brief delay
    const timer = setTimeout(() => setShowPreview(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleTryQuery = (q: string) => {
    setQuery(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-28 pb-8 px-4">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-32 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute top-48 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-[1.1] tracking-tight">
              Find{" "}
              <span className="text-primary">overlooked</span>{" "}
              engineers with proven GitHub impact
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Search by capabilities. We analyze PRs, code reviews, issues, and releases — not resumes.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-xl opacity-50" />

              <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-3 p-4">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Describe the engineer you need..."
                    className="flex-1 bg-transparent text-lg placeholder:text-muted-foreground focus:outline-none"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    size="lg"
                    className="px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    Search
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Example hint */}
            <p className="text-center text-sm text-muted-foreground mt-3">
              Example: &ldquo;React experts who contributed to state management libraries&rdquo;
            </p>
          </motion.div>

          {/* Try These Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            <span className="text-sm text-muted-foreground mr-1">Try:</span>
            {tryTheseQueries.map((q) => (
              <button
                key={q}
                onClick={() => handleTryQuery(q)}
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {q}
              </button>
            ))}
          </motion.div>

          {/* Results Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showPreview ? 1 : 0, y: showPreview ? 0 : 20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="text-center mb-4">
              <Badge variant="outline" className="text-xs">
                Preview: What you&apos;ll discover
              </Badge>
            </div>

            <div className="grid gap-3">
              {mockResults.map((result, i) => (
                <motion.div
                  key={result.username}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Card className="p-4 hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                        <AvatarImage src={result.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {result.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold group-hover:text-primary transition-colors">
                            {result.name}
                          </span>
                          <Badge className="bg-primary/20 text-primary border-0 text-xs">
                            {result.match}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.role}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.signals.map((signal) => (
                            <span
                              key={signal}
                              className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="hidden sm:flex gap-1.5">
                        {result.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* CTA under preview */}
            <div className="text-center mt-6">
              <Button variant="outline" size="lg" asChild className="group">
                <Link href="/search">
                  Explore all engineers
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Row */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8">
            {[
              { value: "10M+", label: "Profiles indexed", icon: Users },
              { value: "500K+", label: "Repos analyzed", icon: GitBranch },
              { value: "98%", label: "Precision rate", icon: CheckCircle },
              { value: "< 2hrs", label: "Time to shortlist", icon: Zap },
            ].map((stat) => (
              <div key={stat.label} className="group">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4 text-primary" />
                  <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* What we analyze */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Pull requests", icon: GitPullRequest },
              { label: "Code reviews", icon: MessageSquare },
              { label: "Commits & releases", icon: Code2 },
              { label: "Stars & forks", icon: Star },
            ].map((item) => (
              <Badge
                key={item.label}
                variant="outline"
                className="px-3 py-1.5 gap-1.5 text-sm"
              >
                <item.icon className="w-3.5 h-3.5 text-primary" />
                {item.label}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - simplified */}
      <section className="py-16 px-4 border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Search by capability",
                description: "Describe the skills and experience you need. Our AI understands context.",
              },
              {
                step: "2",
                title: "Review scored matches",
                description: "See candidates ranked by real GitHub signals: PRs, reviews, impact.",
              },
              {
                step: "3",
                title: "Reach out with context",
                description: "Generate personalized messages based on their work and interests.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to find your next great hire?
          </h2>
          <p className="text-muted-foreground mb-8">
            No credit card required. Start searching in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/intake">Set up job intake</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

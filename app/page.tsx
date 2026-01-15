"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import BuildInPublicSection from "@/components/BuildInPublicSection";
import PricingSection from "@/components/PricingSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Search,
  Code2,
  MessageSquare,
  ArrowRight,
  Sparkles,
  GitBranch,
  Star,
  Users,
  Zap,
  Brain,
  Target,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="max-w-5xl mx-auto text-center relative z-10"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-primary/30 bg-primary/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
              AI-Powered Recruiting
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
          >
            Find elite{" "}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-500">
                (but overlooked!)
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 200 8"
                fill="none"
              >
                <path
                  d="M1 5.5C47.6667 2.16667 141 -1.8 199 5.5"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="hsl(var(--primary))" />
                    <stop offset="0.5" stopColor="#a855f7" />
                    <stop offset="1" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
            </span>{" "}
            <br className="hidden md:block" />
            engineers on GitHub
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The first hiring platform that analyzes candidates&apos; expertise through
            their{" "}
            <span className="text-foreground font-medium">actual code</span>.
            Find the engineers shaping your domain.
          </motion.p>

          {/* Search Bar */}
          <motion.div variants={fadeInUp} className="mb-8">
            <SearchBar />
          </motion.div>

          {/* Status indicators */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              </div>
              <span>Real-time GitHub analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-primary rounded-full animate-ping" />
              </div>
              <span>Psychometric profiling</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
              </div>
              <span>AI-powered scoring</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-border bg-card/30">
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10M+", label: "Engineers indexed", icon: Users },
              { value: "500K+", label: "Repos analyzed", icon: GitBranch },
              { value: "98%", label: "Accuracy rate", icon: Target },
              { value: "2hrs", label: "Avg. time to hire", icon: Zap },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              How it works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              From search to hire in{" "}
              <span className="text-primary">4 steps</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Stop relying on resumes and job titles. Find engineers by the code
              they write.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Job Intake",
                description:
                  "Paste a job URL or description. AI extracts skills and requirements.",
                icon: Search,
                color: "from-blue-500 to-cyan-500",
              },
              {
                step: "2",
                title: "Find Talent",
                description:
                  "Search GitHub by capabilities. Get scored candidates instantly.",
                icon: Code2,
                color: "from-green-500 to-emerald-500",
              },
              {
                step: "3",
                title: "Deep Profile",
                description:
                  "AI analyzes work style, psychometrics, and cultural fit.",
                icon: Brain,
                color: "from-purple-500 to-pink-500",
              },
              {
                step: "4",
                title: "Outreach",
                description:
                  "Generate personalized messages tailored to each candidate.",
                icon: MessageSquare,
                color: "from-orange-500 to-yellow-500",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-card hover:bg-card/80 border-border hover:border-primary/30 transition-all group relative overflow-hidden">
                  {/* Gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />

                  <CardContent className="pt-6 relative">
                    {/* Step number */}
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r ${item.color}`}
                      >
                        Step {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA button */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button size="lg" asChild className="group">
              <Link href="/intake">
                Start Your First Search
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {/* Left side - Feature list */}
            <div>
              <Badge variant="outline" className="mb-4">
                Why SkillSync
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                Hiring based on{" "}
                <span className="text-primary">real work</span>, not resumes
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Traditional recruiting fails to capture what makes engineers
                great. We analyze actual contributions to show you who can
                really do the job.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Repository Analysis",
                    description:
                      "We scan code quality, commit patterns, and project impact",
                  },
                  {
                    title: "Psychometric Profiling",
                    description:
                      "Understand work style, communication, and team fit",
                  },
                  {
                    title: "Smart Matching",
                    description:
                      "AI-powered scoring based on your specific requirements",
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right side - Visual */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xl">
                {/* Mock profile card */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Sarah Chen</span>
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                        94% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Principal Engineer at Scale
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        TypeScript
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Rust
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Systems
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Repos", value: "47" },
                    { label: "Stars", value: "12.4k" },
                    { label: "Commits", value: "2,340" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="text-center p-3 rounded-lg bg-muted/50"
                    >
                      <div className="font-bold text-lg">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Archetype badge */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">
                      Archetype: The Architect
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Systems thinker who designs elegant, scalable solutions
                  </p>
                </div>

                {/* Floating badges */}
                <motion.div
                  className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Star className="w-3 h-3 inline mr-1" />
                  Top Contributor
                </motion.div>
              </div>

              {/* Background glow */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl rounded-full scale-150 opacity-50" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Build in Public */}
      <BuildInPublicSection />

      {/* Pricing */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-24 px-4 border-t border-border relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />

        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-6">
            Get Started
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
            Ready to find your next{" "}
            <span className="text-primary">great hire</span>?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join hundreds of companies already using SkillSync to build
            world-class teams. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="group">
              <Link href="/signup">
                Get Started Free
                <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="https://cal.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Demo
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

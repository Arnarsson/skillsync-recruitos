"use client";

import { useState } from "react";

const CURRENT_APIS = [
  { key: "BRIGHTDATA_API_KEY", name: "BrightData", purpose: "Web scraping & data collection", power: "high", icon: "🌐" },
  { key: "NEXTAUTH_SECRET", name: "NextAuth", purpose: "Authentication", power: "core", icon: "🔐" },
  { key: "GITHUB_CLIENT_ID", name: "GitHub OAuth", purpose: "User login via GitHub", power: "core", icon: "🔑" },
  { key: "GITHUB_CLIENT_SECRET", name: "GitHub OAuth", purpose: "OAuth flow", power: "core", icon: "🔑" },
  { key: "NEXTAUTH_URL", name: "NextAuth URL", purpose: "Auth callback config", power: "core", icon: "🔗" },
  { key: "GITHUB_TOKEN", name: "GitHub API", purpose: "Repo/user data access", power: "high", icon: "🐙" },
  { key: "OPENROUTER_API_KEY", name: "OpenRouter", purpose: "Multi-model AI (Claude, GPT, Gemini)", power: "high", icon: "🧠" },
  { key: "FIRECRAWL_API_KEY", name: "Firecrawl", purpose: "Web page crawling & extraction", power: "high", icon: "🔥" },
];

const EXISTING_INFRA = [
  "Next.js 16 on Vercel",
  "Prisma ORM + PostgreSQL",
  "Stripe integration",
  "Psychometric engine",
  "LinkedIn network maps",
  "GitHub search",
  "Framer Motion + Recharts",
  "Zod validation",
];

const FEATURES = [
  {
    id: "analyzer",
    name: "Deep Work Analyzer",
    icon: "🔬",
    description: "X-ray any candidate's real capabilities from their actual work output",
    uses: {
      existing: [
        { api: "GITHUB_TOKEN", usage: "Fetch repos, commits, PRs, code frequency, languages" },
        { api: "OPENROUTER_API_KEY", usage: "Analyze code quality, architecture patterns, complexity" },
        { api: "FIRECRAWL_API_KEY", usage: "Crawl deployed apps, portfolio sites, blog posts" },
        { api: "BRIGHTDATA_API_KEY", usage: "Scrape npm packages, Stack Overflow profiles, Kaggle" },
      ],
      missing: [
        {
          name: "DATABASE_URL (Supabase/Neon)",
          why: "Cache analysis results, store proof-of-work scores",
          priority: "P0",
          cost: "Free tier works",
          env: "SUPABASE_URL + SUPABASE_ANON_KEY",
        },
      ],
      verdict: "90% ready",
      verdictColor: "#10B981",
      note: "You already have everything needed. GitHub API + OpenRouter + Firecrawl is the exact combo. Just need to store results.",
    },
  },
  {
    id: "calibration",
    name: "Calibration AI",
    icon: "🧠",
    description: "Conversational AI that turns vague job descriptions into precision hiring specs",
    uses: {
      existing: [
        { api: "OPENROUTER_API_KEY", usage: "Conversational AI for intake dialogue + analysis" },
        { api: "BRIGHTDATA_API_KEY", usage: "Scrape salary data from job boards for benchmarks" },
      ],
      missing: [
        {
          name: "LINKEDIN_API or RAPIDAPI_KEY",
          why: "Market intelligence: how many candidates match, salary benchmarks, demand trends",
          priority: "P1",
          cost: "RapidAPI LinkedIn scraper ~$50/mo, or use BrightData LinkedIn dataset",
          env: "RAPIDAPI_KEY or reuse BRIGHTDATA",
        },
      ],
      verdict: "80% ready",
      verdictColor: "#10B981",
      note: "Core AI is covered by OpenRouter. Market intelligence can bootstrap from BrightData's LinkedIn dataset — you might not need a new API at all.",
    },
  },
  {
    id: "talent-graph",
    name: "Talent Graph",
    icon: "🗺️",
    description: "Map hidden connections between your network and any candidate",
    uses: {
      existing: [
        { api: "GITHUB_TOKEN", usage: "Collaboration graph — who committed to same repos" },
        { api: "BRIGHTDATA_API_KEY", usage: "LinkedIn profile scraping for connection data" },
        { api: "OPENROUTER_API_KEY", usage: "Infer relationships, generate intro suggestions" },
      ],
      missing: [
        {
          name: "LinkedIn Cookie/Session (via BrightData)",
          why: "Deep LinkedIn scraping for connections, mutual contacts, company alumni",
          priority: "P1",
          cost: "Covered by BrightData — use their LinkedIn dataset or SERP API",
          env: "No new key needed — configure BrightData LinkedIn collector",
        },
        {
          name: "Neo4j or Supabase graph extension",
          why: "Store and query relationship graphs efficiently (shortest path, mutual connections)",
          priority: "P2",
          cost: "Neo4j Aura Free tier or pg_graphql in Supabase",
          env: "NEO4J_URI + NEO4J_PASSWORD (if Neo4j route)",
        },
      ],
      verdict: "70% ready",
      verdictColor: "#F59E0B",
      note: "BrightData is the key unlock here — their LinkedIn dataset is exactly what you need. The graph DB is a nice-to-have; start with Prisma relations, optimize later.",
    },
  },
  {
    id: "battlecards",
    name: "Battle Cards 2.0",
    icon: "📊",
    description: "Interactive side-by-side candidate comparison with AI-generated insights",
    uses: {
      existing: [
        { api: "OPENROUTER_API_KEY", usage: "Generate comparison narratives, risk flags, recommendations" },
        { api: "GITHUB_TOKEN", usage: "Pull live stats for compared candidates" },
        { api: "FIRECRAWL_API_KEY", usage: "Fetch latest project data for comparison" },
      ],
      missing: [],
      verdict: "100% ready",
      verdictColor: "#10B981",
      note: "This is purely a UI/UX + AI prompt engineering challenge. Every API you need is already in place. Ship this first.",
    },
  },
  {
    id: "outreach",
    name: "Outreach Agent",
    icon: "🤖",
    description: "AI writes hyper-personalized outreach based on candidate's actual work",
    uses: {
      existing: [
        { api: "OPENROUTER_API_KEY", usage: "Generate personalized messages based on work analysis" },
        { api: "GITHUB_TOKEN", usage: "Read repos before writing outreach" },
        { api: "FIRECRAWL_API_KEY", usage: "Read their blog/portfolio for personalization hooks" },
      ],
      missing: [
        {
          name: "RESEND_API_KEY or SENDGRID_API_KEY",
          why: "Send emails programmatically with tracking (opens, clicks, replies)",
          priority: "P0",
          cost: "Resend: free for 3k emails/mo. SendGrid: free 100/day",
          env: "RESEND_API_KEY",
        },
        {
          name: "LINKEDIN_AUTOMATION (via BrightData or Phantombuster)",
          why: "Send LinkedIn connection requests and InMails programmatically",
          priority: "P2",
          cost: "Phantombuster $69/mo or build with BrightData browser",
          env: "PHANTOMBUSTER_API_KEY (optional)",
        },
      ],
      verdict: "75% ready",
      verdictColor: "#F59E0B",
      note: "AI generation is fully covered. The gap is delivery — you need an email sender. Resend is perfect (built by ex-SendGrid team, great DX, free tier). LinkedIn automation is Phase 2.",
    },
  },
  {
    id: "analytics",
    name: "Pipeline Analytics",
    icon: "📈",
    description: "Dashboard with hiring velocity, conversion rates, time-to-hire metrics",
    uses: {
      existing: [
        { api: "OPENROUTER_API_KEY", usage: "AI-generated insights on pipeline health" },
      ],
      missing: [
        {
          name: "POSTHOG_API_KEY or MIXPANEL_TOKEN",
          why: "Track user behavior, feature usage, conversion funnels",
          priority: "P1",
          cost: "PostHog: free for 1M events/mo",
          env: "NEXT_PUBLIC_POSTHOG_KEY + POSTHOG_HOST",
        },
      ],
      verdict: "85% ready",
      verdictColor: "#10B981",
      note: "Internal pipeline analytics is just Prisma queries + Recharts (both in place). PostHog is for product analytics — important but not blocking.",
    },
  },
];

const PRIORITY_ADDS = [
  {
    env: "SUPABASE_URL + SUPABASE_ANON_KEY",
    service: "Supabase",
    why: "Real-time updates, row-level security, and you already have @supabase/supabase-js in deps",
    cost: "Free (500MB DB, 50k monthly active users)",
    blocks: ["Deep Work Analyzer", "Talent Graph", "Pipeline"],
    priority: 1,
  },
  {
    env: "RESEND_API_KEY",
    service: "Resend",
    why: "Transactional email for outreach agent + notifications. Best DX in class.",
    cost: "Free (3,000 emails/mo), then $20/mo",
    blocks: ["Outreach Agent"],
    priority: 2,
  },
  {
    env: "NEXT_PUBLIC_POSTHOG_KEY",
    service: "PostHog",
    why: "Product analytics, feature flags, session replay. Essential for PLG.",
    cost: "Free (1M events/mo)",
    blocks: ["Pipeline Analytics", "Product-led growth"],
    priority: 3,
  },
  {
    env: "UPSTASH_REDIS_URL",
    service: "Upstash Redis",
    why: "Rate limiting API calls, caching GitHub/BrightData responses, job queues",
    cost: "Free (10k commands/day)",
    blocks: ["API rate limiting", "Cost control"],
    priority: 4,
  },
];

export default function GapAnalysis() {
  const [activeFeature, setActiveFeature] = useState("analyzer");
  const [showPriority, setShowPriority] = useState(false);

  const feature = FEATURES.find((f) => f.id === activeFeature);

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        background: "#08080A",
        color: "#E0E0E0",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1A1A1E", padding: "20px 28px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#FF4D00", marginBottom: "4px" }}>
          GAP ANALYSIS
        </div>
        <h1
          style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
            color: "#fff",
          }}
        >
          RecruitOS 10x — What&apos;s Missing?
        </h1>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>
          8 APIs configured · 6 features to ship · spoiler: you&apos;re closer than you think
        </div>
      </div>

      {/* Tab Toggle */}
      <div style={{ display: "flex", borderBottom: "1px solid #1A1A1E" }}>
        <button
          onClick={() => setShowPriority(false)}
          style={{
            flex: 1,
            padding: "12px",
            background: !showPriority ? "#111114" : "transparent",
            border: "none",
            borderBottom: !showPriority ? "2px solid #FF4D00" : "2px solid transparent",
            color: !showPriority ? "#fff" : "#555",
            fontFamily: "inherit",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Feature → API Mapping
        </button>
        <button
          onClick={() => setShowPriority(true)}
          style={{
            flex: 1,
            padding: "12px",
            background: showPriority ? "#111114" : "transparent",
            border: "none",
            borderBottom: showPriority ? "2px solid #FF4D00" : "2px solid transparent",
            color: showPriority ? "#fff" : "#555",
            fontFamily: "inherit",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Priority Add List
        </button>
      </div>

      {!showPriority ? (
        <div style={{ display: "flex", minHeight: "calc(100vh - 120px)" }}>
          {/* Feature Sidebar */}
          <div
            style={{
              width: "220px",
              borderRight: "1px solid #1A1A1E",
              flexShrink: 0,
              overflowY: "auto",
            }}
          >
            {/* Current APIs summary */}
            <div style={{ padding: "16px", borderBottom: "1px solid #1A1A1E" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "8px" }}>
                YOUR 8 APIs
              </div>
              {CURRENT_APIS.map((api) => (
                <div
                  key={api.key}
                  style={{
                    fontSize: "10px",
                    padding: "3px 0",
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    color: api.power === "high" ? "#10B981" : "#555",
                  }}
                >
                  <span>{api.icon}</span>
                  <span>{api.name}</span>
                </div>
              ))}
            </div>

            {/* Feature buttons */}
            <div style={{ padding: "8px" }}>
              <div
                style={{
                  fontSize: "9px",
                  color: "#555",
                  letterSpacing: "2px",
                  padding: "8px 8px 4px",
                }}
              >
                FEATURES
              </div>
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(f.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 10px",
                    background: activeFeature === f.id ? "#1A1A1E" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    color: activeFeature === f.id ? "#fff" : "#777",
                    fontFamily: "inherit",
                    fontSize: "11px",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    marginBottom: "2px",
                  }}
                >
                  <span>{f.icon}</span>
                  <span style={{ flex: 1 }}>{f.name}</span>
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: `${f.uses.verdictColor}15`,
                      color: f.uses.verdictColor,
                    }}
                  >
                    {f.uses.verdict}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Detail */}
          <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
            {feature && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "24px" }}>{feature.icon}</span>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#fff" }}>
                    {feature.name}
                  </h2>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "3px 10px",
                      borderRadius: "4px",
                      background: `${feature.uses.verdictColor}15`,
                      border: `1px solid ${feature.uses.verdictColor}33`,
                      color: feature.uses.verdictColor,
                      fontWeight: 600,
                    }}
                  >
                    {feature.uses.verdict}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "24px" }}>
                  {feature.description}
                </div>

                {/* Uses existing */}
                <div style={{ fontSize: "9px", color: "#10B981", letterSpacing: "2px", marginBottom: "8px" }}>
                  ✓ USES YOUR EXISTING APIs
                </div>
                {feature.uses.existing.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "10px 14px",
                      background: "#0D1F0D",
                      borderRadius: "6px",
                      marginBottom: "4px",
                      border: "1px solid #10B98115",
                      fontSize: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <code
                      style={{
                        color: "#10B981",
                        fontSize: "10px",
                        background: "#10B98110",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {e.api}
                    </code>
                    <span style={{ color: "#888" }}>{e.usage}</span>
                  </div>
                ))}

                {/* Missing */}
                {feature.uses.missing.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#F59E0B",
                        letterSpacing: "2px",
                        margin: "20px 0 8px",
                      }}
                    >
                      ○ NEEDS ADDING
                    </div>
                    {feature.uses.missing.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "14px 16px",
                          background: "#1A1508",
                          borderRadius: "6px",
                          marginBottom: "6px",
                          border: "1px solid #F59E0B15",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <code
                            style={{
                              color: "#F59E0B",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {m.env}
                          </code>
                          <span
                            style={{
                              fontSize: "9px",
                              padding: "2px 8px",
                              borderRadius: "3px",
                              background: m.priority === "P0" ? "#FF4D0020" : m.priority === "P1" ? "#F59E0B15" : "#555",
                              color: m.priority === "P0" ? "#FF4D00" : m.priority === "P1" ? "#F59E0B" : "#888",
                            }}
                          >
                            {m.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#B0B0B0", marginBottom: "4px" }}>
                          {m.why}
                        </div>
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          💰 {m.cost}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {feature.uses.missing.length === 0 && (
                  <div
                    style={{
                      margin: "20px 0 0",
                      padding: "14px 16px",
                      background: "#0D1F0D",
                      borderRadius: "6px",
                      border: "1px solid #10B98122",
                      fontSize: "12px",
                      color: "#10B981",
                      fontWeight: 600,
                    }}
                  >
                    ✓ No new APIs needed — ship it now
                  </div>
                )}

                {/* Verdict */}
                <div
                  style={{
                    marginTop: "20px",
                    padding: "14px 16px",
                    background: "#111114",
                    borderRadius: "6px",
                    border: "1px solid #1F1F23",
                    borderLeft: `3px solid ${feature.uses.verdictColor}`,
                  }}
                >
                  <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>
                    VERDICT
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccc", lineHeight: 1.6 }}>{feature.uses.note}</div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Priority Add List View */
        <div style={{ padding: "24px 28px", maxWidth: "800px" }}>
          <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "16px" }}>
            ADD THESE ENV VARS TO VERCEL (IN ORDER)
          </div>

          {PRIORITY_ADDS.map((p, i) => (
            <div
              key={i}
              style={{
                padding: "18px 20px",
                background: "#111114",
                borderRadius: "8px",
                border: "1px solid #1F1F23",
                marginBottom: "10px",
                position: "relative" as const,
              }}
            >
              <div
                style={{
                  position: "absolute" as const,
                  top: "18px",
                  right: "20px",
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#1A1A1E",
                }}
              >
                #{p.priority}
              </div>
              <code
                style={{
                  fontSize: "12px",
                  color: "#FF4D00",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {p.env}
              </code>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
                {p.service}
              </div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6, marginBottom: "8px" }}>
                {p.why}
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "11px" }}>
                <span style={{ color: "#10B981" }}>💰 {p.cost}</span>
                <span style={{ color: "#666" }}>
                  Unlocks: {p.blocks.join(", ")}
                </span>
              </div>
            </div>
          ))}

          {/* Total cost */}
          <div
            style={{
              marginTop: "24px",
              padding: "18px 20px",
              background: "linear-gradient(135deg, #1a0800, #0A0A0B)",
              borderRadius: "8px",
              border: "1px solid #FF4D0022",
            }}
          >
            <div style={{ fontSize: "9px", color: "#FF4D00", letterSpacing: "2px", marginBottom: "8px" }}>
              BOTTOM LINE
            </div>
            <div style={{ fontSize: "14px", color: "#fff", fontWeight: 600, marginBottom: "8px" }}>
              Total new cost: €0/mo to start (all free tiers)
            </div>
            <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.7 }}>
              You have 8 APIs that cover ~85% of the 10x vision. The 4 additions above are all free-tier services that fill the remaining gaps. The most impactful single addition is <span style={{ color: "#FF4D00" }}>Resend</span> — it turns your AI analysis into an active outreach machine. Second is <span style={{ color: "#FF4D00" }}>Supabase</span> for real-time + caching (you already have the client library in deps).
            </div>
          </div>

          {/* Existing infra */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>
              ALREADY IN YOUR STACK (NO NEW ENV VARS NEEDED)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {EXISTING_INFRA.map((item, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "11px",
                    padding: "5px 10px",
                    background: "#10B98110",
                    border: "1px solid #10B98120",
                    borderRadius: "4px",
                    color: "#10B981",
                  }}
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>

          {/* Quick action */}
          <div
            style={{
              marginTop: "24px",
              padding: "18px 20px",
              background: "#111114",
              borderRadius: "8px",
              border: "1px solid #1F1F23",
            }}
          >
            <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px", marginBottom: "8px" }}>
              SHIP ORDER (fastest to value)
            </div>
            <div style={{ fontSize: "13px", lineHeight: 2, color: "#B0B0B0" }}>
              <span style={{ color: "#10B981" }}>Week 1:</span> Battle Cards 2.0 <span style={{ color: "#333" }}>→ needs 0 new APIs</span>
              <br />
              <span style={{ color: "#10B981" }}>Week 2:</span> Deep Work Analyzer MVP <span style={{ color: "#333" }}>→ add Supabase for caching</span>
              <br />
              <span style={{ color: "#F59E0B" }}>Week 3:</span> Calibration AI upgrade <span style={{ color: "#333" }}>→ conversational UX rewrite</span>
              <br />
              <span style={{ color: "#F59E0B" }}>Week 4:</span> Outreach Agent <span style={{ color: "#333" }}>→ add Resend</span>
              <br />
              <span style={{ color: "#FF4D00" }}>Month 2:</span> Talent Graph <span style={{ color: "#333" }}>→ BrightData LinkedIn dataset</span>
              <br />
              <span style={{ color: "#FF4D00" }}>Month 2:</span> Analytics dashboard <span style={{ color: "#333" }}>→ add PostHog</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

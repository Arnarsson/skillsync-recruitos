# Developer Archetype Research

> Evidence-based developer archetypes grounded in observable GitHub patterns.

## Table of Contents

1. [Literature Review](#1-literature-review)
2. [Proposed Archetypes](#2-proposed-archetypes)
3. [GitHub Signal Mapping](#3-github-signal-mapping)
4. [Evidence-Linking System](#4-evidence-linking-system)
5. [Detection Algorithm](#5-detection-algorithm)
6. [Integration with RecruitOS](#6-integration-with-recruitos)

---

## 1. Literature Review

### 1.1 Academic Foundations

**Big Five / OCEAN Model in Software Engineering**

The Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) are the most widely accepted instrument for quantifying personality in SE research.

Key findings relevant to archetype design:
- **Calefato, Lanubile & Vasilescu (2019)** — Large-scale analysis of Apache ecosystem developers found **three common personality profile types**, characterized by Agreeableness and Neuroticism levels. Developers with different contribution levels showed distinct personality profiles. More *open* developers are more likely to become core contributors.
  - Source: *Information and Software Technology*, Vol. 114, pp. 1–20
- **Mukta (2025)** — Big5 traits predict programming language preferences and community behavior. High-openness developers lean toward mobile platforms; high-conscientiousness toward OOP languages. Both traits correlate with community reputation.
  - Source: *Software: Practice and Experience*, Wiley
- **Calefato et al. (2021)** — "Promises and Perils of Inferring Personality on GitHub" showed that text-based personality inference from commits/issues is feasible but imperfect.
  - Source: *ESEM 2021*, ACM

**Developer Role Mining**

- **Montandon & Valente (2021)** — "Mining the Technical Roles of GitHub Users" classified developers into 6 technical roles (backend, frontend, full-stack, mobile, devops, data science) from public profile features. Achieved precision=0.75, AUC=0.70. Programming languages were the most predictive features.
  - Source: *Information and Software Technology*, Elsevier
- **CodeCV (IEEE)** — Mined expertise from commit activities (languages, libraries, concepts) to build developer CVs from GitHub data.

### 1.2 Industry Frameworks

**Open Source Contributor Taxonomy (GitHub/Mozilla)**
- **Maintainers**: Drive vision, manage organizational aspects, feel responsibility for project direction
- **Contributors**: Anyone who contributes something back (code, docs, issues)
- **Casual Contributors**: ~50% of all GitHub contributors only contribute once, accounting for <2% of total commits (2016 study)
- **Community Members**: Users who don't directly contribute

**CodeProject Survey (2013)** — Developers self-identify as:
- Engineers/Scientists (analytical, systematic)
- Puzzle Solvers (problem-oriented)
- Craftsmen/Craftswomen (quality-focused)
- Artists (creative, aesthetic)

**DevPersonality.com** — Classifies developers by analyzing:
1. **Timing** (when they code — early bird vs. night owl)
2. **Commit Style** (message patterns, frequency)
3. **Tech Stack** (languages/frameworks)
4. **Frequency** (coding cadence)

Example types: "Midnight Cowboy", "Perfectionist Refactorer", "Weekend Warrior", "Rapid Prototyper"

### 1.3 Insights for RecruitOS

The literature converges on several principles:
1. **Archetypes should be multi-dimensional** — not just one metric, but patterns across behaviors
2. **Observable signals beat inferred personality** — commit patterns, PR behavior, repo structure are more reliable than psycholinguistic inference
3. **Archetypes are not exclusive** — developers exhibit multiple archetypes simultaneously (a Maintainer can also be a Pioneer)
4. **Evidence must be linkable** — every label needs a receipt (specific commit, PR, repo)

---

## 2. Proposed Archetypes

Based on the literature review and observable GitHub patterns, we propose **6 evidence-based archetypes**. Each developer gets a **primary archetype** (strongest signal) and up to 2 **secondary archetypes**.

### 2.1 The Architect

> Designs systems, creates foundational infrastructure, and structures codebases.

**Behavioral signature**: Creates well-organized repos with clear separation of concerns. High ratio of configuration/infrastructure files. Writes documentation and READMEs. Tends toward monorepos or well-structured multi-repo setups.

| Signal | Metric | Threshold |
|--------|--------|-----------|
| Repo structure depth | Avg directory nesting in owned repos | ≥ 3 levels |
| Config file ratio | % of commits touching config/CI/infra files | ≥ 20% |
| README quality | README length in owned repos (avg chars) | ≥ 1000 |
| Documentation commits | % commits with doc-related messages | ≥ 15% |
| Repo organization | Uses monorepo or well-namespaced repos | Boolean |

**Evidence receipts**:
- "Created 12 repos with avg 4-level directory structure" → links to repos
- "42% of commits touch CI/CD or config files" → links to commit list
- "Average README length: 2,400 chars across 8 repos" → links to READMEs

### 2.2 The Maintainer

> Sustains and improves existing projects over time. High-reliability, long-term commitment.

**Behavioral signature**: Consistent commit cadence over months/years. High ratio of contributions to existing repos vs. creating new ones. Active in PR reviews. Responds to issues. Low "repo abandonment" rate.

| Signal | Metric | Threshold |
|--------|--------|-----------|
| Contribution consistency | Weeks with commits in last year (out of 52) | ≥ 40 |
| Existing-repo ratio | % contributions to repos not created by user | ≥ 50% |
| PR review activity | Reviews authored in last 6 months | ≥ 10 |
| Issue response | Issues commented/closed in maintained repos | ≥ 5 |
| Repo longevity | Repos with commits spanning > 1 year | ≥ 3 |

**Evidence receipts**:
- "Committed in 47 of 52 weeks this year" → links to contribution graph
- "Reviewed 28 PRs across 4 repositories" → links to review activity
- "5 repos with continuous commits over 2+ years" → links to repos

### 2.3 The Pioneer

> Creates new things. High repo creation rate, early technology adoption, experimental.

**Behavioral signature**: Creates new repos frequently. Explores new languages/frameworks before they're mainstream. Repos may be smaller/experimental. High star counts on innovative projects.

| Signal | Metric | Threshold |
|--------|--------|-----------|
| Repo creation rate | New repos created in last 12 months | ≥ 6 |
| Language diversity | Distinct languages across repos | ≥ 5 |
| Early adoption | Uses languages/frameworks < 2 years old | ≥ 1 |
| Star accumulation | Total stars on owned repos | ≥ 50 |
| Forking behavior | Forks of trending/new repos | ≥ 3 in last 6mo |

**Evidence receipts**:
- "Created 9 new repos in last 12 months" → links to repos sorted by date
- "Uses 7 languages including Zig, Mojo (early adoption)" → links to repos
- "342 total stars across projects" → links to starred repos

### 2.4 The Collaborator

> Works well with others. High PR activity, code review engagement, team-oriented.

**Behavioral signature**: Opens PRs to other people's repos. Active reviewer. Participates in discussions. Contributes to popular open-source projects. High follower/following ratio suggesting community engagement.

| Signal | Metric | Threshold |
|--------|--------|-----------|
| PR contributions | PRs opened to external repos (last 12mo) | ≥ 5 |
| Review engagement | Reviews given on others' PRs | ≥ 15 |
| OSS contributions | Merged PRs to repos with 100+ stars | ≥ 3 |
| Community following | Followers count | ≥ 50 |
| Discussion activity | Issue/PR comments on external repos | ≥ 20 |

**Evidence receipts**:
- "Opened 12 PRs to 6 different external repos" → links to PRs
- "Contributed to react, next.js, and prisma (3 major OSS projects)" → links to merged PRs
- "168 followers, actively follows 89 developers" → links to profile

### 2.5 The Specialist

> Deep expertise in a narrow domain. Concentrated language/framework usage with depth.

**Behavioral signature**: Majority of code in 1-2 languages. Large, deep repos rather than many small ones. High commit counts per repo. Likely contributor to ecosystem tooling (libraries, plugins, CLIs) in their domain.

| Signal | Metric | Threshold |
|--------|--------|-----------|
| Language concentration | % of code in top language | ≥ 70% |
| Repo depth | Average commits per active repo | ≥ 100 |
| Ecosystem tooling | Owns libs/plugins/CLIs in primary language | ≥ 1 |
| Domain consistency | Top language same for 2+ years | Boolean |
| Package publishing | npm/PyPI/crates.io packages published | ≥ 1 |

**Evidence receipts**:
- "89% of code is TypeScript across 14 repos" → links to language stats
- "Average 234 commits per active repo" → links to repos
- "Published 3 npm packages in the React ecosystem" → links to packages

### 2.6 The Craftsperson

> Prioritizes code quality, testing, and maintainability. Clean code advocate.

**Behavioral signature**: High test-to-code ratio. CI/CD pipelines in repos. Consistent commit message formatting. Small, focused commits. Uses linters, formatters, type checking.

| Signal | Metric | Threshold |
|--------|--------|-----------|
| Test presence | % of owned repos with test directories | ≥ 60% |
| CI/CD adoption | % of repos with GitHub Actions/CI config | ≥ 50% |
| Commit granularity | Average files changed per commit | ≤ 5 |
| Commit message quality | % of commits following conventional format | ≥ 40% |
| Quality tooling | Repos with linter/formatter configs | ≥ 50% |

**Evidence receipts**:
- "8 of 12 repos have test directories with CI pipelines" → links to repos
- "Average 3.2 files changed per commit (focused commits)" → links to commit history
- "73% of commits follow conventional commit format" → links to commits

---

## 3. GitHub Signal Mapping

### 3.1 API Endpoints Required

| Data Need | GitHub API Endpoint | Rate Limit Impact |
|-----------|-------------------|-------------------|
| User profile | `GET /users/{username}` | 1 request |
| User repos | `GET /users/{username}/repos?per_page=100&sort=updated` | 1-3 requests |
| Repo details | `GET /repos/{owner}/{repo}` | 1 per repo |
| Repo languages | `GET /repos/{owner}/{repo}/languages` | 1 per repo |
| Repo contributors | `GET /repos/{owner}/{repo}/stats/contributors` | 1 per repo |
| Commit activity | `GET /repos/{owner}/{repo}/stats/commit_activity` | 1 per repo |
| Code frequency | `GET /repos/{owner}/{repo}/stats/code_frequency` | 1 per repo |
| Punch card | `GET /repos/{owner}/{repo}/stats/punch_card` | 1 per repo |
| User events | `GET /users/{username}/events/public` | 1-3 requests |
| Repo contents | `GET /repos/{owner}/{repo}/contents/{path}` | selective |
| PR reviews | `GET /repos/{owner}/{repo}/pulls?state=all` | per repo |
| Starred repos | `GET /users/{username}/starred` | 1-3 requests |

### 3.2 Derived Metrics

From the raw API data, we compute these derived metrics:

```typescript
interface ArchetypeSignals {
  // Timing patterns (from punch_card + events)
  commitTimeDistribution: { hour: number; count: number }[];
  weekdayVsWeekend: { weekday: number; weekend: number };

  // Creation patterns (from repos)
  repoCreationRate: number;        // repos created per year
  repoAbandonmentRate: number;     // % repos with no commits in 6+ months
  avgRepoAge: number;              // months
  avgCommitsPerRepo: number;

  // Language patterns (from repo languages)
  languageDiversity: number;       // count of distinct languages
  topLanguageConcentration: number; // % of bytes in top language
  languageHistory: { lang: string; firstSeen: string; lastSeen: string }[];

  // Collaboration patterns (from events + PRs)
  prContributionsExternal: number; // PRs to repos not owned by user
  reviewsGiven: number;
  issueActivity: number;           // issues opened + commented
  followerRatio: number;           // followers / following

  // Quality patterns (from repo contents + commits)
  testPresenceRate: number;        // % repos with tests
  ciPresenceRate: number;          // % repos with CI config
  avgFilesPerCommit: number;
  readmeAvgLength: number;

  // Consistency patterns (from commit_activity)
  activeWeeksLastYear: number;     // out of 52
  longestStreak: number;           // consecutive weeks
  contributionVariance: number;    // how even is the cadence
}
```

### 3.3 Signal Collection Strategy

To stay within GitHub API rate limits (5,000 req/hr authenticated):

1. **Tier 1 — Always Fetch** (3-5 requests): User profile, repos list, events
2. **Tier 2 — Top Repos** (5-15 requests): Languages + stats for top 5 repos by stars/recent activity
3. **Tier 3 — Deep Dive** (20-50 requests): Contents scan (test dirs, CI configs) for top repos, PR/review data

**Cache aggressively**: GitHub data changes slowly. Cache for 24-72 hours. Use ETags for conditional requests.

---

## 4. Evidence-Linking System

### 4.1 Design Principle

Every archetype label must be backed by **clickable evidence**. This serves two purposes:
1. **Recruiter trust**: "Why does it say Pioneer?" → click → see the actual repos
2. **EU AI Act compliance**: Profiling decisions must be explainable and auditable

### 4.2 Evidence Schema

```typescript
interface ArchetypeEvidence {
  archetype: ArchetypeName;
  score: number;           // 0-100 confidence
  rank: 'primary' | 'secondary' | 'tertiary';

  // Human-readable summary
  headline: string;        // e.g., "Creates 8+ new projects per year"
  description: string;     // 2-3 sentence explanation

  // Linked receipts
  receipts: Receipt[];
}

interface Receipt {
  type: 'repo' | 'commit' | 'pr' | 'review' | 'profile' | 'stats';
  label: string;           // "Created 9 repos in 2025"
  url: string;             // https://github.com/user/repo
  metric: string;          // "repo_creation_rate"
  value: number | string;  // 9
  context?: string;        // "Including 3 using Rust (early adoption)"
}
```

### 4.3 Evidence Examples

**The Pioneer — evidence receipt set:**
```json
{
  "archetype": "pioneer",
  "score": 82,
  "rank": "primary",
  "headline": "Creates new projects frequently with diverse technologies",
  "description": "Created 9 new repositories in the last 12 months across 7 languages, including early adoption of Bun and Deno 2. Accumulated 342 stars.",
  "receipts": [
    {
      "type": "stats",
      "label": "9 new repos in last 12 months",
      "url": "https://github.com/user?tab=repositories&sort=created",
      "metric": "repo_creation_rate",
      "value": 9
    },
    {
      "type": "repo",
      "label": "Early adoption: bun-api-starter (Bun runtime)",
      "url": "https://github.com/user/bun-api-starter",
      "metric": "early_adoption",
      "value": "bun",
      "context": "Created when Bun was < 6 months old"
    },
    {
      "type": "profile",
      "label": "342 total stars across repos",
      "url": "https://github.com/user?tab=repositories&sort=stargazers",
      "metric": "total_stars",
      "value": 342
    }
  ]
}
```

---

## 5. Detection Algorithm

### 5.1 Scoring Model

Each archetype has a **weighted scoring function** based on its signals:

```typescript
type ArchetypeName =
  | 'architect'
  | 'maintainer'
  | 'pioneer'
  | 'collaborator'
  | 'specialist'
  | 'craftsperson';

interface ArchetypeDefinition {
  name: ArchetypeName;
  label: string;
  emoji: string;
  description: string;
  signals: SignalDefinition[];
}

interface SignalDefinition {
  metric: string;
  weight: number;       // 0-1, sums to 1.0 per archetype
  threshold: number;    // value at which signal is "present"
  maxValue: number;     // value at which signal is maxed out (100)
  normalize: (raw: number) => number; // 0-100 normalization
}
```

### 5.2 Normalization

Each signal is normalized to 0-100 using clamped linear interpolation:

```typescript
function normalizeSignal(raw: number, threshold: number, max: number): number {
  if (raw <= 0) return 0;
  if (raw >= max) return 100;
  return Math.round((raw / max) * 100);
}
```

### 5.3 Archetype Score Computation

```typescript
function computeArchetypeScores(
  signals: ArchetypeSignals
): ArchetypeEvidence[] {

  const results: ArchetypeEvidence[] = [];

  for (const archetype of ARCHETYPE_DEFINITIONS) {
    let weightedScore = 0;
    const receipts: Receipt[] = [];

    for (const signal of archetype.signals) {
      const rawValue = signals[signal.metric];
      const normalized = signal.normalize(rawValue);
      weightedScore += normalized * signal.weight;

      if (normalized > 0) {
        receipts.push(buildReceipt(signal, rawValue, normalized));
      }
    }

    results.push({
      archetype: archetype.name,
      score: Math.round(weightedScore),
      rank: 'tertiary', // assigned after sorting
      headline: generateHeadline(archetype, signals),
      description: generateDescription(archetype, signals, receipts),
      receipts,
    });
  }

  // Assign ranks by score
  results.sort((a, b) => b.score - a.score);
  if (results[0]) results[0].rank = 'primary';
  if (results[1] && results[1].score >= 30) results[1].rank = 'secondary';

  return results;
}
```

### 5.4 Signal Weights per Archetype

| Archetype | Signal 1 (weight) | Signal 2 (weight) | Signal 3 (weight) | Signal 4 (weight) | Signal 5 (weight) |
|-----------|-------------------|-------------------|-------------------|-------------------|-------------------|
| **Architect** | Repo structure depth (0.25) | Config file ratio (0.25) | README quality (0.20) | Doc commits (0.15) | Repo organization (0.15) |
| **Maintainer** | Contribution consistency (0.30) | Existing-repo ratio (0.25) | PR review activity (0.20) | Issue response (0.15) | Repo longevity (0.10) |
| **Pioneer** | Repo creation rate (0.25) | Language diversity (0.25) | Early adoption (0.20) | Star accumulation (0.15) | Forking behavior (0.15) |
| **Collaborator** | PR contributions (0.25) | Review engagement (0.25) | OSS contributions (0.20) | Community following (0.15) | Discussion activity (0.15) |
| **Specialist** | Language concentration (0.30) | Repo depth (0.25) | Ecosystem tooling (0.20) | Domain consistency (0.15) | Package publishing (0.10) |
| **Craftsperson** | Test presence (0.25) | CI/CD adoption (0.25) | Commit granularity (0.20) | Commit msg quality (0.15) | Quality tooling (0.15) |

---

## 6. Integration with RecruitOS

### 6.1 Where Archetypes Fit

Archetypes integrate with the existing RecruitOS architecture:

- **Enrichment Service** (`services/enrichmentServiceV2.ts`): Archetype detection runs as part of profile enrichment, alongside alignment scoring
- **Job Readiness Engine** (`services/jobReadiness/`): Archetypes inform the Skill Diversification pillar and provide additional context for readiness scoring
- **Candidate Profile UI** (`app/profile/[username]/deep/page.tsx`): Display archetype badges with expandable evidence
- **Pipeline View** (`app/pipeline/page.tsx`): Archetype chip on candidate cards for quick scanning
- **Gemini Prompts**: Feed archetype data into outreach generation for more personalized messaging

### 6.2 Data Model Extension

```typescript
// Add to Candidate interface in types.ts
interface CandidateArchetypes {
  primary: ArchetypeEvidence;
  secondary: ArchetypeEvidence | null;
  allScores: ArchetypeEvidence[];
  computedAt: string;  // ISO timestamp
  dataVersion: number; // for cache invalidation
}
```

### 6.3 Existing System Alignment

The archetype system reuses patterns from the existing codebase:
- **Signal model**: Mirrors `Signal` interface from `services/jobReadiness/types.ts` (name, value, normalizedValue, source, confidence)
- **Pillar pattern**: Each archetype is conceptually a "pillar" with weighted sub-signals
- **Evidence linking**: Extends the `detail` field pattern from Job Readiness signals into full receipts with URLs
- **Caching**: Leverages the same GitHub data cache from the unified enrichment service (Task #1)

### 6.4 API Cost Estimate

For a single developer profile archetype analysis:
- **Minimum** (Tier 1 only): ~5 API requests — enough for basic archetype detection
- **Standard** (Tier 1 + 2): ~15-20 requests — good confidence for all archetypes
- **Deep** (All tiers): ~40-50 requests — full evidence collection with receipts

At GitHub's 5,000 req/hr authenticated rate limit, standard analysis supports ~250-330 profiles/hour.

---

## References

1. Calefato, F., Lanubile, F., & Vasilescu, B. (2019). A large-scale, in-depth analysis of developers' personalities in the Apache ecosystem. *Information and Software Technology*, 114, 1-20.
2. Mukta (2025). Analysis of Software Developers' Programming Language Preferences and Community Behavior From Big5 Personality Traits. *Software: Practice and Experience*, Wiley.
3. Calefato, F., Lanubile, F., & Novielli, N. (2021). Promises and Perils of Inferring Personality on GitHub. *ESEM 2021*, ACM.
4. Montandon, J. E., & Valente, M. T. (2021). Mining the Technical Roles of GitHub Users. *Information and Software Technology*, Elsevier.
5. Open Tech Strategies (2019). Open Source Archetypes: A Framework For Purposeful Open Source, v2.0.
6. DevPersonality.com — GitHub Commit Analyzer personality classification system.
7. Steinmacher, I. et al. — Research on casual contribution patterns in open source (28% documentation contributions).

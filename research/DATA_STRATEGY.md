# RecruitOS Data Strategy

> Research-backed framework for signal collection, predictive analytics, and data presentation.
> Last updated: February 2026

---

## Table of Contents

1. [Signal Value Matrix](#1-signal-value-matrix)
2. [Data Source Roadmap](#2-data-source-roadmap)
3. [Predictive Analytics Recommendations](#3-predictive-analytics-recommendations)
4. [Data Visualization Best Practices](#4-data-visualization-best-practices)
5. [Privacy, GDPR & EU AI Act Compliance](#5-privacy-gdpr--eu-ai-act-compliance)

---

## 1. Signal Value Matrix

### Impact x Feasibility Scoring

Each signal scored on two axes:
- **Impact** (1-5): How much does this influence recruiter decisions?
- **Feasibility** (1-5): How easy is it to collect and analyze programmatically?

### 1.1 GitHub Signals

| Signal | Impact | Feasibility | Priority | Notes |
|--------|--------|-------------|----------|-------|
| Code quality / documentation | 5 | 4 | **P0** | README quality is the #1 thing recruiters check. 3 excellent projects > 15 mediocre ones. Detectable via README length, file structure, CONTRIBUTING.md, LICENSE presence |
| Contribution frequency / consistency | 4 | 5 | **P0** | "Green squares" are the first visual signal. Available via Events API + GraphQL `contributionsCollection`. Consistent > sporadic |
| OSS contributions (external repos) | 4 | 5 | **P0** | Even 1 PR to a well-known repo strengthens a profile significantly. Enumerate PRs to non-owned repos via Events API |
| Commit message quality | 4 | 3 | **P1** | Conventional commit adherence, message length distribution. Requires NLP/pattern matching |
| Language / technology diversity | 4 | 5 | **P0** | `/repos/{owner}/{repo}/languages` gives byte-level breakdown. Aggregate across all repos |
| Stars / forks (social proof) | 3 | 5 | **P1** | Directly available. Forks indicate genuine reuse. Recruiters learning these can be misleading |
| CI/CD and testing practices | 3 | 4 | **P1** | Check for `.github/workflows/`, test directories, coverage badges. Growing differentiator as AI-generated code floods market |
| Community engagement (issues, reviews) | 3 | 4 | **P1** | Issue/PR comment counts available. Review activity queryable |
| Security awareness | 3 | 4 | **P2** | SECURITY.md, Dependabot config, CodeQL workflows. Growing rapidly in importance |
| Project leadership (maintainer role) | 3 | 3 | **P2** | Admin/maintainer vs contributor roles. Requires permission analysis |

**Key API endpoints:**
- `/users/{username}/repos?sort=updated` -- Recent repos
- `/repos/{owner}/{repo}/stats/participation` -- Weekly commit data
- `/repos/{owner}/{repo}/languages` -- Language breakdown
- `/users/{username}/events/public` -- Activity events (push, PR, issues)
- GraphQL `contributionsCollection` -- Detailed contribution data

### 1.2 LinkedIn Signals

| Signal | Impact | Feasibility | Priority | Notes |
|--------|--------|-------------|----------|-------|
| "Open to Work" status | 5 | 3 | **P0** | 53% response rate vs 35% without. 200M+ members have activated. Detectable via bio keywords + BrightData scraping |
| Profile completeness | 4 | 3 | **P1** | 71% higher interview chance with complete profiles. Check headline, summary, experience, skills, photo |
| Skills endorsements | 4 | 3 | **P1** | 5+ skills = 17x more profile views, 27x more recruiter searches. Quality > quantity |
| Recommendations | 4 | 2 | **P2** | 3+ recommendations = 3.6x more recruiter inquiries. Hard to scrape at scale |
| Content activity | 3 | 2 | **P2** | Regular posting signals thought leadership. Difficult to access programmatically |
| Network quality | 3 | 1 | **P3** | Mutual connections serve as implicit referrals. Connection data is private |

### 1.3 Behavioral Signals

| Signal | Impact | Feasibility | Priority | Notes |
|--------|--------|-------------|----------|-------|
| Career trajectory / velocity | 5 | 3 | **P0** | Startups promote 22% faster (2.1yr vs 3.18yr). Learning density > raw tenure. Derive from LinkedIn work history |
| Tenure patterns | 4 | 4 | **P0** | Job-hopper myth is overblown (NIRS 2025): 4yr retention only dipped 59%->52% since 2015. Red flag = exits without progression |
| Skill acquisition rate | 4 | 3 | **P1** | DevOps/cloud engineers reach leadership in 2-3 years. Track tech mentions across jobs + GitHub language growth |
| Open to Work behavioral indicators | 4 | 3 | **P1** | 14.5% positive response vs 4.6% without signal. Bio keywords, recent profile updates, recent job changes |
| Public building / shipping activity | 3 | 4 | **P1** | Repo creation dates, activity spikes, blog publishing. Strong signal for startup roles |
| Education background | 2 | 4 | **P3** | Only 3% advantage at year 8 for top-tier grads. 15%+ of engineers at Microsoft/Adobe/Walmart lack degrees |

### 1.4 Technical Signals

| Signal | Impact | Feasibility | Priority | Notes |
|--------|--------|-------------|----------|-------|
| Work sample / project quality | 5 | 3 | **P0** | "Single most predictive measure" (Schmidt & Hunter). Look for: real users, deployed URLs, extended commit history |
| Modern stack adoption | 4 | 5 | **P0** | In-demand 2025-26: React (+23%), Docker (2x growth), Kubernetes, AI/ML (2770% decade growth). Detect from deps + repo topics |
| Testing practices | 4 | 4 | **P1** | Test dirs, framework deps (Jest, Vitest, pytest), coverage badges, CI workflow presence |
| Algorithm proficiency | 3 | 2 | **P3** | Declining due to AI-assisted cheating. Pragmatic Engineer: "little signal" from remote algo interviews |
| Security awareness | 3 | 4 | **P2** | SECURITY.md, Dependabot, CodeQL. "Shift left" makes this engineering-level concern |
| System design / architecture | 4 | 2 | **P3** | High impact for senior roles but very hard to score automatically |

### 1.5 Composite Top-10 Ranking

| Rank | Signal | Impact | Feasibility | Category |
|------|--------|--------|-------------|----------|
| 1 | Open to Work status | 5 | 3 | LinkedIn/Behavioral |
| 2 | Code quality + documentation | 5 | 4 | GitHub |
| 3 | Career trajectory / velocity | 5 | 3 | Behavioral |
| 4 | Work sample / project quality | 5 | 3 | Technical |
| 5 | Contribution frequency | 4 | 5 | GitHub |
| 6 | Modern stack adoption | 4 | 5 | Technical |
| 7 | OSS contributions | 4 | 5 | GitHub |
| 8 | Tenure patterns | 4 | 4 | Behavioral |
| 9 | Skills endorsements | 4 | 3 | LinkedIn |
| 10 | Testing / CI/CD practices | 4 | 4 | Technical |

---

## 2. Data Source Roadmap

### 2.1 Current Sources (Already Implemented)

| Source | Status | What RecruitOS Collects |
|--------|--------|------------------------|
| **GitHub API** | Active | Profile, repos, events, languages, contributions, streaks, OSS PRs |
| **LinkedIn (BrightData)** | Active | Profile data, job changes, Open to Work status, title/company changes |
| **SERP (BrightData)** | Active | Conference speaking, content activity (Medium, Dev.to, LinkedIn Pulse) |
| **Gemini AI** | Active | Alignment scoring, persona generation, deep profiles, outreach messages |

### 2.2 Phase 1: High-Value Additions (Near-term)

| Source | Signal Value | API Access | Implementation |
|--------|-------------|------------|----------------|
| **Stack Overflow** | High -- reputation correlates with problem-solving ability. Top 1% users are elite signal. 52.5M monthly visits | Public API (`/users/{id}`) -- reputation, badges, tags, answer acceptance rate. Rate limit: 300 req/day | Medium. Match via email/username cross-reference with GitHub |
| **npm registry** | High -- package authorship signals real-world impact. Download counts = actual usage | Public API (`registry.npmjs.org/{pkg}`) -- author, downloads, dependents. No auth required | Low. Cross-reference GitHub username with npm author field |
| **Dev.to** | Medium -- technical blogging signals communication skills and depth | Public API (`dev.to/api/articles?username=`) -- articles, reactions, comments. No auth required | Low. Match via GitHub username (many users link accounts) |
| **Credly (certifications)** | Medium -- AWS/GCP/K8s certs valued for specific roles. Third-party validation | Public API available. Badge verification endpoints | Low-Medium. Match via name + email |

### 2.3 Phase 2: Specialized Sources (Medium-term)

| Source | Signal Value | API Access | Implementation |
|--------|-------------|------------|----------------|
| **Hashnode** | Medium -- developer blogging platform. User data includes followers, badges, post count | GraphQL API (public, no auth for reads). Fields: username, posts, tagsFollowing, followersCount | Low. Query by username |
| **PyPI** | Medium-High for Python roles -- package authorship + download stats | JSON API (`pypi.org/pypi/{package}/json`) -- author, downloads. CDN-cached | Low. Match author field to candidate name |
| **crates.io** | Medium for Rust roles -- crate authorship + download stats | REST API (`/api/v1/users/*/stats`). Sparse index for metadata. Requires User-Agent header | Low-Medium |
| **Sessionize** | Medium -- conference speaker profiles with talk history | Limited API. Speaker profiles are public web pages | Medium. SERP-based discovery (already partially implemented) |
| **Kaggle** | High for ML/data roles -- competition rankings, notebooks, datasets | Public profiles. Community-maintained scraping tools exist | Medium. Match via username/name |

### 2.4 Phase 3: Enrichment Sources (Long-term)

| Source | Signal Value | API Access | Privacy Risk |
|--------|-------------|------------|--------------|
| **Twitter/X** | Low-Medium -- tech discussions, network. API access increasingly restricted | X API v2: expensive ($100/mo basic). Rate-limited. Community shifting to Bluesky | Medium |
| **Bluesky** | Low-Medium -- growing developer community. AT Protocol is open | AT Protocol API -- fully open, self-authenticating. Early mover advantage | Low |
| **YouTube** | Low -- tech content creation. Niche signal | YouTube Data API v3 -- search by channel/name. Quota: 10K units/day | Low |
| **Personal websites** | Medium -- portfolio quality, design sense | Firecrawl scraping (already integrated). Extract tech stack from meta tags | Low-Medium |
| **Glassdoor** | Medium -- company reviews for compensation estimation | No public API. SERP-based. TOS restrictions | High |

### 2.5 Data Source Integration Architecture

```
Candidate Input (GitHub URL, LinkedIn URL, name)
        |
        v
  +------------------+
  | Source Resolver   |  Identifies which sources are available for this candidate
  +------------------+
        |
        v
  +------------------+     +------------------+     +------------------+
  | GitHub Collector  |     | LinkedIn Collector|    | SERP Collector   |
  | (Primary, free)   |     | (BrightData)     |    | (BrightData)     |
  +------------------+     +------------------+     +------------------+
        |                        |                        |
        v                        v                        v
  +------------------+     +------------------+     +------------------+
  | npm/PyPI/crates  |     | Dev.to/Hashnode  |     | SO/HackerRank    |
  | (Package registries)    | (Blog platforms)  |    | (Q&A/Challenges) |
  +------------------+     +------------------+     +------------------+
        |                        |                        |
        +------------------------+------------------------+
                                 |
                                 v
                    +---------------------------+
                    | Signal Aggregator         |
                    | - Normalize to 0-100      |
                    | - Weight by confidence    |
                    | - Track data completeness |
                    +---------------------------+
                                 |
                                 v
                    +---------------------------+
                    | AI Analysis (Gemini)      |
                    | - Synthesis scoring        |
                    | - Evidence extraction      |
                    | - Prediction generation    |
                    +---------------------------+
```

---

## 3. Predictive Analytics Recommendations

### 3.1 Prediction Feasibility Matrix

Ranked by implementation priority (achievable accuracy x recruiter value):

| Prediction | Accuracy | Confidence | Priority | Key Inputs |
|-----------|----------|------------|----------|------------|
| **Notice period estimation** | +/- 2 weeks | High | **P0** | Country, seniority, company type. Largely deterministic from law + convention |
| **Candidate availability/interest** | 70-80% | Medium | **P0** | Open to Work, GitHub activity trend, recent profile updates, bio keywords |
| **Time-to-hire estimation** | R^2 0.4-0.6 | Medium | **P1** | Seniority, tech stack scarcity, location, company brand. Good base rate data exists |
| **Compensation estimation** | +/- 25-30% | Medium | **P1** | Company tier + location + seniority + tech stack. Improves with Levels.fyi integration |
| **Interview success likelihood** | AUC 0.65-0.73 | Low-Medium | **P2** | Needs structured assessment data. GitHub signals alone = weak predictor |
| **Offer acceptance probability** | 65-75% | Low-Medium | **P2** | Too dependent on private info (competing offers). Candidate experience matters (52% refuse after negative experience) |
| **Retention prediction** | 55-65% | Low | **P3** | Pre-hire signals alone are weak. Tenure patterns + career trajectory = best available |
| **Performance potential** | Validity 0.51-0.63 | Low | **P3** | Years of experience validity = only 0.18 (Schmidt & Hunter). Structured assessment + GMA combined = 0.63 |

### 3.2 Notice Period Reference Table (P0 Implementation)

| Country | Standard | Senior/Executive | Key Factor |
|---------|----------|-----------------|------------|
| Denmark | 1 month | 3-6 months | Collective bargaining agreements |
| Sweden | 1 month (resignation) | Up to 6 months | LAS: +1 month per 2 years beyond 4 years |
| Germany | 4 weeks min | Up to 7 months | Increases with tenure |
| Netherlands | 1 month | 1-3 months | Employer > employee notice |
| France | 1-3 months | 3+ months | CBA-driven, strong union influence |
| UK | 1-12 weeks (statutory) | 3-6 months | 1 week per year of service, max 12 weeks |
| USA | At-will (0 days) | 2 weeks customary | No legal requirement |
| India | 30-90 days | 90 days typical | Buyout common in tech |

### 3.3 Career Velocity Benchmarks

| Metric | Data Point | Source |
|--------|-----------|--------|
| Startup promotion speed | 2.1 years between promotions | SignalFire 2025 |
| Large company promotion speed | 3.18 years between promotions | SignalFire 2025 |
| Startup advantage | 22% faster advancement | SignalFire 2025 |
| Top-tier university premium | 22% faster to senior (early career only) | SignalFire 2025 |
| Education premium at year 8 | Only 3% difference | SignalFire 2025 |
| DevOps/Cloud to leadership | 2-3 years | SignalFire 2025 |
| Big Tech -> Startup transition rate | Only 2.7% make the move | SignalFire 2025 |
| ML/AI job growth (decade) | 2,770% | SignalFire 2025 |
| No-degree engineers at top companies | 15%+ (Microsoft, Adobe, Walmart) | SignalFire 2025 |
| Job tenure decline (2015-2025) | 59% -> 52% (4-year retention) | NIRS 2025 |

### 3.4 Prediction Display Recommendations

**Always show:**
1. Confidence level (High/Medium/Low with color: green/yellow/red)
2. Key contributing factors (top 2-3 inputs that drove the prediction)
3. Evidence trail (clickable links to source data)
4. "Decision support" framing -- never "this is the answer"

**Format:**
```
Notice Period: ~3 months [High confidence]
  Based on: Denmark + Senior role + 5yr tenure
  Override: [Adjust manually]

Availability: Likely open [Medium confidence]
  Signals: "Open to Work" active, GitHub activity increasing,
           profile updated 3 days ago
  Missing data: No LinkedIn activity data available
```

### 3.5 Critical Research Finding: What Actually Predicts Performance

From Schmidt & Hunter (1998) and Sackett et al. (2022) meta-analyses:

| Method | Validity | RecruitOS Implication |
|--------|----------|----------------------|
| Work sample tests | 0.54 | Highest value -- assess actual project quality in repos |
| Structured interviews | 0.51 | Generate structured interview guides (already implemented) |
| Cognitive ability (GMA) | 0.51 | Cannot assess from profiles -- acknowledge limitation |
| Job knowledge tests | 0.48 | Infer from technology depth + content activity |
| Integrity tests | 0.41 | Not applicable to passive sourcing |
| Conscientiousness | 0.31 | Proxy: commit consistency, documentation quality |
| Reference checks | 0.26 | LinkedIn recommendations as weak proxy |
| **Years of experience** | **0.18** | **Over-weighted in most ATS tools. RecruitOS should de-emphasize** |
| Years of education | 0.10 | Minimal predictive value. Do not use as primary signal |

**Key implication:** RecruitOS's `yearsExperience` field in the alignment score should carry less weight than skills demonstration and project quality. The current 5-component breakdown (skills, experience, industry, seniority, location) should be re-calibrated to favor skills and demonstrated capability over raw tenure.

---

## 4. Data Visualization Best Practices

### 4.1 Recruiter Decision Patterns

Research findings on how recruiters evaluate candidates:

- **6-7 seconds**: Average time spent on initial resume/profile scan
- **15-30 seconds**: Time on GitHub profile before deciding to dig deeper
- **First look**: Photo, headline, current company, alignment score
- **Second look**: Skills match, career progression, red flags
- **Deep dive**: Evidence, project quality, interview guide (if shortlisted)

**Design implication:** Critical information must be visible within 6 seconds. Use progressive disclosure -- summary first, evidence on demand.

### 4.2 Confidence Visualization Framework

| Confidence Level | Visual Treatment | When to Use |
|-----------------|-----------------|-------------|
| **High** (85%+) | Green badge, solid border, bold text | 3+ data sources, strong signal agreement |
| **Medium** (60-84%) | Yellow/amber badge, dashed border | 1-2 data sources, some signal disagreement |
| **Low** (<60%) | Red/gray badge, dotted border, italic text | Single source, weak signals, missing data |
| **Insufficient** | Gray "?" icon, "Not enough data" label | Cannot make meaningful prediction |

**Research-backed patterns:**
- Color coding (green/yellow/red) is universally understood
- Show probability ranges, not point estimates: "70-85% likely" not "78% likely"
- Qualitative labels alongside numbers: "High confidence (87%)"
- Progressive disclosure: hover/click to see contributing factors
- When confidence is low, suggest what data would improve it

### 4.3 Comparative vs. Absolute Metrics

| Approach | Pros | Cons | When to Use |
|----------|------|------|-------------|
| **Absolute score (0-100)** | Simple, consistent, comparable across time | Doesn't account for pool quality; can feel arbitrary | Default for alignment scoring. Anchor to evidence |
| **Relative ranking** | Shows position in pipeline; intuitive | Changes as pool changes; unfair to small pools | Pipeline views with 5+ candidates |
| **Percentile** | Accounts for market context | Requires baseline data; complex to explain | Compensation estimation, market positioning |

**Recommendation:** Use absolute scores (already implemented as 0-100 alignment score) but augment with:
- Score distribution visualization (bell curve showing where candidate falls)
- Pool comparison ("Top 15% of candidates for this role")
- Score drivers prominently displayed (already in `scoreDrivers` / `scoreDrags`)

### 4.4 Historical Trends vs. Point-in-Time

| Visualization | Best For | Chart Type |
|--------------|----------|------------|
| Career trajectory | Showing growth velocity | Timeline with role progression markers |
| Skill evolution | Technology adoption over time | Stacked area chart of languages/frameworks |
| Activity trend | GitHub contribution patterns | Heatmap (contribution calendar style) |
| Engagement level | Is candidate becoming more/less active? | Sparkline with trend arrow |
| Pipeline velocity | How fast candidates move through stages | Funnel chart with time-in-stage |

### 4.5 Dashboard Design for Recruiters

**Match cadence to action:**
- **Daily**: Pipeline status, new candidates, pending actions
- **Weekly**: Bottleneck identification, stage conversion rates
- **Monthly**: Source effectiveness, time-to-hire trends, quality metrics

**Core KPIs by stakeholder:**

| Stakeholder | Primary Metrics |
|-------------|----------------|
| Sourcing recruiter | Candidates found, response rate, pipeline additions |
| Hiring manager | Candidate quality scores, interview-to-offer ratio |
| TA lead | Time-to-fill, cost-per-hire, source ROI |
| Executive | Offer acceptance rate, quality-of-hire, diversity metrics |

### 4.6 Trust-Building Design Patterns

Research shows recruiters trust AI tools that:

1. **Show their work** -- Every score links to evidence. "This candidate scored 82 because..." with clickable evidence items
2. **Preserve human agency** -- Frame as "decision support" not "decision maker". Always allow override with one click
3. **Acknowledge uncertainty** -- "We have high confidence on skills (3 sources) but low confidence on experience (1 source)"
4. **Degrade gracefully** -- When data is missing, say so explicitly rather than showing inflated scores
5. **Allow calibration** -- Let recruiters adjust weights ("For this role, location matters more")

**What erodes trust:**
- Black-box scores without explanation
- Scores that contradict recruiter intuition without justification
- False precision (showing 78.3% when accuracy is +/- 15%)
- Missing data silently affecting scores
- No ability to override or adjust

---

## 5. Privacy, GDPR & EU AI Act Compliance

### 5.1 EU AI Act Timeline (Critical for RecruitOS)

| Date | Requirement | Status |
|------|-------------|--------|
| **Feb 2, 2025** | Banned practices take effect: emotion recognition in interviews, social scoring, biometric inference | ACTIVE |
| **Aug 2, 2026** | Full high-risk requirements enforceable for employment AI systems | 6 MONTHS AWAY |
| **Aug 2, 2027** | Active penalties begin: up to EUR 35M or 7% global turnover | Compliance deadline |

**RecruitOS is classified as HIGH-RISK** under Annex III because it:
- Analyzes and filters candidates
- Evaluates and ranks candidates
- Places targeted outreach

### 5.2 Mandatory Requirements (by August 2026)

1. **Risk Assessment & Testing**
   - Prove accuracy and freedom from unfair bias
   - Regular bias audits with fairness metrics (disparate impact ratio)
   - Third-party audit trail

2. **Technical Documentation**
   - Model cards for each AI function (scoring, persona, outreach)
   - Input/output specifications and limitations
   - Training data descriptions

3. **Human Oversight (Article 14)**
   - AI must NEVER be sole decision-maker
   - Humans must be able to override any AI output
   - System must warn against automation bias
   - Users must understand capacities AND limitations

4. **Transparency (Article 13)**
   - Candidates must be informed when AI is involved
   - Right to explanation of AI-assisted decisions
   - Scoring methodology must be interpretable by non-technical users

5. **GDPR Article 22 Compliance**
   - No decisions "based solely on automated processing"
   - Human review must be "substantive and capable of influencing the outcome"
   - Rubber-stamping AI decisions does NOT qualify
   - Right to human intervention, express views, contest decisions

6. **CE Marking & Registration**
   - Conformity certification
   - Registration in EU AI database before deployment

### 5.3 RecruitOS Current Compliance Status

| Requirement | Current State | Gap |
|-------------|--------------|-----|
| Evidence-linked scoring | Partially implemented (PersonaV2, CitedClaims) | Need to apply to ALL AI outputs |
| Human oversight | Recruiter reviews all candidates | Need explicit override UI + audit log |
| Immutable audit logs | Implemented (`apex_logs`) | Need to extend to all AI decisions |
| Bias testing | Not implemented | CRITICAL GAP: Need fairness dashboard |
| Candidate notification | Not implemented | Need "AI assisted" labels |
| Technical documentation | Not implemented | Need model cards for Gemini functions |
| Confidence scoring | Partially (scoreConfidence field exists) | Need to surface in UI with explanation |
| Data source tracking | Implemented (DataSourceConfidence) | Good foundation, needs UI exposure |

### 5.4 GDPR Data Collection Rules

For each data source:

| Source | Legal Basis | Retention | Notes |
|--------|------------|-----------|-------|
| GitHub (public) | Legitimate interest | Duration of recruitment process | Public data; still requires notification |
| LinkedIn (scraping) | Legitimate interest, BUT... | Minimize | BrightData scraping = legal gray area in EU. Use with caution |
| Stack Overflow | Legitimate interest | Duration of process | Public data |
| npm/PyPI/crates.io | Legitimate interest | Duration of process | Public package metadata |
| Dev.to/Hashnode | Legitimate interest | Duration of process | Public blog content |
| AI-generated profiles | Requires clear legal basis | Document processing purpose | MUST disclose AI involvement to candidate |

**Data minimization principle:** Only collect data relevant to the specific role being recruited for. Don't build permanent dossiers.

### 5.5 Bias Risks Specific to RecruitOS

| Bias Type | Source | Mitigation |
|-----------|--------|------------|
| **Activity bias** | GitHub favors those with free time for OSS | Weight project quality > quantity; acknowledge in confidence score |
| **Gender bias** | GitHub user base skews male; activity patterns differ | Monitor gender distribution in pipeline; audit scoring distributions |
| **Geographic bias** | English-centric scoring disadvantages non-native speakers | Multi-language search (already implemented); normalize for locale |
| **Socioeconomic bias** | Developers at well-funded companies produce more visible work | Consider company context in scoring; don't penalize for private repos |
| **Name bias** | NLP processing of names carries documented bias against non-Western names | LLM bias: favored white-associated names 85% of the time (UW 2024). Audit Gemini outputs for this |
| **Education bias** | University prestige as proxy for quality | De-emphasize: only 3% difference at year 8 (SignalFire) |

**Mandatory monitoring:**
- Track score distributions by inferred gender, geography, and company tier
- Regular A/B tests of scoring with redacted vs. full candidate data
- Quarterly bias audit reports

---

## Appendix A: API Reference for Data Sources

### GitHub REST API
- Rate limit: 60 req/hr (unauthenticated), 5000 req/hr (authenticated)
- User profile: `GET /users/{username}`
- Repos: `GET /users/{username}/repos?sort=updated&per_page=100`
- Events: `GET /users/{username}/events/public?per_page=100`
- Repo languages: `GET /repos/{owner}/{repo}/languages`
- Stats: `GET /repos/{owner}/{repo}/stats/contributors`

### Stack Overflow API
- Rate limit: 300 req/day (unauthenticated)
- User by name: `GET /users?inname={name}&site=stackoverflow`
- User profile: `GET /users/{id}?site=stackoverflow`
- Tags: `GET /users/{id}/tags?site=stackoverflow`

### npm Registry
- No auth required, no rate limit documented
- Package info: `GET https://registry.npmjs.org/{package}`
- Downloads: `GET https://api.npmjs.org/downloads/point/last-month/{package}`

### Dev.to API
- No auth required for reads
- User articles: `GET https://dev.to/api/articles?username={username}`
- User profile: `GET https://dev.to/api/users/by_username?url={username}`

### PyPI JSON API
- CDN-cached, ETag supported
- Package info: `GET https://pypi.org/pypi/{package}/json`
- Fields: author, author_email, downloads, version history

### Hashnode GraphQL API
- Endpoint: `https://gql.hashnode.com` (POST only)
- No auth required for reads
- User query: `query { user(username: "") { posts { ... } } }`

### crates.io API
- Requires User-Agent header
- User stats: `GET /api/v1/users/{username}/stats`
- Crate info: `GET /api/v1/crates/{name}`
- OpenAPI spec: `https://crates.io/api/openapi.json`

### Credly API
- Badge verification endpoints available
- Match candidates by name + email

---

## Appendix B: Research Sources

### Signal Value & Recruiter Behavior
- SignalFire State of Tech Talent Report 2025
- SignalFire Engineering Career Trends (promotion velocity, education impact)
- HackerRank 2025 Developer Skills Report (13,700+ developers, 102 countries)
- LinkedIn recruitment statistics (87% of recruiters use LinkedIn)
- NIRS 2025 study debunking the job-hopping myth

### Predictive Validity
- Schmidt & Hunter (1998) -- Meta-analysis of 85 years of personnel selection
- Sackett et al. (2022) -- Revised validity estimates, structured interviews as strongest predictor
- Carnegie Mellon study on GitHub profiles and employer evaluation
- Qualified.io research on predictive interview methods

### EU AI Act & Compliance
- EU AI Act Articles 13 (Transparency) and 14 (Human Oversight)
- GDPR Article 22 (Automated Decision-Making)
- Cogent Info -- XAI compliance requirements for 2026
- HireTruffle -- EU AI Act hiring compliance guide

### Visualization & Trust
- Armstrong et al. (2025) -- Uncertainty visualization in LLM outputs (NC State)
- AIHR -- Recruitment dashboard design guidance
- CloudApper -- Transparent AI in HR and recruiter trust
- Gartner 2025 -- Only 26% of job applicants trust AI to fairly evaluate them

### Market Benchmarks
- Average offer acceptance rate: 84% (up from 81% during Great Resignation)
- 52% of candidates refuse offers after negative experience
- Time-to-hire for senior engineering: 58-70 days
- AI/ML roles: up to 89 days average time-to-hire
- Average inbound applicants per engineering job: 90-100 (top AI companies: 250+)

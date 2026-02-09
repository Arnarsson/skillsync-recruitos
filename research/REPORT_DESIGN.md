# RecruitOS Candidate Report Design

## Research & Optimal Structure

---

## 1. Competitive Benchmark Analysis

### 1.1 HireVue Assessment Reports

**Report Structure:** Three core insight sections:
- **Working with People** - Interpersonal and collaboration competencies
- **Working Style** - Work habits, approach to tasks, self-management
- **Personality** - Underlying personality traits and behavioral tendencies

**Key Features:**
- AI-scored video interviews with competency mapping
- Game-based cognitive assessments (attention, risk tolerance, decision-making)
- Candidate receives a separate "Insight Report" (different from employer view)
- Strengths highlighted alongside areas for improvement
- Structured scoring aligned to role-specific competency models

**Relevance to RecruitOS:** HireVue requires the candidate to complete assessments. RecruitOS operates passively (analyzing public data), so we must derive equivalent signals from GitHub behavior, code patterns, and public activity.

### 1.2 Pymetrics / Harver Trait Reports

**Report Structure:** Five behavioral categories:
- **Attention** - Managing information and distractions
- **Effort** - Investment vs. reward probability
- **Fairness** - Social situation perception
- **Decision-Making** - Approach to choices under uncertainty
- **Emotion** - Interpreting others' emotions

**Key Features:**
- 12 game-based tasks measuring 90+ cognitive/behavioral traits
- Trait categorization across social, cognitive, emotional, altruism, and trust
- Continuous spectrum representation (not binary labels)
- Includes personal development tips
- Employer report differs from candidate report (more granular)

**Relevance to RecruitOS:** The trait-spectrum model is excellent. We already approximate this with BigFive radar + psychometric indicators. Pymetrics' emphasis on continuous scores (not just labels) is a pattern we should follow.

### 1.3 LinkedIn Recruiter Profiles

**Key Sections:**
- **Experience Summary** - Job titles, companies, tenure
- **Skills Match** - Skills mapped to job requirements
- **Spotlights** - Behavioral signals:
  - "Active Talent" (recently updated profile, shared resume)
  - "Interested in Company" (showed interest in roles)
  - "Open to Work" (explicit signal)
  - Recent layoff detection
- **AI Recommended Matches** - Based on recruiter's hiring activity

**Relevance to RecruitOS:** Our `behavioralSignalsService.ts` already detects "Open to Work" and activity patterns. LinkedIn's spotlight model (surfacing engagement likelihood) is directly applicable.

### 1.4 Greenhouse Scorecards

**Report Structure:**
- **Categories** (3-4 per job): Organized groups of evaluation criteria
- **Attributes** (5-6 per category): Specific skills/qualifications
- **Rating Scale**: Definitely Not / No / Yes / Strong Yes
- **Sections:** Qualifications (must-haves), Interpersonal skills (soft skills)
- **Notes:** Pros, cons, follow-up items, private notes, @ mentions

**Key Features:**
- Structured, rubric-based evaluation
- Role-specific customization
- Interviewer calibration reports (consistency tracking)
- Standardized recommendation system

**Relevance to RecruitOS:** The "traffic light" recommendation model (Definitely Not → Strong Yes) maps directly to our alignment score bands. Greenhouse's structured categories model could inform how we organize report sections.

### 1.5 Hogan Personality Assessments

**Three-Part Structure:**
1. **HPI (Personality Inventory)** - Day-to-day work presentation: ambition, learning style, leadership, interpersonal sensitivity
2. **HDS (Development Survey)** - Under-pressure behavior: derailers that undermine relationships/career/leadership
3. **MVPI (Motives, Values, Preferences)** - Intrinsic drivers and organizational alignment

**Report Deliverables:**
- Executive Summary
- Score Graphs (visual representation)
- Score Interpretation (narrative)
- Subscale Scores (granular breakdown)
- Coaching Tools
- EQ Report (6 emotional competencies)
- ~90 pages total

**Relevance to RecruitOS:** The HPI/HDS/MVPI framework is gold. We can map this to:
- HPI → Our BigFive + WorkStyle indicators (day-to-day personality)
- HDS → Our Risk Assessment + Red Flags (derailers)
- MVPI → Our Primary Motivator + Career Trajectory (values alignment)

---

## 2. Recruiter Information Needs

### 2.1 What Recruiters Actually Look At (Priority Order)

Based on research across recruiting platforms, hiring rubrics, and technical assessment literature:

| Priority | Information Need | Current RecruitOS Coverage | Gap |
|----------|-----------------|---------------------------|-----|
| 1 | **Skills match to job** | Alignment score + skill breakdown | Need: vs-requirements comparison |
| 2 | **Experience relevance** | Years + score component | Need: role progression timeline |
| 3 | **Cultural/team fit signals** | Persona archetype + team fit | Good coverage |
| 4 | **Red flags / risk factors** | Red flags + risk assessment | Need: severity weighting |
| 5 | **Communication ability** | Communication style label | Need: evidence (PR examples) |
| 6 | **Technical depth** | Core skills matrix | Need: GitHub signal strength |
| 7 | **Growth trajectory** | Career trajectory section | Need: visualization |
| 8 | **Availability / urgency** | Behavioral signals (Open to Work) | Need: prominent placement |
| 9 | **Interview preparation** | Interview guide questions | Good coverage |
| 10 | **Compensation expectations** | Compensation intelligence | Need: market benchmarking |

### 2.2 Technical Hiring Rubric Standards

Top engineering organizations (FAANG, Greenhouse model) evaluate across four dimensions:

1. **Technical Competency** - Problem-solving, code quality, system design
2. **Communication** - Clarifying questions, explaining approach, collaboration
3. **Behavioral** - STAR-method responses, past performance indicators
4. **Cultural Alignment** - Values match, team dynamics, growth mindset

Standard rating scale: **Definitely Not / No / Yes / Strong Yes** (Greenhouse) or **1-4 numeric** (Google rubric)

### 2.3 Key Red Flags Recruiters Screen For

| Signal | Severity | How We Can Detect |
|--------|----------|-------------------|
| Job-hopping without growth | Medium | Career trajectory (tenure pattern + progression) |
| Skill staleness | High | Deprecated skills list + recent commit languages |
| Unexplained career gaps | Medium | Timeline analysis (already in schema) |
| Overqualification | Low | Seniority vs. role mismatch |
| Geographic barriers | Low | Location data (already available) |
| Dishonesty signals | High | Profile vs. GitHub activity inconsistencies |
| Low collaboration | Medium | PR review activity, issue responses |

---

## 3. Proposed Report Structure

### 3.1 Current Report Sections (Already Built)

Based on `app/report/[id]/page.tsx`:

1. **Header** - Avatar, name, role, company, location, years experience, alignment score ring
2. **Skills Tags** - Top 12 skill badges
3. **Executive Summary** - Personality archetype, reasoning, psychometric grid (communication, motivator, risk tolerance, leadership)
4. **Alignment Breakdown** - 5-bar chart (Skills Match, Experience, Industry Fit, Seniority, Location)
5. **Big Five Personality Profile** - Radar chart + trait bars with descriptions (O, C, E, A, Stability)
6. **Strengths & Risks** - Green flags / Red flags lists
7. **Key Evidence** - Numbered evidence items
8. **Areas to Explore** - Risk items
9. **Soft Skills** - Badge/tag display
10. **Career Trajectory** - Grid (velocity, promotion freq, role progression, avg tenure, tenure pattern)
11. **Team Fit Analysis** - 4-card grid (communication style, work approach, leadership, risk profile)
12. **Core Skills Matrix** - Grid with proficiency badges (expert/advanced/intermediate)

### 3.2 Proposed New Sections

#### Section A: Technical Signal Strength (NEW - HIGH PRIORITY)

**Purpose:** GitHub-derived evidence of actual technical capability (not just claims).

**Content:**
- **Code Activity Score** (0-100): Composite of commit frequency, recency, consistency
- **Open Source Impact**: Stars received, forks of repos, external PRs merged
- **Code Quality Signals**: Repository structure, documentation quality, test presence
- **Language Proficiency Heatmap**: Languages used over time with intensity
- **Collaboration Metrics**: PR reviews given/received ratio, issue response time
- **Project Complexity**: Lines of code, architectural patterns, dependency management

**Visualization:** Horizontal bar chart with signal strength indicators (strong/moderate/weak) + sparkline for activity over last 12 months.

**Data Sources:** GitHub API (repos, commits, PRs, issues) via existing `personalityService.ts` and `advancedEnrichmentService.ts`.

**Why:** This is the #1 gap. Recruiters want to verify claimed skills with actual evidence. GitHub data provides this uniquely.

#### Section B: Communication Quality (NEW - HIGH PRIORITY)

**Purpose:** Evidence-based communication assessment from actual writing samples.

**Content:**
- **README Quality Score**: Documentation completeness, clarity, structure
- **PR Description Analysis**: How well they explain changes, context, impact
- **Issue Communication**: Problem articulation, solution proposals
- **Commit Message Quality**: Descriptive vs. terse, follows conventions
- **Response Patterns**: Typical response times, engagement depth

**Visualization:** 3-tier traffic light (Strong / Adequate / Limited) with expandable evidence samples.

**Data Sources:** GitHub API (repos READMEs, PR descriptions, commit messages, issue comments).

**Why:** Communication skill is #5 on recruiter priority list but our current report only provides a label ("Direct", "Collaborative") without evidence.

#### Section C: Growth Trajectory Visualization (ENHANCE EXISTING)

**Purpose:** Transform the existing career trajectory data from plain text into a visual timeline.

**Content:**
- **Career Timeline**: Visual progression of roles/companies over time
- **Skill Acquisition Curve**: New technologies adopted per year
- **Seniority Velocity**: Time between career level changes
- **Learning Signals**: Recent new languages, frameworks in repos

**Visualization:** Horizontal timeline with role markers + overlaid skill acquisition curve.

**Data Source Enhancement:** Extend existing `CareerTrajectory` interface with temporal data.

**Why:** Career trajectory is already in the report but displayed as plain text grid. Visual timeline is dramatically more scannable.

#### Section D: Candidate vs. Requirements Comparison (NEW - HIGH PRIORITY)

**Purpose:** Direct side-by-side comparison of candidate capabilities vs. job requirements.

**Content:**
- **Skills Match Matrix**: Required skill → Candidate evidence (met/partial/gap)
- **Experience Requirements**: Years needed vs. years demonstrated
- **Location/Remote Fit**: Geographic compatibility
- **Seniority Level Fit**: Expected level vs. inferred level
- **Missing Qualifications**: Clear list of gaps

**Visualization:** Comparison table with checkmark/warning/X icons per requirement.

**Data Source:** Cross-reference `apex_job_context` (intake job description) with candidate profile.

**Why:** This is the single most requested feature by recruiters. "Does this person match our job?" should be answerable in 5 seconds.

#### Section E: Availability & Engagement Likelihood (NEW - MEDIUM PRIORITY)

**Purpose:** Surface signals about whether the candidate is reachable and likely to respond.

**Content:**
- **Open to Work Signal**: Badge from `behavioralSignalsService.ts`
- **Activity Recency**: Last commit, last profile update
- **Engagement Score**: Based on LinkedIn spotlights model
- **Responsiveness Prediction**: Based on GitHub response patterns
- **Company Stability Context**: Employer layoff news, company growth signals

**Visualization:** Traffic light badge system (Hot / Warm / Cold) with supporting evidence bullets.

**Data Source:** Existing `behavioralSignalsService.ts` + GitHub activity data.

**Why:** Timing matters enormously in recruiting. A perfect candidate who won't respond is worthless.

#### Section F: Risk Assessment Dashboard (ENHANCE EXISTING)

**Purpose:** Upgrade red flags from a flat list to a structured, severity-weighted dashboard.

**Content:**
- **Attrition Risk Meter**: Visual gauge (low/moderate/high) from existing `RiskAssessment`
- **Flight Risk Factors**: Weighted list with severity indicators
- **Skill Obsolescence**: Deprecated tech stack flagging
- **Tenure Pattern Visualization**: Job duration chart over career
- **Compensation Risk**: Over/under-market positioning

**Visualization:** Dashboard with traffic light meters per risk category + expandable detail.

**Data Source Enhancement:** Already have `RiskAssessment` interface in `types.ts`. Need severity weighting and visualization layer.

**Why:** Current red flags are a flat list. Structured risk assessment with severity helps recruiters make faster decisions.

#### Section G: Interview Preparation Guide (ENHANCE EXISTING)

**Purpose:** Expand the existing interview guide into a structured preparation package.

**Content:**
- **Personalized Questions**: Already exists via `InterviewQuestion[]`
- **Probe Areas**: Specific topics to dig into based on gaps/risks
- **STAR Prompts**: Suggested behavioral interview prompts based on profile
- **Technical Assessment Suggestions**: Coding challenges aligned to skill gaps
- **Conversation Starters**: Ice-breakers from shared interests/repos

**Visualization:** Tabbed interface: Behavioral / Technical / Culture Fit / Ice Breakers

**Data Source:** Extend existing interview guide with categorized questions.

**Why:** Recruiters prepare for interviews using candidate reports. Making the report preparation-ready increases its utility.

#### Section H: Compensation Context (ENHANCE EXISTING)

**Purpose:** Frame salary expectations within market context.

**Content:**
- **Implied Salary Band**: From existing `CompensationIntelligence`
- **Market Benchmark**: Role + Location + Experience median (external data)
- **Compensation Growth Rate**: Historical trajectory
- **Equity Indicators**: Stock/option signals from career history

**Visualization:** Range bar showing candidate's implied band vs. market band with overlap indicator.

**Data Source:** Existing `CompensationIntelligence` interface. Market data would need external API (Levels.fyi data, public salary datasets).

**Why:** Compensation misalignment is a top reason for recruiter-candidate friction. Early visibility prevents wasted effort.

---

## 4. Visualization Recommendations

### 4.1 Visualization Types by Section

| Section | Primary Visualization | Secondary | Rationale |
|---------|----------------------|-----------|-----------|
| Alignment Score | Score ring (existing) | - | Instant recognition, brand element |
| Alignment Breakdown | Bar chart (existing) | - | Clear comparison across dimensions |
| Big Five Personality | Radar chart (existing) | Trait bars | Personality shapes are intuitive |
| Technical Signal | Horizontal bars | Activity sparkline | Signal strength is linear |
| Communication | Traffic light | Evidence samples | Quick scan + depth |
| Career Trajectory | Timeline | Skill curve overlay | Temporal data needs timeline |
| Candidate vs. Req | Comparison table | Match percentage | Direct mapping to requirements |
| Availability | Badge + gauge | Evidence bullets | Binary-ish signal |
| Risk Assessment | Dashboard gauges | Severity-weighted list | Multiple risk dimensions |
| Interview Guide | Tabbed cards | - | Category separation |
| Compensation | Range bar | Market comparison overlay | Numerical range data |
| Core Skills | Grid with badges (existing) | Heat map | Proficiency is categorical |

### 4.2 Design Principles

1. **3-Second Rule**: Every section must communicate its key insight within 3 seconds of scanning
2. **Traffic Light System**: Use green/amber/red consistently for strength/caution/concern
3. **Progressive Disclosure**: Summary visible, detail expandable
4. **Print-Ready**: All visualizations must degrade gracefully to print (existing print styles are solid)
5. **Consistent Color Language**:
   - Green/Emerald: Strengths, matches, low risk
   - Blue/Indigo: Neutral/informational, personality traits
   - Amber/Orange: Caution, moderate risk, areas to explore
   - Red/Rose: Concerns, high risk, gaps
   - Purple/Violet: AI-generated insights, personality
   - Cyan/Teal: Growth, trajectory, future-looking

### 4.3 Chart Library

Currently using **Recharts** (`RadarChart`, `ResponsiveContainer`). Recommended to continue with Recharts for consistency:
- `BarChart` for signal strength and comparisons
- `AreaChart` for activity sparklines
- `RadarChart` for personality (already in use)
- Custom CSS for traffic lights, gauges, and timeline
- `ComposedChart` for compensation range + market overlay

---

## 5. Prioritized Roadmap

### MVP (Phase 1) - "Make the Existing Report Exceptional"

**Goal:** Enhance current report with highest-impact additions using existing data.

| Priority | Section | Effort | Data Ready? |
|----------|---------|--------|-------------|
| 1 | **Candidate vs. Requirements Comparison** | Medium | Yes (job context + candidate) |
| 2 | **Technical Signal Strength** | Medium | Yes (GitHub data via personalityService) |
| 3 | **Risk Assessment Dashboard** (upgrade) | Low | Yes (RiskAssessment interface exists) |
| 4 | **Availability & Engagement** | Low | Yes (behavioralSignalsService) |
| 5 | **Career Trajectory Timeline** (upgrade) | Medium | Partial (need temporal data) |

**Estimated Scope:** 5 new/enhanced sections, all using existing data pipelines.

### Phase 2 - "Evidence-Based Depth"

**Goal:** Add communication quality analysis and enhanced interview preparation.

| Priority | Section | Effort | Data Ready? |
|----------|---------|--------|-------------|
| 6 | **Communication Quality** | High | Partial (need PR/README parsing) |
| 7 | **Interview Guide** (upgrade) | Medium | Partial (need categorization) |
| 8 | **Core Skills Heat Map** (upgrade) | Low | Yes (skill data exists) |

**Estimated Scope:** Deep GitHub content analysis, new parsing pipelines.

### Phase 3 - "Market Intelligence"

**Goal:** Add external data sources for compensation and market context.

| Priority | Section | Effort | Data Ready? |
|----------|---------|--------|-------------|
| 9 | **Compensation Context** (upgrade) | High | No (need external API) |
| 10 | **Team Compatibility** (vs existing team) | High | No (need team profiles) |

**Estimated Scope:** External API integrations, team-level data modeling.

---

## 6. Report Section Ordering (Recommended)

Optimal reading order for the full report:

```
1. HEADER (existing)
   - Name, role, company, location, score ring
   - Skills tags

2. EXECUTIVE SUMMARY (existing, enhanced)
   - Archetype + reasoning
   - Psychometric grid (4 indicators)
   - NEW: 1-2 sentence "send to hiring manager" summary

3. CANDIDATE vs. REQUIREMENTS (new)
   - Match matrix
   - Gap analysis

4. ALIGNMENT BREAKDOWN (existing)
   - 5-component bar chart

5. TECHNICAL SIGNAL STRENGTH (new)
   - GitHub activity, code quality, OSS impact

6. BIG FIVE PERSONALITY (existing)
   - Radar chart + trait bars

7. TEAM FIT ANALYSIS (existing)
   - Communication, work approach, leadership, risk

8. CAREER TRAJECTORY (existing, enhanced)
   - Timeline visualization + growth signals

9. CORE SKILLS MATRIX (existing, enhanced)
   - Skill grid with heat map

10. STRENGTHS & RISKS (existing, enhanced → Risk Dashboard)
    - Green flags / structured risk assessment

11. AVAILABILITY & ENGAGEMENT (new)
    - Hot/Warm/Cold signal + evidence

12. COMMUNICATION QUALITY (new, Phase 2)
    - Evidence-based writing assessment

13. INTERVIEW PREPARATION (existing, enhanced)
    - Categorized questions + probe areas

14. COMPENSATION CONTEXT (existing, enhanced Phase 3)
    - Salary band + market comparison

15. KEY EVIDENCE & CITATIONS (existing)
    - Supporting evidence with sources

16. CONFIDENCE & DATA QUALITY (new)
    - Data source transparency + confidence scores
```

---

## 7. EU AI Act Compliance Notes

All report sections must maintain compliance with the EU AI Act profiling requirements:

- **Evidence Linking**: Every AI-generated claim must cite its data source (already implemented via `PersonaV2` with `CitedClaim`)
- **Confidence Scores**: Display data quality/confidence alongside all AI-derived insights
- **Audit Trail**: All report generations logged via `auditService.ts`
- **Human Override**: Reports are decision-support, not automated decisions
- **Explainability**: Each section should explain HOW the insight was derived
- **Data Source Transparency**: Clear indication of which data sources informed each section

The existing `DataSourceConfidence` interface already tracks source availability and quality. The report should surface this prominently.

---

## 8. Wireframe: Enhanced Report Layout

```
+------------------------------------------------------------------+
|  [RecruitOS Logo]    Virtual Personality Profile    [Date/Views]  |
+------------------------------------------------------------------+
|                                                                    |
|  [Avatar]  Name, Role @ Company                    [Score Ring]   |
|            Location | Experience                    [  87  ]      |
|            [skill] [skill] [skill] [skill]         [Excellent]    |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  EXECUTIVE SUMMARY                                                 |
|  +---------------------------------------------+                  |
|  | Archetype: "The Architect"                   |                  |
|  | One-line: "Senior-level systems thinker      |                  |
|  |  with strong OSS track record..."            |                  |
|  +---------------------------------------------+                  |
|  | Comms  | Motivator | Risk    | Leadership   |                  |
|  | Direct | Impact    | High    | Strong       |                  |
|  +--------+-----------+---------+--------------+                  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  CANDIDATE vs. REQUIREMENTS                                       |
|  +------------------+----------+----------------------------+      |
|  | Requirement      | Match    | Evidence                   |      |
|  +------------------+----------+----------------------------+      |
|  | React 3+ years   | [check]  | 5 repos, 4yr active       |      |
|  | TypeScript        | [check]  | Primary lang in 8 repos   |      |
|  | AWS experience    | [warn]   | 1 repo with AWS config    |      |
|  | 5+ years exp      | [check]  | 7 years estimated         |      |
|  | Team lead exp     | [x]      | No evidence found         |      |
|  +------------------+----------+----------------------------+      |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  ALIGNMENT BREAKDOWN          | TECHNICAL SIGNAL STRENGTH         |
|  Skills    ████████░░  82%    | Code Activity    ████████░  85    |
|  Experience █████████░  91%   | OSS Impact       ██████░░░  62    |
|  Industry  ████████░░  78%    | Code Quality     ███████░░  74    |
|  Seniority █████████░  88%    | Collaboration    █████░░░░  51    |
|  Location  ██████░░░░  63%    | [activity sparkline ~~~~~~~~]    |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  BIG FIVE PERSONALITY                                             |
|  [Radar Chart]    |  Openness         8.2/10  ████████░░          |
|       /\          |  Conscientiousness 7.5/10  ███████░░░          |
|      /  \         |  Extraversion      5.1/10  █████░░░░░          |
|     /    \        |  Agreeableness     6.8/10  ██████░░░░          |
|      \  /         |  Stability         7.9/10  ███████░░░          |
|       \/          |                                                |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  RISK ASSESSMENT DASHBOARD                                        |
|  Attrition: [LOW ●○○]  Skill Stale: [MOD ○●○]  Comp: [LOW ●○○] |
|                                                                    |
|  Flight Risk Factors:                                             |
|  - Overqualified for mid-level roles (moderate)                   |
|  - High growth velocity may seek promotion (low)                  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  AVAILABILITY          | INTERVIEW PREP                           |
|  [HOT] Active on GH    | Behavioral | Technical | Culture | Ice  |
|  Last commit: 2 days   | Q1: Tell me | Q1: Design| Q1: How | ... |
|  Open to Work: Yes     | about a     | a system  | do you  |     |
|  Engagement: High      | time you... | that...   | handle..|     |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 9. Summary of Recommendations

### Immediate Wins (Low Effort, High Impact)
1. Add "send-to-hiring-manager" one-liner to Executive Summary
2. Upgrade Risk Assessment from flat list to severity-weighted dashboard
3. Add Availability/Engagement section with traffic light badge
4. Reorder sections to put Candidate vs. Requirements near top

### Medium-Term Enhancements
5. Build Technical Signal Strength section from existing GitHub data
6. Create Career Trajectory timeline visualization
7. Categorize interview questions (behavioral/technical/culture/ice-breakers)
8. Add Candidate vs. Requirements comparison matrix

### Long-Term Vision
9. Communication Quality analysis (GitHub content parsing)
10. Compensation benchmarking with external market data
11. Team Compatibility comparison (requires team profile modeling)
12. "Smart Summary" - AI-generated narrative that adapts to viewer role (recruiter vs. hiring manager vs. HR)

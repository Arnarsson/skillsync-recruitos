# Data Source Transparency & Confidence Scoring Audit

**Task:** Audit #3 - Data source transparency and confidence scoring
**Context:** Address the psychologist's "short map" problem — any profile is a simplification. Users need to see what data was used and how much was available.
**Date:** 2026-02-16
**Status:** Complete

---

## Executive Summary

RecruitOS currently collects data from 3 primary sources (GitHub, LinkedIn, AI inference) but provides **limited visibility** to users about:
- **When** data was fetched
- **How complete** each data source is
- **What's missing** from the profile
- **How stale** the data might be

A profile built from 5 years of GitHub activity is fundamentally different from one built on 3 repos, yet this distinction is not surfaced to users. This creates the "short map" problem — users can't judge the reliability of AI-generated insights without understanding the underlying data quality.

**Key Gap:** Data source badges exist but lack timestamps, staleness warnings, and completeness indicators.

---

## 1. What Data Comes From GitHub API?

**Source Files:** `lib/github.ts`, API routes in `app/api/developers/`

### Basic Profile Data
```typescript
interface GitHubUser {
  id, login, name, avatar_url, bio, location, company,
  blog, twitter_username, public_repos, followers,
  following, created_at
}
```

**Fetched via:** `octokit.users.getByUsername()`

### Repository Data
```typescript
interface GitHubRepo {
  name, full_name, description, html_url,
  stargazers_count, forks_count, language, topics
}
```

**Fetched via:** `octokit.repos.listForUser()` (up to 100 repos)

### Deep GitHub Analysis
```typescript
interface GitHubDeepAnalysis {
  commitActivity: {
    totalCommits, avgCommitsPerWeek, mostActiveDay,
    mostActiveHour, commitsByDay, recentCommitDates
  },
  pullRequests: { totalOpened, totalMerged, avgMergeTime, recentPRs },
  codeReview: { reviewsGiven, commentsGiven, avgResponseTime },
  contributionPatterns: { consistency, streak, longestStreak, activeMonths },
  collaborationStyle: { soloProjects, teamProjects, opensourceContributions },
  topLanguages: Array<{ name, percentage, repoCount }>
}
```

**Fetched via:** `octokit.activity.listPublicEventsForUser()` (last 100 events, ~30 days)

### Behavioral Signals
```typescript
interface ActivitySignals {
  openToWork: boolean,
  confidence: 'high' | 'medium' | 'low',
  signals: string[], // Bio keywords, company changes, activity trends
  lastProfileUpdate: string | null,
  activityTrend: 'increasing' | 'stable' | 'decreasing',
  recentActivityCount: number
}
```

**Data Recency:** GitHub events API only returns ~100 recent events (typically last 30-60 days). Historical analysis is **limited**.

---

## 2. What Data Comes From LinkedIn/BrightData?

**Source Files:** `services/scrapingService.ts`, `app/api/brightdata/`

### 4-Tier Scraping Strategy

RecruitOS uses a progressive fallback approach to extract LinkedIn profiles:

#### Tier 1: Simple WebFetch
- Direct HTTP fetch with basic proxy
- Fast but often blocked by LinkedIn's authwall
- **Success rate:** ~10-20% for public profiles

#### Tier 2: Browser Simulation
- Custom headers mimicking real browsers
- **Success rate:** ~30-40% for partially visible profiles

#### Tier 3: BrightData Web Unlocker
- Commercial proxy with anti-detection
- **Success rate:** ~60-70% for public profiles
- **Cost:** Higher API usage

#### Tier 4: BrightData Dataset API
- Most reliable, triggers LinkedIn scraping job
- Polls for completion (up to 30 seconds)
- **Success rate:** ~90%+ for public profiles
- **Cost:** Highest API usage

### LinkedIn Profile Data Extracted
```typescript
interface BrightDataProfile {
  // Identity
  name, full_name, headline, position, title,
  current_company, location, about, summary, bio,

  // Experience
  experience: [{
    title, company, start_date, end_date,
    duration, description, location, is_current
  }],

  // Education
  education: [{
    school, degree, field_of_study,
    start_year, end_year, description, grade
  }],

  // Skills & Credentials
  skills: string[],
  skill_list: string[],
  certifications: [{ title, issuer, credential_url }],
  courses: [{ title, subtitle }],

  // Network Context
  followers, connections,
  people_also_viewed: [{ name, profile_link, about, location }],

  // Metadata
  linkedin_id, url, avatar, default_avatar
}
```

### Data Quality Assessment

The system automatically assesses profile completeness:

```typescript
function assessDataQuality(profile: BrightDataProfile) {
  checks = {
    hasExperience: experience.length > 0,
    hasSkills: skills.length > 0,
    hasAbout: about/summary exists,
    hasEducation: education.length > 0
  }

  score = count(checks) // 0-5
  isRich = hasExperience && (hasSkills || hasAbout)
}
```

**Profile Outcomes:**
- `auto_full` - Complete LinkedIn profile (experience + skills/about)
- `auto_partial` - Some data available, lower confidence
- `manual_required` - No usable public data found

### Enrichment Pipeline (Fallback)

When LinkedIn scraping fails or returns sparse data:

```typescript
// Uses enrichmentServiceV2.ts
enrichCandidatePersona({
  fullName, linkedinUrl, jobContext
})
→ Web search for public sources
→ AI extraction from text snippets
→ Evidence-backed persona generation
```

**Enrichment Sources:** Company websites, GitHub, Medium, Dev.to, conference talks, news articles

---

## 3. What Data Comes From Deep Research (AI)?

**Source Files:** `services/geminiService.ts`, `lib/services/gemini/`

### AI-Generated Analysis (Google Gemini)

#### Alignment Scoring
```typescript
interface ScoreBreakdown {
  skills: { value, max, percentage, reasoning },
  experience: { value, max, percentage, reasoning },
  industry: { value, max, percentage, reasoning },
  seniority: { value, max, percentage, reasoning },
  location: { value, max, percentage, reasoning }
}
```

**Input:** GitHub profile + LinkedIn data (if available) + job context
**Output:** 0-100 alignment score with weighted component breakdown
**Model:** `gemini-3.5-flash-latest` with structured JSON schema

#### Psychometric Profiling
```typescript
interface Persona {
  archetype: string,
  psychometric: {
    communicationStyle, primaryMotivator,
    riskTolerance, leadershipPotential
  },
  softSkills: string[],
  redFlags: string[],
  greenFlags: string[],
  reasoning: string,

  // Enhanced (Sprint 2)
  careerTrajectory: {
    growthVelocity, promotionFrequency, roleProgression,
    industryPivots, leadershipGrowth, averageTenure
  },
  skillProfile: {
    coreSkills, emergingSkills, deprecatedSkills,
    skillGaps, adjacentSkills, depthVsBreadth
  },
  riskAssessment: {
    attritionRisk, flightRiskFactors, skillObsolescenceRisk,
    geographicBarriers, unexplainedGaps
  },
  compensationIntelligence: {
    impliedSalaryBand, compensationGrowthRate,
    equityIndicators, likelySalaryExpectation
  }
}
```

**Confidence Levels:**
- **High confidence:** 2+ data sources, 5+ years of history, rich LinkedIn
- **Moderate confidence:** 1-2 data sources, 2-4 years of history
- **Low confidence:** Single source or sparse data (<3 repos, minimal LinkedIn)

#### Evidence-Linked Persona (EU AI Act Compliance)
```typescript
interface PersonaV2 {
  psychometricEvidence: {
    communicationStyle: {
      value: string,
      confidence: number,
      evidence: CitedClaim[],
      reasoning: string
    },
    // ... same for other traits
  },
  dataSources: [{
    type: 'github' | 'linkedin' | 'resume' | 'manual',
    url?: string,
    dataQuality: number // 0-100
  }]
}
```

#### Company Match Analysis
```typescript
interface CompanyMatch {
  score: number,
  analysis: string,
  strengths: string[],
  potentialFriction: string[]
}
```

#### Interview Guide Generation
```typescript
interface InterviewQuestion {
  topic: string,
  question: string,
  reason: string // Why this matters based on candidate's background
}
```

---

## 4. How is Data Freshness Tracked?

### Database Timestamps (Prisma Schema)

```prisma
model Candidate {
  // Standard Prisma timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Custom capture timestamp
  capturedAt      DateTime  @default(now())

  // NO lastFetched per data source
}
```

**Current State:**
- ✅ `createdAt` - When candidate was first added to database
- ✅ `updatedAt` - Last modification to ANY field
- ✅ `capturedAt` - When profile was initially captured
- ❌ `github.lastFetched` - NOT TRACKED
- ❌ `linkedin.lastFetched` - NOT TRACKED
- ❌ `persona.generatedAt` - Field exists in types but NOT persisted to DB

### Type Definitions (types.ts)

```typescript
interface DataSourceConfidence {
  github: {
    available: boolean,
    confidence: number,
    lastFetched?: string, // DEFINED but NOT IMPLEMENTED
    dataPoints: { repos, commits, contributions, hasActivity }
  },
  linkedin: {
    available: boolean,
    confidence: number,
    lastFetched?: string, // DEFINED but NOT IMPLEMENTED
    dataPoints: { hasProfile, hasExperience, hasSkills }
  },
  primarySource: 'github' | 'linkedin' | 'manual' | 'mixed',
  overallQuality: number
}

interface NetworkGraph {
  // ... network data ...
  generatedAt: string,
  dataFreshness: 'live' | 'cached' | 'stale' // DEFINED but NOT IMPLEMENTED
}
```

**Gap:** Type definitions exist for freshness tracking, but **not populated or persisted**.

---

## 5. Is There User Indication of Data Quality/Completeness?

### Current UI Components

#### DataSourceBadges Component
**File:** `components/DataSourceBadges.tsx`

```tsx
<DataSourceBadges dataSourceConfidence={candidate.dataSourceConfidence} />
```

**What It Shows:**
- ✅ GitHub icon + checkmark if available
- ✅ LinkedIn icon + checkmark if available
- ✅ Manual icon + checkmark if data manually entered
- ✅ Confidence percentage per source (0-100%)
- ✅ Overall quality badge (70%+ green, 40-69% yellow, <40% red)
- ✅ Tooltip with data point counts:
  - GitHub: "X repos, Y commits"
  - LinkedIn: "Profile found (Z% confidence)"

**What It DOESN'T Show:**
- ❌ When data was last fetched
- ❌ Staleness warnings ("Data from 3 months ago")
- ❌ Activity volume context ("Based on 5 repos" vs "Based on 200 repos")

#### ScoreExplainer Component
**File:** `components/ScoreExplainer.tsx`

```tsx
<ScoreExplainer candidate={candidate} isOpen={isOpen} onClose={onClose} />
```

**What It Shows:**
- ✅ Score confidence badge: "High Confidence" | "Moderate" | "Low"
- ✅ Score drivers (what boosted the score)
- ✅ Score drags (what lowered the score)
- ✅ Component breakdown (skills, experience, industry, seniority, location)
- ✅ Evidence links to GitHub repos

**What It DOESN'T Show:**
- ❌ Data completeness percentage (e.g., "Missing LinkedIn skills section")
- ❌ Explicit warning when data is sparse
- ❌ Timestamp of when score was generated

#### Profile Page
**File:** `app/profile/[username]/page.tsx`

**What It Shows:**
- ✅ Basic GitHub stats (repos, stars, contributions)
- ✅ LinkedIn profile if connected
- ✅ Psychometric profile if generated
- ✅ Data source badges (via `<DataSourceBadges />`)

**What It DOESN'T Show:**
- ❌ "Last updated: X days ago"
- ❌ "GitHub data from: [date]"
- ❌ Warning: "Limited data available — score may be less reliable"

---

## 6. What Does the Candidate Profile UI Show?

### Profile Page Structure

```
┌─────────────────────────────────────────────┐
│ Header: Name, Role, Company, Location      │
│ Avatar + Basic Info                         │
│                                              │
│ ✅ GitHub Stats (repos, stars, followers)   │
│ ✅ LinkedIn Badge (if connected)            │
│ ✅ Data Source Badges (GitHub/LinkedIn/Manual) │
│                                              │
│ ❌ NO timestamp visible                     │
│ ❌ NO staleness warning                     │
│ ❌ NO activity volume indicator             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Tabs: Overview | Deep Profile | Network    │
│                                              │
│ Overview Tab:                               │
│ - Top repos (with stars, language)          │
│ - Skills extracted from repos               │
│ - Psychometric profile (if generated)       │
│                                              │
│ Deep Profile Tab:                           │
│ - Alignment score (0-100)                   │
│ - Score breakdown (skills, experience, ...)  │
│ - Interview guide                           │
│ - Company match analysis                    │
│                                              │
│ ❌ NO "data completeness" indicator         │
│ ❌ NO "confidence" warning for sparse data  │
└─────────────────────────────────────────────┘
```

### Inline Pipeline View

**File:** `components/pipeline/CandidatePipelineItem.tsx`

Uses `<Expandable>` component for inline profile viewing:

```tsx
<Expandable onExpandStart={() => fetchDeepProfile(candidate.id)}>
  {/* Collapsed: avatar, name, score */}
  {/* Expanded: AI analysis, psychometric profile, interview guide */}
</Expandable>
```

**Data Shown:**
- ✅ Alignment score with color coding
- ✅ Data source indicator (compact icons)
- ✅ Key evidence bullets
- ✅ Risk/gap indicators

**Data NOT Shown:**
- ❌ When profile was last updated
- ❌ Data completeness warnings

---

## 7. Gap Analysis: What Needs to Change?

### Critical Gaps

#### 1. **No User-Visible Timestamps**
**Problem:** Users can't tell if they're looking at fresh data or stale cached profiles.

**Impact:** A profile from 6 months ago may no longer reflect the candidate's current situation (new job, new skills, career change).

**Solution Needed:**
```tsx
<ProfileHeader>
  <DataSourceBadges ... />
  <TimestampIndicator>
    GitHub data: 2 days ago (fresh)
    LinkedIn data: 3 months ago (stale) ⚠️
    Score generated: 5 days ago
  </TimestampIndicator>
</ProfileHeader>
```

#### 2. **No Staleness Warnings**
**Problem:** Old data is presented as if it's current.

**Example:** Candidate changed jobs 2 months ago, but LinkedIn wasn't re-scraped. System still shows old company.

**Solution Needed:**
```tsx
{dataAge > 30 && (
  <Alert variant="warning">
    This profile was last updated {dataAge} days ago.
    Data may be outdated. <Button>Refresh</Button>
  </Alert>
)}
```

#### 3. **No Activity Volume Context**
**Problem:** A score based on 5 repos should be flagged as less reliable than one based on 200 repos.

**Example:**
- Candidate A: 5 repos, 10 commits → 85 alignment score
- Candidate B: 200 repos, 5000 commits → 85 alignment score

Same score, VERY different confidence levels.

**Solution Needed:**
```tsx
<ConfidenceIndicator>
  Score based on: 5 repos, 47 commits (low sample size)
  ⚠️ Limited data — score may be less reliable
</ConfidenceIndicator>
```

#### 4. **No Explicit "Low Confidence" Warnings**
**Problem:** `scoreConfidence` field exists but is only shown in `ScoreExplainer` sheet (not inline).

**Solution Needed:**
```tsx
{candidate.scoreConfidence === 'low' && (
  <Badge variant="warning">
    Low Confidence Score
    <Tooltip>
      This score is based on limited public data.
      Consider requesting a CV or LinkedIn profile.
    </Tooltip>
  </Badge>
)}
```

#### 5. **No "Live" vs "Cached" Indicator**
**Problem:** `dataFreshness` enum exists in types but never implemented.

**Solution Needed:**
```tsx
<Badge variant={isCached ? "secondary" : "success"}>
  {isCached ? "Cached" : "Live"} Data
</Badge>
```

#### 6. **No Data Completeness Percentages**
**Problem:** Users don't know what's missing from the profile.

**Example:**
```
LinkedIn Profile: 60% complete
✅ Experience
✅ Education
❌ Skills (missing)
❌ Certifications (missing)
```

**Solution Needed:**
```tsx
<DataCompletenessPanel>
  <ProgressBar value={60} label="LinkedIn: 60% complete" />
  <MissingDataList>
    <li>Skills section not public</li>
    <li>No certifications visible</li>
  </MissingDataList>
</DataCompletenessPanel>
```

#### 7. **The "Short Map" Problem**
**Problem:** AI-generated insights (psychometric profile, company match) are presented without context about the underlying data quality.

**Example:** "Communication Style: Collaborative" shown with same visual weight whether it's based on:
- 5 years of GitHub activity + rich LinkedIn OR
- 3 repos with no LinkedIn

**Solution Needed:**
```tsx
<PsychometricCard>
  <TraitCard trait="Communication Style: Collaborative">
    <ConfidenceBar value={0.85} label="High confidence" />
    <EvidenceTooltip>
      Based on:
      - 47 PRs with detailed comments (GitHub)
      - LinkedIn headline mentions "team player"
      - 3 conference talks found
    </EvidenceTooltip>
  </TraitCard>
</PsychometricCard>
```

---

## Recommendations

### Phase 1: Foundation (1-2 weeks)
1. **Add `lastFetched` timestamps to database**
   ```prisma
   model Candidate {
     githubFetchedAt   DateTime?
     linkedinFetchedAt DateTime?
     scoreFetchedAt    DateTime?
   }
   ```

2. **Populate timestamps on data fetch**
   ```typescript
   // In lib/github.ts
   await updateCandidate(username, {
     githubFetchedAt: new Date()
   });

   // In scrapingService.ts
   await updateCandidate(username, {
     linkedinFetchedAt: new Date()
   });
   ```

3. **Add staleness detection helper**
   ```typescript
   function getDataStaleness(fetchedAt: Date) {
     const days = daysSince(fetchedAt);
     if (days < 7) return { level: 'fresh', color: 'green' };
     if (days < 30) return { level: 'recent', color: 'yellow' };
     return { level: 'stale', color: 'red' };
   }
   ```

### Phase 2: UI Visibility (1 week)
1. **Update `DataSourceBadges` to show timestamps**
   ```tsx
   <Tooltip>
     GitHub: 12 repos, 347 commits
     Last updated: 2 days ago (fresh) ✅
   </Tooltip>
   ```

2. **Add staleness warnings to profile header**
   ```tsx
   {isStale && (
     <Alert variant="warning">
       LinkedIn data is 3 months old.
       <Button onClick={refetch}>Refresh Profile</Button>
     </Alert>
   )}
   ```

3. **Add activity volume indicators**
   ```tsx
   <Badge>
     Score based on {repoCount} repos
     {repoCount < 10 && "⚠️ (small sample)"}
   </Badge>
   ```

### Phase 3: Confidence Transparency (2 weeks)
1. **Surface low-confidence warnings inline**
   ```tsx
   {scoreConfidence === 'low' && (
     <Banner variant="warning">
       Limited data available — this score may be less reliable.
       Consider requesting the candidate's CV.
     </Banner>
   )}
   ```

2. **Add data completeness panel to profile**
   ```tsx
   <DataCompletenessCard>
     <CompletionBar source="github" percent={100} />
     <CompletionBar source="linkedin" percent={45} missing={['skills', 'certs']} />
   </DataCompletenessCard>
   ```

3. **Link psychometric traits to evidence sources**
   ```tsx
   <TraitWithEvidence trait="Collaborative">
     <EvidencePopover>
       Based on:
       - 23 PRs with detailed code reviews (GitHub)
       - Headline mentions "team-oriented" (LinkedIn)
       Confidence: 85%
     </EvidencePopover>
   </TraitWithEvidence>
   ```

### Phase 4: "Refresh Data" Feature (1 week)
1. **Add refresh button to stale profiles**
   ```tsx
   <Button onClick={() => refetchProfile(candidateId)}>
     Refresh Data
   </Button>
   ```

2. **Background refresh job for active candidates**
   ```typescript
   // Refresh profiles in active pipeline stages every 7 days
   cron.schedule('0 2 * * *', async () => {
     const staleCandidates = await getCandidatesWithStaleData();
     for (const candidate of staleCandidates) {
       await refetchGitHub(candidate);
       await refetchLinkedIn(candidate);
     }
   });
   ```

---

## Compliance & Ethics Notes

### EU AI Act Considerations

**Current State:**
- ✅ `PersonaV2` includes evidence-linked psychometric traits
- ✅ `CitedClaim` interface tracks source URLs for verification
- ✅ `dataSourceConfidence` tracks which sources were used

**Gaps:**
- ❌ Evidence links not shown in UI (stored but not surfaced)
- ❌ No "contestability" mechanism (users can't flag incorrect data)
- ❌ No audit trail of score changes over time

**Recommendation:**
1. Add "View Evidence" button to psychometric traits
2. Add "Report Incorrect Data" button to profiles
3. Track score history in database (not just latest score)

---

## Conclusion

RecruitOS has a **solid data infrastructure** with:
- Multi-source data collection (GitHub, LinkedIn, AI)
- Quality assessment logic
- Confidence scoring

**BUT** it lacks **user-facing transparency** about:
- Data freshness (timestamps)
- Data completeness (what's missing)
- Confidence levels (when to trust the score)

The "short map" problem is **partially solved** (confidence exists in the backend) but **not communicated** to users effectively.

**Priority 1:** Add timestamps + staleness warnings
**Priority 2:** Surface confidence levels inline
**Priority 3:** Show data completeness + missing sections

This will give users the context they need to interpret AI-generated insights responsibly.

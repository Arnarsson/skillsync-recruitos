# Audit: "Psychometric" Terminology and Profiling Code

**Auditor**: researcher (teammate)
**Date**: 2026-02-16
**Context**: Organizational psychologist feedback that "psychometric profile" overclaims what GitHub + LinkedIn data can show. This audit maps all uses of psychometric/persona/personality terminology to enable rename from "psychometric profile" → "behavioral profile".

---

## 1. Files Using Psychometric/Profiling Terminology

### Core Service Layer (AI Generation)

**`services/geminiService.ts`** (922 lines)
- **Function**: `generatePersona(rawProfileText: string): Promise<Persona>`
  - Lines 301-521
  - Uses OpenRouter API
  - Generates "psychometric profile" with 12 archetype categories
  - Output includes: `psychometric` object with `communicationStyle`, `primaryMotivator`, `riskTolerance`, `leadershipPotential`
  - Also generates: `careerTrajectory`, `skillProfile`, `riskAssessment`, `compensationIntelligence`

**`services/ai/profiling.ts`** (437 lines)
- Duplicate/modular version of persona generation
- Same `generatePersona()` function (lines 12-237)
- Same `generateDeepProfile()` function (lines 243-318)
- Same `generateNetworkDossier()` function (lines 324-436)
- **Status**: Appears to be newer modular architecture

**`services/personalityService.ts`** (524 lines)
- **Different approach**: Rule-based personality analysis from GitHub data
- No AI calls - pure computation from commit patterns, repo data
- Generates `PersonalityProfile` with 5 dimensions:
  - `communicationStyle`, `workPattern`, `collaborationScore`, `technicalProfile`, `initiative`
- Each dimension has 0-100 score + sublabel + traits with evidence
- Returns `personaTag` like "Night-owl polyglot"
- **Key distinction**: This is genuinely behavioral (derived from observable GitHub activity)

**`lib/psychometrics.ts`** (635 lines)
- Rule-based psychometric profile engine
- `generatePsychometricProfile()`: Uses GitHub signals + LinkedIn data
- `analyzeGitHubSignals()`: Extracts behavioral signals from repos
- `generateAIPsychometricProfile()`: Calls Gemini AI for enhanced insights
- Uses 8 archetype categories: Architect, Optimizer, Collaborator, Pioneer, Craftsman, Mentor, Strategist, Specialist
- **Terminology**: Heavy use of "psychometric" throughout

**`prompts/personaGenPrompt.ts`** (191 lines)
- Prompt template for persona generation
- Line 2: "psychometric profile"
- Line 64: "**Psychometric Profile**: Analyze communication style, motivations..."
- Defines schema with `psychometric_profile` object
- Contains archetype selection guide (12 archetypes)

### API Routes

**`app/api/profile/psychometric/route.ts`** (92 lines)
- POST endpoint: `/api/profile/psychometric`
- Calls `generateAIPsychometricProfile()` from `lib/psychometrics.ts`
- Returns full psychometric profile based on GitHub username

**`app/api/profile/analyze/route.ts`**
- Uses `analyzeCandidateProfile()` which can trigger persona generation
- References "persona" in context building

### UI Components

**`components/PsychometricCard.tsx`** (530 lines)
- Full UI for displaying psychometric profile
- Props: `PsychometricProfile` from `lib/psychometrics.ts`
- Displays: archetype, work style radar chart, motivators/stressors, green/red flags, interview questions, outreach tips
- Uses term "Psychometric Profile" in imports/types
- **Visual representation**: Confidence ring, archetype icons, work style chart

**`components/PersonalityProfileCard.tsx`** (339 lines)
- Displays `PersonalityProfile` from `services/personalityService.ts`
- UI labels: "Personality Profile", "Dimension Breakdown"
- Line 332: "Profile generated from public GitHub activity"
- **Key difference**: Explicitly states it's from "public GitHub activity" — more transparent about data source

**`components/BehavioralBadges.tsx`** (385 lines)
- **Uses correct terminology**: "behavioral" throughout
- Displays "Open to Work" badge, engagement score, activity trend
- Comment (line 2): "Behavioral Signals Service - Real-time Activity Tracking"
- No psychometric language — all about observable behavior

### Type Definitions

**`types.ts`** (lines 1-200 shown)
- `Persona` interface (line 173-191):
  ```typescript
  psychometric: {
    communicationStyle: string;
    primaryMotivator: string;
    riskTolerance: string;
    leadershipPotential: string;
  };
  ```
- Also includes `CareerTrajectory`, `SkillProfile`, `RiskAssessment`, `CompensationIntelligence`
- Line 200: "EVIDENCE-LINKED PSYCHOMETRIC TRAITS (EU AI Act Compliance)"

### Locale Files

**`locales/en.json`** (lines 1-100 shown)
- Line 82: "5 behavioral indicators reveal collaboration style..."
- **Uses "behavioral" in user-facing copy** — already correct!

### Test Files

**`tests/api/psychometric.test.ts`** - Test file for psychometric API

### Documentation

Multiple docs mention "psychometric":
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/ARCHITECTURE.md`
- `research/PRODUCT_STRATEGY.md`
- `research/EU_AI_ACT_COMPLIANCE_ROADMAP.md`
- `research/COMPETITIVE_ANALYSIS.md`
- `CLAUDE.md` - Main project documentation

---

## 2. Data Flow: Profile Generation

### Flow 1: AI-Generated Persona (Currently "Psychometric Profile")

```
User Action (LinkedIn URL or resume text)
    ↓
app/api/profile/analyze/route.ts
    ↓
services/geminiService.ts::analyzeCandidateProfile()
    ↓
services/enrichmentServiceV2.ts::enrichCandidatePersona() [if LinkedIn URL]
    ↓
services/geminiService.ts::generatePersona(rawProfileText)
    ↓
OpenRouter API call with structured schema
    ↓
Persona object {
  archetype: string,
  psychometric: { communicationStyle, primaryMotivator, riskTolerance, leadershipPotential },
  careerTrajectory, skillProfile, riskAssessment, compensationIntelligence,
  softSkills[], redFlags[], greenFlags[]
}
    ↓
Stored in Candidate.persona field
    ↓
Displayed via components/PsychometricCard.tsx
```

**Data Sources for AI Persona**:
- LinkedIn profile text (via BrightData scraping)
- Resume/CV text (user-provided)
- GitHub profile data (optional, used for context)

**What the AI sees**: Raw text blob (up to 30,000 chars)

**What the AI generates**: Narrative interpretation + categorization into predefined schemas

### Flow 2: Rule-Based Personality Profile (Actually Behavioral)

```
User navigates to profile/[username]
    ↓
app/api/profile/psychometric/route.ts
    ↓
lib/psychometrics.ts::generateAIPsychometricProfile()
    ↓
services/personalityService.ts::computePersonalityProfile()
    ↓
GitHub API calls:
  - GET /users/{username}
  - GET /users/{username}/repos
  - GET /users/{username}/events/public
    ↓
PersonalityProfile {
  communicationStyle: { score, sublabel, traits[] },
  workPattern: { score, sublabel, traits[] },
  collaborationScore: { score, sublabel, traits[] },
  technicalProfile: { score, sublabel, traits[] },
  initiative: { score, sublabel, traits[] },
  summary, personaTag, confidence
}
    ↓
Displayed via components/PersonalityProfileCard.tsx
```

**Data Sources**:
- GitHub user profile (bio, followers, repos count)
- Repository metadata (languages, topics, descriptions, stars, forks)
- Public events (PushEvent, PullRequestEvent, IssuesEvent)
- Commit timestamps (inferred from event data)

**Processing**: Pure algorithmic calculation (no AI)

**Evidence**: Each trait links back to specific data point (e.g., "57% repos have descriptions")

### Flow 3: Behavioral Signals (Correct Terminology)

```
User views candidate profile
    ↓
components/BehavioralBadges.tsx renders
    ↓
GET /api/github/signals?username={username}
    ↓
services/behavioralSignalsService.ts::collectBehavioralSignals()
    ↓
GitHub API calls + optional SERP searches
    ↓
BehavioralSignals {
  github: { totalContributions, contributionStreak, topLanguages, activityTrend },
  speakingEngagements[], jobChangeSignals[], contentActivity[],
  openToWorkSignal, engagementRecency, approachReadiness
}
    ↓
Displayed as badges (OpenToWork, Engagement Score, Activity Trend)
```

**Data Sources**:
- GitHub public activity (commits, PRs, issues, repos)
- LinkedIn profile changes (title, company, location, "Open to Work" banner)
- Conference speaking (SERP search results)
- Content creation (Medium, Dev.to, LinkedIn Pulse via SERP)

**Processing**: Mix of direct API data + search result inference

---

## 3. What Persona Generation Actually Does

### `generatePersona()` in services/geminiService.ts

**Input**: Raw profile text (LinkedIn HTML, resume text, or scraped content)

**Prompt Engineering** (lines 306-401):
- System role: "Expert Executive Recruiter preparing candidate briefing for CEO"
- Task: "Transform raw resume into a STORY with narrative arc"
- 12 archetype categories with selection criteria
- Analysis dimensions:
  1. Archetype (2-sentence elevator pitch)
  2. **"Psychometric Profile"** ← This is the problematic term
     - "Analyze communication style, motivations, risk tolerance, leadership potential from 'About' section and role descriptions"
  3. Career Trajectory (growth velocity, promotions, tenure patterns)
  4. Skill Profile (core skills, emerging/deprecated skills, gaps)
  5. Risk Assessment (attrition risk, flight risk, skill obsolescence)
  6. Compensation Intelligence (salary bands, equity expectations)
  7. Soft Skills & Flags (red/green flags)

**AI Output Schema** (lines 419-474):
```typescript
{
  persona_archetype: string,
  psychometric_profile: {
    communication_style: string,
    primary_motivator: string,
    risk_tolerance: string,
    leadership_potential: string
  },
  career_trajectory: {...},
  skill_profile: {...},
  risk_assessment: {...},
  compensation_intelligence: {...},
  soft_skills_analysis: string[],
  red_flags: string[],
  green_flags: string[]
}
```

**What it's NOT doing**:
- ❌ Administering validated psychometric tests (e.g., Big Five, DISC, Myers-Briggs)
- ❌ Using normed, calibrated measurement instruments
- ❌ Collecting self-report data from the candidate
- ❌ Measuring cognitive abilities or aptitudes

**What it IS doing**:
- ✅ Extracting behavioral indicators from written content
- ✅ Inferring patterns from career history
- ✅ Categorizing into predefined archetypes
- ✅ Generating hypotheses for interview probing
- ✅ Identifying red/green flags from observable data

### `generateDeepProfile()` in services/geminiService.ts

**Input**: Candidate object + job context

**Output** (lines 760-783):
```typescript
{
  indicators: WorkstyleIndicator[],
  questions: InterviewQuestion[],
  deepAnalysis: string,
  cultureFit: string,
  companyMatch: { score, reasons[], risks[] }
}
```

**Persona Integration** (lines 248-254 in ai/profiling.ts):
- If candidate has persona, includes it in prompt:
  ```
  PSYCHOMETRIC PERSONA:
  Archetype: ${candidate.persona.archetype}
  Communication: ${candidate.persona.psychometric.communicationStyle}
  Leadership: ${candidate.persona.psychometric.leadershipPotential}
  Motivator: ${candidate.persona.psychometric.primaryMotivator}
  ```

**Purpose**: Enriches deep profile with persona context for company fit analysis

---

## 4. GitHub Behavioral Signals vs AI-Generated Text

### Actually Behavioral (Evidence-Based)

**`services/personalityService.ts`**:
- **Bio expressiveness**: Character count of GitHub bio (line 125-131)
- **Repo documentation**: % of repos with descriptions >10 chars (line 134-141)
- **PR communication**: Average PR title length from recent PRs (line 144-153)
- **Discussion engagement**: Number of code review comments given (line 156-162)
- **Commit frequency**: Average commits per week (line 182-188)
- **Peak hours**: Most active hour of day (from event timestamps) (line 191-204)
- **Weekly rhythm**: Weekend vs weekday commit ratio (line 206-218)
- **Consistency**: Contribution streak calculation (line 221-228)
- **GitHub tenure**: Account age + repos per year (line 231-238)
- **Code reviews given**: Count from events (line 257-263)
- **PRs opened**: Count from events (line 266-272)
- **Team vs solo**: Ratio based on repo ownership (line 275-284)
- **Network influence**: Followers count (line 287-294)
- **Language diversity**: Unique languages across repos (line 313-325)
- **Topic breadth**: Unique repo topics (line 334-340)
- **Project scale**: Average repo size in KB (line 343-350)
- **Community traction**: Total stars across repos (line 353-359)
- **Original repos created**: Non-fork repos (line 382-388)
- **OSS contributions**: Fork repos (line 391-398)
- **Recent activity**: Repos pushed in last 6 months (line 401-408)

**Evidence Quality**: Each trait shows the calculation (e.g., "~5 commits/week", "42% repos have descriptions")

**`services/behavioralSignalsService.ts`**:
- **Contribution streak**: Consecutive days with activity (line 196-223)
- **Activity trend**: Comparing 30-day vs 60-day event counts (line 100-119)
- **Open source contributions**: External PRs (not owned by user) (line 139-160)
- **Top languages**: % distribution from repos (line 122-136)
- **Recent repos**: Last 5 updated repos (line 168-180)
- **Open to Work signal**: LinkedIn banner detection (line 411-419)
- **Profile updates**: Last updated timestamp (line 422-438)
- **Engagement recency**: Composite score from activity sources (line 522-563)
- **Approach readiness**: Likelihood to respond based on signals (line 568-605)

**Evidence Quality**: Direct API data with timestamps

### AI-Generated Interpretation (Not Behavioral)

**From `generatePersona()` prompt** (services/geminiService.ts lines 306-401):

**Psychometric Claims**:
- "Analyze communication style, motivations, risk tolerance, leadership potential from 'About' section and role descriptions" (line 77 in ai/profiling.ts)

**Problem**: The AI is reading *written text* (LinkedIn About, job descriptions) and inferring personality traits. This is:
- **Not psychometric**: No validated assessment instrument
- **Not behavioral**: Interprets self-presentation, not observed actions
- **Potentially behavioral**: Could be if it analyzed GitHub commit messages, PR descriptions, issue comments as *communication behavior*

**Archetype Selection**:
- 12 predefined categories with pattern matching
- Examples: "The Strategic Scaler 🚀", "The Hands-On Fixer 🔧", "The Domain Expert 📚"
- Selection criteria based on role titles, tenure patterns, language in descriptions
- **This is behavioral pattern recognition** (from career data)
- **NOT psychometric categorization**

**What's Actually Behavioral in the AI Output**:
- Career trajectory analysis (growth velocity, promotions, tenure)
- Skill profile (core skills with years active, emerging/deprecated skills)
- Risk assessment (flight risk factors like "job-hopper <2 years")
- Compensation intelligence (inferred from role/location/seniority)

**What Overclaims as Psychometric**:
- `psychometric.communicationStyle` — Inferred from text, not observed communication behavior
- `psychometric.primaryMotivator` — Speculative without validated assessment
- `psychometric.riskTolerance` — Cannot be reliably inferred from resume
- `psychometric.leadershipPotential` — Predictive claim without assessment data

---

## 5. Recommended Renames and Refactoring

### Phase 1: Terminology Changes (High Priority)

#### Type Definitions (`types.ts`)

**Current**:
```typescript
export interface Persona {
  archetype: string;
  psychometric: {
    communicationStyle: string;
    primaryMotivator: string;
    riskTolerance: string;
    leadershipPotential: string;
  };
  // ...
}
```

**Proposed**:
```typescript
export interface BehavioralProfile {  // Rename Persona → BehavioralProfile
  archetype: string;
  behavioralTraits: {  // Rename psychometric → behavioralTraits
    communicationPattern: string;  // More accurate: observed from content
    inferredMotivators: string;     // Clarify it's inferred
    workstyleFlexibility: string;   // More behavioral than "risk tolerance"
    leadershipIndicators: string;   // "Indicators" not "Potential"
  };
  careerTrajectory: CareerTrajectory;  // Keep - this is genuinely behavioral
  skillProfile: SkillProfile;          // Keep - this is genuinely behavioral
  riskAssessment: RiskAssessment;      // Keep - this is genuinely behavioral
  compensationIntelligence: CompensationIntelligence;  // Keep
  // ...
}
```

**Alternative naming for `behavioralTraits` sub-fields**:
- `communicationStyle` → `writingStyle` (more accurate - we analyze written text)
- `primaryMotivator` → `careerDrivers` (plural, less definitive)
- `riskTolerance` → `changeReadiness` or `stabilityPreference`
- `leadershipPotential` → `leadershipSignals` or `leadershipExperience`

#### Service Functions

**Current**: `generatePersona()` → **Proposed**: `generateBehavioralProfile()`
**Current**: `generatePsychometricProfile()` → **Proposed**: `generateBehavioralProfile()` (or `analyzeBehavioralPatterns()`)
**Current**: `generateAIPsychometricProfile()` → **Proposed**: `enhanceBehavioralProfile()` or `generateAIBehavioralInsights()`

#### Files to Rename

1. `lib/psychometrics.ts` → `lib/behavioral-analysis.ts`
2. `services/personalityService.ts` → `services/behavioralProfileService.ts` (this one is actually good!)
3. `components/PsychometricCard.tsx` → `components/BehavioralProfileCard.tsx`
4. `components/PersonalityProfileCard.tsx` → Keep or rename to `GitHubBehavioralCard.tsx` for clarity
5. `prompts/personaGenPrompt.ts` → `prompts/behavioralProfilePrompt.ts`
6. `tests/api/psychometric.test.ts` → `tests/api/behavioral-profile.test.ts`

#### API Routes

1. `/api/profile/psychometric` → `/api/profile/behavioral` (keep old route with deprecation notice)

#### Locale Strings

**Current** (already correct!):
```json
"discoverExperts": {
  "title": "Understand how they work — not just what they know",
  "description": "5 behavioral indicators reveal collaboration style, ownership and impact."
}
```

**No changes needed** - locale already uses "behavioral"!

### Phase 2: Prompt Engineering (Medium Priority)

#### Update Persona Generation Prompt

**Current** (`prompts/personaGenPrompt.ts` line 64):
```
2. **Psychometric Profile**: Analyze communication style, motivations, risk tolerance, leadership potential from "About" section and role descriptions.
```

**Proposed**:
```
2. **Behavioral Profile**: Analyze communication patterns (from written content), career drivers (from job progression), change tolerance (from tenure patterns), and leadership experience (from roles and team mentions) based on observable data.
```

**Schema changes**:
```typescript
// OLD
psychometric_profile: {
  communication_style: string,
  primary_motivator: string,
  risk_tolerance: string,
  leadership_potential: string
}

// NEW
behavioral_traits: {
  communication_pattern: string,
  career_drivers: string,
  stability_preference: string,
  leadership_indicators: string
}
```

#### Update AI System Prompts

**All prompts that mention "psychometric"** should be updated to:
- Use "behavioral profile" or "behavioral analysis"
- Clarify data sources: "based on LinkedIn profile text and career history"
- Add transparency: "These are inferences from observable data, not validated assessments"
- Frame as hypotheses: "Suggested areas to explore in interviews"

### Phase 3: UI Labels (High Priority - User-Facing)

#### Component Updates

**`components/PsychometricCard.tsx`**:
- Import statement: `PsychometricProfile` → `BehavioralProfile`
- No explicit UI label "Psychometric" visible in code (uses archetype names)
- Sections: "Work Style Profile", "Green Flags", "Areas to Explore", "Energizers vs Drains", "Interview Questions", "Outreach Tips"
- **Action**: Rename component file and prop types, but UI labels are already generic

**`components/PersonalityProfileCard.tsx`**:
- Line 251: `<CardTitle className="text-lg">Personality Profile</CardTitle>`
  - **Change to**: "Behavioral Profile" or "GitHub Activity Profile"
- Line 332: "Profile generated from public GitHub activity. Accuracy improves with more data points."
  - **Keep** - this is good transparency!

**New Component Labels**:
- "Psychometric Profile" → "Behavioral Profile"
- "Personality Profile" → "GitHub Behavioral Profile" (to distinguish from AI version)
- "Psychometric Analysis" → "Behavioral Analysis"

### Phase 4: Data Transparency (High Priority - EU AI Act)

#### Add Source Transparency to UI

**For AI-Generated Profiles**:
```tsx
<InfoBanner variant="transparent">
  <Info className="w-4 h-4" />
  <span>
    This behavioral profile is generated by AI from LinkedIn content and career history.
    It provides hypotheses for interview exploration, not validated assessments.
  </span>
</InfoBanner>
```

**For GitHub Profiles**:
```tsx
<InfoBanner variant="transparent">
  <Info className="w-4 h-4" />
  <span>
    Behavioral metrics calculated from {profile.confidence}% of available GitHub data
    (commits, repos, activity patterns).
    <Link href="/methodology">How we calculate this</Link>
  </span>
</InfoBanner>
```

#### Update Audit Logs

**Current** (`types.ts` line 200): "EVIDENCE-LINKED PSYCHOMETRIC TRAITS"

**Proposed**: "EVIDENCE-LINKED BEHAVIORAL TRAITS"

**Audit event types** to update:
- `PSYCHOMETRIC_GENERATED` → `BEHAVIORAL_PROFILE_GENERATED`
- Include data source in log: `{ source: 'linkedin_text' | 'github_activity' | 'resume_upload' }`

### Phase 5: Documentation Updates (Medium Priority)

#### Files to Update

1. **CLAUDE.md**:
   - Section "Core Services" mentions "Psychometric profiling" → "Behavioral profiling"
   - Update geminiService.ts description

2. **Research docs**:
   - `research/PRODUCT_STRATEGY.md`
   - `research/EU_AI_ACT_COMPLIANCE_ROADMAP.md`
   - `research/COMPETITIVE_ANALYSIS.md`

3. **Codebase docs**:
   - `.planning/codebase/STRUCTURE.md`
   - `.planning/codebase/ARCHITECTURE.md`

4. **Comments in code**:
   - Search for "psychometric" in comments and update to "behavioral"

### Phase 6: Migration Strategy

#### Backward Compatibility

**Option 1: Immediate Breaking Change**
- Rename all types, functions, files
- Update all references
- Run global find-replace
- **Risk**: High - breaks existing code if incomplete

**Option 2: Gradual Deprecation** (Recommended)
- Keep old names with `@deprecated` tags
- Add new names alongside
- Use type aliases: `export type Persona = BehavioralProfile; // @deprecated`
- Migration timeline: 2 sprints
  - Sprint 1: Add new names, mark old as deprecated
  - Sprint 2: Update all internal usage
  - Sprint 3: Remove deprecated names

**Example**:
```typescript
// types.ts

/**
 * @deprecated Use BehavioralProfile instead. This alias will be removed in v2.0.
 */
export type Persona = BehavioralProfile;

export interface BehavioralProfile {
  archetype: string;
  behavioralTraits: {
    communicationPattern: string;
    careerDrivers: string;
    stabilityPreference: string;
    leadershipIndicators: string;
  };
  // ...
}

// Old field name for backward compat
/**
 * @deprecated Use behavioralTraits instead
 */
export type PsychometricTraits = BehavioralProfile['behavioralTraits'];
```

#### Database Migration

**Prisma schema** (`prisma/schema.prisma`):
- If `persona` field is stored as JSON:
  - No schema change needed (JSON is schemaless)
  - Just update TypeScript types
- If there are specific columns:
  - Add new `behavioral_traits` column
  - Keep `psychometric` column for transition
  - Backfill data
  - Drop old column after migration

**Migration steps**:
1. Add new field names to schema
2. Update service layer to write to both fields
3. Backfill existing data
4. Update service layer to read from new fields
5. Drop old fields after verification

---

## 6. Summary of Findings

### What We Found

1. **Two separate systems with different approaches**:
   - **AI-generated "persona"**: Uses LLM to infer traits from LinkedIn/resume text
   - **Rule-based "personality"**: Calculates metrics from GitHub API data

2. **Terminology mismatch**:
   - User-facing copy already uses "behavioral" (locales/en.json)
   - Internal code uses "psychometric" and "personality"
   - Only one component (`BehavioralBadges.tsx`) consistently uses correct terminology

3. **Actually behavioral data**:
   - GitHub commit patterns, repo metadata, event timestamps
   - LinkedIn job changes, profile updates, "Open to Work" signals
   - Observable activity trends, contribution streaks

4. **AI inference (not psychometric)**:
   - Reading written text (LinkedIn About, job descriptions)
   - Categorizing into archetypes based on pattern matching
   - Generating hypotheses about motivations, risk tolerance, leadership
   - **These are behavioral *inferences*, not psychometric *measurements***

5. **Good practices already present**:
   - `personalityService.ts` shows evidence for each trait calculation
   - `PersonalityProfileCard.tsx` states "generated from public GitHub activity"
   - `behavioralSignalsService.ts` correctly named and scoped
   - Locale strings use "behavioral indicators"

### Recommended Action Priority

**Immediate (This Sprint)**:
1. ✅ Rename API endpoint `/api/profile/psychometric` → `/api/profile/behavioral`
2. ✅ Update UI labels: "Psychometric Profile" → "Behavioral Profile"
3. ✅ Add data source transparency to profile cards
4. ✅ Update `types.ts`: `Persona.psychometric` → `Persona.behavioralTraits`

**Short-term (Next Sprint)**:
1. Rename service functions: `generatePersona()` → `generateBehavioralProfile()`
2. Update prompt templates to remove "psychometric" language
3. Rename component files: `PsychometricCard.tsx` → `BehavioralProfileCard.tsx`
4. Update documentation (CLAUDE.md, research docs)

**Long-term (Following Sprints)**:
1. Rename `lib/psychometrics.ts` → `lib/behavioral-analysis.ts`
2. Consolidate the two personality services (AI vs rule-based)
3. Add methodology documentation ("/methodology" page explaining calculations)
4. Audit logging: rename event types to use "behavioral" terminology
5. Consider renaming `Persona` type → `BehavioralProfile` (breaking change)

### Impact Assessment

**Low Risk**:
- UI label changes (no breaking changes)
- Adding transparency banners
- Documentation updates
- Locale string updates (already correct)

**Medium Risk**:
- API endpoint rename (need backward compat route)
- Component file renames (update imports)
- Service function renames (find-replace)

**High Risk**:
- Type interface renames (`Persona` → `BehavioralProfile`)
- Database schema changes (if persona stored in columns)
- Breaking changes to external API contracts

### Next Steps

1. **Present findings to team lead**
2. **Get stakeholder approval on terminology change**
3. **Create implementation plan with phased rollout**
4. **Update feature backlog with rename tasks**
5. **Create migration guide for developers**

---

**Audit Complete**: All references to psychometric/persona/personality terminology mapped. Ready for systematic rename to "behavioral profile" across codebase.

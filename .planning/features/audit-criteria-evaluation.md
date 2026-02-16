# Audit: Intake Flow and Criteria-Based Evaluation

**Date**: 2026-02-16
**Author**: researcher (teammate agent)
**Task**: #2 - Audit intake flow and criteria-based evaluation
**Context**: Organizational psychologist feedback: "Best recruitment outcomes come from predefined criteria agreed with hiring manager upfront"

---

## Executive Summary

RecruitOS currently uses an **AI-driven extraction flow** where job descriptions are parsed to extract skills, which are then tiered by the hiring manager. However, there is **no predefined criteria-based evaluation system** where the hiring manager collaboratively defines evaluation criteria before candidate search begins.

**Key Gap**: The product starts with "what does the job description say?" instead of "what does the role call for?" — missing the opportunity for criteria definition and stakeholder alignment.

---

## 1. Current Intake Flow Analysis

### 1.1 Intake Process (`app/intake/page.tsx`)

**Two modes available:**

1. **Form Mode** (Primary):
   - **Social Context Collection** (Optional):
     - Company LinkedIn URL
     - Hiring Manager LinkedIn URL
     - Top Performer LinkedIn URL
     - Validates URLs and normalizes them

   - **Job Requirements Extraction**:
     - **From URL**: Uses Firecrawl API → scrapes job posting → AI analysis
     - **From Text**: User pastes job description → AI analysis
     - API route: `/api/calibration`

2. **AI Assistant Mode**:
   - Chat-based job spec creation (`ChatInterface` component)
   - Finalizes to same data structure

**AI Analysis Output** (`analyzeJobDescription` in `lib/services/gemini/index.ts`):
```typescript
{
  title: string;
  company: string;
  requiredSkills: string[];      // 4-8 skills extracted by AI
  preferredSkills: string[];     // 3-6 skills extracted by AI
  experienceLevel: string;       // e.g., "5+ years", "Senior"
  location: string;
  summary: string;                // 2-3 sentence role summary
}
```

**Data Storage**:
- Saved to `localStorage` as `apex_job_context`
- Includes `socialContext` object with LinkedIn URLs
- Sets flags: `apex_pending_auto_search`, clears `apex_job_context_hash`

**Navigation**: Intake → Skills Review (`/skills-review`)

---

### 1.2 Skills Review Step (`app/skills-review/page.tsx`)

**Purpose**: Hiring manager reviews and adjusts AI-extracted skills into priority tiers.

**Skill Tiers** (3 priority levels):

| Tier | Weight | Max Skills | Description |
|------|--------|-----------|-------------|
| **Must-have** | 1.0 | ~4 initially | "Deal-breakers" — candidate MUST have these |
| **Nice-to-have** | 0.6 | Variable | "Strong signals" — helps ranking but not blockers |
| **Bonus** | 0.3 | Variable | "Optional plus points" — minor impact |

**Features**:
- **AI Confidence Indicators**: Skills tagged with confidence level (high/medium/low)
  - High: Common tech keywords (React, Python, AWS, etc.)
  - Medium: Required skills beyond top 3
  - Low: Preferred skills (often inferred)
- **Skill Source Tracking**: Shows where skill came from ("Job description" vs "Inferred from context")
- **Candidate Pool Preview** (`/api/skills/preview`):
  - Real-time estimate of reachable candidates
  - Per-skill insights (limiting factors)
  - Suggestions for tier adjustments
- **Hard Requirements Filter** (separate component):
  - Location filter
  - Experience filter
  - Language filter
  - Toggle: must-have vs nice-to-have
- **Drag & Drop / Arrows**: Move skills between tiers
- **Add Custom Skills**: Manual skill addition

**Initial Tiering Logic** (`loadSkillsFromStorage`):
```typescript
// First 4 required skills → must-have (tier 1.0)
requiredSkills.slice(0, 4) → must-have

// Remaining required skills → nice-to-have (tier 0.6)
requiredSkills.slice(4) → nice-to-have

// All preferred skills → nice-to-have (tier 0.6)
preferredSkills → nice-to-have
```

**Data Storage**:
- Saved to `localStorage` as `apex_skills_config`:
```typescript
{
  skills: Array<{
    name: string;
    tier: 'must-have' | 'nice-to-have' | 'bonus';
    weight: number;  // 1.0 / 0.6 / 0.3
    order: number;
  }>;
  customSkills: string[];
  hardRequirements?: HardRequirementsConfig;
}
```
- Draft auto-saved to `apex_skills_draft` (for back button support)

**Navigation**: Skills Review → Pipeline (`/pipeline`)

---

## 2. Candidate Scoring System

### 2.1 Alignment Score Calculation

**Score Components** (5 weighted factors):

| Component | Max Points | Weight % | Evaluation Basis |
|-----------|-----------|----------|------------------|
| **Skills** | 35 | 35% | Match against required/preferred skills |
| **Experience** | 20 | 20% | Years of experience vs requirement |
| **Industry** | 15 | 15% | Domain/industry alignment |
| **Seniority** | 20 | 20% | Role level match |
| **Location** | 10 | 10% | Geographic proximity |

**Total**: 100 points (0-100 scale)

**Calculation** (`calculateScore` in `services/geminiService.ts:201`):
```typescript
const calculateScore = (breakdown: ScoreBreakdown): number => {
  const totalMax = 35 + 20 + 15 + 20 + 10;  // 100
  const totalValue = breakdown.skills.value +
                     breakdown.experience.value +
                     breakdown.industry.value +
                     breakdown.seniority.value +
                     breakdown.location.value;
  return Math.round((totalValue / totalMax) * 100);
}
```

**ScoreBreakdown Interface** (`types.ts:116-129`):
```typescript
interface ScoreComponent {
  value: number;      // Actual points earned
  max: number;        // Maximum possible points
  percentage: number; // (value/max) * 100
  reasoning?: string; // NEW: Explanation of score
}

interface ScoreBreakdown {
  skills: ScoreComponent;
  experience: ScoreComponent;
  industry: ScoreComponent;
  seniority: ScoreComponent;
  location: ScoreComponent;
}
```

### 2.2 Scoring Process

**AI-Driven Scoring** (`analyzeCandidateProfile` in `lib/services/gemini/index.ts:508-572`):

1. **Input**:
   - Candidate profile text (resume/GitHub/LinkedIn)
   - Job context (from intake)

2. **AI Analysis** (via OpenRouter/Gemini):
   - Assigns points to each component (skills: 0-35, experience: 0-20, etc.)
   - Provides reasoning for each component
   - Returns `scoreConfidence` (high/moderate/low)
   - Identifies `scoreDrivers` (top 2 boosting factors)
   - Identifies `scoreDrags` (factors pulling score down)

3. **Output**:
```typescript
{
  name, currentRole, company, location, yearsExperience,
  alignmentScore: number,          // 0-100 calculated total
  scoreBreakdown: ScoreBreakdown,
  shortlistSummary: string,
  keyEvidence: string[],
  keyEvidenceWithSources: EvidenceItem[],  // NEW: cited sources
  risks: string[],
  risksWithSources: EvidenceItem[],        // NEW: cited sources
  scoreConfidence: 'high' | 'moderate' | 'low',
  scoreDrivers: string[],
  scoreDrags: string[]
}
```

**Comparative Analysis Mode** (EU AI Act compliant):
- Function: `analyzeCandidateComparative` (`lib/services/gemini/index.ts:476-496`)
- Returns factual comparisons instead of numeric scores
- Reduces classification from High-Risk to Limited Risk under EU AI Act
- **Note**: Optional parameter `useComparativeAnalysis` in API (defaults to true)

### 2.3 Enhanced Score Analysis

**Candidate Interface** (`types.ts:285-371`) includes:
- `scoreConfidence`: 'high' | 'moderate' | 'low' — based on data completeness
- `scoreDrivers`: Top 2 factors boosting score
- `scoreDrags`: Factors pulling score down
- `dataSourceConfidence`: Tracking of GitHub/LinkedIn/manual data quality
- `calibrationResult`: How social context affected scoring (via LinkedIn URLs)

---

## 3. Criteria-Driven Evaluation — Current State

### 3.1 Evidence of Criteria System (Partial)

**Found in API** (`app/api/profile/analyze/route.ts:39`):
```typescript
const {
  candidateId,
  candidateName,
  // ...
  criteria, // Optional predefined criteria set for scorecard evaluation
} = body;
```

**Criteria Evaluation Function** (`lib/criteria.ts`):
```typescript
evaluateCriteria(
  candidate: Candidate,
  criteria: CriterionInput[]
): CriteriaEvaluation
```

**Status**:
- ✅ **Imported** in API route
- ❌ **Not called** in current implementation
- ❌ **No UI** for criteria definition
- ❌ **No storage** of criteria sets
- ❌ **Not integrated** into scoring flow

### 3.2 What's Missing for Criteria-Based Evaluation

**Gap Analysis**:

1. **No Criteria Definition Step**:
   - Hiring manager cannot define custom evaluation criteria upfront
   - No UI for creating/editing criterion sets
   - No way to define what "good" looks like for the role

2. **No Criterion Weighting**:
   - Scoring weights are **hardcoded** (skills: 35%, experience: 20%, etc.)
   - Cannot adjust importance of different factors per role
   - No way to say "for this role, culture fit matters more than years of experience"

3. **No Collaborative Agreement**:
   - No stakeholder alignment step before search begins
   - No way to capture hiring manager priorities
   - No documentation of "what we're looking for"

4. **No Custom Criteria Types**:
   - Only 5 fixed categories (skills, experience, industry, seniority, location)
   - Cannot add custom criteria like:
     - Leadership experience
     - Startup vs enterprise background
     - Open source contributions
     - Communication skills
     - Cultural values alignment
     - Specific project types

5. **No Scorecard Template System**:
   - Cannot save/reuse criteria sets for similar roles
   - No role templates (e.g., "Senior Backend Engineer" criteria template)
   - Each hire starts from scratch

---

## 4. Required Skills Selection in Search Flow

### 4.1 Search Page Investigation

**Search Files Checked**:
```bash
app/search/**/*.tsx  # No files found
```

**Result**: No dedicated search page with skill selection UI found.

**Inference**: Search functionality likely embedded in:
- Pipeline page (`app/pipeline/page.tsx`) — handles candidate sourcing
- Skills review page (`app/skills-review/page.tsx`) — skill tier selection

### 4.2 How Skills Drive Search

**Skills Configuration Flow**:
1. **Intake** → AI extracts skills from job description
2. **Skills Review** → Hiring manager tiers skills (must-have/nice-to-have/bonus)
3. **Pipeline** → Uses skills config to:
   - Search GitHub for candidates
   - Filter by must-have skills (hard requirements)
   - Rank by skill tier weights

**Search Intelligence** (`lib/search/`):
- `skillNormalizer.ts`: Maps frameworks to languages (React → JavaScript)
- `locationNormalizer.ts`: Handles city aliases (København → copenhagen)
- `experienceParser.ts`: Parses "5 years", "3-5 years", "senior"
- `constants.ts`: Multi-language stop words (DA, SV, DE, NO, EN)
- `combinedSearch.ts`: Multi-source search orchestration

**GitHub API Integration** (`lib/github.ts`):
```typescript
parseSearchQuery(query: string): ParsedSearchQuery {
  const experience = parseExperience(remaining);
  const { location } = extractLocation(remaining);
  const { skill, githubLanguage, keyword } = extractSkill(remaining);
  const keywords = filterStopWords(words);
  return { keywords, language: githubLanguage, location, experience };
}
```

**Skills Impact on Search**:
- **Must-have skills** → Strict filtering (AND logic)
- **Nice-to-have skills** → Ranking boost (weighted scoring)
- **Bonus skills** → Minor ranking boost

---

## 5. Gap Analysis: Path to Criteria-Based Evaluation

### 5.1 What Works Well

✅ **Skills tiering system** — flexible priority levels
✅ **Weighted scoring** — different components have different importance
✅ **Real-time candidate pool preview** — see impact of skill changes
✅ **Hard requirements toggle** — must-have vs nice-to-have filters
✅ **AI confidence indicators** — transparency on skill extraction quality
✅ **Social context integration** — LinkedIn URLs for calibration
✅ **Evidence-based scoring** — `keyEvidenceWithSources` and `risksWithSources`

### 5.2 What Needs to Change

#### **Phase 1: Criteria Definition UI** 🔴 CRITICAL

**Problem**: No way to define custom evaluation criteria before search.

**Solution**: Add "Define Criteria" step between Intake and Skills Review.

**New Flow**:
```
Intake → [Criteria Definition] → Skills Review → Pipeline
```

**UI Requirements**:
- **Criterion Builder**:
  - Add custom criteria (e.g., "Leadership experience", "Startup background")
  - Define evaluation method (AI analysis, evidence-based, binary yes/no)
  - Set importance weight (1-10 scale)
  - Write evaluation guidelines/rubric
- **Criterion Templates**:
  - Library of common criteria (communication, culture fit, technical leadership)
  - Role-specific templates (Senior Engineer, Tech Lead, CTO)
- **Stakeholder Collaboration**:
  - Share criterion set with hiring team
  - Collect feedback/approval before search
  - Version tracking of criterion sets

**Data Model** (new):
```typescript
interface Criterion {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'soft_skills' | 'experience' | 'cultural' | 'custom';
  weight: number;        // 1-10 importance scale
  evaluationType: 'ai_analysis' | 'evidence_based' | 'binary' | 'scale';
  rubric?: string;       // Evaluation guidelines
  required?: boolean;    // Must-have vs nice-to-have
  order: number;
}

interface CriteriaSet {
  id: string;
  name: string;
  roleTitle: string;
  criteria: Criterion[];
  createdBy: string;
  approvedBy?: string[];
  createdAt: string;
  version: number;
}
```

#### **Phase 2: Dynamic Scoring Weights** 🟡 HIGH PRIORITY

**Problem**: Scoring weights are hardcoded (skills: 35%, experience: 20%, etc.).

**Solution**: Allow hiring manager to adjust component weights per role.

**UI Enhancement** (Skills Review page):
- **Weight Adjustment Slider**:
  - Skills: [====|====] 35% (default)
  - Experience: [===|=====] 20% (adjustable 10-40%)
  - Industry: [==|======] 15% (adjustable 5-30%)
  - Seniority: [===|=====] 20% (adjustable 10-40%)
  - Location: [=|=======] 10% (adjustable 0-20%)
- **Total**: Always sums to 100%
- **Presets**: "Technical Role", "Leadership Role", "Remote-First"

**Data Model Update**:
```typescript
interface SkillsConfig {
  skills: SkillTier[];
  customSkills: string[];
  hardRequirements?: HardRequirementsConfig;
  scoringWeights?: {
    skills: number;      // 10-50%
    experience: number;  // 10-40%
    industry: number;    // 5-30%
    seniority: number;   // 10-40%
    location: number;    // 0-20%
  };
}
```

#### **Phase 3: Custom Criterion Scoring** 🟡 HIGH PRIORITY

**Problem**: Only 5 fixed scoring categories. Cannot add custom criteria.

**Solution**: Extend scorecard to include custom criteria evaluations.

**Implementation**:
```typescript
interface Candidate {
  // Existing fields...
  alignmentScore: number;        // 0-100 (core 5 factors)
  scoreBreakdown?: ScoreBreakdown;

  // NEW: Custom criteria evaluation
  criteriaEvaluation?: {
    criteriaSetId: string;
    criteriaSetVersion: number;
    evaluations: Array<{
      criterionId: string;
      criterionName: string;
      score: number;           // 0-100 or 0-10 depending on scale
      rating: string;          // "Exceeds", "Meets", "Below", "No Evidence"
      evidence: string[];
      confidence: 'high' | 'medium' | 'low';
      reasoning: string;
    }>;
    overallCriteriaScore: number;  // Weighted average
    criteriaScoreBreakdown: {
      technical: number;
      softSkills: number;
      experience: number;
      cultural: number;
      custom: number;
    };
  };
}
```

**AI Analysis Update** (`analyzeCandidateProfile`):
- Accept `criteriaSet` parameter
- Evaluate each criterion against candidate data
- Return structured criterion evaluations with evidence
- Use `evaluateCriteria()` function from `lib/criteria.ts`

#### **Phase 4: Criterion Templates & Library** 🟢 MEDIUM PRIORITY

**Problem**: Every role starts from scratch. No reusable criteria patterns.

**Solution**: Build criterion template library.

**Features**:
- **Template Categories**:
  - By Role: "Senior Engineer", "Tech Lead", "Engineering Manager", "CTO"
  - By Domain: "Fintech", "Healthcare", "E-commerce", "Developer Tools"
  - By Team Stage: "Startup Founding Engineer", "Scale-up", "Enterprise"
- **Community Templates**: Share/import criteria sets
- **Template Customization**: Fork and edit existing templates
- **Template Versioning**: Track changes over time

**Data Storage**:
- `criterion_templates` table (Prisma schema)
- `user_criteria_sets` table (custom sets per user/team)

#### **Phase 5: Stakeholder Alignment Workflow** 🟢 MEDIUM PRIORITY

**Problem**: No collaborative agreement on "what we're looking for" before search.

**Solution**: Add approval workflow for criteria definition.

**Workflow**:
1. **Recruiter** defines initial criteria set
2. **Hiring Manager** reviews and adjusts weights/rubrics
3. **Team Lead** adds technical criteria
4. **HR** adds cultural/values criteria
5. **Group approval** locks criteria before search
6. **Documentation**: Generate "Role Scorecard PDF" for record-keeping

**Features**:
- Comment threads on individual criteria
- Approval tracking (who approved when)
- Email notifications for review requests
- Version history (if criteria change mid-search)

#### **Phase 6: Analytics & Insights** 🟢 LOW PRIORITY

**Problem**: No visibility into which criteria matter most for successful hires.

**Solution**: Track criterion performance over time.

**Metrics**:
- Which criteria correlate with successful hires?
- Which criteria are most predictive?
- Are any criteria redundant (high correlation)?
- Are weights calibrated correctly?

**UI**:
- "Criteria Performance Dashboard"
- "Successful Hires Analysis" — reverse-engineer common patterns
- "Criterion Recommendations" — suggest criteria based on past hires

---

## 6. Comparative Analysis: Current vs Criteria-Based

| Aspect | **Current System** | **Criteria-Based System** |
|--------|-------------------|---------------------------|
| **Starting Point** | "What does the job description say?" | "What does the role call for?" |
| **Criteria Source** | AI-extracted from job text | Collaboratively defined by hiring team |
| **Stakeholder Input** | Post-search (skills review) | Pre-search (criteria definition) |
| **Scoring Flexibility** | Fixed weights (35/20/15/20/10) | Adjustable weights per role |
| **Custom Criteria** | ❌ Only 5 fixed categories | ✅ Unlimited custom criteria |
| **Evaluation Clarity** | Implicit (skills + experience) | Explicit rubrics per criterion |
| **Agreement Capture** | None | Documented approval workflow |
| **Reusability** | Manual copy per role | Template library |
| **Performance Tracking** | None | Criterion effectiveness analytics |

---

## 7. Technical Implementation Notes

### 7.1 Existing Infrastructure

**Already Available**:
- ✅ `evaluateCriteria()` function in `lib/criteria.ts` (unused)
- ✅ `criteria` parameter in `/api/profile/analyze` route (unused)
- ✅ Skills tiering system (can be extended)
- ✅ Prisma + SQLite (can store criteria sets)
- ✅ Skill tier weights (1.0/0.6/0.3) — pattern to extend

**Storage Migration Required**:
- Currently: `localStorage` for `apex_skills_config`
- Future: Database tables for persistent criteria sets
- Migration path: Keep localStorage for drafts, persist final to DB

### 7.2 Database Schema (New Tables)

```prisma
model CriterionTemplate {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String   // 'technical' | 'soft_skills' | 'experience' | 'cultural' | 'custom'
  roleType    String?  // 'senior_engineer' | 'tech_lead' | 'manager' | null
  domain      String?  // 'fintech' | 'healthcare' | 'ecommerce' | null
  weight      Int      @default(5)  // 1-10
  evaluationType String // 'ai_analysis' | 'evidence_based' | 'binary' | 'scale'
  rubric      String?  @db.Text
  isPublic    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())

  @@index([category, roleType])
}

model CriteriaSet {
  id           String   @id @default(cuid())
  name         String
  roleTitle    String
  description  String?  @db.Text
  criteria     Json     // Array of Criterion objects
  scoringWeights Json? // Optional custom scoring weights
  status       String   @default("draft") // 'draft' | 'approved' | 'active' | 'archived'
  createdBy    String
  approvedBy   Json?    // Array of approver objects
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  version      Int      @default(1)

  evaluations  CriteriaEvaluation[]

  @@index([createdBy, status])
}

model CriteriaEvaluation {
  id            String   @id @default(cuid())
  candidateId   String
  criteriaSetId String
  evaluations   Json     // Array of criterion evaluations
  overallScore  Float
  scoreBreakdown Json
  evaluatedAt   DateTime @default(now())

  criteriaSet   CriteriaSet @relation(fields: [criteriaSetId], references: [id])

  @@index([candidateId, criteriaSetId])
}
```

### 7.3 API Endpoints (New)

```
POST   /api/criteria/templates              # List criterion templates
POST   /api/criteria/templates/create       # Create custom template
GET    /api/criteria/sets/:id               # Get criteria set
POST   /api/criteria/sets                   # Create new criteria set
PUT    /api/criteria/sets/:id               # Update criteria set
POST   /api/criteria/sets/:id/approve       # Approve criteria set
POST   /api/criteria/evaluate               # Evaluate candidate against criteria
```

### 7.4 UI Components (New)

```
components/criteria/
├── CriterionBuilder.tsx           # Add/edit individual criterion
├── CriteriaSetEditor.tsx          # Full criteria set editor
├── CriterionTemplateLibrary.tsx   # Browse/select templates
├── ScoringWeightsEditor.tsx       # Adjust component weights
├── CriteriaApprovalFlow.tsx       # Stakeholder approval UI
├── CriterionEvaluationCard.tsx    # Display evaluation result
└── CriteriaScorecard.tsx          # Full scorecard view

app/criteria-definition/
└── page.tsx                       # New step in flow
```

---

## 8. Recommendations

### 8.1 Immediate Actions (Sprint 1)

1. **Add Criteria Definition Step**:
   - Create `/criteria-definition` page
   - Insert into flow: Intake → Criteria → Skills Review → Pipeline
   - Build `CriterionBuilder` component (basic MVP)
   - Store criteria set in database (new `CriteriaSet` table)

2. **Extend Scoring to Include Custom Criteria**:
   - Activate `evaluateCriteria()` function in API route
   - Update `Candidate` interface to include `criteriaEvaluation`
   - Modify AI prompts to evaluate custom criteria
   - Display criteria scores in candidate profile

3. **Add Weight Adjustment UI**:
   - Add sliders to Skills Review page
   - Store custom weights in `apex_skills_config`
   - Pass weights to scoring function
   - Update `calculateScore()` to use dynamic weights

### 8.2 Next Steps (Sprint 2-3)

4. **Build Criterion Template Library**:
   - Seed database with 10-15 common criteria templates
   - Create template browser UI
   - Implement "fork and customize" workflow

5. **Add Stakeholder Approval Workflow**:
   - Build approval tracking system
   - Email notifications for review requests
   - Comment threads on criteria
   - Generate PDF scorecard for documentation

6. **Analytics Dashboard**:
   - Track criterion performance over time
   - Show which criteria correlate with successful hires
   - Suggest criteria based on past roles

### 8.3 Long-Term Vision (Sprint 4+)

7. **Community Criteria Marketplace**:
   - Share criteria sets across organizations
   - Upvote/review templates
   - Industry best practices library

8. **AI-Assisted Criterion Suggestion**:
   - Analyze job description → suggest relevant criteria
   - Learn from past successful hires → recommend criteria
   - Auto-generate rubrics for common criteria

9. **Integration with ATS/HRIS**:
   - Export criteria sets to TeamTailor, Greenhouse, etc.
   - Import hiring outcomes for criterion effectiveness analysis

---

## 9. Conclusion

**Current State**: RecruitOS has a solid AI-driven intake and skills tiering system, but lacks predefined criteria-based evaluation where the hiring manager defines "what good looks like" upfront.

**Gap**: The product starts with job description parsing rather than collaborative criterion definition. This misses the opportunity for stakeholder alignment and clear evaluation standards before candidate search begins.

**Impact**: Without criteria-based evaluation:
- ❌ No documented agreement on "what we're looking for"
- ❌ Cannot customize evaluation factors per role
- ❌ Scoring weights are fixed (skills: 35%, experience: 20%, etc.)
- ❌ Cannot add custom criteria (leadership, culture fit, etc.)
- ❌ Cannot reuse criteria patterns across similar roles

**Recommendation**: Implement criteria definition step between Intake and Skills Review, allowing hiring managers to define, weight, and approve custom evaluation criteria before search begins. This aligns with organizational psychology best practices where "predefined criteria agreed with hiring manager" leads to best recruitment outcomes.

**Effort Estimate**:
- **Phase 1** (Criteria Definition UI): 2-3 sprints
- **Phase 2** (Dynamic Weights): 1 sprint
- **Phase 3** (Custom Criterion Scoring): 2 sprints
- **Phase 4** (Template Library): 1-2 sprints
- **Phase 5** (Approval Workflow): 2 sprints
- **Phase 6** (Analytics): 2-3 sprints

**Total**: 10-13 sprints (5-6 months with 2-week sprints)

---

**Task Status**: ✅ Complete — Ready for team lead review

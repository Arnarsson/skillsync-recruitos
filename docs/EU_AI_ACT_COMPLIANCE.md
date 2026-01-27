# EU AI Act Compliance Documentation

## Overview

RecruitOS has been updated to comply with the EU Artificial Intelligence Act (AI Act) by replacing automated candidate scoring with comparative analysis. This change reduces our classification from **High-Risk** to **Limited Risk**, significantly reducing regulatory requirements.

## What Changed

### Before (High-Risk ❌)
- Automated scoring system (0-100 points)
- Numeric rankings (skills: 28/35, experience: 15/20, etc.)
- Algorithm makes hiring recommendations
- Candidate "alignment score"

### After (Limited Risk ✅)
- Comparative analysis approach
- Factual comparisons between candidate and job requirements
- Human recruiter makes all decisions
- No automated scoring or ranking

## Legal Background

### EU AI Act Article 5 - Prohibited Practices

High-risk AI systems in employment include those that:
> "are intended to be used for the recruitment or selection of natural persons, notably for advertising vacancies, screening or filtering applications, evaluating candidates in the course of interviews or tests"

**Our previous scoring system qualified as High-Risk** because it:
- Assigned numeric scores to candidates
- Ranked candidates algorithmically
- Could influence hiring decisions automatically

### Solution: Comparative Analysis

By converting to a comparative approach, we:
- Present factual information to recruiters
- Do NOT make automated decisions
- Let humans evaluate and decide
- Reduce classification to **Limited Risk** (Article 52 - Transparency obligations)

## Technical Implementation

### API Changes

The `/api/profile/analyze` endpoint now supports both modes:

```typescript
POST /api/profile/analyze
{
  "candidateId": "github_username",
  "candidateName": "John Doe",
  "jobContext": "...",
  "useComparativeAnalysis": true  // Default: true (EU compliant)
}
```

**Response (Comparative Mode):**
```json
{
  "analysisMode": "comparative",
  "euAiActCompliant": true,
  "comparativeAnalysis": {
    "name": "John Doe",
    "skillsComparison": {
      "requiredSkills": [
        {
          "requirement": "React experience",
          "candidateEvidence": "15 repositories using React",
          "match": "strong",
          "evidenceSource": "repositories",
          "details": "Candidate has extensive React experience based on public repositories"
        }
      ],
      "preferredSkills": [...],
      "additionalSkills": ["TypeScript", "Node.js"]
    },
    "experienceComparison": [
      {
        "aspect": "years_of_experience",
        "required": "5+ years",
        "candidate": "7 years based on GitHub activity",
        "comparison": "exceeds",
        "details": "Account created 2017, consistent activity since"
      }
    ],
    "strengthsEvidence": [...],
    "concernsEvidence": [...],
    "executiveSummary": "Candidate demonstrates strong alignment with required skills based on repository analysis. Experience level appears to meet requirements. Human review recommended for culture fit assessment."
  }
}
```

**Response (Legacy Scoring Mode):**
```json
{
  "analysisMode": "scoring",
  "euAiActCompliant": false,
  "warning": "Using deprecated scoring mode. Switch to comparative analysis for EU AI Act compliance.",
  "alignmentScore": 85,
  "scoreBreakdown": { ... }
}
```

### Code Structure

```
lib/services/gemini/
├── index.ts                      # Main service
├── comparativeAnalysis.ts        # EU AI Act compliant logic
└── [legacy scoring deprecated]
```

**New Functions:**
- `analyzeCandidateComparative()` - EU compliant comparative analysis
- `validateCompliance()` - Checks for prohibited scoring language
- `buildComparativeAnalysisPrompt()` - Generates compliant prompts

**Deprecated (but kept for backward compatibility):**
- `analyzeCandidateProfile()` - Old scoring system

## Compliance Checklist

✅ **No automated scoring** - Removed numeric scores (0-100)  
✅ **No ranking** - Removed candidate ranking algorithms  
✅ **No automated recommendations** - Removed "should hire" language  
✅ **Human-in-the-loop** - All decisions made by human recruiters  
✅ **Transparency** - Clear about data sources and limitations  
✅ **Audit trail** - All analyses logged with timestamps  
✅ **Data minimization** - Only analyze data relevant to job requirements  

## Migration Guide

### For Frontend Developers

Update your API calls to use comparative mode:

```typescript
// Before (deprecated)
const response = await fetch('/api/profile/analyze', {
  method: 'POST',
  body: JSON.stringify({
    candidateId: username,
    useComparativeAnalysis: false  // Old mode
  })
});
const { alignmentScore } = await response.json();

// After (EU compliant)
const response = await fetch('/api/profile/analyze', {
  method: 'POST',
  body: JSON.stringify({
    candidateId: username,
    useComparativeAnalysis: true  // Default
  })
});
const { comparativeAnalysis } = await response.json();

// Display comparative analysis instead of score
displaySkillComparisons(comparativeAnalysis.skillsComparison);
displayExperienceComparison(comparativeAnalysis.experienceComparison);
```

### Updating UI Components

Replace score displays with comparison views:

**Before:**
```tsx
<div>
  <h3>Alignment Score: {alignmentScore}/100</h3>
  <ProgressBar value={alignmentScore} />
</div>
```

**After:**
```tsx
<div>
  <h3>Skills Comparison</h3>
  {comparativeAnalysis.skillsComparison.requiredSkills.map(skill => (
    <ComparisonRow
      requirement={skill.requirement}
      evidence={skill.candidateEvidence}
      match={skill.match}
      details={skill.details}
    />
  ))}
</div>
```

## Testing Compliance

Run the validation suite:

```bash
npm test -- comparativeAnalysis.test.ts
```

**Tests verify:**
- No numeric scores in output
- No prohibited language (e.g., "should hire", "perfect fit")
- All comparisons are factual
- Proper evidence sourcing

## Documentation References

- **EU AI Act Full Text:** https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A52021PC0206
- **Marvie's EU AI Act Framework:** https://github.com/marvie-demit/EU_AI_ACT_FRAMEWORK
- **Article 52 (Transparency):** https://artificialintelligenceact.eu/article/52/

## FAQ

### Q: Can we still use scoring internally for testing?
A: Yes, for internal R&D and testing, scoring can be used. But any system that influences actual hiring decisions must use comparative analysis.

### Q: What about "match percentage" badges?
A: Prohibited. Any numeric representation of candidate suitability falls under High-Risk classification. Use qualitative terms: "Strong match", "Partial match", "Requires review".

### Q: Can we rank candidates by skills?
A: No automated ranking. You can present candidates in any order (e.g., alphabetical, application date), but not by algorithmic "best fit" ranking.

### Q: How do we explain this to customers?
A: "RecruitOS uses EU AI Act compliant comparative analysis to help you evaluate candidates faster. Instead of automated scores, we present factual comparisons between candidate profiles and job requirements, so you stay in control of every hiring decision."

## Timeline

- **Jan 9, 2026:** Compliance issue identified (Marvie feedback)
- **Jan 29, 2026:** Comparative analysis implemented
- **Feb 2026:** UI migration begins
- **Mar 2026:** Deprecated scoring mode removed
- **Aug 2, 2026:** EU AI Act enforcement begins

## Support

Questions about EU AI Act compliance? Contact:
- **Technical:** engineering@skillsync.app
- **Legal:** legal@skillsync.app (or consult your legal team)
- **Marvie (Austrian compliance expert):** [Contact via Linear 7-170]

---

**Last updated:** January 29, 2026  
**Status:** ✅ EU AI Act Compliant (Limited Risk)

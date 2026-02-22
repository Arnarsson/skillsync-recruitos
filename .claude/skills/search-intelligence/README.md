# Search Intelligence Skill

Use this skill when working on anything related to:
- Search queries (GitHub search, pipeline auto-search)
- Location normalization or extraction
- Skill/technology name mapping
- Job description parsing
- Any feature that converts user input into a GitHub API query

## The Rule: AI Does Semantic Work, Not Lookup Tables

This codebase already runs job descriptions through Gemini AI (`analyzeJobDescription`
in `lib/services/gemini/index.ts`). That function extracts structured data including
location and skills. **This is where normalization must happen.**

### What goes wrong without this skill

Someone writes "Østerbro" as the job location. The naive fix is:
```typescript
const LOOKUP = { 'Østerbro': 'Copenhagen', 'Nørrebro': 'Copenhagen' }
```

This is whack-a-mole. "Islands Brygge", "Refshaleøen", "Bispebjerg", "Glostrup",
"near Nørreport station" — every new variant breaks the search again.

### The right fix

The AI already reads the job description. Tell it what to return:

```typescript
// In analyzeJobDescription system prompt:
"CRITICAL RULES FOR LOCATION:
- Always return canonical English city name that GitHub users write in their profiles
- Neighborhoods/districts → parent city: 'Østerbro' → 'Copenhagen'
- Local spellings → English: 'København' → 'Copenhagen', 'München' → 'Munich'
- 'Østerbro, Copenhagen, Denmark' → 'Copenhagen'"
```

Same principle for skills:
```typescript
// In analyzeJobDescription system prompt:
"SQL is not a GitHub language → return 'PostgreSQL' or 'MySQL'
ML/Machine Learning → return 'Python'
ReactJS → 'React', NodeJS → 'Node.js'"
```

## Architecture

```
User input (any language, any specificity)
    ↓
analyzeJobDescription() — Gemini AI
    ↓ returns canonical values
{ location: "Copenhagen", skills: ["Python", "PostgreSQL"] }
    ↓
GITHUB_SKILL_MAP in pipeline/page.tsx — last-resort safety net
    ↓
normalizeLocation() in locationNormalizer.ts — fallback for manual text queries
    ↓
GitHub search API
```

## Files

| File | Purpose | When to touch |
|------|---------|---------------|
| `lib/services/gemini/index.ts` → `analyzeJobDescription()` | **PRIMARY** — AI extraction with normalization rules | When adding new normalization logic |
| `app/pipeline/page.tsx` → `GITHUB_SKILL_MAP` | Safety net for skills that slip through AI | Only if AI consistently misses a skill |
| `lib/search/locationNormalizer.ts` | Fallback for manual search bar queries | Only for raw text queries, not job analysis |
| `lib/search/skillNormalizer.ts` | GitHub API language mapping | For technical GitHub API constraints |

## Checklist when touching search/location/skill code

- [ ] Is the fix going into the AI extraction prompt? (correct)
- [ ] Or is it going into a lookup table? (wrong — fix the prompt instead)
- [ ] Does the location output end up as a searchable city in English?
- [ ] Are skills GitHub-API-compatible (no "SQL", use "PostgreSQL")?
- [ ] Will this still work for inputs you haven't thought of yet?

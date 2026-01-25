# LinkedIn Auto-Discovery & Deep Enrichment

**Date:** 2026-01-25
**Status:** Approved
**Trigger:** User clicks "Deep Profile" or "Find Connection Path"

## Problem

Currently users must manually find and enter LinkedIn URLs for candidates. This creates friction and reduces feature adoption.

## Solution

Auto-discover LinkedIn profiles from GitHub data, plus enrich with additional sources for better psychometric and deep profile analysis.

## Architecture

### Trigger Flow

```
User clicks "Deep Profile" (no LinkedIn set)
    ↓
LinkedIn bar animates: "Finding LinkedIn..."
    ↓
If ≥90% confidence → auto-accept, show "LinkedIn found ✓"
If 70-89% confidence → show match: "John Smith - Senior Dev at Acme (85%)" [Use This] [Not them]
If <70% confidence → show top 3 matches for user selection
    ↓
Original action continues with enriched data
```

### LinkedIn Finder Strategy (Hybrid)

1. **First:** Google search via Firecrawl - `site:linkedin.com/in "[name]" "[company]"`
2. **Fallback:** BrightData LinkedIn People Search (if Google returns <3 results or low confidence)
3. **AI Ranking:** OpenRouter scores each result 0-100 based on name, location, company, role alignment

### Extended Data Sources

**GitHub-native (instant):**
- Profile README (`github.com/[username]/[username]`)
- Contribution graph and activity patterns
- PRs to other repos (collaboration signals)
- Issues opened/commented (communication style)

**External (parallel scraping):**
- LinkedIn profile (via finder)
- Personal website/blog (Firecrawl)
- YouTube/conference talks (Google search via Firecrawl)

### Performance: Parallel Fetching

```
User clicks "Deep Profile"
    ↓
Launch in parallel:
├── GitHub README         → API (instant)
├── GitHub contributions  → API (instant)
├── GitHub PRs to others  → API (instant)
├── LinkedIn finder       → Google → BrightData fallback (5-30s)
├── Personal site scrape  → Firecrawl (2-5s)
└── YouTube/talks search  → Google via Firecrawl (2-5s)
    ↓
Results stream in as ready
    ↓
AI synthesis when all complete (timeout: 45s)
```

### Progressive UI

- Show skeleton with status indicators per source
- Fill sections as each completes
- User sees progress, doesn't feel slow

### Accuracy Safeguards

- Cross-reference: LinkedIn company = GitHub company → boost confidence
- Discard low-confidence external matches (<30%)
- AI synthesizes only verified data points

### Caching

- Cache enrichment results per username for 24 hours
- Skip re-fetching if already enriched in session

## API Design

### POST `/api/linkedin-finder`

```typescript
// Request
{
  githubProfile: { login, name, bio, location, company, blog, twitter_username }
}

// Response
{
  matches: [{
    profileUrl: string,
    name: string,
    headline: string,
    location: string,
    company: string,
    confidence: number,      // 0-100
    reasons: string[],       // ["Name exact match", "Same company"]
    autoAccepted: boolean    // true if ≥90%
  }],
  searchMethod: "google" | "brightdata"
}
```

### POST `/api/deep-enrichment`

```typescript
// Request
{
  username: string,
  githubProfile: object,
  linkedInUrl?: string  // If already known/confirmed
}

// Response
{
  github: {
    readme: string | null,
    prsToOthers: [{ repo, title, state, url }],
    contributionPattern: { consistency, peakDays, streaks }
  },
  linkedin: {
    profile: LinkedInProfile | null,
    confidence: number,
    autoAccepted: boolean
  },
  website: {
    url: string | null,
    content: string | null,
    topics: string[]
  },
  talks: [{
    title: string,
    url: string,
    platform: "youtube" | "vimeo" | "conference"
  }],
  status: "complete" | "partial",
  cached: boolean
}
```

## File Structure

```
app/api/
  linkedin-finder/route.ts      # Hybrid Google → BrightData search
  deep-enrichment/route.ts      # Orchestrates parallel fetching

lib/enrichment/
  githubEnrichment.ts           # README, PRs, contribution patterns
  linkedinFinder.ts             # Google search → BrightData fallback
  websiteEnrichment.ts          # Firecrawl personal site
  talksEnrichment.ts            # YouTube/conference search

app/profile/[username]/
  page.tsx                      # Update LinkedIn bar for auto-discovery
  deep/page.tsx                 # Progressive loading UI
```

## UI Changes

### LinkedIn Bar (profile page)

**Before:** Manual URL input only

**After:**
- Shows "Finding LinkedIn..." when triggered
- Displays match with confidence and reasons
- One-click confirm for 70-89% matches
- Auto-accepts ≥90% matches
- Falls back to manual input if no matches

### Deep Profile Page

**Before:** Single loading state, then full page

**After:**
- Progressive sections with individual loading states
- Sources show as they complete: "GitHub ✓", "LinkedIn ✓", "Website 🔄"
- AI synthesis runs when threshold of data ready

## Success Criteria

1. LinkedIn found automatically for >70% of GitHub profiles with names
2. <30 seconds total enrichment time
3. >85% accuracy on auto-accepted matches (≥90% confidence)
4. Zero manual input required for high-confidence matches

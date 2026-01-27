# SERP Talent Search

## Overview

The SERP Talent Search feature extends RecruitOS's search capabilities to find technical talent through web search (Google/SERP) for **niche and specialized queries** where GitHub and LinkedIn might have limited coverage.

## Problem Solved

Traditional GitHub user search has limitations:
- Only searches user bios, locations, and company fields
- Doesn't index repository content or specialized technical domains
- Misses academic profiles, research publications, and company team pages
- Fails on highly specialized queries like "nanofabrication copenhagen"

## How It Works

### 1. Query Detection

The system automatically detects when a query would benefit from SERP search:

```typescript
// Niche technical domains
nanofabrication, quantum computing, photonics, cryogenic systems,
plasma physics, semiconductor fabrication, MEMS, microfluidics,
bioinformatics, computational biology, cryo-EM, etc.

// Academic indicators
researcher, scientist, professor, phd, postdoc, laboratory
```

### 2. Multi-Query Strategy

For each search, generates multiple optimized queries:
- Base query with location
- LinkedIn-specific: `site:linkedin.com/in/ [query]`
- Academic: `[query] researcher OR scientist OR professor`
- GitHub: `site:github.com [query] developer`
- Company teams: `[query] expert "team" OR "our people"`

### 3. AI-Powered Extraction

Uses OpenRouter/Gemini to extract structured profile data from search results:
- Person's name and title
- Company and location
- Relevant technical skills
- Relevance score (0-1)
- Source type classification

### 4. Result Integration

SERP results are combined with GitHub and LinkedIn results, sorted by relevance.

## API Usage

### Direct SERP Search

```typescript
GET /api/search/serp?q=nanofabrication%20copenhagen&location=denmark&maxResults=10
```

Response:
```json
{
  "results": [
    {
      "id": "serp-1234-0",
      "name": "Dr. Jane Smith",
      "headline": "Senior Nanofabrication Scientist",
      "location": "Copenhagen",
      "profileUrl": "https://example.com/profile",
      "source": "serp",
      "sourceType": "academic",
      "snippet": "Dr. Jane Smith is a leading expert in nanofabrication...",
      "skills": ["nanofabrication", "electron-beam lithography"],
      "company": "Technical University of Denmark",
      "relevanceScore": 95
    }
  ],
  "total": 10
}
```

### Combined Search (GitHub + LinkedIn + SERP)

```typescript
import { triggerCombinedSearch } from "@/lib/search/combinedSearch";

const results = await triggerCombinedSearch("nanofabrication copenhagen", {
  includeLinkedIn: true,
  includeSERP: true,
});

// Results contain:
// - results.githubResults: GitHub profiles
// - results.linkedInSnapshotId: LinkedIn job ID
// - results.serpResults: SERP-discovered profiles
```

## Source Type Classification

SERP results are classified by source:

- **`linkedin`**: LinkedIn profile pages
- **`github`**: GitHub profile pages
- **`academic`**: Research profiles (Google Scholar, ResearchGate, university pages)
- **`company`**: Company team/about pages
- **`blog`**: Technical blogs (Medium, Dev.to, Substack)
- **`other`**: Other relevant sources

## When to Use

**Use SERP search for:**
- ✅ Highly specialized technical domains
- ✅ Academic/research talent
- ✅ Emerging technologies with limited GitHub presence
- ✅ Niche hardware/scientific fields
- ✅ Queries that return 0 GitHub results

**Stick with GitHub/LinkedIn for:**
- ❌ Common software engineering skills (React, Python, etc.)
- ❌ General developer searches
- ❌ When you need detailed GitHub activity metrics

## Performance Considerations

- SERP searches are **slower** (5-15 seconds) due to web scraping
- Uses BrightData API (requires API key)
- AI extraction adds 2-5 seconds
- Recommended: Run SERP search **in parallel** with GitHub/LinkedIn
- Cache results for repeated queries

## Configuration

Required environment variables:

```bash
# BrightData API key (for SERP access)
BRIGHTDATA_API_KEY=your_key_here

# OpenRouter API key (for AI extraction)
OPENROUTER_API_KEY=your_key_here
```

## Example Use Cases

### 1. Nanofabrication Expert in Copenhagen
```
Query: "nanofabrication copenhagen"
→ Finds: DTU researchers, cleanroom engineers, semiconductor specialists
```

### 2. Quantum Computing Researcher
```
Query: "quantum computing researcher germany"
→ Finds: University professors, lab members, research institute staff
```

### 3. Emerging Technology (Limited GitHub Presence)
```
Query: "cryo-electron microscopy expert"
→ Finds: Structural biology researchers, imaging facility staff
```

## Future Enhancements

- [ ] Add Google Scholar integration for citation metrics
- [ ] Extract publication lists from academic profiles
- [ ] Company org chart scraping for team discovery
- [ ] Conference speaker database integration
- [ ] Patent database search for deep tech talent

## Troubleshooting

**No results found:**
- Check BrightData API key configuration
- Verify query is specific enough (too broad = too many generic results)
- Try adding location or company context

**Low relevance scores:**
- Query might be too generic
- AI extraction may need prompt tuning
- Consider refining search terms

**Slow performance:**
- SERP searches take 5-15 seconds by design
- Consider running async/background jobs for bulk searches
- Implement result caching

## Testing

Run the test suite:

```bash
npm test -- serpTalentSearch.test.ts
```

Example test query:
```typescript
const results = await searchTalentViaSERP("nanofabrication copenhagen");
expect(results.length).toBeGreaterThan(0);
expect(results[0].sourceType).toBe("academic");
```

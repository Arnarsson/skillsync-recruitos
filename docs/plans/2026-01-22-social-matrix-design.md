# Social Matrix Feature - Implementation Plan

**Branch**: `feature/social-matrix`
**Goal**: Build a "6 Degrees of Kevin Bacon" style social graph that shows connection paths between recruiters and candidates, combining multiple data sources with AI-powered deep research.

---

## Overview

A unified knowledge graph that:
1. **Finds paths** between recruiter and any candidate
2. **Uses multiple sources**: LinkedIn (BrightData), GitHub, CRM, web research
3. **AI-powered discovery**: Gemini/Perplexity for finding non-obvious connections
4. **Cross-validated**: Multi-source verification to prevent hallucinations
5. **Progressive UI**: Badge on search → Card on profile → Full graph on click

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOCIAL MATRIX ENGINE                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: AI REASONING (Gemini)                             │
│  - Path ranking & explanation                               │
│  - Connector discovery (supernodes)                         │
│  - Relationship inference                                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: DEEP RESEARCH (BrightData SERP + Web Scraping)    │
│  - Event/conference speaker lists                           │
│  - Podcast/panel co-appearances                             │
│  - Co-authored content                                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: STRUCTURED DATA                                   │
│  - LinkedIn profiles (BrightData)                           │
│  - GitHub (follows, repos, orgs)                           │
│  - Internal CRM (contacts, referrals)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation - Unified Graph Service

### New Files

**`types/socialMatrix.ts`**
```typescript
// Node types
type NodeType = 'person' | 'company' | 'school' | 'event' | 'content' | 'repo' | 'org';

interface MatrixNode {
  id: string;
  type: NodeType;
  name: string;
  metadata: Record<string, unknown>;
  source: 'linkedin' | 'github' | 'crm' | 'research';
}

// Edge types with weights
type EdgeType = 'worked_at' | 'studied_at' | 'follows' | 'contributed_to' |
                'spoke_at' | 'co_appeared_with' | 'contacted' | 'referred';

interface MatrixEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;           // 0-1
  confidence: number;       // 0-1
  status: 'verified' | 'plausible' | 'unverified';
  sources: string[];        // URLs or source identifiers
  metadata?: {
    startDate?: string;
    endDate?: string;
    context?: string;
  };
}

// Path result
interface ConnectionPath {
  nodes: MatrixNode[];
  edges: MatrixEdge[];
  totalWeight: number;
  explanation: string;
  verificationStatus: 'verified' | 'plausible' | 'unverified';
}
```

**`services/socialMatrixService.ts`**
- `buildGraph(recruiterId: string)` - Build recruiter's ego network
- `findPaths(source: string, target: string, maxHops: number)` - BFS path finding
- `rankPaths(paths: ConnectionPath[])` - Score by weight × recency × verification
- `getConnectionDegree(recruiterId: string, candidateId: string)` - Quick degree check
- Integrates existing `linkedInConnectionService`, `githubConnectionService`, `networkAnalysisService`

### Modify Existing

**`types.ts`**
- Add exports from `types/socialMatrix.ts`

**`services/candidateService.ts`**
- Add `connectionDegree` field to stored candidates

---

## Phase 2: Deep Research Integration

### New Files

**`services/deepResearchService.ts`**
```typescript
interface DeepResearchResult {
  discoveries: AIClaimEntity[];
  sources: string[];
  confidence: number;
}

// Functions:
- searchCoAppearances(personA: string, personB: string)
  // Uses BrightData SERP: "{personA}" "{personB}" conference|podcast|panel

- extractRelationships(url: string)
  // Scrapes page, extracts names + relationship context

- aiResearch(recruiter: Profile, candidate: Profile)
  // Gemini prompt for path discovery + explanation
```

**`lib/prompts/socialMatrix.ts`**
- `PATH_DISCOVERY_PROMPT` - Find paths between two people
- `RELATIONSHIP_EXPLANATION_PROMPT` - Explain why a path matters
- `CONNECTOR_DISCOVERY_PROMPT` - Find supernodes in network

**`app/api/deep-research/route.ts`**
- POST endpoint that triggers async deep research
- Returns job ID for polling
- Stores results in graph

### Modify Existing

**`services/geminiService.ts`**
- Add `analyzeConnectionPath()` function
- Add `explainRelationship()` function

---

## Phase 3: Verification Pipeline

### New Files

**`services/verificationService.ts`**
```typescript
interface VerificationResult {
  overallConfidence: number;
  verifiedSources: number;
  totalSources: number;
  status: 'verified' | 'plausible' | 'unverified' | 'rejected';
  sourceDetails: SourceVerification[];
}

// Functions:
- verifyClaim(claim: AIClaimEntity): Promise<VerificationResult>
  // Multi-source verification:
  // 1. Check AI-cited URL (scrape + verify names present)
  // 2. Independent SERP search (require 2+ confirming results)
  // 3. LinkedIn profile check (event in activities)

- admitEdgeToGraph(claim: AIClaimEntity, purpose: 'warm_intro' | 'display' | 'exploratory')
  // Apply admission rules based on purpose
```

### Admission Thresholds

| Purpose | Min Confidence | Min Sources |
|---------|----------------|-------------|
| `warm_intro` | 0.8 | 2 |
| `display` | 0.5 | 1 |
| `exploratory` | 0.3 | 0 |

---

## Phase 4: UI Components

### New Files

**`components/SocialMatrix/ConnectionBadge.tsx`**
- Small badge for search results
- Shows: `🔗 1st` (green), `🔗 2nd` (blue), `🔗 3rd` (gray), `🔗 ?` (loading)
- Tooltip on hover: "Connected via: {context}"

**`components/SocialMatrix/ConnectionPathCard.tsx`**
- Expandable card for profile pages
- Quick view: Degree + strongest path
- Expanded: All paths + verification status + deep research trigger

**`components/SocialMatrix/NetworkGraphView.tsx`**
- Full-screen graph visualization
- Extends existing `NetworkMap.tsx` with:
  - Color-coded nodes by type
  - Edge thickness by weight
  - Verification status indicators
  - Path highlighting

**`components/SocialMatrix/WarmIntroRequest.tsx`**
- Modal for requesting intro via connector
- Shows: Connector profile, your relationship, suggested message
- Actions: Edit, Copy, Open LinkedIn

### Modify Existing

**`app/search/page.tsx`** (or search result components)
- Add `<ConnectionBadge>` to each candidate card

**`app/profile/[username]/page.tsx`**
- Add `<ConnectionPathCard>` to profile layout
- Add "Network" tab linking to full graph

**`components/NetworkMap.tsx`**
- Refactor to accept unified graph format
- Add path highlighting feature
- Add verification status display

---

## Phase 5: Data Pipeline

### Background Enrichment

**On candidate view**:
1. Check cache for existing graph data
2. If stale (>24h) or missing, trigger async enrichment
3. Quick path check returns immediately from cache
4. Deep research runs in background, updates graph

**Recruiter profile caching**:
- Cache recruiter's LinkedIn profile on first use (7-day TTL)
- Cache GitHub follows/repos (24h TTL)
- Incremental updates on new data

### Storage Strategy

**v1**: localStorage + in-memory
- Store graph edges in localStorage (keyed by recruiter ID)
- Load into memory for path-finding

**v2** (future): Supabase
- Persist graph to database for cross-device sync
- Enable team-shared connection graphs

---

## File Summary

### New Files (10)
```
types/socialMatrix.ts
services/socialMatrixService.ts
services/deepResearchService.ts
services/verificationService.ts
lib/prompts/socialMatrix.ts
app/api/deep-research/route.ts
components/SocialMatrix/ConnectionBadge.tsx
components/SocialMatrix/ConnectionPathCard.tsx
components/SocialMatrix/NetworkGraphView.tsx
components/SocialMatrix/WarmIntroRequest.tsx
```

### Modified Files (6)
```
types.ts
services/geminiService.ts
app/search/page.tsx (or search result components)
app/profile/[username]/page.tsx
components/NetworkMap.tsx
services/candidateService.ts
```

---

## Verification Plan

### Manual Testing
1. **Search results**: Verify badge appears, shows correct degree, tooltip works
2. **Profile page**: Verify card loads, shows paths, expand/collapse works
3. **Deep research**: Trigger research, verify results appear, check verification status
4. **Network graph**: Open full graph, verify nodes/edges render, path highlighting works
5. **Warm intro**: Click request intro, verify modal shows correct info, copy works

### Integration Tests
1. Graph builder correctly merges LinkedIn + GitHub data
2. Path finder returns correct shortest paths
3. Verification service correctly validates/rejects AI claims
4. UI components handle loading/error states

### Edge Cases
- Candidate with no public data (show "No connections found")
- Recruiter not signed in (prompt to connect accounts)
- Deep research times out (show cached data + retry option)
- AI returns hallucinated data (verify rejection works)

---

## Dependencies

**Already installed**:
- `@xyflow/react` - Graph visualization
- BrightData integration (API routes exist)
- Gemini service (`geminiService.ts`)

**No new dependencies needed** - using existing stack.

---

## Estimated Credit Costs

| Operation | Est. Credits |
|-----------|--------------|
| LinkedIn profile fetch | 50 |
| Deep research (SERP + scrape) | 100 |
| AI path analysis | 150 |
| Full graph build | 300 |

Consider adding to PRICING constants in `types.ts`.

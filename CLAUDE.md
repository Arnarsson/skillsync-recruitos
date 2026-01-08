# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**6Degrees** is an AI-powered recruitment decision-support system built as a single-page React application. The system implements a 4-stage recruiting funnel: **Intake → Shortlist → Deep Profile → Outreach**. It uses Google Gemini for AI reasoning and Firecrawl for web scraping.

Key Architectural Principles:
- **Client-side only**: All data persists in `localStorage`, no backend server (except optional Supabase)
- **Credit economy**: Internal currency (`CR`) tracks AI operation costs
- **EU AI Act compliance**: Immutable audit logs for all high-risk profiling decisions

## Development Commands

### Running the Application
```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build to /dist
npm run preview  # Preview production build
```

### Testing & Quality
```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix ESLint errors
npm run format        # Format code with Prettier
npm run type-check    # TypeScript type checking
npm run validate      # Run all checks (types, lint, tests)
```

### Environment Configuration

**IMPORTANT:** Copy `.env.example` to `.env` before starting development.

API keys can be configured either via `.env` file or through the Admin Settings UI (stored in localStorage):
- `GEMINI_API_KEY` - Required for AI analysis
- `FIRECRAWL_API_KEY` - Required for job description scraping
- `BRIGHTDATA_API_KEY` - Optional for LinkedIn data extraction
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` - Optional for persistent storage
- `OPENROUTER_API_KEY` - Optional for alternative AI inference

**Security Note:** For production, use environment variables only. localStorage storage is vulnerable to XSS. See [SECURITY.md](./SECURITY.md) for details.

## Architecture

### 4-Stage Funnel Flow

The application enforces a linear workflow through `FunnelStage` enum:

1. **INTAKE** (`CalibrationEngine.tsx`): Job context extraction from URLs or raw text
2. **SHORTLIST** (`TalentHeatMap.tsx`): Candidate parsing, scoring (0-100), and pipeline management
3. **DEEP_PROFILE** (`BattleCardCockpit.tsx`): Evidence-based profiling with workstyle indicators
4. **OUTREACH** (`NetworkPathfinder.tsx`): Personalized message drafting

Navigation is controlled in `App.tsx` via React Router (HashRouter). The sidebar visually tracks funnel progress.

### State Management

**Persisted State** (via `usePersistedState` hook in localStorage):
- `apex_credits`: Credit balance
- `apex_logs`: Audit event history (`AuditEvent[]`)
- `apex_job_context`: Job description text

**Transient UI State** (React `useState`):
- `selectedCandidate`: Opens Deep Profile side panel
- `outreachCandidate`: Opens Outreach modal
- `showWallet`, `showSettings`: Modal visibility

### Core Services

All services are in `/services/`:

**geminiService.ts** - AI Intelligence Layer
- `analyzeCandidateProfile()`: Generates alignment scores + score breakdown
- `generatePersona()`: Psychometric profiling (archetype, soft skills, red/green flags)
- `generateDeepProfile()`: Evidence-based analysis with interview questions
- `generateOutreach()`: Personalized message drafting
- Uses structured JSON output via `responseMimeType` and `responseSchema`
- Implements retry logic for transient API errors (503, 429)

**candidateService.ts** - Data Persistence
- Dual-mode: Local cache + optional Supabase sync
- Always updates local cache first, then attempts DB write
- Maps internal `Candidate` interface to Supabase schema

**scrapingService.ts** - External Data Extraction
- Firecrawl integration for job description scraping
- BrightData integration for LinkedIn profile extraction (via `/api/brightdata` proxy)

**supabase.ts** - Optional Database Client
- Gracefully degrades if credentials missing
- Table: `candidates` with UUID primary keys

### Data Model (`types.ts`)

**Candidate Interface**:
- Core fields: `name`, `currentRole`, `company`, `location`, `yearsExperience`
- Scoring: `alignmentScore` (0-100), `scoreBreakdown` (5 weighted components)
- Deep Profile: `indicators` (workstyle traits), `interviewGuide`, `companyMatch`
- Persona: Optional `persona` object with psychometric analysis
- Funnel State: `unlockedSteps` array tracks which stages are accessible

**Score Breakdown Structure**:
- 5 components: `skills`, `experience`, `industry`, `seniority`, `location`
- Each component: `{ value, max, percentage }`
- Final score = weighted average across all components

### Component Architecture

**App.tsx** (Root):
- Manages global state and credit spending
- Implements `Layout` component with responsive sidebar
- Handles toast notifications and audit logging

**CalibrationEngine.tsx** (Step 1):
- URL scraping via Firecrawl or manual text input
- Job context saved to localStorage for downstream scoring

**TalentHeatMap.tsx** (Step 2):
- Candidate import via resume text or LinkedIn JSON
- Grid view with sorting/filtering by score and stage
- CSV export functionality
- "Deep Profile" unlock costs `PRICING.DEEP_PROFILE` credits

**BattleCardCockpit.tsx** (Step 3):
- Side panel display (slides in from right)
- Evidence-based analysis with confidence indicators
- Dynamic interview guide generation
- Company match scoring with strengths/friction points

**NetworkPathfinder.tsx** (Step 4):
- Modal overlay for outreach drafting
- Context-aware message generation using persona data

### Styling

- Tailwind CSS with custom color palette (`apex-900`, `apex-800`, etc.)
- FontAwesome 6 for icons
- Mobile-responsive with hamburger menu on small screens
- Custom selection colors: `selection:bg-emerald-500`

## Important Implementation Notes

### API Key Handling
- Keys retrieved via `localStorage.getItem()` first, then fallback to `process.env`
- Admin Settings UI validates keys before saving
- Gemini client initialized lazily in `getAiClient()`
- **Security Warning Banner** now displayed in AdminSettings about localStorage risks

### Performance Optimizations (Added 2026-01-07)
- All major components use `useCallback` for event handlers
- Computed values memoized with `useMemo` (candidate lists, radar charts)
- `usePersistedState` hook optimized to prevent unnecessary localStorage writes
- App.tsx callbacks properly memoized to prevent unnecessary re-renders

### Code Quality
- TypeScript `any` types replaced with proper type definitions
- Console statements wrapped in `process.env.NODE_ENV === 'development'` checks
- Centralized logging service available at `services/logger.ts`
- ESLint configured to enforce type safety and React best practices
- Prettier configured for consistent code formatting

### Credit System
- Pricing constants in `types.ts` under `PRICING` object
- All AI operations call `handleSpendCredits()` in App.tsx
- Credits displayed with EUR conversion (`CREDITS_TO_EUR = 0.54`)

### Error Handling
- Gemini API: Retry logic with exponential backoff for 503/429 errors
- Database: Graceful degradation to local-only mode
- Toast notifications for user feedback

### EU AI Act Compliance
- All profiling operations logged to `apex_logs` with:
  - Timestamp, cost, user, event type
  - Metadata field for model version and input hash
- Logs viewable in `AuditLogModal.tsx`

### Path Aliases
- `@/*` resolves to project root (configured in tsconfig.json + vite.config.ts)
- Use `@/types` instead of `../types` when possible

### BrightData Integration
- Dev server proxy in `vite.config.ts` handles `/api/brightdata` requests
- Production requires Vercel serverless function in `/api/brightdata.ts`
- Three actions: `trigger`, `progress`, `snapshot`

## Testing

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Test Structure
```
tests/
├── setup.ts                           # Test configuration
├── hooks/
│   └── usePersistedState.test.ts     # Hook tests
└── services/
    └── geminiService.test.ts         # Service tests
```

### Writing Tests
- Use Vitest + React Testing Library
- Mock localStorage in tests
- Test business logic in service layer
- Integration tests for complex component interactions

Example test:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('usePersistedState', () => {
  it('should persist state to localStorage', () => {
    const { result } = renderHook(() => usePersistedState('key', 'initial'));
    act(() => result.current[1]('updated'));
    expect(localStorage.getItem('key')).toBe(JSON.stringify('updated'));
  });
});
```

## Common Development Patterns

### Adding a New AI Operation
1. Add function to `geminiService.ts` with structured JSON schema
2. Update `AuditEventType` enum in `types.ts`
3. Add pricing to `PRICING` constant
4. Call `handleSpendCredits()` from component
5. Handle errors with toast notifications
6. **Use proper error types** (catch `unknown`, not `any`)
7. **Wrap callbacks in `useCallback`** with proper dependencies
8. **Memoize computed values** with `useMemo`

### Extending Candidate Model
1. Update `Candidate` interface in `types.ts`
2. Update Supabase mapping in `candidateService.ts`
3. Update relevant Gemini response schemas in `geminiService.ts`

### Adding New Funnel Stage
1. Add to `FunnelStage` enum
2. Create new component in `/components/`
3. Add route in `App.tsx`
4. Update sidebar in `Layout` component
5. Update `unlockedSteps` logic in scoring flow

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:
- **Lint & Test**: Runs ESLint, TypeScript checks, and Vitest
- **Build**: Creates production build
- **Security Scan**: Runs npm audit and TruffleHog

Configuration: `.github/workflows/ci.yml`

## Security Considerations

1. **Never commit API keys** to the repository
2. **Supabase credentials** must be provided via environment variables (no hardcoded fallbacks)
3. **Content Security Policy** configured in index.html to prevent XSS
4. **Row-Level Security** must be enabled on Supabase tables before production
5. See [SECURITY.md](./SECURITY.md) for comprehensive security guidelines

## Code Style

- **ESLint**: Enforces TypeScript best practices and React hooks rules
- **Prettier**: Automatic code formatting (single quotes, 100 char width)
- **Pre-commit**: Run `npm run validate` before committing
- **Import order**: React → External libs → Internal services → Types → Styles

## Performance Best Practices

1. **Always use `useCallback`** for event handlers passed as props
2. **Always use `useMemo`** for computed values/filtered lists
3. **Wrap large lists** with virtualization if >100 items
4. **Lazy load** heavy components with `React.lazy()`
5. **Optimize images** and use appropriate formats
6. **Monitor bundle size** with `npm run build` output

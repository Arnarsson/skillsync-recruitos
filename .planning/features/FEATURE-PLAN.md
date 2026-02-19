# RecruitOS Feature Plan
**Date:** 2026-02-16 | **Validated by:** Organizational psychologist (Andreas, Cent)

---

## What This Is

After a deep conversation with Andreas (organizational psychologist), we audited the entire product. He gave us direct, honest feedback on what works, what's misleading, and what recruiters actually need.

**The core shift:** RecruitOS should move from "AI decides who's good" to "AI shows you evidence, you decide with clear criteria."

---

## What We Got Right

- Chrome extension for LinkedIn capture (legal, EU-compliant)
- Anti-gaming filters (catches fake repos, tutorial projects, commit spam)
- EU AI Act audit trail (every AI decision is logged and traceable)
- GitHub activity analysis (real behavioral data from how people actually code)

## What Needs to Change

### 1. Stop calling it "Psychometric Profile"

**The problem:** We call our AI-generated profiles "psychometric" — but we're not running psychometric tests. We're analyzing GitHub commits and LinkedIn text. An organizational psychologist immediately flagged this as overclaiming. It's the same trap as DISC profiles: feels accurate, but isn't validated.

**The fix:** Rename to "Behavioral Profile" and be upfront about what data we actually use.

**What the recruiter sees:**
- Before: "Psychometric Profile: Creative Innovator"
- After: "Behavioral Profile (based on GitHub activity + LinkedIn)" with a note: *"This provides hypotheses for interview exploration, not validated assessments."*

**Why it matters:** Professional credibility. When you show this to a hiring manager who works with psychologists, they'll trust it more if we're honest about what it is.

**Effort:** 1-2 days for visible changes

---

### 2. Let hiring managers define "what good looks like" before searching

**The problem:** Right now, you paste a job description and the AI extracts skills. But there's no step where the hiring manager says "for THIS role, collaboration matters more than raw coding skill" or "we need someone who can lead, not just execute."

**What Andreas said:** The best recruitment outcomes come from agreeing on evaluation criteria BEFORE you start looking. Otherwise you're matching against a job description, not against what the team actually needs.

**The fix:** Add a "Define Criteria" step after intake, before search:
1. Paste job description (existing)
2. **Define what matters** (new) — drag sliders to weight: Technical Skills vs Experience vs Leadership vs Culture Fit
3. Review extracted skills (existing)
4. Search and score candidates against YOUR criteria

**What the recruiter sees:**
- Scoring weights you can adjust per role ("For this CTO hire, weight leadership at 40%")
- Preset templates: "Senior Engineer", "Tech Lead", "Founding Engineer"
- Custom criteria: add "Startup experience" or "Open source contributor" as scoring factors

**Why it matters:** This is what separates a screening tool from a proper recruitment platform. Headhunters charge thousands because they understand the role — we can help recruiters get that same clarity.

**Effort:** 2-3 weeks for the full flow

---

### 3. Show where the data comes from and how fresh it is

**The problem:** A profile built from 5 years of GitHub activity with a complete LinkedIn is very different from one built on 3 repos and no LinkedIn. But they look the same in the UI.

**What Andreas called this:** The "short map" problem — any profile is a simplification of reality. You need to know how much data went into it.

**The fix:** Show data freshness, completeness, and confidence:
- "GitHub: 47 repos, 1,200 commits — updated 2 days ago"
- "LinkedIn: Experience + Education only (skills section missing)"
- "Score confidence: High (rich data from multiple sources)"
- Warning when data is older than 30 days: "This profile may be outdated. Refresh?"

**What the recruiter sees:**
- Clear badges showing what data sources are available
- Confidence indicator (green/yellow/red) on every score
- "Refresh" button for stale profiles

**Why it matters:** Builds trust. A recruiter who knows the score is based on thin data will use it differently than one based on years of activity. No surprises.

**Effort:** 1-2 weeks

---

### 4. Fix LinkedIn enrichment (the demo broke)

**The problem:** During a live demo with Andreas, the LinkedIn enrichment failed. The system tries 4 different scraping methods in sequence (taking 20-30 seconds), and when they all fail, the user just sees a spinner that eventually stops.

**The fix:**
- Skip the slow methods and go straight to the one that works 80% of the time (saves 5-10 seconds)
- Show progress: "Fetching LinkedIn data... (15 seconds)" instead of just a spinner
- Cache results so we don't re-scrape the same profile twice
- Activate 900 lines of enrichment code that was already built but never connected

**What the recruiter sees:**
- LinkedIn enrichment works reliably in demos
- Clear feedback when something takes time
- Faster repeat lookups (cached)

**Why it matters:** If it breaks in a demo, it breaks trust. This is table stakes.

**Effort:** 1 week

---

### 5. Add bias detection and fake profile warnings

**The problem:** Two risks that grow as we scale:
1. **Bias:** The AI might use language that implies age, gender, or other protected characteristics. ("Experienced professional" can be code for "older.") Recruiters need to know if the AI output could get them in trouble.
2. **Fake profiles:** Gartner predicts 25% of job applications will be fake by 2028. We currently trust GitHub and LinkedIn data at face value.

**What Andreas said:** Recruitment is "notoriously filled with bias." A recruiter's #1 concern is "will this AI get me sued?"

**The fix:**
- **Bias warnings:** Flag when AI-generated text contains potentially biased language. Non-blocking (just a yellow warning), with suggestions for neutral alternatives.
- **Fake detection:** Cross-reference GitHub activity dates with LinkedIn employment history. Flag mismatches: "Claims Senior Engineer 2020-2023 but no GitHub activity in that period."
- **EU AI Act notice:** When a candidate enters the pipeline, they get notified their public data was analyzed (required by law).

**What the recruiter sees:**
- Yellow badge: "2 Bias Warnings" (click to see details + suggestions)
- Profile authenticity score: Green (verified) / Yellow (verify manually) / Red (suspicious)
- Compliance checkbox: "Candidate notified per EU AI Act"

**Why it matters:** Legal protection and trust. Enterprise clients will require this.

**Effort:** 2-3 weeks

---

## Roadmap

| When | What | Visible Result |
|------|------|----------------|
| **This week** | Rename to "Behavioral Profile", add data source banners, fix LinkedIn speed | Honest labeling, faster LinkedIn, transparency notices |
| **Week 2-3** | Data freshness, staleness warnings, bias detection (logging only) | "Last updated 2 days ago", EU AI Act compliance started |
| **Week 4-5** | Data completeness panel, LinkedIn caching, activate enrichment V2 | Richer profiles, faster lookups, profile completeness shown |
| **Week 6-7** | Criteria definition UI, adjustable scoring weights, bias warnings in UI | Hiring managers define what matters, bias flags visible |
| **Week 8-9** | Custom criteria scoring, reusable templates, fake profile detection | Score against custom criteria, authenticity badges |
| **Week 10-12** | Auto-refresh profiles, track job changes over time, stakeholder approval flow | Always-fresh data, "just got promoted" signals, team sign-off |

---

## Quick Wins (Ship This Week)

| # | What | Time | Impact |
|---|------|------|--------|
| 1 | Rename "Psychometric" to "Behavioral" in all visible labels | 1 day | Professional credibility |
| 2 | Add banner: "This profile is based on GitHub + LinkedIn activity" | 1 day | Trust + EU compliance |
| 3 | Skip slow LinkedIn scraping tiers, go straight to the fast one | 1 day | Fixes demo failures |
| 4 | Track when each data source was last fetched | 1 day | Foundation for freshness warnings |
| 5 | Fix 3 broken tests in the anti-gaming system | 1 day | Reliability baseline |

---

## How This Connects to Revenue

| Feature | Revenue Impact |
|---------|---------------|
| Criteria-based evaluation | Unlocks enterprise sales — this is what org psychologists and HR leaders expect |
| Bias detection | Required for EU enterprise clients (legal compliance) |
| Data transparency | Builds recruiter trust — they'll use the tool more if they understand it |
| LinkedIn reliability | Table stakes — broken demos kill deals |
| Fake profile detection | Differentiator — "we catch what others miss" |
| Behavioral (not psychometric) | Credibility with professionals who know the difference |

---

## What Andreas Would Want to See Next

Based on the conversation, these would make him want to use (and recommend) the product:

1. **"What does the role call for?" step** — before any search happens
2. **Honest labeling** — "behavioral profile from observable data", not "psychometric assessment"
3. **Evidence links** — click any trait to see the GitHub/LinkedIn data behind it
4. **Team composition view** — "your team is heavy on individual contributors, this candidate adds collaboration"
5. **Interview guide tied to criteria** — questions mapped to the criteria the hiring manager defined, not generic

---

*Based on 5 technical audits examining 40+ source files across the codebase. Full technical details in the audit-*.md files in this directory.*

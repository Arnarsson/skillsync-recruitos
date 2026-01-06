# 6Degrees - Recruitment OS

6Degrees is an evidence-based decision support system designed for high-stakes internal recruitment. It functions as a specialized Operating System (OS) that guides recruiters through a structured funnel: **Intake -> Shortlist -> Deep Profile -> Outreach**.

## Features

### 1. Calibration Engine (Job Intake)
*   **Context Extraction:** Automatically scrapes and parses job descriptions from URLs (via Firecrawl) or accepts manual input.
*   **Social Context:** Calibrates for team culture by analyzing hiring manager and benchmark profiles.

### 2. Talent Heatmap (Shortlist)
*   **AI Alignment Scoring:** Scores candidates (0-100%) against specific job requirements using Gemini 2.5 Flash.
*   **Live Import:** Paste raw resume text or LinkedIn profile data to generate instant analysis and scores for new candidates.
*   **Visual Grid:** Responsive card/grid layout to manage the candidate pipeline.

### 3. Battle Card Cockpit (Deep Profile)
*   **Evidence Reports:** Unlocks detailed analysis including "Culture Fit", "Trajectory Analysis", and "Workstyle Indicators".
*   **Interview Guide:** Generates dynamic, hypothesis-driven interview questions based on candidate weak points.
*   **Citation Mode:** AI cites specific text fragments from the profile as evidence for its claims.

### 4. Network Pathfinder (Outreach)
*   **Connection Paths:** Identifies warm introduction paths (simulated/mock data).
*   **Smart Drafting:** Generates personalized outreach messages based on shared context and specific hooks found in the profile.

### 5. Enterprise Grade
*   **Audit Logging:** EU AI Act compliant logging for all high-risk profiling decisions.
*   **Credit System:** Simulated currency system to track usage and ROI.
*   **Responsive:** Fully mobile-optimized layout with a collapsible sidebar and touch-friendly interfaces.

## Configuration

This application requires API keys for full functionality. These can be configured in the **Admin Settings** (click the User profile in the sidebar).

*   **Gemini API Key:** Required for all intelligence features (Scoring, Profiling, Outreach).
*   **Firecrawl API Key:** Required for scraping Job Descriptions from URLs.
*   **OpenRouter API Key:** (Optional) For alternative inference models.

## Tech Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI:** Google Gemini API (`gemini-2.5-flash`)
*   **Scraping:** Firecrawl API
*   **Icons:** FontAwesome 6

## License

MIT

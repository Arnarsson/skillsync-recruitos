# 6Degrees - AI-Powered Recruitment OS

6Degrees is a sophisticated decision-support system designed for high-stakes internal recruitment. It streamlines the talent acquisition funnel through four rigorous stages: **Intake**, **Shortlist**, **Deep Profile**, and **Outreach**.

The system replaces intuition with evidence-based intelligence, utilizing **Google Gemini** for reasoning and **Firecrawl** for data extraction.

## 🚀 Core Modules

### 1. Calibration Engine (Job Intake)
*   **Context Extraction**: Automatically scrapes job descriptions from live URLs (via Firecrawl) or processes raw text input.
*   **Social Calibration**: Analyzes hiring manager and benchmark profiles to align with team culture.

### 2. Talent Heatmap (Shortlist)
*   **Live Candidate Import**: Paste raw resume text or LinkedIn JSON to instantly parse, score, and rank candidates against the job context.
*   **AI Alignment Scoring**: Dynamic 0-100% scoring based on weighted job requirements (Skills, Experience, Industry, Seniority, Location).
*   **Visual Pipeline**: Interactive grid view with confidence indicators and actionable insights.

### 3. Battle Card Cockpit (Deep Profile)
*   **Evidence-Based Analysis**: Generates "Deep Profile" reports citing specific evidence fragments from the candidate's history.
*   **Workstyle Indicators**: Detects traits like "Structured Communication" or "Rapid Trajectory" from resume patterns.
*   **Dynamic Interview Guide**: Creates hypothesis-driven questions to probe specific risks identified in the profile.

### 4. Network Pathfinder (Outreach)
*   **Smart Drafting**: Drafts hyper-personalized outreach messages using shared context hooks (e.g., "We both worked at [Company]").
*   **Connection Paths**: Identifies warm introduction routes (simulated).

## 🛡️ Enterprise Features

*   **EU AI Act Compliance**: Immutable audit logs track all high-risk profiling decisions, model versions, and input hashes.
*   **Credit Economy**: Internal currency system (`CR`) to track ROI and manage usage quotas.
*   **Privacy First**: No backend storage. All API keys and candidate data persist securely in the browser (`localStorage`).
*   **Responsive Design**: Fully optimized for desktop and mobile workflows.

## ⚙️ Configuration

To unlock the full intelligence of the OS, configure your API keys in the **Admin Settings** (click the user avatar in the sidebar).

| Service | Purpose | Required? |
| :--- | :--- | :--- |
| **Google Gemini API** | Scoring, Profiling, Drafting | ✅ Yes |
| **Firecrawl API** | Job Description Scraping | ✅ Yes |
| **OpenRouter API** | Alternative Inference Models | ❌ Optional |

*Note: Keys are stored locally in your browser and are never sent to a backend server.*

## 💻 Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **Intelligence**: @google/genai (Gemini 2.5 Flash)
*   **Data**: Firecrawl (Web Scraping)
*   **Icons**: FontAwesome 6
*   **State**: Client-side Persistence

---
*6Degrees is a concept OS for the future of recruitment.*
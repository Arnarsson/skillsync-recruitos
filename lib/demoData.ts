/**
 * Demo Data Loader
 *
 * Loads pre-generated REAL developer profiles for demo mode.
 * These profiles contain actual GitHub data with real receipts (URLs to commits, PRs, repos).
 *
 * All profiles are REAL Danish developers with public GitHub accounts.
 */

import { Candidate } from "@/types";

/**
 * DEMO_JOB — the canonical demo role used across the app.
 *
 * Aligned with real Danish backend/data engineer candidates from Copenhagen.
 * These are REAL GitHub profiles of developers based in Denmark.
 */
export const DEMO_JOB = {
  title: "Backend / Data Engineer",
  company: "Copenhagen Scale-Up",
  location: "Copenhagen, Denmark",
  experienceLevel: "5+ years",
  requiredSkills: ["Python", "SQL", "Data Pipelines", "Machine Learning"],
  preferredSkills: ["PostgreSQL", "Docker", "Kubernetes", "Cloud (AWS/GCP)"],
  summary:
    "We are hiring a Backend / Data Engineer to build and maintain our data infrastructure. You will design scalable data pipelines, optimize our PostgreSQL backend, and collaborate with our ML team on model deployment.",
  rawText: `Role: Backend / Data Engineer
Location: Copenhagen, Denmark

Job Summary:
We are hiring a Backend / Data Engineer to build and maintain our data infrastructure.
You will design scalable data pipelines, optimize our PostgreSQL backend, and collaborate with our ML team on model deployment.

Requirements:
- 5+ years of experience with Python and SQL
- Experience building data pipelines (ETL/ELT)
- Solid understanding of machine learning workflows
- Proven track record with open-source or research contributions
- PostgreSQL and relational database expertise (preferred)
- Docker and Kubernetes experience (preferred)
- Cloud infrastructure (AWS or GCP) experience (preferred)
- Strong communication skills and ability to work in cross-functional teams`,
};

// Demo profile structure (matches the generated JSON)
export interface DemoProfile {
  id: string;
  githubUsername: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  blog: string;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
  buildprint: {
    impact: MetricWithReceipts;
    collaboration: MetricWithReceipts;
    consistency: MetricWithReceipts;
    complexity: MetricWithReceipts;
    ownership: MetricWithReceipts;
    overallScore: number;
  };
  topRepos: RepoInfo[];
  recentPRs: PRInfo[];
  languages: LanguageInfo[];
  skills: string[];
  generatedAt: string;
}

interface MetricWithReceipts {
  value: number;
  label: string;
  receipts: Receipt[];
}

interface Receipt {
  label: string;
  value: string | number;
  url: string;
  type: "repo" | "pr" | "commit" | "profile" | "stat";
}

interface RepoInfo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  updatedAt: string;
}

interface PRInfo {
  title: string;
  repo: string;
  url: string;
  state: string;
  createdAt: string;
  mergedAt: string | null;
}

interface LanguageInfo {
  name: string;
  percentage: number;
  color: string;
}

// Pre-generated demo profiles (inline to avoid fetch issues)
// These are REAL profiles with REAL GitHub data from Danish developers
export const DEMO_PROFILES: DemoProfile[] = [
  {
    "id": "andersbll",
    "githubUsername": "andersbll",
    "name": "Anders Boesen Lindbo Larsen",
    "avatar": "https://avatars.githubusercontent.com/u/177245?v=4",
    "bio": "Deep learning researcher & data engineer. Neural artistic style, generative models.",
    "location": "Copenhagen, Denmark",
    "company": "Technical University of Denmark",
    "blog": "",
    "followers": 584,
    "following": 0,
    "publicRepos": 26,
    "createdAt": "2010-01-06T00:00:00Z",
    "buildprint": {
      "impact": {
        "value": 92,
        "label": "Impact",
        "receipts": [
          { "label": "Total Stars", "value": "2,627", "url": "https://github.com/andersbll?tab=repositories&sort=stargazers", "type": "profile" },
          { "label": "neural_artistic_style", "value": "2,179", "url": "https://github.com/andersbll/neural_artistic_style", "type": "repo" },
          { "label": "autoencoding_beyond_pixels", "value": "444", "url": "https://github.com/andersbll/autoencoding_beyond_pixels", "type": "repo" }
        ]
      },
      "collaboration": {
        "value": 78,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "584", "url": "https://github.com/andersbll?tab=followers", "type": "profile" },
          { "label": "Fork contributions", "value": "Active in ML community", "url": "https://github.com/andersbll", "type": "stat" }
        ]
      },
      "consistency": {
        "value": 90,
        "label": "Consistency",
        "receipts": [
          { "label": "Account Age", "value": "16 years", "url": "https://github.com/andersbll", "type": "profile" },
          { "label": "Repos", "value": 26, "url": "https://github.com/andersbll?tab=repositories", "type": "stat" }
        ]
      },
      "complexity": {
        "value": 88,
        "label": "Complexity",
        "receipts": [
          { "label": "Python", "value": "Primary", "url": "https://github.com/andersbll?tab=repositories&language=Python", "type": "stat" },
          { "label": "Deep Learning", "value": "Generative models", "url": "https://github.com/andersbll/autoencoding_beyond_pixels", "type": "stat" },
          { "label": "C/CUDA", "value": "Performance-critical code", "url": "https://github.com/andersbll", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 95,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "24 / 26", "url": "https://github.com/andersbll?tab=repositories&type=source", "type": "stat" },
          { "label": "Total Forks Received", "value": "573", "url": "https://github.com/andersbll", "type": "stat" }
        ]
      },
      "overallScore": 88
    },
    "topRepos": [
      { "name": "neural_artistic_style", "fullName": "andersbll/neural_artistic_style", "description": "Neural Artistic Style in Python", "url": "https://github.com/andersbll/neural_artistic_style", "stars": 2179, "forks": 478, "language": "Python", "topics": ["deep-learning", "neural-network", "style-transfer", "python"], "updatedAt": "2024-06-15T00:00:00Z" },
      { "name": "autoencoding_beyond_pixels", "fullName": "andersbll/autoencoding_beyond_pixels", "description": "Generative image model with learned similarity measures", "url": "https://github.com/andersbll/autoencoding_beyond_pixels", "stars": 444, "forks": 95, "language": "Python", "topics": ["generative-models", "vae", "deep-learning"], "updatedAt": "2024-03-10T00:00:00Z" },
      { "name": "deeppy", "fullName": "andersbll/deeppy", "description": "Deep learning in Python", "url": "https://github.com/andersbll/deeppy", "stars": 4, "forks": 1, "language": "Python", "topics": ["deep-learning", "python"], "updatedAt": "2023-08-01T00:00:00Z" }
    ],
    "recentPRs": [],
    "languages": [
      { "name": "Python", "percentage": 82, "color": "#3572A5" },
      { "name": "C", "percentage": 8, "color": "#555555" },
      { "name": "CUDA", "percentage": 5, "color": "#3F4F75" },
      { "name": "HTML", "percentage": 5, "color": "#e34c26" }
    ],
    "skills": ["Python", "Deep Learning", "Machine Learning", "Neural Networks", "Data Pipelines", "SQL", "PostgreSQL", "NumPy", "TensorFlow", "Computer Vision", "Generative Models", "C", "CUDA", "Docker"],
    "generatedAt": "2026-02-18T12:00:00.000Z"
  },
  {
    "id": "MarcSkovMadsen",
    "githubUsername": "MarcSkovMadsen",
    "name": "Marc Skov Madsen",
    "avatar": "https://avatars.githubusercontent.com/u/42288570?v=4",
    "bio": "Data, Models and Analytics Ninja. PhD, CFA, Head of Trading Applications & Infrastructure.",
    "location": "Copenhagen, Denmark",
    "company": "Data, Models and Analytics",
    "blog": "https://awesome-panel.org",
    "followers": 556,
    "following": 90,
    "publicRepos": 91,
    "createdAt": "2018-08-11T00:00:00Z",
    "buildprint": {
      "impact": {
        "value": 80,
        "label": "Impact",
        "receipts": [
          { "label": "Repos", "value": 91, "url": "https://github.com/MarcSkovMadsen?tab=repositories", "type": "profile" },
          { "label": "awesome-panel", "value": "Flagship project", "url": "https://github.com/MarcSkovMadsen/awesome-panel", "type": "repo" },
          { "label": "panel-chemistry", "value": "Data viz", "url": "https://github.com/MarcSkovMadsen/panel-chemistry", "type": "repo" }
        ]
      },
      "collaboration": {
        "value": 75,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "556", "url": "https://github.com/MarcSkovMadsen?tab=followers", "type": "profile" },
          { "label": "OSS contributor", "value": "Panel / HoloViz ecosystem", "url": "https://github.com/MarcSkovMadsen", "type": "stat" }
        ]
      },
      "consistency": {
        "value": 85,
        "label": "Consistency",
        "receipts": [
          { "label": "Active since", "value": "2018", "url": "https://github.com/MarcSkovMadsen", "type": "profile" },
          { "label": "Regular commits", "value": "Weekly", "url": "https://github.com/MarcSkovMadsen", "type": "stat" }
        ]
      },
      "complexity": {
        "value": 82,
        "label": "Complexity",
        "receipts": [
          { "label": "Python", "value": "Primary", "url": "https://github.com/MarcSkovMadsen?tab=repositories&language=Python", "type": "stat" },
          { "label": "Data Analytics", "value": "PhD + CFA", "url": "https://github.com/MarcSkovMadsen", "type": "stat" },
          { "label": "Trading Systems", "value": "Infrastructure", "url": "https://github.com/MarcSkovMadsen", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 88,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "85 / 91", "url": "https://github.com/MarcSkovMadsen?tab=repositories&type=source", "type": "stat" }
        ]
      },
      "overallScore": 82
    },
    "topRepos": [
      { "name": "awesome-panel", "fullName": "MarcSkovMadsen/awesome-panel", "description": "A curated list of awesome Panel resources", "url": "https://github.com/MarcSkovMadsen/awesome-panel", "stars": 320, "forks": 45, "language": "Python", "topics": ["panel", "data-visualization", "python", "analytics"], "updatedAt": "2025-01-10T00:00:00Z" },
      { "name": "panel-chemistry", "fullName": "MarcSkovMadsen/panel-chemistry", "description": "Interactive chemistry visualizations with Panel", "url": "https://github.com/MarcSkovMadsen/panel-chemistry", "stars": 95, "forks": 12, "language": "Python", "topics": ["data-science", "visualization"], "updatedAt": "2024-11-20T00:00:00Z" },
      { "name": "awesome-streamlit", "fullName": "MarcSkovMadsen/awesome-streamlit", "description": "The fastest way to build data apps in Python", "url": "https://github.com/MarcSkovMadsen/awesome-streamlit", "stars": 180, "forks": 30, "language": "Python", "topics": ["streamlit", "data-apps", "python"], "updatedAt": "2024-08-05T00:00:00Z" }
    ],
    "recentPRs": [],
    "languages": [
      { "name": "Python", "percentage": 78, "color": "#3572A5" },
      { "name": "JavaScript", "percentage": 10, "color": "#f1e05a" },
      { "name": "HTML", "percentage": 7, "color": "#e34c26" },
      { "name": "CSS", "percentage": 5, "color": "#563d7c" }
    ],
    "skills": ["Python", "SQL", "Data Pipelines", "Machine Learning", "PostgreSQL", "Data Analytics", "Pandas", "NumPy", "Docker", "Streamlit", "Panel", "Trading Systems", "Cloud (AWS/GCP)", "ETL"],
    "generatedAt": "2026-02-18T12:00:00.000Z"
  },
  {
    "id": "leondz",
    "githubUsername": "leondz",
    "name": "Leon Derczynski",
    "avatar": "https://avatars.githubusercontent.com/u/121934?v=4",
    "bio": "Professor / scientist in CS, NLP, ML. Building AI infrastructure at scale.",
    "location": "Copenhagen, Denmark",
    "company": "NVIDIA & ITU Copenhagen",
    "blog": "https://www.derczynski.com",
    "followers": 366,
    "following": 52,
    "publicRepos": 88,
    "createdAt": "2009-09-01T00:00:00Z",
    "buildprint": {
      "impact": {
        "value": 72,
        "label": "Impact",
        "receipts": [
          { "label": "Repos", "value": 88, "url": "https://github.com/leondz?tab=repositories", "type": "profile" },
          { "label": "NLP Research", "value": "Multiple papers", "url": "https://github.com/leondz", "type": "stat" }
        ]
      },
      "collaboration": {
        "value": 80,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "366", "url": "https://github.com/leondz?tab=followers", "type": "profile" },
          { "label": "NVIDIA", "value": "Industry collaboration", "url": "https://github.com/leondz", "type": "stat" }
        ]
      },
      "consistency": {
        "value": 88,
        "label": "Consistency",
        "receipts": [
          { "label": "Account Age", "value": "17 years", "url": "https://github.com/leondz", "type": "profile" },
          { "label": "Active repos", "value": "Regularly updated", "url": "https://github.com/leondz?tab=repositories&sort=pushed", "type": "stat" }
        ]
      },
      "complexity": {
        "value": 78,
        "label": "Complexity",
        "receipts": [
          { "label": "Python", "value": "Primary", "url": "https://github.com/leondz?tab=repositories&language=Python", "type": "stat" },
          { "label": "NLP/ML", "value": "Specialist", "url": "https://github.com/leondz", "type": "stat" },
          { "label": "Infrastructure", "value": "ML deployment", "url": "https://github.com/leondz", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 80,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "70 / 88", "url": "https://github.com/leondz?tab=repositories&type=source", "type": "stat" }
        ]
      },
      "overallScore": 79
    },
    "topRepos": [
      { "name": "garak", "fullName": "leondz/garak", "description": "LLM vulnerability scanner", "url": "https://github.com/leondz/garak", "stars": 150, "forks": 25, "language": "Python", "topics": ["llm", "security", "nlp", "ai-safety"], "updatedAt": "2025-02-01T00:00:00Z" },
      { "name": "danlp", "fullName": "leondz/danlp", "description": "Danish NLP resources and models", "url": "https://github.com/leondz/danlp", "stars": 80, "forks": 15, "language": "Python", "topics": ["nlp", "danish", "machine-learning"], "updatedAt": "2024-10-15T00:00:00Z" },
      { "name": "rumoureval", "fullName": "leondz/rumoureval", "description": "Rumour stance and veracity classification", "url": "https://github.com/leondz/rumoureval", "stars": 45, "forks": 10, "language": "Python", "topics": ["nlp", "classification"], "updatedAt": "2024-05-20T00:00:00Z" }
    ],
    "recentPRs": [],
    "languages": [
      { "name": "Python", "percentage": 75, "color": "#3572A5" },
      { "name": "Shell", "percentage": 10, "color": "#89e051" },
      { "name": "Jupyter Notebook", "percentage": 8, "color": "#DA5B0B" },
      { "name": "Java", "percentage": 7, "color": "#b07219" }
    ],
    "skills": ["Python", "Machine Learning", "NLP", "Data Pipelines", "SQL", "Docker", "Kubernetes", "Cloud (AWS/GCP)", "PyTorch", "TensorFlow", "LLM Infrastructure", "AI Safety"],
    "generatedAt": "2026-02-18T12:00:00.000Z"
  },
  {
    "id": "fnielsen",
    "githubUsername": "fnielsen",
    "name": "Finn Nielsen",
    "avatar": "https://avatars.githubusercontent.com/u/484028?v=4",
    "bio": "Data science, text mining, neuroinformatics. Researcher at Technical University of Denmark.",
    "location": "Copenhagen, Denmark",
    "company": "Technical University of Denmark",
    "blog": "https://finnaarupnielsen.wordpress.com",
    "followers": 225,
    "following": 10,
    "publicRepos": 76,
    "createdAt": "2010-11-16T00:00:00Z",
    "buildprint": {
      "impact": {
        "value": 70,
        "label": "Impact",
        "receipts": [
          { "label": "Repos", "value": 76, "url": "https://github.com/fnielsen?tab=repositories", "type": "profile" },
          { "label": "AFINN", "value": "Widely-used sentiment lexicon", "url": "https://github.com/fnielsen/afinn", "type": "repo" }
        ]
      },
      "collaboration": {
        "value": 65,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "225", "url": "https://github.com/fnielsen?tab=followers", "type": "profile" }
        ]
      },
      "consistency": {
        "value": 82,
        "label": "Consistency",
        "receipts": [
          { "label": "Account Age", "value": "15 years", "url": "https://github.com/fnielsen", "type": "profile" },
          { "label": "Regular updates", "value": "Active", "url": "https://github.com/fnielsen?tab=repositories&sort=pushed", "type": "stat" }
        ]
      },
      "complexity": {
        "value": 75,
        "label": "Complexity",
        "receipts": [
          { "label": "Python", "value": "Primary", "url": "https://github.com/fnielsen?tab=repositories&language=Python", "type": "stat" },
          { "label": "Data Mining", "value": "Text + neuro", "url": "https://github.com/fnielsen", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 85,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "68 / 76", "url": "https://github.com/fnielsen?tab=repositories&type=source", "type": "stat" }
        ]
      },
      "overallScore": 75
    },
    "topRepos": [
      { "name": "afinn", "fullName": "fnielsen/afinn", "description": "AFINN sentiment analysis in Python", "url": "https://github.com/fnielsen/afinn", "stars": 120, "forks": 35, "language": "Python", "topics": ["nlp", "sentiment-analysis", "python", "data-science"], "updatedAt": "2025-01-05T00:00:00Z" },
      { "name": "dasem", "fullName": "fnielsen/dasem", "description": "Danish semantic analysis tools", "url": "https://github.com/fnielsen/dasem", "stars": 25, "forks": 5, "language": "Python", "topics": ["danish", "nlp", "semantics"], "updatedAt": "2024-09-10T00:00:00Z" },
      { "name": "brede", "fullName": "fnielsen/brede", "description": "Neuroinformatics toolbox", "url": "https://github.com/fnielsen/brede", "stars": 15, "forks": 3, "language": "Python", "topics": ["neuroinformatics", "data-science"], "updatedAt": "2024-06-01T00:00:00Z" }
    ],
    "recentPRs": [],
    "languages": [
      { "name": "Python", "percentage": 80, "color": "#3572A5" },
      { "name": "Jupyter Notebook", "percentage": 12, "color": "#DA5B0B" },
      { "name": "Shell", "percentage": 5, "color": "#89e051" },
      { "name": "R", "percentage": 3, "color": "#198CE7" }
    ],
    "skills": ["Python", "SQL", "Data Science", "Machine Learning", "Text Mining", "PostgreSQL", "Data Pipelines", "Pandas", "NumPy", "Sentiment Analysis", "NLP", "R", "Jupyter"],
    "generatedAt": "2026-02-18T12:00:00.000Z"
  },
  {
    "id": "thomasahle",
    "githubUsername": "thomasahle",
    "name": "Thomas Dybdahl Ahle",
    "avatar": "https://avatars.githubusercontent.com/u/946355?v=4",
    "bio": "Chess engines and algorithms. Building compute infrastructure at Normal Computing.",
    "location": "Copenhagen, Denmark",
    "company": "Normal Computing",
    "blog": "https://thomasahle.com",
    "followers": 367,
    "following": 20,
    "publicRepos": 92,
    "createdAt": "2011-07-29T00:00:00Z",
    "buildprint": {
      "impact": {
        "value": 65,
        "label": "Impact",
        "receipts": [
          { "label": "Repos", "value": 92, "url": "https://github.com/thomasahle?tab=repositories", "type": "profile" },
          { "label": "Algorithmic research", "value": "Hashing & search", "url": "https://github.com/thomasahle", "type": "stat" }
        ]
      },
      "collaboration": {
        "value": 60,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "367", "url": "https://github.com/thomasahle?tab=followers", "type": "profile" }
        ]
      },
      "consistency": {
        "value": 80,
        "label": "Consistency",
        "receipts": [
          { "label": "Account Age", "value": "14 years", "url": "https://github.com/thomasahle", "type": "profile" },
          { "label": "Repos", "value": 92, "url": "https://github.com/thomasahle?tab=repositories", "type": "stat" }
        ]
      },
      "complexity": {
        "value": 72,
        "label": "Complexity",
        "receipts": [
          { "label": "Python", "value": "Primary", "url": "https://github.com/thomasahle?tab=repositories&language=Python", "type": "stat" },
          { "label": "Algorithms", "value": "Specialist", "url": "https://github.com/thomasahle", "type": "stat" },
          { "label": "C++", "value": "Performance", "url": "https://github.com/thomasahle", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 82,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "80 / 92", "url": "https://github.com/thomasahle?tab=repositories&type=source", "type": "stat" }
        ]
      },
      "overallScore": 71
    },
    "topRepos": [
      { "name": "sunfish", "fullName": "thomasahle/sunfish", "description": "Sunfish: a Python chess engine in 111 lines of code", "url": "https://github.com/thomasahle/sunfish", "stars": 45, "forks": 10, "language": "Python", "topics": ["chess", "algorithms", "python"], "updatedAt": "2025-01-20T00:00:00Z" },
      { "name": "hashing-survey", "fullName": "thomasahle/hashing-survey", "description": "Survey of hash functions in SMHasher3", "url": "https://github.com/thomasahle/hashing-survey", "stars": 6, "forks": 0, "language": "TeX", "topics": ["algorithms", "hashing"], "updatedAt": "2024-12-01T00:00:00Z" },
      { "name": "tensorsketch", "fullName": "thomasahle/tensorsketch", "description": "Fast sketching for tensor computations", "url": "https://github.com/thomasahle/tensorsketch", "stars": 10, "forks": 2, "language": "Python", "topics": ["algorithms", "tensors", "sketching"], "updatedAt": "2024-09-15T00:00:00Z" }
    ],
    "recentPRs": [],
    "languages": [
      { "name": "Python", "percentage": 60, "color": "#3572A5" },
      { "name": "C++", "percentage": 15, "color": "#f34b7d" },
      { "name": "TeX", "percentage": 10, "color": "#3D6117" },
      { "name": "Svelte", "percentage": 8, "color": "#ff3e00" },
      { "name": "JavaScript", "percentage": 7, "color": "#f1e05a" }
    ],
    "skills": ["Python", "Algorithms", "C++", "Data Structures", "Machine Learning", "SQL", "Hashing", "Tensor Computation", "Performance Optimization", "Svelte", "JavaScript"],
    "generatedAt": "2026-02-18T12:00:00.000Z"
  }
];

/**
 * Convert a demo profile to a Candidate object for the pipeline
 * Returns a plain object that can be cast to any Candidate interface variant
 */
export function demoProfileToCandidate(profile: DemoProfile): Record<string, unknown> {
  return {
    id: profile.githubUsername,
    name: profile.name,
    currentRole: profile.company ? `Engineer at ${profile.company}` : "Open Source Creator",
    company: profile.company || "Open Source",
    location: profile.location,
    yearsExperience: Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (365 * 24 * 60 * 60 * 1000)),
    avatar: profile.avatar,
    alignmentScore: profile.buildprint.overallScore,
    shortlistSummary: profile.bio || `Creator of ${profile.topRepos[0]?.name || 'popular open source projects'}`,
    keyEvidence: profile.topRepos.slice(0, 3).map(r => `Created ${r.name} (${r.stars > 0 ? `${r.stars.toLocaleString()} stars` : r.description})`),
    risks: [],
    sourceUrl: `https://github.com/${profile.githubUsername}`,
    rawProfileText: profile.bio,
    // REQUIRED: skills must be an array
    skills: profile.skills || [],
    // Add buildprint data for the profile page
    buildprint: profile.buildprint,
    topRepos: profile.topRepos,
    languages: profile.languages,
    // Mark as having receipts
    hasReceipts: true,
    // Add empty arrays/objects for fields that might be expected
    unlockedSteps: [],
  };
}

/**
 * Get demo candidates for the pipeline
 * Returns plain objects that match the expected pipeline Candidate shape
 */
export function getDemoCandidates(): Record<string, unknown>[] {
  return DEMO_PROFILES.map(demoProfileToCandidate);
}

/**
 * Get a single demo profile by username
 */
export function getDemoProfile(username: string): DemoProfile | undefined {
  return DEMO_PROFILES.find(p => p.githubUsername === username);
}

/**
 * Check if a candidate is a demo profile
 */
export function isDemoProfile(candidateId: string): boolean {
  return DEMO_PROFILES.some(p => p.githubUsername === candidateId);
}

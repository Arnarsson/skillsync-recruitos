/**
 * Demo Data Loader
 * 
 * Loads pre-generated REAL developer profiles for demo mode.
 * These profiles contain actual GitHub data with real receipts (URLs to commits, PRs, repos).
 */

import { Candidate } from "@/types";

/**
 * DEMO_JOB — the canonical demo role used across the app.
 *
 * Aligned with the actual demo candidates (Sindre Sorhus, Guillermo Rauch, TJ Holowaychuk)
 * who are JS/TS/Node/OSS experts. This ensures demo candidates score 70-90% naturally
 * instead of the previous "Senior Data Platform Engineer" mismatch.
 */
export const DEMO_JOB = {
  title: "Staff Frontend Infrastructure Engineer",
  company: "Acme Corp",
  location: "Remote (Global)",
  experienceLevel: "7+ years",
  requiredSkills: ["JavaScript", "TypeScript", "Node.js", "Open Source"],
  preferredSkills: ["React", "testing", "performance optimization"],
  summary:
    "Seeking a seasoned Staff Frontend Infrastructure Engineer to own our build tooling, developer experience, and open-source presence. This is a high-leverage IC role reporting to the VP of Engineering.",
  rawText: `Role: Staff Frontend Infrastructure Engineer
Location: Remote (Global)

Job Summary:
We are seeking a seasoned Staff Frontend Infrastructure Engineer to own our build tooling, developer experience, and open-source presence. This is a high-leverage IC role reporting to the VP of Engineering.

Requirements:
- 7+ years of experience with JavaScript and TypeScript
- Deep expertise in Node.js and the JS/TS ecosystem
- Proven track record with open-source projects (authored or major contributor)
- Experience optimizing frontend build pipelines and developer tooling
- Familiarity with React and modern frontend frameworks (preferred)
- Experience with testing infrastructure and performance optimization (preferred)
- Strong communication skills and ability to mentor engineers`,
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
// These are REAL profiles with REAL GitHub data
export const DEMO_PROFILES: DemoProfile[] = [
  {
    "id": "sindresorhus",
    "githubUsername": "sindresorhus",
    "name": "Sindre Sorhus",
    "avatar": "https://avatars.githubusercontent.com/u/170270?v=4",
    "bio": "Maker of many open source things",
    "location": "Bangkok, Thailand",
    "company": "",
    "blog": "https://sindresorhus.com",
    "followers": 58976,
    "following": 53,
    "publicRepos": 1164,
    "createdAt": "2009-12-20T21:58:38Z",
    "buildprint": {
      "impact": {
        "value": 100,
        "label": "Impact",
        "receipts": [
          { "label": "Total Stars", "value": "576,863", "url": "https://github.com/sindresorhus?tab=repositories&sort=stargazers", "type": "profile" },
          { "label": "awesome", "value": "⭐ 340,990", "url": "https://github.com/sindresorhus/awesome", "type": "repo" },
          { "label": "pure", "value": "⭐ 13,546", "url": "https://github.com/sindresorhus/pure", "type": "repo" },
          { "label": "quick-look-plugins", "value": "⭐ 18,162", "url": "https://github.com/sindresorhus/quick-look-plugins", "type": "repo" }
        ]
      },
      "collaboration": {
        "value": 100,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "58,976", "url": "https://github.com/sindresorhus?tab=followers", "type": "profile" },
          { "label": "fix: deps", "value": "XAMPPRocky/tokei", "url": "https://github.com/XAMPPRocky/tokei/pull/1194", "type": "pr" },
          { "label": "Update readme.md", "value": "tc39/proposal-regex-escaping", "url": "https://github.com/tc39/proposal-regex-escaping/pull/50", "type": "pr" }
        ]
      },
      "consistency": {
        "value": 100,
        "label": "Consistency",
        "receipts": [
          { "label": "Recently Active Repos", "value": 57, "url": "https://github.com/sindresorhus?tab=repositories&sort=pushed", "type": "profile" },
          { "label": "Account Age", "value": "15 years", "url": "https://github.com/sindresorhus", "type": "profile" }
        ]
      },
      "complexity": {
        "value": 100,
        "label": "Complexity",
        "receipts": [
          { "label": "Languages Used", "value": 12, "url": "https://github.com/sindresorhus", "type": "stat" },
          { "label": "TypeScript", "value": "✓", "url": "https://github.com/sindresorhus?tab=repositories&language=TypeScript", "type": "stat" },
          { "label": "JavaScript", "value": "✓", "url": "https://github.com/sindresorhus?tab=repositories&language=JavaScript", "type": "stat" },
          { "label": "Swift", "value": "✓", "url": "https://github.com/sindresorhus?tab=repositories&language=Swift", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 100,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "96 / 100", "url": "https://github.com/sindresorhus?tab=repositories&type=source", "type": "stat" },
          { "label": "Total Forks Received", "value": "52,431", "url": "https://github.com/sindresorhus", "type": "stat" }
        ]
      },
      "overallScore": 100
    },
    "topRepos": [
      { "name": "awesome", "fullName": "sindresorhus/awesome", "description": "😎 Awesome lists about all kinds of interesting topics", "url": "https://github.com/sindresorhus/awesome", "stars": 340990, "forks": 28135, "language": "", "topics": ["awesome", "awesome-list", "lists", "resources", "unicorns"], "updatedAt": "2025-01-17T17:57:48Z" },
      { "name": "quick-look-plugins", "fullName": "sindresorhus/quick-look-plugins", "description": "List of useful Quick Look plugins for developers", "url": "https://github.com/sindresorhus/quick-look-plugins", "stars": 18162, "forks": 575, "language": "", "topics": ["macos", "quick-look"], "updatedAt": "2024-07-16T08:11:33Z" },
      { "name": "pure", "fullName": "sindresorhus/pure", "description": "Pretty, minimal and fast ZSH prompt", "url": "https://github.com/sindresorhus/pure", "stars": 13546, "forks": 981, "language": "Shell", "topics": ["prompt", "shell", "theme", "zsh"], "updatedAt": "2024-08-08T02:53:35Z" }
    ],
    "recentPRs": [
      { "title": "fix: deps", "repo": "XAMPPRocky/tokei", "url": "https://github.com/XAMPPRocky/tokei/pull/1194", "state": "open", "createdAt": "2025-02-04T17:16:57Z", "mergedAt": null },
      { "title": "Update readme.md", "repo": "tc39/proposal-regex-escaping", "url": "https://github.com/tc39/proposal-regex-escaping/pull/50", "state": "closed", "createdAt": "2025-01-24T22:09:09Z", "mergedAt": null }
    ],
    "languages": [
      { "name": "TypeScript", "percentage": 51, "color": "#3178c6" },
      { "name": "Swift", "percentage": 22, "color": "#F05138" },
      { "name": "JavaScript", "percentage": 13, "color": "#f1e05a" },
      { "name": "Shell", "percentage": 5, "color": "#89e051" }
    ],
    "skills": ["TypeScript", "Swift", "JavaScript", "Shell", "HTML", "Rust", "CSS", "Go", "C", "Makefile", "Python", "Ruby", "awesome", "awesome-list", "lists", "resources", "unicorns", "macos", "quick-look", "prompt"],
    "generatedAt": "2026-02-05T16:35:00.000Z"
  },
  {
    "id": "tj",
    "githubUsername": "tj",
    "name": "TJ Holowaychuk",
    "avatar": "https://avatars.githubusercontent.com/u/25254?v=4",
    "bio": "",
    "location": "Victoria, BC, Canada",
    "company": "@apex",
    "blog": "https://github.com/sponsors/tj",
    "followers": 36421,
    "following": 145,
    "publicRepos": 298,
    "createdAt": "2008-09-18T22:37:24Z",
    "buildprint": {
      "impact": {
        "value": 100,
        "label": "Impact",
        "receipts": [
          { "label": "Total Stars", "value": "121,492", "url": "https://github.com/tj?tab=repositories&sort=stargazers", "type": "profile" },
          { "label": "commander.js", "value": "⭐ 27,213", "url": "https://github.com/tj/commander.js", "type": "repo" },
          { "label": "co", "value": "⭐ 11,922", "url": "https://github.com/tj/co", "type": "repo" },
          { "label": "n", "value": "⭐ 19,140", "url": "https://github.com/tj/n", "type": "repo" }
        ]
      },
      "collaboration": {
        "value": 93,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "36,421", "url": "https://github.com/tj?tab=followers", "type": "profile" }
        ]
      },
      "consistency": {
        "value": 100,
        "label": "Consistency",
        "receipts": [
          { "label": "Recently Active Repos", "value": 12, "url": "https://github.com/tj?tab=repositories&sort=pushed", "type": "profile" },
          { "label": "Account Age", "value": "17 years", "url": "https://github.com/tj", "type": "profile" }
        ]
      },
      "complexity": {
        "value": 100,
        "label": "Complexity",
        "receipts": [
          { "label": "Languages Used", "value": 15, "url": "https://github.com/tj", "type": "stat" },
          { "label": "Go", "value": "✓", "url": "https://github.com/tj?tab=repositories&language=Go", "type": "stat" },
          { "label": "JavaScript", "value": "✓", "url": "https://github.com/tj?tab=repositories&language=JavaScript", "type": "stat" },
          { "label": "Shell", "value": "✓", "url": "https://github.com/tj?tab=repositories&language=Shell", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 100,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "93 / 100", "url": "https://github.com/tj?tab=repositories&type=source", "type": "stat" },
          { "label": "Total Forks Received", "value": "10,835", "url": "https://github.com/tj", "type": "stat" }
        ]
      },
      "overallScore": 98
    },
    "topRepos": [
      { "name": "commander.js", "fullName": "tj/commander.js", "description": "node.js command-line interfaces made easy", "url": "https://github.com/tj/commander.js", "stars": 27213, "forks": 1722, "language": "JavaScript", "topics": ["cli", "commander", "nodejs", "parser"], "updatedAt": "2025-01-16T03:24:31Z" },
      { "name": "n", "fullName": "tj/n", "description": "Node version management", "url": "https://github.com/tj/n", "stars": 19140, "forks": 748, "language": "Shell", "topics": [], "updatedAt": "2025-01-26T11:08:04Z" },
      { "name": "co", "fullName": "tj/co", "description": "The ultimate generator based flow-control goodness for nodejs (supports thunks, promises, etc)", "url": "https://github.com/tj/co", "stars": 11922, "forks": 783, "language": "JavaScript", "topics": [], "updatedAt": "2024-01-01T00:11:45Z" }
    ],
    "recentPRs": [],
    "languages": [
      { "name": "Go", "percentage": 36, "color": "#00ADD8" },
      { "name": "JavaScript", "percentage": 35, "color": "#f1e05a" },
      { "name": "Shell", "percentage": 9, "color": "#89e051" },
      { "name": "Makefile", "percentage": 5, "color": "#666" }
    ],
    "skills": ["Go", "JavaScript", "Shell", "Makefile", "C", "CSS", "TypeScript", "HTML", "Ruby", "Lua", "Stylus", "CoffeeScript", "Scheme", "Objective-C", "node", "cli", "commander", "nodejs", "parser"],
    "generatedAt": "2026-02-05T16:35:05.000Z"
  },
  {
    "id": "rauchg",
    "githubUsername": "rauchg",
    "name": "Guillermo Rauch",
    "avatar": "https://avatars.githubusercontent.com/u/13041?v=4",
    "bio": "",
    "location": "San Francisco, CA",
    "company": "@vercel",
    "blog": "https://rauchg.com",
    "followers": 27587,
    "following": 293,
    "publicRepos": 227,
    "createdAt": "2008-05-26T22:05:37Z",
    "buildprint": {
      "impact": {
        "value": 86,
        "label": "Impact",
        "receipts": [
          { "label": "Total Stars", "value": "19,896", "url": "https://github.com/rauchg?tab=repositories&sort=stargazers", "type": "profile" },
          { "label": "slackin", "value": "⭐ 6,626", "url": "https://github.com/rauchg/slackin", "type": "repo" },
          { "label": "wifi-password", "value": "⭐ 4,696", "url": "https://github.com/rauchg/wifi-password", "type": "repo" },
          { "label": "spot", "value": "⭐ 1,841", "url": "https://github.com/rauchg/spot", "type": "repo" }
        ]
      },
      "collaboration": {
        "value": 79,
        "label": "Collaboration",
        "receipts": [
          { "label": "Followers", "value": "27,587", "url": "https://github.com/rauchg?tab=followers", "type": "profile" }
        ]
      },
      "consistency": {
        "value": 60,
        "label": "Consistency",
        "receipts": [
          { "label": "Recently Active Repos", "value": 6, "url": "https://github.com/rauchg?tab=repositories&sort=pushed", "type": "profile" },
          { "label": "Account Age", "value": "17 years", "url": "https://github.com/rauchg", "type": "profile" }
        ]
      },
      "complexity": {
        "value": 100,
        "label": "Complexity",
        "receipts": [
          { "label": "Languages Used", "value": 14, "url": "https://github.com/rauchg", "type": "stat" },
          { "label": "JavaScript", "value": "✓", "url": "https://github.com/rauchg?tab=repositories&language=JavaScript", "type": "stat" },
          { "label": "Shell", "value": "✓", "url": "https://github.com/rauchg?tab=repositories&language=Shell", "type": "stat" },
          { "label": "Makefile", "value": "✓", "url": "https://github.com/rauchg?tab=repositories&language=Makefile", "type": "stat" }
        ]
      },
      "ownership": {
        "value": 88,
        "label": "Ownership",
        "receipts": [
          { "label": "Original Repos", "value": "88 / 100", "url": "https://github.com/rauchg?tab=repositories&type=source", "type": "stat" },
          { "label": "Total Forks Received", "value": "1,750", "url": "https://github.com/rauchg", "type": "stat" }
        ]
      },
      "overallScore": 82
    },
    "topRepos": [
      { "name": "slackin", "fullName": "rauchg/slackin", "description": "Public Slack organizations made easy", "url": "https://github.com/rauchg/slackin", "stars": 6626, "forks": 766, "language": "JavaScript", "topics": ["community", "invitations", "slack"], "updatedAt": "2022-10-08T10:23:51Z" },
      { "name": "wifi-password", "fullName": "rauchg/wifi-password", "description": "Get the password of the wifi you're on (bash)", "url": "https://github.com/rauchg/wifi-password", "stars": 4696, "forks": 412, "language": "Shell", "topics": [], "updatedAt": "2023-04-19T14:27:41Z" },
      { "name": "spot", "fullName": "rauchg/spot", "description": "Tiny file search utility (bash)", "url": "https://github.com/rauchg/spot", "stars": 1841, "forks": 83, "language": "Shell", "topics": [], "updatedAt": "2022-10-08T10:24:03Z" }
    ],
    "recentPRs": [],
    "languages": [
      { "name": "JavaScript", "percentage": 55, "color": "#f1e05a" },
      { "name": "Shell", "percentage": 12, "color": "#89e051" },
      { "name": "Makefile", "percentage": 6, "color": "#666" },
      { "name": "HTML", "percentage": 5, "color": "#e34c26" }
    ],
    "skills": ["JavaScript", "Shell", "Makefile", "HTML", "TypeScript", "PHP", "C++", "CSS", "Objective-C", "Ruby", "CoffeeScript", "Perl", "C", "Swift", "community", "invitations", "slack"],
    "generatedAt": "2026-02-05T16:35:10.000Z"
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
    keyEvidence: profile.topRepos.slice(0, 3).map(r => `Created ${r.name} (⭐ ${r.stars.toLocaleString()})`),
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

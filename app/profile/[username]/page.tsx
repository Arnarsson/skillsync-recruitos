"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  MapPin,
  Building,
  Link as LinkIcon,
  Twitter,
  Github,
  Star,
  GitBranch,
  GitCommit,
  Users,
  Calendar,
  ExternalLink,
  Lock,
} from "lucide-react";

interface Developer {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  website: string;
  twitter: string;
  skills: string[];
  repos: number;
  stars: number;
  followers: number;
  following: number;
  contributions: number;
  joinedAt: string;
  topRepos: {
    name: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
  }[];
}

// Mock developer data
const mockDeveloper: Developer = {
  username: "sindresorhus",
  name: "Sindre Sorhus",
  avatar: "https://avatars.githubusercontent.com/u/170270",
  bio: "Full-time open-sourcerer. Building stuff for the Node.js and Swift ecosystem. Prolific creator of npm packages and macOS apps.",
  location: "Thailand",
  company: "Open Source",
  website: "https://sindresorhus.com",
  twitter: "sindresorhus",
  skills: ["TypeScript", "Node.js", "Swift", "CLI Tools", "npm", "macOS", "Electron"],
  repos: 1200,
  stars: 150000,
  followers: 55000,
  following: 50,
  contributions: 15000,
  joinedAt: "2010",
  topRepos: [
    {
      name: "awesome",
      description: "Awesome lists about all kinds of interesting topics",
      stars: 280000,
      forks: 26000,
      language: "Markdown",
    },
    {
      name: "got",
      description: "Human-friendly and powerful HTTP request library for Node.js",
      stars: 13500,
      forks: 900,
      language: "TypeScript",
    },
    {
      name: "ky",
      description: "Tiny & elegant JavaScript HTTP client based on Fetch API",
      stars: 11000,
      forks: 350,
      language: "TypeScript",
    },
  ],
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeepProfile, setIsDeepProfile] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDeveloper({ ...mockDeveloper, username });
      setLoading(false);
    }, 500);
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-32 h-32 bg-white/10 rounded-full" />
              <div className="flex-1">
                <div className="h-8 w-64 bg-white/10 rounded mb-2" />
                <div className="h-4 w-32 bg-white/10 rounded mb-4" />
                <div className="h-4 w-full bg-white/10 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Developer not found</h1>
          <Link href="/search" className="text-blue-400 hover:underline">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <img
            src={developer.avatar}
            alt={developer.name}
            className="w-32 h-32 rounded-full bg-white/10"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">{developer.name}</h1>
              <a
                href={`https://github.com/${developer.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                <Github className="w-4 h-4" />
                View on GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-gray-500 mb-4">@{developer.username}</p>
            <p className="text-gray-300 mb-4">{developer.bio}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {developer.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {developer.location}
                </div>
              )}
              {developer.company && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {developer.company}
                </div>
              )}
              {developer.website && (
                <a
                  href={developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  Website
                </a>
              )}
              {developer.twitter && (
                <a
                  href={`https://twitter.com/${developer.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  @{developer.twitter}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 bg-[#1a1b1e] rounded-xl border border-white/5 text-center">
            <GitBranch className="w-5 h-5 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold">{developer.repos}</div>
            <div className="text-sm text-gray-500">Repositories</div>
          </div>
          <div className="p-4 bg-[#1a1b1e] rounded-xl border border-white/5 text-center">
            <Star className="w-5 h-5 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold">{(developer.stars / 1000).toFixed(0)}k</div>
            <div className="text-sm text-gray-500">Stars</div>
          </div>
          <div className="p-4 bg-[#1a1b1e] rounded-xl border border-white/5 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold">{(developer.followers / 1000).toFixed(0)}k</div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="p-4 bg-[#1a1b1e] rounded-xl border border-white/5 text-center">
            <GitCommit className="w-5 h-5 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold">{(developer.contributions / 1000).toFixed(0)}k</div>
            <div className="text-sm text-gray-500">Contributions</div>
          </div>
          <div className="p-4 bg-[#1a1b1e] rounded-xl border border-white/5 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-gray-400" />
            <div className="text-2xl font-bold">{developer.joinedAt}</div>
            <div className="text-sm text-gray-500">Joined</div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Skills & Technologies</h2>
          <div className="flex flex-wrap gap-2">
            {developer.skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Top Repos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Repositories</h2>
          <div className="grid gap-4">
            {developer.topRepos.map((repo) => (
              <a
                key={repo.name}
                href={`https://github.com/${developer.username}/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-[#1a1b1e] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-400">{repo.name}</h3>
                  <span className="px-2 py-1 bg-white/5 text-xs rounded">{repo.language}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{repo.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {(repo.stars / 1000).toFixed(0)}k
                  </div>
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-4 h-4" />
                    {(repo.forks / 1000).toFixed(1)}k forks
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Deep Profile CTA */}
        {!isDeepProfile && (
          <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold">Unlock Deep Profile</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Get contact info, detailed contribution analysis, and code quality metrics.
                </p>
              </div>
              <button
                onClick={() => setIsDeepProfile(true)}
                className="px-6 py-3 bg-white text-[#141517] rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Use 1 Credit
              </button>
            </div>
          </div>
        )}

        {isDeepProfile && (
          <div className="p-6 bg-[#1a1b1e] rounded-xl border border-white/5">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-white">{developer.username}@example.com</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Availability</label>
                <p className="text-green-400">Open to opportunities</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

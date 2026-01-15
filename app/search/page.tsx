"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Filter, MapPin, Building, Star, GitBranch } from "lucide-react";

interface Developer {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  skills: string[];
  repos: number;
  stars: number;
  score: number;
}

// Mock data for demonstration
const mockDevelopers: Developer[] = [
  {
    id: "1",
    username: "sindresorhus",
    name: "Sindre Sorhus",
    avatar: "https://avatars.githubusercontent.com/u/170270",
    bio: "Full-time open-sourcerer. Building stuff for the Node.js and Swift ecosystem.",
    location: "Thailand",
    company: "Open Source",
    skills: ["TypeScript", "Node.js", "Swift", "CLI Tools"],
    repos: 1200,
    stars: 150000,
    score: 98,
  },
  {
    id: "2",
    username: "tj",
    name: "TJ Holowaychuk",
    avatar: "https://avatars.githubusercontent.com/u/25254",
    bio: "Creator of Express, Koa, Commander, and many other projects.",
    location: "Victoria, BC",
    company: "Apex Software",
    skills: ["Go", "Node.js", "CSS", "Web Frameworks"],
    repos: 500,
    stars: 80000,
    score: 95,
  },
  {
    id: "3",
    username: "gaearon",
    name: "Dan Abramov",
    avatar: "https://avatars.githubusercontent.com/u/810438",
    bio: "Working on React. Co-author of Redux and Create React App.",
    location: "London, UK",
    company: "Meta",
    skills: ["React", "JavaScript", "Redux", "Developer Tools"],
    repos: 200,
    stars: 120000,
    score: 97,
  },
];

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchQuery(query);
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setDevelopers(mockDevelopers);
      setLoading(false);
    }, 1000);
  }, [query]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by capabilities..."
                className="w-full pl-12 pr-4 py-3 bg-[#1a1b1e] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-3 bg-[#1a1b1e] border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-colors">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
          {query && (
            <p className="text-gray-400">
              Showing results for: <span className="text-white">&ldquo;{query}&rdquo;</span>
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-[#1a1b1e] rounded-xl border border-white/5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full" />
                  <div className="flex-1">
                    <div className="h-6 w-48 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-32 bg-white/10 rounded mb-4" />
                    <div className="h-4 w-full bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {developers.map((dev) => (
              <Link
                key={dev.id}
                href={`/profile/${dev.username}`}
                className="p-6 bg-[#1a1b1e] rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={dev.avatar}
                    alt={dev.name}
                    className="w-16 h-16 rounded-full bg-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors">
                        {dev.name}
                      </h3>
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                        <Star className="w-3 h-3" />
                        {dev.score}% match
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">@{dev.username}</p>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{dev.bio}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {dev.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {dev.location}
                        </div>
                      )}
                      {dev.company && (
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {dev.company}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4" />
                        {dev.repos} repos
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {(dev.stars / 1000).toFixed(0)}k stars
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {dev.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-white/5 text-gray-300 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && developers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-400">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 pb-16 px-4">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}

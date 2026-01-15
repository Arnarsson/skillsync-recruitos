"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, MapPin, Building, Star, GitBranch, Users, Loader2 } from "lucide-react";

interface Developer {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  skills: string[];
  repos: number;
  stars: number;
  followers: number;
  score: number;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDevelopers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setDevelopers([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setDevelopers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearchQuery(query);
    if (query) {
      searchDevelopers(query);
    }
  }, [query, searchDevelopers]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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
                onKeyDown={handleKeyDown}
                placeholder="Search by capabilities... (e.g., 'React state management', 'Rust systems programming')"
                className="w-full pl-12 pr-4 py-3 bg-[#1a1b1e] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#141517] rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search
            </button>
          </div>
          {query && !loading && (
            <p className="text-gray-400">
              Found <span className="text-white font-medium">{total.toLocaleString()}</span> developers for: <span className="text-white">&ldquo;{query}&rdquo;</span>
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
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
        )}

        {/* Results */}
        {!loading && developers.length > 0 && (
          <div className="grid gap-4">
            {developers.map((dev) => (
              <Link
                key={dev.username}
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
                    {dev.bio && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{dev.bio}</p>
                    )}

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
                        {dev.stars >= 1000 ? `${(dev.stars / 1000).toFixed(1)}k` : dev.stars} stars
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {dev.followers >= 1000 ? `${(dev.followers / 1000).toFixed(1)}k` : dev.followers} followers
                      </div>
                    </div>

                    {dev.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {dev.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query && developers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-400">
              Try adjusting your search terms to find developers.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !query && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Search for developers</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Enter a search query to find elite developers by their skills, technologies, or contributions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <SearchResults />
    </Suspense>
  );
}

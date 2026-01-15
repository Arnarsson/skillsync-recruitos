"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Building, Star, GitBranch, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by capabilities... (e.g., 'React state management', 'Rust systems programming')"
                className="pl-12 h-12 text-base"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} size="lg" className="gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search
            </Button>
          </div>
          {query && !loading && (
            <p className="text-muted-foreground">
              Found <span className="text-foreground font-medium">{total.toLocaleString()}</span> developers for: <span className="text-foreground">&ldquo;{query}&rdquo;</span>
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-destructive/50 bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && developers.length > 0 && (
          <div className="grid gap-4">
            {developers.map((dev) => (
              <Link key={dev.username} href={`/profile/${dev.username}`}>
                <Card className="hover:border-ring transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={dev.avatar} alt={dev.name} />
                        <AvatarFallback>{dev.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                            {dev.name}
                          </h3>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0">
                            <Star className="w-3 h-3 mr-1" />
                            {dev.score}% match
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">@{dev.username}</p>
                        {dev.bio && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{dev.bio}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query && developers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms to find developers.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !query && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Search for developers</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
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
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}

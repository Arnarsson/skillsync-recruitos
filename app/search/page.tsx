"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Building,
  Star,
  GitBranch,
  Users,
  Loader2,
  ArrowRight,
  Sparkles,
  Code2,
  Filter,
  SortAsc,
} from "lucide-react";
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by capabilities... (e.g., 'React state management', 'Rust systems programming')"
                  className="pl-12 h-14 text-base bg-card border-border focus:border-primary/50"
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              size="lg"
              className="h-14 px-8 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </Button>
          </div>

          {/* Results count */}
          {query && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between"
            >
              <p className="text-muted-foreground">
                Found{" "}
                <span className="text-foreground font-semibold">
                  {total.toLocaleString()}
                </span>{" "}
                developers for:{" "}
                <span className="text-primary">&ldquo;{query}&rdquo;</span>
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Scored
                </Badge>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="mb-8 border-destructive/50 bg-destructive/10">
                <CardContent className="py-4">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && developers.length > 0 && (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {developers.map((dev, index) => (
              <motion.div
                key={dev.username}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Link href={`/profile/${dev.username}`}>
                  <Card className="group overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar with rank badge */}
                        <div className="relative">
                          <Avatar className="w-16 h-16 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                            <AvatarImage src={dev.avatar} alt={dev.name} />
                            <AvatarFallback className="text-xl">
                              {dev.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                {dev.name}
                              </h3>
                              <Badge
                                className={`${getScoreColor(dev.score)} border`}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                {dev.score}% match
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                            >
                              View Profile
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>

                          <p className="text-muted-foreground text-sm mb-2">
                            @{dev.username}
                          </p>

                          {dev.bio && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {dev.bio}
                            </p>
                          )}

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            {dev.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                {dev.location}
                              </div>
                            )}
                            {dev.company && (
                              <div className="flex items-center gap-1.5">
                                <Building className="w-4 h-4 text-purple-400" />
                                {dev.company}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Code2 className="w-4 h-4 text-green-400" />
                              {dev.repos} repos
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-yellow-400" />
                              {formatNumber(dev.stars)} stars
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-pink-400" />
                              {formatNumber(dev.followers)} followers
                            </div>
                          </div>

                          {/* Skills */}
                          {dev.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {dev.skills.slice(0, 6).map((skill, i) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs px-2.5 py-1"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {dev.skills.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                  +{dev.skills.length - 6} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && query && developers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No results found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We couldn&apos;t find any developers matching your search. Try
              adjusting your terms or using different keywords.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() =>
                  router.push("/search?q=React%20TypeScript%20developers")
                }
              >
                React TypeScript
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => router.push("/search?q=Python%20ML%20engineers")}
              >
                Python ML
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() =>
                  router.push("/search?q=Rust%20systems%20programming")
                }
              >
                Rust systems
              </Badge>
            </div>
          </motion.div>
        )}

        {/* Initial State */}
        {!loading && !query && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">
              Search for developers
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Enter a search query to find elite developers by their skills,
              technologies, or contributions. Our AI will analyze GitHub
              profiles to find the best matches.
            </p>
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">Popular searches:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "React state management Copenhagen",
                  "Rust WebAssembly developers",
                  "ML engineers PyTorch",
                  "Senior TypeScript architects",
                ].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors px-3 py-1.5"
                    onClick={() =>
                      router.push(`/search?q=${encodeURIComponent(suggestion)}`)
                    }
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

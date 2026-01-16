"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
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
  Lock,
  X,
  Linkedin,
  Github,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import { getScoreInfo } from "@/components/ScoreBadge";
import {
  SearchFiltersPanel,
  SearchFilters,
  DEFAULT_FILTERS,
  AvailableFilters,
} from "@/components/search/SearchFilters";
import { OpenToWorkBadge, BehavioralBadges } from "@/components/BehavioralBadges";

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

interface SearchInterpretation {
  language: string | null;
  location: string | null;
  keywords: string[];
  githubQuery: string;
}

interface LinkedInProfile {
  name: string;
  headline: string;
  location: string;
  profileUrl: string;
  imageUrl?: string;
  currentCompany?: string;
}

interface GoogleResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

const SEARCH_COUNT_KEY = "recruitos_search_count";
const FREE_SEARCHES = 1;

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const query = searchParams.get("q") || "";
  const isAdmin = searchParams.get("admin") !== null;
  const [searchQuery, setSearchQuery] = useState(query);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [total, setTotal] = useState(0);
  const [interpretation, setInterpretation] = useState<SearchInterpretation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);
  // LinkedIn search state
  const [includeLinkedIn, setIncludeLinkedIn] = useState(false);
  const [linkedInProfiles, setLinkedInProfiles] = useState<LinkedInProfile[]>([]);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInSnapshotId, setLinkedInSnapshotId] = useState<string | null>(null);
  // Google SERP search state
  const [includeGoogle, setIncludeGoogle] = useState(false);
  const [googleResults, setGoogleResults] = useState<GoogleResult[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // Load search count from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_COUNT_KEY);
    if (stored) {
      setSearchCount(parseInt(stored, 10));
    }
  }, []);

  const isLocked = !isAdmin && searchCount >= FREE_SEARCHES;

  const incrementSearchCount = useCallback(() => {
    if (isAdmin) return; // Admin has unlimited searches
    const newCount = searchCount + 1;
    setSearchCount(newCount);
    localStorage.setItem(SEARCH_COUNT_KEY, newCount.toString());
  }, [searchCount, isAdmin]);

  const searchDevelopers = useCallback(async (q: string, skipLockCheck = false) => {
    if (!q.trim()) {
      setDevelopers([]);
      setTotal(0);
      return;
    }

    // Check if locked (unless skipping for initial load of previous search)
    if (!skipLockCheck && !isAdmin && searchCount >= FREE_SEARCHES) {
      setShowSignupModal(true);
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
      setInterpretation(data.interpretation || null);

      // Only increment count for new searches (not initial page load)
      if (!skipLockCheck) {
        incrementSearchCount();
      }

      // Trigger LinkedIn search if enabled
      if (includeLinkedIn) {
        triggerLinkedInSearch(q, data.interpretation);
      }

      // Trigger Google SERP search if enabled
      if (includeGoogle) {
        triggerGoogleSearch(q, data.interpretation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, searchCount, incrementSearchCount, includeLinkedIn, includeGoogle]);

  // Trigger LinkedIn search via Bright Data
  const triggerLinkedInSearch = async (q: string, interp: SearchInterpretation | null) => {
    setLinkedInLoading(true);
    setLinkedInProfiles([]);
    setLinkedInSnapshotId(null);

    try {
      const response = await fetch("/api/brightdata/linkedin-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: q,
          location: interp?.location || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLinkedInSnapshotId(data.snapshotId);
      }
    } catch (err) {
      console.error("LinkedIn search failed:", err);
    }
  };

  // Trigger Google SERP search via Bright Data
  const triggerGoogleSearch = async (q: string, interp: SearchInterpretation | null) => {
    setGoogleLoading(true);
    setGoogleResults([]);

    try {
      const response = await fetch("/api/brightdata/serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          location: interp?.location || undefined,
          num: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleResults(data.results || []);
      }
    } catch (err) {
      console.error("Google SERP search failed:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Poll for LinkedIn results
  useEffect(() => {
    if (!linkedInSnapshotId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/brightdata/linkedin-search?snapshotId=${linkedInSnapshotId}`
        );
        const data = await response.json();

        if (data.status === "ready") {
          setLinkedInProfiles(data.profiles || []);
          setLinkedInLoading(false);
          setLinkedInSnapshotId(null);
          clearInterval(pollInterval);
        } else if (data.status === "error") {
          setLinkedInLoading(false);
          setLinkedInSnapshotId(null);
          clearInterval(pollInterval);
        }
      } catch {
        setLinkedInLoading(false);
        clearInterval(pollInterval);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [linkedInSnapshotId]);

  useEffect(() => {
    setSearchQuery(query);
    if (query) {
      // On initial load, show results but don't count as new search
      searchDevelopers(query, true);
    }
  }, [query, searchDevelopers]);

  // Trigger LinkedIn search when toggle is enabled and there's a query
  useEffect(() => {
    if (includeLinkedIn && query && !linkedInSnapshotId && linkedInProfiles.length === 0) {
      triggerLinkedInSearch(query, interpretation);
    }
  }, [includeLinkedIn, query, interpretation, linkedInSnapshotId, linkedInProfiles.length]);

  // Trigger Google search when toggle is enabled and there's a query
  useEffect(() => {
    if (includeGoogle && query && googleResults.length === 0 && !googleLoading) {
      triggerGoogleSearch(query, interpretation);
    }
  }, [includeGoogle, query, interpretation, googleResults.length, googleLoading]);

  // Compute available filter options from the current results (GitHub + Google)
  const availableFilters: AvailableFilters = useMemo(() => {
    const locations = new Set<string>();
    const languages = new Set<string>();
    const companies = new Set<string>();
    let maxRepos = 0;
    let maxStars = 0;

    // Extract from GitHub developers
    developers.forEach((dev) => {
      if (dev.location) {
        locations.add(dev.location);
      }
      if (dev.skills) {
        dev.skills.forEach((skill) => {
          languages.add(skill);
        });
      }
      if (dev.company) {
        companies.add(dev.company);
      }
      if (dev.repos > maxRepos) maxRepos = dev.repos;
      if (dev.stars > maxStars) maxStars = dev.stars;
    });

    // Extract from Google results (parse snippets for locations)
    const locationPatterns = [
      /(?:in|from|based in|located in|living in)\s+([A-Z][a-zA-Z\s,]+?)(?:\s*[-·|]|\s*$)/gi,
      /([A-Z][a-zA-Z]+(?:,\s*[A-Z]{2})?)\s+Area/gi,
      /Location:\s*([A-Z][a-zA-Z\s,]+)/gi,
    ];

    googleResults.forEach((result) => {
      const textToSearch = `${result.title} ${result.snippet}`;

      // Try to extract locations from snippets
      locationPatterns.forEach((pattern) => {
        const matches = textToSearch.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length < 50) {
            const loc = match[1].trim();
            if (loc && !loc.match(/^(the|and|or|for|with)$/i)) {
              locations.add(loc);
            }
          }
        }
      });

      // Extract skills/languages mentioned in title or snippet
      const techKeywords = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Rails', 'Spring', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP'];
      techKeywords.forEach((tech) => {
        if (textToSearch.toLowerCase().includes(tech.toLowerCase())) {
          languages.add(tech);
        }
      });
    });

    return {
      locations: Array.from(locations).sort(),
      languages: Array.from(languages).sort(),
      companies: Array.from(companies).sort(),
      maxRepos,
      maxStars,
    };
  }, [developers, googleResults]);

  // Filter developers based on current filters
  const filteredDevelopers = developers.filter((dev) => {
    // Location filter
    if (filters.location) {
      const devLocation = (dev.location || "").toLowerCase();
      if (!devLocation.includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Language filter (check skills)
    if (filters.language) {
      const hasLanguage = dev.skills?.some(
        (skill) => skill.toLowerCase().includes(filters.language!.toLowerCase())
      );
      if (!hasLanguage) {
        return false;
      }
    }

    // Min repos filter
    if (filters.minRepos > 0 && (dev.repos || 0) < filters.minRepos) {
      return false;
    }

    // Min stars filter
    if (filters.minStars > 0 && (dev.stars || 0) < filters.minStars) {
      return false;
    }

    // Experience level filter (estimate based on repos/followers/stars)
    if (filters.experienceLevel) {
      const activityScore = (dev.repos || 0) + (dev.stars || 0) / 10 + (dev.followers || 0) / 5;
      const levelThresholds: Record<string, [number, number]> = {
        junior: [0, 20],
        mid: [20, 50],
        senior: [50, 150],
        lead: [150, Infinity],
      };
      const [min, max] = levelThresholds[filters.experienceLevel] || [0, Infinity];
      if (activityScore < min || activityScore >= max) {
        return false;
      }
    }

    return true;
  });

  // Filter Google results based on current filters
  const filteredGoogleResults = googleResults.filter((result) => {
    const textToSearch = `${result.title} ${result.snippet}`.toLowerCase();

    // Location filter - check if location mentioned in text
    if (filters.location) {
      if (!textToSearch.includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Language filter - check if language/tech mentioned in text
    if (filters.language) {
      if (!textToSearch.includes(filters.language.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (isLocked) {
        setShowSignupModal(true);
        return;
      }
      searchDevelopers(searchQuery.trim());
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${isAdmin ? "&admin" : ""}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
                  placeholder={t("search.placeholder")}
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
              {t("common.search")}
            </Button>
          </div>
        </motion.div>

        {/* Main content with filters sidebar */}
        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <SearchFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filteredDevelopers.length}
            mode="desktop"
            availableFilters={availableFilters}
          />

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {/* Source toggles and mobile filter button */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4">
              {/* Mobile filter button */}
              <SearchFiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={filteredDevelopers.length}
                mode="mobile"
                availableFilters={availableFilters}
              />

            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground hidden sm:inline">GitHub</span>
              <Badge variant="secondary" className="text-xs">Always on</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#4285F4]" />
              <span className="text-sm text-muted-foreground hidden sm:inline">Google</span>
              <Switch
                checked={includeGoogle}
                onCheckedChange={setIncludeGoogle}
              />
              {googleLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-[#4285F4]" />
              )}
            </div>
          </div>

          {/* Results count */}
          {query && !loading && developers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {t("search.found")}{" "}
                  <span className="text-foreground font-semibold">
                    {filteredDevelopers.length !== developers.length
                      ? `${filteredDevelopers.length} of ${total.toLocaleString()}`
                      : total.toLocaleString()}
                  </span>{" "}
                  {t("search.developers")}{" "}
                  <span className="text-primary">&ldquo;{query}&rdquo;</span>
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t("search.aiScored")}
                  </Badge>
                </div>
              </div>
              {/* Search interpretation badges */}
              {interpretation && (interpretation.language || interpretation.location || interpretation.keywords.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Searching:</span>
                  {interpretation.language && (
                    <Badge variant="secondary" className="gap-1">
                      <Code2 className="w-3 h-3" />
                      {interpretation.language}
                    </Badge>
                  )}
                  {interpretation.location && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="w-3 h-3" />
                      {interpretation.location}
                    </Badge>
                  )}
                  {interpretation.keywords.map((keyword, i) => (
                    <Badge key={i} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          )}

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

        {/* No results after filtering */}
        {!loading && developers.length > 0 && filteredDevelopers.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No matches with current filters</h3>
              <p className="text-muted-foreground mb-4">
                Found {developers.length} developers, but none match your filter criteria.
              </p>
              <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!loading && filteredDevelopers.length > 0 && (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {filteredDevelopers.map((dev, index) => (
              <motion.div
                key={dev.username}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Link href={`/profile/${dev.username}${isAdmin ? '?admin' : ''}`}>
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
                              {(() => {
                                const scoreInfo = getScoreInfo(dev.score);
                                return (
                                  <Badge className={`${scoreInfo.bg} ${scoreInfo.color} ${scoreInfo.border} border`}>
                                    <Star className="w-3 h-3 mr-1" />
                                    {dev.score}% - {lang === "da" ? scoreInfo.labelDa : scoreInfo.label}
                                  </Badge>
                                );
                              })()}
                              <OpenToWorkBadge username={dev.username} />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                            >
                              {t("search.viewProfile")}
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
                              {dev.repos} {t("search.repos")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-yellow-400" />
                              {formatNumber(dev.stars)} {t("search.stars")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-pink-400" />
                              {formatNumber(dev.followers)} {t("search.followers")}
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
                                  +{dev.skills.length - 6} {t("search.more")}
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

        {/* Google SERP Results */}
        {includeGoogle && (filteredGoogleResults.length > 0 || googleLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#4285F4]" />
              <h2 className="text-lg font-semibold">Google Results</h2>
              {googleLoading && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Searching...
                </Badge>
              )}
              {!googleLoading && filteredGoogleResults.length > 0 && (
                <Badge variant="secondary">
                  {filteredGoogleResults.length !== googleResults.length
                    ? `${filteredGoogleResults.length} of ${googleResults.length}`
                    : googleResults.length} found
                </Badge>
              )}
            </div>

            {googleLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-hidden border-[#4285F4]/20">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGoogleResults.map((result, index) => (
                  <motion.div
                    key={`google-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Card className="group overflow-hidden hover:border-[#4285F4]/50 transition-all hover:shadow-lg border-[#4285F4]/20">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#4285F4]/10 flex items-center justify-center flex-shrink-0">
                              <Globe className="w-5 h-5 text-[#4285F4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold group-hover:text-[#4285F4] transition-colors line-clamp-1">
                                  {result.title}
                                </h3>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 truncate">
                                {result.link}
                              </p>
                              {result.snippet && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-[#4285F4]"
                            >
                              Visit
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* LinkedIn Results - Disabled due to unreliable Bright Data scraper */}
        {/* {includeLinkedIn && (linkedInProfiles.length > 0 || linkedInLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              <h2 className="text-lg font-semibold">LinkedIn Results</h2>
              {linkedInLoading && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Searching...
                </Badge>
              )}
              {!linkedInLoading && linkedInProfiles.length > 0 && (
                <Badge variant="secondary">{linkedInProfiles.length} found</Badge>
              )}
            </div>

            {linkedInLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-hidden border-[#0A66C2]/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-14 h-14 rounded-full" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {linkedInProfiles.map((profile, index) => (
                  <motion.div
                    key={`linkedin-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Card className="group overflow-hidden hover:border-[#0A66C2]/50 transition-all hover:shadow-lg border-[#0A66C2]/20">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-14 h-14 ring-2 ring-[#0A66C2]/20 group-hover:ring-[#0A66C2]/50 transition-all">
                              {profile.imageUrl ? (
                                <AvatarImage src={profile.imageUrl} alt={profile.name} />
                              ) : null}
                              <AvatarFallback className="bg-[#0A66C2]/10 text-[#0A66C2]">
                                {profile.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold group-hover:text-[#0A66C2] transition-colors">
                                  {profile.name}
                                </h3>
                                <Badge variant="outline" className="text-xs gap-1 border-[#0A66C2]/30 text-[#0A66C2]">
                                  <Linkedin className="w-3 h-3" />
                                  LinkedIn
                                </Badge>
                              </div>
                              {profile.headline && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                                  {profile.headline}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {profile.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {profile.location}
                                  </span>
                                )}
                                {profile.currentCompany && (
                                  <span className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {profile.currentCompany}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-[#0A66C2]"
                            >
                              View Profile
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )} */}

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
            <h3 className="text-2xl font-semibold mb-3">{t("search.noResults.title")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t("search.noResults.description")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() =>
                  router.push(`/search?q=React%20TypeScript%20developers${isAdmin ? "&admin" : ""}`)
                }
              >
                React TypeScript
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() => router.push(`/search?q=Python%20ML%20engineers${isAdmin ? "&admin" : ""}`)}
              >
                Python ML
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted"
                onClick={() =>
                  router.push(`/search?q=Rust%20systems%20programming${isAdmin ? "&admin" : ""}`)
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
              {t("search.initial.title")}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {t("search.initial.description")}
            </p>
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">{t("search.initial.popularSearches")}</p>
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
                      router.push(`/search?q=${encodeURIComponent(suggestion)}${isAdmin ? "&admin" : ""}`)
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
      </div>

      {/* Signup Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSignupModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-xl max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSignupModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-primary" />
                </div>

                <h3 className="text-2xl font-semibold mb-3">
                  {t("search.modal.title")}
                </h3>

                <p className="text-muted-foreground mb-6">
                  {t("search.modal.description")}
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-3xl font-light">$15</span>
                    <span className="text-muted-foreground">{t("search.modal.perSearch")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("search.modal.includesDeep")}
                  </p>
                </div>

                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {t("search.modal.features.fullResults")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {t("search.modal.features.deepProfile")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {t("search.modal.features.skillBreakdown")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> {t("search.modal.features.noSubscription")}
                  </li>
                </ul>

                <Button
                  className="w-full mb-3 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {t("search.modal.signUp")}
                </Button>

                <p className="text-xs text-muted-foreground">
                  {t("search.modal.payPerSearch")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchPageFallback() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{t("search.loadingSearch")}</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchResults />
    </Suspense>
  );
}

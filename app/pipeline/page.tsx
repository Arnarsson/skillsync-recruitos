"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  Briefcase,
  MapPin,
  Star,
  Trash2,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  BarChart3,
  X,
  FileText,
  Link as LinkIcon,
  Sparkles,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import OutreachModal from "@/components/OutreachModal";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  skills: string[];
  createdAt?: string;
  risks?: string[];
  keyEvidence?: string[];
  persona?: {
    archetype?: string;
    riskAssessment?: {
      attritionRisk?: string;
    };
  };
}

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobContext, setJobContext] = useState<{
    title: string;
    company: string;
    requiredSkills?: string[];
    location?: string;
  } | null>(null);
  const [autoSearched, setAutoSearched] = useState(false);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "name-asc" | "name-desc">("score-desc");
  const [filterScore, setFilterScore] = useState<"high" | "medium" | "low" | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select for comparison
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Outreach modal state
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachCandidate, setOutreachCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("apex_job_context");
    let parsedJobContext = null;
    if (stored) {
      try {
        parsedJobContext = JSON.parse(stored);
        setJobContext(parsedJobContext);
      } catch {
        // Ignore
      }
    }

    const storedCandidates = localStorage.getItem("apex_candidates");
    let existingCandidates: Candidate[] = [];
    if (storedCandidates) {
      try {
        existingCandidates = JSON.parse(storedCandidates);
        setCandidates(existingCandidates);
      } catch {
        // Ignore
      }
    }

    // Auto-search for candidates based on job requirements
    if (parsedJobContext?.requiredSkills?.length > 0 && existingCandidates.length === 0 && !autoSearched) {
      setAutoSearched(true);
      const skills = parsedJobContext.requiredSkills.slice(0, 3);
      const location = parsedJobContext.location || "";
      const query = [...skills, location].filter(Boolean).join(" ");

      if (query) {
        setSearchQuery(query);
        // Auto-trigger search after a short delay
        setTimeout(() => {
          autoSearchCandidates(query);
        }, 500);
      }
    }
  }, [autoSearched]);

  // Auto-search function (separate from manual search to handle initial load)
  const autoSearchCandidates = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        const newCandidates = data.users.map((user: {
          username: string;
          name: string;
          avatar: string;
          bio: string;
          location: string;
          company: string;
          skills: string[];
          score: number;
        }) => ({
          id: user.username,
          name: user.name || user.username,
          currentRole: user.bio || "Developer",
          company: user.company || "Independent",
          location: user.location || "Remote",
          alignmentScore: user.score || Math.floor(Math.random() * 30) + 60,
          avatar: user.avatar,
          skills: user.skills || [],
          createdAt: new Date().toISOString(),
        }));

        setCandidates(newCandidates);
        localStorage.setItem("apex_candidates", JSON.stringify(newCandidates));
      }
    } catch (error) {
      console.error("Auto-search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        const newCandidates = data.users.map((user: {
          username: string;
          name: string;
          avatar: string;
          bio: string;
          location: string;
          company: string;
          skills: string[];
          score: number;
        }) => ({
          id: user.username,
          name: user.name || user.username,
          currentRole: user.bio || "Developer",
          company: user.company || "Independent",
          location: user.location || "Remote",
          alignmentScore: user.score || Math.floor(Math.random() * 30) + 60,
          avatar: user.avatar,
          skills: user.skills || [],
          createdAt: new Date().toISOString(),
        }));

        setCandidates((prev) => {
          const merged = [...newCandidates, ...prev];
          const unique = merged.filter(
            (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
          );
          localStorage.setItem("apex_candidates", JSON.stringify(unique));
          return unique;
        });
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);

    try {
      const response = await fetch("/api/profile/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: `imported-${Date.now()}`,
          candidateName: "Imported Candidate",
          currentRole: "Unknown",
          company: "Unknown",
          location: "Unknown",
          skills: [],
          rawText: importText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCandidate: Candidate = {
          id: `imported-${Date.now()}`,
          name: data.name || "Imported Candidate",
          currentRole: data.currentRole || "Unknown",
          company: data.company || "Unknown",
          location: data.location || "Unknown",
          alignmentScore: data.alignmentScore || 70,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${Date.now()}`,
          skills: [],
          createdAt: new Date().toISOString(),
          keyEvidence: data.keyEvidence,
          risks: data.risks,
        };

        setCandidates((prev) => {
          const updated = [newCandidate, ...prev];
          localStorage.setItem("apex_candidates", JSON.stringify(updated));
          return updated;
        });

        setShowImport(false);
        setImportText("");
      }
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = useCallback((id: string) => {
    if (confirm("Delete this candidate from the pipeline?")) {
      setCandidates((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        localStorage.setItem("apex_candidates", JSON.stringify(updated));
        return updated;
      });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  // Sorting
  const sortedCandidates = useMemo(() => {
    const sorted = [...candidates];
    switch (sortBy) {
      case "score-desc":
        return sorted.sort((a, b) => b.alignmentScore - a.alignmentScore);
      case "score-asc":
        return sorted.sort((a, b) => a.alignmentScore - b.alignmentScore);
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }, [candidates, sortBy]);

  // Filtering
  const filteredCandidates = useMemo(() => {
    if (!filterScore) return sortedCandidates;
    switch (filterScore) {
      case "high":
        return sortedCandidates.filter((c) => c.alignmentScore >= 80);
      case "medium":
        return sortedCandidates.filter(
          (c) => c.alignmentScore >= 50 && c.alignmentScore < 80
        );
      case "low":
        return sortedCandidates.filter((c) => c.alignmentScore < 50);
      default:
        return sortedCandidates;
    }
  }, [sortedCandidates, filterScore]);

  // Score distribution for chart
  const scoreDistribution = useMemo(() => {
    const dist = [
      { range: "90-100", count: 0, color: "#22c55e" },
      { range: "80-89", count: 0, color: "#84cc16" },
      { range: "70-79", count: 0, color: "#eab308" },
      { range: "60-69", count: 0, color: "#f97316" },
      { range: "0-59", count: 0, color: "#ef4444" },
    ];
    candidates.forEach((c) => {
      if (c.alignmentScore >= 90) dist[0].count++;
      else if (c.alignmentScore >= 80) dist[1].count++;
      else if (c.alignmentScore >= 70) dist[2].count++;
      else if (c.alignmentScore >= 60) dist[3].count++;
      else dist[4].count++;
    });
    return dist;
  }, [candidates]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/20";
    if (score >= 60) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const selectedCandidates = candidates.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary">Step 2 of 4</Badge>
            <h1 className="text-3xl font-bold">Talent Pipeline</h1>
            {jobContext && (
              <>
                <p className="text-muted-foreground mt-1">
                  {jobContext.title} at {jobContext.company}
                </p>
                {jobContext.requiredSkills && jobContext.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-muted-foreground mr-1">Skills:</span>
                    {jobContext.requiredSkills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Link href="/intake">
              <Button variant="outline" size="sm">
                <Briefcase className="w-4 h-4 mr-2" />
                Edit Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Score Distribution Chart */}
        {candidates.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    Pipeline Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground">Score distribution across {candidates.length} candidates</p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Top Match: {candidates.filter((c) => c.alignmentScore >= 80).length}
                </Badge>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution}>
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search GitHub developers (e.g., 'react copenhagen')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span className="ml-2">Add Candidates</span>
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="text-sm bg-background border rounded px-2 py-1"
                      >
                        <option value="score-desc">Score (High to Low)</option>
                        <option value="score-asc">Score (Low to High)</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Score:</span>
                      <div className="flex gap-1">
                        {[
                          { value: null, label: "All" },
                          { value: "high", label: "80+" },
                          { value: "medium", label: "50-79" },
                          { value: "low", label: "<50" },
                        ].map((opt) => (
                          <Button
                            key={opt.label}
                            size="sm"
                            variant={filterScore === opt.value ? "default" : "outline"}
                            onClick={() => setFilterScore(opt.value as typeof filterScore)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {selectedIds.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Badge>{selectedIds.length} selected</Badge>
                        <Button size="sm" onClick={() => setShowComparison(true)}>
                          Compare
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {filteredCandidates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              {loading ? (
                <>
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Finding Candidates...</h3>
                  <p className="text-muted-foreground mb-4">
                    Searching for developers matching your job requirements
                  </p>
                  {jobContext?.requiredSkills && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {jobContext.requiredSkills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Candidates Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Search for developers on GitHub or import a resume
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setShowImport(true)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Import Resume
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredCandidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <button onClick={() => toggleSelect(candidate.id)} className="text-muted-foreground hover:text-foreground">
                          {selectedIds.includes(candidate.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        {/* Avatar */}
                        <img
                          src={candidate.avatar}
                          alt={candidate.name}
                          className="w-12 h-12 rounded-full"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{candidate.name}</h3>
                            {candidate.persona?.archetype && (
                              <Badge variant="outline" className="text-xs">
                                {candidate.persona.archetype.split(" ").slice(0, 2).join(" ")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {candidate.currentRole} at {candidate.company}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {candidate.location}
                            </span>
                            {candidate.skills.length > 0 && (
                              <span>{candidate.skills.slice(0, 3).join(", ")}</span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className={`text-center px-4 py-2 rounded-lg ${getScoreBg(candidate.alignmentScore)}`}>
                          <div className={`text-2xl font-bold ${getScoreColor(candidate.alignmentScore)}`}>
                            {candidate.alignmentScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${candidate.id}/deep`}>
                            <Button size="sm">
                              Deep Profile
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setOutreachCandidate(candidate);
                              setShowOutreach(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(candidate.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Import Modal */}
        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowImport(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Import Candidate</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Paste a resume, LinkedIn profile text, or any candidate information. Our AI will analyze and extract the relevant details.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste candidate information here..."
                  className="w-full h-64 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowImport(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={isImporting || !importText.trim()}>
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Analyze & Import
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Modal */}
        <AnimatePresence>
          {showComparison && selectedCandidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowComparison(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Compare Candidates</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowComparison(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className={`grid gap-4 ${selectedCandidates.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {selectedCandidates.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-16 h-16 rounded-full mx-auto mb-2"
                          />
                          <h3 className="font-medium">{c.name}</h3>
                          <p className="text-sm text-muted-foreground">{c.currentRole}</p>
                        </div>
                        <div className={`text-center p-4 rounded-lg ${getScoreBg(c.alignmentScore)} mb-4`}>
                          <div className={`text-3xl font-bold ${getScoreColor(c.alignmentScore)}`}>
                            {c.alignmentScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Alignment Score</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location</span>
                            <span>{c.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Company</span>
                            <span>{c.company}</span>
                          </div>
                        </div>
                        {c.skills.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1">
                            {c.skills.slice(0, 5).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Link href={`/profile/${c.id}/deep`} className="block mt-4">
                          <Button className="w-full" size="sm">
                            View Deep Profile
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outreach Modal */}
        {outreachCandidate && (
          <OutreachModal
            isOpen={showOutreach}
            onClose={() => {
              setShowOutreach(false);
              setOutreachCandidate(null);
            }}
            candidate={{
              name: outreachCandidate.name,
              currentRole: outreachCandidate.currentRole,
              company: outreachCandidate.company,
              avatar: outreachCandidate.avatar,
            }}
            jobContext={jobContext || undefined}
          />
        )}
      </div>
    </div>
  );
}

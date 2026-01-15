"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  Briefcase,
  MapPin,
  Star,
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  currentRole: string;
  company: string;
  location: string;
  alignmentScore: number;
  avatar: string;
  skills: string[];
}

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobContext, setJobContext] = useState<{
    title: string;
    company: string;
  } | null>(null);

  useEffect(() => {
    // Load job context from localStorage
    const stored = localStorage.getItem("apex_job_context");
    if (stored) {
      try {
        setJobContext(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }

    // Load candidates from localStorage
    const storedCandidates = localStorage.getItem("apex_candidates");
    if (storedCandidates) {
      try {
        setCandidates(JSON.parse(storedCandidates));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

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
          name: user.name,
          currentRole: user.bio || "Developer",
          company: user.company || "Independent",
          location: user.location || "Remote",
          alignmentScore: user.score || 70,
          avatar: user.avatar,
          skills: user.skills || [],
        }));

        setCandidates((prev) => {
          const merged = [...prev, ...newCandidates];
          // Dedupe by id
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary">
              Step 2 of 4
            </Badge>
            <h1 className="text-3xl font-bold">Talent Pipeline</h1>
            {jobContext && (
              <p className="text-muted-foreground mt-1">
                Finding candidates for {jobContext.title} at {jobContext.company}
              </p>
            )}
          </div>
          <Link href="/intake">
            <Button variant="outline" size="sm" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Edit Job
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search GitHub developers (e.g., 'typescript copenhagen')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Candidates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Grid */}
        {candidates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Candidates Yet</h3>
              <p className="text-muted-foreground mb-4">
                Search for developers on GitHub to add them to your pipeline
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{candidate.name}</h3>
                        <span
                          className={`text-lg font-bold ${getScoreColor(
                            candidate.alignmentScore
                          )}`}
                        >
                          {candidate.alignmentScore}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {candidate.currentRole}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {candidate.location}
                      </div>
                    </div>
                  </div>

                  {candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {candidate.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Link href={`/profile/${candidate.id}/deep`}>
                    <Button variant="ghost" className="w-full mt-4 gap-2">
                      Deep Profile
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

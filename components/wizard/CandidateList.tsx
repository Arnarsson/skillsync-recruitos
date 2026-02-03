"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getScoreInfo } from "@/components/ScoreBadge";

interface Developer {
  username: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
  skills: string[];
  score: number;
}

export function CandidateList({
  limit = 10,
  query,
  preview = true,
}: {
  limit?: number;
  query: string;
  preview?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!trimmedQuery) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Search failed");
        if (cancelled) return;
        setDevelopers((data?.users || []).slice(0, limit));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [trimmedQuery, limit]);

  if (!trimmedQuery) {
    return (
      <div className="text-sm text-muted-foreground">
        Add a job title and at least one must-have skill to see candidates.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Finding candidates…
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/10">
        <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {developers.map((dev) => {
        const scoreInfo = getScoreInfo(dev.score);
        return (
          <Link key={dev.username} href={`/profile/${dev.username}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={dev.avatar} alt={dev.name} />
                  <AvatarFallback>{dev.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium truncate">{dev.name}</div>
                    <Badge className={`${scoreInfo.bg} ${scoreInfo.color} ${scoreInfo.border} border text-xs`}>
                      <Star className="w-3 h-3 mr-1" />
                      {dev.score}%
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">@{dev.username}</span>
                  </div>
                  {dev.bio ? (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {dev.bio}
                    </p>
                  ) : null}
                  {dev.skills?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {dev.skills.slice(0, 6).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}

      {preview ? (
        <div className="pt-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/search?q=${encodeURIComponent(trimmedQuery)}`}>
              View full results
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

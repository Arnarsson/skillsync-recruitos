"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Linkedin,
  Search,
  RefreshCw,
  ExternalLink,
  MapPin,
  Briefcase,
  Users,
  Clock,
  Loader2,
  UserPlus,
  Filter,
} from "lucide-react";

interface LinkedInCapture {
  id: string;
  linkedinId: string;
  linkedinUrl: string;
  name: string;
  headline: string;
  location: string;
  currentCompany: string;
  photoUrl: string;
  about: string;
  experience: { title: string; company: string }[];
  connectionDegree: string;
  mutualConnections: string;
  source: string;
  capturedAt: string;
  createdAt: string;
}

export default function LinkedInCapturesPage() {
  const [captures, setCaptures] = useState<LinkedInCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);

  const fetchCaptures = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/linkedin/candidate?limit=100");
      const data = await res.json();
      setCaptures(data.candidates || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch captures:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptures();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCaptures, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCaptures = captures.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.headline?.toLowerCase().includes(query) ||
      c.currentCompany?.toLowerCase().includes(query) ||
      c.location?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Linkedin className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">LinkedIn Captures</h1>
              <p className="text-slate-400 text-sm">
                Profiles captured from the LinkedIn extension
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
              {total} profiles
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCaptures}
              disabled={loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search by name, headline, company, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{total}</p>
                  <p className="text-xs text-slate-400">Total Captured</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <UserPlus className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {captures.filter((c) => {
                      const hourAgo = Date.now() - 3600000;
                      return new Date(c.capturedAt).getTime() > hourAgo;
                    }).length}
                  </p>
                  <p className="text-xs text-slate-400">Last Hour</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <Briefcase className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {new Set(captures.map((c) => c.currentCompany).filter(Boolean)).size}
                  </p>
                  <p className="text-xs text-slate-400">Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {new Set(captures.map((c) => c.location).filter(Boolean)).size}
                  </p>
                  <p className="text-xs text-slate-400">Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Captures List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Captures
              {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCaptures.length === 0 ? (
              <div className="p-12 text-center">
                <Linkedin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  No profiles captured yet
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Install the LinkedIn extension and browse profiles. They'll appear here automatically.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                <AnimatePresence>
                  {filteredCaptures.map((capture, index) => (
                    <motion.div
                      key={capture.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {capture.photoUrl ? (
                            <img
                              src={capture.photoUrl}
                              alt={capture.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold">
                              {getInitials(capture.name)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {capture.name}
                            </h3>
                            {capture.connectionDegree && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-600/20 text-blue-400 text-xs"
                              >
                                {capture.connectionDegree}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 truncate mb-2">
                            {capture.headline}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {capture.currentCompany && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {capture.currentCompany}
                              </span>
                            )}
                            {capture.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {capture.location}
                              </span>
                            )}
                            {capture.mutualConnections && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {capture.mutualConnections}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {formatDate(capture.capturedAt)}
                          </span>
                          <a
                            href={capture.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </a>
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Add to Pipeline
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

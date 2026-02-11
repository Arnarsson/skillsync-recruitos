"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LinkedInNav, LinkedInEmptyState } from "@/components/linkedin/LinkedInNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
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
  GraduationCap,
  Sparkles,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
  Zap,
  Download,
  Trash2,
  Building2,
  TrendingUp,
  Tag,
  Mail,
  Github,
  Wand2,
  Copy,
  Check,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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
  experience: { title: string; company: string; duration?: string; dates?: string }[];
  education: { school: string; degree?: string; dates?: string }[];
  skills: { name: string; endorsements: number }[];
  languages: { language: string; proficiency?: string }[];
  certifications: { name: string; issuer?: string; date?: string }[];
  connectionDegree: string;
  mutualConnections: string;
  connectionCount?: string;
  followers?: string;
  openToWork: boolean;
  isPremium: boolean;
  isCreator: boolean;
  source: string;
  capturedAt: string;
  createdAt: string;
}

interface Enrichment {
  linkedinId: string;
  emailPatterns: string[];
  githubProfiles: { username: string; profileUrl: string; avatarUrl: string }[];
  companyDomain: string | null;
  enrichedAt: string;
}

export default function LinkedInCapturesPage() {
  const { t } = useLanguage();
  const [captures, setCaptures] = useState<LinkedInCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompanyInsights, setShowCompanyInsights] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [enrichments, setEnrichments] = useState<Record<string, Enrichment>>({});
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cleaningOld, setCleaningOld] = useState(false);

  const fetchCaptures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/linkedin/candidate?limit=100");
      const data = await res.json();
      setCaptures(data.candidates || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch captures:", error);
      setError(t("linkedinCaptures.errors.load"));
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

    if (diffMins < 1) return t("linkedinCaptures.time.justNow");
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

  // Compute company frequency map
  const companyStats = captures.reduce((acc, c) => {
    const company = c.currentCompany?.trim();
    if (company) {
      acc[company] = (acc[company] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCompanies = Object.entries(companyStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Compute skill frequency
  const skillStats = captures.reduce((acc, c) => {
    c.skills?.forEach(skill => {
      acc[skill.name] = (acc[skill.name] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topSkills = Object.entries(skillStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Name', 'Headline', 'Company', 'Location', 'LinkedIn URL', 
      'Open to Work', 'Connection Degree', 'Skills', 'Captured At'
    ];
    
    const rows = captures.map(c => [
      c.name || '',
      (c.headline || '').replace(/,/g, ';'),
      c.currentCompany || '',
      c.location || '',
      c.linkedinUrl || '',
      c.openToWork ? 'Yes' : 'No',
      c.connectionDegree || '',
      (c.skills || []).map(s => s.name).join('; '),
      c.capturedAt || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-captures-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter by company if selected
  const displayCaptures = companyFilter
    ? filteredCaptures.filter(c => c.currentCompany === companyFilter)
    : filteredCaptures;

  // Enrich a candidate with email patterns and GitHub profiles
  const enrichCandidate = async (capture: LinkedInCapture) => {
    setEnrichingId(capture.id);
    try {
      const res = await fetch('/api/linkedin/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: capture.name,
          company: capture.currentCompany,
          linkedinId: capture.linkedinId,
        }),
      });
      const data = await res.json();
      if (data.success && data.enrichment) {
        setEnrichments(prev => ({
          ...prev,
          [capture.id]: data.enrichment,
        }));
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
    } finally {
      setEnrichingId(null);
    }
  };

  // Copy email to clipboard
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const deleteCapture = async (capture: LinkedInCapture) => {
    const targetName = capture.name || t("linkedinCaptures.thisProfile");
    const confirmed = window.confirm(`${t("linkedinCaptures.confirmDeletePrefix")} ${targetName}?`);
    if (!confirmed) return;

    setDeletingId(capture.id);
    try {
      const res = await fetch(
        `/api/linkedin/candidate?id=${encodeURIComponent(capture.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Delete failed (${res.status})`);
      }
      setCaptures((prev) => prev.filter((c) => c.id !== capture.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("linkedinCaptures.errors.delete");
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const deleteOldCaptures = async (olderThanHours = 24) => {
    const confirmed = window.confirm(
      `Delete all captures older than ${olderThanHours} hours?`
    );
    if (!confirmed) return;

    setCleaningOld(true);
    try {
      const res = await fetch(
        `/api/linkedin/candidate?olderThanHours=${olderThanHours}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Cleanup failed (${res.status})`);
      }
      await fetchCaptures();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("linkedinCaptures.errors.cleanOld");
      setError(msg);
    } finally {
      setCleaningOld(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8 px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <LinkedInNav />
        
        {/* Header */}
        <PageHeader
          icon={Linkedin}
          title={t("linkedinCaptures.title")}
          subtitle={t("linkedinCaptures.subtitle")}
          badge={
            <Badge variant="secondary" className="badge-neutral">
              {total} {t("linkedinCaptures.profiles")}
            </Badge>
          }
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteOldCaptures(24)}
                disabled={captures.length === 0 || cleaningOld}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 focus-ring touch-target-sm"
              >
                {cleaningOld ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {t("linkedinCaptures.actions.deleteOld")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompanyInsights(!showCompanyInsights)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 focus-ring touch-target-sm"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {t("linkedinCaptures.actions.insights")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={captures.length === 0}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 focus-ring touch-target-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("linkedinCaptures.actions.exportCsv")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCaptures}
                disabled={loading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 focus-ring touch-target-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("linkedinCaptures.actions.refresh")}
              </Button>
            </>
          }
        />

        {/* Search & Filters */}
        <Card className="card-base">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder={t("linkedinCaptures.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300 focus-ring touch-target-sm">
                <Filter className="w-4 h-4 mr-2" />
                {t("linkedinCaptures.filters")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{total}</p>
                  <p className="caption">{t("linkedinCaptures.stats.totalCaptured")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 rounded-lg">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {captures.filter((c) => {
                      const hourAgo = Date.now() - 3600000;
                      return new Date(c.capturedAt).getTime() > hourAgo;
                    }).length}
                  </p>
                  <p className="caption">{t("linkedinCaptures.stats.lastHour")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600/20 rounded-lg">
                  <Briefcase className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {new Set(captures.map((c) => c.currentCompany).filter(Boolean)).size}
                  </p>
                  <p className="caption">{t("linkedinCaptures.stats.companies")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {new Set(captures.map((c) => c.location).filter(Boolean)).size}
                  </p>
                  <p className="caption">{t("linkedinCaptures.stats.locations")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 rounded-lg">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {captures.filter((c) => c.openToWork).length}
                  </p>
                  <p className="caption">{t("linkedinCaptures.stats.openToWork")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company & Skills Insights Panel */}
        <AnimatePresence>
          {showCompanyInsights && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Top Companies */}
                <Card className="card-base">
                  <CardHeader className="pb-2">
                    <CardTitle className="heading-md flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      {t("linkedinCaptures.topCompanies")}
                      {companyFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCompanyFilter(null)}
                          className="ml-auto text-xs text-slate-400 hover:text-white h-6 px-2"
                        >
                          {t("linkedinCaptures.clearFilter")}
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {topCompanies.length === 0 ? (
                      <p className="body-sm">{t("linkedinCaptures.noCompanyData")}</p>
                    ) : (
                      <div className="space-y-2">
                        {topCompanies.map(([company, count]) => (
                          <button
                            key={company}
                            onClick={() => setCompanyFilter(companyFilter === company ? null : company)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors focus-ring touch-target-sm ${
                              companyFilter === company
                                ? 'bg-amber-600/20 border border-amber-600/50'
                                : 'hover:bg-slate-800'
                            }`}
                          >
                            <span className="body-md truncate">{company}</span>
                            <Badge variant="secondary" className="badge-neutral ml-2">
                              {count}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Skills */}
                <Card className="card-base">
                  <CardHeader className="pb-2">
                    <CardTitle className="heading-md flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      {t("linkedinCaptures.topSkills")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {topSkills.length === 0 ? (
                      <p className="body-sm">{t("linkedinCaptures.noSkillsData")}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {topSkills.map(([skill, count]) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                          >
                            {skill}
                            <span className="ml-1 text-indigo-400">({count})</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Company Filter Banner */}
        {companyFilter && (
          <div className="flex items-center gap-2 p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="body-md">
              {t("linkedinCaptures.filteringBy")}: <span className="font-medium text-white">{companyFilter}</span>
            </span>
            <span className="caption">({displayCaptures.length} {t("linkedinCaptures.profiles")})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCompanyFilter(null)}
              className="ml-auto text-xs text-slate-400 hover:text-white focus-ring touch-target-sm"
            >
              {t("common.clear")}
            </Button>
          </div>
        )}

        {/* Error Banner */}
        {error && <ErrorBanner message={error} onRetry={fetchCaptures} />}

        {/* Captures List */}
        <Card className="card-base">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="heading-md flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("linkedinCaptures.recentCaptures")}
              {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <SkeletonCard count={6} variant="candidate" />
              </div>
            ) : displayCaptures.length === 0 && searchQuery ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-lg mb-2">{t("linkedinCaptures.noMatchesTitle")}</p>
                <p className="text-slate-500 text-sm">{t("linkedinCaptures.noMatchesDesc")}</p>
              </div>
            ) : displayCaptures.length === 0 ? (
              <LinkedInEmptyState type="captures" />
            ) : (
              <div className="divide-y divide-slate-800">
                <AnimatePresence>
                  {displayCaptures.map((capture, index) => {
                    const isExpanded = expandedId === capture.id;
                    const hasRichData = capture.skills?.length > 0 || capture.education?.length > 0 || capture.experience?.length > 1;
                    
                    return (
                    <motion.div
                      key={capture.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 card-interactive card-focusable"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative">
                          {capture.photoUrl ? (
                            <img
                              src={capture.photoUrl}
                              alt={capture.name}
                              className={`w-12 h-12 rounded-full object-cover ${capture.openToWork ? 'ring-2 ring-emerald-500' : ''}`}
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold ${capture.openToWork ? 'ring-2 ring-emerald-500' : ''}`}>
                              {getInitials(capture.name)}
                            </div>
                          )}
                          {capture.openToWork && (
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                              <Zap className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-white truncate">
                              {capture.name}
                            </h3>
                            {capture.openToWork && (
                              <Badge className="badge-success text-xs border-0">
                                {t("linkedinCaptures.stats.openToWork")}
                              </Badge>
                            )}
                            {capture.isPremium && (
                              <Badge className="badge-warning text-xs border-0">
                                <Star className="w-3 h-3 mr-1" />
                                {t("linkedinCaptures.premium")}
                              </Badge>
                            )}
                            {capture.connectionDegree && (
                              <Badge
                                variant="secondary"
                                className="badge-info text-xs"
                              >
                                {capture.connectionDegree}
                              </Badge>
                            )}
                          </div>
                          <p className="body-sm truncate mb-2">
                            {capture.headline}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
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
                            {capture.skills?.length > 0 && (
                              <span className="flex items-center gap-1 text-indigo-400">
                                <Sparkles className="w-3 h-3" />
                                {capture.skills.length} skills
                              </span>
                            )}
                            {capture.education?.length > 0 && (
                              <span className="flex items-center gap-1 text-indigo-400">
                                <GraduationCap className="w-3 h-3" />
                                {capture.education.length} education
                              </span>
                            )}
                          </div>
                          
                          {/* Top Skills Preview */}
                          {capture.skills?.length > 0 && !isExpanded && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {capture.skills.slice(0, 5).map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-slate-700 text-slate-400">
                                  {skill.name}
                                  {skill.endorsements > 0 && (
                                    <span className="ml-1 text-slate-500">({skill.endorsements})</span>
                                  )}
                                </Badge>
                              ))}
                              {capture.skills.length > 5 && (
                                <span className="caption">+{capture.skills.length - 5} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:flex-shrink-0 lg:justify-end">
                          <span className="caption">
                            {formatDate(capture.capturedAt)}
                          </span>
                          {hasRichData && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : capture.id)}
                              className="p-2 hover:bg-slate-700 rounded-lg transition-colors focus-ring touch-target-sm"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          )}
                          <a
                            href={capture.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors focus-ring touch-target-sm"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </a>
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white focus-ring touch-target-sm px-3 whitespace-nowrap"
                          >
                            Add to Pipeline
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCapture(capture)}
                            disabled={deletingId === capture.id}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 focus-ring touch-target-sm px-3 whitespace-nowrap"
                          >
                            {deletingId === capture.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Expanded Rich Data */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 ml-16 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Experience */}
                              {capture.experience?.length > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-amber-400" />
                                    Experience ({capture.experience.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {capture.experience.slice(0, 5).map((exp, i) => (
                                      <div key={i} className="text-xs">
                                        <p className="text-slate-300 font-medium">{exp.title}</p>
                                        <p className="text-slate-500">{exp.company}</p>
                                        {exp.dates && <p className="text-slate-600">{exp.dates}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Education */}
                              {capture.education?.length > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                                    Education ({capture.education.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {capture.education.map((edu, i) => (
                                      <div key={i} className="text-xs">
                                        <p className="text-slate-300 font-medium">{edu.school}</p>
                                        {edu.degree && <p className="text-slate-500">{edu.degree}</p>}
                                        {edu.dates && <p className="text-slate-600">{edu.dates}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* All Skills */}
                              {capture.skills?.length > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    Skills ({capture.skills.length})
                                  </h4>
                                  <div className="flex flex-wrap gap-1">
                                    {capture.skills.map((skill, i) => (
                                      <Badge key={i} variant="outline" className="text-xs border-slate-700 text-slate-400">
                                        {skill.name}
                                        {skill.endorsements > 0 && (
                                          <span className="ml-1 text-indigo-400">+{skill.endorsements}</span>
                                        )}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Certifications */}
                              {capture.certifications?.length > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    Certifications ({capture.certifications.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {capture.certifications.map((cert, i) => (
                                      <div key={i} className="text-xs">
                                        <p className="text-slate-300 font-medium">{cert.name}</p>
                                        {cert.issuer && <p className="text-slate-500">{cert.issuer}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Enrichment Panel */}
                              <div className="bg-gradient-to-br from-emerald-900/30 to-slate-800/50 rounded-lg p-3 border border-emerald-600/20 md:col-span-2">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-emerald-400" />
                                    External Enrichment
                                  </h4>
                                  {!enrichments[capture.id] && (
                                    <Button
                                      size="sm"
                                      onClick={() => enrichCandidate(capture)}
                                      disabled={enrichingId === capture.id}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 focus-ring touch-target-sm"
                                    >
                                      {enrichingId === capture.id ? (
                                        <>
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                          Enriching...
                                        </>
                                      ) : (
                                        <>
                                          <Wand2 className="w-3 h-3 mr-1" />
                                          Find Email & GitHub
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                                
                                {enrichments[capture.id] ? (
                                  <div className="space-y-3">
                                    {/* Email Patterns */}
                                    <div>
                                      <p className="caption flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        Likely Email Patterns
                                        {enrichments[capture.id].companyDomain && (
                                          <span className="text-slate-500">(@{enrichments[capture.id].companyDomain})</span>
                                        )}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {enrichments[capture.id].emailPatterns.slice(0, 6).map((email, i) => (
                                          <button
                                            key={i}
                                            onClick={() => copyEmail(email)}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors focus-ring touch-target-sm"
                                          >
                                            {email}
                                            {copiedEmail === email ? (
                                              <Check className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-3 h-3 text-slate-500" />
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* GitHub Profiles */}
                                    {enrichments[capture.id].githubProfiles.length > 0 && (
                                      <div>
                                        <p className="caption flex items-center gap-1">
                                          <Github className="w-3 h-3" />
                                          Possible GitHub Profiles
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {enrichments[capture.id].githubProfiles.map((gh, i) => (
                                            <a
                                              key={i}
                                              href={gh.profileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-2 px-2 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors focus-ring touch-target-sm"
                                            >
                                              <img src={gh.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                                              {gh.username}
                                              <ExternalLink className="w-3 h-3 text-slate-500" />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <p className="caption">
                                      Enriched {new Date(enrichments[capture.id].enrichedAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="caption">
                                    Click "Find Email & GitHub" to discover contact info and developer profiles
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )})}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

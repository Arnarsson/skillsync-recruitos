"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkedInNav, LinkedInEmptyState } from "@/components/linkedin/LinkedInNav";
import {
  Network,
  Building2,
  Users,
  MapPin,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Link2,
  TrendingUp,
  UserCheck,
  Briefcase,
  ExternalLink,
} from "lucide-react";

interface CompanyNode {
  company: string;
  employees: {
    id: string;
    name: string;
    title: string;
    linkedinId: string;
    connectionDegree?: string;
  }[];
  totalCaptured: number;
  locations: string[];
  titles: string[];
}

interface NetworkAnalysis {
  companies: CompanyNode[];
  sharedEmployers: {
    company: string;
    profiles: string[];
  }[];
  connectionStrength: {
    firstDegree: number;
    secondDegree: number;
    thirdDegree: number;
    unknown: number;
  };
  topLocations: { location: string; count: number }[];
  potentialColleagues: {
    personA: string;
    personB: string;
    sharedCompany: string;
  }[];
}

export default function NetworkMapPage() {
  const [analysis, setAnalysis] = useState<NetworkAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileCount, setProfileCount] = useState(0);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const fetchAndAnalyze = async () => {
    setLoading(true);
    try {
      // First fetch all captures
      const capturesRes = await fetch("/api/linkedin/candidate?limit=500");
      const capturesData = await capturesRes.json();
      const profiles = capturesData.candidates || [];
      
      setProfileCount(profiles.length);
      
      if (profiles.length === 0) {
        setAnalysis(null);
        setLoading(false);
        return;
      }
      
      // Then analyze the network
      const analysisRes = await fetch("/api/linkedin/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles }),
      });
      const analysisData = await analysisRes.json();
      
      if (analysisData.success) {
        setAnalysis(analysisData.analysis);
      }
    } catch (error) {
      console.error("Network analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndAnalyze();
  }, []);

  const totalConnections = analysis
    ? analysis.connectionStrength.firstDegree +
      analysis.connectionStrength.secondDegree +
      analysis.connectionStrength.thirdDegree +
      analysis.connectionStrength.unknown
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 p-6 pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <LinkedInNav />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Network className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Network Map</h1>
              <p className="text-slate-400 text-sm">
                Relationship intelligence from {profileCount} captured profiles
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAndAnalyze}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : !analysis || profileCount === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <LinkedInEmptyState type="network" />
          </Card>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 rounded-lg">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{profileCount}</p>
                      <p className="text-xs text-slate-400">Profiles Mapped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-600/20 rounded-lg">
                      <Building2 className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{analysis.companies.length}</p>
                      <p className="text-xs text-slate-400">Companies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <UserCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{analysis.connectionStrength.firstDegree}</p>
                      <p className="text-xs text-slate-400">1st Connections</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Link2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{analysis.potentialColleagues.length}</p>
                      <p className="text-xs text-slate-400">Colleague Links</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Connection Strength */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Connection Strength Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 h-8">
                  {analysis.connectionStrength.firstDegree > 0 && (
                    <div
                      className="bg-green-500 h-full rounded-l flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${(analysis.connectionStrength.firstDegree / totalConnections) * 100}%`, minWidth: '40px' }}
                    >
                      1st ({analysis.connectionStrength.firstDegree})
                    </div>
                  )}
                  {analysis.connectionStrength.secondDegree > 0 && (
                    <div
                      className="bg-blue-500 h-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${(analysis.connectionStrength.secondDegree / totalConnections) * 100}%`, minWidth: '40px' }}
                    >
                      2nd ({analysis.connectionStrength.secondDegree})
                    </div>
                  )}
                  {analysis.connectionStrength.thirdDegree > 0 && (
                    <div
                      className="bg-orange-500 h-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${(analysis.connectionStrength.thirdDegree / totalConnections) * 100}%`, minWidth: '40px' }}
                    >
                      3rd ({analysis.connectionStrength.thirdDegree})
                    </div>
                  )}
                  {analysis.connectionStrength.unknown > 0 && (
                    <div
                      className="bg-slate-600 h-full rounded-r flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${(analysis.connectionStrength.unknown / totalConnections) * 100}%`, minWidth: '40px' }}
                    >
                      ? ({analysis.connectionStrength.unknown})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              {/* Company Org Charts */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-yellow-400" />
                    Company Penetration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  {analysis.companies.map((company) => (
                    <div key={company.company} className="border border-slate-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCompany(expandedCompany === company.company ? null : company.company)}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-600/20 rounded flex items-center justify-center text-yellow-400 font-bold text-sm">
                            {company.totalCaptured}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{company.company}</p>
                            <p className="text-xs text-slate-500">{company.locations.slice(0, 2).join(', ')}</p>
                          </div>
                        </div>
                        {expandedCompany === company.company ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedCompany === company.company && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 pt-0 space-y-2 border-t border-slate-800">
                              {company.employees.map((emp) => (
                                <div key={emp.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                                  <div>
                                    <p className="text-sm text-white">{emp.name}</p>
                                    <p className="text-xs text-slate-500">{emp.title}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {emp.connectionDegree && (
                                      <Badge variant="outline" className="text-xs border-slate-700">
                                        {emp.connectionDegree}
                                      </Badge>
                                    )}
                                    <a
                                      href={`https://linkedin.com/in/${emp.linkedinId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-slate-700 rounded"
                                    >
                                      <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Potential Colleagues & Locations */}
              <div className="space-y-6">
                {/* Potential Colleagues */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-purple-400" />
                      Potential Colleagues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.potentialColleagues.length === 0 ? (
                      <p className="text-sm text-slate-500">No colleague connections found yet. Capture more profiles!</p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {analysis.potentialColleagues.slice(0, 10).map((link, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-sm">
                            <span className="text-white">{link.personA}</span>
                            <span className="text-purple-400">↔</span>
                            <span className="text-white">{link.personB}</span>
                            <Badge variant="outline" className="ml-auto text-xs border-slate-700 text-slate-400">
                              {link.sharedCompany}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Locations */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      Top Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.topLocations.map((loc, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">{loc.location}</span>
                          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                            {loc.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Employers */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      Shared Work History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.sharedEmployers.length === 0 ? (
                      <p className="text-sm text-slate-500">No shared employers found yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {analysis.sharedEmployers.slice(0, 8).map((employer, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                            <span className="text-sm text-slate-300 capitalize">{employer.company}</span>
                            <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400">
                              {employer.profiles.length} people
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

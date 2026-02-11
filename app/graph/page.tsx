"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  Panel,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  extractGitHubUsername,
  readLocalCandidates,
  type CandidateIdentitySource,
} from "@/lib/candidate-identity";
import {
  ArrowLeft,
  X,
  MapPin,
  Briefcase,
  Building2,
  ExternalLink,
  Users,
  Loader2,
  Network,
  GitBranch,
  Zap,
  Code2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

// ===== Types =====

interface CandidateNodeData {
  candidateId: string;
  name: string;
  avatar: string | null;
  score: number | null;
  skills: string[];
  company: string | null;
  location: string | null;
  currentRole: string | null;
  pipelineStage: string;
  sourceType: string;
  sourceUrl: string | null;
  githubUsername: string | null;
  [key: string]: unknown;
}

interface EdgeData {
  reason: string;
  weight: number;
  connectionType: string;
  [key: string]: unknown;
}

// ===== Helpers =====

const stageColors: Record<string, string> = {
  sourced: "border-zinc-500 bg-zinc-500/10",
  screening: "border-blue-500 bg-blue-500/10",
  interview: "border-amber-500 bg-amber-500/10",
  offer: "border-green-500 bg-green-500/10",
};

const stageRingColors: Record<string, string> = {
  sourced: "ring-zinc-500/50",
  screening: "ring-blue-500/50",
  interview: "ring-amber-500/50",
  offer: "ring-green-500/50",
};

const stageDotColors: Record<string, string> = {
  sourced: "bg-zinc-500",
  screening: "bg-blue-500",
  interview: "bg-amber-500",
  offer: "bg-green-500",
};

function getScoreColor(score: number | null): string {
  if (score === null) return "text-zinc-400";
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-zinc-800";
  if (score >= 80) return "bg-green-500/20";
  if (score >= 60) return "bg-amber-500/20";
  return "bg-red-500/20";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const connectionTypeColors: Record<string, string> = {
  skills: "#8b5cf6",
  company: "#3b82f6",
  location: "#f59e0b",
  score: "#6b7280",
};

interface LocalCandidate {
  id: string;
  name?: string;
  avatar?: string | null;
  alignmentScore?: number | null;
  skills?: string[] | null;
  company?: string | null;
  location?: string | null;
  currentRole?: string | null;
  pipelineStage?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  githubUsername?: string | null;
}

function safeSkillArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
}

function buildFallbackGraph(localCandidates: LocalCandidate[]): { nodes: Node<CandidateNodeData>[]; edges: Edge<EdgeData>[] } {
  const candidates = localCandidates.filter((c) => c.id);
  if (candidates.length === 0) return { nodes: [], edges: [] };

  const radius = Math.max(300, candidates.length * 50);
  const angleStep = (2 * Math.PI) / candidates.length;

  const nodes: Node<CandidateNodeData>[] = candidates.map((c, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));
    const githubUsername = extractGitHubUsername(c as CandidateIdentitySource);

    return {
      id: c.id,
      type: "candidateNode",
      position: { x, y },
      data: {
        candidateId: c.id,
        name: c.name || c.id,
        avatar: c.avatar || null,
        score: typeof c.alignmentScore === "number" ? c.alignmentScore : null,
        skills: safeSkillArray(c.skills),
        company: c.company || null,
        location: c.location || null,
        currentRole: c.currentRole || null,
        pipelineStage: c.pipelineStage || "sourced",
        sourceType: c.sourceType || "GITHUB",
        sourceUrl: c.sourceUrl || null,
        githubUsername: githubUsername || null,
      },
    };
  });

  const edges: Edge<EdgeData>[] = [];
  let edgeId = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].data;
      const b = nodes[j].data;

      const aSkills = a.skills.map((s) => s.toLowerCase().trim());
      const bSkills = new Set(b.skills.map((s) => s.toLowerCase().trim()));
      const sharedSkills = aSkills.filter((s) => bSkills.has(s));
      if (sharedSkills.length >= 2) {
        edges.push({
          id: `fallback-skill-${edgeId++}`,
          source: nodes[i].id,
          target: nodes[j].id,
          type: "smoothstep",
          animated: sharedSkills.length >= 4,
          data: {
            reason: `${sharedSkills.length} shared skills`,
            weight: Math.min(1, sharedSkills.length / 8),
            connectionType: "skills",
          },
        });
      }

      if (
        a.company &&
        b.company &&
        a.company.toLowerCase().trim() !== "" &&
        a.company.toLowerCase().trim() === b.company.toLowerCase().trim()
      ) {
        edges.push({
          id: `fallback-company-${edgeId++}`,
          source: nodes[i].id,
          target: nodes[j].id,
          type: "smoothstep",
          animated: false,
          data: {
            reason: `Same company: ${a.company}`,
            weight: 0.8,
            connectionType: "company",
          },
        });
      }

      if (
        a.location &&
        b.location &&
        a.location.toLowerCase().trim() !== "" &&
        a.location.toLowerCase().trim() === b.location.toLowerCase().trim()
      ) {
        edges.push({
          id: `fallback-location-${edgeId++}`,
          source: nodes[i].id,
          target: nodes[j].id,
          type: "smoothstep",
          animated: false,
          data: {
            reason: `Same location: ${a.location}`,
            weight: 0.4,
            connectionType: "location",
          },
        });
      }
    }
  }

  return { nodes, edges };
}

// ===== Custom Node Component =====

function CandidateNode({ data, selected }: NodeProps<Node<CandidateNodeData>>) {
  const stage = data.pipelineStage || "sourced";
  const stageColor = stageColors[stage] || stageColors.sourced;
  const ringColor = stageRingColors[stage] || stageRingColors.sourced;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-zinc-600 !border-zinc-500 !w-2 !h-2" />
      <div
        className={`
          px-3 py-2.5 rounded-xl border-2 backdrop-blur-sm
          bg-zinc-800/90 shadow-lg shadow-black/20
          transition-all duration-200 cursor-pointer
          ${stageColor}
          ${selected ? `ring-2 ${ringColor} scale-105` : "hover:scale-[1.02]"}
        `}
        style={{ minWidth: 160, maxWidth: 200 }}
      >
        {/* Avatar + Name Row */}
        <div className="flex items-center gap-2 mb-1.5">
          {data.avatar ? (
            <img
              src={data.avatar}
              alt={data.name}
              className="w-8 h-8 rounded-full border border-zinc-700 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-xs font-medium text-zinc-300 flex-shrink-0">
              {getInitials(data.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-100 truncate leading-tight">
              {data.name}
            </p>
            {data.currentRole && (
              <p className="text-[10px] text-zinc-400 truncate leading-tight">
                {data.currentRole}
              </p>
            )}
          </div>
          {/* Score Badge */}
          {data.score !== null && (
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getScoreBgColor(data.score)} ${getScoreColor(data.score)}`}
            >
              {Math.round(data.score)}
            </div>
          )}
        </div>

        {/* Top Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-1.5 py-0.5 text-[9px] rounded bg-zinc-700/80 text-zinc-300 border border-zinc-600/50 leading-none"
              >
                {skill}
              </span>
            ))}
            {data.skills.length > 3 && (
              <span className="px-1 py-0.5 text-[9px] text-zinc-500 leading-none">
                +{data.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-600 !border-zinc-500 !w-2 !h-2" />
    </>
  );
}

// ===== Side Panel Component =====

function CandidateDetailPanel({
  candidate,
  connectedEdges,
  onClose,
}: {
  candidate: CandidateNodeData;
  connectedEdges: Edge<EdgeData>[];
  onClose: () => void;
}) {
  const stage = candidate.pipelineStage || "sourced";
  const dotColor = stageDotColors[stage] || stageDotColors.sourced;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-50 sm:z-auto sm:relative">
      {/* Mobile overlay backdrop */}
      <div
        className="absolute inset-0 bg-black/60 sm:hidden"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm sm:max-w-none sm:w-full bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 p-4 z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100">Candidate Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Identity Card */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {candidate.avatar ? (
                  <img
                    src={candidate.avatar}
                    alt={candidate.name}
                    className="w-14 h-14 rounded-full border-2 border-zinc-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-lg font-medium text-zinc-300">
                    {getInitials(candidate.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-zinc-100 truncate">
                    {candidate.name}
                  </h4>
                  {candidate.currentRole && (
                    <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{candidate.currentRole}</span>
                    </p>
                  )}
                  {candidate.company && (
                    <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{candidate.company}</span>
                    </p>
                  )}
                  {candidate.location && (
                    <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{candidate.location}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Score + Stage */}
              <div className="flex items-center gap-3 mt-3">
                {candidate.score !== null && (
                  <div
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getScoreBgColor(candidate.score)} ${getScoreColor(candidate.score)}`}
                  >
                    {Math.round(candidate.score)}% alignment
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                  <span className="text-xs text-zinc-400 capitalize">
                    {stage}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] text-zinc-400 border-zinc-700"
                >
                  {candidate.sourceType}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* All Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Skills ({candidate.skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="text-xs bg-zinc-700/50 text-zinc-300 border-zinc-600/50"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connections */}
          {connectedEdges.length > 0 && (
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Connections ({connectedEdges.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {connectedEdges.map((edge) => {
                  const edgeData = edge.data as EdgeData | undefined;
                  const connType = edgeData?.connectionType || "unknown";
                  const color = connectionTypeColors[connType] || "#6b7280";
                  return (
                    <div
                      key={edge.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-zinc-400">
                        {edgeData?.reason || "Connected"}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link href={`/profile/${candidate.githubUsername || candidate.candidateId}`}>
              <Button className="w-full gap-2" variant="default">
                <ExternalLink className="w-4 h-4" />
                View Full Profile
              </Button>
            </Link>
            {candidate.sourceUrl && (
              <a
                href={candidate.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full gap-2" variant="outline">
                  <GitBranch className="w-4 h-4" />
                  View Source
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main Page =====

export default function TalentGraphPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CandidateNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<EdgeData>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CandidateNodeData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeFilter, setEdgeFilter] = useState<string | null>(null);

  // Node types must be defined outside of render or memoized
  const nodeTypes: NodeTypes = useMemo(() => ({ candidateNode: CandidateNode }), []);
  const selectedIds = useMemo(() => {
    const fromUrl = (searchParams.get("ids") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (fromUrl.length > 0) return fromUrl;

    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("apex_graph_selected");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    } catch {
      return [];
    }
  }, [searchParams]);

  // Fetch graph data
  useEffect(() => {
    let cancelled = false;

    async function fetchGraph() {
      try {
        setLoading(true);
        setError(null);

        const query = selectedIds.length > 0 ? `?ids=${encodeURIComponent(selectedIds.join(","))}` : "";
        const res = await fetch(`/api/candidates/graph${query}`);
        if (!res.ok) {
          let details = t("graph.error.loadData");
          try {
            const payload = await res.json();
            if (payload?.error && typeof payload.error === "string") {
              details = payload.error;
            }
          } catch {
            // Keep default error message if JSON parsing fails
          }
          throw new Error(details);
        }

        const data = await res.json();
        const apiNodes = data.nodes || [];
        const apiEdges = data.edges || [];

        if (apiNodes.length > 0) {
          if (!cancelled) {
            setNodes(apiNodes);
            setEdges(apiEdges);
          }
          return;
        }

        // Fallback for unauth/demo flows where candidates live in localStorage.
        try {
          const localCandidates = readLocalCandidates<LocalCandidate>();
          const scopedCandidates =
            selectedIds.length > 0
              ? localCandidates.filter((candidate) => selectedIds.includes(candidate.id))
              : localCandidates;
          const fallbackGraph = buildFallbackGraph(scopedCandidates);
          if (!cancelled) {
            setNodes(fallbackGraph.nodes);
            setEdges(fallbackGraph.edges);
          }
        } catch {
          if (!cancelled) {
            setNodes([]);
            setEdges([]);
          }
        }
      } catch (err) {
        // Last-chance fallback before showing an error.
        try {
          const localCandidates = readLocalCandidates<LocalCandidate>();
          const scopedCandidates =
            selectedIds.length > 0
              ? localCandidates.filter((candidate) => selectedIds.includes(candidate.id))
              : localCandidates;
          const fallbackGraph = buildFallbackGraph(scopedCandidates);
          if (!cancelled && fallbackGraph.nodes.length > 0) {
            setNodes(fallbackGraph.nodes);
            setEdges(fallbackGraph.edges);
            setError(null);
            return;
          }
        } catch {
          // Keep original error
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("graph.error.load"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchGraph();

    return () => {
      cancelled = true;
    };
  }, [setNodes, setEdges, selectedIds]);

  // Filter edges by connection type
  const filteredEdges = useMemo(() => {
    if (!edgeFilter) return edges;
    return edges.filter((e) => {
      const edgeData = e.data as EdgeData | undefined;
      return edgeData?.connectionType === edgeFilter;
    });
  }, [edges, edgeFilter]);

  // Get edges connected to selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [edges, selectedNodeId]);

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as CandidateNodeData;
      setSelectedNode(data);
      setSelectedNodeId(node.id);
    },
    []
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodeId(null);
  }, []);

  // Edge style function
  const styledEdges = useMemo(() => {
    return filteredEdges.map((edge) => {
      const edgeData = edge.data as EdgeData | undefined;
      const connType = edgeData?.connectionType || "score";
      const color = connectionTypeColors[connType] || "#6b7280";
      const weight = edgeData?.weight || 0.3;
      const isConnected =
        selectedNodeId &&
        (edge.source === selectedNodeId || edge.target === selectedNodeId);

      return {
        ...edge,
        style: {
          stroke: color,
          strokeWidth: isConnected ? 2.5 : 1 + weight * 1.5,
          opacity: selectedNodeId ? (isConnected ? 1 : 0.15) : 0.6,
        },
        label: isConnected ? edgeData?.reason : undefined,
        labelStyle: {
          fill: "#a1a1aa",
          fontSize: 10,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: "#27272a",
          fillOpacity: 0.9,
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 4,
      };
    });
  }, [filteredEdges, selectedNodeId]);

  // Compute edge type stats
  const edgeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const edge of edges) {
      const edgeData = edge.data as EdgeData | undefined;
      const type = edgeData?.connectionType || "unknown";
      stats[type] = (stats[type] || 0) + 1;
    }
    return stats;
  }, [edges]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          </div>
          <div>
            <p className="text-zinc-300 font-medium">{t("graph.loading.title")}</p>
            <p className="text-sm text-zinc-500">
              {t("graph.loading.subtitle")}
            </p>
          </div>
          {/* Skeleton nodes */}
          <div className="flex gap-3 justify-center mt-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-40 h-16 rounded-xl bg-zinc-800/50 border border-zinc-700/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-zinc-200 font-medium">
                {t("graph.error.load")}
              </p>
              <p className="text-sm text-zinc-500 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-zinc-700"
            >
              {t("graph.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-zinc-500" />
            </div>
            <div>
              <p className="text-zinc-200 font-medium text-lg">
                {t("graph.empty.title")}
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                {t("graph.empty.description")}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Link href="/pipeline">
                <Button variant="outline" className="border-zinc-700 gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t("graph.empty.goToPipeline")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 flex">
      {/* Graph Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
          }}
        >
          <Background color="#3f3f46" gap={20} size={1} />
          <Controls
            className="!bg-zinc-800 !border-zinc-700 !rounded-lg !shadow-xl [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700"
          />
          <MiniMap
            className="!bg-zinc-900 !border-zinc-800 !rounded-lg"
            nodeColor={(node) => {
              const data = node.data as CandidateNodeData;
              const stage = data?.pipelineStage || "sourced";
              switch (stage) {
                case "screening":
                  return "#3b82f6";
                case "interview":
                  return "#f59e0b";
                case "offer":
                  return "#22c55e";
                default:
                  return "#71717a";
              }
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
          />

          {/* Top-left: Back button + title */}
          <Panel position="top-left">
            <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl px-4 py-2.5 shadow-xl">
              <Link href="/pipeline">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-zinc-100 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-violet-400" />
                <div>
                  <h1 className="text-sm font-semibold text-zinc-100">
                    {t("graph.title")}
                  </h1>
                  <p className="text-[10px] text-zinc-500">
                    {nodes.length} {t("graph.candidates")}, {edges.length} {t("graph.connections")}
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Top-right: Legend + Filters */}
          <Panel position="top-right">
            <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl p-3 shadow-xl space-y-3 max-w-[220px]">
              {/* Stage Legend */}
              <div>
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t("graph.pipelineStage")}
                </p>
                <div className="space-y-1">
                  {[
                    { stage: "sourced", label: t("graph.stages.sourced"), color: "bg-zinc-500" },
                    { stage: "screening", label: t("graph.stages.screening"), color: "bg-blue-500" },
                    { stage: "interview", label: t("graph.stages.interview"), color: "bg-amber-500" },
                    { stage: "offer", label: t("graph.stages.offer"), color: "bg-green-500" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-xs text-zinc-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge Type Filters */}
              {Object.keys(edgeStats).length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
                    {t("graph.connectionType")}
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => setEdgeFilter(null)}
                      className={`flex items-center gap-2 w-full px-1.5 py-0.5 rounded text-left transition-colors ${
                        edgeFilter === null
                          ? "bg-zinc-700/50"
                          : "hover:bg-zinc-800"
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                      <span className="text-xs text-zinc-400 flex-1">{t("graph.all")}</span>
                      <span className="text-[10px] text-zinc-600">
                        {edges.length}
                      </span>
                    </button>
                    {Object.entries(edgeStats).map(([type, count]) => {
                      const color = connectionTypeColors[type] || "#6b7280";
                      const labels: Record<string, string> = {
                        skills: t("graph.connectionLabels.skills"),
                        company: t("graph.connectionLabels.company"),
                        location: t("graph.connectionLabels.location"),
                        score: t("graph.connectionLabels.score"),
                      };
                      const icons: Record<string, React.ReactNode> = {
                        skills: <Code2 className="w-3 h-3" />,
                        company: <Building2 className="w-3 h-3" />,
                        location: <MapPin className="w-3 h-3" />,
                        score: <Zap className="w-3 h-3" />,
                      };
                      return (
                        <button
                          key={type}
                          onClick={() =>
                            setEdgeFilter(edgeFilter === type ? null : type)
                          }
                          className={`flex items-center gap-2 w-full px-1.5 py-0.5 rounded text-left transition-colors ${
                            edgeFilter === type
                              ? "bg-zinc-700/50"
                              : "hover:bg-zinc-800"
                          }`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-zinc-400 flex-1 flex items-center gap-1">
                            {icons[type]}
                            {labels[type] || type}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Side Panel */}
      {selectedNode && (
        <CandidateDetailPanel
          candidate={selectedNode}
          connectedEdges={connectedEdges}
          onClose={() => {
            setSelectedNode(null);
            setSelectedNodeId(null);
          }}
        />
      )}
    </div>
  );
}

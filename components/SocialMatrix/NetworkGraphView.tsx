"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Building2,
  GraduationCap,
  GitBranch,
  Calendar,
  FileText,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { SocialMatrix, MatrixNode, MatrixEdge, ConnectionPath, VerificationStatus } from "@/types/socialMatrix";

interface NetworkGraphViewProps {
  matrix: SocialMatrix;
  highlightedPath?: ConnectionPath;
  onNodeClick?: (node: MatrixNode) => void;
  onClose?: () => void;
}

// ===== NODE ICONS =====

interface NodeIconProps {
  type: string;
  className?: string;
}

function NodeIcon({ type, className }: NodeIconProps) {
  switch (type) {
    case "person":
      return <User className={className} />;
    case "company":
      return <Building2 className={className} />;
    case "school":
      return <GraduationCap className={className} />;
    case "repo":
    case "org":
      return <GitBranch className={className} />;
    case "event":
      return <Calendar className={className} />;
    case "content":
      return <FileText className={className} />;
    default:
      return <Users className={className} />;
  }
}

function getNodeColor(type: string, isHighlighted: boolean, isEndpoint: boolean) {
  if (isEndpoint) {
    return {
      bg: "bg-primary",
      border: "border-primary",
      text: "text-primary-foreground",
    };
  }

  if (isHighlighted) {
    return {
      bg: "bg-green-500/20",
      border: "border-green-500",
      text: "text-foreground",
    };
  }

  switch (type) {
    case "person":
      return {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        text: "text-foreground",
      };
    case "company":
      return {
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        text: "text-foreground",
      };
    case "school":
      return {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        text: "text-foreground",
      };
    case "repo":
    case "org":
      return {
        bg: "bg-gray-500/10",
        border: "border-gray-500/30",
        text: "text-foreground",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-border",
        text: "text-foreground",
      };
  }
}

// ===== CUSTOM NODE =====

interface MatrixNodeData extends Record<string, unknown> {
  id: string;
  type: string;
  name: string;
  metadata: Record<string, unknown>;
  source: string;
  profileUrl?: string;
  imageUrl?: string;
  isHighlighted: boolean;
  isEndpoint: boolean;
}

function MatrixNodeComponent({ data }: NodeProps) {
  const nodeData = data as MatrixNodeData;
  const colors = getNodeColor(nodeData.type, nodeData.isHighlighted, nodeData.isEndpoint);

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div
        className={`
          px-3 py-2 rounded-lg border-2 shadow-lg transition-all cursor-pointer
          ${colors.bg} ${colors.border} ${colors.text}
          hover:scale-105 hover:shadow-xl
          ${nodeData.isHighlighted ? "ring-2 ring-green-500 ring-offset-2" : ""}
        `}
        style={{ minWidth: nodeData.isEndpoint ? "140px" : "120px" }}
      >
        <div className="flex items-center gap-2">
          {nodeData.imageUrl ? (
            <img
              src={nodeData.imageUrl}
              alt={nodeData.name}
              className={`rounded-full object-cover ${nodeData.isEndpoint ? "w-10 h-10" : "w-8 h-8"}`}
            />
          ) : (
            <div
              className={`rounded-full bg-muted/50 flex items-center justify-center ${
                nodeData.isEndpoint ? "w-10 h-10" : "w-8 h-8"
              }`}
            >
              <NodeIcon type={nodeData.type} className={nodeData.isEndpoint ? "w-5 h-5" : "w-4 h-4"} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${nodeData.isEndpoint ? "text-sm" : "text-xs"}`}>
              {nodeData.name}
            </p>
            {nodeData.type !== "person" && (
              <p className="text-[10px] text-muted-foreground capitalize">
                {nodeData.type}
              </p>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  );
}

const nodeTypes = {
  matrixNode: MatrixNodeComponent,
};

// ===== MAIN COMPONENT =====

export function NetworkGraphView({
  matrix,
  highlightedPath,
  onNodeClick,
  onClose,
}: NetworkGraphViewProps) {
  const highlightedNodeIds = useMemo(() => {
    if (!highlightedPath) return new Set<string>();
    return new Set(highlightedPath.nodes.map(n => n.id));
  }, [highlightedPath]);

  const highlightedEdgeKeys = useMemo(() => {
    if (!highlightedPath) return new Set<string>();
    return new Set(highlightedPath.edges.map(e => `${e.source}-${e.target}`));
  }, [highlightedPath]);

  // Convert to React Flow format
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    const centerX = 400;
    const centerY = 300;

    // Find recruiter and candidate nodes
    const recruiterNode = matrix.nodes.find(n => n.id === matrix.recruiterId);
    const candidateNode = matrix.nodes.find(n => n.id === matrix.candidateId);
    const otherNodes = matrix.nodes.filter(
      n => n.id !== matrix.recruiterId && n.id !== matrix.candidateId
    );

    // Place recruiter on left
    if (recruiterNode) {
      nodes.push({
        id: recruiterNode.id,
        type: "matrixNode",
        position: { x: centerX - 300, y: centerY },
        data: {
          ...recruiterNode,
          isHighlighted: highlightedNodeIds.has(recruiterNode.id),
          isEndpoint: true,
        } as unknown as Record<string, unknown>,
      });
    }

    // Place candidate on right
    if (candidateNode) {
      nodes.push({
        id: candidateNode.id,
        type: "matrixNode",
        position: { x: centerX + 300, y: centerY },
        data: {
          ...candidateNode,
          isHighlighted: highlightedNodeIds.has(candidateNode.id),
          isEndpoint: true,
        } as unknown as Record<string, unknown>,
      });
    }

    // Arrange other nodes in a circle
    const radius = 200;
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    otherNodes.forEach((node, index) => {
      const angle = angleStep * index - Math.PI / 2;
      nodes.push({
        id: node.id,
        type: "matrixNode",
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: {
          ...node,
          isHighlighted: highlightedNodeIds.has(node.id),
          isEndpoint: false,
        } as unknown as Record<string, unknown>,
      });
    });

    return nodes;
  }, [matrix, highlightedNodeIds]);

  const initialEdges = useMemo(() => {
    return matrix.edges.map((edge, index) => {
      const edgeKey = `${edge.source}-${edge.target}`;
      const isHighlighted = highlightedEdgeKeys.has(edgeKey);

      return {
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: isHighlighted,
        style: {
          stroke: isHighlighted
            ? "rgba(34, 197, 94, 0.8)"
            : edge.status === "verified"
              ? "rgba(59, 130, 246, 0.4)"
              : "rgba(255, 255, 255, 0.2)",
          strokeWidth: isHighlighted ? 3 : Math.max(1, edge.weight * 3),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? "rgba(34, 197, 94, 0.8)" : "rgba(255, 255, 255, 0.3)",
        },
      };
    });
  }, [matrix.edges, highlightedEdgeKeys]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const matrixNode = matrix.nodes.find(n => n.id === node.id);
      if (matrixNode && onNodeClick) {
        onNodeClick(matrixNode);
      }
    },
    [matrix.nodes, onNodeClick]
  );

  // Stats
  const stats = useMemo(() => {
    const personCount = matrix.nodes.filter(n => n.type === "person").length;
    const companyCount = matrix.nodes.filter(n => n.type === "company").length;
    const verifiedEdges = matrix.edges.filter(e => e.status === "verified").length;

    return { personCount, companyCount, verifiedEdges };
  }, [matrix]);

  return (
    <div className="relative w-full h-[600px] rounded-xl border border-border overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-background"
      >
        <Background color="rgba(255,255,255,0.03)" gap={25} />
        <Controls className="bg-card border-border" />
        <MiniMap
          className="bg-card border-border"
          nodeColor={(node) => {
            const data = node.data as unknown as MatrixNodeData;
            if (data.isEndpoint) return "hsl(var(--primary))";
            if (data.isHighlighted) return "rgb(34, 197, 94)";
            return "hsl(var(--muted))";
          }}
        />
      </ReactFlow>

      {/* Stats overlay */}
      <Card className="absolute top-4 right-4 w-64 bg-card/90 backdrop-blur">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Network Stats</CardTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Connection Degree</span>
              <Badge
                variant="outline"
                className={
                  matrix.connectionDegree === 1
                    ? "bg-green-500/10 text-green-600"
                    : matrix.connectionDegree === 2
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-yellow-500/10 text-yellow-600"
                }
              >
                {matrix.connectionDegree || "?"}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">People</span>
              <Badge variant="secondary">{stats.personCount}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Companies</span>
              <Badge variant="secondary">{stats.companyCount}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Verified Edges</span>
              <Badge className="bg-green-500/20 text-green-400">
                {stats.verifiedEdges}
              </Badge>
            </div>

            {matrix.paths.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Found {matrix.paths.length} path{matrix.paths.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 bg-card/90 backdrop-blur rounded-lg border border-border">
        <p className="text-xs font-medium mb-2">Legend</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>You/Candidate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500/50" />
            <span>Person</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500/50" />
            <span>Company</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkGraphView;

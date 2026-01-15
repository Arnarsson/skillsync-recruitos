"use client";

import { useCallback, useMemo } from "react";
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
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NetworkGraph, NetworkNode, NetworkEdge } from "@/lib/brightdata";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NetworkMapProps {
  graph: NetworkGraph;
  onNodeClick?: (node: NetworkNode) => void;
}

// Custom node component for the network
function CandidateNode({ data }: { data: NetworkNode }) {
  const isTarget = data.type === "target";
  const isMutual = data.type === "mutual";

  return (
    <div
      className={`
        px-3 py-2 rounded-lg border-2 shadow-lg transition-all cursor-pointer
        ${isTarget
          ? "bg-primary border-primary text-primary-foreground min-w-[160px]"
          : isMutual
            ? "bg-green-500/20 border-green-500/50 text-foreground min-w-[140px]"
            : "bg-card border-border text-foreground min-w-[120px]"
        }
        hover:scale-105 hover:shadow-xl
      `}
    >
      <div className="flex items-center gap-2">
        {data.image ? (
          <Avatar className={isTarget ? "h-10 w-10" : "h-8 w-8"}>
            <AvatarImage src={data.image} alt={data.name} />
            <AvatarFallback className="text-xs">{data.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className={`${isTarget ? "h-10 w-10" : "h-8 w-8"} rounded-full bg-muted flex items-center justify-center`}>
            <span className="text-xs font-medium">{data.name.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${isTarget ? "text-sm" : "text-xs"}`}>
            {data.name}
          </p>
          {data.company && (
            <p className={`text-muted-foreground truncate ${isTarget ? "text-xs" : "text-[10px]"}`}>
              {data.company}
            </p>
          )}
        </div>
        {isMutual && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/30 text-green-400">
            Mutual
          </Badge>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  candidate: CandidateNode,
};

export default function NetworkMap({ graph, onNodeClick }: NetworkMapProps) {
  // Convert our graph format to React Flow format
  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];
    const targetNode = graph.nodes.find(n => n.type === "target");

    // Place target in center
    if (targetNode) {
      nodes.push({
        id: targetNode.id,
        type: "candidate",
        position: { x: 400, y: 300 },
        data: { ...targetNode } as Record<string, unknown>,
      });
    }

    // Arrange other nodes in a circle around target
    const otherNodes = graph.nodes.filter(n => n.type !== "target");
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);
    const radius = 250;

    otherNodes.forEach((node, index) => {
      const angle = angleStep * index - Math.PI / 2;
      nodes.push({
        id: node.id,
        type: "candidate",
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        },
        data: { ...node } as Record<string, unknown>,
      });
    });

    return nodes;
  }, [graph.nodes]);

  const initialEdges = useMemo(() => {
    return graph.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: edge.type === "direct",
      style: {
        stroke: edge.type === "company"
          ? "rgba(139, 92, 246, 0.3)"  // Purple for company connections
          : edge.type === "mutual"
            ? "rgba(34, 197, 94, 0.5)"   // Green for mutual
            : "rgba(255, 255, 255, 0.2)", // White for direct
        strokeWidth: Math.max(1, edge.strength),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "rgba(255, 255, 255, 0.3)",
      },
    }));
  }, [graph.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const networkNode = graph.nodes.find(n => n.id === node.id);
      if (networkNode && onNodeClick) {
        onNodeClick(networkNode);
      }
    },
    [graph.nodes, onNodeClick]
  );

  // Calculate cluster stats
  const clusterStats = useMemo(() => {
    const stats = new Map<string, number>();
    graph.nodes.forEach(node => {
      if (node.company && node.type !== "target") {
        stats.set(node.company, (stats.get(node.company) || 0) + 1);
      }
    });
    return Array.from(stats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [graph.nodes]);

  const mutualCount = graph.nodes.filter(n => n.type === "mutual").length;

  return (
    <div className="relative w-full h-[500px] rounded-xl border border-border overflow-hidden bg-background">
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
        <Background color="rgba(255,255,255,0.05)" gap={20} />
        <Controls className="bg-card border-border" />
        <MiniMap
          className="bg-card border-border"
          nodeColor={(node) => {
            const data = node.data as unknown as NetworkNode;
            if (data.type === "target") return "hsl(var(--primary))";
            if (data.type === "mutual") return "rgb(34, 197, 94)";
            return "hsl(var(--muted))";
          }}
        />
      </ReactFlow>

      {/* Stats overlay */}
      <Card className="absolute top-4 right-4 w-64 bg-card/90 backdrop-blur">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3">Network Insights</h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Connections</span>
              <Badge variant="secondary">{graph.nodes.length - 1}</Badge>
            </div>

            {mutualCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Mutual Connections</span>
                <Badge className="bg-green-500/20 text-green-400">{mutualCount}</Badge>
              </div>
            )}

            {clusterStats.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Top Companies</p>
                <div className="space-y-1.5">
                  {clusterStats.map(([company, count]) => (
                    <div key={company} className="flex justify-between items-center">
                      <span className="text-xs truncate max-w-[150px]">{company}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Maximize2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Subject, Topic, Subtopic } from "@/lib/types/database";
import { getStatusColor } from "@/lib/types/database";

function buildTree(
  subject: Subject,
  topics: Topic[],
  subtopics: Subtopic[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Root node
  nodes.push({
    id: `subject-${subject.id}`,
    position: { x: 400, y: 50 },
    data: { label: `${subject.icon} ${subject.name}` },
    style: {
      background: `${subject.color}30`,
      border: `2px solid ${subject.color}`,
      borderRadius: "16px",
      padding: "12px 20px",
      fontSize: "16px",
      fontWeight: "bold",
      color: "#f0f0f0",
      minWidth: "140px",
      textAlign: "center" as const,
    },
  });

  // Topic nodes
  const topicSpacing = 250;
  const startX = -(topics.length * topicSpacing) / 2 + 400;

  topics.forEach((topic, i) => {
    const nodeId = `topic-${topic.id}`;
    const x = startX + i * topicSpacing;
    const statusColor = getStatusColor(topic.status);

    nodes.push({
      id: nodeId,
      position: { x, y: 200 },
      data: { label: topic.name },
      style: {
        background: `oklch(0.2 0.03 270)`,
        border: `2px solid ${statusColor}`,
        borderRadius: "12px",
        padding: "10px 16px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#e0e0e0",
        minWidth: "120px",
        textAlign: "center" as const,
        boxShadow: `0 0 12px ${statusColor}40`,
      },
    });

    edges.push({
      id: `e-subject-${topic.id}`,
      source: `subject-${subject.id}`,
      target: nodeId,
      style: { stroke: subject.color, strokeWidth: 2 },
      animated: topic.status === "learning",
    });

    // Subtopic nodes for this topic
    const topicSubtopics = subtopics.filter((st) => st.topic_id === topic.id);
    const subSpacing = 180;
    const subStartX = x - (topicSubtopics.length * subSpacing) / 2 + subSpacing / 2;

    topicSubtopics.forEach((st, j) => {
      const stNodeId = `subtopic-${st.id}`;
      nodes.push({
        id: stNodeId,
        position: { x: subStartX + j * subSpacing, y: 360 },
        data: { label: st.name },
        style: {
          background: `oklch(0.18 0.02 270)`,
          border: `1px solid oklch(0.3 0.04 270)`,
          borderRadius: "10px",
          padding: "8px 14px",
          fontSize: "11px",
          color: "#b0b0b0",
          minWidth: "100px",
          textAlign: "center" as const,
        },
      });

      edges.push({
        id: `e-${topic.id}-${st.id}`,
        source: nodeId,
        target: stNodeId,
        style: { stroke: "oklch(0.35 0.04 270)", strokeWidth: 1.5 },
      });
    });
  });

  return { nodes, edges };
}

export default function MindMapPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const supabase = createClient();
    const { data } = await supabase.from("subjects").select("*").order("name");
    setSubjects(data || []);
    if (data && data.length > 0) {
      setSelectedSubject(data[0].id);
      loadMindMap(data[0].id);
    }
    setLoading(false);
  }

  async function loadMindMap(subjectId: string) {
    const supabase = createClient();
    const subject = subjects.find((s) => s.id === subjectId) || (await supabase.from("subjects").select("*").eq("id", subjectId).single()).data;
    if (!subject) return;

    const [topicsRes, subtopicsRes] = await Promise.all([
      supabase.from("topics").select("*").eq("subject_id", subjectId),
      supabase.from("subtopics").select("*").in(
        "topic_id",
        (await supabase.from("topics").select("id").eq("subject_id", subjectId)).data?.map((t) => t.id) || []
      ),
    ]);

    const tree = buildTree(subject, topicsRes.data || [], subtopicsRes.data || []);
    setNodes(tree.nodes);
    setEdges(tree.edges);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            Mind Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual knowledge graph of your learning
          </p>
        </div>
        <Select
          value={selectedSubject}
          onValueChange={(v) => {
            if (v) {
              setSelectedSubject(v);
              loadMindMap(v);
            }
          }}
          items={subjects.map((s) => ({ value: s.id, label: `${s.icon} ${s.name}` }))}
        >
          <SelectTrigger className="w-[200px] rounded-xl bg-background/50">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.icon} {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
          Mastered
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(48, 96%, 53%)" }} />
          Revision Due
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(221, 83%, 53%)" }} />
          Learning
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(0, 0%, 60%)" }} />
          Not Started
        </div>
      </div>

      {/* Canvas */}
      <div className="h-[600px] glass-card rounded-2xl overflow-hidden">
        {subjects.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Create subjects and topics to see your mind map</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            minZoom={0.3}
            maxZoom={2}
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="oklch(0.25 0.03 270)" />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              style={{ background: "oklch(0.17 0.02 270)" }}
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

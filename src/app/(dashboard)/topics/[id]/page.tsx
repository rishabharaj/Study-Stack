"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Topic, Subtopic, StudySession, Revision, Note, Resource, SubtopicInsert, Difficulty, TopicStatus } from "@/lib/types/database";
import { getStatusLabel, getStatusColor, getDifficultyColor, getConfidenceEmoji } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Plus, Clock, Timer, Check, Circle, Layers, StickyNote, Link2, Edit, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/constants";
import { REVISION_INTERVALS } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtopicDialogOpen, setSubtopicDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newSubtopicName, setNewSubtopicName] = useState("");
  const [topicFormData, setTopicFormData] = useState({
    name: "",
    difficulty: "medium" as Difficulty,
    priority: 3,
    status: "not_started" as TopicStatus,
  });
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);
  const [subtopicEditName, setSubtopicEditName] = useState("");
  const [subtopicEditConfidence, setSubtopicEditConfidence] = useState(0);

  useEffect(() => {
    loadData();
  }, [topicId]);

  async function loadData() {
    const supabase = createClient();
    const [topicRes, subtopicsRes, sessionsRes, revisionsRes, notesRes, resourcesRes] = await Promise.all([
      supabase.from("topics").select("*, subjects(name)").eq("id", topicId).single(),
      supabase.from("subtopics").select("*").eq("topic_id", topicId).order("created_at"),
      supabase.from("study_sessions").select("*").eq("topic_id", topicId).order("start_time", { ascending: false }),
      supabase.from("revisions").select("*").eq("topic_id", topicId).order("revision_number"),
      supabase.from("notes").select("*").eq("topic_id", topicId).order("updated_at", { ascending: false }),
      supabase.from("resources").select("*").eq("topic_id", topicId).order("created_at", { ascending: false }),
    ]);

    if (topicRes.data) {
      setTopic(topicRes.data);
      setSubjectName((topicRes.data as unknown as { subjects: { name: string } }).subjects?.name || "");
      setTopicFormData({
        name: topicRes.data.name,
        difficulty: topicRes.data.difficulty as Difficulty,
        priority: topicRes.data.priority,
        status: topicRes.data.status as TopicStatus,
      });
    }
    setSubtopics(subtopicsRes.data || []);
    setSessions(sessionsRes.data || []);
    setRevisions(revisionsRes.data || []);
    setNotes(notesRes.data || []);
    setResources(resourcesRes.data || []);
    setTotalStudyTime(sessionsRes.data?.reduce((s, r) => s + r.duration_seconds, 0) || 0);
    setLoading(false);
  }

  async function handleUpdateTopic(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase
      .from("topics")
      .update(topicFormData)
      .eq("id", topicId);

    if (error) {
      toast.error("Failed to update topic: " + error.message);
    } else {
      toast.success("Topic updated!");
      setEditDialogOpen(false);
      loadData();
    }
  }

  async function handleDeleteTopic() {
    if (!confirm("Are you sure you want to delete this topic? All its subtopics, notes, revisions, and study sessions will be deleted.")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", topicId);

    if (error) {
      toast.error("Failed to delete topic: " + error.message);
    } else {
      toast.success("Topic deleted!");
      if (topic) {
        router.push(`/subjects/${topic.subject_id}`);
      } else {
        router.push("/subjects");
      }
    }
  }

  const getSubtopicStudyTime = (subtopicId: string) => {
    const subtopicSessions = sessions.filter((s) => s.subtopic_id === subtopicId);
    return subtopicSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  };

  async function handleUpdateSubtopic(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSubtopic) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("subtopics")
      .update({
        name: subtopicEditName,
        confidence_score: subtopicEditConfidence,
      })
      .eq("id", editingSubtopic.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Subtopic updated!");
      setEditingSubtopic(null);
      loadData();
    }
  }

  async function handleDeleteSubtopic(subtopicId: string) {
    if (!confirm("Are you sure you want to delete this subtopic?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("subtopics")
      .delete()
      .eq("id", subtopicId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Subtopic deleted!");
      loadData();
    }
  }

  async function handleAddSubtopic(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("subtopics").insert({
      topic_id: topicId,
      user_id: user.id,
      name: newSubtopicName,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Subtopic added!");
      setSubtopicDialogOpen(false);
      setNewSubtopicName("");
      loadData();
    }
  }

  async function handleCompleteRevision(revisionId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("revisions").update({
      completed_at: new Date().toISOString(),
      confidence_after: topic?.confidence_score || 5,
    }).eq("id", revisionId);

    if (error) toast.error(error.message);
    else {
      toast.success("Revision completed! 🎉");
      loadData();
    }
  }

  async function handleScheduleRevisions() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const baseDate = new Date();
    const revisionInserts = REVISION_INTERVALS.map((days, i) => {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + days);
      return {
        user_id: user.id,
        topic_id: topicId,
        revision_number: i + 1,
        due_date: dueDate.toISOString().split("T")[0],
      };
    });

    const { error } = await supabase.from("revisions").upsert(revisionInserts, {
      onConflict: "topic_id,revision_number",
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Revisions scheduled!");
      // Update topic status
      await supabase.from("topics").update({ status: "revision_due" }).eq("id", topicId);
      loadData();
    }
  }

  if (loading) return <div className="h-96 bg-muted rounded-2xl animate-shimmer" />;
  if (!topic) return <div className="text-center py-20 text-muted-foreground">Topic not found</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Topic Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{subjectName}</p>
            <h1 className="text-2xl font-bold">{topic.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="rounded-full text-xs" style={{ borderColor: getDifficultyColor(topic.difficulty), color: getDifficultyColor(topic.difficulty) }}>
                {topic.difficulty}
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs" style={{ borderColor: getStatusColor(topic.status), color: getStatusColor(topic.status) }}>
                {getStatusLabel(topic.status)}
              </Badge>
              <span className="text-sm">{getConfidenceEmoji(topic.confidence_score)} {topic.confidence_score}/10</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" className="rounded-xl gap-2 hover:bg-accent">
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                }
              />
              <DialogContent className="glass rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Topic</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateTopic} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Topic Name</Label>
                    <Input
                      placeholder="e.g. Arrays, Hooks, Docker Basics"
                      value={topicFormData.name}
                      onChange={(e) =>
                        setTopicFormData({ ...topicFormData, name: e.target.value })
                      }
                      className="rounded-xl bg-background/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={topicFormData.difficulty}
                        onValueChange={(v) =>
                          setTopicFormData({ ...topicFormData, difficulty: v as Difficulty })
                        }
                      >
                        <SelectTrigger className="rounded-xl bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">🟢 Easy</SelectItem>
                          <SelectItem value="medium">🟡 Medium</SelectItem>
                          <SelectItem value="hard">🔴 Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority (1-5)</Label>
                      <Select
                        value={String(topicFormData.priority || 3)}
                        onValueChange={(v) =>
                          setTopicFormData({ ...topicFormData, priority: Number(v) })
                        }
                      >
                        <SelectTrigger className="rounded-xl bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((p) => (
                            <SelectItem key={p} value={String(p)}>
                              {p} {p === 1 ? "(Low)" : p === 5 ? "(High)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={topicFormData.status}
                      onValueChange={(v) =>
                        setTopicFormData({ ...topicFormData, status: v as TopicStatus })
                      }
                    >
                      <SelectTrigger className="rounded-xl bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">⚪ Not Started</SelectItem>
                        <SelectItem value="learning">🔵 Learning</SelectItem>
                        <SelectItem value="revision_due">🟡 Revision Due</SelectItem>
                        <SelectItem value="mastered">🟢 Mastered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl gradient-primary text-white"
                  >
                    Save Changes
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="rounded-xl gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeleteTopic}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>

            <Button className="rounded-xl gradient-primary text-white gap-2" onClick={() => router.push(`/study?topicId=${topicId}&topicName=${encodeURIComponent(topic.name)}`)}>
              <Timer className="w-4 h-4" />
              Start Studying
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-3 rounded-xl bg-background/50 text-center">
            <p className="text-lg font-bold">{formatDuration(totalStudyTime)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Study Time</p>
          </div>
          <div className="p-3 rounded-xl bg-background/50 text-center">
            <p className="text-lg font-bold">{sessions.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Sessions</p>
          </div>
          <div className="p-3 rounded-xl bg-background/50 text-center">
            <p className="text-lg font-bold">{subtopics.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Subtopics</p>
          </div>
          <div className="p-3 rounded-xl bg-background/50 text-center">
            <p className="text-lg font-bold">{revisions.filter(r => r.completed_at).length}/{revisions.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Revisions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subtopics">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="subtopics" className="rounded-lg gap-1.5"><Layers className="w-3.5 h-3.5" /> Subtopics</TabsTrigger>
          <TabsTrigger value="revisions" className="rounded-lg gap-1.5"><Check className="w-3.5 h-3.5" /> Revisions</TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-lg gap-1.5"><Clock className="w-3.5 h-3.5" /> Sessions</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg gap-1.5"><StickyNote className="w-3.5 h-3.5" /> Notes</TabsTrigger>
          <TabsTrigger value="resources" className="rounded-lg gap-1.5"><Link2 className="w-3.5 h-3.5" /> Resources</TabsTrigger>
        </TabsList>

        {/* Subtopics */}
        <TabsContent value="subtopics" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={subtopicDialogOpen} onOpenChange={setSubtopicDialogOpen}>
              <DialogTrigger
                render={
                  <Button size="sm" variant="outline" className="rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> Add Subtopic
                  </Button>
                }
              />
              <DialogContent className="glass rounded-2xl max-w-sm">
                <DialogHeader><DialogTitle>Add Subtopic</DialogTitle></DialogHeader>
                <form onSubmit={handleAddSubtopic} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newSubtopicName} onChange={e => setNewSubtopicName(e.target.value)} className="rounded-xl bg-background/50" placeholder="e.g. Prefix Sum, useState" required />
                  </div>
                  <Button type="submit" className="w-full rounded-xl gradient-primary text-white">Add</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {subtopics.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl">
              <p className="text-muted-foreground text-sm">No subtopics yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subtopics.map(st => (
                <div key={st.id} className="flex items-center justify-between p-4 glass-card rounded-xl">
                  <div>
                    <p className="font-medium">{st.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {getConfidenceEmoji(st.confidence_score)} Confidence: {st.confidence_score}/10
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatDuration(getSubtopicStudyTime(st.id))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={st.confidence_score * 10} className="w-24 h-1.5 hidden md:block" />
                    
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingSubtopic(st);
                        setSubtopicEditName(st.name);
                        setSubtopicEditConfidence(st.confidence_score);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteSubtopic(st.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Subtopic Dialog */}
          <Dialog open={!!editingSubtopic} onOpenChange={(open) => { if (!open) setEditingSubtopic(null); }}>
            <DialogContent className="glass rounded-2xl max-w-sm">
              <DialogHeader><DialogTitle>Edit Subtopic</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateSubtopic} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={subtopicEditName}
                    onChange={e => setSubtopicEditName(e.target.value)}
                    className="rounded-xl bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>Confidence ({subtopicEditConfidence}/10)</Label>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getConfidenceEmoji(subtopicEditConfidence)}</span>
                    <Slider
                      value={[subtopicEditConfidence]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(v) => {
                        const val = Array.isArray(v) ? v[0] : v;
                        if (val !== undefined) setSubtopicEditConfidence(val);
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold w-8 text-right">{subtopicEditConfidence}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl gradient-primary text-white">Save Changes</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Revisions */}
        <TabsContent value="revisions" className="mt-4 space-y-4">
          {revisions.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl space-y-3">
              <p className="text-muted-foreground text-sm">No revisions scheduled</p>
              <Button onClick={handleScheduleRevisions} className="rounded-xl gradient-primary text-white gap-2">
                Schedule Revisions (Spaced Repetition)
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {revisions.map(rev => (
                <div key={rev.id} className="flex items-center justify-between p-4 glass-card rounded-xl">
                  <div className="flex items-center gap-3">
                    {rev.completed_at ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground/40" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Revision {rev.revision_number}</p>
                      <p className="text-xs text-muted-foreground">Due: {format(new Date(rev.due_date + "T00:00:00"), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  {!rev.completed_at && (
                    <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => handleCompleteRevision(rev.id)}>
                      Mark Complete
                    </Button>
                  )}
                  {rev.completed_at && (
                    <span className="text-xs text-green-400">Completed {format(new Date(rev.completed_at), "MMM d")}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="mt-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl">
              <p className="text-muted-foreground text-sm">No study sessions recorded</p>
            </div>
          ) : (
            sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 glass-card rounded-xl">
                <div>
                  <p className="font-medium text-sm">{format(new Date(s.start_time), "MMM d, yyyy 'at' h:mm a")}</p>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{formatDuration(s.duration_seconds)}</p>
                  <p className="text-xs text-muted-foreground">{getConfidenceEmoji(s.confidence_rating)} {s.confidence_rating}/10</p>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <div className="text-center py-12 glass-card rounded-2xl">
            <StickyNote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Notes can be managed from the Notes page</p>
            <Button variant="outline" className="mt-3 rounded-xl" onClick={() => router.push("/notes")}>Go to Notes</Button>
          </div>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="mt-4">
          {resources.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl">
              <Link2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No resources added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {resources.map(r => (
                <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 glass-card rounded-xl hover:bg-accent/50 transition-colors">
                  <Badge variant="outline" className="rounded-full text-xs">{r.type}</Badge>
                  <span className="text-sm font-medium">{r.title}</span>
                </a>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

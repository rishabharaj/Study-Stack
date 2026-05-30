"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Subject, Topic, TopicInsert } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowLeft, Clock, Layers, Edit, Trash2 } from "lucide-react";
import { SUBJECT_COLORS, SUBJECT_ICONS, formatDuration } from "@/lib/constants";
import {
  getStatusLabel,
  getStatusColor,
  getDifficultyColor,
  getConfidenceEmoji,
} from "@/lib/types/database";
import type { Difficulty, TopicStatus } from "@/lib/types/database";
import { toast } from "sonner";
import Link from "next/link";

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({
    name: "",
    description: "",
    icon: "📚",
    color: "#6366f1",
  });
  const [formData, setFormData] = useState<TopicInsert>({
    subject_id: subjectId,
    name: "",
    difficulty: "medium",
    priority: 3,
  });
  const [totalStudyTime, setTotalStudyTime] = useState(0);

  useEffect(() => {
    loadData();
  }, [subjectId]);

  async function loadData() {
    const supabase = createClient();

    const [subjectRes, topicsRes] = await Promise.all([
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase
        .from("topics")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false }),
    ]);

    if (subjectRes.data) {
      setSubject(subjectRes.data);
      setSubjectFormData({
        name: subjectRes.data.name,
        description: subjectRes.data.description || "",
        icon: subjectRes.data.icon,
        color: subjectRes.data.color,
      });
    }
    if (topicsRes.data) setTopics(topicsRes.data);

    // Get total study time
    const sessionsRes = await supabase
      .from("study_sessions")
      .select("duration_seconds")
      .in(
        "topic_id",
        (topicsRes.data || []).map((t) => t.id)
      );

    const total =
      sessionsRes.data?.reduce((s, r) => s + (r.duration_seconds || 0), 0) || 0;
    setTotalStudyTime(total);

    setLoading(false);
  }

  async function handleUpdateSubject(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase
      .from("subjects")
      .update(subjectFormData)
      .eq("id", subjectId);

    if (error) {
      toast.error("Failed to update subject: " + error.message);
    } else {
      toast.success("Subject updated!");
      setEditDialogOpen(false);
      loadData();
    }
  }

  async function handleDeleteSubject() {
    if (!confirm("Are you sure you want to delete this subject? All its topics, subtopics, notes, and study sessions will be deleted.")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId);

    if (error) {
      toast.error("Failed to delete subject: " + error.message);
    } else {
      toast.success("Subject deleted!");
      router.push("/subjects");
    }
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("topics").insert({
      ...formData,
      subject_id: subjectId,
      user_id: user.id,
    });

    if (error) {
      toast.error("Failed to create topic: " + error.message);
    } else {
      toast.success("Topic created!");
      setDialogOpen(false);
      setFormData({
        subject_id: subjectId,
        name: "",
        difficulty: "medium",
        priority: 3,
      });
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg animate-shimmer" />
        <div className="h-32 bg-muted rounded-2xl animate-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Subject not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/subjects")}>
          Back to Subjects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <button
        onClick={() => router.push("/subjects")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </button>

      {/* Subject Header Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              {subject.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              {subject.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subject.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 hover:bg-accent">
                    <Edit className="w-4 h-4" /> Edit
                  </Button>
                }
              />
              <DialogContent className="glass rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Subject</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateSubject} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. React, DSA, Machine Learning"
                      value={subjectFormData.name}
                      onChange={(e) =>
                        setSubjectFormData({ ...subjectFormData, name: e.target.value })
                      }
                      className="rounded-xl bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Brief description (optional)"
                      value={subjectFormData.description}
                      onChange={(e) =>
                        setSubjectFormData({ ...subjectFormData, description: e.target.value })
                      }
                      className="rounded-xl bg-background/50 resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECT_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-accent/80 transition-colors ${
                            subjectFormData.icon === icon
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "bg-background/50"
                          }`}
                          onClick={() => setSubjectFormData({ ...subjectFormData, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                            subjectFormData.color === color
                              ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSubjectFormData({ ...subjectFormData, color })}
                        />
                      ))}
                    </div>
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
              size="sm"
              className="rounded-xl gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeleteSubject}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
            <Layers className="w-5 h-5 text-primary" />
            <div>
              <p className="text-lg font-bold">{topics.length}</p>
              <p className="text-xs text-muted-foreground">Topics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
            <Clock className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-lg font-bold">{formatDuration(totalStudyTime)}</p>
              <p className="text-xs text-muted-foreground">Study Time</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: subject.color }} />
            <div>
              <p className="text-lg font-bold">
                {topics.filter((t) => t.status === "mastered").length}/{topics.length}
              </p>
              <p className="text-xs text-muted-foreground">Mastered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Topics</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button
                size="sm"
                className="rounded-xl gradient-primary gap-2 text-white"
              >
                <Plus className="w-4 h-4" />
                Add Topic
              </Button>
            }
          />
          <DialogContent className="glass rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Add Topic to {subject.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTopic} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Topic Name</Label>
                <Input
                  placeholder="e.g. Arrays, Hooks, Docker Basics"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-xl bg-background/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(v) =>
                      setFormData({ ...formData, difficulty: v as Difficulty })
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
                    value={String(formData.priority || 3)}
                    onValueChange={(v) =>
                      setFormData({ ...formData, priority: Number(v) })
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
              <Button
                type="submit"
                className="w-full rounded-xl gradient-primary text-white"
              >
                Create Topic
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No topics yet. Add your first topic!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="group glass-card rounded-2xl p-5 hover:scale-[1.01] transition-all duration-200 block animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {topic.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] rounded-full"
                      style={{
                        borderColor: getDifficultyColor(topic.difficulty),
                        color: getDifficultyColor(topic.difficulty),
                      }}
                    >
                      {topic.difficulty}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] rounded-full"
                      style={{
                        borderColor: getStatusColor(topic.status),
                        color: getStatusColor(topic.status),
                      }}
                    >
                      {getStatusLabel(topic.status)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm">
                    {getConfidenceEmoji(topic.confidence_score)}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {topic.confidence_score}/10
                  </p>
                </div>
              </div>

              <Progress
                value={topic.confidence_score * 10}
                className="h-1"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

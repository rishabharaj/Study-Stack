"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Note, Subject, Topic } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StickyNote, Plus, Search, Trash2, Save, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const [notes, setNotes] = useState<(Note & { topics?: { name: string; subjects?: { name: string; color: string } } })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newTopicId, setNewTopicId] = useState("");
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const [notesRes, subjectsRes] = await Promise.all([
      supabase.from("notes").select("*, topics(name, subjects(name, color))").order("updated_at", { ascending: false }),
      supabase.from("subjects").select("*").order("name"),
    ]);
    setNotes(notesRes.data || []);
    setSubjects(subjectsRes.data || []);
    setLoading(false);
  }

  async function loadTopicsForSubject(subjectId: string) {
    const supabase = createClient();
    const { data } = await supabase.from("topics").select("*").eq("subject_id", subjectId).order("name");
    setAvailableTopics(data || []);
  }

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("notes").insert({
      user_id: user.id,
      topic_id: newTopicId,
      title: newTitle,
      content: "",
    }).select().single();

    if (error) toast.error(error.message);
    else {
      toast.success("Note created!");
      setDialogOpen(false);
      setNewTitle("");
      setNewSubjectId("");
      setNewTopicId("");
      loadData();
      if (data) {
        setSelectedNote(data.id);
        setEditTitle(data.title);
        setEditContent(data.content);
        setViewMode("editor");
      }
    }
  }

  async function handleSaveNote() {
    if (!selectedNote) return;
    const supabase = createClient();
    const { error } = await supabase.from("notes").update({
      title: editTitle,
      content: editContent,
    }).eq("id", selectedNote);

    if (error) toast.error(error.message);
    else {
      toast.success("Saved!");
      loadData();
    }
  }

  async function handleDeleteNote(id: string) {
    const supabase = createClient();
    await supabase.from("notes").delete().eq("id", id);
    toast.success("Note deleted");
    if (selectedNote === id) {
      setSelectedNote(null);
      setEditTitle("");
      setEditContent("");
      setViewMode("list");
    }
    loadData();
  }

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNote = notes.find(n => n.id === selectedNote);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted rounded-lg animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          <div className="h-full bg-muted rounded-2xl animate-shimmer" />
          <div className="lg:col-span-2 h-full bg-muted rounded-2xl animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-primary" />
            Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{notes.length} notes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-xl gradient-primary gap-2 text-white">
                <Plus className="w-4 h-4" /> New Note
              </Button>
            }
          />
          <DialogContent className="glass rounded-2xl max-w-md">
            <DialogHeader><DialogTitle>Create Note</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateNote} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="rounded-xl bg-background/50" placeholder="Note title" required />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={newSubjectId}
                  onValueChange={v => { if (v) { setNewSubjectId(v); loadTopicsForSubject(v); } }}
                  items={subjects.map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }))}
                >
                  <SelectTrigger className="rounded-xl bg-background/50">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={newTopicId}
                  onValueChange={v => { if (v) setNewTopicId(v); }}
                  items={availableTopics.map(t => ({ value: t.id, label: t.name }))}
                >
                  <SelectTrigger className="rounded-xl bg-background/50">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full rounded-xl gradient-primary text-white">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Note List */}
        <div className={cn(
          "glass-card rounded-2xl p-4 space-y-3 overflow-y-auto h-full",
          viewMode === "editor" ? "hidden lg:block" : "block"
        )}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10 rounded-xl bg-background/50 h-9"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {notes.length === 0 ? "Create your first note" : "No matching notes"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note.id);
                    setEditTitle(note.title);
                    setEditContent(note.content);
                    setViewMode("editor");
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all block",
                    selectedNote === note.id ? "bg-primary/15 border border-primary/30" : "bg-background/50 hover:bg-accent/50"
                  )}
                >
                  <p className="font-medium text-sm truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.topics?.name} • {format(new Date(note.updated_at), "MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-2">
                    {note.content || "Empty note"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className={cn(
          "lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col h-full",
          viewMode === "list" ? "hidden lg:flex" : "flex"
        )}>
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center min-w-0 flex-1 mr-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="lg:hidden mr-2 p-1 h-9 w-9 rounded-xl shrink-0"
                    onClick={() => setViewMode("list")}
                    aria-label="Back to list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="text-lg font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 truncate"
                    placeholder="Note title"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 text-destructive" onClick={() => handleDeleteNote(selectedNote)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" className="rounded-xl gradient-primary text-white gap-1.5" onClick={handleSaveNote}>
                    <Save className="w-4 h-4" /> Save
                  </Button>
                </div>
              </div>
              {activeNote && (
                <p className="text-xs text-muted-foreground mb-4">
                  {activeNote.topics?.name} • Last edited {format(new Date(activeNote.updated_at), "MMM d, yyyy h:mm a")}
                </p>
              )}
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="Start writing... (supports markdown)"
                className="flex-1 bg-transparent border-none resize-none text-sm leading-relaxed focus-visible:ring-0 min-h-[300px]"
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a note or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

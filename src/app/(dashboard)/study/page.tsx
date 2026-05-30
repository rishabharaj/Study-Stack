"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTimerStore } from "@/lib/stores/timer-store";
import { formatTimerDisplay, POMODORO_PRESETS, REVISION_INTERVALS } from "@/lib/constants";
import type { Subject, Topic, Subtopic } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Square, RotateCcw, Timer, Coffee, Brain } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function StudyTimerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const store = useTimerStore();
  const { state, elapsed, mode, pomodoroPhase, pomodoroRound, focusDuration, breakDuration, purpose: storePurpose } = store;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedTopicName, setSelectedTopicName] = useState<string>("");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [selectedSubtopicName, setSelectedSubtopicName] = useState<string>("");
  const [sessionPurpose, setSessionPurpose] = useState<"study" | "revision">("study");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [confidenceRating, setConfidenceRating] = useState(5);
  const [showCreateSubtopicDialog, setShowCreateSubtopicDialog] = useState(false);
  const [newSubtopicName, setNewSubtopicName] = useState("");

  useEffect(() => {
    loadData();
    // Check URL params for pre-selected topic
    const topicId = searchParams.get("topicId");
    const topicName = searchParams.get("topicName");
    if (topicId && topicName) {
      setSelectedTopic(topicId);
      setSelectedTopicName(topicName);
      loadSubtopics(topicId);
    }
  }, [searchParams]);

  // Timer interval
  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        store.tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  // Browser notification for Pomodoro phase change
  useEffect(() => {
    if (mode === "pomodoro" && state === "running") {
      if (pomodoroPhase === "break") {
        if (Notification.permission === "granted") {
          new Notification("☕ Break Time!", { body: `Take a ${breakDuration} minute break` });
        }
        toast.info(`☕ Break time! ${breakDuration} minutes`);
      } else if (pomodoroRound > 1) {
        if (Notification.permission === "granted") {
          new Notification("🧠 Focus Time!", { body: `Round ${pomodoroRound} - Focus for ${focusDuration} minutes` });
        }
        toast.info(`🧠 Focus round ${pomodoroRound}!`);
      }
    }
  }, [pomodoroPhase, pomodoroRound]);

  async function loadData() {
    const supabase = createClient();
    const { data: subs } = await supabase.from("subjects").select("*").order("name");
    setSubjects(subs || []);
  }

  async function loadTopics(subjectId: string) {
    const supabase = createClient();
    const { data } = await supabase.from("topics").select("*").eq("subject_id", subjectId).order("name");
    setTopics(data || []);
    setSubtopics([]);
    setSelectedSubtopic("");
  }

  async function loadSubtopics(topicId: string) {
    const supabase = createClient();
    const { data } = await supabase.from("subtopics").select("*").eq("topic_id", topicId).order("name");
    setSubtopics(data || []);
    setSelectedSubtopic("");
  }

  async function handleCreateSubtopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtopicName.trim() || !selectedTopic) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("subtopics").insert({
      topic_id: selectedTopic,
      user_id: user.id,
      name: newSubtopicName.trim(),
      confidence_score: 0,
    }).select().single();

    if (error) {
      toast.error("Failed to create subtopic: " + error.message);
    } else {
      toast.success("Subtopic created! 🎉");
      
      const { data: latestSubtopics } = await supabase
        .from("subtopics")
        .select("*")
        .eq("topic_id", selectedTopic)
        .order("name");
        
      setSubtopics(latestSubtopics || []);
      
      if (data) {
        setSelectedSubtopic(data.id);
        setSelectedSubtopicName(data.name);
      }
      
      setNewSubtopicName("");
      setShowCreateSubtopicDialog(false);
    }
  }

  function handleStart() {
    if (!selectedTopic) {
      toast.error("Please select a topic first");
      return;
    }
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    store.start(selectedTopic, selectedTopicName, selectedSubtopic, selectedSubtopicName, sessionPurpose);
    toast.success(`📚 Studying: ${selectedTopicName}${selectedSubtopicName ? ` - ${selectedSubtopicName}` : ""}`);
  }

  function handleStop() {
    setShowCompleteDialog(true);
  }

  async function handleSaveSession() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const purposeValue = store.purpose || sessionPurpose;
    const targetTopicId = store.topicId!;

    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id,
      topic_id: targetTopicId,
      subtopic_id: store.subtopicId,
      start_time: store.sessionStartTime!,
      end_time: new Date().toISOString(),
      duration_seconds: elapsed,
      notes: sessionNotes || null,
      confidence_rating: confidenceRating,
      session_type: mode,
      purpose: purposeValue,
    });

    if (error) {
      toast.error("Failed to save session: " + error.message);
    } else {
      // Update topic confidence and last_studied_at
      await supabase.from("topics").update({
        confidence_score: confidenceRating,
        last_studied_at: new Date().toISOString(),
        status: "learning",
      }).eq("id", targetTopicId);

      // Handle Spaced Repetition Completion
      if (purposeValue === "revision") {
        const { data: pendingRevs } = await supabase
          .from("revisions")
          .select("id")
          .eq("topic_id", targetTopicId)
          .is("completed_at", null)
          .order("due_date", { ascending: true })
          .limit(1);

        if (pendingRevs && pendingRevs.length > 0) {
          const { error: revErr } = await supabase
            .from("revisions")
            .update({
              completed_at: new Date().toISOString(),
              confidence_after: confidenceRating,
            })
            .eq("id", pendingRevs[0].id);

          if (!revErr) {
            toast.success("Spaced repetition revision marked as complete! ✅");
          }
        }
      }

      // Check if revisions are scheduled. If not, auto-schedule them.
      const { count: revCount } = await supabase
        .from("revisions")
        .select("id", { count: "exact", head: true })
        .eq("topic_id", targetTopicId);

      if (revCount === 0) {
        const baseDate = new Date();
        const revisionInserts = REVISION_INTERVALS.map((days, i) => {
          const dueDate = new Date(baseDate);
          dueDate.setDate(dueDate.getDate() + days);
          return {
            user_id: user.id,
            topic_id: targetTopicId,
            revision_number: i + 1,
            due_date: dueDate.toISOString().split("T")[0],
          };
        });

        const { error: schedErr } = await supabase.from("revisions").upsert(revisionInserts, {
          onConflict: "topic_id,revision_number",
        });

        if (!schedErr) {
          await supabase.from("topics").update({ status: "revision_due" }).eq("id", targetTopicId);
          toast.success("Spaced repetition revisions scheduled for this topic! 📅");
        }
      }

      // Update streak
      const today = new Date().toISOString().split("T")[0];
      const { data: streak } = await supabase.from("study_streaks").select("*").eq("user_id", user.id).single();

      if (streak) {
        const lastDate = streak.last_study_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = streak.current_streak;
        if (lastDate === yesterdayStr) {
          newStreak += 1;
        } else if (lastDate !== today) {
          newStreak = 1;
        }

        await supabase.from("study_streaks").update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_study_date: today,
        }).eq("user_id", user.id);
      }

      toast.success("Session saved! 🎉");
    }

    store.stop();
    setShowCompleteDialog(false);
    setSessionNotes("");
    setConfidenceRating(5);
  }

  // Pomodoro progress percentage
  const pomodoroTotal = (pomodoroPhase === "focus" ? focusDuration : breakDuration) * 60;
  const pomodoroProgress = pomodoroTotal > 0 ? (elapsed / pomodoroTotal) * 100 : 0;

  // Circle timer dimensions
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = mode === "pomodoro"
    ? circumference - (pomodoroProgress / 100) * circumference
    : 0;

  const confidenceLabels = ["😰", "😟", "😕", "🤔", "😐", "🙂", "😊", "😄", "🤩", "🧠"];

  return (
    <div
      className="relative -mx-4 -my-4 md:-mx-6 md:-my-6 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url('/study-bg.png')` }}
    >
      {/* Dark cozy translucent glass overlay */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-0" />

      {/* Main Content constrained to viewport to prevent scrolling */}
      <div className="relative z-10 w-full max-w-xl px-4 py-5 flex flex-col justify-between h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] min-h-[350px] overflow-y-auto scrollbar-none">
        
        {/* Top: Mode Tabs */}
        <div className="flex justify-center shrink-0">
          <Tabs value={mode} onValueChange={(v) => store.setMode(v as "stopwatch" | "pomodoro")}>
            <TabsList className="bg-background/20 border border-white/10 backdrop-blur-md rounded-xl p-0.5">
              <TabsTrigger value="stopwatch" className="rounded-lg gap-2 text-xs py-1.5" disabled={state !== "idle"}>
                <Timer className="w-3.5 h-3.5" /> Stopwatch
              </TabsTrigger>
              <TabsTrigger value="pomodoro" className="rounded-lg gap-2 text-xs py-1.5" disabled={state !== "idle"}>
                <Brain className="w-3.5 h-3.5" /> Pomodoro
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pomodoro Presets */}
        {mode === "pomodoro" && state === "idle" && (
          <div className="flex justify-center gap-1.5 shrink-0 my-1">
            {POMODORO_PRESETS.filter(p => p.focus > 0).map(preset => (
              <Button
                key={preset.label}
                variant={focusDuration === preset.focus ? "default" : "outline"}
                size="sm"
                className="rounded-lg text-[9px] h-7 px-2.5 bg-background/25 border-white/10 text-white"
                onClick={() => store.setPomodoroConfig(preset.focus, preset.break)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}

        {/* Middle: Timer Circle */}
        <div className="flex-1 flex flex-col items-center justify-center my-2 min-h-0">
          <div className="relative w-[180px] h-[180px] sm:w-[240px] sm:h-[240px]">
            <svg viewBox="0 0 280 280" className="w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] transform -rotate-90">
              <circle
                cx={140} cy={140} r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={5}
              />
              {mode === "pomodoro" && (
                <circle
                  cx={140} cy={140} r={radius}
                  fill="none"
                  stroke={pomodoroPhase === "focus" ? "oklch(0.65 0.25 270)" : "oklch(0.7 0.2 150)"}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-1000"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {mode === "pomodoro" && (
                <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5">
                  {pomodoroPhase === "focus" ? (
                    <Brain className="w-3.5 h-3.5 text-primary animate-pulse" />
                  ) : (
                    <Coffee className="w-3.5 h-3.5 text-green-400" />
                  )}
                  <span className="text-[9px] sm:text-xs font-semibold text-white/70 uppercase">
                    {pomodoroPhase === "focus" ? `Focus (${pomodoroRound})` : "Break"}
                  </span>
                </div>
              )}
              <span className={cn(
                "text-3xl sm:text-5xl font-bold timer-display tracking-wider text-white",
                state === "running" && "text-primary animate-pulse-glow"
              )}>
                {formatTimerDisplay(elapsed)}
              </span>
              {state === "running" && store.topicName && (
                <div className="text-xs text-white/80 mt-1 sm:mt-1.5 max-w-[140px] sm:max-w-[200px] text-center">
                  <p className="truncate font-medium text-[9px] sm:text-xs">📚 {store.topicName}{store.subtopicName && ` • ${store.subtopicName}`}</p>
                  <span className="inline-block mt-0.5 font-semibold uppercase tracking-wider text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full bg-primary/30 text-white">
                    {storePurpose === "study" ? "📖 Study" : "🔄 Revision"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Topic Selector / Controls */}
        <div className="shrink-0 space-y-4">
          {state === "idle" && (
            <div className="bg-black/35 border border-white/5 backdrop-blur-md rounded-2xl p-3 sm:p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-white/50 pl-1">Subject</span>
                  <Select
                    value={selectedSubject}
                    onValueChange={(v) => { if (v) { setSelectedSubject(v); loadTopics(v); setSelectedTopic(""); setSelectedSubtopic(""); setSubtopics([]); } }}
                    items={subjects.map(s => ({ value: s.id, label: `${s.icon} ${s.name}` }))}
                  >
                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white text-xs h-9 w-full hover:bg-white/10">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-white/50 pl-1">Topic</span>
                  <Select
                    value={selectedTopic}
                    onValueChange={(v) => { if (v) { setSelectedTopic(v); setSelectedTopicName(topics.find(t => t.id === v)?.name || ""); loadSubtopics(v); } }}
                    items={topics.map(t => ({ value: t.id, label: t.name }))}
                  >
                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white text-xs h-9 w-full hover:bg-white/10">
                      <SelectValue placeholder="Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-white/50 pl-1">Subtopic (Optional)</span>
                  <Select
                    value={selectedSubtopic}
                    onValueChange={(v) => {
                      if (v === "create_new") {
                        setShowCreateSubtopicDialog(true);
                      } else {
                        setSelectedSubtopic(v || "");
                        setSelectedSubtopicName(subtopics.find(st => st.id === v)?.name || "");
                      }
                    }}
                    items={[
                      { value: "", label: "None" },
                      ...subtopics.map(st => ({ value: st.id, label: st.name })),
                      ...(selectedTopic ? [{ value: "create_new", label: "➕ Create New Subtopic..." }] : [])
                    ]}
                  >
                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white text-xs h-9 w-full hover:bg-white/10">
                      <SelectValue placeholder="Subtopic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {subtopics.map(st => (
                        <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                      ))}
                      {selectedTopic && (
                        <SelectItem value="create_new" className="text-primary font-medium hover:text-primary border-t border-white/5 mt-1">
                          ➕ Create New Subtopic...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-white/50 pl-1">Purpose</span>
                  <Select
                    value={sessionPurpose}
                    onValueChange={(v) => { if (v) setSessionPurpose(v as "study" | "revision"); }}
                    items={[{ value: "study", label: "Study" }, { value: "revision", label: "Revision" }]}
                  >
                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white text-xs h-9 w-full hover:bg-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">📖 Study Session</SelectItem>
                      <SelectItem value="revision">🔄 Revision Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
            {state === "idle" && (
              <Button size="lg" className="w-full sm:w-auto rounded-xl h-11 px-10 gradient-primary text-white gap-2 text-sm hover:opacity-90 hover:scale-102 transition-all shadow-md shadow-primary/20" onClick={handleStart}>
                <Play className="w-4 h-4" /> Start Study
              </Button>
            )}
            {state === "running" && (
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                <Button size="lg" variant="outline" className="flex-1 sm:flex-none rounded-xl h-11 px-8 gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 text-sm" onClick={() => store.pause()}>
                  <Pause className="w-4 h-4" /> Pause
                </Button>
                <Button size="lg" variant="destructive" className="flex-1 sm:flex-none rounded-xl h-11 px-8 gap-2 text-sm" onClick={handleStop}>
                  <Square className="w-4 h-4" /> Stop
                </Button>
              </div>
            )}
            {state === "paused" && (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center">
                <Button size="lg" className="flex-1 sm:flex-none rounded-xl h-11 px-8 gradient-primary text-white gap-2 text-sm" onClick={() => store.resume()}>
                  <Play className="w-4 h-4" /> Resume
                </Button>
                <Button size="lg" variant="destructive" className="flex-1 sm:flex-none rounded-xl h-11 px-8 gap-2 text-sm" onClick={handleStop}>
                  <Square className="w-4 h-4" /> Stop
                </Button>
                <Button size="lg" variant="ghost" className="rounded-xl h-11 px-4 text-white hover:bg-white/5 shrink-0" onClick={() => store.reset()}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="glass rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Session Complete! 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="text-center">
              <p className="text-3xl font-bold timer-display">{formatTimerDisplay(elapsed)}</p>
              <p className="text-sm text-muted-foreground mt-1">Total study time</p>
            </div>

            <div className="space-y-3">
              <Label>How confident do you feel? ({confidenceRating}/10)</Label>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{confidenceLabels[confidenceRating - 1]}</span>
                <Slider
                  value={[confidenceRating]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    if (val !== undefined) setConfidenceRating(val);
                  }}
                  className="flex-1"
                />
                <span className="text-sm font-bold w-8 text-right">{confidenceRating}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Notes (optional)</Label>
              <Textarea
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="What did you learn?"
                className="rounded-xl bg-background/50 resize-none"
                rows={3}
              />
            </div>

            <Button className="w-full rounded-xl gradient-primary text-white" onClick={handleSaveSession}>
              Save Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Subtopic Dialog */}
      <Dialog open={showCreateSubtopicDialog} onOpenChange={setShowCreateSubtopicDialog}>
        <DialogContent className="glass rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Subtopic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubtopic} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Subtopic Name</Label>
              <Input
                value={newSubtopicName}
                onChange={e => setNewSubtopicName(e.target.value)}
                placeholder="e.g. Array Rotations, Kadane's Algorithm"
                className="rounded-xl bg-background/50 text-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowCreateSubtopicDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xl gradient-primary text-white">
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="h-96 bg-muted rounded-2xl animate-shimmer" />}>
      <StudyTimerContent />
    </Suspense>
  );
}

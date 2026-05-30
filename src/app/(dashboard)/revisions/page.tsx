"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Revision } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Check, AlertTriangle, Calendar, Clock } from "lucide-react";
import { format, isToday, isPast, isTomorrow } from "date-fns";
import { toast } from "sonner";

interface RevisionWithTopic extends Revision {
  topics?: { name: string; subject_id: string; subjects?: { name: string; color: string } };
}

export default function RevisionsPage() {
  const [revisions, setRevisions] = useState<RevisionWithTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevisions();
  }, []);

  async function loadRevisions() {
    const supabase = createClient();
    const { data } = await supabase
      .from("revisions")
      .select("*, topics(name, subject_id, subjects(name, color))")
      .is("completed_at", null)
      .order("due_date", { ascending: true });
    setRevisions((data || []) as RevisionWithTopic[]);
    setLoading(false);
  }

  async function handleComplete(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("revisions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) toast.error(error.message);
    else {
      toast.success("Revision completed! ✅");
      // Send browser notification
      if (Notification.permission === "granted") {
        new Notification("✅ Revision Completed!", { body: "Great job keeping up with your revisions!" });
      }
      loadRevisions();
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const overdue = revisions.filter(r => r.due_date < today);
  const todayRevisions = revisions.filter(r => r.due_date === today);
  const upcoming = revisions.filter(r => r.due_date > today);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted rounded-lg animate-shimmer" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-2xl animate-shimmer" />
        ))}
      </div>
    );
  }

  function RevisionCard({ revision }: { revision: RevisionWithTopic }) {
    const dueDate = new Date(revision.due_date + "T00:00:00");
    const isOverdue = isPast(dueDate) && !isToday(dueDate);
    const isDueToday = isToday(dueDate);
    const isDueTomorrow = isTomorrow(dueDate);

    return (
      <div className={`flex items-center justify-between p-4 glass-card rounded-xl transition-all hover:scale-[1.01] ${
        isOverdue ? "border-red-500/30 bg-red-500/5" :
        isDueToday ? "border-amber-500/30 bg-amber-500/5" : ""
      }`}>
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-2 h-10 rounded-full shrink-0"
            style={{ backgroundColor: revision.topics?.subjects?.color || "#6366f1" }}
          />
          <div className="min-w-0">
            <p className="font-medium truncate max-w-[140px] sm:max-w-none">{revision.topics?.name || "Unknown"}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] rounded-full shrink-0">
                Rev {revision.revision_number}
              </Badge>
              <span className="text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-none">
                {revision.topics?.subjects?.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`text-sm font-medium ${
              isOverdue ? "text-red-400" :
              isDueToday ? "text-amber-400" :
              isDueTomorrow ? "text-blue-400" : "text-muted-foreground"
            }`}>
              {isOverdue ? "Overdue" : isDueToday ? "Today" : isDueTomorrow ? "Tomorrow" : format(dueDate, "MMM d")}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(dueDate, "EEE")}
            </p>
          </div>
          <Button size="sm" className="rounded-xl gradient-primary text-white gap-1.5" onClick={() => handleComplete(revision.id)}>
            <Check className="w-3.5 h-3.5" /> Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-primary" />
          Revisions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {revisions.length} pending revisions
          {overdue.length > 0 && <span className="text-red-400"> • {overdue.length} overdue</span>}
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="w-full overflow-x-auto scrollbar-none pb-1">
          <TabsList className="glass rounded-xl p-1 flex w-max min-w-full">
            <TabsTrigger value="all" className="rounded-lg gap-1.5">
              All <Badge variant="secondary" className="ml-1 rounded-full h-5 px-1.5 text-[10px]">{revisions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-lg gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Overdue
              {overdue.length > 0 && <Badge variant="destructive" className="ml-1 rounded-full h-5 px-1.5 text-[10px]">{overdue.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="today" className="rounded-lg gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Today
              {todayRevisions.length > 0 && <Badge className="ml-1 rounded-full h-5 px-1.5 text-[10px] bg-amber-500">{todayRevisions.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-lg gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Upcoming
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-4 space-y-2">
          {revisions.length === 0 ? (
            <EmptyState />
          ) : revisions.map(r => <RevisionCard key={r.id} revision={r} />)}
        </TabsContent>
        <TabsContent value="overdue" className="mt-4 space-y-2">
          {overdue.length === 0 ? <EmptyState message="No overdue revisions! 🎉" /> : overdue.map(r => <RevisionCard key={r.id} revision={r} />)}
        </TabsContent>
        <TabsContent value="today" className="mt-4 space-y-2">
          {todayRevisions.length === 0 ? <EmptyState message="No revisions due today" /> : todayRevisions.map(r => <RevisionCard key={r.id} revision={r} />)}
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4 space-y-2">
          {upcoming.length === 0 ? <EmptyState message="No upcoming revisions" /> : upcoming.map(r => <RevisionCard key={r.id} revision={r} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message = "No revisions pending" }: { message?: string }) {
  return (
    <div className="text-center py-16 glass-card rounded-2xl">
      <RefreshCw className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

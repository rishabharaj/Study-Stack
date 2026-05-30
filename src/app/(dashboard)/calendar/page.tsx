"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import type { StudySession, Revision, DailyPlan } from "@/lib/types/database";
import { toast } from "sonner";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  async function loadData() {
    const supabase = createClient();
    const start = startOfMonth(currentMonth).toISOString();
    const end = endOfMonth(currentMonth).toISOString();
    const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const [sessionsRes, revisionsRes, plansRes] = await Promise.all([
      supabase.from("study_sessions").select("*").gte("start_time", start).lte("start_time", end),
      supabase.from("revisions").select("*").gte("due_date", startDate).lte("due_date", endDate),
      supabase.from("daily_plans").select("*").gte("date", startDate).lte("date", endDate).order("created_at"),
    ]);

    setSessions(sessionsRes.data || []);
    setRevisions(revisionsRes.data || []);
    setPlans(plansRes.data || []);
    setLoading(false);
  }

  async function handleAddPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !newPlanTitle.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("daily_plans").insert({
      user_id: user.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      title: newPlanTitle.trim(),
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Plan added!");
      setNewPlanTitle("");
      loadData();
    }
  }

  async function togglePlanComplete(planId: string, completed: boolean) {
    const supabase = createClient();
    await supabase.from("daily_plans").update({ completed: !completed }).eq("id", planId);
    loadData();
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOffset = days[0].getDay();

  function getDayEvents(date: Date) {
    const dayStr = format(date, "yyyy-MM-dd");
    const daySessions = sessions.filter(s => format(new Date(s.start_time), "yyyy-MM-dd") === dayStr);
    const dayRevisions = revisions.filter(r => r.due_date === dayStr);
    const completedRevisions = dayRevisions.filter(r => r.completed_at);
    const pendingRevisions = dayRevisions.filter(r => !r.completed_at);
    return { daySessions, completedRevisions, pendingRevisions };
  }

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedPlans = plans.filter(p => p.date === selectedDateStr);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Study sessions, revisions, and daily plans
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const { daySessions, completedRevisions, pendingRevisions } = getDayEvents(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasEvents = daySessions.length > 0 || completedRevisions.length > 0 || pendingRevisions.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center gap-0.5 transition-all text-sm
                    ${isToday(day) ? "ring-2 ring-primary" : ""}
                    ${isSelected ? "bg-primary/20 text-primary font-bold" : "hover:bg-accent/50"}
                  `}
                >
                  <span>{format(day, "d")}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5">
                      {daySessions.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      {pendingRevisions.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      {completedRevisions.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" /> Sessions</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Revision Due</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400" /> Completed</div>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">
            {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}
          </h3>

          {selectedDate && (
            <>
              {/* Daily Planner */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Daily Plan</p>
                {selectedPlans.map(plan => (
                  <div key={plan.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                    <button onClick={() => togglePlanComplete(plan.id, plan.completed)}>
                      {plan.completed ? (
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </button>
                    <span className={`text-sm ${plan.completed ? "line-through text-muted-foreground" : ""}`}>
                      {plan.title}
                    </span>
                  </div>
                ))}

                <form onSubmit={handleAddPlan} className="flex gap-2">
                  <Input
                    value={newPlanTitle}
                    onChange={e => setNewPlanTitle(e.target.value)}
                    placeholder="Add plan..."
                    className="rounded-lg bg-background/50 text-sm h-9"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 rounded-lg shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              {/* Day Events */}
              {(() => {
                const { daySessions, completedRevisions, pendingRevisions } = getDayEvents(selectedDate);
                return (
                  <div className="space-y-2">
                    {daySessions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Sessions ({daySessions.length})</p>
                        {daySessions.map(s => (
                          <div key={s.id} className="text-xs p-2 rounded-lg bg-blue-500/10 mb-1">
                            {format(new Date(s.start_time), "h:mm a")} · {Math.round(s.duration_seconds / 60)}min
                          </div>
                        ))}
                      </div>
                    )}
                    {pendingRevisions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Pending Revisions</p>
                        {pendingRevisions.map(r => (
                          <div key={r.id} className="text-xs p-2 rounded-lg bg-amber-500/10 mb-1">
                            Revision {r.revision_number}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

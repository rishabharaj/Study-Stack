"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval } from "date-fns";
import { BarChart3, Clock, TrendingUp, Zap } from "lucide-react";
import { formatDuration } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const COLORS = ["#818cf8", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb7185", "#38bdf8", "#34d399"];

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<{ date: string; hours: number; minutes: number }[]>([]);
  const [subjectData, setSubjectData] = useState<{ name: string; hours: number; color: string }[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [avgSession, setAvgSession] = useState(0);
  const [longestSession, setLongestSession] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [revisionRate, setRevisionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    const supabase = createClient();

    // Get all sessions
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*, topics(name, subject_id, subjects(name, color))")
      .order("start_time", { ascending: false });

    if (!sessions || sessions.length === 0) {
      setLoading(false);
      return;
    }

    // Daily study hours (last 30 days)
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    const dailyMap = new Map<string, number>();
    last30Days.forEach(d => dailyMap.set(format(d, "yyyy-MM-dd"), 0));

    sessions.forEach(s => {
      const day = format(new Date(s.start_time), "yyyy-MM-dd");
      dailyMap.set(day, (dailyMap.get(day) || 0) + s.duration_seconds);
    });

    setDailyData(
      Array.from(dailyMap.entries()).map(([date, seconds]) => ({
        date: format(new Date(date), "MMM d"),
        hours: Math.round((seconds / 3600) * 100) / 100,
        minutes: Math.round(seconds / 60),
      }))
    );

    // Subject-wise data
    const subjectMap = new Map<string, { name: string; seconds: number; color: string }>();
    sessions.forEach((s: any) => {
      const subjectName = s.topics?.subjects?.name || "Unknown";
      const color = s.topics?.subjects?.color || "#6366f1";
      const existing = subjectMap.get(subjectName) || { name: subjectName, seconds: 0, color };
      existing.seconds += s.duration_seconds;
      subjectMap.set(subjectName, existing);
    });

    setSubjectData(
      Array.from(subjectMap.values()).map(s => ({
        name: s.name,
        hours: Math.round((s.seconds / 3600) * 100) / 100,
        color: s.color,
      }))
    );

    // Stats
    const totalSeconds = sessions.reduce((s, r) => s + r.duration_seconds, 0);
    setTotalHours(Math.round((totalSeconds / 3600) * 10) / 10);
    setTotalSessions(sessions.length);
    setAvgSession(Math.round(totalSeconds / sessions.length));
    setLongestSession(Math.max(...sessions.map(s => s.duration_seconds)));

    // Revision rate
    const { data: allRevisions } = await supabase.from("revisions").select("id, completed_at");
    if (allRevisions && allRevisions.length > 0) {
      const completed = allRevisions.filter(r => r.completed_at).length;
      setRevisionRate(Math.round((completed / allRevisions.length) * 100));
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-muted rounded-lg animate-shimmer" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-shimmer" />)}
        </div>
        <div className="h-80 bg-muted rounded-2xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insights into your study patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <Clock className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total Hours</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold">{formatDuration(avgSession)}</p>
          <p className="text-xs text-muted-foreground">Avg Session</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Zap className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-2xl font-bold">{formatDuration(longestSession)}</p>
          <p className="text-xs text-muted-foreground">Longest Session</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <BarChart3 className="w-5 h-5 text-violet-400 mb-2" />
          <p className="text-2xl font-bold">{revisionRate}%</p>
          <p className="text-xs text-muted-foreground">Revision Rate</p>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="daily">
        <TabsList className="glass rounded-xl p-1">
          <TabsTrigger value="daily" className="rounded-lg">Daily</TabsTrigger>
          <TabsTrigger value="subjects" className="rounded-lg">By Subject</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Study Hours (Last 30 Days)</h3>
            {dailyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No data yet. Start studying!</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 270)" />
                  <XAxis dataKey="date" tick={{ fill: "oklch(0.6 0.02 270)", fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "oklch(0.6 0.02 270)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.02 270)",
                      border: "1px solid oklch(0.28 0.04 270)",
                      borderRadius: "12px",
                      color: "#e0e0e0",
                    }}
                    formatter={(value: any) => [`${value}h`, "Study Time"]}
                  />
                  <Bar dataKey="hours" fill="oklch(0.65 0.25 270)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Study Time by Subject</h3>
            {subjectData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No data yet</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="hours"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {subjectData.map((entry, i) => (
                        <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.02 270)",
                        border: "1px solid oklch(0.28 0.04 270)",
                        borderRadius: "12px",
                        color: "#e0e0e0",
                      }}
                      formatter={(value: any) => [`${value}h`, "Hours"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex flex-col justify-center">
                  {subjectData.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <span className="text-sm font-bold">{s.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

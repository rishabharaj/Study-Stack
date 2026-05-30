// ============================================
// StudyStack Constants
// ============================================

// Spaced Repetition intervals (in days)
export const REVISION_INTERVALS = [1, 3, 7, 15, 30] as const;

// Revision labels
export const REVISION_LABELS = [
  "Revision 1 → 1 day",
  "Revision 2 → 3 days",
  "Revision 3 → 7 days",
  "Revision 4 → 15 days",
  "Revision 5 → 30 days",
] as const;

// Pomodoro presets
export const POMODORO_PRESETS = [
  { label: "25/5", focus: 25, break: 5 },
  { label: "50/10", focus: 50, break: 10 },
  { label: "Custom", focus: 0, break: 0 },
] as const;

// Subject default colors
export const SUBJECT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
] as const;

// Subject default icons (emojis)
export const SUBJECT_ICONS = [
  "📚", "💻", "🧮", "🔬", "🎨", "📐", "🌍", "🎵",
  "📊", "🧪", "📝", "🔧", "🎯", "🧠", "⚡", "🚀",
  "🔥", "💡", "🏗️", "🎓", "📖", "🔍", "✨", "🌟",
] as const;

// Navigation items
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Subjects", href: "/subjects", icon: "BookOpen" },
  { label: "Study Timer", href: "/study", icon: "Timer" },
  { label: "Revisions", href: "/revisions", icon: "RefreshCw" },
  { label: "Mind Map", href: "/mindmap", icon: "GitBranch" },
  { label: "Calendar", href: "/calendar", icon: "Calendar" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
  { label: "Notes", href: "/notes", icon: "StickyNote" },
] as const;

// Time formatting helpers
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

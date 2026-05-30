// ============================================
// StudyOS Database Types
// Matches the Supabase PostgreSQL schema
// ============================================

export type Difficulty = "easy" | "medium" | "hard";

export type TopicStatus =
  | "not_started"
  | "learning"
  | "revision_due"
  | "mastered";

export type SessionType = "focus" | "pomodoro";

export type ResourceType = "youtube" | "article" | "pdf" | "docs" | "course";

// ---- Subjects ----
export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectInsert {
  name: string;
  description?: string | null;
  icon?: string;
  color?: string;
}

export interface SubjectUpdate extends Partial<SubjectInsert> {}

// Computed fields (from joins / aggregations)
export interface SubjectWithStats extends Subject {
  topic_count: number;
  total_study_time: number; // in seconds
  progress: number; // 0-100
  revision_count: number;
  covered_count?: number;
}

// ---- Topics ----
export interface Topic {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  difficulty: Difficulty;
  status: TopicStatus;
  priority: number;
  confidence_score: number;
  created_at: string;
  last_studied_at: string | null;
  updated_at: string;
}

export interface TopicInsert {
  subject_id: string;
  name: string;
  difficulty?: Difficulty;
  priority?: number;
}

export interface TopicUpdate extends Partial<Omit<TopicInsert, "subject_id">> {
  status?: TopicStatus;
  confidence_score?: number;
}

export interface TopicWithStats extends Topic {
  subtopic_count: number;
  total_study_time: number;
  progress: number;
  revision_completed: number;
  revision_total: number;
  subject_name?: string;
  subject_color?: string;
}

// ---- Subtopics ----
export interface Subtopic {
  id: string;
  topic_id: string;
  user_id: string;
  name: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface SubtopicInsert {
  topic_id: string;
  name: string;
}

export interface SubtopicUpdate {
  name?: string;
  confidence_score?: number;
}

export interface SubtopicWithStats extends Subtopic {
  total_study_time: number;
  progress: number;
}

// ---- Study Sessions ----
export interface StudySession {
  id: string;
  user_id: string;
  topic_id: string;
  subtopic_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  notes: string | null;
  confidence_rating: number;
  session_type: SessionType;
  created_at: string;
}

export interface StudySessionInsert {
  topic_id: string;
  subtopic_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_seconds: number;
  notes?: string | null;
  confidence_rating?: number;
  session_type?: SessionType;
}

export interface StudySessionWithDetails extends StudySession {
  topic_name?: string;
  subtopic_name?: string;
  subject_name?: string;
  subject_color?: string;
}

// ---- Revisions ----
export interface Revision {
  id: string;
  user_id: string;
  topic_id: string;
  revision_number: number;
  due_date: string;
  completed_at: string | null;
  confidence_after: number | null;
  created_at: string;
}

export interface RevisionInsert {
  topic_id: string;
  revision_number: number;
  due_date: string;
}

export interface RevisionWithDetails extends Revision {
  topic_name?: string;
  subject_name?: string;
  subject_color?: string;
}

// ---- Notes ----
export interface Note {
  id: string;
  user_id: string;
  topic_id: string;
  subtopic_id: string | null;
  title: string;
  content: string; // stored as JSON string for rich text
  created_at: string;
  updated_at: string;
}

export interface NoteInsert {
  topic_id: string;
  subtopic_id?: string | null;
  title: string;
  content?: string;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
}

// ---- Resources ----
export interface Resource {
  id: string;
  user_id: string;
  topic_id: string;
  subtopic_id: string | null;
  title: string;
  url: string;
  type: ResourceType;
  created_at: string;
}

export interface ResourceInsert {
  topic_id: string;
  subtopic_id?: string | null;
  title: string;
  url: string;
  type?: ResourceType;
}

// ---- Daily Plans ----
export interface DailyPlan {
  id: string;
  user_id: string;
  date: string;
  subject_id: string | null;
  topic_id: string | null;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface DailyPlanInsert {
  date: string;
  title: string;
  subject_id?: string | null;
  topic_id?: string | null;
}

// ---- Study Streaks ----
export interface StudyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  updated_at: string;
}

// ---- Dashboard Stats ----
export interface DashboardStats {
  total_subjects: number;
  total_topics: number;
  total_subtopics: number;
  total_study_time: number; // seconds
  today_study_time: number; // seconds
  weekly_study_time: number; // seconds
  monthly_study_time: number; // seconds
  pending_revisions: number;
  overdue_revisions: number;
  current_streak: number;
  longest_streak: number;
  strong_topics: TopicWithStats[];
  weak_topics: TopicWithStats[];
  recent_sessions: StudySessionWithDetails[];
  upcoming_revisions: RevisionWithDetails[];
}

// ---- Confidence Classification ----
export type ConfidenceLevel = "strong" | "needs_revision" | "weak";

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 8) return "strong";
  if (score >= 5) return "needs_revision";
  return "weak";
}

export function getConfidenceColor(score: number): string {
  const level = getConfidenceLevel(score);
  switch (level) {
    case "strong":
      return "hsl(142, 76%, 36%)"; // green
    case "needs_revision":
      return "hsl(48, 96%, 53%)"; // yellow
    case "weak":
      return "hsl(0, 84%, 60%)"; // red
  }
}

export function getConfidenceEmoji(score: number): string {
  const level = getConfidenceLevel(score);
  switch (level) {
    case "strong":
      return "🟢";
    case "needs_revision":
      return "🟡";
    case "weak":
      return "🔴";
  }
}

export function getStatusColor(status: TopicStatus): string {
  switch (status) {
    case "mastered":
      return "hsl(142, 76%, 36%)";
    case "revision_due":
      return "hsl(48, 96%, 53%)";
    case "learning":
      return "hsl(221, 83%, 53%)";
    case "not_started":
      return "hsl(0, 0%, 60%)";
  }
}

export function getStatusLabel(status: TopicStatus): string {
  switch (status) {
    case "mastered":
      return "Mastered";
    case "revision_due":
      return "Revision Due";
    case "learning":
      return "Learning";
    case "not_started":
      return "Not Started";
  }
}

export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case "easy":
      return "hsl(142, 76%, 36%)";
    case "medium":
      return "hsl(48, 96%, 53%)";
    case "hard":
      return "hsl(0, 84%, 60%)";
  }
}

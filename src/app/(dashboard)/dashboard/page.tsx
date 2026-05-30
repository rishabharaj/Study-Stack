"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatDuration } from "@/lib/constants";
import type { DashboardStats, RevisionWithDetails, StudySessionWithDetails, TopicWithStats } from "@/lib/types/database";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeakTopics } from "@/components/dashboard/weak-topics";
import { StudyStreak } from "@/components/dashboard/study-streak";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { UpcomingRevisions } from "@/components/dashboard/upcoming-revisions";
import {
  BookOpen,
  Layers,
  Clock,
  AlertCircle,
  CalendarClock,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import { TOPIC_SUBTOPICS_MAP } from "@/lib/constants/subtopics";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function migrateAllSubjectTopics(userId: string) {
    const supabase = createClient();

    // 0. Rename old "Course Subjects" → "Core Subjects" and remove duplicates
    const { data: oldCourseSubjects } = await supabase
      .from("subjects")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("name", "Course Subjects")
      .order("created_at", { ascending: true });

    if (oldCourseSubjects && oldCourseSubjects.length > 0) {
      // Keep the first one (oldest), rename it
      const keepId = oldCourseSubjects[0].id;
      await supabase
        .from("subjects")
        .update({
          name: "Core Subjects",
          description: "Core computer science subjects (OOPs, DBMS, OS, CN, System Design)",
        })
        .eq("id", keepId);

      // Delete the rest (duplicates) — cascade will clean topics/subtopics
      const duplicateIds = oldCourseSubjects.slice(1).map(s => s.id);
      if (duplicateIds.length > 0) {
        await supabase.from("subjects").delete().in("id", duplicateIds);
      }
    }

    // 1. Ensure "Core Subjects" exists for the user (also deduplicate if multiple)
    const { data: coreSubjects } = await supabase
      .from("subjects")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("name", "Core Subjects")
      .order("created_at", { ascending: true });

    let courseSubjectData: { id: string } | null = null;

    if (coreSubjects && coreSubjects.length > 0) {
      courseSubjectData = { id: coreSubjects[0].id };
      // Delete any duplicates of "Core Subjects" too
      const dupeIds = coreSubjects.slice(1).map(s => s.id);
      if (dupeIds.length > 0) {
        await supabase.from("subjects").delete().in("id", dupeIds);
      }
    }

    if (!courseSubjectData) {
      const { data: newCourseSub, error: newCourseErr } = await supabase
        .from("subjects")
        .insert({
          user_id: userId,
          name: "Core Subjects",
          description: "Core computer science subjects (OOPs, DBMS, OS, CN, System Design)",
          icon: "🎓",
          color: "#ec4899",
        })
        .select("id")
        .single();
      
      if (!newCourseErr && newCourseSub) {
        courseSubjectData = newCourseSub;
      }
    }

    const subjectsToMigrate = [
      {
        name: "DSA",
        oldTopicNames: ["Arrays & Hashing", "Two Pointers", "Binary Search", "Trees"],
        newTopics: [
          { name: "Searching Algorithms", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Sorting Algorithms", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Introduction to Recursion", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Greedy Algorithms", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Graph Algorithms", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Dynamic Programming", difficulty: "hard" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Bitwise Algorithms", difficulty: "easy" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Segment Tree", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Binary Indexed Tree", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Trie Data Structure", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Square Root (Sqrt) Decomposition Algorithm", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 }
        ]
      },
      {
        name: "Web Development",
        oldTopicNames: ["HTML & CSS Basics", "React Hooks", "State Management (Zustand)", "API Integration"],
        newTopics: [
          { name: "HTML", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "CSS", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "JavaScript", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "TypeScript", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Git", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "GitHub", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "React", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Next.js", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Node.js", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Express.js", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "MongoDB", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "PostgreSQL", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Prisma", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "REST API", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "GraphQL", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Authentication", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Web Security", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Tailwind CSS", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Redux", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Zustand", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Docker", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Linux", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Nginx", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "AWS", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "CI/CD", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Testing", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "WebSockets", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "System Design", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "PWA", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Microservices", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Serverless", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "SEO", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Accessibility", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Performance Optimization", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "AI Integration", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 }
        ]
      },
      {
        name: "App Development",
        oldTopicNames: ["React Native Setup", "Flutter Layouts", "Push Notifications"],
        newTopics: [
          { name: "Programming Fundamentals", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Dart (Flutter) / Kotlin / Swift", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Git", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "GitHub", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Flutter", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "React Native", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Android Development", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "iOS Development", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "UI/UX Design", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Material Design", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Human Interface Guidelines (iOS)", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "State Management", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Navigation", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Animations", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Local Storage", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "SQLite", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Hive", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Shared Preferences", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "REST API", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "GraphQL", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Authentication", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Firebase", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Supabase", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Push Notifications", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Deep Linking", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Maps & Location Services", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Camera", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Media Handling", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Device Sensors", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Background Services", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Offline First Development", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Testing", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "App Security", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Performance Optimization", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "CI/CD", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Play Store Deployment", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "App Store Deployment", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Analytics", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Crash Reporting", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "In-App Purchases", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Subscriptions", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "WebSockets", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "AI Integration", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "System Design for Mobile Apps", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 }
        ]
      },
      {
        name: "Machine Learning",
        oldTopicNames: ["Python for Data Science", "Supervised Learning", "Neural Networks"],
        newTopics: [
          { name: "Python", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Mathematics", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Statistics", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Probability", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Linear Algebra", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Calculus", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Data Analysis", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "NumPy", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Pandas", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Data Visualization", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Data Cleaning", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Feature Engineering", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Exploratory Data Analysis (EDA)", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Machine Learning Fundamentals", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Supervised Learning", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Unsupervised Learning", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Regression", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Classification", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Clustering", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Model Evaluation", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Feature Selection", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Hyperparameter Tuning", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Scikit-Learn", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Deep Learning", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Neural Networks", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "TensorFlow", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "PyTorch", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Computer Vision", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Natural Language Processing (NLP)", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Time Series Analysis", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Reinforcement Learning", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "MLOps", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Model Deployment", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Cloud for ML", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Generative AI", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Large Language Models (LLMs)", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "Prompt Engineering", difficulty: "easy" as const, status: "not_started" as const, priority: 5, confidence_score: 0 },
          { name: "Fine-Tuning", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "RAG (Retrieval-Augmented Generation)", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "Vector Databases", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "AI Agents", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "AI System Design", difficulty: "hard" as const, status: "not_started" as const, priority: 3, confidence_score: 0 },
          { name: "ML Projects", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 }
        ]
      },
      {
        name: "Core Subjects",
        oldTopicNames: [],
        newTopics: [
          { name: "OOPs", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "DBMS", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "OS", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "CN", difficulty: "medium" as const, status: "not_started" as const, priority: 4, confidence_score: 0 },
          { name: "System Design", difficulty: "hard" as const, status: "not_started" as const, priority: 4, confidence_score: 0 }
        ]
      }
    ];

    for (const sub of subjectsToMigrate) {
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id")
        .eq("user_id", userId)
        .eq("name", sub.name)
        .maybeSingle();

      if (!subjectData) continue;

      const subjectId = subjectData.id;

      const { data: existingTopics } = await supabase
        .from("topics")
        .select("id, name")
        .eq("subject_id", subjectId);

      if (!existingTopics) continue;

      const existingNames = new Set(existingTopics.map(t => t.name));
      const missingTopics = sub.newTopics
        .filter(nt => !existingNames.has(nt.name))
        .map(nt => ({
          subject_id: subjectId,
          user_id: userId,
          ...nt
        }));

      if (missingTopics.length > 0) {
        await supabase.from("topics").insert(missingTopics);
      }

      const oldTopicsToClean = existingTopics.filter(t => sub.oldTopicNames.includes(t.name));

      for (const oldTopic of oldTopicsToClean) {
        const { count: sessionCount } = await supabase
          .from("study_sessions")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", oldTopic.id);

        const { count: notesCount } = await supabase
          .from("notes")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", oldTopic.id);

        const { count: revisionCount } = await supabase
          .from("revisions")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", oldTopic.id)
          .not("completed_at", "is", null);

        if ((sessionCount || 0) === 0 && (notesCount || 0) === 0 && (revisionCount || 0) === 0) {
          await supabase.from("topics").delete().eq("id", oldTopic.id);
        }
      }
    }

    // Check all user topics. If a topic has 0 subtopics, seed its default subtopics.
    const { data: allUserTopics, error: allTopicsErr } = await supabase
      .from("topics")
      .select("id, name, subject_id, subjects(name)")
      .eq("user_id", userId);

    if (!allTopicsErr && allUserTopics) {
      const subtopicsToInsert: any[] = [];
      
      for (const topic of allUserTopics) {
        const { count: subtopicCount, error: subtopicsErr } = await supabase
          .from("subtopics")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", topic.id);

        if (!subtopicsErr && (subtopicCount || 0) === 0) {
          const subjectName = (topic as any).subjects?.name;
          if (subjectName) {
            const subtopicNames = TOPIC_SUBTOPICS_MAP[subjectName]?.[topic.name];
            if (subtopicNames) {
              for (const name of subtopicNames) {
                subtopicsToInsert.push({
                  topic_id: topic.id,
                  user_id: userId,
                  name: name,
                });
              }
            }
          }
        }
      }

      if (subtopicsToInsert.length > 0) {
        await supabase.from("subtopics").insert(subtopicsToInsert);
      }
    }

    localStorage.setItem("subject_topics_migrated_v5", "true");
  }

  async function loadDashboardStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (typeof window !== "undefined" && localStorage.getItem("subject_topics_migrated_v5") !== "true") {
      await migrateAllSubjectTopics(user.id);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all data in parallel
    const [
      subjectsRes,
      topicsRes,
      subtopicsRes,
      allSessionsRes,
      todaySessionsRes,
      weekSessionsRes,
      monthSessionsRes,
      pendingRevisionsRes,
      overdueRevisionsRes,
      streakRes,
      recentSessionsRes,
      upcomingRevisionsRes,
      weakTopicsRes,
      strongTopicsRes,
    ] = await Promise.all([
      supabase.from("subjects").select("id", { count: "exact" }),
      supabase.from("topics").select("id", { count: "exact" }),
      supabase.from("subtopics").select("id", { count: "exact" }),
      supabase.from("study_sessions").select("duration_seconds"),
      supabase.from("study_sessions").select("duration_seconds").gte("start_time", todayStart),
      supabase.from("study_sessions").select("duration_seconds").gte("start_time", weekStart),
      supabase.from("study_sessions").select("duration_seconds").gte("start_time", monthStart),
      supabase.from("revisions").select("id", { count: "exact" }).is("completed_at", null).gte("due_date", now.toISOString().split("T")[0]),
      supabase.from("revisions").select("id", { count: "exact" }).is("completed_at", null).lt("due_date", now.toISOString().split("T")[0]),
      supabase.from("study_streaks").select("*").single(),
      supabase.from("study_sessions").select("*, topics(name, subject_id, subjects(name, color))").order("start_time", { ascending: false }).limit(5),
      supabase.from("revisions").select("*, topics(name, subject_id, subjects(name, color))").is("completed_at", null).order("due_date", { ascending: true }).limit(5),
      supabase.from("topics").select("*, subjects(name, color)").lt("confidence_score", 5).order("confidence_score", { ascending: true }).limit(5),
      supabase.from("topics").select("*, subjects(name, color)").gte("confidence_score", 8).order("confidence_score", { ascending: false }).limit(5),
    ]);

    if (!subjectsRes.count || subjectsRes.count === 0) {
      const defaultSubjects = [
        {
          user_id: user.id,
          name: "DSA",
          description: "Data Structures & Algorithms",
          icon: "💻",
          color: "#3b82f6",
        },
        {
          user_id: user.id,
          name: "Web Development",
          description: "Full-stack web application development",
          icon: "🌐",
          color: "#10b981",
        },
        {
          user_id: user.id,
          name: "App Development",
          description: "Mobile application development (iOS/Android)",
          icon: "📱",
          color: "#f59e0b",
        },
        {
          user_id: user.id,
          name: "Machine Learning",
          description: "AI, data science, and neural networks",
          icon: "🧠",
          color: "#8b5cf6",
        },
        {
          user_id: user.id,
          name: "Core Subjects",
          description: "Core computer science subjects (OOPs, DBMS, OS, CN, System Design)",
          icon: "🎓",
          color: "#ec4899",
        },
      ];

      const { data: seededSubjects, error: seedError } = await supabase
        .from("subjects")
        .insert(defaultSubjects)
        .select();

      if (!seedError && seededSubjects) {
        const topicInserts: any[] = [];
        const dsaSubject = seededSubjects.find(s => s.name === "DSA");
        const webSubject = seededSubjects.find(s => s.name === "Web Development");
        const appSubject = seededSubjects.find(s => s.name === "App Development");
        const mlSubject = seededSubjects.find(s => s.name === "Machine Learning");
        const courseSubject = seededSubjects.find(s => s.name === "Core Subjects");

        if (dsaSubject) {
          topicInserts.push(
            { subject_id: dsaSubject.id, user_id: user.id, name: "Searching Algorithms", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Sorting Algorithms", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Introduction to Recursion", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Greedy Algorithms", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Graph Algorithms", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Dynamic Programming", difficulty: "hard", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Bitwise Algorithms", difficulty: "easy", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Segment Tree", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Binary Indexed Tree", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Trie Data Structure", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: dsaSubject.id, user_id: user.id, name: "Square Root (Sqrt) Decomposition Algorithm", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 }
          );
        }

        if (webSubject) {
          topicInserts.push(
            { subject_id: webSubject.id, user_id: user.id, name: "HTML", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "CSS", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "JavaScript", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "TypeScript", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Git", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "GitHub", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "React", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Next.js", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Node.js", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Express.js", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "MongoDB", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "PostgreSQL", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Prisma", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "REST API", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "GraphQL", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Authentication", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Web Security", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Tailwind CSS", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Redux", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Zustand", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Docker", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Linux", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Nginx", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "AWS", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "CI/CD", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Testing", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "WebSockets", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "System Design", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "PWA", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Microservices", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Serverless", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "SEO", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Accessibility", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "Performance Optimization", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: webSubject.id, user_id: user.id, name: "AI Integration", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 }
          );
        }

        if (appSubject) {
          topicInserts.push(
            { subject_id: appSubject.id, user_id: user.id, name: "Programming Fundamentals", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Dart (Flutter) / Kotlin / Swift", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Git", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "GitHub", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Flutter", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "React Native", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Android Development", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "iOS Development", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "UI/UX Design", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Material Design", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Human Interface Guidelines (iOS)", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "State Management", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Navigation", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Animations", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Local Storage", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "SQLite", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Hive", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Shared Preferences", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "REST API", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "GraphQL", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Authentication", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Firebase", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Supabase", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Push Notifications", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Deep Linking", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Maps & Location Services", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Camera", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Media Handling", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Device Sensors", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Background Services", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Offline First Development", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Testing", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "App Security", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Performance Optimization", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "CI/CD", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Play Store Deployment", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "App Store Deployment", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Analytics", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Crash Reporting", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "In-App Purchases", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "Subscriptions", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "WebSockets", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "AI Integration", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: appSubject.id, user_id: user.id, name: "System Design for Mobile Apps", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 }
          );
        }

        if (mlSubject) {
          topicInserts.push(
            { subject_id: mlSubject.id, user_id: user.id, name: "Python", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Mathematics", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Statistics", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Probability", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Linear Algebra", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Calculus", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Data Analysis", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "NumPy", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Pandas", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Data Visualization", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Data Cleaning", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Feature Engineering", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Exploratory Data Analysis (EDA)", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Machine Learning Fundamentals", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Supervised Learning", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Unsupervised Learning", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Regression", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Classification", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Clustering", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Model Evaluation", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Feature Selection", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Hyperparameter Tuning", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Scikit-Learn", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Deep Learning", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Neural Networks", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "TensorFlow", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "PyTorch", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Computer Vision", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Natural Language Processing (NLP)", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Time Series Analysis", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Reinforcement Learning", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "MLOps", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Model Deployment", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Cloud for ML", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Generative AI", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Large Language Models (LLMs)", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Prompt Engineering", difficulty: "easy", status: "not_started", priority: 5, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Fine-Tuning", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "RAG (Retrieval-Augmented Generation)", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "Vector Databases", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "AI Agents", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "AI System Design", difficulty: "hard", status: "not_started", priority: 3, confidence_score: 0 },
            { subject_id: mlSubject.id, user_id: user.id, name: "ML Projects", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 }
          );
        }

        if (courseSubject) {
          topicInserts.push(
            { subject_id: courseSubject.id, user_id: user.id, name: "OOPs", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: courseSubject.id, user_id: user.id, name: "DBMS", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: courseSubject.id, user_id: user.id, name: "OS", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: courseSubject.id, user_id: user.id, name: "CN", difficulty: "medium", status: "not_started", priority: 4, confidence_score: 0 },
            { subject_id: courseSubject.id, user_id: user.id, name: "System Design", difficulty: "hard", status: "not_started", priority: 4, confidence_score: 0 }
          );
        }

        if (topicInserts.length > 0) {
          const { data: seededTopics, error: topicsError } = await supabase
            .from("topics")
            .insert(topicInserts)
            .select("id, name, subject_id, subjects(name)");

          if (!topicsError && seededTopics) {
            const subtopicsToInsert: any[] = [];
            for (const topic of seededTopics) {
              const subjectName = (topic as any).subjects?.name;
              if (!subjectName) continue;
              
              const subtopicNames = TOPIC_SUBTOPICS_MAP[subjectName]?.[topic.name];
              if (subtopicNames) {
                for (const name of subtopicNames) {
                  subtopicsToInsert.push({
                    topic_id: topic.id,
                    user_id: user.id,
                    name: name,
                  });
                }
              }
            }

            if (subtopicsToInsert.length > 0) {
              await supabase.from("subtopics").insert(subtopicsToInsert);
            }
          }
        }

        loadDashboardStats();
        return;
      }
    }

    const sumDuration = (data: { duration_seconds: number }[] | null) =>
      data?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;

    setStats({
      total_subjects: subjectsRes.count || 0,
      total_topics: topicsRes.count || 0,
      total_subtopics: subtopicsRes.count || 0,
      total_study_time: sumDuration(allSessionsRes.data),
      today_study_time: sumDuration(todaySessionsRes.data),
      weekly_study_time: sumDuration(weekSessionsRes.data),
      monthly_study_time: sumDuration(monthSessionsRes.data),
      pending_revisions: (pendingRevisionsRes.count || 0) + (overdueRevisionsRes.count || 0),
      overdue_revisions: overdueRevisionsRes.count || 0,
      current_streak: streakRes.data?.current_streak || 0,
      longest_streak: streakRes.data?.longest_streak || 0,
      strong_topics: (strongTopicsRes.data || []) as unknown as TopicWithStats[],
      weak_topics: (weakTopicsRes.data || []) as unknown as TopicWithStats[],
      recent_sessions: (recentSessionsRes.data || []) as unknown as StudySessionWithDetails[],
      upcoming_revisions: (upcomingRevisionsRes.data || []) as unknown as RevisionWithDetails[],
    });

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg animate-shimmer" />
          <div className="h-4 w-64 bg-muted rounded-lg animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back! <span className="animate-float inline-block">👋</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your learning journey
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Subjects"
          value={stats?.total_subjects || 0}
          icon={BookOpen}
          color="hsl(265, 89%, 63%)"
          delay={0}
        />
        <StatCard
          title="Topics"
          value={stats?.total_topics || 0}
          icon={Layers}
          color="hsl(221, 83%, 53%)"
          delay={100}
        />
        <StatCard
          title="Total Study Time"
          value={formatDuration(stats?.total_study_time || 0)}
          icon={Clock}
          color="hsl(142, 76%, 36%)"
          delay={200}
          isTime
        />
        <StatCard
          title="Pending Revisions"
          value={stats?.pending_revisions || 0}
          icon={AlertCircle}
          color={
            (stats?.overdue_revisions || 0) > 0
              ? "hsl(0, 84%, 60%)"
              : "hsl(48, 96%, 53%)"
          }
          delay={300}
          subtitle={
            (stats?.overdue_revisions || 0) > 0
              ? `${stats?.overdue_revisions} overdue`
              : undefined
          }
        />
      </div>

      {/* Time Stats + Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today"
          value={formatDuration(stats?.today_study_time || 0)}
          icon={Target}
          color="hsl(265, 89%, 63%)"
          delay={400}
          isTime
        />
        <StatCard
          title="This Week"
          value={formatDuration(stats?.weekly_study_time || 0)}
          icon={CalendarClock}
          color="hsl(200, 89%, 48%)"
          delay={500}
          isTime
        />
        <StatCard
          title="This Month"
          value={formatDuration(stats?.monthly_study_time || 0)}
          icon={TrendingUp}
          color="hsl(330, 81%, 60%)"
          delay={600}
          isTime
        />
        <StudyStreak
          currentStreak={stats?.current_streak || 0}
          longestStreak={stats?.longest_streak || 0}
          delay={700}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSessions sessions={stats?.recent_sessions || []} />
        <UpcomingRevisions revisions={stats?.upcoming_revisions || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakTopics topics={stats?.weak_topics || []} />
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            🟢 Strong Topics
          </h3>
          {(stats?.strong_topics?.length || 0) === 0 ? (
            <p className="text-muted-foreground text-sm">
              Complete study sessions and rate your confidence to see strong topics here.
            </p>
          ) : (
            <div className="space-y-3">
              {stats?.strong_topics.map((topic) => (
                <div key={topic.id} className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div>
                    <p className="font-medium text-sm">{topic.name}</p>
                    <p className="text-xs text-muted-foreground">{(topic as unknown as { subjects: { name: string } }).subjects?.name}</p>
                  </div>
                  <span className="text-green-400 font-bold text-sm">
                    {topic.confidence_score}/10
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

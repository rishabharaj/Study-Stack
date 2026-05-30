"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { SubjectWithStats, SubjectInsert } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, BookOpen } from "lucide-react";
import { SUBJECT_COLORS, SUBJECT_ICONS, formatDuration } from "@/lib/constants";
import { toast } from "sonner";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { TOPIC_SUBTOPICS_MAP } from "@/lib/constants/subtopics";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SubjectInsert>({
    name: "",
    description: "",
    icon: "📚",
    color: "#6366f1",
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const supabase = createClient();
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!subjectsData) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    if (subjectsData.length === 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

          loadSubjects();
          return;
        }
      }
    }

    // Get stats for each subject
    const enriched = await Promise.all(
      subjectsData.map(async (subject) => {
        const [topicsRes, coveredTopicsRes, sessionsRes, revisionsRes] = await Promise.all([
          supabase
            .from("topics")
            .select("id", { count: "exact" })
            .eq("subject_id", subject.id),
          supabase
            .from("topics")
            .select("id", { count: "exact" })
            .eq("subject_id", subject.id)
            .neq("status", "not_started"),
          supabase
            .from("study_sessions")
            .select("duration_seconds, topics!inner(subject_id)")
            .eq("topics.subject_id", subject.id),
          supabase
            .from("revisions")
            .select("id", { count: "exact" })
            .eq("topics.subject_id", subject.id),
        ]);

        const totalStudyTime =
          (sessionsRes.data as unknown as { duration_seconds: number }[])?.reduce(
            (sum, s) => sum + (s.duration_seconds || 0),
            0
          ) || 0;

        const totalTopics = topicsRes.count || 0;
        const coveredTopics = coveredTopicsRes.count || 0;
        const progress = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

        return {
          ...subject,
          topic_count: totalTopics,
          covered_count: coveredTopics,
          total_study_time: totalStudyTime,
          progress: progress,
          revision_count: revisionsRes.count || 0,
        } as SubjectWithStats;
      })
    );

    setSubjects(enriched);
    setLoading(false);
  }

  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("subjects").insert({
      ...formData,
      user_id: user.id,
    });

    if (error) {
      toast.error("Failed to create subject: " + error.message);
    } else {
      toast.success("Subject created!");
      setDialogOpen(false);
      setFormData({ name: "", description: "", icon: "📚", color: "#6366f1" });
      loadSubjects();
    }
  }

  async function handleDeleteSubject(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Subject deleted");
      loadSubjects();
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-muted rounded-lg animate-shimmer" />
          <div className="h-10 w-36 bg-muted rounded-xl animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-sm text-muted-foreground">{subjects.length} subjects</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-xl gradient-primary gap-2 text-white hover:opacity-90">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>
            }
          />
          <DialogContent className="glass rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubject} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. React, DSA, Machine Learning"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-xl bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description (optional)"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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
                        formData.icon === icon
                          ? "bg-primary/20 ring-2 ring-primary"
                          : "bg-background/50"
                      }`}
                      onClick={() => setFormData({ ...formData, icon })}
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
                        formData.color === color
                          ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl gradient-primary text-white"
              >
                Create Subject
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subject Grid */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No subjects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first subject to start tracking your learning
          </p>
          <Button
            className="rounded-xl gradient-primary gap-2 text-white"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, i) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="group glass-card rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl animate-fade-in block"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Color bar */}
              <div
                className="h-1 w-12 rounded-full mb-4 group-hover:w-20 transition-all duration-300"
                style={{ backgroundColor: subject.color }}
              />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{subject.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {subject.name}
                    </h3>
                    {subject.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="text-center">
                  <p className="text-base font-bold">{subject.covered_count || 0}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Covered</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold">{subject.topic_count}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Topics</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold">
                    {formatDuration(subject.total_study_time)}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase">Study Time</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold">{subject.revision_count}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">Revisions</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{subject.progress}%</span>
                </div>
                <Progress value={subject.progress} className="h-1.5" />
              </div>

              {/* Delete button (stop propagation) */}
              <div className="mt-3 flex justify-end">
                <button
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm("Delete this subject and all its topics?")) {
                      handleDeleteSubject(subject.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

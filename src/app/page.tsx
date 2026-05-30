import Link from "next/link";
import {
  GraduationCap,
  Timer,
  Brain,
  BarChart3,
  GitBranch,
  Calendar,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Timer,
    title: "Study Timer",
    description: "Track study sessions with stopwatch & Pomodoro modes",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: RefreshCw,
    title: "Spaced Repetition",
    description: "Smart revision scheduling at 1, 3, 7, 15, 30 day intervals",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: GitBranch,
    title: "Mind Maps",
    description: "Visualize your entire knowledge graph with interactive maps",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Detailed charts of your study patterns and progress",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Brain,
    title: "Confidence Tracking",
    description: "Rate and track your understanding of every topic",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Calendar,
    title: "Calendar & Planner",
    description: "Plan daily study sessions and track completion",
    color: "from-indigo-500 to-violet-500",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-mesh">
      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[20%] w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute top-[40%] right-[15%] w-96 h-96 rounded-full bg-chart-2/8 blur-3xl animate-float delay-200" />
        <div className="absolute bottom-20 left-[40%] w-64 h-64 rounded-full bg-chart-3/8 blur-3xl animate-float delay-400" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">StudyStack</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium px-5 py-2.5 rounded-xl gradient-primary text-white hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto text-center pt-24 pb-20 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-subtle text-sm text-muted-foreground mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          Personal Learning Management System
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in">
          Master Anything with{" "}
          <span className="gradient-text">StudyStack</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto animate-fade-in delay-100">
          Track what you study, when you study, and how well you know it.
          Never forget what you learned with built-in spaced repetition.
        </p>

        <div className="flex items-center justify-center gap-4 mt-10 animate-fade-in delay-200">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl gradient-primary text-white font-medium text-lg hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-primary/25"
          >
            Start Learning
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl glass font-medium text-lg hover:bg-accent/50 transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need to <span className="gradient-text">learn effectively</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          A complete toolkit designed for serious learners
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 hover:scale-[1.03] transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8 text-center text-sm text-muted-foreground">
        <p>
          Built with ❤️ for learners everywhere •{" "}
          <span className="gradient-text font-medium">StudyStack</span> {" "}
          <span className="text-muted-foreground">by Rishabh</span>
        </p>
      </footer>

      {/* Future AI Features Placeholder */}
      {/* TODO: AI Features will be added in a future release:
        - AI Summary: Summarize weekly study progress
        - AI Revision Questions: Generate MCQs, Flashcards, Interview Questions
        - AI Topic Recommendations: Suggest next topics based on learning patterns
        - AI Knowledge Graph: Automatically connect related topics
      */}
    </div>
  );
}

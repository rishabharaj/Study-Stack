<p align="center">
  <h1 align="center">📚 Study Stack</h1>
  <p align="center">
    A smart study tracking app with <strong>Spaced Repetition</strong> to help you never forget what you learn.
    <br />
    <a href="#features"><strong>Explore Features »</strong></a>
    <br />
    <br />
    <a href="https://github.com/rishabharaj/Study-Stack/issues">Report Bug</a>
    ·
    <a href="https://github.com/rishabharaj/Study-Stack/issues">Request Feature</a>
  </p>
</p>

---

## 🧠 What is Study Stack?

**Study Stack** is a full-stack study management platform designed for students and self-learners. It uses **spaced repetition** to automatically schedule revisions after each study session — so you retain what you learn, not just cram and forget.

> **The Problem:** You study a topic today, but forget 80% of it within a week.  
> **The Solution:** Study Stack schedules revisions at scientifically-backed intervals (Day 1, 3, 7, 15, 30) so your brain moves knowledge from short-term to long-term memory.

---

## ✨ Features

### 📖 Subject & Topic Management
- **5 Default Subjects** — DSA, Web Development, App Development, Machine Learning, Core Subjects
- **135+ Pre-loaded Topics** with subtopics across all subjects
- Create custom subjects with icons and colors
- Track topic status: `Not Started` → `Learning` → `Revision Due` → `Mastered`
- Confidence scoring (0-10) for each topic

### ⏱️ Study Timer
- **Focus Mode** — Free-form study timer
- **Pomodoro Mode** — 25/45/60 min presets with break intervals
- Select subject → topic → subtopic before starting
- Session notes and confidence rating on completion
- Real-time timer with pause/resume

### 🔄 Spaced Repetition Revisions
- **Auto-scheduled** after your first study session on any topic
- **5 revision intervals:** Day 1, 3, 7, 15, 30
- Revisions page with **Overdue / Today / Upcoming** tabs
- Auto-complete revisions when you re-study a topic
- Topic status updates to `revision_due` when revisions are pending
- Browser notifications on completion

### 📊 Dashboard
- Total subjects, topics, study time stats
- Today / This Week / This Month study time breakdown
- **Study Streak** tracking (current + longest)
- **Weak Topics** — topics with low confidence scores
- **Upcoming Revisions** widget
- **Recent Sessions** history

### 📈 Analytics
- Study time trends with charts (Recharts)
- Subject-wise breakdown
- Performance tracking over time

### 📅 Calendar
- Visual calendar view of study sessions
- See what you studied on any day

### 🗒️ Notes
- Create notes linked to specific topics/subtopics
- Rich text notes for quick reference

### 🧭 Mind Map
- Visual topic relationship mapping (React Flow)
- Interactive node-based visualization

### 🔍 Global Search
- Search across all subjects, topics, and notes
- Command palette style (⌘K) quick access

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + Custom Glassmorphism |
| **UI Components** | shadcn/ui + Base UI |
| **State Management** | Zustand |
| **Backend / Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Auth** | Supabase Auth (Email/Password) |
| **Charts** | Recharts |
| **Flow Diagrams** | @xyflow/react |
| **Icons** | Lucide React |
| **Forms** | React Hook Form + Zod |
| **Date Utilities** | date-fns |
| **Notifications** | Sonner (Toast) + Browser Notifications |

---

## 📁 Project Structure

```
Study-Stack/
├── public/                          # Static assets
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema (run in Supabase SQL Editor)
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login & Signup pages
│   │   ├── (dashboard)/             # All dashboard pages
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── subjects/            # Subject listing & detail
│   │   │   ├── topics/              # Topic detail page
│   │   │   ├── study/               # Study timer
│   │   │   ├── revisions/           # Spaced repetition revisions
│   │   │   ├── analytics/           # Study analytics
│   │   │   ├── calendar/            # Calendar view
│   │   │   ├── notes/               # Notes management
│   │   │   ├── mindmap/             # Mind map visualization
│   │   │   └── search/              # Global search
│   │   ├── auth/callback/           # Supabase auth callback
│   │   ├── globals.css              # Global styles + design system
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/
│   │   ├── dashboard/               # Dashboard widgets
│   │   ├── layout/                  # Sidebar, Header, Wrapper
│   │   └── ui/                      # Reusable UI components (shadcn)
│   ├── lib/
│   │   ├── constants.ts             # App constants & revision intervals
│   │   ├── constants/subtopics.ts   # 135+ topic-subtopic mappings
│   │   ├── stores/                  # Zustand stores (timer, UI)
│   │   ├── types/database.ts        # TypeScript types
│   │   └── utils.ts                 # Utility functions
│   ├── utils/supabase/              # Supabase client/server helpers
│   └── middleware.ts                # Auth middleware
├── components.json                  # shadcn/ui config
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn** or **pnpm**
- A **Supabase** account ([supabase.com](https://supabase.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/rishabharaj/Study-Stack.git
cd Study-Stack
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run the schema file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Enable **Email Auth** in Supabase → Authentication → Providers

### 4. Configure Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> You can find these in Supabase → Settings → API

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, and your subjects/topics will auto-seed!

---

## 📐 Database Schema

```
subjects ──┐
            ├── topics ──┐
            │             ├── subtopics
            │             ├── study_sessions
            │             ├── revisions (spaced repetition)
            │             ├── notes
            │             └── resources
            │
study_streaks (per user)
daily_plans (per user, per date)
```

Key tables:
- **subjects** — User's study subjects with icon/color
- **topics** — Topics under each subject with difficulty, status, confidence
- **subtopics** — Granular subtopics under each topic
- **study_sessions** — Timed study sessions with confidence rating
- **revisions** — 5-level spaced repetition schedule per topic
- **study_streaks** — Daily study streak tracking

All tables have **Row Level Security (RLS)** — users can only access their own data.

---

## 🔄 Spaced Repetition Algorithm

```
Study Session Completed
        │
        ▼
┌─────────────────────┐
│ Schedule 5 Revisions│
│                     │
│  Rev 1 → Day 1      │
│  Rev 2 → Day 3      │
│  Rev 3 → Day 7      │
│  Rev 4 → Day 15     │
│  Rev 5 → Day 30     │
└─────────────────────┘
        │
        ▼
  Topic Status → "revision_due"
        │
        ▼
  Re-study topic → Auto-completes next pending revision
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Rishabh Araj**  
GitHub: [@rishabharaj](https://github.com/rishabharaj)

---

<p align="center">
  Made with ❤️ for students who want to learn smarter, not harder.
</p>

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimerMode = "stopwatch" | "pomodoro";
export type TimerState = "idle" | "running" | "paused";
export type PomodoroPhase = "focus" | "break";

interface TimerStore {
  // State
  mode: TimerMode;
  state: TimerState;
  elapsed: number; // seconds elapsed
  pomodoroPhase: PomodoroPhase;
  pomodoroRound: number;
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  
  // Session context
  topicId: string | null;
  topicName: string | null;
  subtopicId: string | null;
  subtopicName: string | null;
  sessionStartTime: string | null;
  purpose: "study" | "revision";

  // Actions
  setMode: (mode: TimerMode) => void;
  setPurpose: (purpose: "study" | "revision") => void;
  start: (topicId: string, topicName: string, subtopicId?: string | null, subtopicName?: string | null, purpose?: "study" | "revision") => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
  setPomodoroConfig: (focus: number, breakMin: number) => void;
  reset: () => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: "stopwatch",
      state: "idle",
      elapsed: 0,
      pomodoroPhase: "focus",
      pomodoroRound: 1,
      focusDuration: 25,
      breakDuration: 5,
      topicId: null,
      topicName: null,
      subtopicId: null,
      subtopicName: null,
      sessionStartTime: null,
      purpose: "study",

      setMode: (mode) => set({ mode }),
      setPurpose: (purpose) => set({ purpose }),

      start: (topicId, topicName, subtopicId, subtopicName, purpose) =>
        set({
          state: "running",
          elapsed: 0,
          topicId,
          topicName,
          subtopicId: subtopicId || null,
          subtopicName: subtopicName || null,
          sessionStartTime: new Date().toISOString(),
          pomodoroPhase: "focus",
          pomodoroRound: 1,
          purpose: purpose || "study",
        }),

      pause: () => set({ state: "paused" }),

      resume: () => set({ state: "running" }),

      stop: () => {
        const current = get();
        // Return the session data before resetting
        return set({
          state: "idle",
          elapsed: 0,
          topicId: null,
          topicName: null,
          subtopicId: null,
          subtopicName: null,
          sessionStartTime: null,
          pomodoroPhase: "focus",
          pomodoroRound: 1,
          purpose: "study",
        });
      },

      tick: () => {
        const current = get();
        if (current.state !== "running") return;

        const newElapsed = current.elapsed + 1;

        if (current.mode === "pomodoro") {
          const phaseSeconds =
            current.pomodoroPhase === "focus"
              ? current.focusDuration * 60
              : current.breakDuration * 60;

          if (newElapsed >= phaseSeconds) {
            // Phase complete
            if (current.pomodoroPhase === "focus") {
              // Switch to break
              set({
                elapsed: 0,
                pomodoroPhase: "break",
              });
            } else {
              // Break complete, start next round
              set({
                elapsed: 0,
                pomodoroPhase: "focus",
                pomodoroRound: current.pomodoroRound + 1,
              });
            }
            return;
          }
        }

        set({ elapsed: newElapsed });
      },

      setPomodoroConfig: (focus, breakMin) =>
        set({ focusDuration: focus, breakDuration: breakMin }),

      reset: () =>
        set({
          state: "idle",
          elapsed: 0,
          topicId: null,
          topicName: null,
          subtopicId: null,
          subtopicName: null,
          sessionStartTime: null,
          pomodoroPhase: "focus",
          pomodoroRound: 1,
          purpose: "study",
        }),
    }),
    {
      name: "studyos-timer",
    }
  )
);

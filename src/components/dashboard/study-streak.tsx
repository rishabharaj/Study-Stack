"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StudyStreakProps {
  currentStreak: number;
  longestStreak: number;
  delay?: number;
}

export function StudyStreak({ currentStreak, longestStreak, delay = 0 }: StudyStreakProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 transition-all duration-500 hover:scale-[1.02] cursor-default",
        "bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Study Streak
          </p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold tracking-tight">{currentStreak}</p>
            <p className="text-sm text-muted-foreground">days</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Best: {longestStreak} days
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/20">
          <Flame
            className={cn(
              "w-5 h-5 text-orange-400",
              currentStreak > 0 && "animate-fire"
            )}
          />
        </div>
      </div>

      {/* Streak visualization */}
      {currentStreak > 0 && (
        <div className="mt-3 flex gap-1">
          {Array.from({ length: Math.min(currentStreak, 7) }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full bg-orange-400/60"
              style={{
                opacity: 0.4 + (i / 7) * 0.6,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

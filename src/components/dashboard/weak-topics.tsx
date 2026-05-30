"use client";

import type { TopicWithStats } from "@/lib/types/database";
import { getConfidenceEmoji } from "@/lib/types/database";
import { AlertTriangle } from "lucide-react";

interface WeakTopicsProps {
  topics: TopicWithStats[];
}

export function WeakTopics({ topics }: WeakTopicsProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        Weak Topics
      </h3>
      {topics.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No weak topics detected. Keep studying and rating your confidence!
        </p>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{topic.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(topic as unknown as { subjects: { name: string } }).subjects?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span>{getConfidenceEmoji(topic.confidence_score)}</span>
                <span className="text-red-400 font-bold text-sm">
                  {topic.confidence_score}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

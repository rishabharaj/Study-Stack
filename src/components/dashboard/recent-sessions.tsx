"use client";

import type { StudySessionWithDetails } from "@/lib/types/database";
import { formatDuration } from "@/lib/constants";
import { getConfidenceEmoji } from "@/lib/types/database";
import { Clock, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentSessionsProps {
  sessions: StudySessionWithDetails[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        Recent Sessions
      </h3>
      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No study sessions yet. Start your first session!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const topicData = session as unknown as {
              topics: { name: string; subjects: { name: string; color: string } };
            };
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-xl bg-background/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-8 rounded-full"
                    style={{
                      backgroundColor: topicData.topics?.subjects?.color || "#6366f1",
                    }}
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {topicData.topics?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topicData.topics?.subjects?.name} •{" "}
                      {formatDistanceToNow(new Date(session.start_time), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-sm font-mono">
                    {formatDuration(session.duration_seconds)}
                  </span>
                  <span>{getConfidenceEmoji(session.confidence_rating)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

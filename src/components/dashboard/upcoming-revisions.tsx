"use client";

import type { RevisionWithDetails } from "@/lib/types/database";
import { RefreshCw } from "lucide-react";
import { format, isToday, isPast, isTomorrow } from "date-fns";

interface UpcomingRevisionsProps {
  revisions: RevisionWithDetails[];
}

export function UpcomingRevisions({ revisions }: UpcomingRevisionsProps) {
  function getDueDateLabel(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    if (isPast(date) && !isToday(date)) return { label: "Overdue", className: "text-red-400 bg-red-500/10" };
    if (isToday(date)) return { label: "Today", className: "text-amber-400 bg-amber-500/10" };
    if (isTomorrow(date)) return { label: "Tomorrow", className: "text-blue-400 bg-blue-500/10" };
    return { label: format(date, "MMM d"), className: "text-muted-foreground bg-muted" };
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <RefreshCw className="w-5 h-5 text-amber-400" />
        Upcoming Revisions
      </h3>
      {revisions.length === 0 ? (
        <div className="text-center py-8">
          <RefreshCw className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No pending revisions. Complete topics to schedule revisions!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {revisions.map((revision) => {
            const topicData = revision as unknown as {
              topics: { name: string; subjects: { name: string; color: string } };
            };
            const due = getDueDateLabel(revision.due_date);
            return (
              <div
                key={revision.id}
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
                      Revision {revision.revision_number} •{" "}
                      {topicData.topics?.subjects?.name}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${due.className}`}
                >
                  {due.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

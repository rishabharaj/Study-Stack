"use client";

import { type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  isTime?: boolean;
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, color, delay = 0, isTime, subtitle }: StatCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-lg cursor-default group",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {isTime ? value : typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-destructive font-medium">{subtitle}</p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

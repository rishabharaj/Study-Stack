"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div
      className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0 w-full",
        sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]",
        "ml-0"
      )}
    >
      {children}
    </div>
  );
}

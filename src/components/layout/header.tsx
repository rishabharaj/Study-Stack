"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Plus, Timer, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTimerStore } from "@/lib/stores/timer-store";
import { formatTimerDisplay } from "@/lib/constants";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useUIStore } from "@/lib/stores/ui-store";

// Map paths to breadcrumb labels
const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  subjects: "Subjects",
  study: "Study Timer",
  revisions: "Revisions",
  mindmap: "Mind Map",
  calendar: "Calendar",
  analytics: "Analytics",
  notes: "Notes",
  search: "Search",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { state: timerState, elapsed, topicName } = useTimerStore();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toggleSidebarOpen } = useUIStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || null);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Build breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: pathLabels[seg] || seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-border/50">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left Actions & Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl hover:bg-accent/80 shrink-0"
            onClick={toggleSidebarOpen}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm overflow-hidden truncate">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && <span className="text-muted-foreground/50">/</span>}
                <span
                  className={
                    crumb.isLast
                      ? "font-semibold text-foreground truncate"
                      : "text-muted-foreground hover:text-foreground cursor-pointer transition-colors truncate hidden sm:inline"
                  }
                  onClick={() => !crumb.isLast && router.push(crumb.href)}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active Timer Indicator */}
          {timerState === "running" && (
            <button
              onClick={() => router.push("/study")}
              className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full glass-subtle animate-pulse-glow cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-spin-slow" />
              <span className="text-[10px] sm:text-xs font-mono font-bold timer-display">
                {formatTimerDisplay(elapsed)}
              </span>
              {topicName && (
                <span className="text-[10px] sm:text-xs text-muted-foreground max-w-[50px] sm:max-w-[100px] truncate hidden xs:inline">
                  {topicName}
                </span>
              )}
            </button>
          )}

          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-accent/80 h-9 w-9 sm:h-10 sm:w-10"
            onClick={() => router.push("/search")}
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Quick Start Study */}
          <Button
            size="sm"
            className="rounded-xl gradient-primary hover:opacity-90 transition-opacity gap-1.5 sm:gap-2 h-9 px-3 sm:h-10 sm:px-4"
            onClick={() => router.push("/study")}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Study</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl hover:bg-accent/80 h-9 w-9 sm:h-10 sm:w-10"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-white">
              0
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-accent/80 h-9 w-9 sm:h-10 sm:w-10"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {userEmail?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userEmail || "User"}</p>
                <p className="text-xs text-muted-foreground">StudyStack Account</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { Rocket, Bell, BarChart3, Eye, ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";

interface SidebarProps {
  upcomingProjects?: (Project & { launchDate: string })[];
  ecosystemStats?: {
    totalProjects: number;
    newThisWeek: number;
    totalWatchers: number;
    totalUpvotes: number;
  };
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function Sidebar({ upcomingProjects = [], ecosystemStats }: SidebarProps) {
  const upcoming = upcomingProjects.slice(0, 3);

  return (
    <aside className="space-y-5">
      {/* Launching Soon */}
      <div className="rounded-2xl bg-surface p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Rocket className="h-4 w-4 text-text-secondary" />
          Launching Soon
        </div>
        <div className="mt-3 space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-xs text-text-tertiary">No upcoming projects</p>
          ) : (
            upcoming.map((project) => {
              const days = daysUntil(project.launchDate);
              return (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary group-hover:text-primary">
                      {project.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span className="font-[family-name:var(--font-mono)]">
                          {project.watchers}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-text-secondary">
                      {days}d
                    </span>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary"
                      aria-label={`Notify me about ${project.name}`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        <Link
          href="/upcoming"
          className="mt-2 flex items-center gap-1 px-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          View all upcoming
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Ecosystem Stats */}
      {ecosystemStats && (
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <BarChart3 className="h-4 w-4 text-text-secondary" />
            Base Ecosystem
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <StatBlock label="Projects" value={ecosystemStats.totalProjects.toString()} />
            <StatBlock label="This Week" value={`+${ecosystemStats.newThisWeek}`} accent />
            <StatBlock label="Watchers" value={formatNumber(ecosystemStats.totalWatchers)} />
            <StatBlock label="Upvotes" value={formatNumber(ecosystemStats.totalUpvotes)} />
          </div>
        </div>
      )}
    </aside>
  );
}

function StatBlock({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface-hover p-2.5">
      <p className="text-[10px] font-medium tracking-wider text-text-tertiary uppercase">
        {label}
      </p>
      <p
        className={`mt-0.5 font-[family-name:var(--font-mono)] text-lg font-semibold ${
          accent ? "text-success" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

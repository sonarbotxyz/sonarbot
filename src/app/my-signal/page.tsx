"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  Eye,
  ArrowRight,
  Circle,
  BarChart3,
  Rocket,
  Handshake,
  Newspaper,
  Coins,
  Settings,
} from "lucide-react";
import { projects, alerts, type Alert } from "@/lib/mock-data";

const alertTypeIcons: Record<string, React.ElementType> = {
  metrics: BarChart3,
  launch: Rocket,
  partnership: Handshake,
  update: Newspaper,
  token: Coins,
};

const watchedProjectIds = [
  "aerodrome",
  "friend-tech-v2",
  "seamless-protocol",
  "zora-base",
  "coinbase-wallet",
  "farcaster-frames",
  "degen-chain",
  "base-paint",
];

export default function MySignalPage() {
  const [activeTab, setActiveTab] = useState<
    "alerts" | "watching" | "settings"
  >("alerts");

  const watchedProjects = projects.filter((p) =>
    watchedProjectIds.includes(p.id)
  );

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-20 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="font-bold text-[10px]"
              style={{ color: "var(--accent)" }}
            >
              &gt;
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "var(--text-muted)" }}
            >
              Dashboard
            </span>
          </div>
          <h1
            className="mt-3 font-display text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            My Signal
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Your personal Base radar
          </p>
        </div>

        <p
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ color: "var(--text-very-muted)" }}
        >
          Last updated: just now
        </p>
      </motion.div>

      {/* Tabs */}
      <div
        className="mt-8 flex gap-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {[
          {
            key: "alerts" as const,
            label: "Alerts",
            icon: Bell,
            count: alerts.filter((a) => !a.read).length,
          },
          {
            key: "watching" as const,
            label: "Watching",
            icon: Eye,
            count: watchedProjects.length,
          },
          { key: "settings" as const, label: "Settings", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 pb-3 text-[11px] uppercase tracking-[0.08em] font-medium transition-colors"
            style={{
              color:
                activeTab === tab.key
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
            }}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {"count" in tab && tab.count !== undefined && tab.count > 0 && (
              <span
                className="font-mono text-[10px] px-1.5 py-0.5"
                style={{
                  color:
                    tab.key === "alerts" && activeTab !== "alerts"
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  background:
                    tab.key === "alerts" && activeTab !== "alerts"
                      ? "var(--accent-glow)"
                      : "transparent",
                  border:
                    tab.key === "alerts" && activeTab !== "alerts"
                      ? "1px solid var(--accent-dim)"
                      : "none",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {activeTab === "alerts" && <AlertsFeed alerts={alerts} />}
        {activeTab === "watching" && (
          <WatchingGrid projects={watchedProjects} />
        )}
        {activeTab === "settings" && <NotificationSettings />}
      </div>
    </div>
  );
}

function AlertsFeed({ alerts: alertList }: { alerts: Alert[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ borderTop: "1px solid var(--border)" }}>
        {alertList.map((alert, i) => {
          const TypeIcon = alertTypeIcons[alert.type] || Circle;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/project/${alert.projectId}`}
                className="theme-guide-row group flex items-start gap-4 p-4 transition-all no-underline"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                {/* Activity dot */}
                <div className="mt-1.5 shrink-0">
                  {!alert.read ? (
                    <div
                      className="h-2 w-2"
                      style={{
                        background: "var(--accent)",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <div
                      className="h-2 w-2"
                      style={{
                        background: "var(--text-very-muted)",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="row-title font-display text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {alert.projectName}
                    </span>
                    <TypeIcon
                      className="h-3 w-3"
                      style={{ color: "var(--text-very-muted)" }}
                    />
                  </div>
                  <p
                    className="mt-0.5 text-sm font-medium"
                    style={{ color: "var(--text-body)" }}
                  >
                    {alert.title}
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {alert.description}
                  </p>
                </div>

                {/* Time + arrow */}
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {timeAgo(alert.date)}
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function WatchingGrid({
  projects: watchedList,
}: {
  projects: typeof projects;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ borderTop: "1px solid var(--border)" }}>
        {watchedList.map((project, i) => {
          const hasActivity = project.isHot || project.isNew;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/project/${project.id}`}
                className="theme-guide-row group flex items-center gap-6 py-4 px-4 lg:px-8 transition-all no-underline"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                {/* Number */}
                <span
                  className="text-[11px] w-[40px] shrink-0"
                  style={{
                    color: "var(--text-very-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="row-title font-display text-[15px] font-medium"
                      style={{ color: "var(--text-body)" }}
                    >
                      {project.name}
                    </span>
                    {hasActivity && (
                      <span
                        className="h-1.5 w-1.5 animate-pulse-dot"
                        style={{
                          background: "var(--accent)",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-very-muted)" }}
                  >
                    {project.category} &middot;{" "}
                    {project.upvotes.toLocaleString()} upvotes
                  </span>
                </div>

                {/* Badge */}
                <span
                  className="row-badge shrink-0 text-[10px] uppercase px-2 py-0.5 transition-all"
                  style={{
                    letterSpacing: "0.1em",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Watching
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function NotificationSettings() {
  const [channels, setChannels] = useState({
    telegram: true,
    email: false,
    inApp: true,
  });

  const [types, setTypes] = useState({
    metrics: true,
    launches: true,
    partnerships: false,
    allUpdates: false,
    tokenEvents: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg space-y-8"
    >
      {/* Channels */}
      <div>
        <h3
          className="text-[10px] uppercase tracking-[0.15em] font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Notification Channels
        </h3>
        <p
          className="mt-1 text-[11px]"
          style={{ color: "var(--text-very-muted)" }}
        >
          Where you receive signals
        </p>
        <div
          className="mt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {[
            { key: "telegram" as const, label: "Telegram" },
            { key: "email" as const, label: "Email" },
            { key: "inApp" as const, label: "In-app" },
          ].map((channel) => (
            <div
              key={channel.key}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {channel.label}
              </span>
              <ToggleSwitch
                enabled={channels[channel.key]}
                onToggle={() =>
                  setChannels((prev) => ({
                    ...prev,
                    [channel.key]: !prev[channel.key],
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Signal types */}
      <div>
        <h3
          className="text-[10px] uppercase tracking-[0.15em] font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Default Signal Types
        </h3>
        <p
          className="mt-1 text-[11px]"
          style={{ color: "var(--text-very-muted)" }}
        >
          Applied to new watches (per-project overrides available)
        </p>
        <div
          className="mt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {[
            { key: "metrics" as const, label: "Metrics milestones", icon: BarChart3 },
            { key: "launches" as const, label: "Features & launches", icon: Rocket },
            { key: "partnerships" as const, label: "Partnerships", icon: Handshake },
            { key: "allUpdates" as const, label: "All updates", icon: Newspaper },
            { key: "tokenEvents" as const, label: "Token events", icon: Coins },
          ].map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                <type.icon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                {type.label}
              </span>
              <ToggleSwitch
                enabled={types[type.key]}
                onToggle={() =>
                  setTypes((prev) => ({
                    ...prev,
                    [type.key]: !prev[type.key],
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center transition-colors"
      style={{
        background: enabled ? "var(--accent)" : "var(--bg-tertiary)",
        borderRadius: "10px",
      }}
    >
      <span
        className="inline-block h-3.5 w-3.5 bg-white transition-transform"
        style={{
          borderRadius: "50%",
          transform: enabled ? "translateX(18px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

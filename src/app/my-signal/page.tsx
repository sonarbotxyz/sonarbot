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
  ChevronUp,
  Settings,
} from "lucide-react";
import { projects, alerts, type Category, type Alert } from "@/lib/mock-data";

const categoryGradients: Record<Category, { from: string; to: string }> = {
  DeFi: { from: "#3A6AD0", to: "#5080D8" },
  Social: { from: "#7B55D0", to: "#9575D8" },
  NFT: { from: "#C84585", to: "#D86098" },
  Infra: { from: "#20B880", to: "#40C898" },
  Gaming: { from: "#D89018", to: "#E0A838" },
  Tools: { from: "#606870", to: "#808890" },
};

const alertTypeIcons: Record<string, React.ElementType> = {
  metrics: BarChart3,
  launch: Rocket,
  partnership: Handshake,
  update: Newspaper,
  token: Coins,
};

// Simulated watched projects
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

const CARD_SHADOW = "0 2px 8px rgba(0, 0, 0, 0.25)";

export default function MySignalPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "watching" | "settings">(
    "alerts"
  );

  const watchedProjects = projects.filter((p) =>
    watchedProjectIds.includes(p.id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover">
            <Activity className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold text-text-primary">
              My Signal
            </h1>
            <p className="text-sm text-text-secondary">
              Your personal Base radar
            </p>
          </div>
        </div>

        <p className="text-xs text-text-tertiary">
          Last updated: just now
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-border-subtle">
        {[
          { key: "alerts" as const, label: "Alerts", icon: Bell, count: alerts.filter((a) => !a.read).length },
          { key: "watching" as const, label: "Watching", icon: Eye, count: watchedProjects.length },
          { key: "settings" as const, label: "Settings", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {"count" in tab && tab.count !== undefined && tab.count > 0 && (
              <span
                className={`font-[family-name:var(--font-mono)] text-[11px] ${
                  tab.key === "alerts" && activeTab !== "alerts"
                    ? "rounded-full bg-primary/15 px-1.5 py-0.5 text-primary"
                    : "text-text-tertiary"
                }`}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.key && (
              <motion.div
                layoutId="signal-tab"
                className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
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
      className="space-y-2"
    >
      {alertList.map((alert, i) => {
        const gradient = categoryGradients[alert.category];
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
              className="group flex items-start gap-4 rounded-xl bg-surface p-4 transition-colors hover:bg-surface-hover"
            >
              {/* Activity dot */}
              <div className="mt-1 shrink-0">
                {!alert.read ? (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-border" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="font-[family-name:var(--font-brand)] text-sm font-semibold"
                    style={{ color: gradient.from }}
                  >
                    {alert.projectName}
                  </span>
                  <TypeIcon className="h-3 w-3 text-text-tertiary" />
                </div>
                <p className="mt-0.5 text-sm font-medium text-text-primary">
                  {alert.title}
                </p>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {alert.description}
                </p>
              </div>

              {/* Time + arrow */}
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-text-tertiary">
                  {timeAgo(alert.date)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          </motion.div>
        );
      })}
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
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {watchedList.map((project, i) => {
        const gradient = categoryGradients[project.category];
        const hasActivity = project.isHot || project.isNew;

        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              href={`/project/${project.id}`}
              className="group block overflow-hidden rounded-xl bg-surface transition-all duration-300 hover:-translate-y-[3px]"
              style={{ boxShadow: CARD_SHADOW }}
            >
              {/* Mini banner — clean gradient */}
              <div
                className="relative flex h-24 items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${gradient.from}14, ${gradient.to}0a, transparent)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    background: `radial-gradient(ellipse at 50% 80%, ${gradient.from}15, transparent 70%)`,
                  }}
                />

                {hasActivity && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center">
                    <div className="absolute h-2 w-2 rounded-full bg-primary" />
                    <div className="absolute h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-[family-name:var(--font-brand)] text-sm font-semibold text-text-primary truncate">
                  {project.name}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <ChevronUp className="h-3 w-3" />
                    <span className="font-[family-name:var(--font-mono)] text-[11px]">
                      {project.upvotes.toLocaleString()}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Eye className="h-3 w-3" />
                    <span className="font-[family-name:var(--font-mono)] text-[11px]">
                      {project.watchers.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
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
      className="max-w-lg space-y-6"
    >
      {/* Channels */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          Notification Channels
        </h3>
        <p className="mt-1 text-xs text-text-tertiary">
          Where you receive signals
        </p>
        <div className="mt-3 space-y-2">
          {[
            { key: "telegram" as const, label: "Telegram" },
            { key: "email" as const, label: "Email" },
            { key: "inApp" as const, label: "In-app" },
          ].map((channel) => (
            <div
              key={channel.key}
              className="flex items-center justify-between rounded-lg bg-surface p-3"
            >
              <span className="text-sm text-text-primary">{channel.label}</span>
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
        <h3 className="text-sm font-semibold text-text-primary">
          Default Signal Types
        </h3>
        <p className="mt-1 text-xs text-text-tertiary">
          Applied to new watches (per-project overrides available)
        </p>
        <div className="mt-3 space-y-2">
          {[
            { key: "metrics" as const, label: "Metrics milestones", icon: BarChart3 },
            { key: "launches" as const, label: "Features & launches", icon: Rocket },
            { key: "partnerships" as const, label: "Partnerships", icon: Handshake },
            { key: "allUpdates" as const, label: "All updates", icon: Newspaper },
            { key: "tokenEvents" as const, label: "Token events", icon: Coins },
          ].map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between rounded-lg bg-surface p-3"
            >
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <type.icon className="h-4 w-4 text-text-tertiary" />
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rocket,
  Bell,
  Eye,
  ChevronUp,
  Check,
  TrendingUp,
  Users,
  Palette,
  Cpu,
  Gamepad2,
  Wrench,
} from "lucide-react";
import { upcomingProjects, type Category } from "@/lib/mock-data";
import { CountdownTimer } from "@/components/CountdownTimer";

const categoryIcons: Record<Category, React.ElementType> = {
  DeFi: TrendingUp,
  Social: Users,
  NFT: Palette,
  Infra: Cpu,
  Gaming: Gamepad2,
  Tools: Wrench,
};

const categoryGradients: Record<Category, { from: string; to: string }> = {
  DeFi: { from: "#3B7BF6", to: "#5B9AFF" },
  Social: { from: "#8B5CF6", to: "#A78BFA" },
  NFT: { from: "#EC4899", to: "#F472B6" },
  Infra: { from: "#00D897", to: "#34D399" },
  Gaming: { from: "#F59E0B", to: "#FBBF24" },
  Tools: { from: "#6B7280", to: "#9CA3AF" },
};

/* Unified cyan glow on hover */
const CYAN_GLOW = "0 8px 32px rgba(61, 215, 216, 0.18)";
const CARD_SHADOW = "0 2px 8px rgba(4, 8, 40, 0.5)";

export default function UpcomingPage() {
  const [notified, setNotified] = useState<Set<string>>(new Set());

  const toggleNotify = (id: string) => {
    const next = new Set(notified);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setNotified(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold text-text-primary">
              Upcoming
            </h1>
            <p className="text-sm text-text-secondary">
              Projects launching soon on Base
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingProjects.map((project, i) => {
          const gradient = categoryGradients[project.category];
          const CategoryIcon = categoryIcons[project.category];
          const isNotified = notified.has(project.id);

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div
                className="group overflow-hidden rounded-xl bg-surface transition-all duration-300 hover:-translate-y-[3px]"
                style={{ boxShadow: CARD_SHADOW }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = CYAN_GLOW;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = CARD_SHADOW;
                }}
              >
                {/* Banner */}
                <Link href={`/project/${project.id}`}>
                  <div
                    className="relative flex h-36 items-center justify-center overflow-hidden sm:h-40"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}10, transparent)`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: `radial-gradient(ellipse at 50% 80%, ${gradient.from}20, transparent 70%)`,
                      }}
                    />
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage: `linear-gradient(${gradient.from}60 1px, transparent 1px), linear-gradient(90deg, ${gradient.from}60 1px, transparent 1px)`,
                        backgroundSize: "32px 32px",
                      }}
                    />
                    <CategoryIcon
                      className="relative z-10 h-12 w-12 opacity-20"
                      style={{ color: gradient.from }}
                      strokeWidth={1}
                    />

                    {/* Countdown overlay */}
                    <div className="absolute right-3 bottom-3">
                      <CountdownTimer targetDate={project.launchDate} />
                    </div>

                    {/* Category */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase"
                        style={{
                          background: `${gradient.from}20`,
                          color: gradient.from,
                        }}
                      >
                        {project.category}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/project/${project.id}`}>
                    <h3 className="font-[family-name:var(--font-brand)] text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">
                      {project.tagline}
                    </p>
                  </Link>

                  {/* Metrics + Notify */}
                  <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="font-[family-name:var(--font-mono)] text-xs">
                          {project.watchers}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span className="font-[family-name:var(--font-mono)] text-xs">
                          {project.upvotes}
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleNotify(project.id)}
                      className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
                        isNotified
                          ? "bg-primary/15 text-primary"
                          : "bg-surface-hover text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {isNotified ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Bell className="h-3.5 w-3.5" />
                      )}
                      {isNotified ? "Notifying" : "Notify Me"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

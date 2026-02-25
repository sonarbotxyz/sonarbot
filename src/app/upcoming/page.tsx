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
} from "lucide-react";
import { upcomingProjects, type Category } from "@/lib/mock-data";
import { CountdownTimer } from "@/components/CountdownTimer";

const categoryGradients: Record<Category, { from: string; to: string }> = {
  DeFi: { from: "#3A6AD0", to: "#5080D8" },
  Social: { from: "#7B55D0", to: "#9575D8" },
  NFT: { from: "#C84585", to: "#D86098" },
  Infra: { from: "#20B880", to: "#40C898" },
  Gaming: { from: "#D89018", to: "#E0A838" },
  Tools: { from: "#606870", to: "#808890" },
};

const CARD_SHADOW = "0 2px 8px rgba(0, 0, 0, 0.25)";
const CARD_HOVER_SHADOW = "0 8px 24px rgba(0, 0, 0, 0.35)";

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover">
            <Rocket className="h-5 w-5 text-text-secondary" />
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
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingProjects.map((project, i) => {
          const gradient = categoryGradients[project.category];
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
                  (e.currentTarget as HTMLDivElement).style.boxShadow = CARD_HOVER_SHADOW;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = CARD_SHADOW;
                }}
              >
                {/* Banner — clean gradient */}
                <Link href={`/project/${project.id}`}>
                  <div
                    className="relative flex h-36 items-center justify-center overflow-hidden sm:h-40"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}14, ${gradient.to}0a, transparent)`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: `radial-gradient(ellipse at 50% 80%, ${gradient.from}18, transparent 70%)`,
                      }}
                    />

                    {/* Countdown overlay */}
                    <div className="absolute right-3 bottom-3">
                      <CountdownTimer targetDate={project.launchDate} />
                    </div>

                    {/* Category pill — gray neutral */}
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-border px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-text-secondary uppercase">
                        {project.category}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-5">
                  <Link href={`/project/${project.id}`}>
                    <h3 className="font-[family-name:var(--font-brand)] text-base font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                      {project.tagline}
                    </p>
                  </Link>

                  {/* Metrics + Notify */}
                  <div className="mt-3 flex items-center justify-between pt-3">
                    <div className="flex items-center gap-3 text-text-secondary">
                      <span className="flex items-center gap-1">
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span className="font-[family-name:var(--font-mono)] text-xs">
                          {project.upvotes}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="font-[family-name:var(--font-mono)] text-xs">
                          {project.watchers}
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleNotify(project.id)}
                      className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
                        isNotified
                          ? "bg-primary/12 text-primary"
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

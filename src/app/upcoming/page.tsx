"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rocket,
  Bell,
  ChevronUp,
  Check,
} from "lucide-react";
import { upcomingProjects, type Category } from "@/lib/mock-data";
import { CountdownTimer } from "@/components/CountdownTimer";

const categoryGradients: Record<Category, { from: string; via: string; to: string }> = {
  DeFi: { from: "#2A5DC4", via: "#1A3D94", to: "#0A1D64" },
  Social: { from: "#6B45C0", via: "#4B2590", to: "#2B0560" },
  NFT: { from: "#B83575", via: "#882050", to: "#580A30" },
  Infra: { from: "#18A870", via: "#0A7848", to: "#004828" },
  Gaming: { from: "#C88018", via: "#986010", to: "#684008" },
  Tools: { from: "#505860", via: "#383E48", to: "#202428" },
};

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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface">
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
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="group overflow-hidden rounded-2xl bg-surface transition-transform duration-300 ease-out hover:-translate-y-0.5">
                {/* Banner */}
                <Link href={`/project/${project.id}`}>
                  <div
                    className="relative flex h-44 items-center justify-center overflow-hidden sm:h-48"
                    style={{
                      background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.via} 50%, ${gradient.to} 100%)`,
                    }}
                  >
                    {/* Countdown overlay */}
                    <div className="absolute right-3 bottom-3">
                      <CountdownTimer targetDate={project.launchDate} />
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white/80 uppercase backdrop-blur-sm">
                        {project.category}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-3.5">
                  <Link href={`/project/${project.id}`}>
                    <h3 className="font-[family-name:var(--font-brand)] text-[15px] font-bold text-text-primary truncate">
                      {project.name}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-text-secondary truncate">
                      {project.tagline}
                    </p>
                  </Link>

                  {/* Metrics + Notify */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-text-secondary">
                      <ChevronUp className="h-3 w-3" />
                      <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium">
                        {project.upvotes}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleNotify(project.id)}
                      className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
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

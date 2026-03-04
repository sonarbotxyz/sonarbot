"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Check, ArrowRight, Sparkles } from "lucide-react";
import { upcomingProjects } from "@/lib/mock-data";
import { CountdownTimer } from "@/components/CountdownTimer";

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
    <div className="mx-auto max-w-[1400px] px-5 md:px-20 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
            Upcoming
          </span>
        </div>
        <h1
          className="mt-3 font-display text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Launching Soon
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Projects launching soon on Base
        </p>
      </motion.div>

      <div className="h-rule mt-8 mb-0" data-label="Countdown" />

      {/* Project list */}
      <div
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {upcomingProjects.map((project, i) => {
          const isNotified = notified.has(project.id);
          const isPromoted = i === 0;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={isPromoted ? "" : "theme-guide-row"}
            >
              {isPromoted && (
                <div
                  className="flex items-center gap-1.5 px-4 lg:px-8 py-1.5"
                  style={{ background: "#1652F0" }}
                >
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-[0.15em] uppercase"
                    style={{ color: "#FFFFFF", background: "rgba(255,255,255,0.12)" }}
                  >
                    <Sparkles className="h-2.5 w-2.5" /> Promoted
                  </span>
                </div>
              )}
              <div
                className="flex items-center gap-6 py-5 px-4 lg:px-8 transition-all"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: isPromoted ? "#1652F0" : undefined,
                }}
              >
                {/* Number */}
                <span
                  className="text-[11px] w-[40px] shrink-0"
                  style={{
                    color: isPromoted ? "rgba(255,255,255,0.5)" : "var(--text-very-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/project/${project.id}`}
                    className="row-title font-display text-[15px] font-medium no-underline transition-colors"
                    style={{ color: isPromoted ? "#FFFFFF" : "var(--text-body)" }}
                  >
                    {project.name}
                  </Link>
                  <div className="flex items-center gap-4 mt-1">
                    <span
                      className="text-[11px]"
                      style={{ color: isPromoted ? "rgba(255,255,255,0.6)" : "var(--text-very-muted)" }}
                    >
                      {project.category}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: isPromoted ? "rgba(255,255,255,0.6)" : "var(--text-very-muted)" }}
                    >
                      {project.tagline}
                    </span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="shrink-0 hidden sm:block">
                  <CountdownTimer targetDate={project.launchDate} variant={isPromoted ? "promoted" : "default"} />
                </div>

                {/* Notify button */}
                <button
                  type="button"
                  onClick={() => toggleNotify(project.id)}
                  className="row-badge shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase font-medium transition-all"
                  style={{
                    letterSpacing: "0.1em",
                    color: isPromoted
                      ? "#FFFFFF"
                      : isNotified ? "var(--accent)" : "var(--text-muted)",
                    border: isPromoted
                      ? "1px solid rgba(255,255,255,0.25)"
                      : isNotified
                        ? "1px solid var(--accent-dim)"
                        : "1px solid var(--border)",
                    background: isPromoted
                      ? isNotified ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"
                      : isNotified ? "var(--accent-glow)" : "transparent",
                  }}
                >
                  {isNotified ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Bell className="h-3 w-3" />
                  )}
                  {isNotified ? "Notifying" : "Notify Me"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, Activity, Radio, TrendingUp, TrendingDown, Users, Droplets } from "lucide-react";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onSearch: (query: string) => void;
  projectCount?: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const EXAMPLE_SIGNALS = [
  {
    time: "12:34",
    project: "BANKRBOT",
    signal: "Price up 47%",
    detail: "Market cap $2.1M → $3.1M. AI correlated with 3 tweets in last hour.",
    icon: TrendingUp,
    accent: true,
  },
  {
    time: "12:18",
    project: "EDEL FINANCE",
    signal: "Volume surge +220%",
    detail: "24h volume $56K → $179K. AI linked to GitHub release v2.1.",
    icon: Activity,
    accent: true,
  },
  {
    time: "11:47",
    project: "DEBTRELIEFBOT",
    signal: "Holders up 12%",
    detail: "23.3K → 26.1K holders. AI detected partnership announcement on X.",
    icon: Users,
    accent: false,
  },
  {
    time: "11:02",
    project: "BANKRBOT",
    signal: "Liquidity down 31%",
    detail: "Liquidity dropped $2.7M → $1.9M. Potential rug warning.",
    icon: Droplets,
    accent: false,
    isWarning: true,
  },
];

export function HeroSection({ onSearch, projectCount }: HeroSectionProps) {
  const [query, setQuery] = useState("");

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">
        {/* Left: headline + search */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center gap-2"
          >
            <span
              className="font-bold text-[11px]"
              style={{ color: "var(--accent)" }}
            >
              &gt;
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.2em] font-medium"
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              Real-time Base intelligence
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 font-display text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight"
          >
            <span style={{ color: "var(--text-primary)" }}>Every signal.</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>Every project.</span>
            <br />
            <span style={{ color: "var(--text-secondary)" }}>Zero noise.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-5 text-sm leading-relaxed max-w-[520px]"
            style={{
              color: "var(--text-secondary)",
              lineHeight: "1.8",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            AI-powered analytics monitoring every project on Base &mdash; detecting
            price pumps, volume spikes, dev activity, and holder growth. Our agents
            correlate on-chain data with social signals to surface what matters.
            Watch projects you care about and get Telegram alerts in real time.
          </motion.p>

          {/* Search */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative mt-8 max-w-md"
          >
            <Search
              className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="h-11 w-full pl-11 pr-4 text-xs outline-none transition-colors"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-jetbrains-mono)",
                letterSpacing: "0.02em",
              }}
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8 flex items-center gap-8"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
              <span
                className="text-[11px] uppercase tracking-[0.08em]"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {projectCount ?? "—"}
                </span>{" "}
                projects monitored
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
              <span
                className="text-[11px] uppercase tracking-[0.08em]"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-jetbrains-mono)",
                }}
              >
                Signals sent{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  every 30 min
                </span>
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right: live signal feed */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-10 lg:mt-0 w-full lg:w-[420px] shrink-0"
        >
          <div
            className="text-[10px] uppercase tracking-[0.15em] font-medium mb-3 flex items-center gap-2"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse"
              style={{ background: "var(--accent)", borderRadius: "50%" }}
            />
            AI-powered signal feed
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
            }}
          >
            {EXAMPLE_SIGNALS.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={i}
                  custom={4 + i * 0.5}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="p-3.5 flex gap-3"
                  style={{
                    borderBottom: i < EXAMPLE_SIGNALS.length - 1 ? "1px solid var(--border)" : "none",
                    borderLeft: signal.isWarning
                      ? "2px solid #ef4444"
                      : signal.accent
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5 mt-0.5 shrink-0"
                    style={{
                      color: signal.isWarning ? "#ef4444" : signal.accent ? "var(--accent)" : "var(--text-muted)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[11px] flex items-center gap-1.5"
                      style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                    >
                      <span style={{ color: "var(--text-very-muted)" }}>{signal.time}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                        {signal.project}
                      </span>
                    </div>
                    <div
                      className="text-xs mt-0.5 font-medium"
                      style={{
                        color: signal.isWarning ? "#ef4444" : signal.accent ? "var(--accent)" : "var(--text-body)",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {signal.signal}
                    </div>
                    <div
                      className="text-[10.5px] mt-0.5"
                      style={{
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-jetbrains-mono)",
                      }}
                    >
                      {signal.detail}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div
            className="mt-2 text-[10px] text-right"
            style={{
              color: "var(--text-very-muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            AI analytics running every 30 minutes &rarr;
          </div>
        </motion.div>
      </div>
    </section>
  );
}

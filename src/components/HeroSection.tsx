"use client";

import { useState } from "react";
import { Search, Activity, Radio } from "lucide-react";
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

export function HeroSection({ onSearch, projectCount }: HeroSectionProps) {
  const [query, setQuery] = useState("");

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-20">
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
        Sonarbot monitors every project on Base &mdash; price pumps, volume
        spikes, dev activity, holder growth. Watch the ones you care about and
        get Telegram alerts in real time.
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

      {/* Signal Preview */}
      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-10 max-w-lg"
      >
        <div
          className="text-[10px] uppercase tracking-[0.15em] font-medium mb-3"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          Example signal
        </div>
        <div
          className="p-4"
          style={{
            background: "var(--bg-secondary)",
            borderLeft: "2px solid var(--accent)",
            border: "1px solid var(--border)",
            borderLeftWidth: "2px",
            borderLeftColor: "var(--accent)",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            [12:34]&nbsp;
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              BANKRBOT
            </span>
            &nbsp;&mdash;&nbsp;
            <span style={{ color: "var(--accent)" }}>Price up 47%</span>
          </div>
          <div
            className="mt-1 text-[11px] pl-[52px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Market cap surged from $2.1M to $3.1M
          </div>
          <div
            className="mt-0.5 text-[11px] pl-[52px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Correlated: 3 tweets in last hour, GitHub release v2.1
          </div>
          <div
            className="mt-0.5 text-[11px] pl-[52px]"
            style={{ color: "var(--text-muted)" }}
          >
            &rarr; 12 watchers notified
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        custom={5}
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
    </section>
  );
}

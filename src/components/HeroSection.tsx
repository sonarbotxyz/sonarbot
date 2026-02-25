"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Radio } from "lucide-react";

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState("");

  return (
    <section className="sonar-pulse dot-field relative overflow-hidden pb-8 pt-12 sm:pt-16">
      {/* Subtle ambient glow — cyan */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 opacity-30"
        style={{
          width: "600px",
          height: "300px",
          background:
            "radial-gradient(ellipse, rgba(61,215,216,0.1) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-2 text-sm text-text-tertiary"
        >
          <Radio className="h-3.5 w-3.5 text-primary" />
          <span>Powered by on-chain intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-[family-name:var(--font-brand)] text-3xl font-bold tracking-tight text-text-primary sm:text-4xl"
        >
          Discover what&apos;s building on{" "}
          <span className="gradient-text bg-gradient-to-r from-primary to-[#50E5E6]">
            Base
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-base text-text-secondary sm:text-lg"
        >
          Watch projects. Track milestones. Get notified.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6"
        >
          <div className="relative mx-auto max-w-md">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search projects..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="h-12 w-full rounded-xl bg-surface pl-11 pr-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none ring-1 ring-border-subtle transition-all focus:ring-primary/50"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

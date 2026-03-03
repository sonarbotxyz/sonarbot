"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState("");

  return (
    <section className="pt-20 pb-12 md:pt-28 md:pb-16 text-center">
      {/* Section label */}
      <div className="flex items-center justify-center gap-2.5 mb-6">
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
          Discover Base
        </span>
      </div>

      {/* Heading */}
      <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
        <span style={{ color: "var(--text-primary)" }}>
          Intelligence for{" "}
        </span>
        <span style={{ color: "var(--text-secondary)" }}>
          the Base ecosystem
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className="mt-4 text-sm leading-relaxed max-w-[520px] mx-auto"
        style={{ color: "var(--text-secondary)", lineHeight: "1.8" }}
      >
        Discover projects, watch what matters, get notified when milestones
        happen. Your personal radar for everything building on Base.
      </p>

      {/* Search */}
      <div className="relative mt-8 mx-auto max-w-md">
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
      </div>
    </section>
  );
}

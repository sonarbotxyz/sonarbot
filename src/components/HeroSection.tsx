"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState("");

  return (
    <section className="flex items-center justify-between gap-4 pb-5 pt-6">
      <h2 className="font-[family-name:var(--font-brand)] text-xl font-bold text-text-primary">
        Explore
      </h2>

      {/* Compact search */}
      <div className="relative w-56">
        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          className="h-8 w-full rounded-lg bg-surface pl-9 pr-3 text-xs text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-surface-hover"
        />
      </div>
    </section>
  );
}

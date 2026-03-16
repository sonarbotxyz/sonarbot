"use client";

import type { Category } from "@/lib/types";

const categories: { label: string; value: Category | "All" }[] = [
  { label: "All", value: "All" },
  { label: "DeFi", value: "DeFi" },
  { label: "Social", value: "Social" },
  { label: "NFT", value: "NFT" },
  { label: "Infra", value: "Infra" },
  { label: "Gaming", value: "Gaming" },
  { label: "Tools", value: "Tools" },
  { label: "Meme", value: "Meme" },
];

interface CategoryPillsProps {
  selected: Category | "All";
  onSelect: (cat: Category | "All") => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto">
      {categories.map((cat) => {
        const isActive = selected === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            data-hover-badge
            className="shrink-0 px-3 py-1.5 text-[11px] font-mono uppercase transition-all"
            style={{
              letterSpacing: "0.08em",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              border: isActive
                ? "1px solid var(--accent-dim)"
                : "1px solid var(--border)",
              background: isActive ? "var(--accent-glow)" : "transparent",
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

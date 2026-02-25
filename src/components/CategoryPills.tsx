"use client";

import type { Category } from "@/lib/mock-data";

const categories: { label: string; value: Category | "All" }[] = [
  { label: "All", value: "All" },
  { label: "DeFi", value: "DeFi" },
  { label: "Social", value: "Social" },
  { label: "NFT", value: "NFT" },
  { label: "Infra", value: "Infra" },
  { label: "Gaming", value: "Gaming" },
  { label: "Tools", value: "Tools" },
];

interface CategoryPillsProps {
  selected: Category | "All";
  onSelect: (cat: Category | "All") => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="hide-scrollbar flex gap-0.5 overflow-x-auto">
      {categories.map((cat) => {
        const isActive = selected === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            className={`shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              isActive
                ? "bg-surface-hover text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
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
    <div className="hide-scrollbar flex gap-1.5 overflow-x-auto pb-1">
      {categories.map((cat) => {
        const isActive = selected === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="pill-bg"
                className="absolute inset-0 rounded-full bg-border"
                style={{ zIndex: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Layers,
  TrendingUp,
  Users,
  Palette,
  Cpu,
  Gamepad2,
  Wrench,
} from "lucide-react";
import type { Category } from "@/lib/mock-data";

const categories: { label: string; value: Category | "All"; icon: React.ElementType }[] = [
  { label: "All", value: "All", icon: Layers },
  { label: "DeFi", value: "DeFi", icon: TrendingUp },
  { label: "Social", value: "Social", icon: Users },
  { label: "NFT", value: "NFT", icon: Palette },
  { label: "Infra", value: "Infra", icon: Cpu },
  { label: "Gaming", value: "Gaming", icon: Gamepad2 },
  { label: "Tools", value: "Tools", icon: Wrench },
];

interface CategoryPillsProps {
  selected: Category | "All";
  onSelect: (cat: Category | "All") => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {categories.map((cat) => {
        const isActive = selected === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="pill-bg"
                className="absolute inset-0 rounded-full bg-primary-muted"
                style={{ zIndex: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <cat.icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

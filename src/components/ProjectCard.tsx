"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  ChevronUp,
  Flame,
  Sparkles,
  TrendingUp,
  Cpu,
  Gamepad2,
  Wrench,
  Users,
  Palette,
} from "lucide-react";
import type { Project, Category } from "@/lib/mock-data";

const categoryIcons: Record<Category, React.ElementType> = {
  DeFi: TrendingUp,
  Social: Users,
  NFT: Palette,
  Infra: Cpu,
  Gaming: Gamepad2,
  Tools: Wrench,
};

const categoryGradients: Record<Category, { from: string; to: string }> = {
  DeFi: { from: "#3B7BF6", to: "#5B9AFF" },
  Social: { from: "#8B5CF6", to: "#A78BFA" },
  NFT: { from: "#EC4899", to: "#F472B6" },
  Infra: { from: "#00D897", to: "#34D399" },
  Gaming: { from: "#F59E0B", to: "#FBBF24" },
  Tools: { from: "#6B7280", to: "#9CA3AF" },
};

/* Unified cyan glow on hover for all cards */
const CYAN_GLOW = "0 8px 32px rgba(61, 215, 216, 0.18)";
const CARD_SHADOW = "0 2px 8px rgba(4, 8, 40, 0.5)";

interface ProjectCardProps {
  project: Project;
  index?: number;
  featured?: boolean;
}

export function ProjectCard({ project, index = 0, featured = false }: ProjectCardProps) {
  const gradient = categoryGradients[project.category];
  const CategoryIcon = categoryIcons[project.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/project/${project.id}`} className="group block">
        <div
          className={`overflow-hidden rounded-xl bg-surface transition-all duration-300 ease-out group-hover:-translate-y-[3px] group-hover:scale-[1.01] ${
            featured ? "col-span-2 row-span-1" : ""
          }`}
          style={{
            boxShadow: CARD_SHADOW,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = CYAN_GLOW;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = CARD_SHADOW;
          }}
        >
          {/* Banner — 65% of card */}
          <div
            className={`relative flex items-center justify-center overflow-hidden ${
              featured ? "h-56 sm:h-64" : "h-40 sm:h-44"
            }`}
            style={{
              background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}10, transparent)`,
            }}
          >
            {/* Radial glow */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(ellipse at 50% 80%, ${gradient.from}25, transparent 70%)`,
              }}
            />

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `linear-gradient(${gradient.from}60 1px, transparent 1px), linear-gradient(90deg, ${gradient.from}60 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />

            {/* Category icon */}
            <CategoryIcon
              className={`relative z-10 opacity-20 transition-opacity duration-300 group-hover:opacity-30 ${
                featured ? "h-20 w-20" : "h-14 w-14"
              }`}
              style={{ color: gradient.from }}
              strokeWidth={1}
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {project.isHot && (
                <span className="flex items-center gap-1 rounded-full bg-primary-muted px-2.5 py-1 text-xs font-medium text-primary">
                  <Flame className="h-3 w-3" />
                  Hot
                </span>
              )}
              {project.isNew && (
                <span className="flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
                  <Sparkles className="h-3 w-3" />
                  New
                </span>
              )}
            </div>

            {/* Category pill */}
            <div className="absolute top-3 right-3">
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase"
                style={{
                  background: `${gradient.from}15`,
                  color: gradient.from,
                }}
              >
                {project.category}
              </span>
            </div>
          </div>

          {/* Content — 35% of card */}
          <div className={`p-4 ${featured ? "p-5" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  className={`font-[family-name:var(--font-brand)] font-semibold text-text-primary truncate ${
                    featured ? "text-lg" : "text-base"
                  }`}
                >
                  {project.name}
                </h3>
                <p className="mt-0.5 text-sm leading-snug text-text-secondary line-clamp-1">
                  {project.tagline}
                </p>
              </div>
            </div>

            {/* Tag */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="rounded-md bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-text-tertiary">
                {project.subcategory}
              </span>
            </div>

            {/* Metrics row */}
            <div className="mt-3 flex items-center gap-4 border-t border-border-subtle pt-3">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-xs font-medium">
                  {project.upvotes.toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-xs font-medium">
                  {project.watchers.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

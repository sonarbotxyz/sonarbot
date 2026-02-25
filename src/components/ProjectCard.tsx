"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  ChevronUp,
  Flame,
  Sparkles,
} from "lucide-react";
import type { Project, Category } from "@/lib/mock-data";

const categoryGradients: Record<Category, { from: string; to: string }> = {
  DeFi: { from: "#3A6AD0", to: "#5080D8" },
  Social: { from: "#7B55D0", to: "#9575D8" },
  NFT: { from: "#C84585", to: "#D86098" },
  Infra: { from: "#20B880", to: "#40C898" },
  Gaming: { from: "#D89018", to: "#E0A838" },
  Tools: { from: "#606870", to: "#808890" },
};

const CARD_SHADOW = "0 2px 8px rgba(0, 0, 0, 0.25)";
const CARD_HOVER_SHADOW = "0 8px 24px rgba(0, 0, 0, 0.35)";

interface ProjectCardProps {
  project: Project;
  index?: number;
  featured?: boolean;
}

export function ProjectCard({ project, index = 0, featured = false }: ProjectCardProps) {
  const gradient = categoryGradients[project.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/project/${project.id}`} className="group block">
        <div
          className={`overflow-hidden rounded-xl bg-surface transition-all duration-300 ease-out group-hover:-translate-y-[3px] ${
            featured ? "col-span-2 row-span-1" : ""
          }`}
          style={{
            boxShadow: CARD_SHADOW,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = CARD_HOVER_SHADOW;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = CARD_SHADOW;
          }}
        >
          {/* Banner — clean gradient, no icons */}
          <div
            className={`relative overflow-hidden ${
              featured ? "h-56 sm:h-64" : "h-36 sm:h-40"
            }`}
            style={{
              background: `linear-gradient(135deg, ${gradient.from}14, ${gradient.to}0a, transparent)`,
            }}
          >
            {/* Subtle radial glow */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse at 50% 80%, ${gradient.from}18, transparent 70%)`,
              }}
            />

            {/* Badges — top-left, small and subtle */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {project.isHot && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Flame className="h-2.5 w-2.5" />
                  Hot
                </span>
              )}
              {project.isNew && (
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  <Sparkles className="h-2.5 w-2.5" />
                  New
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={`p-5 ${featured ? "p-6" : ""}`}>
            <h3
              className={`font-[family-name:var(--font-brand)] font-semibold text-text-primary truncate ${
                featured ? "text-lg" : "text-base"
              }`}
            >
              {project.name}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary line-clamp-2">
              {project.tagline}
            </p>

            {/* Bottom row: category pill + metrics */}
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-full bg-border px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-text-secondary uppercase">
                {project.category}
              </span>
              <span className="flex items-center gap-1 text-text-secondary">
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-xs font-medium">
                  {project.upvotes.toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-1 text-text-tertiary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-xs">
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

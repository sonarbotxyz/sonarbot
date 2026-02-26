"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronUp, Flame, Star } from "lucide-react";
import type { Project, Category } from "@/lib/mock-data";

const categoryGradients: Record<Category, { from: string; via: string; to: string }> = {
  DeFi: { from: "#2A5DC4", via: "#1A3D94", to: "#0A1D64" },
  Social: { from: "#6B45C0", via: "#4B2590", to: "#2B0560" },
  NFT: { from: "#B83575", via: "#882050", to: "#580A30" },
  Infra: { from: "#18A870", via: "#0A7848", to: "#004828" },
  Gaming: { from: "#C88018", via: "#986010", to: "#684008" },
  Tools: { from: "#505860", via: "#383E48", to: "#202428" },
};

interface ProjectCardProps {
  project: Project;
  index?: number;
  featured?: boolean;
}

export function ProjectCard({ project, index = 0, featured = false }: ProjectCardProps) {
  const gradient = categoryGradients[project.category];

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="row-span-2"
      >
        <Link href={`/project/${project.id}`} className="group block h-full">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-surface transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
            {/* Featured banner — warm amber/gold gradient */}
            <div
              className="relative flex-1 min-h-0 overflow-hidden"
              style={{
                background: `linear-gradient(160deg, #C8940A 0%, #A87808 30%, #785008 70%, #483008 100%)`,
              }}
            >
              {/* Featured badge */}
              <div className="absolute top-3 left-3">
                <span className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/90 uppercase backdrop-blur-sm">
                  <Star className="h-2.5 w-2.5" />
                  Featured
                </span>
              </div>

              {/* Hot badge */}
              {project.isHot && (
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                    <Flame className="h-2.5 w-2.5" />
                    Hot
                  </span>
                </div>
              )}
            </div>

            {/* Content — richer for featured */}
            <div className="p-4">
              <h3 className="font-[family-name:var(--font-brand)] text-[15px] font-bold text-text-primary truncate">
                {project.name}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary line-clamp-3">
                {project.tagline}
              </p>

              {/* Action row */}
              <div className="mt-3 flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-text-secondary">
                  <ChevronUp className="h-3 w-3" />
                  <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium">
                    {project.upvotes.toLocaleString()}
                  </span>
                </span>
                <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {project.category}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/project/${project.id}`} className="group block">
        <div className="overflow-hidden rounded-2xl bg-surface transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
          {/* Banner — 75% of card, saturated category gradient */}
          <div
            className="relative h-44 overflow-hidden sm:h-48"
            style={{
              background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.via} 50%, ${gradient.to} 100%)`,
            }}
          >
            {/* Badges */}
            {project.isHot && (
              <div className="absolute top-3 left-3">
                <span className="flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                  <Flame className="h-2.5 w-2.5" />
                  Hot
                </span>
              </div>
            )}
          </div>

          {/* Content — compact bottom 25% */}
          <div className="p-3.5">
            <h3 className="font-[family-name:var(--font-brand)] text-[15px] font-bold text-text-primary truncate">
              {project.name}
            </h3>
            <p className="mt-0.5 text-[13px] text-text-secondary truncate">
              {project.tagline}
            </p>

            {/* Action row: upvote pill + category tag */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-text-secondary">
                <ChevronUp className="h-3 w-3" />
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium">
                  {project.upvotes.toLocaleString()}
                </span>
              </span>
              <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
                {project.category}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

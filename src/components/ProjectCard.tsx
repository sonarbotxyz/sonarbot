"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronUp, Flame, Star, Eye } from "lucide-react";
import type { Project, Category } from "@/lib/mock-data";

const categoryColors: Record<Category, string> = {
  DeFi: "#2A5DC4",
  Social: "#6B45C0",
  NFT: "#B83575",
  Infra: "#18A870",
  Gaming: "#C88018",
  Tools: "#505860",
};

/** Get an image URL: logo_url > twitter avatar */
function getProjectImage(project: Project): string {
  if (project.logoUrl) return project.logoUrl;
  if (project.twitterHandle) {
    return `https://unavatar.io/twitter/${project.twitterHandle}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name)}&background=1C1D27&color=fff&size=128`;
}

interface ProjectCardProps {
  project: Project;
  index?: number;
  featured?: boolean;
}

export function ProjectCard({ project, index = 0, featured = false }: ProjectCardProps) {
  const imageUrl = getProjectImage(project);
  const accentColor = categoryColors[project.category];

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
          <div className="relative flex h-full flex-col items-center overflow-hidden rounded-2xl bg-surface pt-8 pb-0 transition-transform duration-300 ease-out group-hover:-translate-y-1"
            style={{ borderBottom: `2px solid ${accentColor}` }}
          >
            {/* Featured badge */}
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-400 uppercase">
                <Star className="h-2.5 w-2.5" />
                Featured
              </span>
            </div>

            {project.isHot && (
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                  <Flame className="h-2.5 w-2.5" />
                  Hot
                </span>
              </div>
            )}

            {/* Circular avatar */}
            <div className="relative mt-2">
              <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/10 shadow-lg">
                <img
                  src={imageUrl}
                  alt={project.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Name + tagline */}
            <div className="mt-4 px-4 text-center flex-1">
              <h3 className="font-[family-name:var(--font-brand)] text-[16px] font-bold text-text-primary truncate">
                {project.name}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary line-clamp-3">
                {project.tagline}
              </p>

              {/* Category pill */}
              <div className="mt-3">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {project.category}
                </span>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="mt-auto w-full border-t border-white/5 px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-[12px] font-medium">
                  {project.upvotes.toLocaleString()}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-text-tertiary">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-[11px]">
                  {project.watchers}
                </span>
              </span>
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
        <div
          className="relative flex flex-col items-center overflow-hidden rounded-2xl bg-surface pt-6 pb-0 transition-transform duration-300 ease-out group-hover:-translate-y-1"
          style={{ borderBottom: `2px solid ${accentColor}` }}
        >
          {/* Badges */}
          {project.isHot && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                <Flame className="h-2.5 w-2.5" />
                Hot
              </span>
            </div>
          )}

          {project.isNew && (
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                New
              </span>
            </div>
          )}

          {/* Circular avatar */}
          <div className="relative">
            <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-white/10 shadow-lg">
              <img
                src={imageUrl}
                alt={project.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Name + tagline */}
          <div className="mt-3 px-4 text-center">
            <h3 className="font-[family-name:var(--font-brand)] text-[15px] font-bold text-text-primary truncate max-w-full">
              {project.name}
            </h3>
            <p className="mt-1 text-[12px] text-text-secondary line-clamp-2 leading-relaxed">
              {project.tagline}
            </p>

            {/* Category pill */}
            <div className="mt-2.5">
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                {project.category}
              </span>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="mt-4 w-full border-t border-white/5 px-4 py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <ChevronUp className="h-3.5 w-3.5" />
              <span className="font-[family-name:var(--font-mono)] text-[12px] font-medium">
                {project.upvotes.toLocaleString()}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-text-tertiary">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-[family-name:var(--font-mono)] text-[11px]">
                {project.watchers}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

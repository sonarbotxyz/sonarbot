"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronUp, Eye, Flame, Sparkles } from "lucide-react";
import type { Project, Category } from "@/lib/mock-data";

/* ─── CATEGORY DESIGN SYSTEM ─── */
/* Each category gets a carefully crafted mesh gradient + accent color */

interface CategoryStyle {
  accent: string;
  /** Mesh gradient: multiple radials layered for depth */
  mesh: string;
  /** Subtle overlay for when screenshot is present */
  overlay: string;
}

const categoryStyles: Record<Category, CategoryStyle> = {
  DeFi: {
    accent: "#2563EB",
    mesh: `
      radial-gradient(ellipse 80% 50% at 20% 80%, rgba(37,99,235,0.35) 0%, transparent 70%),
      radial-gradient(ellipse 60% 80% at 80% 20%, rgba(99,102,241,0.25) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, rgba(15,23,42,1) 0%, rgba(15,23,42,1) 100%)
    `,
    overlay: "rgba(37,99,235,0.08)",
  },
  Social: {
    accent: "#7C3AED",
    mesh: `
      radial-gradient(ellipse 70% 60% at 80% 80%, rgba(124,58,237,0.35) 0%, transparent 70%),
      radial-gradient(ellipse 80% 50% at 10% 30%, rgba(167,139,250,0.2) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, rgba(15,15,30,1) 0%, rgba(15,15,30,1) 100%)
    `,
    overlay: "rgba(124,58,237,0.08)",
  },
  NFT: {
    accent: "#DB2777",
    mesh: `
      radial-gradient(ellipse 60% 70% at 70% 70%, rgba(219,39,119,0.3) 0%, transparent 70%),
      radial-gradient(ellipse 80% 40% at 20% 20%, rgba(244,114,182,0.2) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, rgba(20,12,18,1) 0%, rgba(20,12,18,1) 100%)
    `,
    overlay: "rgba(219,39,119,0.08)",
  },
  Infra: {
    accent: "#059669",
    mesh: `
      radial-gradient(ellipse 70% 60% at 30% 80%, rgba(5,150,105,0.3) 0%, transparent 70%),
      radial-gradient(ellipse 50% 80% at 80% 10%, rgba(52,211,153,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, rgba(10,20,18,1) 0%, rgba(10,20,18,1) 100%)
    `,
    overlay: "rgba(5,150,105,0.08)",
  },
  Gaming: {
    accent: "#D97706",
    mesh: `
      radial-gradient(ellipse 60% 60% at 80% 70%, rgba(217,119,6,0.3) 0%, transparent 70%),
      radial-gradient(ellipse 70% 50% at 10% 30%, rgba(251,191,36,0.15) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, rgba(20,16,10,1) 0%, rgba(20,16,10,1) 100%)
    `,
    overlay: "rgba(217,119,6,0.08)",
  },
  Tools: {
    accent: "#64748B",
    mesh: `
      radial-gradient(ellipse 80% 50% at 20% 70%, rgba(100,116,139,0.25) 0%, transparent 70%),
      radial-gradient(ellipse 60% 70% at 80% 30%, rgba(148,163,184,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 100% 100% at 50% 50%, rgba(15,16,20,1) 0%, rgba(15,16,20,1) 100%)
    `,
    overlay: "rgba(100,116,139,0.06)",
  },
};

/** Inline SVG noise texture as data URI — very subtle grain */
const noiseFilter = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

function getAvatar(project: Project): string {
  if (project.twitterHandle) return `https://unavatar.io/twitter/${project.twitterHandle}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name)}&background=1C1D27&color=fff&size=64`;
}

function getProductImage(project: Project): string | null {
  if (project.website) {
    const cleanUrl = project.website.startsWith("http") ? project.website : `https://${project.website}`;
    return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800&type=png`;
  }
  return null;
}

interface ProjectCardProps {
  project: Project;
  index?: number;
  featured?: boolean;
}

export function ProjectCard({ project, index = 0, featured = false }: ProjectCardProps) {
  const style = categoryStyles[project.category];
  const avatar = getAvatar(project);
  const productImage = getProductImage(project);

  /* ─── FEATURED / PROMOTED CARD ─── */
  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="row-span-2"
      >
        <Link href={`/project/${project.id}`} className="group block h-full">
          <div className="relative flex h-full flex-col overflow-hidden rounded-2xl transition-transform duration-300 ease-out group-hover:-translate-y-1"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 30% 20%, rgba(61,215,216,0.4) 0%, transparent 60%),
                radial-gradient(ellipse 60% 80% at 80% 80%, rgba(61,215,216,0.2) 0%, transparent 50%),
                radial-gradient(ellipse 100% 100% at 50% 50%, rgba(8,18,56,1) 0%, rgba(8,18,56,1) 100%)
              `,
            }}
          >
            {/* Noise texture */}
            <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: noiseFilter, backgroundSize: "128px 128px" }} />

            {/* Promoted badge */}
            <div className="relative flex items-center gap-2 px-4 pt-4">
              <span className="flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white/90 uppercase backdrop-blur-sm border border-white/5">
                <Sparkles className="h-3 w-3" />
                Promoted
              </span>
            </div>

            {/* Avatar + Name */}
            <div className="relative flex items-center gap-3 px-4 pt-4">
              <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white/15 shadow-lg">
                <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-brand)] text-[18px] font-bold text-white truncate">{project.name}</h3>
                <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">{project.category}</span>
              </div>
            </div>

            {/* Tagline */}
            <div className="relative px-4 pt-3">
              <p className="text-[14px] leading-relaxed text-white/70 line-clamp-3">{project.tagline}</p>
            </div>

            {/* Product screenshot */}
            <div className="relative mx-4 mt-4 flex-1 min-h-0">
              <div className="h-full min-h-[140px] w-full overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/5">
                {productImage ? (
                  <img src={productImage} alt={`${project.name} preview`} className="h-full w-full object-cover object-top" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="flex h-full items-center justify-center"><p className="text-[13px] text-white/20">Preview</p></div>
                )}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="relative mt-auto px-4 py-3.5 flex items-center gap-3 border-t border-white/5">
              <button className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-white/90 transition-colors hover:bg-white/20 backdrop-blur-sm border border-white/5"
                onClick={(e) => e.preventDefault()}>
                <ChevronUp className="h-4 w-4" />
                <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold">{project.upvotes.toLocaleString()}</span>
              </button>
              <span className="flex items-center gap-1 text-white/40">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-[11px]">{project.watchers}</span>
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  /* ─── REGULAR CARD ─── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/project/${project.id}`} className="group block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-surface transition-transform duration-300 ease-out group-hover:-translate-y-1">

          {/* TOP ROW — Avatar + Name + Category */}
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
            <div className="h-9 w-9 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-white/10">
              <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <h3 className="flex-1 font-[family-name:var(--font-brand)] text-[14px] font-bold text-text-primary truncate">{project.name}</h3>
            <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: `${style.accent}18`, color: style.accent }}>
              {project.category}
            </span>
            {project.isHot && (
              <span className="flex-shrink-0 flex items-center gap-0.5 rounded-full bg-red-500/12 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                <Flame className="h-2.5 w-2.5" />
              </span>
            )}
          </div>

          {/* MIDDLE — Product screenshot on mesh gradient */}
          <div className="mx-3 flex-1 min-h-0">
            <div className="relative h-40 w-full overflow-hidden rounded-xl sm:h-44" style={{ background: style.mesh }}>
              {/* Noise texture overlay */}
              <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: noiseFilter, backgroundSize: "128px 128px" }} />

              {productImage ? (
                <img src={productImage} alt={`${project.name} preview`}
                  className="relative h-full w-full object-cover object-top"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="relative flex h-full items-center justify-center px-6">
                  <p className="text-center text-[13px] leading-relaxed text-white/30 line-clamp-3">{project.tagline}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tagline */}
          <div className="px-4 pt-2.5">
            <p className="text-[12px] text-text-secondary line-clamp-2 leading-relaxed">{project.tagline}</p>
          </div>

          {/* BOTTOM BAR */}
          <div className="mt-auto px-4 py-3 flex items-center gap-3">
            <button className="flex items-center gap-1 rounded-lg bg-surface-hover px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-primary/12 hover:text-primary"
              onClick={(e) => e.preventDefault()}>
              <ChevronUp className="h-3.5 w-3.5" />
              <span className="font-[family-name:var(--font-mono)] text-[12px] font-medium">{project.upvotes.toLocaleString()}</span>
            </button>
            <span className="flex items-center gap-1 text-text-tertiary">
              <Eye className="h-3 w-3" />
              <span className="font-[family-name:var(--font-mono)] text-[11px]">{project.watchers}</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

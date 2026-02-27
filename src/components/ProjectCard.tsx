"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronUp, Eye, Flame, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import type { Project } from "@/lib/mock-data";
import { HealthScore } from "@/components/HealthScore";
import { MiniSparkline } from "@/components/charts/MiniSparkline";

function getAvatar(project: Project): string {
  if (project.logoUrl) return project.logoUrl;
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

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

interface ProjectCardProps {
  project: Project;
  index?: number;
  featured?: boolean;
}

export function ProjectCard({ project, index = 0, featured = false }: ProjectCardProps) {
  const avatar = getAvatar(project);
  const productImage = getProductImage(project);

  const score = project.healthScore ?? null;
  const volume24h = useMemo(() => {
    if (project.latestSnapshot) return project.latestSnapshot.volume_24h;
    return 0;
  }, [project.latestSnapshot]);

  const { holderTrend, holderSparkline } = useMemo(() => {
    const snaps = project.recentSnapshots ?? [];
    if (snaps.length < 2) return { holderTrend: 0, holderSparkline: [] as number[] };
    const first = snaps[0].holders;
    const last = snaps[snaps.length - 1].holders;
    const trend = first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0;
    const step = Math.max(1, Math.floor(snaps.length / 7));
    const sparkline: number[] = [];
    for (let i = 0; i < snaps.length; i += step) {
      sparkline.push(snaps[i].holders);
    }
    if (sparkline[sparkline.length - 1] !== last) sparkline.push(last);
    return { holderTrend: trend, holderSparkline: sparkline };
  }, [project.recentSnapshots]);

  const hasAnalytics = score !== null || volume24h > 0 || holderSparkline.length > 0;

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
          <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-[#13141B] border-l-2 border-[#3DD7D8] transition-transform duration-300 ease-out group-hover:-translate-y-1">

            <div className="relative flex items-center justify-between px-4 pt-4">
              <span className="flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white/90 uppercase backdrop-blur-sm border border-white/5">
                <Sparkles className="h-3 w-3" /> Promoted
              </span>
              {score !== null && <HealthScore score={score} size="sm" />}
            </div>

            <div className="relative flex items-center gap-3 px-4 pt-4">
              <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white/15 shadow-lg">
                <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-brand)] text-[18px] font-bold text-[#E8E8ED] truncate">{project.name}</h3>
                <span className="text-[11px] font-medium text-[#8B8B9E] uppercase tracking-wide">{project.category}</span>
              </div>
            </div>

            <div className="relative px-4 pt-3">
              <p className="text-[14px] leading-relaxed text-[#8B8B9E] line-clamp-3">{project.tagline}</p>
            </div>

            <div className="relative mx-4 mt-4 flex-1 min-h-0">
              <div className="h-full min-h-[140px] w-full overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/5">
                {productImage ? (
                  <img src={productImage} alt={`${project.name} preview`} className="h-full w-full object-cover object-top" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="flex h-full items-center justify-center"><p className="text-[13px] text-[#52526B]">Preview</p></div>
                )}
              </div>
            </div>

            <div className="relative mt-auto px-4 py-3.5 flex items-center gap-3 border-t border-white/5">
              <button className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[#E8E8ED] transition-colors hover:bg-white/20 border border-white/5"
                onClick={(e) => e.preventDefault()}>
                <ChevronUp className="h-4 w-4" />
                <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold">{project.upvotes.toLocaleString()}</span>
              </button>
              <span className="flex items-center gap-1 text-[#52526B]">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-[family-name:var(--font-mono)] text-[11px]">{project.watchers}</span>
              </span>
              {volume24h > 0 && (
                <span className="ml-auto font-[family-name:var(--font-mono)] text-[11px] text-[#52526B]">
                  Vol {formatCompact(volume24h)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  /* ─── REGULAR CARD ─── */
  const isHolderUp = holderTrend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/project/${project.id}`} className="group block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#13141B] transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:bg-[#1A1B23]">

          {/* TOP ROW */}
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
            <div className="h-9 w-9 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-white/10">
              <img src={avatar} alt={project.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <h3 className="flex-1 font-[family-name:var(--font-brand)] text-[14px] font-bold text-[#E8E8ED] truncate">{project.name}</h3>
            <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#3DD7D8]/12 text-[#3DD7D8]">
              {project.category}
            </span>
            {project.isHot && (
              <span className="flex-shrink-0 flex items-center gap-0.5 rounded-full bg-[#EF4444]/12 px-1.5 py-0.5 text-[10px] font-medium text-[#EF4444]">
                <Flame className="h-2.5 w-2.5" />
              </span>
            )}
            {score !== null && <HealthScore score={score} size="sm" />}
          </div>

          {/* MIDDLE — screenshot on flat dark bg */}
          <div className="mx-3 flex-1 min-h-0">
            <div className="relative h-40 w-full overflow-hidden rounded-xl bg-[#0A0A0F] sm:h-44">
              {productImage ? (
                <img src={productImage} alt={`${project.name} preview`}
                  className="relative h-full w-full object-cover object-top" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="relative flex h-full items-center justify-center px-6">
                  <p className="text-center text-[13px] leading-relaxed text-[#52526B] line-clamp-3">{project.tagline}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tagline + Trend */}
          <div className="px-4 pt-2.5">
            <p className="text-[12px] text-[#8B8B9E] line-clamp-2 leading-relaxed">{project.tagline}</p>
            {hasAnalytics && (
              <div className="mt-1.5 flex items-center gap-2">
                {holderSparkline.length >= 2 && (
                  <>
                    <span className={`flex items-center gap-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${isHolderUp ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {isHolderUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {isHolderUp ? "+" : ""}{holderTrend.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-[#52526B]">holders</span>
                    <MiniSparkline data={holderSparkline} color={isHolderUp ? "#22C55E" : "#EF4444"} width={48} height={16} />
                  </>
                )}
                {volume24h > 0 && (
                  <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[#52526B]">
                    Vol {formatCompact(volume24h)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM BAR */}
          <div className="mt-auto px-4 py-3 flex items-center gap-3">
            <button className="flex items-center gap-1 rounded-lg bg-[#1A1B23] px-2.5 py-1.5 text-[#8B8B9E] transition-colors hover:bg-[#3DD7D8]/12 hover:text-[#3DD7D8]"
              onClick={(e) => e.preventDefault()}>
              <ChevronUp className="h-3.5 w-3.5" />
              <span className="font-[family-name:var(--font-mono)] text-[12px] font-medium">{project.upvotes.toLocaleString()}</span>
            </button>
            <span className="flex items-center gap-1 text-[#52526B]">
              <Eye className="h-3 w-3" />
              <span className="font-[family-name:var(--font-mono)] text-[11px]">{project.watchers}</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

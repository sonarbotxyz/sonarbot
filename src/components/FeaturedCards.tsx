"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/mock-data";
import { CATEGORY_COLORS } from "@/lib/mock-data";

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface FeaturedCardsProps {
  projects: Project[];
}

export function FeaturedCards({ projects }: FeaturedCardsProps) {
  const featured = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const scoreA = a.healthScore ?? 0;
        const scoreB = b.healthScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.watchers - a.watchers;
      })
      .slice(0, 3);
  }, [projects]);

  if (featured.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="font-mono text-[13px] font-bold"
          style={{ color: "var(--accent)" }}
        >
          &gt;
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.12em] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Featured
        </span>
      </div>

      {/* Cards grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ background: "var(--border)", gap: "1px" }}
      >
        {featured.map((project, i) => (
          <FeaturedCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ project, index }: { project: Project; index: number }) {
  const { marketcap, holders, volume24h, holderTrend } = useMemo(() => {
    const snap = project.latestSnapshot;
    const snaps = project.recentSnapshots ?? [];
    let trend = 0;
    if (snaps.length >= 2) {
      const first = snaps[0].holders;
      const last = snaps[snaps.length - 1].holders;
      trend = first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0;
    }
    return {
      marketcap: snap?.marketcap ?? 0,
      holders: snap?.holders ?? 0,
      volume24h: snap?.volume_24h ?? 0,
      holderTrend: trend,
    };
  }, [project.latestSnapshot, project.recentSnapshots]);

  const isUp = holderTrend >= 0;
  const categoryColor = CATEGORY_COLORS[project.category]?.from ?? "#FFFFFF";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/project/${project.id}`}
        className="featured-card block no-underline"
      >
        <div
          className="flex flex-col transition-all duration-300"
          style={{
            background: "#1652F0",
          }}
        >
          {/* Header: category + score */}
          <div
            className="flex h-[30px] items-center justify-between px-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center text-[9px] tracking-[0.12em] uppercase px-1.5 py-px"
                style={{
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                {project.category}
              </span>
              <span
                className="text-[8px] tracking-[0.1em] uppercase"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {project.subcategory}
              </span>
            </div>
            {project.healthScore != null && (
              <span
                className="font-mono text-[10px] font-bold"
                style={{
                  color: "#FFFFFF",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {project.healthScore}
              </span>
            )}
          </div>

          {/* Logo + name + tagline */}
          <div className="flex items-center gap-3 px-3.5 py-3">
            {project.logoUrl ? (
              <div
                className="relative h-9 w-9 shrink-0 overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <Image
                  src={project.logoUrl}
                  alt={project.name}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center font-mono text-[13px] font-bold uppercase"
                style={{
                  background: categoryColor,
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {project.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3
                className="font-display text-[14px] font-semibold leading-tight"
                style={{ color: "#FFFFFF", letterSpacing: "-0.02em" }}
              >
                {project.name}
              </h3>
              <p
                className="mt-0.5 text-[10px] leading-snug line-clamp-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {project.tagline}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="grid h-[40px] grid-cols-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            {[
              { label: "MCap", value: marketcap, fmt: formatCompact },
              { label: "Holders", value: holders, fmt: formatNumber },
              { label: "Vol 24h", value: volume24h, fmt: formatCompact },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="px-2.5 py-1"
                style={{
                  borderRight:
                    i < 2 ? "1px solid rgba(255,255,255,0.12)" : undefined,
                }}
              >
                <span
                  className="text-[7px] uppercase tracking-[0.15em] block"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {stat.label}
                </span>
                <span
                  className="font-mono text-[11px] font-semibold block"
                  style={{
                    color: stat.value > 0 ? "#FFFFFF" : "rgba(255,255,255,0.3)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stat.value > 0 ? stat.fmt(stat.value) : "\u2014"}
                </span>
              </div>
            ))}
          </div>

          {/* Footer: trend + watchers */}
          <div
            className="flex h-[28px] items-center justify-between px-3.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <span
              className="inline-flex items-center gap-0.5 font-mono text-[9px] font-semibold"
              style={{
                color: isUp ? "#86EFAC" : "#FCA5A5",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {isUp ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              {isUp ? "+" : ""}
              {holderTrend.toFixed(1)}%
            </span>
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1 text-[9px]"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <Eye className="h-2.5 w-2.5" /> {project.watchers.toLocaleString()}
              </span>
              <ArrowRight
                className="h-3 w-3 transition-all duration-300"
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

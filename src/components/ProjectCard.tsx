"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Eye,
  Flame,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { Project } from "@/lib/mock-data";
import { CATEGORY_COLORS } from "@/lib/mock-data";
import { HealthScore } from "@/components/HealthScore";
import { MiniSparkline } from "@/components/charts/MiniSparkline";

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

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({
  project,
  index = 0,
}: ProjectCardProps) {
  const score = project.healthScore ?? null;

  const { marketcap, liquidity, volume24h, holders } = useMemo(() => {
    const snap = project.latestSnapshot;
    return {
      marketcap: snap?.marketcap ?? 0,
      liquidity: snap?.liquidity ?? 0,
      volume24h: snap?.volume_24h ?? 0,
      holders: snap?.holders ?? 0,
    };
  }, [project.latestSnapshot]);

  const { holderTrend, holderSparkline, mcapSparkline } = useMemo(() => {
    const snaps = project.recentSnapshots ?? [];
    if (snaps.length < 2)
      return {
        holderTrend: 0,
        holderSparkline: [] as number[],
        mcapSparkline: [] as number[],
      };
    const first = snaps[0].holders;
    const last = snaps[snaps.length - 1].holders;
    const trend =
      first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0;
    const step = Math.max(1, Math.floor(snaps.length / 7));
    const hSpark: number[] = [];
    const mSpark: number[] = [];
    for (let i = 0; i < snaps.length; i += step) {
      hSpark.push(snaps[i].holders);
      mSpark.push(snaps[i].marketcap);
    }
    if (hSpark[hSpark.length - 1] !== last) {
      hSpark.push(last);
      mSpark.push(snaps[snaps.length - 1].marketcap);
    }
    return {
      holderTrend: trend,
      holderSparkline: hSpark,
      mcapSparkline: mSpark,
    };
  }, [project.recentSnapshots]);

  const cardNumber = String(index + 1).padStart(3, "0");
  const isHolderUp = holderTrend >= 0;
  const sparkData =
    mcapSparkline.some((v) => v > 0) && mcapSparkline.length >= 2
      ? mcapSparkline
      : holderSparkline;
  const sparkColor = isHolderUp ? "#22C55E" : "#EF4444";

  const stats = [
    { label: "MCap", value: marketcap, currency: true },
    { label: "Liq", value: liquidity, currency: true },
    { label: "Holders", value: holders, currency: false },
    { label: "Vol", value: volume24h, currency: true },
  ];

  const categoryColor = CATEGORY_COLORS[project.category]?.from ?? "var(--accent)";

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.35,
        delay: index * 0.03,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={`/project/${project.id}`} className="guide-card block h-full">
        <div
          className="flex h-full flex-col transition-all duration-300"
          style={{
            background: "var(--bg-primary)",
          }}
        >
          {/* ── Header: number + category ── */}
          <div
            className="flex h-[32px] shrink-0 items-center justify-between px-3.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[9px] tracking-[0.15em]"
                style={{
                  color: "var(--text-very-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {cardNumber}
              </span>
              <span
                className="inline-flex items-center text-[9px] tracking-[0.12em] uppercase px-1.5 py-px"
                style={{
                  color: "var(--accent)",
                  border: "1px solid var(--accent-dim)",
                  background: "var(--accent-glow)",
                }}
              >
                {project.category}
              </span>
              <span
                className="text-[8px] tracking-[0.1em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                {project.subcategory}
              </span>
              {project.isHot && (
                <Flame className="h-2.5 w-2.5" style={{ color: "#EF4444" }} />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {project.website && (
                <ExternalLink
                  className="h-2.5 w-2.5"
                  style={{ color: "var(--text-very-muted)" }}
                />
              )}
              {score !== null && <HealthScore score={score} size="sm" />}
            </div>
          </div>

          {/* ── Title + tagline (flex-1 absorbs height differences) ── */}
          <div className="flex min-h-[72px] flex-1 flex-col justify-center px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              {/* Project logo / avatar */}
              {project.logoUrl ? (
                <div
                  className="relative h-8 w-8 shrink-0 overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <Image
                    src={project.logoUrl}
                    alt={project.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center font-mono text-[13px] font-bold uppercase"
                  style={{
                    background: categoryColor,
                    color: "#FFFFFF",
                    border: "1px solid var(--border)",
                  }}
                >
                  {project.name.charAt(0)}
                </div>
              )}
              <h3
                className="font-display text-[15px] font-semibold leading-tight"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {project.name}
              </h3>
            </div>
            <p
              className="mt-1.5 text-[11px] leading-snug line-clamp-2"
              style={{
                color: "var(--text-secondary)",
                lineHeight: "1.5",
                minHeight: "33px",
              }}
            >
              {project.tagline}
            </p>
          </div>

          {/* ── Stats grid — 4 columns, compact ── */}
          <div
            className="grid h-[44px] shrink-0 grid-cols-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="px-2.5 py-1.5"
                style={{
                  borderRight:
                    i < 3 ? "1px solid var(--border)" : undefined,
                }}
              >
                <span
                  className="text-[7px] uppercase tracking-[0.15em] block mb-0.5"
                  style={{ color: "var(--text-very-muted)" }}
                >
                  {stat.label}
                </span>
                <span
                  className="font-mono text-[11px] font-semibold block"
                  style={{
                    color:
                      stat.value > 0
                        ? "var(--text-primary)"
                        : "var(--text-very-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stat.value > 0
                    ? stat.currency
                      ? formatCompact(stat.value)
                      : formatNumber(stat.value)
                    : "\u2014"}
                </span>
              </div>
            ))}
          </div>

          {/* ── Sparkline + trend + watchers (fixed footer) ── */}
          <div
            className="flex h-[30px] shrink-0 items-center justify-between px-3.5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              {sparkData.length >= 2 ? (
                <>
                  <span
                    className={`flex items-center gap-0.5 font-mono text-[9px] font-semibold ${
                      isHolderUp ? "text-success" : "text-danger"
                    }`}
                  >
                    {isHolderUp ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {isHolderUp ? "+" : ""}
                    {holderTrend.toFixed(1)}%
                  </span>
                  <MiniSparkline
                    data={sparkData}
                    color={sparkColor}
                    width={56}
                    height={16}
                  />
                </>
              ) : (
                <span
                  className="font-mono text-[9px]"
                  style={{ color: "var(--text-very-muted)" }}
                >
                  —
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1 text-[9px]"
                style={{ color: "var(--text-muted)" }}
              >
                <Eye className="h-2.5 w-2.5" /> {project.watchers.toLocaleString()}
              </span>
              <ArrowRight
                className="card-arrow h-3 w-3 transition-all duration-300"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
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
  featured?: boolean;
}

export function ProjectCard({
  project,
  index = 0,
  featured = false,
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
    { label: featured ? "Market Cap" : "MCap", value: marketcap, currency: true },
    { label: featured ? "Liquidity" : "Liq", value: liquidity, currency: true },
    { label: "Holders", value: holders, currency: false },
    { label: featured ? "Vol 24H" : "Vol", value: volume24h, currency: true },
  ];

  /* ─── FEATURED GUIDE-CARD ─── */
  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="col-span-full"
      >
        <Link href={`/project/${project.id}`} className="guide-card block">
          <div
            className="flex flex-col transition-all duration-300"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
            }}
          >
            {/* ── Header bar ── */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] tracking-[0.15em]"
                  style={{
                    color: "var(--text-very-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {cardNumber}
                </span>
                <span
                  className="inline-flex items-center text-[10px] tracking-[0.12em] uppercase px-2.5 py-1"
                  style={{
                    color: "var(--accent)",
                    border: "1px solid var(--accent-dim)",
                    background: "var(--accent-glow)",
                  }}
                >
                  {project.category}
                </span>
                <span
                  className="text-[10px] tracking-[0.1em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {project.subcategory}
                </span>
                {project.isHot && (
                  <span
                    className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em]"
                    style={{ color: "var(--danger, #EF4444)" }}
                  >
                    <Flame className="h-3 w-3" /> HOT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {project.website && (
                  <ExternalLink
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--text-muted)" }}
                  />
                )}
                {score !== null && <HealthScore score={score} size="sm" />}
              </div>
            </div>

            {/* ── Title section ── */}
            <div className="px-6 pt-5 pb-4">
              <h3
                className="font-display text-2xl font-semibold leading-snug"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {project.name}
              </h3>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}
              >
                {project.tagline}
              </p>
            </div>

            {/* ── Stats grid — 4 columns ── */}
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="px-6 py-4"
                  style={{
                    borderRight:
                      i < 3 ? "1px solid var(--border)" : undefined,
                    borderBottom:
                      i < 2 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  <span
                    className="text-[9px] uppercase tracking-[0.15em] block mb-1.5"
                    style={{ color: "var(--text-very-muted)" }}
                  >
                    {stat.label}
                  </span>
                  <span
                    className="font-mono text-lg font-bold block"
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

            {/* ── Sparkline + holder trend ── */}
            {sparkData.length >= 2 && (
              <div
                className="flex items-center justify-between px-6 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[9px] uppercase tracking-[0.15em]"
                    style={{ color: "var(--text-very-muted)" }}
                  >
                    7D Trend
                  </span>
                  <span
                    className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${
                      isHolderUp ? "text-success" : "text-danger"
                    }`}
                  >
                    {isHolderUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isHolderUp ? "+" : ""}
                    {holderTrend.toFixed(1)}% holders
                  </span>
                </div>
                <MiniSparkline
                  data={sparkData}
                  color={sparkColor}
                  width={160}
                  height={36}
                />
              </div>
            )}

            {/* ── Footer ── */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span
                className="flex items-center gap-1.5 text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                <Eye className="h-3 w-3" />{" "}
                {project.watchers.toLocaleString()} watchers
              </span>
              <ArrowRight
                className="card-arrow h-4 w-4 transition-all duration-300"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  /* ─── REGULAR GUIDE-CARD ─── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={`/project/${project.id}`} className="guide-card block">
        <div
          className="flex flex-col transition-all duration-300"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
          }}
        >
          {/* ── Header: number + badges ── */}
          <div
            className="flex items-center justify-between px-5 py-2.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="font-mono text-[10px] tracking-[0.15em]"
                style={{
                  color: "var(--text-very-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {cardNumber}
              </span>
              <span
                className="inline-flex items-center text-[10px] tracking-[0.12em] uppercase px-2 py-0.5"
                style={{
                  color: "var(--accent)",
                  border: "1px solid var(--accent-dim)",
                  background: "var(--accent-glow)",
                }}
              >
                {project.category}
              </span>
              <span
                className="text-[9px] tracking-[0.1em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                {project.subcategory}
              </span>
              {project.isHot && (
                <Flame className="h-3 w-3" style={{ color: "#EF4444" }} />
              )}
            </div>
            <div className="flex items-center gap-2">
              {project.website && (
                <ExternalLink
                  className="h-3 w-3"
                  style={{ color: "var(--text-very-muted)" }}
                />
              )}
              {score !== null && <HealthScore score={score} size="sm" />}
            </div>
          </div>

          {/* ── Title + tagline ── */}
          <div className="px-5 pt-4 pb-3">
            <h3
              className="font-display text-lg font-semibold leading-snug"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {project.name}
            </h3>
            <p
              className="mt-1.5 text-[12px] leading-relaxed line-clamp-2"
              style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
            >
              {project.tagline}
            </p>
          </div>

          {/* ── Stats grid — 4 columns ── */}
          <div
            className="grid grid-cols-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="px-3 py-2.5 sm:px-4 sm:py-3"
                style={{
                  borderRight:
                    i < 3 ? "1px solid var(--border)" : undefined,
                }}
              >
                <span
                  className="text-[8px] uppercase tracking-[0.15em] block mb-1"
                  style={{ color: "var(--text-very-muted)" }}
                >
                  {stat.label}
                </span>
                <span
                  className="font-mono text-[12px] sm:text-[13px] font-semibold block"
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

          {/* ── Sparkline + trend ── */}
          {sparkData.length >= 2 && (
            <div
              className="flex items-center justify-between px-5 py-2.5"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span
                className={`flex items-center gap-1 font-mono text-[10px] font-semibold ${
                  isHolderUp ? "text-success" : "text-danger"
                }`}
              >
                {isHolderUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isHolderUp ? "+" : ""}
                {holderTrend.toFixed(1)}%
                <span
                  className="text-[9px] font-normal ml-0.5"
                  style={{ color: "var(--text-very-muted)" }}
                >
                  7D
                </span>
              </span>
              <MiniSparkline
                data={sparkData}
                color={sparkColor}
                width={80}
                height={24}
              />
            </div>
          )}

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between px-5 py-2.5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <Eye className="h-3 w-3" /> {project.watchers.toLocaleString()}
            </span>
            <ArrowRight
              className="card-arrow h-3.5 w-3.5 transition-all duration-300"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

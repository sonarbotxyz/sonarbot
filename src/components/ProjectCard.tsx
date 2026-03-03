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
  Clock,
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
  const volume24h = useMemo(() => {
    if (project.latestSnapshot) return project.latestSnapshot.volume_24h;
    return 0;
  }, [project.latestSnapshot]);

  const { holderTrend, holderSparkline } = useMemo(() => {
    const snaps = project.recentSnapshots ?? [];
    if (snaps.length < 2)
      return { holderTrend: 0, holderSparkline: [] as number[] };
    const first = snaps[0].holders;
    const last = snaps[snaps.length - 1].holders;
    const trend =
      first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0;
    const step = Math.max(1, Math.floor(snaps.length / 7));
    const sparkline: number[] = [];
    for (let i = 0; i < snaps.length; i += step) {
      sparkline.push(snaps[i].holders);
    }
    if (sparkline[sparkline.length - 1] !== last) sparkline.push(last);
    return { holderTrend: trend, holderSparkline: sparkline };
  }, [project.recentSnapshots]);

  const cardNumber = String(index + 1).padStart(3, "0");
  const isHolderUp = holderTrend >= 0;

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
            className="flex flex-col gap-5 transition-all duration-300"
            style={{
              padding: "32px",
              background: "var(--card-bg)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {/* Number + category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="text-[10px] tracking-[0.15em]"
                  style={{
                    color: "var(--text-very-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {cardNumber}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase w-fit px-2.5 py-1"
                  style={{
                    color: "var(--accent)",
                    border: "1px solid var(--accent-dim)",
                    background: "var(--accent-glow)",
                  }}
                >
                  {project.category}
                </span>
                {project.isHot && (
                  <span
                    className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em]"
                    style={{ color: "var(--danger, #EF4444)" }}
                  >
                    <Flame className="h-3 w-3" /> Hot
                  </span>
                )}
              </div>
              {score !== null && <HealthScore score={score} size="sm" />}
            </div>

            {/* Title + tagline */}
            <div>
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

            {/* Footer row */}
            <div
              className="flex items-center justify-between pt-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Eye className="h-3 w-3" /> {project.watchers} watchers
                </span>
                {holderSparkline.length >= 2 && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${
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
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-very-muted)" }}
                    >
                      holders
                    </span>
                    <MiniSparkline
                      data={holderSparkline}
                      color={isHolderUp ? "#22C55E" : "#EF4444"}
                      width={48}
                      height={16}
                    />
                  </span>
                )}
                {volume24h > 0 && (
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Vol {formatCompact(volume24h)}
                  </span>
                )}
              </div>
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
          className="flex flex-col gap-4 transition-all duration-300"
          style={{
            padding: "28px 24px",
            background: "var(--bg-primary)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Number + category row */}
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] tracking-[0.15em]"
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
            {project.isHot && (
              <Flame className="h-3 w-3" style={{ color: "#EF4444" }} />
            )}
            {score !== null && (
              <div className="ml-auto">
                <HealthScore score={score} size="sm" />
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-display text-lg font-semibold leading-snug"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            {project.name}
          </h3>

          {/* Tagline */}
          <p
            className="text-[13px] leading-relaxed line-clamp-2 flex-grow"
            style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}
          >
            {project.tagline}
          </p>

          {/* Footer row */}
          <div
            className="flex items-center justify-between pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex items-center gap-1 text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                <Eye className="h-3 w-3" /> {project.watchers}
              </span>
              {holderSparkline.length >= 2 && (
                <span className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold ${
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
                    data={holderSparkline}
                    color={isHolderUp ? "#22C55E" : "#EF4444"}
                    width={40}
                    height={14}
                  />
                </span>
              )}
              {volume24h > 0 && (
                <span
                  className="font-mono text-[10px]"
                  style={{ color: "var(--text-very-muted)" }}
                >
                  Vol {formatCompact(volume24h)}
                </span>
              )}
            </div>
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

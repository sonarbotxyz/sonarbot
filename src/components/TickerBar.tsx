"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Project } from "@/lib/mock-data";

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

interface TickerBarProps {
  projects: Project[];
}

interface TickerItem {
  id: string;
  name: string;
  marketcap: number;
  change24h: number;
}

export function TickerBar({ projects }: TickerBarProps) {
  const items: TickerItem[] = useMemo(() => {
    return projects
      .filter((p) => p.latestSnapshot && p.latestSnapshot.marketcap > 0)
      .map((p) => {
        const snaps = p.recentSnapshots ?? [];
        let change = 0;
        if (snaps.length >= 2) {
          const prev = snaps[snaps.length - 2].volume_24h;
          const curr = snaps[snaps.length - 1].volume_24h;
          change = prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;
        }
        return {
          id: p.id,
          name: p.name,
          marketcap: p.latestSnapshot?.marketcap ?? 0,
          change24h: change,
        };
      });
  }, [projects]);

  if (items.length === 0) return null;

  const tickerContent = (
    <>
      {items.map((item) => {
        const isUp = item.change24h >= 0;
        return (
          <Link
            key={item.id}
            href={`/project/${item.id}`}
            className="inline-flex items-center gap-3 px-5 no-underline shrink-0"
          >
            <span
              className="text-[11px] font-medium uppercase tracking-[0.06em]"
              style={{ color: "var(--text-body)" }}
            >
              {item.name}
            </span>
            <span
              className="font-mono text-[11px]"
              style={{
                color: "var(--text-secondary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCompact(item.marketcap)}
            </span>
            <span
              className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold"
              style={{
                color: isUp ? "#22C55E" : "#EF4444",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {isUp ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              {isUp ? "+" : ""}
              {item.change24h.toFixed(1)}%
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-very-muted)" }}
            >
              /
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div
      className="ticker-bar relative"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        height: "34px",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-20 overflow-hidden h-full">
        <div className="ticker-track flex items-center h-full">
          <div className="ticker-content flex items-center shrink-0">
            {tickerContent}
          </div>
          <div className="ticker-content flex items-center shrink-0" aria-hidden="true">
            {tickerContent}
          </div>
        </div>
      </div>
    </div>
  );
}

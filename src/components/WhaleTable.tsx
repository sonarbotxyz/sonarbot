"use client";

import { ExternalLink } from "lucide-react";
import type { WhaleWallet } from "@/lib/mock-chart-data";

interface WhaleTableProps {
  whales: WhaleWallet[];
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatBalance(balance: number): string {
  if (balance >= 1_000_000_000)
    return `${(balance / 1_000_000_000).toFixed(2)}B`;
  if (balance >= 1_000_000) return `${(balance / 1_000_000).toFixed(2)}M`;
  if (balance >= 1_000) return `${(balance / 1_000).toFixed(1)}K`;
  return balance.toLocaleString();
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function WhaleTable({ whales }: WhaleTableProps) {
  if (!whales.length) return null;

  return (
    <div className="p-5" style={{ background: "var(--bg-secondary)" }}>
      <h3
        className="text-[10px] uppercase tracking-[0.15em] font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        Top Holders
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr
              className="text-left text-[10px] font-medium uppercase"
              style={{
                color: "var(--text-very-muted)",
                letterSpacing: "0.12em",
              }}
            >
              <th className="pb-3 pr-3">#</th>
              <th className="pb-3 pr-3">Address</th>
              <th className="pb-3 pr-3 text-right">Balance</th>
              <th className="pb-3 pr-3 text-right">% Supply</th>
              <th className="pb-3 pr-3 text-right">Last Active</th>
              <th className="pb-3 text-right">Type</th>
            </tr>
          </thead>
          <tbody>
            {whales.map((whale) => (
              <tr
                key={whale.address}
                className="transition-colors"
                style={{ borderTop: "1px solid var(--border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td
                  className="py-3 pr-3 font-mono text-[12px]"
                  style={{ color: "var(--text-very-muted)" }}
                >
                  {whale.rank}
                </td>
                <td className="py-3 pr-3">
                  <a
                    href={`https://basescan.org/address/${whale.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 font-mono text-[13px] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    {truncateAddress(whale.address)}
                    <ExternalLink
                      className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </a>
                </td>
                <td
                  className="py-3 pr-3 text-right font-mono text-[13px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {formatBalance(whale.balance)}
                </td>
                <td
                  className="py-3 pr-3 text-right font-mono text-[13px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {whale.percentSupply.toFixed(2)}%
                </td>
                <td
                  className="py-3 pr-3 text-right text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatRelativeTime(whale.lastActivity)}
                </td>
                <td className="py-3 text-right">
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                      letterSpacing: "0.1em",
                      color:
                        whale.type === "buy"
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                      background:
                        whale.type === "buy"
                          ? "var(--color-success-muted)"
                          : "var(--color-danger-muted)",
                    }}
                  >
                    {whale.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

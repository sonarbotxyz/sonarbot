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
  if (balance >= 1_000_000_000) return `${(balance / 1_000_000_000).toFixed(2)}B`;
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
    <div className="rounded-2xl bg-surface p-5">
      <h3 className="text-sm font-semibold text-text-primary">Top Holders</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
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
                className="border-t border-white/5 transition-colors hover:bg-white/[0.02]"
              >
                <td className="py-3 pr-3 font-[family-name:var(--font-mono)] text-[12px] text-text-tertiary">
                  {whale.rank}
                </td>
                <td className="py-3 pr-3">
                  <a
                    href={`https://basescan.org/address/${whale.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[13px] text-text-secondary transition-colors hover:text-primary"
                  >
                    {truncateAddress(whale.address)}
                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-text-tertiary" />
                  </a>
                </td>
                <td className="py-3 pr-3 text-right font-[family-name:var(--font-mono)] text-[13px] text-text-primary">
                  {formatBalance(whale.balance)}
                </td>
                <td className="py-3 pr-3 text-right font-[family-name:var(--font-mono)] text-[13px] text-text-secondary">
                  {whale.percentSupply.toFixed(2)}%
                </td>
                <td className="py-3 pr-3 text-right text-[12px] text-text-tertiary">
                  {formatRelativeTime(whale.lastActivity)}
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      whale.type === "buy"
                        ? "bg-success/12 text-success"
                        : "bg-danger/12 text-danger"
                    }`}
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

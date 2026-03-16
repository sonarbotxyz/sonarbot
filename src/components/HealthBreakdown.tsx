"use client";

import { motion } from "framer-motion";
import {
  Users,
  GitCommitHorizontal,
  Droplets,
  MessageCircle,
  BarChart3,
} from "lucide-react";
import type { HealthScore } from "@/lib/mock-chart-data";

interface HealthBreakdownProps {
  health: HealthScore;
}

function getScoreColor(score: number): string {
  if (score <= 35) return "#EF4444";
  if (score <= 65) return "#EAB308";
  return "#22C55E";
}

const LABELS: {
  key: keyof HealthScore["breakdown"];
  label: string;
  icon: React.ElementType;
  weightKey: keyof HealthScore["weights"];
}[] = [
  { key: "social", label: "Social", icon: MessageCircle, weightKey: "social" },
  { key: "volume", label: "Volume", icon: BarChart3, weightKey: "volume" },
  { key: "holders", label: "Holders", icon: Users, weightKey: "holders" },
  {
    key: "liquidity",
    label: "Liquidity",
    icon: Droplets,
    weightKey: "liquidity",
  },
  {
    key: "devActivity",
    label: "GitHub Activity",
    icon: GitCommitHorizontal,
    weightKey: "devActivity",
  },
];

export function HealthBreakdown({ health }: HealthBreakdownProps) {
  return (
    <div className="p-5" style={{ background: "var(--bg-secondary)" }}>
      <h3
        className="text-[10px] uppercase tracking-[0.15em] font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        Health Breakdown
      </h3>
      <div className="mt-4 space-y-3.5">
        {LABELS.map(({ key, label, icon: Icon, weightKey }, i) => {
          const score = health.breakdown[key];
          const weight = Math.round(health.weights[weightKey] * 100);
          const color = getScoreColor(score);

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--text-very-muted)" }}
                  />
                  <span
                    className="text-[13px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </span>
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: "var(--text-very-muted)" }}
                  >
                    {weight}%
                  </span>
                </div>
                <span
                  className="font-mono text-[13px] font-semibold"
                  style={{ color }}
                >
                  {score}
                </span>
              </div>
              <div
                className="h-1 w-full overflow-hidden"
                style={{ background: "var(--border-strong)" }}
              >
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 * i,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

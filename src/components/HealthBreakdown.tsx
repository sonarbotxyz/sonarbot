"use client";

import { motion } from "framer-motion";
import { Users, GitCommitHorizontal, Droplets, MessageCircle, BarChart3 } from "lucide-react";
import type { HealthScore } from "@/lib/mock-chart-data";

interface HealthBreakdownProps {
  health: HealthScore;
}

function getScoreColor(score: number): string {
  if (score <= 30) return "#EF4444";
  if (score <= 60) return "#EAB308";
  if (score <= 80) return "#22C55E";
  return "#10B981";
}

const LABELS: {
  key: keyof HealthScore["breakdown"];
  label: string;
  icon: React.ElementType;
  weightKey: keyof HealthScore["weights"];
}[] = [
  { key: "holders", label: "Holders", icon: Users, weightKey: "holders" },
  { key: "devActivity", label: "Dev Activity", icon: GitCommitHorizontal, weightKey: "devActivity" },
  { key: "liquidity", label: "Liquidity", icon: Droplets, weightKey: "liquidity" },
  { key: "social", label: "Social", icon: MessageCircle, weightKey: "social" },
  { key: "volume", label: "Volume", icon: BarChart3, weightKey: "volume" },
];

export function HealthBreakdown({ health }: HealthBreakdownProps) {
  return (
    <div className="rounded-2xl bg-surface p-5">
      <h3 className="text-sm font-semibold text-text-primary">Health Breakdown</h3>
      <div className="mt-4 space-y-3.5">
        {LABELS.map(({ key, label, icon: Icon, weightKey }, i) => {
          const score = health.breakdown[key];
          const weight = Math.round(health.weights[weightKey] * 100);
          const color = getScoreColor(score);

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-text-tertiary" />
                  <span className="text-[13px] text-text-secondary">{label}</span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-text-tertiary">
                    {weight}%
                  </span>
                </div>
                <span
                  className="font-[family-name:var(--font-mono)] text-[13px] font-semibold"
                  style={{ color }}
                >
                  {score}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

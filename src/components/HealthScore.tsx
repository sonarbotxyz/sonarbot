"use client";

import { motion } from "framer-motion";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "lg";
}

function getScoreColor(score: number): string {
  if (score <= 35) return "#EF4444";
  if (score <= 65) return "#EAB308";
  return "#22C55E";
}

export function HealthScore({ score, size = "lg" }: HealthScoreProps) {
  const color = getScoreColor(score);
  const clampedScore = Math.max(0, Math.min(100, score));
  const isSmall = size === "sm";

  const radius = isSmall ? 16 : 44;
  const stroke = isSmall ? 3 : 5;
  const svgSize = isSmall ? 40 : 104;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: svgSize, height: svgSize }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={stroke}
        />
        {/* Animated progress */}
        <motion.circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      {/* Center number */}
      <span
        className={`absolute font-mono font-bold ${
          isSmall ? "text-[11px]" : "text-2xl"
        }`}
        style={{ color }}
      >
        {clampedScore}
      </span>
    </div>
  );
}

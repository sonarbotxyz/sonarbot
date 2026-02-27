"use client";

import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function MiniSparkline({
  data,
  color = "#3DD7D8",
  width = 64,
  height = 24,
}: MiniSparklineProps) {
  const chartData = useMemo(
    () => data.map((value, i) => ({ i, value })),
    [data],
  );

  const gradientId = useMemo(
    () => `spark-${color.replace("#", "")}-${data.length}`,
    [color, data.length],
  );

  if (!data.length) return null;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 1, right: 1, bottom: 1, left: 1 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

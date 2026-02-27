"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  timestamp: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  formatValue?: (v: number) => string;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatValue: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-surface-raised px-3 py-2 shadow-lg ring-1 ring-white/10">
      <p className="text-[11px] text-text-tertiary">{label ? formatShortDate(label) : ""}</p>
      <p className="font-[family-name:var(--font-mono)] text-sm font-semibold text-text-primary">
        {formatValue(payload[0].value)}
      </p>
    </div>
  );
}

export function AreaChartComponent({
  data,
  color = "#3DD7D8",
  height = 280,
  showGrid = true,
  showTooltip = true,
  formatValue = formatCompact,
}: AreaChartProps) {
  const gradientId = useMemo(() => `area-gradient-${color.replace("#", "")}`, [color]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-text-tertiary">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsArea data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(42, 43, 54, 0.5)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="timestamp"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#555570", fontSize: 11, fontFamily: "var(--font-mono)" }}
          tickFormatter={formatShortDate}
          interval="preserveStartEnd"
          minTickGap={50}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#555570", fontSize: 11, fontFamily: "var(--font-mono)" }}
          tickFormatter={formatCompact}
          width={50}
        />
        {showTooltip && (
          <Tooltip
            content={<CustomTooltip formatValue={formatValue} />}
            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </RechartsArea>
    </ResponsiveContainer>
  );
}

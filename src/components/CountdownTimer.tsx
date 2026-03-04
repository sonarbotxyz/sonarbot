"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string;
  variant?: "default" | "promoted";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ targetDate, variant = "default" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const isPromoted = variant === "promoted";

  const blocks: { label: string; value: number }[] = [
    { label: "D", value: timeLeft.days },
    { label: "H", value: timeLeft.hours },
    { label: "M", value: timeLeft.minutes },
    { label: "S", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-1">
      {blocks.map((block) => (
        <div
          key={block.label}
          className="flex flex-col items-center px-2 py-1"
          style={{
            background: isPromoted ? "rgba(255,255,255,0.1)" : "var(--bg-primary)",
            border: isPromoted ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--border)",
          }}
        >
          <span
            className="font-mono text-sm font-semibold tabular-nums"
            style={{ color: isPromoted ? "#FFFFFF" : "var(--text-primary)" }}
          >
            {block.value.toString().padStart(2, "0")}
          </span>
          <span
            className="text-[9px] font-medium uppercase tracking-[0.1em]"
            style={{ color: isPromoted ? "rgba(255,255,255,0.5)" : "var(--text-very-muted)" }}
          >
            {block.label}
          </span>
        </div>
      ))}
    </div>
  );
}

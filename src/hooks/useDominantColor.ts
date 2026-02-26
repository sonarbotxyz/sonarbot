"use client";

import { useState, useEffect } from "react";
import { FastAverageColor } from "fast-average-color";

interface DominantColorResult {
  color: string;       // hex like "#2A5DC4"
  rgb: [number, number, number];
  isDark: boolean;
  isLoading: boolean;
}

const colorCache = new Map<string, { color: string; rgb: [number, number, number]; isDark: boolean }>();

export function useDominantColor(imageUrl: string | null, fallbackColor = "#3DD7D8"): DominantColorResult {
  const [result, setResult] = useState<DominantColorResult>({
    color: fallbackColor,
    rgb: hexToRgb(fallbackColor),
    isDark: true,
    isLoading: true,
  });

  useEffect(() => {
    if (!imageUrl) {
      setResult({ color: fallbackColor, rgb: hexToRgb(fallbackColor), isDark: true, isLoading: false });
      return;
    }

    // Check cache
    const cached = colorCache.get(imageUrl);
    if (cached) {
      setResult({ ...cached, isLoading: false });
      return;
    }

    const fac = new FastAverageColor();
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const facResult = fac.getColor(img, { algorithm: "dominant", mode: "precision" });
        const [r, g, b] = facResult.value;
        // Boost saturation slightly and darken for card backgrounds
        const boosted = boostColor(r, g, b);
        const hex = rgbToHex(boosted[0], boosted[1], boosted[2]);
        const isDark = facResult.isDark;
        const entry = { color: hex, rgb: boosted, isDark };
        colorCache.set(imageUrl, entry);
        setResult({ ...entry, isLoading: false });
      } catch {
        setResult({ color: fallbackColor, rgb: hexToRgb(fallbackColor), isDark: true, isLoading: false });
      }
      fac.destroy();
    };

    img.onerror = () => {
      setResult({ color: fallbackColor, rgb: hexToRgb(fallbackColor), isDark: true, isLoading: false });
      fac.destroy();
    };

    img.src = imageUrl;
  }, [imageUrl, fallbackColor]);

  return result;
}

/** Build a mesh gradient from a dominant color */
export function buildMeshGradient(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  // Create lighter and darker variants
  const lighter = [Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40)];
  const darker = [Math.max(0, Math.floor(r * 0.3)), Math.max(0, Math.floor(g * 0.3)), Math.max(0, Math.floor(b * 0.3))];
  const veryDark = [Math.max(0, Math.floor(r * 0.1)), Math.max(0, Math.floor(g * 0.1)), Math.max(0, Math.floor(b * 0.1))];

  return `
    radial-gradient(ellipse 80% 50% at 20% 80%, rgba(${r},${g},${b},0.4) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 20%, rgba(${lighter[0]},${lighter[1]},${lighter[2]},0.2) 0%, transparent 60%),
    radial-gradient(ellipse 100% 100% at 50% 50%, rgb(${veryDark[0]},${veryDark[1]},${veryDark[2]}) 0%, rgb(${veryDark[0]},${veryDark[1]},${veryDark[2]}) 100%)
  `;
}

/** Build accent color at lower opacity for pills/badges */
export function buildAccentBg(rgb: [number, number, number], opacity = 0.15): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;
}

export function buildAccentColor(rgb: [number, number, number]): string {
  // Ensure the accent is bright enough to read
  const [r, g, b] = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.4) {
    // Brighten
    return `rgb(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)})`;
  }
  return `rgb(${r},${g},${b})`;
}

function boostColor(r: number, g: number, b: number): [number, number, number] {
  // Boost saturation slightly for more vibrant gradients
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 30) {
    // Very desaturated — return as-is
    return [r, g, b];
  }
  const factor = 1.15;
  const avg = (r + g + b) / 3;
  return [
    Math.min(255, Math.max(0, Math.round(avg + (r - avg) * factor))),
    Math.min(255, Math.max(0, Math.round(avg + (g - avg) * factor))),
    Math.min(255, Math.max(0, Math.round(avg + (b - avg) * factor))),
  ];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

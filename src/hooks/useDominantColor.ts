"use client";

import { useState, useEffect } from "react";

interface DominantColorResult {
  color: string;
  rgb: [number, number, number];
  isDark: boolean;
  isLoading: boolean;
}

const colorCache = new Map<string, { color: string; rgb: [number, number, number]; isDark: boolean }>();

/**
 * Extract the most VIBRANT color from an image, ignoring dark/black/gray pixels.
 * This ensures logos with dark backgrounds (like a red skull on black) return the accent color (red), not the background (black/dark).
 */
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

    const cached = colorCache.get(imageUrl);
    if (cached) {
      setResult({ ...cached, isLoading: false });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    // Route through our proxy to guarantee CORS access for canvas pixel reading
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;

    img.onload = () => {
      try {
        const rgb = extractVibrantColor(img);
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        const entry = { color: hex, rgb, isDark: luminance < 0.5 };
        colorCache.set(imageUrl, entry);
        setResult({ ...entry, isLoading: false });
      } catch {
        setResult({ color: fallbackColor, rgb: hexToRgb(fallbackColor), isDark: true, isLoading: false });
      }
    };

    img.onerror = () => {
      setResult({ color: fallbackColor, rgb: hexToRgb(fallbackColor), isDark: true, isLoading: false });
    };

    img.src = proxiedUrl;
  }, [imageUrl, fallbackColor]);

  return result;
}

/**
 * Canvas-based vibrant color extraction.
 * 1. Sample pixels from the image
 * 2. Filter out dark pixels (r+g+b < 80) and gray pixels (low saturation)
 * 3. Find the most saturated/vibrant color among remaining pixels
 * 4. If no vibrant pixels found, fall back to the average of non-dark pixels
 */
function extractVibrantColor(img: HTMLImageElement): [number, number, number] {
  const canvas = document.createElement("canvas");
  const size = 64; // Sample at low res for speed
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [61, 215, 216]; // fallback cyan

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  // Collect vibrant pixels (high saturation, not too dark, not too light)
  const vibrantPixels: Array<{ r: number; g: number; b: number; saturation: number }> = [];
  const allNonDark: Array<{ r: number; g: number; b: number }> = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue; // Skip transparent

    const brightness = r + g + b;

    // Skip very dark pixels (backgrounds)
    if (brightness < 80) continue;
    // Skip very light/white pixels
    if (brightness > 700) continue;

    allNonDark.push({ r, g, b });

    // Calculate saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const saturation = max === 0 ? 0 : delta / max;

    // Only keep saturated pixels (the colorful ones)
    if (saturation > 0.25 && brightness > 100) {
      vibrantPixels.push({ r, g, b, saturation });
    }
  }

  if (vibrantPixels.length > 0) {
    // Sort by saturation, take the top 20% most vibrant
    vibrantPixels.sort((a, b) => b.saturation - a.saturation);
    const topCount = Math.max(1, Math.floor(vibrantPixels.length * 0.2));
    const top = vibrantPixels.slice(0, topCount);

    // Average the top vibrant pixels
    const avg = top.reduce(
      (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
      { r: 0, g: 0, b: 0 }
    );
    return [
      Math.round(avg.r / top.length),
      Math.round(avg.g / top.length),
      Math.round(avg.b / top.length),
    ];
  }

  // Fallback: average of non-dark pixels
  if (allNonDark.length > 0) {
    const avg = allNonDark.reduce(
      (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
      { r: 0, g: 0, b: 0 }
    );
    return [
      Math.round(avg.r / allNonDark.length),
      Math.round(avg.g / allNonDark.length),
      Math.round(avg.b / allNonDark.length),
    ];
  }

  return [61, 215, 216]; // Ultimate fallback: cyan
}

/** Build a mesh gradient from a dominant color */
export function buildMeshGradient(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  const lighter = [Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40)];
  const veryDark = [Math.max(0, Math.floor(r * 0.1)), Math.max(0, Math.floor(g * 0.1)), Math.max(0, Math.floor(b * 0.1))];

  return `
    radial-gradient(ellipse 80% 50% at 20% 80%, rgba(${r},${g},${b},0.4) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 20%, rgba(${lighter[0]},${lighter[1]},${lighter[2]},0.2) 0%, transparent 60%),
    radial-gradient(ellipse 100% 100% at 50% 50%, rgb(${veryDark[0]},${veryDark[1]},${veryDark[2]}) 0%, rgb(${veryDark[0]},${veryDark[1]},${veryDark[2]}) 100%)
  `;
}

export function buildAccentBg(rgb: [number, number, number], opacity = 0.15): string {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;
}

export function buildAccentColor(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.4) {
    return `rgb(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)})`;
  }
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

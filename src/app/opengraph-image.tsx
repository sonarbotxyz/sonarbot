import { ImageResponse } from "next/og";

export const alt = "Sonarbot — Discover What's Building on Base";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1652F0",
            borderRadius: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "white",
              position: "absolute",
            }}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.5)",
              position: "absolute",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#F5F5F5",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Sonarbot
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "#888888",
            letterSpacing: "0.04em",
          }}
        >
          Discover What&apos;s Building on Base
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#1652F0",
          }}
        />
      </div>
    ),
    { ...size }
  );
}

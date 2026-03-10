import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1652F0",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "white",
            position: "absolute",
          }}
        />
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.5)",
            position: "absolute",
          }}
        />
      </div>
    ),
    { ...size }
  );
}

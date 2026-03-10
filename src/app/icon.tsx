import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1652F0",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "white",
            position: "absolute",
          }}
        />
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.5)",
            position: "absolute",
          }}
        />
      </div>
    ),
    { ...size }
  );
}

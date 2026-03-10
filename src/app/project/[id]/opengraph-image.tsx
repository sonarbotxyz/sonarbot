import { ImageResponse } from "next/og";
import { getSupabase } from "@/lib/supabase";

export const alt = "Sonarbot Project";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProjectOGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let name = "Project";
  let category = "";
  let healthScore: number | null = null;

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("projects")
      .select("name, category, health_score")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      name = data.name ?? name;
      category = data.category ?? "";
      healthScore = data.health_score ?? null;
    }
  } catch {
    // Supabase unavailable
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0A0A0A",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontSize: 14,
            color: "#666666",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Sonarbot
        </div>

        {/* Project name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#F5F5F5",
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          {name}
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {category && (
            <div
              style={{
                fontSize: 16,
                color: "#1652F0",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "6px 16px",
                border: "1px solid rgba(22,82,240,0.3)",
              }}
            >
              {category}
            </div>
          )}
          {healthScore !== null && (
            <div
              style={{
                fontSize: 16,
                color: "#888888",
                letterSpacing: "0.04em",
              }}
            >
              Health: {healthScore}/100
            </div>
          )}
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

import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://sonarbot.vercel.app", changeFrequency: "daily", priority: 1 },
    { url: "https://sonarbot.vercel.app/upcoming", changeFrequency: "daily", priority: 0.8 },
    { url: "https://sonarbot.vercel.app/submit", changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("projects")
      .select("id, updated_at")
      .eq("status", "approved");

    if (data) {
      const projectPages: MetadataRoute.Sitemap = data.map((p) => ({
        url: `https://sonarbot.vercel.app/project/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
      return [...staticPages, ...projectPages];
    }
  } catch {
    // Supabase unavailable — return static pages only
  }

  return staticPages;
}

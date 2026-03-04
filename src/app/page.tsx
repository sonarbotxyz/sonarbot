import { getSupabase } from "@/lib/supabase";
import { mapProject } from "@/lib/mappers";
import { HomeContent } from "@/components/HomeContent";
import type { SupabaseProject } from "@/lib/mappers";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let projects: Project[] = [];

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_approved", true)
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      projects = (data as SupabaseProject[]).map(mapProject);
    }
  } catch {
    // Supabase unavailable — show empty state
  }

  return <HomeContent projects={projects} />;
}

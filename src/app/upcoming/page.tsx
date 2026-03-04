import { getSupabase } from "@/lib/supabase";
import { mapProject } from "@/lib/mappers";
import type { SupabaseProject } from "@/lib/mappers";
import type { Project } from "@/lib/types";
import { UpcomingContent } from "@/components/UpcomingContent";

export const dynamic = "force-dynamic";

export default async function UpcomingPage() {
  let upcomingProjects: (Project & { launchDate: string })[] = [];

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_approved", true)
      .not("launch_date", "is", null)
      .gte("launch_date", new Date().toISOString().split("T")[0])
      .order("launch_date", { ascending: true })
      .limit(50);

    if (!error && data) {
      upcomingProjects = (data as SupabaseProject[])
        .map(mapProject)
        .filter((p): p is Project & { launchDate: string } => !!p.launchDate);
    }
  } catch {
    // Supabase unavailable — show empty state
  }

  return <UpcomingContent projects={upcomingProjects} />;
}

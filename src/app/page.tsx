import { getSupabase } from "@/lib/supabase";
import { mapProject } from "@/lib/mappers";
import { projects as mockProjects } from "@/lib/mock-data";
import { HomeContent } from "@/components/HomeContent";
import type { SupabaseProject } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let projects = mockProjects;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_approved", true)
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      projects = (data as SupabaseProject[]).map(mapProject);
    }
  } catch {
    // Fall back to mock data silently
  }

  return <HomeContent projects={projects} />;
}

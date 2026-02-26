import { getSupabase } from "@/lib/supabase";
import { mapProject, mapComment } from "@/lib/mappers";
import { projects as mockProjects, upcomingProjects } from "@/lib/mock-data";
import { ProjectDetail } from "@/components/ProjectDetail";
import type { SupabaseProject, SupabaseComment } from "@/lib/mappers";
import type { Project, Comment } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project: Project | null = null;
  let comments: Comment[] = [];

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      project = mapProject(data as SupabaseProject);

      // Fetch comments
      const { data: commentData } = await supabase
        .from("project_comments")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });

      if (commentData) {
        comments = (commentData as SupabaseComment[]).map(mapComment);
      }
    }
  } catch {
    // Fall back to mock data
  }

  // Fallback to mock data if API didn't find the project
  if (!project) {
    const allMock = [...mockProjects, ...upcomingProjects];
    const mock = allMock.find((p) => p.id === id);
    if (mock) {
      project = mock;
      comments = mock.comments;
    }
  }

  return <ProjectDetail project={project} comments={comments} projectId={id} />;
}

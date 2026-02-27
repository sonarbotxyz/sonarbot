import { getSupabase } from "@/lib/supabase";
import { mapProject, mapComment } from "@/lib/mappers";
import { projects as mockProjects, upcomingProjects } from "@/lib/mock-data";
import { ProjectDetail } from "@/components/ProjectDetail";
import type { SupabaseProject, SupabaseComment } from "@/lib/mappers";
import type { Project, Comment } from "@/lib/mock-data";
import type {
  ApiHealthData,
  ApiSnapshot,
  ApiWhaleWallet,
  ApiSocialData,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project: Project | null = null;
  let comments: Comment[] = [];
  let healthData: ApiHealthData | null = null;
  let snapshotsData: ApiSnapshot[] = [];
  let whaleWalletsData: ApiWhaleWallet[] = [];
  let socialData: ApiSocialData | null = null;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      project = mapProject(data as SupabaseProject);

      // Fetch comments + analytics data in parallel
      const [commentResult, healthResult, snapshotsResult, whalesResult, socialResult] =
        await Promise.all([
          supabase
            .from("project_comments")
            .select("*")
            .eq("project_id", id)
            .order("created_at", { ascending: true }),
          supabase
            .from("health_scores")
            .select("*")
            .eq("project_id", id)
            .order("timestamp", { ascending: false })
            .limit(1),
          supabase
            .from("snapshots")
            .select("*")
            .eq("project_id", id)
            .order("timestamp", { ascending: false })
            .limit(2200),
          supabase
            .from("whale_wallets")
            .select("*")
            .eq("project_id", id)
            .order("balance", { ascending: false })
            .limit(20),
          supabase
            .from("social_snapshots")
            .select("*")
            .eq("project_id", id)
            .order("timestamp", { ascending: false })
            .limit(1),
        ]);

      if (commentResult.data) {
        comments = (commentResult.data as SupabaseComment[]).map(mapComment);
      }

      const latestHealth = healthResult.data?.[0] as ApiHealthData | undefined;
      healthData = latestHealth
        ? {
            score: latestHealth.score,
            holder_sub: latestHealth.holder_sub,
            dev_sub: latestHealth.dev_sub,
            liquidity_sub: latestHealth.liquidity_sub,
            social_sub: latestHealth.social_sub,
            volume_sub: latestHealth.volume_sub,
          }
        : null;

      // Reverse to chronological order for charts
      snapshotsData = ((snapshotsResult.data as ApiSnapshot[]) ?? []).reverse();
      whaleWalletsData = (whalesResult.data as ApiWhaleWallet[]) ?? [];
      socialData = (socialResult.data?.[0] as ApiSocialData) ?? null;
    }
  } catch {
    // Fall back to mock data
  }

  // Fallback to mock data if Supabase didn't find the project
  if (!project) {
    const allMock = [...mockProjects, ...upcomingProjects];
    const mock = allMock.find((p) => p.id === id);
    if (mock) {
      project = mock;
      comments = mock.comments;
    }
  }

  return (
    <ProjectDetail
      project={project}
      comments={comments}
      projectId={id}
      healthData={healthData}
      snapshotsData={snapshotsData}
      whaleWalletsData={whaleWalletsData}
      socialData={socialData}
    />
  );
}

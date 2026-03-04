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

    // Fetch projects with health scores (same as API route)
    const { data, error } = await supabase
      .from("projects")
      .select(
        `*,
        health_scores (
          score,
          holder_sub,
          dev_sub,
          liquidity_sub,
          social_sub,
          volume_sub,
          timestamp
        )`
      )
      .eq("is_approved", true)
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      // Post-process: extract latest health score from joined data
      const enriched = data.map((p) => {
        const scores = p.health_scores as Array<{
          score: number;
          holder_sub: number;
          dev_sub: number;
          liquidity_sub: number;
          social_sub: number;
          volume_sub: number;
          timestamp: string;
        }> | null;

        const latest = scores?.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        const { health_scores: _scores, ...project } = p;
        return {
          ...project,
          health_score: latest?.score ?? null,
          health_breakdown: latest
            ? {
                holder_sub: latest.holder_sub,
                dev_sub: latest.dev_sub,
                liquidity_sub: latest.liquidity_sub,
                social_sub: latest.social_sub,
                volume_sub: latest.volume_sub,
              }
            : null,
        };
      });

      // Fetch recent snapshots for sparklines (last 7 days)
      const projectIds = enriched.map((p) => p.id as string);
      let snapshotsByProject: Record<
        string,
        Array<{
          timestamp: string;
          holders: number;
          marketcap: number;
          volume_24h: number;
          liquidity: number;
        }>
      > = {};

      if (projectIds.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentSnaps } = await supabase
          .from("snapshots")
          .select(
            "project_id, timestamp, holders, marketcap, volume_24h, liquidity"
          )
          .in("project_id", projectIds)
          .gte("timestamp", sevenDaysAgo.toISOString())
          .order("timestamp", { ascending: true });

        for (const snap of recentSnaps ?? []) {
          const pid = snap.project_id as string;
          if (!snapshotsByProject[pid]) snapshotsByProject[pid] = [];
          snapshotsByProject[pid].push({
            timestamp: snap.timestamp as string,
            holders: snap.holders as number,
            marketcap: snap.marketcap as number,
            volume_24h: snap.volume_24h as number,
            liquidity: snap.liquidity as number,
          });
        }
      }

      // Attach snapshots and map to frontend types
      const withSnapshots = enriched.map((p) => {
        const snaps = snapshotsByProject[p.id as string] ?? [];
        const latestSnap = snaps.length > 0 ? snaps[snaps.length - 1] : null;
        return {
          ...p,
          latest_snapshot: latestSnap,
          recent_snapshots: snaps,
        };
      });

      projects = (withSnapshots as SupabaseProject[]).map(mapProject);
    }
  } catch {
    // Supabase unavailable — show empty state
  }

  return <HomeContent projects={projects} />;
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isValidUUID } from "@/lib/validate";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Fetch project
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch related data in parallel
    const [healthResult, snapshotsResult, whalesResult, socialResult] =
      await Promise.all([
        // Latest health score
        supabase
          .from("health_scores")
          .select("*")
          .eq("project_id", id)
          .order("timestamp", { ascending: false })
          .limit(1),
        // Recent snapshots (last 90 days worth for charts)
        supabase
          .from("snapshots")
          .select("*")
          .eq("project_id", id)
          .order("timestamp", { ascending: false })
          .limit(2200),
        // Whale wallets
        supabase
          .from("whale_wallets")
          .select("*")
          .eq("project_id", id)
          .order("balance", { ascending: false })
          .limit(20),
        // Latest social snapshot
        supabase
          .from("social_snapshots")
          .select("*")
          .eq("project_id", id)
          .order("timestamp", { ascending: false })
          .limit(1),
      ]);

    const latestHealth = healthResult.data?.[0] ?? null;
    const snapshots = snapshotsResult.data ?? [];
    const whaleWallets = whalesResult.data ?? [];
    const latestSocial = socialResult.data?.[0] ?? null;

    return NextResponse.json({
      project: data,
      health: latestHealth
        ? {
            score: latestHealth.score,
            holder_sub: latestHealth.holder_sub,
            dev_sub: latestHealth.dev_sub,
            liquidity_sub: latestHealth.liquidity_sub,
            social_sub: latestHealth.social_sub,
            volume_sub: latestHealth.volume_sub,
            timestamp: latestHealth.timestamp,
          }
        : null,
      snapshots: snapshots.reverse(), // chronological order for charts
      whale_wallets: whaleWallets,
      social: latestSocial,
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({ watchlist: [] });
    }

    // Get watched projects with alert preferences
    const { data: watches, error: watchError } = await supabase
      .from("watches")
      .select("project_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (watchError || !watches?.length) {
      return NextResponse.json({ watchlist: [] });
    }

    const projectIds = watches.map((w) => w.project_id);

    // Fetch projects, alert preferences, and latest signals in parallel
    const [projectsResult, prefsResult, signalsResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, tagline, category, upvotes, watchers, twitter_handle, logo_url")
        .in("id", projectIds),
      supabase
        .from("alert_preferences")
        .select("project_id, metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events")
        .eq("user_id", user.id)
        .in("project_id", projectIds),
      supabase
        .from("signals")
        .select("id, project_id, type, title, description, detected_at")
        .in("project_id", projectIds)
        .eq("is_published", true)
        .order("detected_at", { ascending: false })
        .limit(50),
    ]);

    const projects = projectsResult.data ?? [];
    const prefs = prefsResult.data ?? [];
    const signals = signalsResult.data ?? [];

    // Build watchlist entries
    const watchlist = watches.map((w) => {
      const project = projects.find((p) => p.id === w.project_id);
      const alertPrefs = prefs.find((p) => p.project_id === w.project_id);
      const projectSignals = signals
        .filter((s) => s.project_id === w.project_id)
        .slice(0, 5);

      return {
        project_id: w.project_id,
        watched_at: w.created_at,
        project: project ?? null,
        preferences: alertPrefs ?? null,
        recent_signals: projectSignals,
      };
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

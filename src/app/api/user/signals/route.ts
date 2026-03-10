import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({ signals: [], total: 0 });
    }

    // Get watched project IDs and alert preferences
    const { data: watches } = await supabase
      .from("watches")
      .select("project_id")
      .eq("user_id", user.id);

    if (!watches?.length) {
      return NextResponse.json({ signals: [], total: 0 });
    }

    const projectIds = watches.map((w) => w.project_id);

    // Get user's alert preferences to filter signal types
    const { data: prefs } = await supabase
      .from("alert_preferences")
      .select("project_id, metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events")
      .eq("user_id", user.id)
      .in("project_id", projectIds);

    // Build per-project enabled signal types
    const enabledTypes = new Map<string, Set<string>>();
    for (const p of prefs ?? []) {
      const types = new Set<string>();
      if (p.metrics_milestones) types.add("metrics_milestones");
      if (p.new_features_launches) types.add("new_features_launches");
      if (p.partnerships_integrations) types.add("partnerships_integrations");
      if (p.all_updates) types.add("all_updates");
      if (p.token_events) types.add("token_events");
      enabledTypes.set(p.project_id, types);
    }

    // Fetch signals from watched projects
    const { data: allSignals, error: signalError } = await supabase
      .from("signals")
      .select("id, project_id, type, title, description, source, source_url, metric_name, metric_value, metric_previous, confidence, detected_at")
      .in("project_id", projectIds)
      .eq("is_published", true)
      .order("detected_at", { ascending: false })
      .range(0, (offset + limit) * 2); // fetch extra to filter by prefs

    if (signalError) {
      console.error("Signals error:", signalError);
      return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
    }

    // Filter signals by user alert preferences
    const filtered = (allSignals ?? []).filter((s) => {
      const projTypes = enabledTypes.get(s.project_id);
      if (!projTypes) return false;
      return projTypes.has(s.type);
    });

    const paginated = filtered.slice(offset, offset + limit);

    // Enrich with project names
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, category")
      .in("id", projectIds);

    const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

    const enriched = paginated.map((s) => {
      const proj = projectMap.get(s.project_id);
      return {
        ...s,
        project_name: proj?.name ?? "Unknown",
        project_slug: s.project_id,
        project_category: proj?.category ?? "Unknown",
      };
    });

    return NextResponse.json({
      signals: enriched,
      total: filtered.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching signals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

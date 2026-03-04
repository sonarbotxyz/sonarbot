import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/auth";
import { isValidUUID } from "@/lib/validate";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: projectId } = await params;
    if (!isValidUUID(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      metrics_milestones,
      new_features_launches,
      partnerships_integrations,
      all_updates,
      token_events,
    } = body;

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is watching this project
    const { data: watch } = await supabase
      .from("watches")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .single();

    if (!watch) {
      return NextResponse.json({ error: "Not watching this project" }, { status: 400 });
    }

    const { data: prefs, error } = await supabase
      .from("alert_preferences")
      .upsert(
        {
          user_id: user.id,
          project_id: projectId,
          metrics_milestones: Boolean(metrics_milestones),
          new_features_launches: Boolean(new_features_launches),
          partnerships_integrations: Boolean(partnerships_integrations),
          all_updates: Boolean(all_updates),
          token_events: Boolean(token_events),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,project_id" }
      )
      .select("metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events")
      .single();

    if (error) {
      console.error("Alert preferences error:", error);
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error updating alert preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/auth";
import { isValidUUID } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";
import { canWatch } from "@/lib/subscription";

/** Upsert user by privy_id, return their UUID. */
async function ensureUser(privyId: string, handle: string, avatar?: string) {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("privy_id", privyId)
    .single();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("users")
    .insert({ privy_id: privyId, email: handle })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return created.id as string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!rateLimit(`watch:${auth.handle}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id: projectId } = await params;
    if (!isValidUUID(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify project exists
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Upsert user
    const userId = await ensureUser(auth.userId, auth.handle, auth.avatar);

    // Check subscription watch limit
    const allowed = await canWatch(userId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Watch limit reached. Upgrade to Pro for unlimited watches.",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // Create watch (ignore conflict = already watching)
    const { error: watchError } = await supabase
      .from("watches")
      .upsert({ user_id: userId, project_id: projectId }, { onConflict: "user_id,project_id" });

    if (watchError) {
      console.error("Watch error:", watchError);
      return NextResponse.json({ error: "Failed to watch" }, { status: 500 });
    }

    // Create default alert preferences
    const { data: prefs } = await supabase
      .from("alert_preferences")
      .upsert(
        {
          user_id: userId,
          project_id: projectId,
          metrics_milestones: true,
          new_features_launches: true,
          partnerships_integrations: false,
          all_updates: false,
          token_events: false,
        },
        { onConflict: "user_id,project_id" }
      )
      .select("metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events")
      .single();

    return NextResponse.json({ watched: true, preferences: prefs });
  } catch (error) {
    console.error("Error watching project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!rateLimit(`watch:${auth.handle}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id: projectId } = await params;
    if (!isValidUUID(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({ watched: false });
    }

    // Delete alert preferences + watch
    await supabase
      .from("alert_preferences")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", projectId);

    await supabase
      .from("watches")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", projectId);

    return NextResponse.json({ watched: false });
  } catch (error) {
    console.error("Error unwatching project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
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

    const supabase = getSupabase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", auth.userId)
      .single();

    if (!user) {
      return NextResponse.json({ watched: false, preferences: null });
    }

    const { data: watch } = await supabase
      .from("watches")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .single();

    if (!watch) {
      return NextResponse.json({ watched: false, preferences: null });
    }

    const { data: prefs } = await supabase
      .from("alert_preferences")
      .select("metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .single();

    return NextResponse.json({ watched: true, preferences: prefs ?? null });
  } catch (error) {
    console.error("Error checking watch status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

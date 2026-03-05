import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/auth";
import { isValidUUID } from "@/lib/validate";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!rateLimit(`upvote:${auth.handle}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const { id: projectId } = await params;
    if (!isValidUUID(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { handle, isAgent } = auth;

    // Check project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if already upvoted
    const { data: existingUpvote } = await supabase
      .from("project_upvotes")
      .select("id")
      .eq("project_id", projectId)
      .eq("twitter_handle", handle)
      .single();

    let action: "added" | "removed";

    if (existingUpvote) {
      // Remove upvote (toggle)
      await supabase
        .from("project_upvotes")
        .delete()
        .eq("project_id", projectId)
        .eq("twitter_handle", handle);
      action = "removed";
    } else {
      // Add upvote
      const { error: upvoteError } = await supabase
        .from("project_upvotes")
        .insert({
          project_id: projectId,
          twitter_handle: handle,
          is_agent: isAgent,
        });

      if (upvoteError) {
        console.error("Upvote error:", upvoteError);
        return NextResponse.json(
          { error: "Failed to upvote" },
          { status: 500 }
        );
      }
      action = "added";
    }

    // Re-count upvotes to avoid race conditions
    const { count } = await supabase
      .from("project_upvotes")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    await supabase
      .from("projects")
      .update({ upvotes: count ?? 0 })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      action,
      upvotes: count ?? 0,
    });
  } catch (error) {
    console.error("Error processing upvote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/auth";
import { sanitizeText, clampInt } from "@/lib/validate";

const VALID_CATEGORIES = [
  "defi",
  "agents",
  "infrastructure",
  "consumer",
  "gaming",
  "social",
  "tools",
  "other",
];

const VALID_SORTS = ["newest", "upvotes", "trending", "health", "watchers"];

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search");
    const limit = clampInt(searchParams.get("limit"), 50, 1, 100);
    const offset = clampInt(searchParams.get("offset"), 0, 0, 10000);

    if (!VALID_SORTS.includes(sort)) {
      return NextResponse.json(
        { error: `Invalid sort. Must be one of: ${VALID_SORTS.join(", ")}` },
        { status: 400 }
      );
    }

    // Base query: select projects with their latest health score
    let query = supabase
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
      .eq("is_approved", true);

    if (category && category !== "all") {
      query = query.eq("category", category.toLowerCase());
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,tagline.ilike.%${search}%`
      );
    }

    // Apply sort order
    if (sort === "health") {
      // Sort by health score descending — projects without scores go last
      query = query.order("created_at", { ascending: false });
    } else if (sort === "upvotes") {
      query = query.order("upvotes", { ascending: false });
    } else if (sort === "trending") {
      query = query
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (sort === "watchers") {
      query = query.order("watchers", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: projects, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Post-process: attach latest health score as a flat field
    const enriched = (projects || []).map((p) => {
      const scores = p.health_scores as Array<{
        score: number;
        holder_sub: number;
        dev_sub: number;
        liquidity_sub: number;
        social_sub: number;
        volume_sub: number;
        timestamp: string;
      }> | null;

      // Get the most recent health score
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

    // Sort by health score if requested (post-process since Supabase can't sort on joined data)
    if (sort === "health") {
      enriched.sort((a, b) => (b.health_score ?? -1) - (a.health_score ?? -1));
    }

    return NextResponse.json({
      projects: enriched,
      count: enriched.length,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const body = await request.json();

    const name = body.name ? sanitizeText(body.name) : "";
    const tagline = body.tagline ? sanitizeText(body.tagline) : "";
    const description = body.description
      ? sanitizeText(body.description)
      : "";

    if (!name || !tagline) {
      return NextResponse.json(
        { error: "name and tagline are required" },
        { status: 400 }
      );
    }

    const category = (body.category || "other").toLowerCase();
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("name", name)
      .eq("submitted_by_twitter", auth.handle)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted this project" },
        { status: 409 }
      );
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name,
        tagline,
        description,
        website_url: body.website_url || body.website || null,
        github_url: body.github_url || null,
        logo_url: body.logo_url || null,
        twitter_handle: body.twitter_handle?.replace(/^@/, "") || null,
        category,
        submitted_by_twitter: auth.handle,
        upvotes: 0,
        is_approved: true,
        // New v2 fields
        contract_address: body.contract_address || null,
        chain: body.chain || "base",
        x_user_id: body.x_user_id || null,
        github_repo: body.github_repo || null,
        farcaster_handle: body.farcaster_handle || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to submit project" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, project, message: "Project submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

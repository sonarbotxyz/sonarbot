import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("privy_id", auth.userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Delete any existing codes for this user
  await supabase
    .from("telegram_link_codes")
    .delete()
    .eq("user_id", user.id);

  // Generate a random 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase.from("telegram_link_codes").insert({
    user_id: user.id,
    code,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Failed to create telegram link code:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    code,
    expires_in: 600,
    bot_url: "https://t.me/sonarwatcher_bot",
  });
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("privy_id", auth.userId)
    .single();

  if (!user) {
    return NextResponse.json({ linked: false });
  }

  const { data: link } = await supabase
    .from("telegram_links")
    .select("username, chat_id")
    .eq("user_id", user.id)
    .single();

  if (!link || !link.username) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({
    linked: true,
    username: link.username,
    activated: !!link.chat_id,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  let username = (body.username || "").trim();
  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  // Strip @ prefix if present
  if (username.startsWith("@")) {
    username = username.slice(1);
  }
  username = username.toLowerCase();

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("privy_id", auth.userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await supabase.from("telegram_links").upsert(
    { user_id: user.id, username },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to save telegram username:", error);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }

  return NextResponse.json({ linked: true, username });
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("privy_id", auth.userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await supabase
    .from("telegram_links")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.json({ linked: false });
}

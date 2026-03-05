import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  // Verify webhook secret if configured
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json();
  const message = body.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const text = message.text.trim();
  const username = (message.from?.username || "").toLowerCase();

  // Handle 6-digit pairing codes
  if (/^\d{6}$/.test(text)) {
    const supabase = getSupabase();
    const { data: linkCode } = await supabase
      .from("telegram_link_codes")
      .select("user_id, expires_at")
      .eq("code", text)
      .single();

    if (linkCode && new Date(linkCode.expires_at) > new Date()) {
      // Link the user's telegram
      await supabase.from("telegram_links").upsert(
        {
          user_id: linkCode.user_id,
          chat_id: chatId,
          username: username || null,
        },
        { onConflict: "user_id" }
      );

      // Delete the used code
      await supabase
        .from("telegram_link_codes")
        .delete()
        .eq("code", text);

      await sendTelegramMessage(
        chatId,
        "Connected! You'll receive signal alerts here."
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "Invalid or expired code. Generate a new one from sonarbot.vercel.app"
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (text === "/start" || text.startsWith("/start")) {
    if (username) {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("telegram_links")
        .update({ chat_id: chatId })
        .eq("username", username)
        .select("id")
        .single();

      if (data) {
        await sendTelegramMessage(
          chatId,
          "Connected! You'll receive signal alerts from Sonarbot here."
        );
      } else {
        await sendTelegramMessage(
          chatId,
          "Welcome to Sonarbot!\n\n" +
            "To connect your account:\n" +
            "1. Go to sonarbot.vercel.app\n" +
            "2. Sign in and go to My Signal > Settings\n" +
            "3. Click 'Connect Telegram' to get a pairing code\n" +
            "4. Send the 6-digit code here"
        );
      }
    } else {
      await sendTelegramMessage(
        chatId,
        "Welcome to Sonarbot!\n\n" +
          "To connect your account:\n" +
          "1. Go to sonarbot.vercel.app\n" +
          "2. Sign in and go to My Signal > Settings\n" +
          "3. Click 'Connect Telegram' to get a pairing code\n" +
          "4. Send the 6-digit code here"
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

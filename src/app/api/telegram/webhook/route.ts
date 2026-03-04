import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const message = body.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const text = message.text.trim();
  const username = (message.from?.username || "").toLowerCase();

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
            "To receive alerts:\n" +
            "1. Go to sonarbot.vercel.app\n" +
            "2. Sign in and watch projects\n" +
            "3. Enter your Telegram @username in Settings\n" +
            "4. Come back here and send /start again"
        );
      }
    } else {
      await sendTelegramMessage(
        chatId,
        "Please set a Telegram username in your Telegram settings first, then try /start again."
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

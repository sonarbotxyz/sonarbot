export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  parseMode: string = "HTML"
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    }
  );

  if (!res.ok) {
    console.error(
      `Telegram sendMessage failed (chat_id=${chatId}):`,
      await res.text()
    );
  }
}

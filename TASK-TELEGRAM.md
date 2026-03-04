# TASK: Phase 5 — Telegram Handle + Notifications

## Overview
Simple text field for users to enter their Telegram username. When signals fire, we notify them via the bot.

## What to Build

### 1. Telegram Handle API (src/app/api/user/telegram/route.ts)

**GET** — Check if user has Telegram linked
```typescript
// Returns { linked: boolean, username?: string }
// Query telegram_links table by user_id
```

**PUT** — Save/update Telegram handle
```typescript
// Body: { username: string }
// Strip @ prefix if present
// Upsert into telegram_links: user_id, username
// Return { linked: true, username }
```

**DELETE** — Remove Telegram link
```typescript
// Delete from telegram_links where user_id matches
```

### 2. Update telegram_links table

Need username column and different constraint:
```sql
ALTER TABLE telegram_links ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE telegram_links DROP CONSTRAINT IF EXISTS telegram_links_chat_id_key;
ALTER TABLE telegram_links ADD CONSTRAINT telegram_links_user_id_key UNIQUE(user_id);
```

### 3. Update My Signal Settings UI (src/app/my-signal/page.tsx)

Replace the current hardcoded NotificationSettings with a real component:

- On mount: GET /api/user/telegram → check if linked
- Show a text input with placeholder "@username" 
- If already linked, pre-fill with saved username, show "Connected ✓" status
- Save button that calls PUT /api/user/telegram
- Small "Remove" link if connected

Keep it minimal — just the Telegram field under "Notification Channels". Remove the email and in-app toggles for now (not implemented).

### 4. Telegram Message Helper (src/lib/telegram.ts)

```typescript
export async function sendTelegramMessage(chatId: string | number, text: string, parseMode: string = "HTML") {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

// Resolve a @username to a chat_id by looking it up in telegram_links
// For now, we store chat_id when the bot receives a /start from the user
// But for the simple username approach, we'll need to send via @username
// Telegram Bot API requires chat_id, not username, to send messages
// So we need a way to get the chat_id...
```

IMPORTANT: Telegram Bot API can only send messages to users who have STARTED a conversation with the bot. It cannot send messages by username alone. So:

**Hybrid approach:**
1. User enters their Telegram @username in settings (saved to DB)
2. We show a message: "To receive notifications, also send /start to @sonarwatcher_bot"
3. Bot webhook (src/app/api/telegram/webhook/route.ts) handles /start:
   - Get the username from the Telegram message
   - Look up telegram_links where username matches
   - Update the chat_id field
   - Reply "✅ Connected! You'll receive signal alerts here."
4. When sending notifications, only send to users who have BOTH username and chat_id set

### 5. Telegram Bot Webhook (src/app/api/telegram/webhook/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const message = body.message;
  if (!message?.text) return NextResponse.json({ ok: true });
  
  const chatId = String(message.chat.id);
  const text = message.text.trim();
  const username = (message.from?.username || "").toLowerCase();
  
  if (text === "/start" || text.startsWith("/start")) {
    if (username) {
      // Try to link this chat_id with a user who entered this username
      const supabase = getSupabase();
      const { data } = await supabase
        .from("telegram_links")
        .update({ chat_id: chatId })
        .eq("username", username)
        .select("id")
        .single();
      
      if (data) {
        await sendTelegramMessage(chatId, "✅ Connected! You'll receive signal alerts from Sonarbot here.");
      } else {
        await sendTelegramMessage(chatId,
          "👋 Welcome to Sonarbot!\n\n" +
          "To receive alerts:\n" +
          "1. Go to sonarbot.vercel.app\n" +
          "2. Sign in and watch projects\n" +
          "3. Enter your Telegram @username in Settings\n" +
          "4. Come back here and send /start again"
        );
      }
    } else {
      await sendTelegramMessage(chatId,
        "Please set a Telegram username in your Telegram settings first, then try /start again."
      );
    }
    return NextResponse.json({ ok: true });
  }
  
  return NextResponse.json({ ok: true });
}
```

### 6. Signal Notification Sender (src/lib/pipeline/notify.ts)

Called after signals are inserted in the cron:

```typescript
export async function notifyWatchers(signals: InsertedSignal[]) {
  const supabase = getSupabase();
  
  for (const signal of signals) {
    // Get all watchers of this project who have the matching signal type enabled
    const { data: watchers } = await supabase
      .from("watches")
      .select("user_id")
      .eq("project_id", signal.project_id);
    
    if (!watchers?.length) continue;
    
    const userIds = watchers.map(w => w.user_id);
    
    // Get alert preferences for these users
    const { data: prefs } = await supabase
      .from("alert_preferences")
      .select("user_id, metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events")
      .in("user_id", userIds)
      .eq("project_id", signal.project_id);
    
    // Filter to users who want this signal type
    const signalTypeColumn = signal.type; // e.g. "metrics_milestones"
    const eligibleUserIds = (prefs || [])
      .filter(p => p[signalTypeColumn as keyof typeof p] === true)
      .map(p => p.user_id);
    
    if (!eligibleUserIds.length) continue;
    
    // Get telegram links for eligible users (only those with chat_id set)
    const { data: links } = await supabase
      .from("telegram_links")
      .select("user_id, chat_id")
      .in("user_id", eligibleUserIds)
      .not("chat_id", "is", null);
    
    if (!links?.length) continue;
    
    // Get project name
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", signal.project_id)
      .single();
    
    const projectName = project?.name || "Unknown";
    
    // Send notifications
    for (const link of links) {
      const message = 
        `🔔 <b>${projectName}</b>\n\n` +
        `${signal.title}\n` +
        (signal.description ? `${signal.description}\n\n` : "\n") +
        `→ sonarbot.vercel.app/project/${signal.project_id}`;
      
      await sendTelegramMessage(link.chat_id, message);
      
      // Insert notification record
      await supabase.from("notifications").insert({
        user_id: link.user_id,
        signal_id: signal.id,
        project_id: signal.project_id,
        sent_via: "telegram",
      });
    }
  }
}
```

### 7. Wire into Signal Cron

In src/app/api/cron/signals/route.ts, after X and GitHub pipelines run and signals are inserted, call notifyWatchers with the newly created signals.

### 8. Register Webhook

After deploy, register the bot webhook:
```
POST https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook
Body: { "url": "https://sonarbot.vercel.app/api/telegram/webhook" }
```

## Important
- Bot username: sonarwatcher_bot
- TELEGRAM_BOT_TOKEN already in env vars
- DO NOT change any existing styling except the NotificationSettings component
- Run npm run build when done
- Commit and push to origin main

When done run: openclaw system event --text "Done: Phase 5 — Telegram handle + notifications" --mode now

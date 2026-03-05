# TASK: Telegram Pairing Modal

## Overview
Replace the text field Telegram setup with an interactive code-based pairing system.

## Flow
1. User is logged in, clicks "Connect Telegram" (in sidebar or settings)
2. Modal opens → calls POST /api/user/telegram to generate a 6-digit code
3. Modal displays:
   - Big 6-digit code (tap to copy)
   - "Send this code to @sonarwatcher_bot"  
   - "Open Bot" button → t.me/sonarwatcher_bot
   - Spinner/status text: "Waiting for connection..."
4. User opens bot, sends the code
5. Bot webhook receives the code → looks it up → links chat_id + user → replies "✅ Connected!"
6. Modal polls GET /api/user/telegram every 2 seconds
7. When linked+activated detected → modal shows ✅ "Connected!" → auto-closes after 2s

## What to Build/Modify

### 1. Update /api/user/telegram (src/app/api/user/telegram/route.ts)

**POST** — Generate pairing code
```typescript
// Generate a random 6-digit numeric code
// Store in telegram_link_codes: user_id, code, expires_at (10 min)
// Delete any existing codes for this user first (only 1 active at a time)
// Return { code: "123456", expires_in: 600, bot_url: "https://t.me/sonarwatcher_bot" }
```

**GET** — Check status (already exists, keep it)
- Returns { linked: boolean, username?: string, activated: boolean }

**DELETE** — Unlink (already exists, keep it)

### 2. Update Bot Webhook (src/app/api/telegram/webhook/route.ts)

Handle numeric codes (not just /start):
```typescript
// If message text is a 6-digit number:
//   Look up in telegram_link_codes where code matches and not expired
//   If found:
//     Upsert telegram_links with user_id, chat_id, username (from telegram)
//     Delete the used code
//     Reply "✅ Connected! You'll receive signal alerts here."
//   If not found:
//     Reply "❌ Invalid or expired code. Generate a new one from sonarbot.vercel.app"
//
// If /start:
//   Reply with welcome message + instructions
```

### 3. Create TelegramPairingModal Component (src/components/TelegramPairingModal.tsx)

```tsx
"use client";
// Props: { isOpen, onClose, accessToken }
// State: code, status ('generating' | 'waiting' | 'connected' | 'error'), timeLeft
// 
// On open:
//   POST /api/user/telegram → get code
//   Start polling GET /api/user/telegram every 2s
//   Start countdown timer (10 min)
//
// UI Layout (centered modal with dark overlay):
//   Header: "Connect Telegram" with X close button
//   Body:
//     Big mono-spaced 6-digit code with copy button
//     "Send this code to @sonarwatcher_bot"
//     "Open Bot" button (opens t.me/sonarwatcher_bot in new tab)
//     Status indicator: spinning dots → "Waiting for connection..."
//     When connected: green checkmark animation → "Connected!"
//   Footer: expiry countdown "Code expires in X:XX"
//
// On connected: show success for 2s, then call onClose
// On close: stop polling
//
// Style: Match existing modal style (var(--bg-secondary), var(--border-strong), var(--accent))
// Use Framer Motion for enter/exit and the success animation
```

### 4. Update My Signal Settings (src/app/my-signal/page.tsx)

Replace the NotificationSettings text input with:
- If NOT linked: "Connect Telegram" button → opens TelegramPairingModal
- If linked + activated: "✅ Connected as @username" + "Disconnect" button
- If linked but NOT activated: "Pending" status + "Reconnect" button

### 5. Update Project Detail Sidebar (src/components/ProjectDetail.tsx)

In the sidebar, below Alert Preferences, add a small prompt:
- If user is watching but no Telegram linked: 
  "🔔 Connect Telegram to receive alerts" → opens TelegramPairingModal
- If linked: show small "✅ Telegram connected" text

### 6. SQL needed (tell Boss to run):
```sql
-- telegram_link_codes table should already exist from before
-- Just make sure chat_id is nullable on telegram_links
ALTER TABLE telegram_links ALTER COLUMN chat_id DROP NOT NULL;
```

## Important
- Bot username: sonarwatcher_bot  
- Modal must be CENTERED (learn from previous bug)
- Use fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
- Polling interval: 2 seconds
- Code expiry: 10 minutes
- Clean up: stop polling on unmount and on close
- DO NOT change any other existing UI or styling
- Run npm run build when done
- Commit and push to origin main

When done run: openclaw system event --text "Done: Telegram pairing modal" --mode now

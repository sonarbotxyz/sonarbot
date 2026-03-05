# TASK: Context-Aware Signal Enrichment

## Overview
Before sending any signal notification, enrich it with cross-source context using Gemini. Turn raw alerts into analyst-grade insights.

## What to Build

### 1. Signal Context Enricher (src/lib/pipeline/signal-context.ts)

For any signal (metrics, X, or GitHub), gather context from all sources and generate an AI analysis.

```typescript
interface SignalContext {
  // The original signal
  signal: { type: string; title: string; description: string; project_id: string };
  // Enrichment data gathered
  recentTweets: string[];        // Last 3 tweets from the project (text only)
  onchainDelta: {                // Change vs previous snapshot
    holders: { current: number; previous: number; change: number };
    marketcap: { current: number; previous: number; changePct: number };
    volume24h: { current: number; previous: number; changePct: number };
    liquidity: { current: number; previous: number; changePct: number };
  } | null;
  recentGithubActivity: string | null;  // e.g. "3 commits today" or "v2.1.0 released"
  // AI-generated analysis
  analysis: string;  // 2-3 sentence contextual analysis from Gemini
}
```

#### Steps:
1. **Fetch recent tweets** — Use X API to get last 3 tweets from project's twitter_handle (skip replies/RTs)
2. **Fetch on-chain delta** — Get 2 most recent snapshots, calculate changes
3. **Fetch GitHub activity** — Check recent commits count + latest release (if github_url exists)
4. **Generate analysis with Gemini** — Send all context + the signal to Gemini Flash:

```
You are a crypto market analyst for the Base ecosystem. A signal was detected for {project_name}:

Signal: {signal.title}
{signal.description}

Recent tweets from @{twitter_handle}:
{tweets or "No recent tweets"}

On-chain changes (24h):
- Market cap: ${prev} → ${current} ({changePct}%)
- Volume: ${prev} → ${current} ({changePct}%)
- Holders: {prev} → {current} ({change})
- Liquidity: ${prev} → ${current} ({changePct}%)

GitHub activity:
{github_activity or "No GitHub URL configured"}

Write a 2-3 sentence analysis explaining what's happening and why. Be specific with numbers. If you can identify a likely catalyst, mention it. Be concise and direct — no fluff.
```

5. Return the enriched signal with the AI analysis

### 2. Update notify.ts to use enriched signals

In `notifyWatchers()`, before sending the Telegram message:
- Call `enrichSignal(signal)` to get the context
- Format the notification with the analysis:

```
🔔 <b>{project_name}</b>

{signal.title}

{analysis}

📊 MCap: ${mcap} ({changePct}%) | Vol: ${vol} | Holders: {holders}

→ sonarbot.vercel.app/project/{id}
```

### 3. Update metrics-signals.ts

After inserting a signal, pass it through the enricher before notifying:
- Change: `await notifyWatchers([inserted])`
- To: `await notifyEnriched(inserted, project.name, project.contract_address, twitterHandle, githubUrl)`

Create a helper `notifyEnriched()` that:
1. Calls `enrichSignal()` 
2. Formats the enriched notification
3. Sends via Telegram with the richer format

### 4. Update signal cron (signals/route.ts)

Same enrichment for X and GitHub signals before notifying.

### 5. Enriched Telegram Format

```
🔔 <b>Bankrbot</b>

📈 Volume surged 5x to $735K

24h volume spike likely driven by V2 agent funding announcement 
posted on X 3 hours ago. 1,200 new holders added in the last 
day, suggesting strong organic interest rather than bot activity.

📊 MCap: $55.5M (+9.1%) | Vol: $735K | Holders: 229.1K (+1.2K)

→ sonarbot.vercel.app/project/30b6768b...
```

## Important
- Gemini API: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}
- Body: { "contents": [{ "parts": [{ "text": prompt }] }] }
- Parse: response.candidates[0].content.parts[0].text
- If Gemini fails, fall back to the original signal description (don't block the notification)
- If X API fails for tweets, just say "No recent tweets found"
- Keep analysis to 2-3 sentences MAX
- DO NOT change any UI components
- Run npm run build when done
- Commit and push to origin main

When done run: openclaw system event --text "Done: Context-aware signal enrichment" --mode now

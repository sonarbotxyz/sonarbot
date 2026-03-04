# TASK: Phase 4 — Signal Pipeline (X + GitHub)

## Overview
Build automated signal detection from X (Twitter) and GitHub. Cron jobs fetch new content, Gemini AI classifies it, and inserts into the existing `signals` table.

## Environment Variables (already set)
- `X_BEARER_TOKEN` — X API v2 bearer token
- `GEMINI_API_KEY` — Google Gemini API key for classification
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — DB access
- `CRON_SECRET` — Auth for cron endpoints

## What to Build

### 1. Signal Classifier (src/lib/pipeline/signal-classifier.ts)

Use Gemini API (https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent) to classify content.

```typescript
interface ClassificationResult {
  type: 'metrics_milestones' | 'new_features_launches' | 'partnerships_integrations' | 'all_updates' | 'token_events';
  title: string;        // Short signal title (max 100 chars)
  description: string;  // 1-2 sentence summary
  confidence: 'high' | 'medium' | 'low';
}
```

Prompt template:
```
You are a crypto project signal classifier. Classify this content from {project_name} into exactly ONE category:

- metrics_milestones: TVL, holder count, volume crossing thresholds, ATH, growth milestones
- new_features_launches: Product updates, new versions, feature releases, deployments
- partnerships_integrations: New partners, collaborations, chain expansions, integrations
- token_events: Listings, liquidity events, tokenomics changes, burns, airdrops
- all_updates: General news, team updates, community posts, anything else

Content: {content}

Respond with JSON only:
{"type": "...", "title": "...", "description": "...", "confidence": "high|medium|low"}
```

Call Gemini via fetch:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}
Body: { "contents": [{ "parts": [{ "text": prompt }] }] }
```

Parse response: response.candidates[0].content.parts[0].text — parse as JSON.

### 2. X Signal Pipeline (src/lib/pipeline/signals-x.ts)

Fetch recent tweets from each tracked project using X API v2:

```
GET https://api.twitter.com/2/tweets/search/recent?query=from:{twitter_handle}&max_results=10&tweet.fields=created_at,public_metrics,referenced_tweets
Authorization: Bearer ${X_BEARER_TOKEN}
```

For each tweet:
- Skip if it's a reply (referenced_tweets contains "replied_to") or pure RT
- Skip if tweet_id already exists in signals table (check source_url)
- Classify with Gemini
- If confidence is "high" or "medium", insert into signals table:
  - project_id: the project's UUID
  - type: from classification
  - title: from classification
  - description: from classification
  - source: "x"
  - source_url: "https://x.com/{handle}/status/{tweet_id}"
  - confidence: from classification

### 3. GitHub Signal Pipeline (src/lib/pipeline/signals-github.ts)

For projects with github_url set, fetch recent activity:

**Releases** (highest priority):
```
GET https://api.github.com/repos/{owner}/{repo}/releases?per_page=5
```
- New release since last check → `new_features_launches` signal
- Title: release name, Description: first 200 chars of release body

**Commits** (activity indicator):
```
GET https://api.github.com/repos/{owner}/{repo}/commits?per_page=20&since={24h_ago}
```
- If 5+ commits in 24h → `all_updates` signal: "Active development: X commits in the last 24h"
- Individual notable commits (message contains "feat:", "fix:", "breaking") → classify with Gemini

For each signal:
- Check source_url doesn't already exist in signals table (dedup)
- source: "github"
- source_url: release URL or commit URL

### 4. Cron Endpoint: /api/cron/signals (src/app/api/cron/signals/route.ts)

```typescript
export async function GET(request: NextRequest) {
  // Auth check with CRON_SECRET
  // Run X pipeline for all projects
  // Run GitHub pipeline for all projects with github_url
  // Return summary of signals created
}
```

### 5. Add to vercel.json crons

Add: `{ "path": "/api/cron/signals", "schedule": "*/30 * * * *" }` (every 30 min)

### 6. Track last check timestamp

Create a simple table or use a key-value approach. Add to the signals pipeline:
- Before fetching, get the latest signal timestamp for each project+source combo
- Only process content newer than that timestamp
- This prevents re-processing old tweets/commits on every run

You can use the signals table itself for this — just query MAX(created_at) WHERE project_id=X AND source='x'.

## Important Rules
- DO NOT change any existing UI or styling
- All API calls should have try/catch with graceful error handling
- Rate limit awareness: X API free tier allows 500K tweets/month read
- GitHub API allows 60 requests/hour unauthenticated (enough for 3 projects)
- Gemini API: batch classifications, don't call for every single tweet
- Log errors but don't crash the pipeline — if one project fails, continue to next
- Run `npm run build` to verify compilation
- Commit with clear message and push to origin main

When done run: openclaw system event --text "Done: Phase 4 Signal Pipeline built — X + GitHub + Gemini classification" --mode now

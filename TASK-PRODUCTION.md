# TASK: Production Readiness Fixes

## Rules
- Do NOT change any UI styling, layout, or visual design
- Do NOT remove any features
- Focus on backend reliability, security, and correctness
- Run `npm run build` when done — must pass
- Commit and push to origin main when complete

## 🔴 CRITICAL FIXES

### 1. Remove duplicate social pipeline
There are TWO social pipelines:
- `src/lib/pipeline/social.ts` — uses `twitter_handle` (username lookup)
- `src/lib/pipeline/social/index.ts` — uses `x_user_id` (direct ID lookup)

**Fix:**
- DELETE `src/lib/pipeline/social.ts` (the top-level one)
- Keep `src/lib/pipeline/social/index.ts` as the canonical pipeline
- Update `src/app/api/cron/master/route.ts` import to use `src/lib/pipeline/social/index.ts`
- Update `src/app/api/cron/social/route.ts` if it exists to use the same
- Make sure the social/index.ts pipeline ALSO fetches github_stars and stores them

### 2. Fix SSRF in proxy-image
`src/app/api/proxy-image/route.ts` is an open SSRF vector.

**Fix:**
- Validate the URL is HTTPS only (block http://)
- Block private/internal IPs: 10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x, ::1, fc00::, fe80::
- Validate Content-Type response is actually an image (image/*)
- Add max response size limit (5MB)
- Return 400 for any blocked URL

### 3. Add rate limiting to write endpoints
Add a simple in-memory rate limiter (Map-based with TTL cleanup).

Create `src/lib/rate-limit.ts`:
```typescript
// Simple sliding-window rate limiter
// key: user identifier, limit: max requests, windowMs: time window
export function rateLimit(key: string, limit: number, windowMs: number): boolean
```

Apply to these routes (per authenticated user):
- POST `/api/projects/[id]/upvote` — 10 req/min
- POST `/api/projects/[id]/comments` — 5 req/min  
- POST `/api/projects` (submit) — 3 req/min
- POST/DELETE `/api/projects/[id]/watch` — 10 req/min

Return 429 Too Many Requests when exceeded.

### 4. Fix cron scheduling in vercel.json
Update `vercel.json` to schedule multiple crons:
```json
{
  "crons": [
    { "path": "/api/cron/master", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/social", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/health-score", "schedule": "0 */12 * * *" }
  ]
}
```
Note: These require Vercel Pro. Include a comment in the file.

### 5. Fix X tweet pipeline
In `src/app/api/cron/master/route.ts`, the `fetchProjectTweets` function:
- Remove the `-is:reply -is:retweet` filter from the query — it's too restrictive
- Keep the `from:${handle}` part
- Add AbortController with 10s timeout (already there, good)

Also in `src/lib/pipeline/signal-context.ts`, the `fetchRecentTweets` function:
- Same fix — remove `-is:reply -is:retweet` filter

## 🟡 IMPORTANT FIXES

### 6. Store github_stars in social pipeline
In `src/lib/pipeline/social/index.ts`:
- The `social_snapshots` table likely has no `github_stars` column
- Option A: Add it to the insert if the column exists
- Option B: Store stars in the existing social_snapshots as a separate field
- Check what columns the social_snapshots table has by looking at the migration files in `supabase/migrations/`
- If github_stars column doesn't exist, skip this — just document it as a needed migration

In `src/lib/pipeline/social.ts` (before deleting it), note that it fetches stars via `fetchRepoMetrics`. The social/index.ts `fetchGitHubActivity` only gets commits7d and lastPush. Update `src/lib/pipeline/social/github-api.ts` to also return stars, and update `social/index.ts` to store them.

### 7. Fix submit form missing contract_address
In `src/app/submit/page.tsx`, the `handleSubmit` function:
- Add `contract_address: formData.get("contract")` to the POST body JSON

### 8. Fix upvote race condition
In `src/app/api/projects/[id]/upvote/route.ts`:
- Instead of reading upvotes then writing upvotes+1, use Supabase RPC or raw SQL
- Simple fix: use `.rpc('increment_upvotes', { row_id: projectId })` if available
- Or simpler: just re-count upvotes from project_upvotes table after insert/delete:
  ```typescript
  const { count } = await supabase
    .from("project_upvotes")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  await supabase.from("projects").update({ upvotes: count ?? 0 }).eq("id", projectId);
  ```

### 9. Add AbortController timeouts to missing fetch calls
Add 10s AbortController timeouts to ALL external fetch calls that don't have them:
- `src/lib/pipeline/signal-classifier.ts` — both Gemini fetch calls
- `src/lib/pipeline/signal-context.ts` — `fetchRecentTweets`, `fetchGithubSummary`, `generateAnalysis` Gemini calls
- `src/lib/pipeline/social/x-api.ts` — `xApiFetch`
- `src/lib/pipeline/social/github-api.ts` — `githubFetch`

Pattern:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);
try {
  const res = await fetch(url, { ...opts, signal: controller.signal });
  clearTimeout(timeout);
  // ...
} catch (err) {
  clearTimeout(timeout);
  throw err;
}
```

### 10. Fix health scores showing fake data
In `src/lib/pipeline/health-score.ts`:
- When there's no social data AND no snapshot data, don't insert a health score at all (skip the project)
- When there's partial data, use 0 instead of 50 for missing sub-scores, and add a flag
- At minimum: if `currentSnap` is null (no snapshots at all), skip the project entirely

### 11. Fix useEffect after conditional return
In `src/components/ProjectDetail.tsx`:
- The `fetchPromoted` useEffect is placed AFTER `if (!project) return ...`
- Move ALL useEffect hooks above the early return, or restructure to avoid conditional hooks
- This is a React rules-of-hooks violation

### 12. Secure Telegram webhook
In `src/app/api/telegram/webhook/route.ts`:
- Add a secret token check. When setting the webhook via Telegram API, you can pass `secret_token`
- Check the `X-Telegram-Bot-Api-Secret-Token` header matches `process.env.TELEGRAM_WEBHOOK_SECRET`
- If no TELEGRAM_WEBHOOK_SECRET env var is set, skip the check (backward compatible)

## Testing
1. `npm run build` — must pass with zero errors
2. Check all imports resolve correctly after deleting social.ts
3. Commit with message: "fix: production readiness — security, rate limits, pipeline fixes"
4. Push to origin main

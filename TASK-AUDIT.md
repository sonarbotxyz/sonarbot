# TASK: Production Audit & Fix

## Context
The app has been built rapidly and has accumulated bugs. It needs a full audit to make it production-ready.

## Known Issues

### 1. Master Cron Timeout
`/api/cron/master` times out on Vercel (10s limit on Hobby, 60s on Pro). 
- The Alchemy RPC calls (`fetchActiveUsers`, `fetchHolderCount`) are extremely slow — scanning 43K+ blocks of logs
- Basescan HTML scrape downloads 500KB per token page
- All of these have been partially removed but the code is messy

**Fix:** 
- `onchain.ts` should ONLY use DexScreener API (one call per contract, already cached)
- Remove ALL Alchemy RPC calls — we don't use them
- Remove `fetchActiveUsers`, `fetchHolderCount` from onchain.ts entirely
- For holder count: query Basescan in a separate lightweight function, or just skip it
- Insert `holders: previousValue` and `active_users: 0, tx_count: 0` in snapshots
- The master cron should complete in under 15 seconds for 30 projects

### 2. Social Metrics Display
- X Followers, GitHub Stars show on the detail page from `social_snapshots` table
- The detail page API `/api/projects/[id]` needs to return the latest social snapshot data
- Check how `ProjectDetail.tsx` reads social data and ensure the API provides it

### 3. Health Score Calculation
- Health scores in DB have most sub-scores as 0 (holder_sub=0, dev_sub=0, social_sub=0, volume_sub=0)
- Only liquidity_sub has a value
- The health score cron `/api/cron/health-score` needs to actually calculate from real data:
  - **holder_sub**: based on holder count from latest snapshot
  - **dev_sub**: based on github_commits_7d from latest social snapshot
  - **liquidity_sub**: based on liquidity from latest snapshot
  - **social_sub**: based on x_followers from latest social snapshot  
  - **volume_sub**: based on volume_24h from latest snapshot
- Each sub-score should be 0-100 scaled relative to thresholds
- Check `/api/cron/health-score` route and its pipeline, fix the calculation

### 4. DebtReliefBot Twitter Handle
- Currently set to `grok` which returns Grok's 8.2M followers — WRONG
- Update in DB: `UPDATE projects SET twitter_handle = NULL WHERE name = 'DebtReliefBot';`
- Actually, check what the real handle is first, or just null it out

### 5. X Tweet Pipeline Not Finding Tweets
- `fetchProjectTweets` in master cron returns 0 tweets for all projects
- But BankrBot tweets 700K+ times (it's a bot)
- The X API `search/recent` only returns last 7 days
- The query uses `-is:reply -is:retweet` which might filter out all of BankrBot's automated tweets
- Fix: try without the filters, or use the user timeline endpoint instead

### 6. Clean Up Task Files
- Delete: TASK-TELEGRAM.md, TASK-TELEGRAM-PAIRING.md, TASK-SIGNAL-CONTEXT.md
- Delete: src/app/api/debug/social/route.ts (debug endpoint)

### 7. Vercel Env Vars Audit
- Ensure all required env vars are set on Vercel production:
  - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET  
  - X_BEARER_TOKEN (just fixed — verify it works)
  - X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
  - GEMINI_API_KEY
  - TELEGRAM_BOT_TOKEN
  - CRON_SECRET
  - ALCHEMY_API_KEY (can be removed if we drop Alchemy)

### 8. Code Quality
- Remove unused imports
- Remove console.log debugging statements (keep console.error for real errors)
- Ensure all API routes have proper error handling
- Ensure all fetch calls have timeouts (AbortController with 10s timeout)
- Remove PREF_KEY_MAP_REVERSE if it doesn't exist (check if it causes runtime errors)

## Testing After Fix
1. Run `npm run build` — must pass
2. Deploy to Vercel
3. Call `/api/cron/master` — must complete in under 15 seconds
4. Check the project detail page — all data should display
5. Verify social data shows (X Followers, GitHub Commits, GitHub Stars)
6. Verify health breakdown shows real values

## Important
- Do NOT change any UI styling or layout
- Do NOT remove any features
- Focus on making the backend reliable and fast
- Run npm run build when done
- Commit and push to origin main

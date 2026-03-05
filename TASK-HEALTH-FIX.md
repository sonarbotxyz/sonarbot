# TASK: Fix Health Scores & Social Metrics (Phase A)

## Rules
- Do NOT change any UI styling, layout, or visual design
- Do NOT remove any features
- Run `npm run build` when done — must pass
- Commit and push to origin main when complete

## Problem
Health breakdown shows all 0s except Liquidity (84). The social panel shows 97.8K X Followers and 33 GitHub Commits but health sub-scores don't reflect this data. Engagement rate shows 0.0%.

## Root Causes

### 1. Holders = 0 always
`onchain.ts` copies `prevSnap.holders` but it was never populated. DexScreener doesn't return holder count.

**Fix:** Add Basescan API call to get holder count. Use the token holders count endpoint.

Create `src/lib/pipeline/basescan.ts`:
```typescript
/**
 * Fetch token holder count from Basescan API.
 * Uses the tokenholdercount endpoint (free, needs API key).
 * Falls back to 0 if unavailable.
 */
export async function fetchHolderCount(contractAddress: string): Promise<number> {
  const apiKey = process.env.BASESCAN_API_KEY;
  if (!apiKey) return 0;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    // Basescan API: get token holder count
    const res = await fetch(
      `https://api.basescan.org/api?module=token&action=tokenholdercount&contractaddress=${contractAddress}&apikey=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (!res.ok) return 0;
    const json = await res.json();
    
    if (json.status === "1" && json.result) {
      return parseInt(json.result, 10) || 0;
    }
    return 0;
  } catch {
    clearTimeout(timeout);
    return 0;
  }
}
```

Then update `src/lib/pipeline/onchain.ts`:
- Import `fetchHolderCount` from `./basescan`
- In `takeSnapshot`, call `fetchHolderCount(contractAddress)` and use the real value
- Remove the previous snapshot holder copy logic
- Add it to the Promise.all:
```typescript
const [marketcap, volume24h, liquidity, holders] = await Promise.all([
  fetchMarketcap(contractAddress),
  fetchVolume24h(contractAddress),
  fetchLiquidity(contractAddress),
  fetchHolderCount(contractAddress),
]);
```
- Use `holders` directly in the insert (remove `finalHolders` and the prevSnap query)

### 2. Volume sub-score broken
`calcVolumeSub` returns 50 when `previousVolume <= 0` but the health score was using 0 for missing data. The issue is that when `weekAgoSnapshots` returns nothing, `oldSnap` is undefined and all comparisons use 0.

**Fix in `health-score.ts`:**
- `calcHolderSub`: When `holdersWeekAgo <= 0` AND `currentHolders > 0`, return a score based on absolute holder count instead of 50:
  - `< 100 holders → 20`
  - `100-500 → 40`  
  - `500-2000 → 60`
  - `2000-10000 → 80`
  - `> 10000 → 100`
- `calcVolumeSub`: When `previousVolume <= 0`, score based on absolute current volume:
  - `$0 → 0`
  - `< $1K → 20`
  - `$1K-$10K → 40`
  - `$10K-$100K → 60`
  - `$100K-$1M → 80`
  - `> $1M → 100`
- `calcLiquiditySub`: When `previousLiquidity <= 0`, score based on absolute current value:
  - `$0 → 0`
  - `< $10K → 20`
  - `$10K-$50K → 40`
  - `$50K-$250K → 60`
  - `$250K-$1M → 80`
  - `> $1M → 100`

### 3. Engagement rate is 0.0%
The `fetchXData` in `x-api.ts` fetches the last 10 tweets to calc engagement. For bot accounts with mostly automated tweets that get 0 likes, the rate is near 0%.

**Fix in `x-api.ts`:**
- Increase to `max_results=50` to get a larger sample
- Also include `quote_count` in engagement calculation (it's in XTweetMetrics but not used)
- Add impression-based engagement if available: include `impression_count` in tweet.fields
  - `tweet.fields=public_metrics,organic_metrics` (organic_metrics may need OAuth, so try with just public_metrics and impressions)
  - Actually, X API v2 includes `impression_count` in public_metrics for owned tweets
  - Update the fetch URL: `/users/${xUserId}/tweets?max_results=50&tweet.fields=public_metrics`
  - If impressions are available, use: `engagement = (likes + RTs + replies + quotes) / impressions * 100`
  - If not, fall back to follower-based calculation

### 4. Social sub-score uses followers but should also factor engagement
**Fix in `health-score.ts`:**
- Update `calcSocialSub` to take both `xFollowers` and `engagementRate`:
```typescript
function calcSocialSub(xFollowers: number, engagementRate: number): number {
  if (xFollowers <= 0) return 0;
  // Follower score (0-70): log scale
  const followerScore = Math.min(Math.round((Math.log10(xFollowers) / 6) * 70), 70);
  // Engagement bonus (0-30): 1% = 10, 3% = 20, 5%+ = 30
  const engagementBonus = Math.min(Math.round(engagementRate * 10), 30);
  return Math.min(followerScore + engagementBonus, 100);
}
```
- Update the call site to pass engagement rate from social_snapshots
- Also fetch `x_engagement_rate` from the social_snapshots query

## Testing
1. `npm run build` — must pass with zero errors
2. Commit with message: "fix: health scores use real holder counts, absolute thresholds, improved engagement"
3. Push to origin main

## Important
- BASESCAN_API_KEY env var needs to be set on Vercel after this deploys
- Boss can get a free Basescan API key at https://basescan.org/apis

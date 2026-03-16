/**
 * Health Score Calculator
 *
 * Computes a composite health score (0-100) for a project based on:
 *   - social_sub   (35%): X engagement + cashtag mentions
 *   - volume_sub   (25%): 24h volume trend
 *   - holder_sub   (20%): 7-day holder growth
 *   - liquidity_sub(15%): Liquidity stability
 *   - dev_sub       (5%): GitHub commit activity
 */

import { getSupabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Sub-score calculators
// ---------------------------------------------------------------------------

/** Holder growth sub-score (0-100). >10% 7d growth = 100, 0% = 50. */
function calcHolderSub(currentHolders: number, holdersWeekAgo: number): number {
  if (holdersWeekAgo <= 0) {
    // No baseline — score on absolute holder count
    if (currentHolders <= 0) return 0;
    if (currentHolders < 100) return 20;
    if (currentHolders < 500) return 40;
    if (currentHolders < 2000) return 60;
    if (currentHolders < 10000) return 80;
    return 100;
  }
  const growthPct =
    ((currentHolders - holdersWeekAgo) / holdersWeekAgo) * 100;
  if (growthPct >= 10) return 100;
  if (growthPct <= -10) return 0;
  // Linear interpolation: -10% → 0, 0% → 50, 10% → 100
  return Math.round(((growthPct + 10) / 20) * 100);
}

/** Dev activity sub-score (0-100). >20 commits/week = 100. */
function calcDevSub(commitsWeek: number): number {
  if (commitsWeek >= 20) return 100;
  if (commitsWeek <= 0) return 0;
  return Math.round((commitsWeek / 20) * 100);
}

/** Liquidity stability sub-score (0-100). >20% drop = low score. */
function calcLiquiditySub(
  currentLiquidity: number,
  previousLiquidity: number
): number {
  if (previousLiquidity <= 0) {
    // No baseline — score on absolute liquidity
    if (currentLiquidity <= 0) return 0;
    if (currentLiquidity < 10000) return 20;
    if (currentLiquidity < 50000) return 40;
    if (currentLiquidity < 250000) return 60;
    if (currentLiquidity < 1000000) return 80;
    return 100;
  }
  const changePct =
    ((currentLiquidity - previousLiquidity) / previousLiquidity) * 100;
  if (changePct >= 0) return 100; // Stable or growing
  if (changePct <= -20) return 0; // >20% drop
  // Linear: -20% → 0, 0% → 100
  return Math.round(((changePct + 20) / 20) * 100);
}

/** Social sub-score (0-100) based on X followers + engagement rate + cashtag mentions. */
function calcSocialSub(xFollowers: number, engagementRate: number, cashtagMentions: number): number {
  if (xFollowers <= 0 && cashtagMentions <= 0) return 0;
  // Follower score (0-40): log scale
  const followerScore = xFollowers > 0
    ? Math.min(Math.round((Math.log10(xFollowers) / 6) * 40), 40)
    : 0;
  // Engagement bonus (0-20): 1% = 7, 3% = 14, 5%+ = 20
  const engagementBonus = Math.min(Math.round(engagementRate * 7), 20);
  // Cashtag activity (0-40): log scale, 10 mentions = 15, 100 = 25, 1000+ = 40
  const cashtagScore = cashtagMentions > 0
    ? Math.min(Math.round((Math.log10(cashtagMentions) / 4) * 40), 40)
    : 0;
  return Math.min(followerScore + engagementBonus + cashtagScore, 100);
}

/** Volume trend sub-score (0-100). Compares current vs previous snapshot. */
function calcVolumeSub(
  currentVolume: number,
  previousVolume: number
): number {
  if (previousVolume <= 0) {
    // No baseline — score on absolute current volume
    if (currentVolume <= 0) return 0;
    if (currentVolume < 1000) return 20;
    if (currentVolume < 10000) return 40;
    if (currentVolume < 100000) return 60;
    if (currentVolume < 1000000) return 80;
    return 100;
  }
  const changePct =
    ((currentVolume - previousVolume) / previousVolume) * 100;
  if (changePct >= 50) return 100; // 50%+ growth is great
  if (changePct <= -50) return 0; // 50%+ decline is bad
  // Linear: -50% → 0, 0% → 50, 50% → 100
  return Math.round(((changePct + 50) / 100) * 100);
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

export async function calculateHealthScore(
  projectId: string
): Promise<void> {
  const supabase = getSupabase();

  // Fetch the two most recent on-chain snapshots (current + ~1 week ago)
  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("*")
    .eq("project_id", projectId)
    .order("timestamp", { ascending: false })
    .limit(2);

  // Fetch snapshot from ~7 days ago for holder growth
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekAgoSnapshots } = await supabase
    .from("snapshots")
    .select("holders, liquidity, volume_24h")
    .eq("project_id", projectId)
    .lte("timestamp", weekAgo)
    .order("timestamp", { ascending: false })
    .limit(1);

  // Fetch latest social snapshot
  const { data: socialData } = await supabase
    .from("social_snapshots")
    .select("x_followers, x_engagement_rate, github_commits_7d")
    .eq("project_id", projectId)
    .order("timestamp", { ascending: false })
    .limit(1);

  // Fetch latest cashtag snapshot for social score
  const { data: cashtagData } = await supabase
    .from("cashtag_snapshots")
    .select("tweet_count")
    .eq("project_id", projectId)
    .order("snapshot_at", { ascending: false })
    .limit(1);

  // Extract values with safe defaults
  const currentSnap = snapshots?.[0];
  const oldSnap = weekAgoSnapshots?.[0];
  const social = socialData?.[0];

  // Skip projects with no snapshot data at all — no real data to score
  if (!currentSnap) {
    return;
  }

  const currentHolders = currentSnap.holders ?? 0;
  const holdersWeekAgo = oldSnap?.holders ?? 0;
  const currentLiquidity = currentSnap.liquidity ?? 0;
  const previousLiquidity = oldSnap?.liquidity ?? 0;
  const currentVolume = currentSnap.volume_24h ?? 0;
  const previousVolume = oldSnap?.volume_24h ?? 0;
  // Calculate sub-scores
  const holderSub = calcHolderSub(currentHolders, holdersWeekAgo);
  const liquiditySub = calcLiquiditySub(currentLiquidity, previousLiquidity);
  const volumeSub = calcVolumeSub(currentVolume, previousVolume);

  // Use 0 instead of 50 for missing social sub-scores
  const devSub = social
    ? calcDevSub(social.github_commits_7d ?? 0)
    : 0;
  const cashtagMentions = cashtagData?.[0]?.tweet_count ?? 0;
  const socialSub = social
    ? calcSocialSub(social.x_followers ?? 0, social.x_engagement_rate ?? 0, cashtagMentions)
    : (cashtagMentions > 0 ? calcSocialSub(0, 0, cashtagMentions) : 0);

  // Weighted composite score
  // Social 35% | Volume 25% | Holders 20% | Liquidity 15% | GitHub 5%
  const score = Math.round(
    socialSub * 0.35 +
      volumeSub * 0.25 +
      holderSub * 0.2 +
      liquiditySub * 0.15 +
      devSub * 0.05
  );

  // Insert health score
  const { error } = await supabase.from("health_scores").insert({
    project_id: projectId,
    score,
    holder_sub: holderSub,
    dev_sub: devSub,
    liquidity_sub: liquiditySub,
    social_sub: socialSub,
    volume_sub: volumeSub,
  });

  if (error) {
    console.error(`Health score insert failed for ${projectId}:`, error);
    throw error;
  }

}

// ---------------------------------------------------------------------------
// Batch runner
// ---------------------------------------------------------------------------

export async function runHealthScorePipeline(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = getSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id")
    .eq("is_approved", true);

  if (error) {
    console.error("Failed to fetch projects for health scores:", error);
    throw error;
  }

  if (!projects || projects.length === 0) {
      return { processed: 0, errors: 0 };
  }


  let processed = 0;
  let errors = 0;

  for (const project of projects) {
    try {
      await calculateHealthScore(project.id);
      processed++;
    } catch (err) {
      console.error(`Health score error for ${project.id}:`, err);
      errors++;
    }
  }

  return { processed, errors };
}

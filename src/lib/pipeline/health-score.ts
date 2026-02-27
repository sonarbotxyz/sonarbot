/**
 * Health Score Calculator
 *
 * Computes a composite health score (0-100) for a project based on:
 *   - holder_sub  (30%): 7-day holder growth
 *   - dev_sub     (25%): GitHub commit activity
 *   - liquidity_sub (20%): Liquidity stability
 *   - social_sub  (15%): X engagement rate
 *   - volume_sub  (10%): 24h volume trend
 */

import { getSupabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Sub-score calculators
// ---------------------------------------------------------------------------

/** Holder growth sub-score (0-100). >10% 7d growth = 100, 0% = 50. */
function calcHolderSub(currentHolders: number, holdersWeekAgo: number): number {
  if (holdersWeekAgo <= 0) return 50; // No baseline data
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
  if (previousLiquidity <= 0) return 50; // No baseline
  const changePct =
    ((currentLiquidity - previousLiquidity) / previousLiquidity) * 100;
  if (changePct >= 0) return 100; // Stable or growing
  if (changePct <= -20) return 0; // >20% drop
  // Linear: -20% → 0, 0% → 100
  return Math.round(((changePct + 20) / 20) * 100);
}

/** Social engagement sub-score (0-100). Baseline engagement rate ~2%. */
function calcSocialSub(engagementRate: number): number {
  const baseline = 2.0; // 2% is average engagement
  if (engagementRate >= baseline * 2) return 100; // 4%+ is excellent
  if (engagementRate <= 0) return 0;
  return Math.round(Math.min((engagementRate / (baseline * 2)) * 100, 100));
}

/** Volume trend sub-score (0-100). Compares current vs previous snapshot. */
function calcVolumeSub(
  currentVolume: number,
  previousVolume: number
): number {
  if (previousVolume <= 0) return 50; // No baseline
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
    .select("x_engagement_rate, github_commits_7d")
    .eq("project_id", projectId)
    .order("timestamp", { ascending: false })
    .limit(1);

  // Extract values with safe defaults
  const currentSnap = snapshots?.[0];
  const oldSnap = weekAgoSnapshots?.[0];
  const social = socialData?.[0];

  const currentHolders = currentSnap?.holders ?? 0;
  const holdersWeekAgo = oldSnap?.holders ?? 0;
  const currentLiquidity = currentSnap?.liquidity ?? 0;
  const previousLiquidity = oldSnap?.liquidity ?? 0;
  const currentVolume = currentSnap?.volume_24h ?? 0;
  const previousVolume = oldSnap?.volume_24h ?? 0;
  // Calculate sub-scores
  const holderSub = calcHolderSub(currentHolders, holdersWeekAgo);
  const liquiditySub = calcLiquiditySub(currentLiquidity, previousLiquidity);
  const volumeSub = calcVolumeSub(currentVolume, previousVolume);

  // Social-derived sub-scores: default to 50 (neutral) if no social data exists
  const devSub = social
    ? calcDevSub(social.github_commits_7d ?? 0)
    : 50;
  const socialSub = social
    ? calcSocialSub(social.x_engagement_rate ?? 0)
    : 50;

  // Weighted composite score
  const score = Math.round(
    holderSub * 0.3 +
      devSub * 0.25 +
      liquiditySub * 0.2 +
      socialSub * 0.15 +
      volumeSub * 0.1
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

  console.log(
    `Health score for ${projectId}: ${score} (h=${holderSub} d=${devSub} l=${liquiditySub} s=${socialSub} v=${volumeSub})`
  );
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
    console.log("No projects found for health score calculation.");
    return { processed: 0, errors: 0 };
  }

  console.log(
    `Calculating health scores for ${projects.length} projects...`
  );

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

  console.log(
    `Health scores complete: ${processed} processed, ${errors} errors`
  );
  return { processed, errors };
}

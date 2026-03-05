import { NextRequest, NextResponse } from "next/server";
import { runOnchainPipeline } from "@/lib/pipeline/onchain";
import { runSocialPipeline } from "@/lib/pipeline/social";
import { runHealthScorePipeline } from "@/lib/pipeline/health-score";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Force-refresh all pipelines manually.
 * GET /api/cron/force-refresh?secret=YOUR_CRON_SECRET
 *
 * Runs: onchain → social → health scores (in sequence).
 * Use this to see updated data immediately after deploy.
 */
export async function GET(request: NextRequest) {
  // Auth check — use CRON_SECRET
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const startTime = Date.now();

  // 1. On-chain data (DexScreener + Etherscan holders)
  try {
    const onchain = await runOnchainPipeline();
    results.onchain = { status: "ok", ...onchain };
  } catch (error) {
    results.onchain = { status: "error", message: String(error) };
  }

  // 2. Social data (X followers/engagement + GitHub)
  try {
    const social = await runSocialPipeline();
    results.social = { status: "ok", ...social };
  } catch (error) {
    results.social = { status: "error", message: String(error) };
  }

  // 3. Health scores (recalculate from fresh data)
  try {
    const health = await runHealthScorePipeline();
    results.health = { status: "ok", ...health };
  } catch (error) {
    results.health = { status: "error", message: String(error) };
  }

  const elapsed = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    elapsed: `${(elapsed / 1000).toFixed(1)}s`,
    results,
  });
}

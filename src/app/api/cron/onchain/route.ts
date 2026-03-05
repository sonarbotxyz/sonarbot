import { NextRequest, NextResponse } from "next/server";
import { runOnchainPipeline } from "@/lib/pipeline/onchain";
import { detectMetricsSignals } from "@/lib/pipeline/metrics-signals";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for processing multiple projects

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 1: Fetch fresh on-chain data and store snapshots
    const result = await runOnchainPipeline();

    // Step 2: Compare snapshots and detect metric milestones
    const metrics = await detectMetricsSignals();

    return NextResponse.json({
      success: true,
      ...result,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("On-chain cron error:", error);
    return NextResponse.json(
      { error: "Pipeline execution failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runHealthScorePipeline } from "@/lib/pipeline/health-score";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runHealthScorePipeline();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health score cron error:", error);
    return NextResponse.json(
      { error: "Health score pipeline failed" },
      { status: 500 }
    );
  }
}

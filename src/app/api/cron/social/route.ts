import { NextRequest, NextResponse } from "next/server";
import { runSocialPipeline } from "@/lib/pipeline/social";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for processing multiple projects

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runSocialPipeline();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Social cron error:", error);
    return NextResponse.json(
      { error: "Social pipeline execution failed" },
      { status: 500 }
    );
  }
}

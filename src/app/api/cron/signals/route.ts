import { NextRequest, NextResponse } from "next/server";
import { runXSignalPipeline } from "@/lib/pipeline/signals-x";
import { runGitHubSignalPipeline } from "@/lib/pipeline/signals-github";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [xResult, githubResult] = await Promise.allSettled([
      runXSignalPipeline(),
      runGitHubSignalPipeline(),
    ]);

    const summary = {
      success: true,
      x:
        xResult.status === "fulfilled"
          ? {
              totalSignals: xResult.value.totalSignals,
              projects: xResult.value.results.length,
            }
          : { error: xResult.reason?.message ?? "X pipeline failed" },
      github:
        githubResult.status === "fulfilled"
          ? {
              totalSignals: githubResult.value.totalSignals,
              projects: githubResult.value.results.length,
            }
          : {
              error:
                githubResult.reason?.message ?? "GitHub pipeline failed",
            },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Signals cron error:", error);
    return NextResponse.json(
      { error: "Signal pipeline execution failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runXSignalPipeline } from "@/lib/pipeline/signals-x";
import { runGitHubSignalPipeline } from "@/lib/pipeline/signals-github";
import { notifyWatchers } from "@/lib/pipeline/notify";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Record timestamp before pipelines run to find new signals after
    const beforeRun = new Date().toISOString();

    const [xResult, githubResult] = await Promise.allSettled([
      runXSignalPipeline(),
      runGitHubSignalPipeline(),
    ]);

    // Notify watchers of newly created signals
    try {
      const supabase = getSupabase();
      const { data: newSignals } = await supabase
        .from("signals")
        .select("id, project_id, type, title, description")
        .gte("created_at", beforeRun);

      if (newSignals && newSignals.length > 0) {
        await notifyWatchers(newSignals);
      }
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

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

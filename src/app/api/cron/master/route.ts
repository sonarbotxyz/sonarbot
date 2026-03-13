import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Dispatcher is lightweight — just fires sub-crons

// ---------------------------------------------------------------------------
// Master Cron — Dispatcher
//
// Fires all sub-cron endpoints as parallel fetch calls. Each sub-cron runs
// in its own serverless function with its own 300s budget. Master just
// collects results and reports.
// ---------------------------------------------------------------------------

const SUB_CRONS = [
  { name: "onchain", path: "/api/cron/onchain" },
  { name: "social", path: "/api/cron/social" },
  { name: "cashtag", path: "/api/cron/cashtag" },
  { name: "signals", path: "/api/cron/signals" },
] as const;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  // Resolve base URL from the incoming request
  const baseUrl = new URL(request.url).origin;
  const secret = process.env.CRON_SECRET!;

  // Fire all sub-crons in parallel — each gets its own serverless invocation
  const results = await Promise.allSettled(
    SUB_CRONS.map(async (cron) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 290_000); // 290s safety

      try {
        const res = await fetch(`${baseUrl}${cron.path}`, {
          headers: { Authorization: `Bearer ${secret}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();
        return { name: cron.name, status: res.status, data };
      } catch (err) {
        clearTimeout(timeout);
        return {
          name: cron.name,
          status: 500,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    })
  );

  // Collect summary
  const summary: Record<string, unknown> = {};
  for (let i = 0; i < SUB_CRONS.length; i++) {
    const result = results[i];
    const name = SUB_CRONS[i].name;
    if (result.status === "fulfilled") {
      summary[name] = result.value;
    } else {
      summary[name] = { error: result.reason?.message ?? "Failed" };
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  return NextResponse.json({
    success: true,
    dispatcher: true,
    ...summary,
    duration: `${duration}s`,
    timestamp: new Date().toISOString(),
  });
}

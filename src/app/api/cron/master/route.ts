import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Dispatcher returns immediately

// ---------------------------------------------------------------------------
// Master Cron — Fire-and-Forget Dispatcher
//
// Uses Next.js `after()` to fire sub-cron endpoints in the background.
// Returns instantly so the cron never times out. Each sub-cron runs
// in its own serverless function with its own 300s budget.
// ---------------------------------------------------------------------------

const SUB_CRONS = [
  { name: "onchain", path: "/api/cron/onchain" },
  { name: "cashtag", path: "/api/cron/cashtag" },
  { name: "signals", path: "/api/cron/signals" },
] as const;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = new URL(request.url).origin;
  const secret = process.env.CRON_SECRET!;

  // Fire all sub-crons in the background after response is sent
  after(async () => {
    const fires = SUB_CRONS.map(async (cron) => {
      try {
        const res = await fetch(`${baseUrl}${cron.path}`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        const data = await res.json();
        console.log(`[Master] ${cron.name}: ${res.status}`, JSON.stringify(data).slice(0, 200));
      } catch (err) {
        console.error(`[Master] ${cron.name} failed:`, err);
      }
    });

    await Promise.allSettled(fires);
    console.log("[Master] All sub-crons dispatched");
  });

  return NextResponse.json({
    success: true,
    dispatcher: true,
    fired: SUB_CRONS.map((c) => c.name),
    timestamp: new Date().toISOString(),
  });
}

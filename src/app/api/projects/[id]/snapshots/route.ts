import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isValidUUID, clampInt } from "@/lib/validate";

const VALID_METRICS = [
  "holders",
  "marketcap",
  "volume_24h",
  "liquidity",
  "active_users",
  "tx_count",
];

const VALID_PERIODS = ["24h", "7d", "30d", "90d"];

const PERIOD_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
  "90d": 2160,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") || "holders";
    const period = searchParams.get("period") || "7d";
    const limit = clampInt(searchParams.get("limit"), 100, 1, 1000);

    if (!VALID_METRICS.includes(metric)) {
      return NextResponse.json(
        {
          error: `Invalid metric. Must be one of: ${VALID_METRICS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        {
          error: `Invalid period. Must be one of: ${VALID_PERIODS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Calculate time boundary
    const hoursAgo = PERIOD_HOURS[period];
    const since = new Date(
      Date.now() - hoursAgo * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("snapshots")
      .select("timestamp, holders, marketcap, volume_24h, liquidity, active_users, tx_count")
      .eq("project_id", id)
      .gte("timestamp", since)
      .order("timestamp", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Snapshot query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch snapshots" },
        { status: 500 }
      );
    }

    type SnapshotRow = NonNullable<typeof data>[number];
    const points = (data || []).map((row: SnapshotRow) => ({
      timestamp: row.timestamp,
      value: row[metric as keyof SnapshotRow],
    }));

    return NextResponse.json({
      project_id: id,
      metric,
      period,
      points,
      count: points.length,
    });
  } catch (error) {
    console.error("Snapshots API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

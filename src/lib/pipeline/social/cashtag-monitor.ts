/**
 * Cashtag Mention Monitor
 *
 * Tracks $CASHTAG mention volume on X using the tweet counts API.
 * Detects spikes by comparing current 24h count vs previous snapshot.
 * Inserts signals and notifies watchers on significant increases.
 */

import { getSupabase } from "@/lib/supabase";
import { notifyEnriched } from "@/lib/pipeline/notify";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TweetCountBucket {
  start: string;
  end: string;
  tweet_count: number;
}

interface TweetCountsResponse {
  data?: TweetCountBucket[];
  meta?: {
    total_tweet_count: number;
  };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const X_API_BASE = "https://api.x.com/2";

function getXBearerToken(): string {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error("X_BEARER_TOKEN environment variable is not set");
  }
  return token;
}

async function fetchCashtagCounts(cashtag: string): Promise<{
  totalCount: number;
  periodStart: string;
  periodEnd: string;
}> {
  const query = encodeURIComponent(`$${cashtag}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(
    `${X_API_BASE}/tweets/counts/recent?query=${query}&granularity=hour`,
    {
      headers: { Authorization: `Bearer ${getXBearerToken()}` },
      signal: controller.signal,
    }
  );
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API error ${res.status}: ${body}`);
  }

  const data: TweetCountsResponse = await res.json();
  const buckets = data.data ?? [];

  if (buckets.length === 0) {
    return { totalCount: 0, periodStart: new Date().toISOString(), periodEnd: new Date().toISOString() };
  }

  const totalCount = buckets.reduce((sum, b) => sum + b.tweet_count, 0);
  const periodStart = buckets[0].start;
  const periodEnd = buckets[buckets.length - 1].end;

  return { totalCount, periodStart, periodEnd };
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function runCashtagPipeline(): Promise<{
  processed: number;
  errors: number;
  spikes: number;
}> {
  const supabase = getSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, cashtag, twitter_handle, github_repo")
    .eq("is_approved", true)
    .not("cashtag", "is", null);

  if (error) {
    console.error("Failed to fetch projects for cashtag pipeline:", error);
    throw error;
  }

  if (!projects || projects.length === 0) {
    return { processed: 0, errors: 0, spikes: 0 };
  }

  let processed = 0;
  let errors = 0;
  let spikes = 0;

  for (const project of projects) {
    try {
      const { totalCount, periodStart, periodEnd } = await fetchCashtagCounts(
        project.cashtag
      );

      // Store snapshot
      const { error: insertErr } = await supabase
        .from("cashtag_snapshots")
        .insert({
          project_id: project.id,
          cashtag: project.cashtag,
          tweet_count: totalCount,
          period_start: periodStart,
          period_end: periodEnd,
        });

      if (insertErr) {
        console.error(
          `Cashtag snapshot insert failed for ${project.name}:`,
          insertErr
        );
        errors++;
        continue;
      }

      // Get previous snapshot for comparison
      const { data: prevSnapshots } = await supabase
        .from("cashtag_snapshots")
        .select("tweet_count")
        .eq("project_id", project.id)
        .order("snapshot_at", { ascending: false })
        .limit(2);

      // Need at least 2 snapshots (current + previous) to compare
      if (!prevSnapshots || prevSnapshots.length < 2) {
        processed++;
        continue;
      }

      const previousCount = prevSnapshots[1].tweet_count;
      if (previousCount <= 0 || totalCount <= previousCount) {
        processed++;
        continue;
      }

      const multiplier = totalCount / previousCount;

      // Spike detection: 2x = medium, 3x+ = high
      if (multiplier < 2) {
        processed++;
        continue;
      }

      const confidence = multiplier >= 3 ? "high" : "medium";
      const pctIncrease = Math.round((multiplier - 1) * 100);
      const title = `$${project.cashtag} mentions up ${pctIncrease}% in last 24h`;
      const description = `$${project.cashtag} tweet volume surged from ${previousCount} to ${totalCount} mentions (${multiplier.toFixed(1)}x increase).`;

      // Dedup: check signals for same project + source + same day
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("signals")
        .select("id")
        .eq("project_id", project.id)
        .eq("source", "x_cashtag")
        .gte("detected_at", `${today}T00:00:00Z`)
        .limit(1);

      if (existing && existing.length > 0) {
        processed++;
        continue;
      }

      const { data: inserted } = await supabase
        .from("signals")
        .insert({
          project_id: project.id,
          type: "metrics_milestones",
          title,
          description,
          source: "x_cashtag",
          source_url: null,
          metric_name: "cashtag_mentions",
          metric_value: totalCount,
          metric_previous: previousCount,
          confidence,
          is_published: true,
        })
        .select("id, project_id, type, title, description")
        .single();

      if (inserted) {
        spikes++;
        await notifyEnriched(
          inserted,
          project.name,
          project.twitter_handle || "",
          project.github_repo || ""
        );
      }

      processed++;
    } catch (err) {
      console.error(`Cashtag pipeline error for ${project.name}:`, err);
      errors++;
    }

    // Rate limit delay between projects
    if (projects.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return { processed, errors, spikes };
}

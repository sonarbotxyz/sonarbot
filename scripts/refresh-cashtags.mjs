/**
 * Standalone script to refresh cashtag mentions for all projects.
 * Fetches tweet counts from X API and inserts snapshots into Supabase.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const X_BEARER = process.env.X_BEARER_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchCashtagCounts(cashtag) {
  const query = encodeURIComponent(`$${cashtag}`);
  const res = await fetch(
    `https://api.x.com/2/tweets/counts/recent?query=${query}&granularity=hour`,
    {
      headers: { Authorization: `Bearer ${X_BEARER}` },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API ${res.status}: ${body}`);
  }

  const data = await res.json();
  const buckets = data.data ?? [];

  if (buckets.length === 0) {
    return { totalCount: 0, periodStart: new Date().toISOString(), periodEnd: new Date().toISOString() };
  }

  const totalCount = buckets.reduce((sum, b) => sum + b.tweet_count, 0);
  return {
    totalCount,
    periodStart: buckets[0].start,
    periodEnd: buckets[buckets.length - 1].end,
  };
}

async function main() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, cashtag")
    .eq("is_approved", true)
    .not("cashtag", "is", null);

  if (error) {
    console.error("Failed to fetch projects:", error);
    process.exit(1);
  }

  console.log(`Found ${projects.length} projects with cashtags\n`);

  let success = 0;
  let errors = 0;

  for (const p of projects) {
    try {
      const { totalCount, periodStart, periodEnd } = await fetchCashtagCounts(p.cashtag);

      const { error: insertErr } = await supabase
        .from("cashtag_snapshots")
        .insert({
          project_id: p.id,
          cashtag: p.cashtag,
          tweet_count: totalCount,
          period_start: periodStart,
          period_end: periodEnd,
        });

      if (insertErr) {
        console.error(`  ❌ ${p.name} ($${p.cashtag}): insert failed — ${insertErr.message}`);
        errors++;
      } else {
        console.log(`  ✅ ${p.name} ($${p.cashtag}): ${totalCount} mentions`);
        success++;
      }

      // Rate limit: 500ms between requests
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ❌ ${p.name} ($${p.cashtag}): ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${success} updated, ${errors} errors`);
}

main();

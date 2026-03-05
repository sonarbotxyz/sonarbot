/**
 * Metrics milestone detection.
 * Compares current snapshot with previous to detect threshold crossings and spikes.
 */

import { getSupabase } from "@/lib/supabase";
import { notifyWatchers } from "@/lib/pipeline/notify";

// Thresholds that trigger signals
const HOLDER_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
const MCAP_MILESTONES = [100000, 500000, 1000000, 5000000, 10000000, 25000000, 50000000, 100000000, 500000000];
const LIQUIDITY_MILESTONES = [100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];
const VOLUME_SPIKE_MULTIPLIER = 3; // 3x previous day = spike

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function crossedMilestone(prev: number, current: number, milestones: number[]): number | null {
  for (const m of milestones) {
    if (prev < m && current >= m) return m;
  }
  return null;
}

interface Snapshot {
  holders: number;
  marketcap: number;
  volume_24h: number;
  liquidity: number;
  timestamp?: string;
}

export async function detectMetricsSignals(): Promise<{ signals: number }> {
  const supabase = getSupabase();

  // Get all approved projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, contract_address")
    .not("contract_address", "is", null)
    .eq("is_approved", true);

  if (!projects?.length) return { signals: 0 };

  let totalSignals = 0;

  for (const project of projects) {
    try {
      // Get 2 most recent snapshots
      const { data: snapshots } = await supabase
        .from("snapshots")
        .select("holders, marketcap, volume_24h, liquidity, timestamp")
        .eq("project_id", project.id)
        .order("timestamp", { ascending: false })
        .limit(2);

      if (!snapshots || snapshots.length < 2) continue;

      const current: Snapshot = snapshots[0];
      const previous: Snapshot = snapshots[1];

      const signals: Array<{
        type: string;
        title: string;
        description: string;
        metric_name: string;
        metric_value: number;
        metric_previous: number;
      }> = [];

      // Check holder milestones
      const holderMilestone = crossedMilestone(previous.holders, current.holders, HOLDER_MILESTONES);
      if (holderMilestone) {
        signals.push({
          type: "metrics_milestones",
          title: `${formatNumber(holderMilestone)} holders reached`,
          description: `${project.name} crossed ${formatNumber(holderMilestone)} holders (was ${formatNumber(previous.holders)}).`,
          metric_name: "holders",
          metric_value: current.holders,
          metric_previous: previous.holders,
        });
      }

      // Check market cap milestones
      const mcapMilestone = crossedMilestone(previous.marketcap, current.marketcap, MCAP_MILESTONES);
      if (mcapMilestone) {
        signals.push({
          type: "metrics_milestones",
          title: `$${formatNumber(mcapMilestone)} market cap reached`,
          description: `${project.name} market cap crossed $${formatNumber(mcapMilestone)} (was $${formatNumber(previous.marketcap)}).`,
          metric_name: "marketcap",
          metric_value: current.marketcap,
          metric_previous: previous.marketcap,
        });
      }

      // Check liquidity milestones
      const liqMilestone = crossedMilestone(previous.liquidity, current.liquidity, LIQUIDITY_MILESTONES);
      if (liqMilestone) {
        signals.push({
          type: "metrics_milestones",
          title: `$${formatNumber(liqMilestone)} liquidity reached`,
          description: `${project.name} liquidity crossed $${formatNumber(liqMilestone)} (was $${formatNumber(previous.liquidity)}).`,
          metric_name: "liquidity",
          metric_value: current.liquidity,
          metric_previous: previous.liquidity,
        });
      }

      // Check volume spike (3x previous day)
      if (previous.volume_24h > 0 && current.volume_24h >= previous.volume_24h * VOLUME_SPIKE_MULTIPLIER) {
        const multiplier = (current.volume_24h / previous.volume_24h).toFixed(1);
        signals.push({
          type: "metrics_milestones",
          title: `Volume spike: ${multiplier}x increase`,
          description: `${project.name} 24h volume surged to $${formatNumber(current.volume_24h)} (${multiplier}x from $${formatNumber(previous.volume_24h)}).`,
          metric_name: "volume_24h",
          metric_value: current.volume_24h,
          metric_previous: previous.volume_24h,
        });
      }

      // Check ATH market cap
      if (current.marketcap > 0) {
        const { data: maxSnap } = await supabase
          .from("snapshots")
          .select("marketcap")
          .eq("project_id", project.id)
          .order("marketcap", { ascending: false })
          .limit(1)
          .single();

        if (maxSnap && current.marketcap >= maxSnap.marketcap && current.marketcap > previous.marketcap * 1.05) {
          signals.push({
            type: "metrics_milestones",
            title: `All-time high market cap: $${formatNumber(current.marketcap)}`,
            description: `${project.name} reached a new ATH market cap of $${formatNumber(current.marketcap)}.`,
            metric_name: "marketcap_ath",
            metric_value: current.marketcap,
            metric_previous: previous.marketcap,
          });
        }
      }

      // Insert signals and notify
      for (const signal of signals) {
        // Dedup: check if same signal type + metric already exists today
        const today = new Date().toISOString().split("T")[0];
        const { data: existing } = await supabase
          .from("signals")
          .select("id")
          .eq("project_id", project.id)
          .eq("type", signal.type)
          .gte("detected_at", `${today}T00:00:00Z`)
          .eq("source", "onchain")
          .limit(1);

        if (existing && existing.length > 0) continue;

        const { data: inserted } = await supabase
          .from("signals")
          .insert({
            project_id: project.id,
            type: signal.type,
            title: signal.title,
            description: signal.description,
            source: "onchain",
            source_url: null,
            metric_name: signal.metric_name,
            metric_value: signal.metric_value,
            metric_previous: signal.metric_previous,
            confidence: "high",
            is_published: true,
          })
          .select("id, project_id, type, title, description")
          .single();

        if (inserted) {
          totalSignals++;
          console.log(`[Metrics] Signal: ${signal.title} for ${project.name}`);
          await notifyWatchers([inserted]);
        }
      }
    } catch (err) {
      console.error(`Metrics detection failed for ${project.name}:`, err);
    }
  }

  return { signals: totalSignals };
}

/**
 * Metrics milestone detection.
 * Compares current snapshot with previous to detect threshold crossings and spikes.
 */

import { getSupabase } from "@/lib/supabase";
import { notifyEnriched } from "@/lib/pipeline/notify";

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
  price_usd: number;
  price_change_24h: number;
  timestamp?: string;
}

function pctChange(prev: number, current: number): number {
  if (prev === 0) return 0;
  return ((current - prev) / prev) * 100;
}

export async function detectMetricsSignals(): Promise<{ signals: number }> {
  const supabase = getSupabase();

  // Get all approved projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, contract_address, twitter_handle, github_repo")
    .not("contract_address", "is", null)
    .eq("is_approved", true);

  if (!projects?.length) return { signals: 0 };

  let totalSignals = 0;

  for (const project of projects) {
    try {
      // Get 2 most recent snapshots
      const { data: snapshots } = await supabase
        .from("snapshots")
        .select("holders, marketcap, volume_24h, liquidity, price_usd, price_change_24h, timestamp")
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

      // --- Percentage-based signals ---

      // Price movement (mcap-based)
      const mcapPct = pctChange(previous.marketcap, current.marketcap);
      if (mcapPct >= 100) {
        signals.push({
          type: "metrics_milestones",
          title: `Mega pump: price up ${Math.round(mcapPct)}%`,
          description: `${project.name} market cap surged ${Math.round(mcapPct)}% from $${formatNumber(previous.marketcap)} to $${formatNumber(current.marketcap)}.`,
          metric_name: "mega_pump",
          metric_value: current.marketcap,
          metric_previous: previous.marketcap,
        });
      } else if (mcapPct >= 25) {
        signals.push({
          type: "metrics_milestones",
          title: `Price up ${Math.round(mcapPct)}%`,
          description: `${project.name} market cap increased ${Math.round(mcapPct)}% from $${formatNumber(previous.marketcap)} to $${formatNumber(current.marketcap)}.`,
          metric_name: "price_pump",
          metric_value: current.marketcap,
          metric_previous: previous.marketcap,
        });
      } else if (mcapPct <= -50) {
        signals.push({
          type: "metrics_milestones",
          title: `Mega dump: price down ${Math.round(Math.abs(mcapPct))}%`,
          description: `${project.name} market cap dropped ${Math.round(Math.abs(mcapPct))}% from $${formatNumber(previous.marketcap)} to $${formatNumber(current.marketcap)}.`,
          metric_name: "mega_dump",
          metric_value: current.marketcap,
          metric_previous: previous.marketcap,
        });
      } else if (mcapPct <= -25) {
        signals.push({
          type: "metrics_milestones",
          title: `Price down ${Math.round(Math.abs(mcapPct))}%`,
          description: `${project.name} market cap decreased ${Math.round(Math.abs(mcapPct))}% from $${formatNumber(previous.marketcap)} to $${formatNumber(current.marketcap)}.`,
          metric_name: "price_dump",
          metric_value: current.marketcap,
          metric_previous: previous.marketcap,
        });
      }

      // Volume % change (2x surge)
      const volPct = pctChange(previous.volume_24h, current.volume_24h);
      if (volPct >= 100) {
        signals.push({
          type: "metrics_milestones",
          title: `Volume up ${Math.round(volPct)}%`,
          description: `${project.name} 24h volume increased ${Math.round(volPct)}% from $${formatNumber(previous.volume_24h)} to $${formatNumber(current.volume_24h)}.`,
          metric_name: "volume_surge",
          metric_value: current.volume_24h,
          metric_previous: previous.volume_24h,
        });
      }

      // Holder growth/decline
      const holderPct = pctChange(previous.holders, current.holders);
      if (holderPct >= 10) {
        signals.push({
          type: "metrics_milestones",
          title: `Holders up ${Math.round(holderPct)}%`,
          description: `${project.name} holders grew ${Math.round(holderPct)}% from ${formatNumber(previous.holders)} to ${formatNumber(current.holders)}.`,
          metric_name: "holder_growth",
          metric_value: current.holders,
          metric_previous: previous.holders,
        });
      } else if (holderPct <= -10) {
        signals.push({
          type: "metrics_milestones",
          title: `Holders down ${Math.round(Math.abs(holderPct))}%`,
          description: `${project.name} holders declined ${Math.round(Math.abs(holderPct))}% from ${formatNumber(previous.holders)} to ${formatNumber(current.holders)}.`,
          metric_name: "holder_decline",
          metric_value: current.holders,
          metric_previous: previous.holders,
        });
      }

      // Liquidity signals
      const liqPct = pctChange(previous.liquidity, current.liquidity);
      if (liqPct >= 50) {
        signals.push({
          type: "metrics_milestones",
          title: `Liquidity up ${Math.round(liqPct)}%`,
          description: `${project.name} liquidity increased ${Math.round(liqPct)}% from $${formatNumber(previous.liquidity)} to $${formatNumber(current.liquidity)}.`,
          metric_name: "liquidity_added",
          metric_value: current.liquidity,
          metric_previous: previous.liquidity,
        });
      } else if (liqPct <= -30) {
        signals.push({
          type: "metrics_milestones",
          title: `Liquidity down ${Math.round(Math.abs(liqPct))}%`,
          description: `${project.name} liquidity dropped ${Math.round(Math.abs(liqPct))}% from $${formatNumber(previous.liquidity)} to $${formatNumber(current.liquidity)}. Potential rug warning.`,
          metric_name: "liquidity_pulled",
          metric_value: current.liquidity,
          metric_previous: previous.liquidity,
        });
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
          await notifyEnriched(
            inserted,
            project.name,
            project.twitter_handle || "",
            project.github_repo || ""
          );
        }
      }
    } catch (err) {
      console.error(`Metrics detection failed for ${project.name}:`, err);
    }
  }

  return { signals: totalSignals };
}

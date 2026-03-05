/**
 * On-chain data pipeline for Base ecosystem projects.
 *
 * Uses DexScreener API for all market data (free, no key needed).
 */

import { getSupabase } from "@/lib/supabase";
import { fetchHolderCount } from "./basescan";

// ---------------------------------------------------------------------------
// DexScreener data (marketcap, volume, liquidity in one call)
// ---------------------------------------------------------------------------

interface DexScreenerData {
  marketcap: number;
  volume24h: number;
  liquidity: number;
}

let _dexCache: Map<string, DexScreenerData> = new Map();

/**
 * Fetch market data from DexScreener API (free, no key needed).
 * Caches per pipeline run to avoid duplicate calls.
 */
export async function fetchDexScreenerData(
  contractAddress: string
): Promise<DexScreenerData> {
  const cached = _dexCache.get(contractAddress.toLowerCase());
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`DexScreener HTTP ${res.status}`);

    const json = await res.json();
    // Pick the highest-liquidity pair on Base
    const basePairs = (json.pairs || []).filter(
      (p: { chainId: string }) => p.chainId === "base"
    );
    basePairs.sort(
      (a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    );

    const pair = basePairs[0];
    const result: DexScreenerData = {
      marketcap: pair?.marketCap || pair?.fdv || 0,
      volume24h: pair?.volume?.h24 || 0,
      liquidity: pair?.liquidity?.usd || 0,
    };

    _dexCache.set(contractAddress.toLowerCase(), result);
    return result;
  } catch (error) {
    console.error(`DexScreener failed for ${contractAddress}:`, error);
    return { marketcap: 0, volume24h: 0, liquidity: 0 };
  }
}

/** Clear DexScreener cache between pipeline runs */
export function clearDexCache() {
  _dexCache = new Map();
}

/**
 * Fetch marketcap via DexScreener.
 */
export async function fetchMarketcap(
  contractAddress: string
): Promise<number> {
  const data = await fetchDexScreenerData(contractAddress);
  return Math.round(data.marketcap);
}

/**
 * Fetch 24h trading volume via DexScreener.
 */
export async function fetchVolume24h(
  contractAddress: string
): Promise<number> {
  const data = await fetchDexScreenerData(contractAddress);
  return Math.round(data.volume24h);
}

/**
 * Fetch total liquidity via DexScreener.
 */
export async function fetchLiquidity(
  contractAddress: string
): Promise<number> {
  const data = await fetchDexScreenerData(contractAddress);
  return Math.round(data.liquidity);
}

// ---------------------------------------------------------------------------
// Snapshot orchestrator
// ---------------------------------------------------------------------------

/**
 * Take a full on-chain snapshot for a project.
 * Runs DexScreener fetch (cached per contract) and inserts into the snapshots table.
 */
export async function takeSnapshot(
  projectId: string,
  contractAddress: string
): Promise<void> {
  const supabase = getSupabase();

  // Get previous holder count as fallback
  const { data: prevSnap } = await supabase
    .from("snapshots")
    .select("holders")
    .eq("project_id", projectId)
    .gt("holders", 0)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  // DexScreener + holder count (with fallback to previous value)
  const [marketcap, volume24h, liquidity, holders] =
    await Promise.all([
      fetchMarketcap(contractAddress),
      fetchVolume24h(contractAddress),
      fetchLiquidity(contractAddress),
      fetchHolderCount(contractAddress, prevSnap?.holders ?? 0),
    ]);

  const { error } = await supabase.from("snapshots").insert({
    project_id: projectId,
    holders,
    marketcap,
    volume_24h: volume24h,
    liquidity,
    active_users: 0,
    tx_count: 0,
  });

  if (error) {
    console.error(`Snapshot insert failed for ${projectId}:`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Batch runner — processes all projects with a contract_address
// ---------------------------------------------------------------------------

export async function runOnchainPipeline(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = getSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, contract_address")
    .not("contract_address", "is", null)
    .eq("is_approved", true);

  if (error) {
    console.error("Failed to fetch projects for pipeline:", error);
    throw error;
  }

  if (!projects || projects.length === 0) {
    return { processed: 0, errors: 0 };
  }

  clearDexCache();

  let processed = 0;
  let errors = 0;

  for (const project of projects) {
    try {
      await takeSnapshot(project.id, project.contract_address);
      processed++;
    } catch (err) {
      console.error(`Pipeline error for ${project.id}:`, err);
      errors++;
    }
  }

  return { processed, errors };
}

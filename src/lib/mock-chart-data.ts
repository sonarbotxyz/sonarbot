/**
 * Mock data generators for Sprint 2 analytics UI.
 * Shapes match the real Supabase schema from Sprint 1.
 */

export interface Snapshot {
  timestamp: string;
  holders: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
}

export interface HealthScore {
  overall: number;
  breakdown: {
    holders: number;
    devActivity: number;
    liquidity: number;
    social: number;
    volume: number;
  };
  weights: {
    holders: number;
    devActivity: number;
    liquidity: number;
    social: number;
    volume: number;
  };
}

export interface WhaleWallet {
  rank: number;
  address: string;
  balance: number;
  percentSupply: number;
  lastActivity: string;
  type: "buy" | "sell";
}

export interface SocialData {
  xFollowers: number;
  xFollowersChange: number;
  engagementRate: number;
  githubCommits30d: number;
  githubStars: number;
  farcasterFollowers: number;
  farcasterEngagement: number;
}

/** Seed-based pseudo-random for consistent mock data per project */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Generate realistic time-series snapshots */
export function generateMockSnapshots(projectId: string, days: number = 30): Snapshot[] {
  const rand = seededRandom(hashString(projectId));
  const now = new Date();
  const snapshots: Snapshot[] = [];

  // Base values that vary by project
  let holders = 1000 + Math.floor(rand() * 50000);
  let marketCap = 500000 + Math.floor(rand() * 50000000);
  let volume24h = 50000 + Math.floor(rand() * 5000000);
  let liquidity = 200000 + Math.floor(rand() * 10000000);

  // Trend direction (most projects trend up slightly)
  const holderTrend = 0.001 + rand() * 0.005;
  const mcTrend = -0.002 + rand() * 0.008;
  const volTrend = -0.003 + rand() * 0.01;
  const liqTrend = 0.0005 + rand() * 0.004;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Apply trend + daily noise
    const dayNoise = () => 0.95 + rand() * 0.1;
    holders = Math.max(100, Math.floor(holders * (1 + holderTrend) * dayNoise()));
    marketCap = Math.max(10000, Math.floor(marketCap * (1 + mcTrend) * dayNoise()));
    volume24h = Math.max(1000, Math.floor(volume24h * (1 + volTrend) * dayNoise()));
    liquidity = Math.max(10000, Math.floor(liquidity * (1 + liqTrend) * dayNoise()));

    snapshots.push({
      timestamp: date.toISOString().split("T")[0],
      holders,
      marketCap,
      volume24h,
      liquidity,
    });
  }

  return snapshots;
}

/** Generate a health score with sub-scores */
export function generateMockHealthScore(projectId: string): HealthScore {
  const rand = seededRandom(hashString(projectId + "_health"));

  const holders = 30 + Math.floor(rand() * 70);
  const devActivity = 20 + Math.floor(rand() * 75);
  const liquidity = 25 + Math.floor(rand() * 70);
  const social = 15 + Math.floor(rand() * 80);
  const volume = 20 + Math.floor(rand() * 75);

  const weights = {
    holders: 0.3,
    devActivity: 0.25,
    liquidity: 0.2,
    social: 0.15,
    volume: 0.1,
  };

  const overall = Math.round(
    holders * weights.holders +
    devActivity * weights.devActivity +
    liquidity * weights.liquidity +
    social * weights.social +
    volume * weights.volume
  );

  return {
    overall,
    breakdown: { holders, devActivity, liquidity, social, volume },
    weights,
  };
}

/** Generate whale wallet data */
export function generateMockWhales(projectId: string): WhaleWallet[] {
  const rand = seededRandom(hashString(projectId + "_whales"));
  const whales: WhaleWallet[] = [];
  const now = new Date();

  let remainingSupply = 45 + rand() * 20; // Top wallets hold 45-65%

  for (let i = 0; i < 10; i++) {
    const pct = i === 0
      ? 5 + rand() * 15
      : Math.max(0.5, remainingSupply * (0.15 + rand() * 0.3));
    remainingSupply -= pct;
    if (remainingSupply < 0) remainingSupply = 0;

    const daysAgo = Math.floor(rand() * 14);
    const activityDate = new Date(now);
    activityDate.setDate(activityDate.getDate() - daysAgo);

    // Generate a realistic hex address
    const hexChars = "0123456789abcdef";
    let addr = "0x";
    for (let j = 0; j < 40; j++) {
      addr += hexChars[Math.floor(rand() * 16)];
    }

    whales.push({
      rank: i + 1,
      address: addr,
      balance: Math.floor(1000000 * pct / 100 * (500000 + rand() * 10000000)),
      percentSupply: Math.round(pct * 100) / 100,
      lastActivity: activityDate.toISOString(),
      type: rand() > 0.4 ? "buy" : "sell",
    });
  }

  return whales;
}

/** Generate social analytics data */
export function generateMockSocialData(projectId: string): SocialData {
  const rand = seededRandom(hashString(projectId + "_social"));

  return {
    xFollowers: 5000 + Math.floor(rand() * 200000),
    xFollowersChange: -5 + rand() * 25,
    engagementRate: 0.5 + rand() * 8,
    githubCommits30d: Math.floor(rand() * 300),
    githubStars: Math.floor(rand() * 5000),
    farcasterFollowers: 500 + Math.floor(rand() * 50000),
    farcasterEngagement: 0.3 + rand() * 6,
  };
}

/** Helper to compute trend percentage from snapshots */
export function computeTrend(snapshots: Snapshot[], key: keyof Omit<Snapshot, "timestamp">, days: number = 7): number {
  if (snapshots.length < 2) return 0;
  const recent = snapshots.slice(-days);
  if (recent.length < 2) return 0;
  const first = recent[0][key] as number;
  const last = recent[recent.length - 1][key] as number;
  if (first === 0) return 0;
  return Math.round(((last - first) / first) * 1000) / 10;
}

/**
 * API response types (snake_case from Supabase) and frontend mapping utilities.
 * These types mirror the real database schema.
 */

/* ─── Raw API types (Supabase snake_case) ─── */

export interface ApiHealthData {
  score: number;
  holder_sub: number;
  dev_sub: number;
  liquidity_sub: number;
  social_sub: number;
  volume_sub: number;
  timestamp?: string;
}

export interface ApiSnapshot {
  project_id?: string;
  timestamp: string;
  holders: number;
  marketcap: number;
  volume_24h: number;
  liquidity: number;
  active_users?: number;
  tx_count?: number;
}

export interface ApiWhaleWallet {
  address: string;
  balance: number;
  pct_supply: number;
  last_tx_at: string;
  last_tx_type: string;
}

export interface ApiSocialData {
  x_followers: number;
  x_engagement_rate: number;
  github_commits_7d: number;
  github_last_push: string;
  farcaster_followers: number;
}

/* ─── Mapped frontend types (camelCase) ─── */

export interface Snapshot {
  timestamp: string;
  holders: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
}

export interface HealthScoreData {
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

/* ─── Mapping functions ─── */

export function mapApiSnapshot(raw: ApiSnapshot): Snapshot {
  return {
    timestamp: raw.timestamp,
    holders: raw.holders ?? 0,
    marketCap: raw.marketcap ?? 0,
    volume24h: raw.volume_24h ?? 0,
    liquidity: raw.liquidity ?? 0,
  };
}

export function mapApiHealth(raw: ApiHealthData): HealthScoreData {
  return {
    overall: raw.score,
    breakdown: {
      holders: raw.holder_sub,
      devActivity: raw.dev_sub,
      liquidity: raw.liquidity_sub,
      social: raw.social_sub,
      volume: raw.volume_sub,
    },
    weights: {
      holders: 0.3,
      devActivity: 0.25,
      liquidity: 0.2,
      social: 0.15,
      volume: 0.1,
    },
  };
}

export function mapApiWhale(raw: ApiWhaleWallet, index: number): WhaleWallet {
  return {
    rank: index + 1,
    address: raw.address,
    balance: raw.balance,
    percentSupply: raw.pct_supply,
    lastActivity: raw.last_tx_at,
    type: raw.last_tx_type === "sell" ? "sell" : "buy",
  };
}

export function mapApiSocial(raw: ApiSocialData): SocialData {
  return {
    xFollowers: raw.x_followers ?? 0,
    xFollowersChange: 0,
    engagementRate: raw.x_engagement_rate ?? 0,
    githubCommits30d: raw.github_commits_7d ?? 0,
    githubStars: 0,
    farcasterFollowers: raw.farcaster_followers ?? 0,
    farcasterEngagement: 0,
  };
}

/** Compute trend percentage from snapshots over a given period */
export function computeTrend(
  snapshots: Snapshot[],
  key: keyof Omit<Snapshot, "timestamp">,
  days: number = 7,
): number {
  if (snapshots.length < 2) return 0;
  const recent = snapshots.slice(-days);
  if (recent.length < 2) return 0;
  const first = recent[0][key] as number;
  const last = recent[recent.length - 1][key] as number;
  if (first === 0) return 0;
  return Math.round(((last - first) / first) * 1000) / 10;
}

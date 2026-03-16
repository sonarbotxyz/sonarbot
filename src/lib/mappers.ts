import type { Category, Project, Comment } from "./types";

/** Raw project row from Supabase (snake_case). */
export interface SupabaseProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  subcategory?: string;
  upvotes: number;
  watchers?: number;
  is_hot?: boolean;
  is_new?: boolean;
  is_approved?: boolean;
  website_url?: string;
  twitter_handle?: string;
  github_url?: string;
  logo_url?: string;
  submitted_by_twitter?: string;
  created_at?: string;
  launch_date?: string;
  // v2 analytics fields
  contract_address?: string;
  chain?: string;
  is_boosted?: boolean;
  boost_expires_at?: string;
  x_user_id?: string;
  github_repo?: string;
  farcaster_handle?: string;
  // Enriched fields (attached after query)
  health_score?: number | null;
  health_breakdown?: {
    holder_sub: number;
    dev_sub: number;
    liquidity_sub: number;
    social_sub: number;
    volume_sub: number;
  } | null;
  latest_snapshot?: {
    timestamp: string;
    holders: number;
    marketcap: number;
    volume_24h: number;
    liquidity: number;
  } | null;
  recent_snapshots?: Array<{
    timestamp: string;
    holders: number;
    marketcap: number;
    volume_24h: number;
    liquidity: number;
  }>;
}

/** Raw comment row from Supabase (snake_case). */
export interface SupabaseComment {
  id: string;
  project_id: string;
  twitter_handle: string;
  content: string;
  is_agent?: boolean;
  avatar_url?: string;
  created_at: string;
}

const CATEGORY_MAP: Record<string, Category> = {
  defi: "DeFi",
  social: "Social",
  nft: "NFT",
  infrastructure: "Infra",
  infra: "Infra",
  gaming: "Gaming",
  tools: "Tools",
  agents: "Tools",
  consumer: "Social",
  meme: "Meme",
  memes: "Meme",
  other: "Tools",
};

/** Map a Supabase project row to the frontend Project type. */
export function mapProject(row: SupabaseProject): Project {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description || "",
    category: CATEGORY_MAP[row.category?.toLowerCase()] || "Tools",
    subcategory: row.subcategory || row.category || "",
    upvotes: row.upvotes ?? 0,
    watchers: row.watchers ?? 0,
    isHot: row.is_hot ?? false,
    isNew: row.is_new ?? false,
    launchDate: row.launch_date,
    website: row.website_url,
    twitter: row.twitter_handle,
    logoUrl: row.logo_url || undefined,
    twitterHandle: row.twitter_handle || undefined,
    isBoosted: row.is_boosted ?? false,
    milestones: [],
    comments: [],
    healthScore: row.health_score ?? null,
    latestSnapshot: row.latest_snapshot ?? null,
    recentSnapshots: row.recent_snapshots ?? [],
  };
}

/** Map a Supabase comment row to the frontend Comment type. */
export function mapComment(row: SupabaseComment): Comment {
  return {
    id: row.id,
    author: row.twitter_handle,
    text: row.content,
    date: row.created_at,
    upvotes: 0,
  };
}

import type { Category, Project, Comment } from "./mock-data";

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
    milestones: [],
    comments: [],
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
